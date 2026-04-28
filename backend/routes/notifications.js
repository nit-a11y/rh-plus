/**
 * 🔔 API: Notificações do Sistema
 * Gerencia notificações de onboarding e outros módulos
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// Criar tabela de notificações se não existir
async function ensureTable() {
    await query(`
        CREATE TABLE IF NOT EXISTS notifications (
            id SERIAL PRIMARY KEY,
            employee_id INTEGER,
            employee_name VARCHAR(255),
            step_momento VARCHAR(50),
            step_nome VARCHAR(255),
            type VARCHAR(50) NOT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT,
            priority VARCHAR(20) DEFAULT 'medium',
            readed BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            readed_at TIMESTAMP
        )
    `);
}

// Garantir tabela existe
ensureTable().catch(console.error);

// GET /api/notifications - Listar notificações
router.get('/', async (req, res) => {
    try {
        const { unreadonly, limit = 20 } = req.query;
        
        let sql = 'SELECT * FROM notifications';
        const params = [];
        
        if (unreadonly === 'true') {
            sql += ' WHERE readed = FALSE';
        }
        
        sql += ' ORDER BY created_at DESC LIMIT $1';
        params.push(parseInt(limit));
        
        const result = await query(sql, params);
        
        const unreadRes = await query('SELECT COUNT(*) as count FROM notifications WHERE readed = FALSE');
        const unreadCount = parseInt(unreadRes.rows[0].count);
        
        res.json({ 
            notifications: result.rows, 
            unreadCount 
        });
    } catch (err) {
        console.error('Erro ao buscar notificações:', err);
        res.status(500).json({ error: 'Erro ao buscar notificações' });
    }
});

// GET /api/notifications/onboarding - Notificações de onboarding (etapas pendentes/atrasadas)
router.get('/onboarding', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        const result = await query(`
            SELECT 
                n.*,
                e.name as employee_name,
                e.admissionDate,
                e.role,
                e.photoUrl
            FROM notifications n
            LEFT JOIN employees e ON n.employee_id = e.id
            WHERE n.type LIKE 'onboarding%'
            ORDER BY n.created_at DESC
            LIMIT 50
        `);
        
        res.json({ notifications: result.rows });
    } catch (err) {
        console.error('Erro ao buscar notificações de onboarding:', err);
        res.status(500).json({ error: 'Erro ao buscar notificações' });
    }
});

// POST /api/notifications - Criar nova notificação
router.post('/', async (req, res) => {
    try {
        const { employee_id, employee_name, step_momento, step_nome, type, title, message, priority = 'medium' } = req.body;
        
        if (!type || !title) {
            return res.status(400).json({ error: 'Tipo e título são obrigatórios' });
        }
        
        const result = await query(`
            INSERT INTO notifications 
            (employee_id, employee_name, step_momento, step_nome, type, title, message, priority)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `, [employee_id, employee_name, step_momento, step_nome, type, title, message, priority]);
        
        res.json({ notification: result.rows[0] });
    } catch (err) {
        console.error('Erro ao criar notificação:', err);
        res.status(500).json({ error: 'Erro ao criar notificação' });
    }
});

// PUT /api/notifications/:id/read - Marcar como lida
router.put('/:id/read', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await query(`
            UPDATE notifications 
            SET readed = TRUE, readed_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Notificação não encontrada' });
        }
        
        res.json({ notification: result.rows[0] });
    } catch (err) {
        console.error('Erro ao marcar notificação como lida:', err);
        res.status(500).json({ error: 'Erro ao marcar notificação como lida' });
    }
});

// PUT /api/notifications/read-all - Marcar todas como lidas
router.put('/read-all', async (req, res) => {
    try {
        await query(`
            UPDATE notifications 
            SET readed = TRUE, readed_at = CURRENT_TIMESTAMP
            WHERE readed = FALSE
        `);
        
        res.json({ success: true });
    } catch (err) {
        console.error('Erro ao marcar todas como lidas:', err);
        res.status(500).json({ error: 'Erro ao marcar todas como lidas' });
    }
});

// DELETE /api/notifications/:id - Deletar notificação
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        await query('DELETE FROM notifications WHERE id = $1', [id]);
        
        res.json({ success: true });
    } catch (err) {
        console.error('Erro ao deletar notificação:', err);
        res.status(500).json({ error: 'Erro ao deletar notificação' });
    }
});

// DELETE /api/notifications/clear-all - Limpar todas as notificações lidas
router.delete('/clear-all/readed', async (req, res) => {
    try {
        await query('DELETE FROM notifications WHERE readed = TRUE');
        
        res.json({ success: true });
    } catch (err) {
        console.error('Erro ao limpar notificações:', err);
        res.status(500).json({ error: 'Erro ao limpar notificações' });
    }
});

module.exports = router;