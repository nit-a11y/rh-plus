const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const generateId = () => crypto.randomBytes(8).toString('hex');
const docsDir = path.join(__dirname, '../../public/uploads/sst');
if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

// ENDPOINT DE INTELIGÊNCIA ESTRATÉGICA (BI)
router.get('/bi-data', async (req, res) => {
    const { sector } = req.query;
    const today = new Date().toISOString().split('T')[0];

    try {
        const isSectorFiltered = sector && sector !== 'all';
        
        // Query principal com parâmetros PostgreSQL
        let summarySql = `
            SELECT
                COUNT(DISTINCT e.id) as total_colab,
                SUM(CASE WHEN a.expiry_date < $1 THEN 1 ELSE 0 END) as vencidos,
                SUM(CASE WHEN a.expiry_date BETWEEN $2 AND ($3::date + INTERVAL '45 days') THEN 1 ELSE 0 END) as alerta_45,
                SUM(CASE WHEN a.expiry_date > ($4::date + INTERVAL '45 days') THEN 1 ELSE 0 END) as regulares,
                (SELECT COUNT(*) FROM sst_certificates WHERE end_date >= $5) as afastados_hoje
            FROM employees e
            LEFT JOIN aso_records a ON e.id = a.employee_id
                AND a.exam_date = (SELECT MAX(exam_date) FROM aso_records WHERE employee_id = e.id)
            WHERE e.type != 'Desligado'
        `;
        const summaryParams = [today, today, today, today, today];
        
        if (isSectorFiltered) {
            summarySql += ` AND e.sector = $6`;
            summaryParams.push(sector);
        }

        // Executar queries em paralelo
        const [summaryResult, sectorsResult, examTypesResult, timelineResult] = await Promise.all([
            query(summarySql, summaryParams),
            query(`
                SELECT
                    e.sector,
                    COUNT(e.id) as total,
                    SUM(CASE WHEN a.expiry_date >= $1 OR a.expiry_date IS NULL THEN 1 ELSE 0 END) as em_dia,
                    SUM(CASE WHEN a.expiry_date < $2 THEN 1 ELSE 0 END) as vencidos
                FROM employees e
                LEFT JOIN aso_records a ON e.id = a.employee_id
                    AND a.exam_date = (SELECT MAX(exam_date) FROM aso_records WHERE employee_id = e.id)
                WHERE e.type != 'Desligado'
                GROUP BY e.sector
            `, [today, today]),
            query(`SELECT exam_type, COUNT(*) as count FROM aso_records GROUP BY exam_type`, []),
            query(`
                SELECT
                    TO_CHAR(expiry_date, 'MM/YYYY') as mes,
                    COUNT(*) as total
                FROM aso_records
                WHERE expiry_date >= $1
                GROUP BY TO_CHAR(expiry_date, 'MM/YYYY'), expiry_date
                ORDER BY expiry_date ASC
                LIMIT 4
            `, [today])
        ]);

        const response = {
            kpis: summaryResult.rows[0] || {},
            complianceChart: {
                labels: sectorsResult.rows.map((s) => s.sector),
                datasets: [
                    { label: 'Em Dia', data: sectorsResult.rows.map((s) => parseInt(s.em_dia) || 0), backgroundColor: '#10B981' },
                    { label: 'Vencidos', data: sectorsResult.rows.map((s) => parseInt(s.vencidos) || 0), backgroundColor: '#EF4444' }
                ]
            },
            examTypesChart: {
                labels: examTypesResult.rows.map((t) => t.exam_type),
                data: examTypesResult.rows.map((t) => parseInt(t.count))
            },
            timelineChart: {
                labels: timelineResult.rows.map((t) => t.mes),
                data: timelineResult.rows.map((t) => parseInt(t.total))
            }
        };
        res.json(response);
        
    } catch (error) {
        console.error('Erro no BI SST:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/timeline/:employeeId', async (req, res) => {
    const { employeeId } = req.params;
    const period = String(req.query.period || 'all').toLowerCase();
    const now = new Date();
    let minDate = null;

    if (period === '30d') minDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    if (period === '90d') minDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    if (period === '12m') {
        minDate = new Date(now);
        minDate.setMonth(minDate.getMonth() - 12);
    }

    const minDateStr = minDate ? minDate.toISOString().split('T')[0] : null;

    try {
        const asoResult = await query(`
            SELECT id, employee_id, exam_type, exam_date, expiry_date, result, clinic, doctor_name
            FROM aso_records
            WHERE employee_id = $1
            ${minDateStr ? 'AND exam_date >= $2' : ''}
            ORDER BY exam_date DESC
        `, minDateStr ? [employeeId, minDateStr] : [employeeId]);

        const certResult = await query(`
            SELECT id, employee_id, start_date, end_date, days_count, cid, doctor_name, type
            FROM sst_certificates
            WHERE employee_id = $1
            ${minDateStr ? 'AND start_date >= $2' : ''}
            ORDER BY start_date DESC
        `, minDateStr ? [employeeId, minDateStr] : [employeeId]);

        const todayStr = new Date().toISOString().split('T')[0];
        const events = [];

        asoResult.rows.forEach((a) => {
            events.push({
                event_type: 'ASO_REALIZADO',
                event_date: a.exam_date,
                status: a.result || 'Apto',
                title: `${a.exam_type || 'ASO'} realizado`,
                source_table: 'aso_records',
                source_id: a.id,
                metadata: {
                    exam_type: a.exam_type,
                    result: a.result,
                    exam_date: a.exam_date,
                    expiry_date: a.expiry_date,
                    clinic: a.clinic,
                    doctor_name: a.doctor_name
                }
            });

            if (a.expiry_date) {
                events.push({
                    event_type: 'ASO_VENCIMENTO',
                    event_date: a.expiry_date,
                    status: a.expiry_date < todayStr ? 'Vencido' : 'Previsto',
                    title: `${a.exam_type || 'ASO'} vence`,
                    source_table: 'aso_records',
                    source_id: a.id,
                    metadata: {
                        exam_type: a.exam_type,
                        expiry_date: a.expiry_date
                    }
                });
            }
        });

        certResult.rows.forEach((c) => {
            events.push({
                event_type: 'ATESTADO_INICIO',
                event_date: c.start_date,
                status: 'Afastamento',
                title: `${c.type || 'Atestado'} iniciado`,
                source_table: 'sst_certificates',
                source_id: c.id,
                metadata: {
                    cid: c.cid,
                    doctor_name: c.doctor_name,
                    start_date: c.start_date,
                    end_date: c.end_date,
                    days_count: c.days_count
                }
            });

            events.push({
                event_type: 'ATESTADO_FIM',
                event_date: c.end_date,
                status: 'Retorno previsto',
                title: `${c.type || 'Atestado'} finalizado`,
                source_table: 'sst_certificates',
                source_id: c.id,
                metadata: {
                    cid: c.cid,
                    doctor_name: c.doctor_name,
                    start_date: c.start_date,
                    end_date: c.end_date,
                    days_count: c.days_count
                }
            });
        });

        events.sort((a, b) => String(b.event_date).localeCompare(String(a.event_date)));
        res.json(events);
    } catch (error) {
        console.error('Erro ao buscar eventos:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/dashboard', async (req, res) => {
    const today = new Date().toISOString().split('T')[0];

    try {
        const asoStatsResult = await query(`
            SELECT COUNT(*) as total, SUM(CASE WHEN expiry_date < $1 THEN 1 ELSE 0 END) as vencidos, SUM(CASE WHEN expiry_date BETWEEN $2 AND ($3::date + INTERVAL '45 days') THEN 1 ELSE 0 END) as alerta
            FROM aso_records
        `, [today, today, today]);

        const absenteismoResult = await query(`
            SELECT SUM(days_count) as dias
            FROM sst_certificates
            WHERE start_date >= ($1::date - INTERVAL '30 days')
        `, [today]);

        const response = {
            aso_stats: asoStatsResult.rows[0] || { total: 0, vencidos: 0, alerta: 0 },
            absenteismo: absenteismoResult.rows[0] || { dias: 0 }
        };
        res.json(response);
    } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/certificates', async (req, res) => {
    try {
        const result = await query(`
            SELECT c.*, e.name as emp_name
            FROM sst_certificates c
            JOIN employees e ON c.employee_id = e.id
            ORDER BY c.start_date DESC
        `, []);

        res.json(result.rows || []);
    } catch (error) {
        console.error('Erro ao buscar atestados:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/certificates', async (req, res) => {
    const { employee_id, start_date, end_date, cid, doctor_name, type } = req.body;

    try {
        const d1 = new Date(start_date);
        const d2 = new Date(end_date);
        const days = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
        const certId = generateId();

        await query(`
            INSERT INTO sst_certificates (id, employee_id, start_date, end_date, days_count, cid, doctor_name, type)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [certId, employee_id, start_date, end_date, isNaN(days) ? 1 : days, cid, doctor_name, type]);

        res.json({ success: true, id: certId });
    } catch (error) {
        console.error('Erro ao criar atestado:', error);
        res.status(500).json({ error: error.message });
    }
});

router.put('/certificates/:id', async (req, res) => {
    const { id } = req.params;
    const { employee_id, start_date, end_date, cid, doctor_name, type } = req.body;

    try {
        if (!employee_id || !start_date || !end_date) {
            return res.status(400).json({ error: 'Campos obrigatorios ausentes' });
        }

        const d1 = new Date(start_date);
        const d2 = new Date(end_date);
        const days = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;

        await query(`
            UPDATE sst_certificates
            SET employee_id = $1, start_date = $2, end_date = $3, days_count = $4, cid = $5, doctor_name = $6, type = $7
            WHERE id = $8
        `, [employee_id, start_date, end_date, isNaN(days) ? 1 : days, cid || '', doctor_name || '', type || 'DOENCA', id]);

        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao atualizar atestado:', error);
        res.status(500).json({ error: error.message });
    }
});

router.delete('/certificates/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await query('BEGIN TRANSACTION');
        await query('DELETE FROM sst_event_documents WHERE source_table = $1 AND source_id = $2', ['sst_certificates', id]);
        const result = await query('DELETE FROM sst_certificates WHERE id = $1', [id]);

        if (!result.rowCount) {
            await query('ROLLBACK');
            return res.status(404).json({ error: 'Atestado nao encontrado' });
        }

        await query('COMMIT');
        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao deletar atestado:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/event-documents/by-employee/:employeeId', async (req, res) => {
    const { employeeId } = req.params;

    try {
        const result = await query(`
            SELECT d.*
            FROM sst_event_documents d
            WHERE d.employee_id = $1
            ORDER BY d.uploaded_at DESC
        `, [employeeId]);

        res.json(result.rows || []);
    } catch (error) {
        console.error('Erro ao buscar documentos de eventos:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/event-documents/upload', async (req, res) => {
    const { source_table, source_id, employee_id, file_name, mime_type, data_base64 } = req.body;

    const allowedMime = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

    if (!allowedTables.includes(source_table)) return res.status(400).json({ error: 'Tabela de origem invalida' });
    if (!source_id || !employee_id || !file_name || !data_base64) return res.status(400).json({ error: 'Dados do upload incompletos' });
    if (!allowedMime.includes(String(mime_type || '').toLowerCase())) return res.status(400).json({ error: 'Formato de arquivo nao permitido' });

    const extMap = {
        'application/pdf': 'pdf',
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png'
    };

    const safeName = String(file_name).replace(/[^a-zA-Z0-9._-]/g, '_');
    const ext = extMap[String(mime_type).toLowerCase()] || 'bin';
    const diskName = `${Date.now()}_${generateId()}_${safeName}`.replace(/\.(pdf|jpg|jpeg|png)$/i, '') + `.${ext}`;
    const filePath = path.join(docsDir, diskName);

    try {
        const raw = String(data_base64).replace(/^data:[^;]+;base64,/, '');
        
        // Refatoração Senior: I/O Assíncrono para liberar Event Loop do NodeJS durante upload
        fs.writeFile(filePath, Buffer.from(raw, 'base64'), (fsErr) => {
            if (fsErr) {
                console.error("Erro ao gravar arquivo SST:", fsErr);
                return res.status(500).json({ error: 'Falha ao salvar arquivo em disco' });
            }

            const publicUrl = `/uploads/sst/${diskName}`;
            const id = generateId();
            
            db.run(
                `INSERT INTO sst_event_documents (id, source_table, source_id, employee_id, file_name, file_url, mime_type)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [id, source_table, source_id, employee_id, safeName, publicUrl, mime_type],
                (err) => {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ success: true, id, file_url: publicUrl });
                }
            );
        });

    } catch (e) {
        return res.status(500).json({ error: 'Falha no processamento do binário Base64' });
    }
});

router.delete('/event-documents/:id', (req, res) => {
    const { id } = req.params;
    db.get(`SELECT file_url FROM sst_event_documents WHERE id = ?`, [id], (findErr, row) => {
        if (findErr) return res.status(500).json({ error: findErr.message });
        if (!row) return res.status(404).json({ error: 'Documento nao encontrado' });

        db.run(`DELETE FROM sst_event_documents WHERE id = ?`, [id], (delErr) => {
            if (delErr) return res.status(500).json({ error: delErr.message });
            const normalized = String(row.file_url || '').replace(/^\//, '');
            const localPath = path.join(__dirname, '../../public', normalized);
            
            // Refatoração Senior: Deleção física não-bloqueante
            fs.access(localPath, fs.constants.F_OK, (accErr) => {
                if (!accErr) {
                    fs.unlink(localPath, (ulErr) => {
                        if (ulErr) console.error("Falha ao deletar arquivo virtual do SST fisicamente:", ulErr);
                    });
                }
            });
            
            res.json({ success: true });
        });
    });
});

module.exports = router;
