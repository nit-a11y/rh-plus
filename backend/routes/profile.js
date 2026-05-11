
const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const crypto = require('crypto');

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

function getClientIp(req) {
    return req.headers['x-forwarded-for'] || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
}

// =========================================
// ROTAS SEM PARAMETROS (devem vir primeiro)
// =========================================

// Test endpoint
router.get('/test', (req, res) => {
    res.json({ success: true, message: 'Profile API funcionando!' });
});

// Listar todos os usuários do sistema
router.get('/all-users', async (req, res) => {
    try {
        const result = await query(`SELECT id, name, username, photoUrl, role, permissions, status, createdAt, lastLogin FROM users ORDER BY name ASC`);
        res.json(result.rows || []);
    } catch (err) {
        console.error('[PROFILE] Erro:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Criar novo usuário
router.post('/', async (req, res) => {
    try {
        const { name, username, password, role, status } = req.body;
        if (!name || !username || !password) return res.status(400).json({ error: 'Campos obrigatórios ausentes' });

        const id = crypto.randomBytes(4).toString('hex');
        const hashedPassword = hashPassword(password);
        const now = new Date().toISOString();

        await query(
            `INSERT INTO users (id, name, username, password, role, permissions, status, createdAt) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [id, name, username, hashedPassword, role || 'OPERADOR', '{}', status || 'active', now]
        );
        
        res.json({ success: true, id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =========================================
// ROTAS COM PARAMETROS (devem vir por ultimo)
// =========================================

// Atualizar permissões de um usuário
router.put('/:id/permissions', async (req, res) => {
    try {
        const { id } = req.params;
        const { permissions } = req.body;
        
        await query(`UPDATE users SET permissions = $1 WHERE id = $2`, [JSON.stringify(permissions), id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Atualizar usuário
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, username, role, status } = req.body;

        const userResult = await query(`SELECT * FROM users WHERE id = $1`, [id]);
        if (!userResult.rows[0]) return res.status(404).json({ error: 'Usuário não encontrado' });

        await query(`UPDATE users SET name = $1, username = $2, role = $3, status = $4 WHERE id = $5`, [name, username, role, status, id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Resetar senha
router.put('/:id/password', async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;
        if (!password) return res.status(400).json({ error: 'Senha obrigatória' });

        const hashedPassword = hashPassword(password);
        await query(`UPDATE users SET password = $1 WHERE id = $2`, [hashedPassword, id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Deletar usuário
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await query(`DELETE FROM users WHERE id = $1`, [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET - Obter dados de um usuário específico
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(`SELECT id, name, username, photoUrl, role, permissions, status FROM users WHERE id = $1`, [id]);
        if (!result.rows[0]) return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
        res.json({ success: true, user: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// =========================================
// INICIALIZAÇÃO - Criar usuário admin padrão se não existir
// =========================================
async function initDefaultUsers() {
    try {
        const result = await query(`SELECT COUNT(*) as cnt FROM users`);
        if (parseInt(result.rows[0].cnt) === 0) {
            const adminId = crypto.randomBytes(4).toString('hex');
            const adminPassword = hashPassword('admin123');
            const now = new Date().toISOString();
            
            await query(
                `INSERT INTO users (id, name, username, password, role, permissions, status, createdAt) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT DO NOTHING`,
                [adminId, 'Administrador', 'admin', adminPassword, 'GESTOR', '{}', 'active', now]
            );
            console.log('[PROFILE] Usuário admin padrão criado');
        }
    } catch (err) {
        console.error('[PROFILE] Erro ao criar usuário admin:', err.message);
    }
}

setTimeout(initDefaultUsers, 1000);

module.exports = router;
