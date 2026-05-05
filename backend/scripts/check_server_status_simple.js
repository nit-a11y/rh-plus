const http = require('http');

function checkServerStatus() {
    console.log('🔍 Verificando se servidor está online...');
    
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/health',
        method: 'GET',
        timeout: 3000
    };

    const req = http.request(options, (res) => {
        console.log(`📊 Status: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
            console.log('✅ Servidor está online');
        } else {
            console.log('⚠️ Servidor respondeu com status:', res.statusCode);
        }
    });

    req.on('error', (e) => {
        console.error('❌ Servidor não está respondendo:', e.message);
        console.log('💡 Execute: npm start ou node server.js');
        console.log('💡 Ou verifique se há outro processo usando a porta 3000');
    });

    req.on('timeout', () => {
        console.error('❌ Timeout ao conectar com o servidor');
        req.destroy();
    });

    req.end();
}

checkServerStatus();
