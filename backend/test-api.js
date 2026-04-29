/**
 * 🧪 Script de Teste da API Employee Counter
 * Testa endpoints diretamente com Node.js
 */

const http = require('http');

// Função para fazer requisição HTTP simples
function makeRequest(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: path,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
}

// Testar endpoints
async function testEndpoints() {
    console.log('🧪 Iniciando testes da API Employee Counter...\n');

    try {
        // Teste 1: Eusébio (espera 7 colaboradores)
        console.log('📍 Teste 1: /api/employee-counter/test-eusebio');
        const result1 = await makeRequest('/api/employee-counter/test-eusebio');
        console.log('Resultado:', result1);
        console.log('Esperado: 7 colaboradores');
        console.log('Correto:', result1.data?.total_colaboradores === 7 ? '✅' : '❌');
        console.log('');

        // Teste 2: Todos os períodos
        console.log('📍 Teste 2: /api/employee-counter/test-all-periods');
        const result2 = await makeRequest('/api/employee-counter/test-all-periods');
        console.log('Resumo:', result2.summary);
        console.log('');

        // Teste 3: Debug Eusébio
        console.log('📍 Teste 3: /api/employee-counter/debug-eusebio');
        const result3 = await makeRequest('/api/employee-counter/debug-eusebio');
        console.log('Total bruto:', result3.total_bruto);
        console.log('Total filtrado:', result3.total_filtrado);
        console.log('Esperado: 7');
        console.log('Correto:', result3.total_filtrado === 7 ? '✅' : '❌');
        console.log('');

        // Teste 4: Contagem simples
        console.log('📍 Teste 4: /api/employee-counter/count?unit=NORDESTE LOCAÇÕES - EUSÉBIO&year=2026&month=JANEIRO');
        const result4 = await makeRequest('/api/employee-counter/count?unit=NORDESTE%20LOCA%C3%87ES%20-%20EUS%C3%89BIO&year=2026&month=JANEIRO');
        console.log('Resultado:', result4);
        console.log('');

    } catch (error) {
        console.error('❌ Erro nos testes:', error.message);
    }
}

// Executar testes
testEndpoints();
