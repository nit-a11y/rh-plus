
const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const crypto = require('crypto');

function getClientIp(req) {
    return req.headers['x-forwarded-for'] || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
}

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const sql = `SELECT id, name, username, "photoUrl", role, permissions FROM users WHERE username = $1 AND password = $2`;
        
        const result = await query(sql, [username, password]);
        const user = result.rows[0];
        
        if (!user) {
            return res.status(401).json({ error: 'Usuário ou senha inválidos' });
        }
        
        const now = new Date().toISOString();
        const ipAddress = getClientIp(req);
        const userAgent = req.headers['user-agent'] || 'unknown';
        
        await query(`UPDATE users SET login_time = $1 WHERE id = $2`, [now, user.id]);
        
        const sessionId = crypto.randomBytes(16).toString('hex');
        await query(`INSERT INTO user_sessions (id, user_id, login_at, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)`,
            [sessionId, user.id, now, ipAddress, userAgent]);
        
        res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                username: user.username,
                photoUrl: user.photoUrl,
                role: user.role,
                permissions: user.permissions ? JSON.parse(user.permissions) : {},
                sessionId: sessionId
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/logout', async (req, res) => {
    try {
        const { sessionId, userId } = req.body;
        
        if (sessionId) {
            const logoutTime = new Date().toISOString();
            
            const sessionResult = await query(`SELECT login_at FROM user_sessions WHERE id = $1`, [sessionId]);
            const session = sessionResult.rows[0];
            
            if (session) {
                const loginTime = new Date(session.login_at);
                const logoutTimeDate = new Date(logoutTime);
                const durationSeconds = Math.floor((logoutTimeDate - loginTime) / 1000);
                
                await query(`UPDATE user_sessions SET logout_at = $1, duration_seconds = $2 WHERE id = $3`, 
                    [logoutTime, durationSeconds, sessionId]);
            }
            
            if (userId) {
                await query(`UPDATE users SET login_time = NULL WHERE id = $1`, [userId]);
            }
        }
    
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
