const http = require('http');

function checkServerStatus() {
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/health',
        method: 'GET',
        timeout: 5000
    };

    console.log('🔍 Verificando status do servidor...');

    const req = http.request(options, (res) => {
        console.log(`📊 Status: ${res.statusCode}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            if (res.statusCode === 200) {
                console.log('✅ Servidor está online');
                try {
                    const jsonData = JSON.parse(data);
                    console.log('Health check:', jsonData);
                } catch (e) {
                    console.log('Resposta:', data);
                }
            } else {
                console.log('❌ Servidor retornou status:', res.statusCode);
            }
        });
    });

    req.on('error', (e) => {
        console.error('❌ Servidor não está respondendo:', e.message);
        console.log('💡 Execute: npm start ou node server.js');
    });

    req.on('timeout', () => {
        console.error('❌ Timeout ao conectar com o servidor');
        req.destroy();
    });

    req.end();
}

checkServerStatus();
