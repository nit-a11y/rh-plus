const db = require('../database');

function authMiddleware(req, res, next) {
    const sessionId = req.headers['x-session-id'] || req.headers['authorization'];
    
    if (!sessionId) {
        return next();
    }
    
    db.query(`SELECT u.id, u.name, u.username, u.role, u.permissions, u.status FROM users u JOIN user_sessions s ON s.user_id = u.id WHERE s.id = $1 AND s.logout_at IS NULL`, [sessionId])
    .then(result => {
        const user = result.rows[0];
        if (!user) {
            return next();
        }
        
        req.user = {
            id: user.id,
            name: user.name,
            username: user.username,
            role: user.role,
            permissions: JSON.parse(user.permissions || '{}'),
            status: user.status,
            sessionId: sessionId
        };
        
        next();
    })
    .catch(err => {
        return next();
    });
}

module.exports = authMiddleware;
