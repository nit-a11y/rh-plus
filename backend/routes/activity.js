const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const crypto = require('crypto');

const generateId = () => crypto.randomBytes(4).toString('hex');

// --- LOG DE ATIVIDADE ---

// ROTA: Salvar Log de Atividade
router.post('/activity/log', async (req, res) => {
    try {
        const { user_id, record_id, action_type, duration_seconds } = req.body;

        if (!user_id || !record_id || !action_type) {
            return res.status(400).json({ success: false, error: 'Dados incompletos para log' });
        }

        await query(`INSERT INTO user_activity_log (user_id, record_id, action_type, duration_seconds) VALUES ($1, $2, $3, $4)`, 
            [user_id, record_id, action_type, duration_seconds || 0]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ROTA: Obter Estatísticas do Usuário
router.get('/activity/stats/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await query(`
            SELECT 
                COUNT(id) as total_changes,
                SUM(duration_seconds) as total_time_seconds,
                AVG(duration_seconds) as avg_time_seconds
            FROM user_activity_log 
            WHERE user_id = $1
        `, [userId]);
        
        const stats = result.rows[0];
        res.json({
            success: true,
            stats: {
                total_changes: parseInt(stats.total_changes) || 0,
                total_time_hours: ((parseFloat(stats.total_time_seconds) || 0) / 3600).toFixed(2),
                avg_time_minutes: ((parseFloat(stats.avg_time_seconds) || 0) / 60).toFixed(2)
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// --- METAS E DEMANDAS ---

// ROTA: Criar Meta (Admin) e Gerar Demandas
router.post('/goals', async (req, res) => {
    try {
        const { title, description, target_company_id, target_date, created_by } = req.body;
        const goalId = generateId();

        await query('BEGIN');

        try {
            // 1. Criar a Meta
            await query(`INSERT INTO goals (id, title, description, target_company_id, target_date, created_by) VALUES ($1,$2,$3,$4,$5,$6)`,
                [goalId, title, description, target_company_id, target_date, created_by]);

            // 2. Analisar registros e gerar demandas dinamicamente
            let filterSql = "type != 'Desligado'";
            const params = [];
            let paramIndex = 0;

            if (target_company_id && target_company_id !== 'all') {
                if (target_company_id.startsWith('employer:')) {
                    paramIndex++;
                    filterSql += ` AND employer_id = $${paramIndex}`;
                    params.push(target_company_id.replace('employer:', ''));
                } else if (target_company_id.startsWith('unit:')) {
                    paramIndex++;
                    filterSql += ` AND workplace_id = $${paramIndex}`;
                    params.push(target_company_id.replace('unit:', ''));
                }
            }

            const empResult = await query(`SELECT id FROM employees WHERE ${filterSql}`, params);
            const employees = empResult.rows;

            for (const emp of employees) {
                const demandId = generateId();
                await query(`INSERT INTO user_demands (id, goal_id, record_id) VALUES ($1, $2, $3)`, [demandId, goalId, emp.id]);
            }

            await query('COMMIT');
            res.json({ success: true, goalId, records_count: employees.length });
        } catch (err) {
            await query('ROLLBACK');
            throw err;
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ROTA: Listar Demandas do Usuário
router.get('/demands', async (req, res) => {
    try {
        const { user_id } = req.query;
        let sql = `
            SELECT d.*, e.name as employee_name, g.title as goal_title, g.target_date
            FROM user_demands d
            JOIN employees e ON d.record_id = e.id
            JOIN goals g ON d.goal_id = g.id
            WHERE d.status = 'Pendente'
        `;
        const params = [];
        if (user_id) {
            sql += ` AND d.user_id = $1`;
            params.push(user_id);
        }

        const result = await query(sql, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ROTA: Marcar Demanda como Concluída
router.patch('/demands/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const completedAt = status === 'Concluída' ? new Date().toISOString() : null;

        const result = await query(`UPDATE user_demands SET status = $1, completed_at = $2 WHERE id = $3`, [status, completedAt, id]);
        res.json({ success: true, changes: result.rowCount });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// --- ANALYTICS PARA GESTORES ---

// ROTA: Resumo Geral de Metas
router.get('/analytics/goals/summary', async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                g.id, g.title, g.target_date,
                COUNT(d.id) as total_demands,
                SUM(CASE WHEN d.status = 'Concluída' THEN 1 ELSE 0 END) as completed_demands
            FROM goals g
            LEFT JOIN user_demands d ON g.id = d.goal_id
            GROUP BY g.id
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ROTA: Detalhes de Produtividade por Meta
router.get('/analytics/goals/:id/details', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(`
            SELECT 
                e.name as employee_name,
                d.status,
                d.completed_at,
                (SELECT SUM(duration_seconds) FROM user_activity_log WHERE record_id = e.id) as total_time_seconds
            FROM user_demands d
            JOIN employees e ON d.record_id = e.id
            WHERE d.goal_id = $1
        `, [id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ROTA: Performance de Usuários (Time de Auditoria)
router.get('/analytics/users/performance', async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                u.id, u.name, u.photoUrl as photo, u.role,
                COUNT(l.id) as total_actions,
                SUM(l.duration_seconds) as total_time_seconds
            FROM user_activity_log l
            JOIN users u ON l.user_id = u.id
            GROUP BY u.id
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
