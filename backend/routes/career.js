
const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const crypto = require('crypto');

const generateId = () => crypto.randomBytes(4).toString('hex');

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

// ROTA: OBTER HISTÓRICO DE CARREIRA DE UM FUNCIONÁRIO
router.get('/:employeeId', async (req, res) => {
    try {
        const { employeeId } = req.params;
        
        const sql = `
            SELECT 
                id,
                employee_id,
                role,
                sector,
                salary,
                move_type,
                date,
                responsible,
                observation,
                cbo
            FROM career_history 
            WHERE employee_id = $1 
            ORDER BY date DESC
        `;
        
        const result = await query(sql, [employeeId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao buscar histórico de carreira:', err);
        res.status(500).json({ error: err.message });
    }
});

// ROTA: MOVIMENTAÇÃO INDIVIDUAL
router.post('/', async (req, res) => {
    try {
        const { employeeId, role, sector, salary, move_type, date, responsible, observation, cbo, kit_swap, sizes,
                termination_reason, grrf_value, rescisao_value } = req.body;
        const id = generateId();

        const finalDate = (date && date.includes(':')) ? date : new Date().toLocaleString('sv-SE').replace('T', ' ');

        const normalizedRole = role ? role.toString().toUpperCase().trim() : '';
        const normalizedSector = sector ? sector.toString().toUpperCase().trim() : 'ADMINISTRATIVO';
        const normalizedCbo = cbo ? cbo.toString().replace(/[^\d]/g, '').padStart(6, '0') : '';
        const normalizedObservation = observation ? observation.toString().toUpperCase().trim() : '';
        const normalizedResponsible = responsible ? responsible.toString().toUpperCase().trim() : '';
        const normalizedMoveType = move_type ? move_type.toString().toUpperCase().trim() : '';

        const isBonus = move_type.toLowerCase().includes('bonificação') ||
            move_type.toLowerCase().includes('mérito') ||
            move_type.toLowerCase().includes('bônus');

        await query('BEGIN TRANSACTION');

        const sqlHistory = `INSERT INTO career_history (id, employee_id, role, sector, salary, move_type, date, responsible, observation, cbo) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`;
        await dbRun(sqlHistory, [id, employeeId, normalizedRole, normalizedSector, salary, normalizedMoveType, finalDate, normalizedResponsible, normalizedObservation, normalizedCbo]);

        let sqlUpdateEmp = `UPDATE employees SET role = $1, sector = $2, cbo = $3`;
        const updateFields = [normalizedRole, normalizedSector, normalizedCbo];

        if (!isBonus) {
            sqlUpdateEmp += `, "currentSalary" = $${updateFields.length + 1}`;
            updateFields.push(salary);
        }

        if (kit_swap) {
            sqlUpdateEmp += `, type = $${updateFields.length + 1}`;
            updateFields.push(kit_swap);
        }

        sqlUpdateEmp += ` WHERE id = $${updateFields.length + 1}`;
        updateFields.push(employeeId);

        await dbRun(sqlUpdateEmp, updateFields);

        if (kit_swap) {
            await dbRun(`UPDATE uniform_items SET status = 'Devolvido', nextExchangeDate = '' WHERE employee_id = $1 AND status != 'Devolvido'`, [employeeId]);
            const roleRow = await dbGet(`SELECT id FROM roles_master WHERE name = $1`, [role]);
            if (roleRow) {
                const items = await dbAll(`SELECT ki.* FROM kit_items ki JOIN kits_master km ON ki.kit_id = km.id WHERE km.role_id = $1`, [roleRow.id]);
                for (const ki of items) {
                    const itemId = generateId();
                    let itemSize = 'M';
                    if (ki.item_type.toLowerCase().includes('camisa')) itemSize = sizes?.shirt || 'M';
                    else if (ki.item_type.toLowerCase().includes('calça')) itemSize = sizes?.pants || '40';
                    else if (ki.item_type.toLowerCase().includes('bota') || ki.item_type.toLowerCase().includes('sapato')) itemSize = sizes?.shoe || '40';
                    const nextDateDays = (kit_swap === 'ADM') ? 365 : 180;
                    const limitDate = new Date();
                    limitDate.setDate(limitDate.getDate() + nextDateDays);
                    await dbRun(`INSERT INTO uniform_items (id, employee_id, type, color, size, dateGiven, nextExchangeDate, status) VALUES ($1, $2, $3, $4, $5, $6, $7, 'Em dia')`,
                        [itemId, employeeId, ki.item_type, ki.color, itemSize, finalDate.split(' ')[0], limitDate.toISOString().split('T')[0]]);
                }
            }
        }

        let termId = null;
        if (move_type === 'Desligamento') {
            termId = generateId();
            const termDate = finalDate.split(' ')[0];
            const normalizedTermReason = termination_reason ? termination_reason.toString().toUpperCase().trim() : '';
            const grrf = parseFloat(grrf_value) || 0;
            const rescisao = parseFloat(rescisao_value) || 0;

            await dbRun(`UPDATE employees SET type = 'Desligado', "terminationDate" = $1, "terminationReason" = $2 WHERE id = $3`,
                [termDate, normalizedTermReason, employeeId]);

            await dbRun(`INSERT INTO employee_terminations (id, employee_id, termination_date, termination_reason, observation, grrf_value, rescisao_value, responsible)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [termId, employeeId, termDate, normalizedTermReason, normalizedObservation, grrf, rescisao, normalizedResponsible]);

            const camposArquivo = [
                'hierarchy', 'admissionDate', 'birthDate', 'currentSalary', 'street', 'city',
                'neighborhood', 'state_uf', 'cep', 'fatherName', 'motherName', 'gender',
                'maritalStatus', 'ethnicity', 'educationLevel', 'placeOfBirth',
                'personalEmail', 'personalPhone', 'work_schedule', 'work_scale', 'cbo',
                'initialRole', 'initialSalary', 'metadata', 'observation', 'criado_em'
            ];

            const empData = await dbGet(`SELECT ${camposArquivo.map(f => `"${f}"`).join(',')} FROM employees WHERE id = $1`, [employeeId]);
            if (empData) {
                const archiveData = {};
                camposArquivo.forEach(field => {
                    if (empData[field] !== undefined && empData[field] !== null) {
                        archiveData[field] = empData[field];
                    }
                });

                const archiveId = generateId();
                await dbRun(`INSERT INTO employee_archive (id, employee_id, archive_data, termination_id, is_active)
                        VALUES ($1, $2, $3, $4, 0)`,
                    [archiveId, employeeId, JSON.stringify(archiveData), termId]);

                const limpezas = camposArquivo.map(f => `"${f}" = NULL`).join(', ');
                await dbRun(`UPDATE employees SET ${limpezas} WHERE id = $1`, [employeeId]);
            }
        }

        await query('COMMIT');
        res.json({ success: true, id, terminationId: termId });
    } catch (err) {
        await query('ROLLBACK').catch(() => {});
        res.status(500).json({ error: err.message });
    }
});

// ROTA: EDITAR REGISTRO DE CARREIRA
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { role, sector, salary, move_type, date, responsible, observation, cbo } = req.body;

        const fields = [];
        const values = [];

        if (role !== undefined && role) {
            fields.push('role = $' + (fields.length + 1));
            values.push(role.toString().toUpperCase().trim());
        }
        if (sector !== undefined && sector) {
            fields.push('sector = $' + (fields.length + 1));
            values.push(sector.toString().toUpperCase().trim());
        }
        if (salary !== undefined && salary) {
            fields.push('salary = $' + (fields.length + 1));
            values.push(salary);
        }
        if (move_type !== undefined && move_type) {
            fields.push('move_type = $' + (fields.length + 1));
            values.push(move_type.toString().toUpperCase().trim());
        }
        if (date !== undefined && date) {
            fields.push('date = $' + (fields.length + 1));
            values.push(date);
        }
        if (responsible !== undefined && responsible) {
            fields.push('responsible = $' + (fields.length + 1));
            values.push(responsible.toString().toUpperCase().trim());
        }
        if (observation !== undefined && observation) {
            fields.push('observation = $' + (fields.length + 1));
            values.push(observation.toString().toUpperCase().trim());
        }
        if (cbo !== undefined && cbo) {
            fields.push('cbo = $' + (fields.length + 1));
            values.push(cbo.toString().replace(/[^\d]/g, '').padStart(6, '0'));
        }

        if (fields.length === 0) {
            return res.status(400).json({ error: 'Nenhum campo para atualizar' });
        }

        fields.push('id = $' + (fields.length + 1));
        values.push(id);

        const sql = `UPDATE career_history SET ${fields.join(', ')} WHERE id = $${fields.length}`;
        
        await query(sql, values);
        
        // Se for desligamento, atualizar employee
        if (move_type && move_type.toUpperCase().includes('DESLIGAMENTO')) {
            const careerRecord = await query('SELECT employee_id FROM career_history WHERE id = $1', [id]);
            if (careerRecord.rows.length > 0) {
                const employeeId = careerRecord.rows[0].employee_id;
                const terminationDate = date || new Date().toISOString().split('T')[0];
                await query(
                    `UPDATE employees SET type = 'Desligado', "terminationDate" = $1 WHERE id = $2`,
                    [terminationDate, employeeId]
                );
            }
        }
        
        res.json({ success: true, message: 'Registro atualizado com sucesso' });
    } catch (err) {
        console.error('Erro ao editar registro de carreira:', err.stack || err.message);
        res.status(500).json({ error: err.message, details: err.stack });
    }
});

// ROTA: REAJUSTE COLETIVO (BULK)
router.post('/bulk', async (req, res) => {
    try {
        const { percentage, observation, responsible } = req.body;
        const now = new Date().toLocaleString('sv-SE').replace('T', ' ');

        const employees = await dbAll(`SELECT id, "currentSalary", role, sector, cbo FROM employees WHERE type != 'Desligado'`, []);

        await query('BEGIN TRANSACTION');
        
        for (const emp of employees) {
            // Corrigir tratamento para formatação brasileira: 1.234,56 → 1234.56
            let cleanSalary = (emp.currentSalary || "0").replace(/[R$\s]/g, '');
            if (cleanSalary.includes(',')) {
                // Remove pontos de milhar, mantém apenas a vírgula decimal
                cleanSalary = cleanSalary.replace(/\./g, '').replace(',', '.');
            } else {
                // Se não tem vírgula, remove pontos (pode ser decimal americano)
                cleanSalary = cleanSalary.replace(/\./g, '');
            }
            let oldVal = parseFloat(cleanSalary) || 0;
            let newVal = oldVal * (1 + (parseFloat(percentage) / 100));
            let formattedNewSalary = newVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

            const histId = generateId();
            await dbRun(`INSERT INTO career_history (id, employee_id, role, sector, salary, move_type, date, responsible, observation, cbo) 
                    VALUES ($1, $2, $3, $4, $5, 'Reajuste Coletivo', $6, $7, $8, $9)`,
                [histId, emp.id, emp.role, emp.sector, formattedNewSalary, now, responsible, observation, emp.cbo]);

            await dbRun(`UPDATE employees SET "currentSalary" = $1 WHERE id = $2`, [formattedNewSalary, emp.id]);
        }

        await query('COMMIT');
        res.json({ success: true, count: employees.length });
    } catch (err) {
        await query('ROLLBACK').catch(() => {});
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await dbRun(`DELETE FROM career_history WHERE id = $1`, [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { role, sector, salary, move_type, date, observation, cbo, responsible } = req.body;

        const normalizedRole = role ? role.toString().toUpperCase().trim() : '';
        const normalizedSector = sector ? sector.toString().toUpperCase().trim() : 'ADMINISTRATIVO';
        const normalizedMoveType = move_type ? move_type.toString().toUpperCase().trim() : '';
        const normalizedCbo = cbo ? cbo.toString().replace(/[^\d]/g, '').padStart(6, '0') : '';
        const normalizedObservation = observation ? observation.toString().toUpperCase().trim() : '';
        const normalizedResponsible = responsible ? responsible.toString().toUpperCase().trim() : '';

        const sql = `UPDATE career_history SET role = $1, sector = $2, salary = $3, move_type = $4, date = $5, observation = $6, cbo = $7, responsible = $8 WHERE id = $9`;
        await dbRun(sql, [normalizedRole, normalizedSector, salary, normalizedMoveType, date, normalizedObservation, normalizedCbo, normalizedResponsible, id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/termination/:employeeId', async (req, res) => {
    try {
        const { employeeId } = req.params;

        const row = await dbGet(`SELECT * FROM employee_terminations WHERE employee_id = $1 ORDER BY created_at DESC LIMIT 1`,
            [employeeId]);
        if (!row) return res.status(404).json({ error: 'Dados de desligamento não encontrados' });
        res.json({ success: true, data: row });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/terminations/all', async (req, res) => {
    try {
        const rows = await dbAll(`
            SELECT t.*, e.name as employee_name, e."registrationNumber"
            FROM employee_terminations t
            JOIN employees e ON t.employee_id = e.id
            ORDER BY t.termination_date DESC
        `, []);
        res.json({ success: true, data: rows || [] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/termination/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { termination_reason, observation, grrf_value, rescisao_value, responsible } = req.body;

        const normalizedTermReason = termination_reason ? termination_reason.toString().toUpperCase().trim() : '';
        const normalizedObservation = observation ? observation.toString().toUpperCase().trim() : '';
        const normalizedResponsible = responsible ? responsible.toString().toUpperCase().trim() : '';
        const grrf = parseFloat(grrf_value) || 0;
        const rescisao = parseFloat(rescisao_value) || 0;

        await dbRun(`UPDATE employee_terminations
                SET termination_reason = $1, observation = $2, grrf_value = $3, rescisao_value = $4, responsible = $5
                WHERE id = $6`,
            [normalizedTermReason, normalizedObservation, grrf, rescisao, normalizedResponsible, id]);

        const row = await dbGet(`SELECT employee_id FROM employee_terminations WHERE id = $1`, [id]);
        if (row) {
            await dbRun(`UPDATE employees SET "terminationReason" = $1 WHERE id = $2`,
                [normalizedTermReason, row.employee_id]);
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await dbRun(`DELETE FROM career_history WHERE id = $1`, [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ROTA: EDITAR REGISTRO DE HISTÓRICO
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { role, sector, salary, move_type, date, observation, cbo, responsible } = req.body;

        const normalizedRole = role ? role.toString().toUpperCase().trim() : '';
        const normalizedSector = sector ? sector.toString().toUpperCase().trim() : 'ADMINISTRATIVO';
        const normalizedMoveType = move_type ? move_type.toString().toUpperCase().trim() : '';
        const normalizedCbo = cbo ? cbo.toString().replace(/[^\d]/g, '').padStart(6, '0') : '';
        const normalizedObservation = observation ? observation.toString().toUpperCase().trim() : '';
        const normalizedResponsible = responsible ? responsible.toString().toUpperCase().trim() : '';

        const sql = `UPDATE career_history SET role = $1, sector = $2, salary = $3, move_type = $4, date = $5, observation = $6, cbo = $7, responsible = $8 WHERE id = $9`;
        await dbRun(sql, [normalizedRole, normalizedSector, salary, normalizedMoveType, date, normalizedObservation, normalizedCbo, normalizedResponsible, id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ROTA: OBTER DADOS DE DESLIGAMENTO DE UM COLABORADOR
router.get('/termination/:employeeId', async (req, res) => {
    try {
        const { employeeId } = req.params;

        const row = await dbGet(`SELECT * FROM employee_terminations WHERE employee_id = $1 ORDER BY created_at DESC LIMIT 1`,
            [employeeId]);
        if (!row) return res.status(404).json({ error: 'Dados de desligamento não encontrados' });
        res.json({ success: true, data: row });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ROTA: LISTAR TODOS OS DESLIGAMENTOS
router.get('/terminations/all', async (req, res) => {
    try {
        const rows = await dbAll(`
            SELECT t.*, e.name as employee_name, e."registrationNumber"
            FROM employee_terminations t
            JOIN employees e ON t.employee_id = e.id
            ORDER BY t.termination_date DESC
        `, []);
        res.json({ success: true, data: rows || [] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ROTA: ATUALIZAR DADOS DE DESLIGAMENTO
router.put('/termination/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { termination_reason, observation, grrf_value, rescisao_value, responsible } = req.body;

        const normalizedTermReason = termination_reason ? termination_reason.toString().toUpperCase().trim() : '';
        const normalizedObservation = observation ? observation.toString().toUpperCase().trim() : '';
        const normalizedResponsible = responsible ? responsible.toString().toUpperCase().trim() : '';
        const grrf = parseFloat(grrf_value) || 0;
        const rescisao = parseFloat(rescisao_value) || 0;

        await dbRun(`UPDATE employee_terminations
                SET termination_reason = $1, observation = $2, grrf_value = $3, rescisao_value = $4, responsible = $5
                WHERE id = $6`,
            [normalizedTermReason, normalizedObservation, grrf, rescisao, normalizedResponsible, id]);

        const row = await dbGet(`SELECT employee_id FROM employee_terminations WHERE id = $1`, [id]);
        if (row) {
            await dbRun(`UPDATE employees SET "terminationReason" = $1 WHERE id = $2`,
                [normalizedTermReason, row.employee_id]);
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
