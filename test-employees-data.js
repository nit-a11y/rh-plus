/**
 * Script para testar dados de colaboradores no banco
 */

const http = require('http');

// Função para fazer requisição HTTP
function makeRequest(path, description) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: path,
            method: 'GET'
        };

        console.log(`\n=== Testando: ${description} ===`);
        console.log(`URL: http://localhost:3001${path}`);

        const req = http.request(options, (res) => {
            console.log(`Status: ${res.statusCode}`);
            
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    console.log(`Resposta JSON: ${JSON.stringify(parsed, null, 2)}`);
                    resolve(parsed);
                } catch (e) {
                    console.log(`Resposta bruta: ${data}`);
                    resolve(data);
                }
            });
        });

        req.on('error', (e) => {
            console.error(`Erro na requisição: ${e.message}`);
            reject(e);
        });

        req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('Timeout'));
        });

        req.end();
    });
}

// Testar dados de colaboradores
async function testEmployeesData() {
    console.log('Investigando dados de colaboradores...');
    
    try {
        // Testar summary para ver dados gerais
        const summary = await makeRequest('/api/population/summary', 'Population Summary');
        
        if (summary.success && summary.data) {
            console.log('\n=== DADOS GERAIS ===');
            console.log(`Total de unidades: ${summary.data.total_units}`);
            console.log(`Total de colaboradores: ${summary.data.total_employees}`);
            console.log(`Colaboradores ativos: ${summary.data.active_employees}`);
            console.log(`Colaboradores inativos: ${summary.data.inactive_employees}`);
            
            if (summary.data.active_employees === 0) {
                console.log('\n!!! ATENÇÃO: Não há colaboradores ativos !!!');
                console.log('Verificando se há dados na tabela employees...');
                
                // Vamos verificar se há algum dado de employees
                try {
                    // Tentar buscar uma amostra de dados de employees
                    const sampleResponse = await makeRequest('/api/employees?limit=5', 'Amostra de Employees');
                    console.log('\n=== AMOSTRA DE EMPLOYEES ===');
                    if (sampleResponse.success && sampleResponse.data && sampleResponse.data.length > 0) {
                        console.log('Encontrados dados de employees. Amostra:');
                        sampleResponse.data.forEach((emp, index) => {
                            console.log(`${index + 1}. ID: ${emp.id}, Nome: ${emp.name}, Tipo: ${emp.type}, Workplace: ${emp.workplace_id}`);
                        });
                        
                        // Verificar os tipos de employees
                        const types = [...new Set(sampleResponse.data.map(e => e.type))];
                        console.log(`\nTipos encontrados: ${types.join(', ')}`);
                        
                        if (!types.includes('Desligado')) {
                            console.log('!!! PROVÁVEL PROBLEMA: Não existe tipo "Desligado" nos dados !!!');
                            console.log('Todos os colaboradores podem estar sendo contados como "ativos"');
                        }
                    } else {
                        console.log('Não foram encontrados dados de employees');
                    }
                } catch (e) {
                    console.log('Não foi possível buscar dados de employees:', e.message);
                }
            }
        }
        
        // Testar units para ver estrutura
        const units = await makeRequest('/api/population/units', 'Population Units');
        
        if (units.success && units.data && units.data.length > 0) {
            console.log('\n=== ANÁLISE DAS UNIDADES ===');
            console.log(`Total de unidades retornadas: ${units.data.length}`);
            
            // Verificar primeiras unidades
            const sampleUnits = units.data.slice(0, 3);
            sampleUnits.forEach((unit, index) => {
                console.log(`\nUnidade ${index + 1}:`);
                console.log(`  ID: ${unit.unit_id}`);
                console.log(`  Nome: ${unit.unit_name}`);
                console.log(`  Total employees: ${unit.total_employees}`);
                console.log(`  Active employees: ${unit.active_employees}`);
                console.log(`  Inactive employees: ${unit.inactive_employees}`);
                console.log(`  Active %: ${unit.active_percentage}%`);
            });
            
            // Contar totais
            const totals = units.data.reduce((acc, unit) => {
                acc.total += unit.total_employees || 0;
                acc.active += unit.active_employees || 0;
                acc.inactive += unit.inactive_employees || 0;
                return acc;
            }, { total: 0, active: 0, inactive: 0 });
            
            console.log('\n=== TOTAIS POR UNIDADE ===');
            console.log(`Soma total de employees: ${totals.total}`);
            console.log(`Soma de ativos: ${totals.active}`);
            console.log(`Soma de inativos: ${totals.inactive}`);
        }
        
    } catch (error) {
        console.error('Erro na investigação:', error.message);
    }
}

// Executar investigação
testEmployeesData();
