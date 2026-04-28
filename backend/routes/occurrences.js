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

router.post('/', async (req, res) => {
    try {
        const { employeeId, type, date, reason, responsible, observation } = req.body;
        const id = generateId();

        const sql = `INSERT INTO occurrences (id, employee_id, type, date, reason, responsible, observation, status) VALUES ($1, $2, $3, $4, $5, $6, $7, 'Ativa')`;

        await dbRun(sql, [id, employeeId, type, date, reason, responsible, observation]);

        if (type === 'Justa Causa (Desligamento)') {
            await dbRun(`UPDATE employees SET type = 'Desligado' WHERE id = $1`, [employeeId]);

            const carId = generateId();
            const emp = await dbGet(`SELECT role, sector FROM employees WHERE id = $1`, [employeeId]);
            const role = emp ? emp.role : 'Desconhecido';
            const sector = emp ? emp.sector : 'Desconhecido';

            const sqlCareer = `INSERT INTO career_history (id, employee_id, role, sector, salary, move_type, date, responsible, observation) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`;
            const careerObs = `Desligamento por Justa Causa (Ref. Ocorrência ${id})`;

            await dbRun(sqlCareer, [carId, employeeId, role, sector, '-', 'Desligamento', date, responsible, careerObs]);

            res.json({ message: 'Ocorrência registrada e colaborador desligado (Justa Causa).', id, terminated: true });
        } else {
            res.json({ message: 'Ocorrência registrada', id });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ROTA: EXCLUIR OCORRÊNCIA
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await dbRun(`DELETE FROM occurrences WHERE id = $1`, [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ROTA: EDITAR OCORRÊNCIA
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { type, date, reason, responsible, observation } = req.body;

        const sql = `UPDATE occurrences SET type = $1, date = $2, reason = $3, responsible = $4, observation = $5 WHERE id = $6`;
        await dbRun(sql, [type, date, reason, responsible, observation, id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;