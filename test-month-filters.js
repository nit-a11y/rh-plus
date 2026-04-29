/**
 * Script para testar filtros por mês nos cards de horas extras
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

// Mapeamento de meses
const MONTH_ORDER = {
    'JANEIRO': 1, 'FEVEREIRO': 2, 'MARÇO': 3, 'ABRIL': 4,
    'MAIO': 5, 'JUNHO': 6, 'JULHO': 7, 'AGOSTO': 8,
    'SETEMBRO': 9, 'OUTUBRO': 10, 'NOVEMBRO': 11, 'DEZEMBRO': 12
};

// Testar filtros por mês
async function testMonthFilters() {
    console.log('=== TESTE DE FILTROS POR MÊS NOS CARDS ===');
    
    try {
        // 1. Testar dados atuais (sem filtro)
        console.log('\n1. TESTE SEM FILTRO (DADOS ATUAIS)');
        const currentData = await makeRequest('/api/population/units', 'Dados Atuais');
        
        if (currentData.success && currentData.data) {
            const totalActive = currentData.data.reduce((sum, unit) => {
                return sum + (parseInt(unit.active_employees) || 0);
            }, 0);
            console.log(`Total de colaboradores ativos (dados atuais): ${totalActive}`);
        }
        
        // 2. Testar dados históricos para meses específicos
        const monthsToTest = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL'];
        const year = '2026';
        
        for (const month of monthsToTest) {
            console.log(`\n2. TESTE MÊS: ${month} ${year}`);
            
            const monthNumber = MONTH_ORDER[month] || 1;
            const startDate = `${year}-${monthNumber.toString().padStart(2, '0')}-01`;
            const endDate = `${year}-${monthNumber.toString().padStart(2, '0')}-31`;
            
            console.log(`Período: ${startDate} a ${endDate}`);
            
            const historyData = await makeRequest(`/api/population/history?start_date=${startDate}&end_date=${endDate}`, `Histórico ${month}`);
            
            if (historyData.success && historyData.data && historyData.data.length > 0) {
                // Agrupar por unidade e pegar o mais recente de cada
                const latestByUnit = {};
                historyData.data.forEach(record => {
                    const unitName = record.unit_name || '';
                    if (unitName) {
                        if (!latestByUnit[unitName] || 
                            new Date(record.record_date) > new Date(latestByUnit[unitName].record_date)) {
                            latestByUnit[unitName] = record;
                        }
                    }
                });
                
                const totalActiveHistorical = Object.values(latestByUnit).reduce((sum, record) => {
                    return sum + (parseInt(record.active_employees) || 0);
                }, 0);
                
                console.log(`Total de colaboradores ativos (${month}): ${totalActiveHistorical}`);
                console.log(`Registros encontrados: ${historyData.data.length}`);
                
                // Mostrar algumas unidades como exemplo
                console.log('Exemplo de unidades:');
                Object.entries(latestByUnit).slice(0, 3).forEach(([unitName, record]) => {
                    console.log(`  ${unitName}: ${record.active_employees} ativos (${record.record_date})`);
                });
            } else {
                console.log(`Nenhum dado encontrado para ${month}`);
            }
        }
        
        // 3. Testar horas extras por mês
        console.log('\n3. TESTE HORAS EXTRAS POR MÊS');
        const overtimeData = await makeRequest('/api/overtime', 'Horas Extras');
        
        if (overtimeData.success && overtimeData.data) {
            // Agrupar horas extras por mês
            const overtimeByMonth = {};
            overtimeData.data.forEach(record => {
                const monthYear = record.mes || record.MES || '';
                if (monthYear) {
                    if (!overtimeByMonth[monthYear]) {
                        overtimeByMonth[monthYear] = {
                            records: 0,
                            totalMinutes: 0,
                            units: new Set()
                        };
                    }
                    
                    overtimeByMonth[monthYear].records += 1;
                    overtimeByMonth[monthYear].units.add(record.unidade || record.UNIDADE);
                    
                    const timeStr = record.extra || record.EXTRA || record.overtime_time;
                    if (timeStr?.includes(':')) {
                        const [h, m] = timeStr.split(':').map(Number);
                        overtimeByMonth[monthYear].totalMinutes += (h * 60) + m;
                    }
                }
            });
            
            console.log('Horas extras por mês:');
            Object.entries(overtimeByMonth).forEach(([month, data]) => {
                const hours = Math.floor(data.totalMinutes / 60);
                const minutes = Math.round(data.totalMinutes % 60);
                console.log(`  ${month}: ${hours}:${minutes.toString().padStart(2, '0')} (${data.records} registros, ${data.units.size} unidades)`);
            });
        }
        
        // 4. Simulação de cálculo para um mês específico
        console.log('\n4. SIMULAÇÃO CÁLCULO PARA ABRIL 2026');
        const aprilStart = '2026-04-01';
        const aprilEnd = '2026-04-30';
        
        const aprilHistory = await makeRequest(`/api/population/history?start_date=${aprilStart}&end_date=${aprilEnd}`, 'Histórico Abril 2026');
        
        if (aprilHistory.success && aprilHistory.data) {
            // Processar dados de abril
            const latestByUnit = {};
            aprilHistory.data.forEach(record => {
                const unitName = record.unit_name || '';
                if (unitName) {
                    if (!latestByUnit[unitName] || 
                        new Date(record.record_date) > new Date(latestByUnit[unitName].record_date)) {
                        latestByUnit[unitName] = record;
                    }
                }
            });
            
            const totalActiveApril = Object.values(latestByUnit).reduce((sum, record) => {
                return sum + (parseInt(record.active_employees) || 0);
            }, 0);
            
            const expectedHoursApril = totalActiveApril * 220;
            
            // Buscar horas extras de abril
            const aprilOvertime = overtimeData.data.filter(record => {
                const monthYear = record.mes || record.MES || '';
                return monthYear.includes('ABRIL') && monthYear.includes('2026');
            });
            
            const aprilExtraMinutes = aprilOvertime.reduce((total, record) => {
                const timeStr = record.extra || record.EXTRA || record.overtime_time;
                if (timeStr?.includes(':')) {
                    const [h, m] = timeStr.split(':').map(Number);
                    return total + (h * 60) + m;
                }
                return total;
            }, 0);
            
            const aprilPercentage = expectedHoursApril > 0 ? (aprilExtraMinutes / (expectedHoursApril * 60)) * 100 : 0;
            
            console.log(`Resultados para ABRIL 2026:`);
            console.log(`  Colaboradores ativos: ${totalActiveApril}`);
            console.log(`  Horas esperadas: ${expectedHoursApril}:00`);
            console.log(`  Horas extras: ${Math.floor(aprilExtraMinutes / 60)}:${(aprilExtraMinutes % 60).toString().padStart(2, '0')}`);
            console.log(`  % extras vs esperado: ${aprilPercentage.toFixed(1)}%`);
        }
        
        console.log('\n=== TESTE CONCLUÍDO ===');
        console.log('Os cards devem agora se atualizar corretamente quando filtros de mês/ano são aplicados.');
        
    } catch (error) {
        console.error('Erro no teste de filtros:', error.message);
    }
}

// Executar teste
testMonthFilters();
