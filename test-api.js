/**
 * Script para testar APIs do sistema
 * Porta: 3001
 */

const http = require('http');

// Função para fazer requisição HTTP
function makeRequest(path, description) {
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

        console.log(`\n=== Testando: ${description} ===`);
        console.log(`URL: http://localhost:3001${path}`);

        const req = http.request(options, (res) => {
            console.log(`Status: ${res.statusCode}`);
            console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}`);
            
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    console.log(`Resposta JSON: ${JSON.stringify(parsed, null, 2)}`);
                    
                    // Se tiver dados de unidades, mostrar resumo
                    if (parsed.data && Array.isArray(parsed.data)) {
                        console.log(`\nResumo:`);
                        console.log(`- Total de unidades: ${parsed.data.length}`);
                        
                        let totalActive = 0;
                        let totalInactive = 0;
                        
                        parsed.data.forEach(unit => {
                            totalActive += unit.active_employees || 0;
                            totalInactive += unit.inactive_employees || 0;
                        });
                        
                        console.log(`- Total colaboradores ativos: ${totalActive}`);
                        console.log(`- Total colaboradores inativos: ${totalInactive}`);
                        console.log(`- Total geral: ${totalActive + totalInactive}`);
                        
                        // Mostrar algumas unidades como exemplo
                        console.log(`\nExemplo de unidades:`);
                        parsed.data.slice(0, 3).forEach((unit, index) => {
                            console.log(`${index + 1}. ${unit.unit_name || unit.name}: ${unit.active_employees || 0} ativos, ${unit.inactive_employees || 0} inativos`);
                        });
                    }
                    
                    resolve(parsed);
                } catch (e) {
                    console.log(`Resposta brima (não é JSON): ${data}`);
                    resolve(data);
                }
            });
        });

        req.on('error', (e) => {
            console.error(`Erro na requisição: ${e.message}`);
            reject(e);
        });

        req.setTimeout(5000, () => {
            console.error('Timeout: requisição demorou demais');
            req.destroy();
            reject(new Error('Timeout'));
        });

        req.end();
    });
}

// Testar endpoints principais
async function testAPIs() {
    console.log('Iniciando testes das APIs...');
    console.log('Servidor: http://localhost:3001');
    
    try {
        // Testar API de population units
        await makeRequest('/api/population/units', 'Population Units (Colaboradores por unidade)');
        
        // Testar API de population summary
        await makeRequest('/api/population/summary', 'Population Summary (Resumo geral)');
        
        // Testar API de overtime
        await makeRequest('/api/overtime', 'Overtime (Horas extras)');
        
        console.log('\n=== Testes concluídos com sucesso ===');
        
    } catch (error) {
        console.error('\n=== Erro nos testes ===');
        console.error(error.message);
        
        // Verificar se o servidor está rodando
        console.log('\nVerificando se o servidor está rodando...');
        try {
            await makeRequest('/', 'Raiz do servidor');
        } catch (e) {
            console.log('Servidor não está respondendo. Verifique se está rodando na porta 3001.');
        }
    }
}

// Executar testes
testAPIs();
