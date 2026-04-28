const express = require('express');
const crypto = require('crypto');
const { query } = require('../config/database');

const router = express.Router();
const generateId = () => crypto.randomBytes(4).toString('hex');
const EXAM_TYPES = ['PERIODICO', 'ADMISSAO', 'DEMISSAO', 'RETORNO', 'MUDANCA_FUNCAO'];

const dbAll = async (sql, params = []) => {
    const result = await query(sql, params);
    return result.rows || [];
};

const dbGet = async (sql, params = []) => {
    const result = await query(sql, params);
    return result.rows[0] || null;
};

const dbRun = async (sql, params = []) => {
    const result = await query(sql, params);
    return result;
};

function computeExpiryDate(examDate, periodicity) {
    const expiry = new Date(examDate);
    const months = parseInt(periodicity, 10) || 12;
    expiry.setMonth(expiry.getMonth() + months);
    return expiry.toISOString().split('T')[0];
}

router.post('/', async (req, res) => {
    try {
        const { employee_id, exam_type, exam_date, result, observation, periodicity, responsible } = req.body;

        if (!employee_id || !exam_date) return res.status(400).json({ error: 'Campos obrigatorios ausentes' });

        const id = generateId();
        const expiryDate = computeExpiryDate(exam_date, periodicity);
        const finalExamType = EXAM_TYPES.includes(exam_type) ? exam_type : 'PERIODICO';
        const finalResult = result || 'Apto';

        const sql = `INSERT INTO aso_records (id, employee_id, exam_type, exam_date, expiry_date, result, clinic, doctor_name, crm, observation)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`;

        const params = [
            id,
            employee_id,
            finalExamType,
            exam_date,
            expiryDate,
            finalResult,
            'Clinica Padrao',
            'Dr. Verificado',
            'CRM-CE',
            observation || ''
        ];

        await dbRun(sql, params);

        await dbRun(
            `INSERT INTO aso_history (employee_id, acao, detalhe, responsavel) VALUES ($1, $2, $3, $4)`,
            [employee_id, 'NOVO EXAME', `${finalExamType} (${finalResult})`, responsible || 'Admin RH']
        );
        
        res.json({ success: true, id });
    } catch (err) {
        res.status(500).json({ error: 'Falha no banco: ' + err.message });
    }
});

router.get('/records', async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 10, 1), 100);
        const offset = (page - 1) * pageSize;
        const search = (req.query.search || '').trim();
        const quickFilter = (req.query.quickFilter || 'all').toLowerCase();
        const examType = (req.query.examType || 'all').toUpperCase();
        const sort = (req.query.sort || 'exam_date_desc').toLowerCase();

        const sortMap = {
            exam_date_desc: 'a.exam_date DESC',
            exam_date_asc: 'a.exam_date ASC',
            name_asc: 'e.name ASC',
            name_desc: 'e.name DESC',
            updated_desc: 'a.rowid DESC'
        };
        const orderBy = sortMap[sort] || sortMap.exam_date_desc;

        let where = `WHERE 1=1`;
        const params = [];

        if (search) {
            where += ` AND (e.name ILIKE $${params.length + 1} OR e."registrationNumber" ILIKE $${params.length + 2} OR e.sector ILIKE $${params.length + 3} OR a.exam_type ILIKE $${params.length + 4})`;
            params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (examType !== 'ALL' && EXAM_TYPES.includes(examType)) {
            where += ` AND a.exam_type = $${params.length + 1}`;
            params.push(examType);
        }

        const today = new Date().toISOString().split('T')[0];
        
        if (quickFilter === 'today') {
            where += ` AND a.exam_date = $${params.length + 1}`;
            params.push(today);
        } else if (quickFilter === 'week') {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 6);
            where += ` AND a.exam_date >= $${params.length + 1}`;
            params.push(weekAgo.toISOString().split('T')[0]);
        } else if (quickFilter === 'month') {
            const monthStart = new Date();
            monthStart.setDate(1);
            where += ` AND a.exam_date >= $${params.length + 1}`;
            params.push(monthStart.toISOString().split('T')[0]);
        }

        const baseQuery = `
            FROM aso_records a
            LEFT JOIN employees e ON e.id = a.employee_id
            ${where}
        `;

        const listSql = `
            SELECT
                a.id,
                a.employee_id,
                e.name AS employee_name,
                e."registrationNumber" AS registration_number,
                e.sector,
                e.role,
                a.exam_type,
                a.exam_date,
                a.expiry_date,
                a.result,
                a.observation,
                a.clinic,
                a.doctor_name
            ${baseQuery}
            ORDER BY ${orderBy}
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `;

        const countSql = `SELECT COUNT(*) AS total ${baseQuery}`;

        const countRow = await dbGet(countSql, params);
        const rows = await dbAll(listSql, [...params, pageSize, offset]);

        const total = countRow?.total || 0;
        const totalPages = Math.max(Math.ceil(total / pageSize), 1);

        res.json({
            page,
            pageSize,
            total,
            totalPages,
            records: rows || []
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/record/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const sql = `
            SELECT
                a.id,
                a.employee_id,
                e.name AS employee_name,
                e."registrationNumber" AS registration_number,
                e.sector,
                e.role,
                a.exam_type,
                a.exam_date,
                a.expiry_date,
                a.result,
                a.observation,
                a.clinic,
                a.doctor_name,
                a.crm
            FROM aso_records a
            LEFT JOIN employees e ON e.id = a.employee_id
            WHERE a.id = $1
            LIMIT 1
        `;

        const row = await dbGet(sql, [id]);
        if (!row) return res.status(404).json({ error: 'Registro nao encontrado' });
        res.json(row);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/record/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { employee_id, exam_type, exam_date, result, observation, periodicity, responsible } = req.body;

        if (!employee_id || !exam_date) return res.status(400).json({ error: 'Campos obrigatorios ausentes' });

        const finalExamType = EXAM_TYPES.includes(exam_type) ? exam_type : 'PERIODICO';
        const finalResult = result || 'Apto';
        const expiryDate = computeExpiryDate(exam_date, periodicity);

        const updateSql = `
            UPDATE aso_records
            SET employee_id = $1, exam_type = $2, exam_date = $3, expiry_date = $4, result = $5, observation = $6
            WHERE id = $7
        `;

        const resultUpdate = await dbRun(updateSql, [employee_id, finalExamType, exam_date, expiryDate, finalResult, observation || '', id]);
        if (!resultUpdate.rowCount) return res.status(404).json({ error: 'Registro nao encontrado' });

        await dbRun(
            `INSERT INTOaso_history (employee_id, acao, detalhe, responsavel) VALUES ($1, $2, $3, $4)`,
            [employee_id, 'ATUALIZACAO', `${finalExamType} (${finalResult})`, responsible || 'Admin RH']
        );
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/record/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { responsible } = req.body || {};

        const row = await dbGet(`SELECT employee_id, exam_type, exam_date FROMaso_records WHERE id = $1 LIMIT 1`, [id]);
        if (!row) return res.status(404).json({ error: 'Registro nao encontrado' });

        await dbRun(`DELETE FROMaso_records WHERE id = $1`, [id]);

        await dbRun(
            `INSERT INTOaso_history (employee_id, acao, detalhe, responsavel) VALUES ($1, $2, $3, $4)`,
            [row.employee_id, 'EXCLUSAO', `${row.exam_type} (${row.exam_date})`, responsible || 'Admin RH']
        );
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/record/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { responsible } = req.body || {};

        const row = await dbGet(`SELECT employee_id, exam_type, exam_date FROMaso_records WHERE id = $1 LIMIT 1`, [id]);
        if (!row) return res.status(404).json({ error: 'Registro nao encontrado' });

        await dbRun(`DELETE FROMaso_records WHERE id = $1`, [id]);

        await dbRun(
            `INSERT INTOaso_history (employee_id, acao, detalhe, responsavel) VALUES ($1, $2, $3, $4)`,
            [row.employee_id, 'EXCLUSAO', `${row.exam_type} (${row.exam_date})`, responsible || 'Admin RH']
        );
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/summary', async (req, res) => {
    try {
        const { search } = req.query;
        const today = new Date();
        let sql = `
            WITH latest_exam AS (
                SELECT employee_id, MAX(exam_date) AS max_exam_date
                FROMaso_records
                GROUP BY employee_id
            )
            SELECT
                e.id as emp_id,
                e.name as emp_name,
                e."registrationNumber" as reg,
                e.type as emp_status,
                e.sector,
                e.role,
                e."photoUrl",
                e."admissionDate",
                a.id as aso_id,
                a.exam_type,
                a.expiry_date,
                a.exam_date,
                a.result
            FROM employees e
            LEFT JOIN latest_exam le ON e.id = le.employee_id
            LEFT JOINaso_records a ON a.employee_id = le.employee_id AND a.exam_date = le.max_exam_date
            WHERE e.type != 'Desligado'
        `;
        const params = [];
        if (search) {
            sql += ` AND (e.name ILIKE $1 OR e."registrationNumber" ILIKE $2)`;
            params.push(`%${search}%`, `%${search}%`);
        }
        sql += ` ORDER BY e.name ASC`;

        const rows = await dbAll(sql, params);
        
        const summary = { vencidos: [], alerta: [], pendentes: [], em_dia: [] };

        rows.forEach((row) => {
            if (!row.aso_id) {
                summary.pendentes.push({ ...row, status_label: 'Sem Exame', status_key: 'pendente' });
                return;
            }

            const expiry = new Date(row.expiry_date);
            const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

            if (diffDays < 0) {
                summary.vencidos.push({ ...row, delay: Math.abs(diffDays), status_label: 'Vencido', status_key: 'vencido' });
            } else if (diffDays <= 45) {
                summary.alerta.push({ ...row, countdown: diffDays, status_label: 'Alerta', status_key: 'alerta' });
            } else {
                summary.em_dia.push({ ...row, status_label: 'Regular', status_key: 'emdia' });
            }
        });

        res.json(summary);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/dossier-summary', async (req, res) => {
    try {
        const employees = await dbAll(`SELECT id, name, "registrationNumber", sector, role, "photoUrl", "admissionDate", type FROM employees ORDER BY name ASC`, []);
        const asos = await dbAll(`SELECT id, employee_id, exam_type, exam_date, expiry_date, result, observation, periodicity FROMaso_records ORDER BY exam_date DESC`, []);
        const certs = await dbAll(`SELECT id, employee_id, start_date, end_date, cid, observation FROM sst_certificates ORDER BY start_date DESC`, []);

        res.json({
            employees: employees.map(e => ({
                id: e.id,
                name: e.name,
                registrationNumber: e.registrationNumber,
                sector: e.sector,
                role: e.role,
                photoUrl: e.photoUrl,
                admissionDate: e.admissionDate,
                type: e.type
            })),
            allAsos: asos.map(a => ({
                id: a.id,
                employee_id: a.employee_id,
                exam_type: a.exam_type,
                exam_date: a.exam_date,
                expiry_date: a.expiry_date,
                result: a.result,
                observation: a.observation,
                periodicity: a.periodicity
            })),
            allCertificates: (certs || []).map(c => ({
                id: c.id,
                employee_id: c.employee_id,
                start_date: c.start_date,
                end_date: c.end_date,
                cid: c.cid,
                observation: c.observation
            }))
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/certificate', async (req, res) => {
    try {
        const { employee_id, start_date, end_date, cid, observation } = req.body;
        if (!employee_id || !start_date) return res.status(400).json({ error: 'Campos obrigatórios ausentes' });

        const id = crypto.randomBytes(4).toString('hex');
        const sql = `INSERT INTO sst_certificates (id, employee_id, start_date, end_date, cid, observation) VALUES ($1, $2, $3, $4, $5, $6)`;
        
        await dbRun(sql, [id, employee_id, start_date, end_date || null, cid || '', observation || '']);
        res.json({ success: true, id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/certificate/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { employee_id, start_date, end_date, cid, observation } = req.body;

        const sql = `UPDATE sst_certificates SET employee_id = $1, start_date = $2, end_date = $3, cid = $4, observation = $5 WHERE id = $6`;
        await dbRun(sql, [employee_id, start_date, end_date || null, cid || '', observation || '', id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/certificates', async (req, res) => {
    try {
        const rows = await dbAll(`SELECT c.id, c.employee_id, e.name as employee_name, c.start_date, c.end_date, c.cid, c.observation 
                FROM sst_certificates c 
                LEFT JOIN employees e ON e.id = c.employee_id 
                ORDER BY c.start_date DESC`, []);
        res.json({ records: rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/certificate/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await dbRun(`DELETE FROM sst_certificates WHERE id = $1`, [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// === CERTIFICATES (ATESTADOS) ===

router.post('/certificate', async (req, res) => {
    try {
        const { employee_id, start_date, end_date, cid, observation } = req.body;
        if (!employee_id || !start_date) return res.status(400).json({ error: 'Campos obrigatórios ausentes' });

        const id = crypto.randomBytes(4).toString('hex');
        await dbRun(`INSERT INTO sst_certificates (id, employee_id, start_date, end_date, cid, observation) VALUES ($1, $2, $3, $4, $5, $6)`,
            [id, employee_id, start_date, end_date || null, cid || '', observation || '']);
        res.json({ success: true, id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/certificate/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { employee_id, start_date, end_date, cid, observation } = req.body;

        const result = await dbRun(`UPDATE sst_certificates SET employee_id = $1, start_date = $2, end_date = $3, cid = $4, observation = $5 WHERE id = $6`,
            [employee_id, start_date, end_date || null, cid || '', observation || '', id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Registro não encontrado' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/certificates', async (req, res) => {
    try {
        const rows = await dbAll(`SELECT c.id, c.employee_id, e.name as employee_name, c.start_date, c.end_date, c.cid, c.observation 
                FROM sst_certificates c 
                LEFT JOIN employees e ON e.id = c.employee_id 
                ORDER BY c.start_date DESC`, []);
        res.json({ records: rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
module.exports = router;
