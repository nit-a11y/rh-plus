
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

function addMonths(dateStr, months) {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return new Date();
    d.setMonth(d.getMonth() + months);
    return d;
}

function getDaysDiff(date1, date2) {
    const diffTime = Math.abs(date2 - date1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

router.get('/summary', async (req, res) => {
    try {
        const today = new Date();
        const future90 = new Date();
        future90.setDate(today.getDate() + 90);

        const sql = `
            SELECT e.id, e.name, e."registrationNumber" as reg, e."admissionDate", e.role, e.sector, e."photoUrl", "currentSalary", e.type
            FROM employees e ORDER BY e.name ASC
        `;

        const employees = await dbAll(sql, []);

        const allVacations = await dbAll(`SELECT * FROM vacation_records ORDER BY start_date DESC`, []);

        const stats = {
            risk_now: 0,
            risk_future: 0,
            planned: 0,
            active: 0,
            critical_sectors: []
        };

        const sectorCounts = {};

        const result = employees.map(emp => {
            if (!sectorCounts[emp.sector]) sectorCounts[emp.sector] = { total: 0, away: 0, name: emp.sector };
            sectorCounts[emp.sector].total++;

            const empVacHistory = (allVacations || []).filter(v => v.employee_id === emp.id);

            let lastVacationStart = empVacHistory.length > 0 ? new Date(empVacHistory[0].start_date) : null;

            let limitDate;
            if (empVacHistory.length === 0) {
                limitDate = addMonths(emp.admissionDate, 12);
            } else {
                limitDate = addMonths(lastVacationStart, 12);
            }
            const isCurrentlyOnVacation = empVacHistory.some(v => {
                const s = new Date(v.start_date);
                const r = new Date(v.return_date);
                return v.status === 'Em Gozo' || (today >= s && today <= r);
            });

            const hasPlanned = empVacHistory.some(v => v.status === 'Planejada');

            let status = 'Apto';
            let color = 'emdia';

            if (isCurrentlyOnVacation) {
                status = 'Em Gozo';
                color = 'info';
                stats.active++;
                sectorCounts[emp.sector].away++;
            } else if (hasPlanned) {
                status = 'Planejada';
                color = 'planejada';
                stats.planned++;
            } else if (today > limitDate) {
                status = 'Risco Crítico';
                color = 'vencido';
                stats.risk_now++;
            } else if (limitDate <= future90 && limitDate >= today) {
                status = 'Risco Futuro';
                color = 'alerta';
                stats.risk_future++;
            } else if (getDaysDiff(today, new Date(emp.admissionDate)) < 365) {
                const carenciaDate = addMonths(emp.admissionDate, 12);
                if (today < carenciaDate) {
                    status = 'Em Carência';
                    color = 'carencia';
                }
            }

            return {
                ...emp,
                legalStatus: status,
                colorClass: color,
                history: empVacHistory,
                cltMetrics: {
                    limitDate: limitDate.toISOString().split('T')[0]
                }
            };
        });

        Object.values(sectorCounts).forEach(s => {
            if (s.total > 0) {
                const rate = (s.away / s.total) * 100;
                if (rate > 20) stats.critical_sectors.push({ name: s.name, rate: Math.round(rate) });
            }
        });

        res.json({ employees: result, stats, allVacations: allVacations || [] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint para dados do Dossiê (lista todos os colaboradores e férias)
router.get('/dossier-data', async (req, res) => {
    try {
        const sql = `
            SELECT e.id, e.name, e."registrationNumber" as reg, e."admissionDate", e.role, e.sector, e."photoUrl", "currentSalary"
            FROM employees e WHERE e.type != 'Desligado' ORDER BY e.name ASC
        `;

        const employees = await dbAll(sql, []);
        const vacations = await dbAll(`SELECT * FROM vacation_records ORDER BY start_date DESC`, []);
        res.json({ employees: employees || [], vacations: vacations || [] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint de REGULARIZAÇÃO RETROATIVA
router.post('/retroactive', async (req, res) => {
    try {
        const { employee_id, start_date, days_taken, abono_days, observation, responsible } = req.body;

        if (!employee_id || !start_date || !days_taken) {
            return res.status(400).json({ error: "Dados incompletos para registro retroativo." });
        }

        const start = new Date(start_date + 'T00:00:00');
        const dTaken = parseInt(days_taken);
        const end = new Date(start);
        end.setDate(end.getDate() + (dTaken - 1));
        const returnDate = new Date(end);
        returnDate.setDate(returnDate.getDate() + 1);

        const sqlOverlap = `SELECT id FROM vacation_records WHERE employee_id = $1 AND (
            (start_date BETWEEN $2 AND $3) OR (end_date BETWEEN $4 AND $5)
        )`;
        const startIso = start.toISOString().split('T')[0];
        const endIso = end.toISOString().split('T')[0];

        const existingRow = await dbGet(sqlOverlap, [employee_id, startIso, endIso, startIso, endIso]);
        if (existingRow) return res.status(400).json({ error: "Conflito: Já existe férias registradas neste período." });

        const sql = `INSERT INTO vacation_records (
            id, employee_id, start_date, end_date, return_date, days_taken, abono_days, 
            status, base_salary, gross_value, one_third_value, abono_value, one_third_abono_value, total_value, observation, responsible
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`;

        const params = [
            generateId(), employee_id, startIso, endIso,
            returnDate.toISOString().split('T')[0], dTaken, parseInt(abono_days) || 0,
            'Histórico Retroativo', 0, 0, 0, 0, 0, 0,
            `[REGULARIZAÇÃO] ${observation || ''}`, responsible
        ];

        await dbRun(sql, params);
        res.json({ success: true, message: "Histórico regularizado." });
    } catch (err) {
        res.status(500).json({ error: "Erro no banco de dados." });
    }
});

router.post('/schedule', async (req, res) => {
    try {
        const { employee_id, start_date, days_taken, abono_days, salary, observation, responsible, is_planning } = req.body;

        if (!employee_id || !start_date || !days_taken) {
            return res.status(400).json({ error: "Dados incompletos." });
        }

        const start = new Date(start_date + 'T00:00:00');
        const dTaken = parseInt(days_taken);
        const dAbono = parseInt(abono_days) || 0;

        const end = new Date(start);
        end.setDate(end.getDate() + (dTaken - 1));

        const returnDate = new Date(end);
        returnDate.setDate(returnDate.getDate() + 1);

        if (returnDate.getDay() === 6) {
            returnDate.setDate(returnDate.getDate() + 2);
        }
        else if (returnDate.getDay() === 0) {
            returnDate.setDate(returnDate.getDate() + 1);
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let status = is_planning ? 'Planejada' : 'Agendada';

        if (!is_planning) {
            if (returnDate < today) status = 'Concluída';
            else if (today >= start && today <= returnDate) status = 'Em Gozo';
        }

        const sql = `INSERT INTO vacation_records (
            id, employee_id, start_date, end_date, return_date, days_taken, abono_days, 
            status, base_salary, gross_value, one_third_value, abono_value, one_third_abono_value, total_value, observation, responsible
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`;

        const params = [
            generateId(), employee_id, start_date, end.toISOString().split('T')[0],
            returnDate.toISOString().split('T')[0], dTaken, dAbono,
            status, 0, 0, 0, 0, 0, 0, observation || '', responsible || 'Sistema'
        ];

        await dbRun(sql, params);
        res.json({ success: true, status_assigned: status });
    } catch (err) {
        res.status(500).json({ error: "Erro no banco de dados." });
    }
});

// Registro Rico - Novo Período com campos adicionais
router.post('/schedule-rich', async (req, res) => {
    try {
        const { employee_id, start_date, days_taken, abono_days, motivo, substituto, observation, responsible, is_planning } = req.body;

        if (!employee_id || !start_date || !days_taken) {
            return res.status(400).json({ error: "Dados incompletos." });
        }

        const start = new Date(start_date + 'T00:00:00');
        const dTaken = parseInt(days_taken);
        const dAbono = parseInt(abono_days) || 0;
        const end = new Date(start);
        end.setDate(end.getDate() + (dTaken - 1));

        const startIso = start.toISOString().split('T')[0];
        const endIso = end.toISOString().split('T')[0];

        const sqlOverlap = `SELECT id FROM vacation_records WHERE employee_id = $1 AND (
            (start_date BETWEEN $2 AND $3) OR (end_date BETWEEN $4 AND $5) OR (start_date <= $6 AND end_date >= $7)
        ) AND status NOT IN ('Cancelada')`;

        const existingRow = await dbGet(sqlOverlap, [employee_id, startIso, endIso, startIso, endIso, startIso, endIso]);
        if (existingRow) return res.status(400).json({ error: "Conflito: Já existe registro neste período." });

        const returnDate = new Date(end);
        returnDate.setDate(returnDate.getDate() + 1);
        if (returnDate.getDay() === 6) returnDate.setDate(returnDate.getDate() + 2);
        else if (returnDate.getDay() === 0) returnDate.setDate(returnDate.getDate() + 1);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let status = is_planning ? 'Planejada' : 'Agendada';
        if (!is_planning) {
            if (returnDate < today) status = 'Concluída';
            else if (today >= start && today <= returnDate) status = 'Em Gozo';
        }

        const sql = `INSERT INTO vacation_records (
            id, employee_id, start_date, end_date, return_date, days_taken, abono_days, 
            status, base_salary, gross_value, one_third_value, abono_value, one_third_abono_value, total_value, observation, responsible, motivo, substituto
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`;

        const obsText = observation ? `[${motivo || 'Férias'}] ${observation}` : (motivo || 'Férias');

        const params = [
            generateId(), employee_id, start_date, end.toISOString().split('T')[0],
            returnDate.toISOString().split('T')[0], dTaken, dAbono,
            status, 0, 0, 0, 0, 0, 0, obsText, responsible || 'Sistema', motivo || '', substituto || ''
        ];

        await dbRun(sql, params);
        res.json({ success: true, status_assigned: status });
    } catch (err) {
        res.status(500).json({ error: "Erro no banco: " + err.message });
    }
});

// Registro Retroativo Rico
router.post('/retroactive-rich', async (req, res) => {
    try {
        const { employee_id, start_date, days_taken, abono_days, observation, responsible } = req.body;

        if (!employee_id || !start_date || !days_taken) {
            return res.status(400).json({ error: "Dados incompletos." });
        }

        const start = new Date(start_date + 'T00:00:00');
        const dTaken = parseInt(days_taken);
        const end = new Date(start);
        end.setDate(end.getDate() + (dTaken - 1));
        const returnDate = new Date(end);
        returnDate.setDate(returnDate.getDate() + 1);

        const startIso = start.toISOString().split('T')[0];
        const endIso = end.toISOString().split('T')[0];

        const sql = `INSERT INTO vacation_records (
            id, employee_id, start_date, end_date, return_date, days_taken, abono_days, 
            status, base_salary, gross_value, one_third_value, abono_value, one_third_abono_value, total_value, observation, responsible
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`;

        const params = [
            generateId(), employee_id, startIso, endIso,
            returnDate.toISOString().split('T')[0], dTaken, parseInt(abono_days) || 0,
            'Histórico Retroativo', 0, 0, 0, 0, 0, 0,
            `[RETROATIVO] ${observation || ''}`, responsible || 'Admin'
        ];

        await dbRun(sql, params);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Erro no banco." });
    }
});

// Confirmar Férias Planejadas (Transformar em Agendada)
router.post('/confirm/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await dbRun(`UPDATE vacation_records SET status = 'Agendada' WHERE id = $1`, [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Atualizar férias (PUT)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { start_date, end_date, return_date, days_taken, abono_days, observation, status } = req.body;
        
        // Verifica se registro existe
        const existing = await dbGet(`SELECT * FROM vacation_records WHERE id = $1`, [id]);
        if (!existing) {
            return res.status(404).json({ error: 'Registro não encontrado' });
        }
        
        // Atualiza os campos (apenas os que existem na tabela)
        await dbRun(`UPDATE vacation_records 
                     SET start_date = $1, 
                         end_date = $2, 
                         return_date = $3,
                         days_taken = $4,
                         abono_days = $5,
                         observation = $6,
                         status = COALESCE($7, status)
                     WHERE id = $8`,
            [
                start_date || existing.start_date,
                end_date || existing.end_date,
                return_date || existing.return_date,
                days_taken || existing.days_taken,
                abono_days !== undefined ? abono_days : existing.abono_days,
                observation !== undefined ? observation : existing.observation,
                status,
                id
            ]
        );
        
        res.json({ success: true, message: 'Férias atualizadas com sucesso' });
    } catch (err) {
        console.error('Erro ao atualizar férias:', err);
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await dbGet(`SELECT * FROM vacation_records WHERE id = $1`, [id]);
        await dbRun(`DELETE FROM vacation_records WHERE id = $1`, [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
