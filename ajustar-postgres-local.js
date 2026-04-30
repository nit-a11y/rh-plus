// Script para ajustar código local para compatibilidade PostgreSQL
const fs = require('fs');
const path = require('path');

console.log('=== AJUSTANDO CÓDIGO LOCAL PARA POSTGRESQL ===\n');

// 1. Ajustar middleware de autenticação
console.log('1. Ajustando middleware de autenticação...');
const authMiddlewarePath = path.join(__dirname, 'backend', 'middleware', 'auth.js');
if (fs.existsSync(authMiddlewarePath)) {
    let authContent = fs.readFileSync(authMiddlewarePath, 'utf8');
    
    // Substituir sintaxe SQLite por PostgreSQL
    authContent = authContent.replace(
        /db\.get\(`SELECT u\.id, u\.name, u\.username, u\.role, u\.permissions, u\.status \s*FROM users u \s*JOIN user_sessions s ON s\.user_id = u\.id \s*WHERE s\.id = \? AND s\.logout_at IS NULL`, \[sessionId\]/g,
        'db.query(`SELECT u.id, u.name, u.username, u.role, u.permissions, u.status FROM users u JOIN user_sessions s ON s.user_id = u.id WHERE s.id = $1 AND s.logout_at IS NULL`, [sessionId])'
    );
    
    authContent = authContent.replace('db.get', 'db.query');
    
    fs.writeFileSync(authMiddlewarePath, authContent);
    console.log('   Middleware de autenticação ajustado');
}

// 2. Ajustar rotas de autenticação
console.log('2. Ajustando rotas de autenticação...');
const authRoutesPath = path.join(__dirname, 'backend', 'routes', 'auth.js');
if (fs.existsSync(authRoutesPath)) {
    let authContent = fs.readFileSync(authRoutesPath, 'utf8');
    
    // Ajustar nomes de colunas para minúsculo (compatibilidade PostgreSQL)
    authContent = authContent.replace(/"photourl"/g, 'photourl');
    authContent = authContent.replace(/"currentThemeId"/g, 'currentthemeid');
    authContent = authContent.replace(/"createdAt"/g, 'createdat');
    authContent = authContent.replace(/"lastLogin"/g, 'lastlogin');
    
    fs.writeFileSync(authRoutesPath, authContent);
    console.log('   Rotas de autenticação ajustadas');
}

// 3. Ajustar server.js para mover authRoutes antes do middleware
console.log('3. Ajustando server.js...');
const serverPath = path.join(__dirname, 'backend', 'server.js');
if (fs.existsSync(serverPath)) {
    let serverContent = fs.readFileSync(serverPath, 'utf8');
    
    // Mover authRoutes para antes do middleware
    const authMiddlewareIndex = serverContent.indexOf('app.use(\'/api\', authMiddleware);');
    const authRoutesIndex = serverContent.indexOf('const authRoutes = require(\'./routes/auth\');');
    
    if (authMiddlewareIndex !== -1 && authRoutesIndex !== -1) {
        // Remover authRoutes da posição atual
        const authRoutesLine = serverContent.substring(authRoutesIndex, serverContent.indexOf('\n', authRoutesIndex) + 1);
        serverContent = serverContent.replace(authRoutesLine, '');
        
        // Adicionar authRoutes antes do middleware
        const authMiddlewareLine = 'app.use(\'/api\', authMiddleware);';
        const newAuthRoutesLine = 'const authRoutes = require(\'./routes/auth\');\n\napp.use(\'/api\', authRoutes);\n\n';
        serverContent = serverContent.replace(authMiddlewareLine, newAuthRoutesLine + authMiddlewareLine);
        
        fs.writeFileSync(serverPath, serverContent);
        console.log('   Server.js ajustado - authRoutes movida antes do middleware');
    }
}

console.log('\n=== AJUSTES CONCLUÍDOS ===');
console.log('Agora teste o sistema local antes de fazer deploy para VPS');
