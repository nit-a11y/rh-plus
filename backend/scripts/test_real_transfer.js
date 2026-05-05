// Teste real da API de transferência via HTTP
const http = require('http');

function testRealTransfer() {
    const postData = JSON.stringify({
        to_employer_id: "edcfae9a",
        to_workplace_id: "u2",
        reason: "TESTE AUTOMATIZADO - Refatoração do sistema",
        changed_by: "Sistema Teste"
    });

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/transfers/employee/54df5d4c',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    console.log('🔄 Enviando requisição POST para transferência...');
    console.log('URL:', `http://${options.hostname}:${options.port}${options.path}`);
    console.log('Payload:', postData);

    const req = http.request(options, (res) => {
        console.log(`📊 Status: ${res.statusCode}`);
        console.log('Headers:', res.headers);

        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            console.log('📝 Resposta:', data);
            
            try {
                const jsonData = JSON.parse(data);
                if (res.statusCode === 200) {
                    console.log('✅ Transferência realizada com sucesso!');
                    console.log('Dados:', JSON.stringify(jsonData, null, 2));
                } else {
                    console.log('❌ Erro na transferência:');
                    console.log('Erro:', jsonData.error || 'Erro desconhecido');
                }
            } catch (e) {
                console.log('❌ Erro ao parsear JSON:', e.message);
                console.log('Resposta bruta:', data);
            }
        });
    });

    req.on('error', (e) => {
        console.error('❌ Erro na requisição:', e.message);
    });

    req.write(postData);
    req.end();
}

testRealTransfer();
