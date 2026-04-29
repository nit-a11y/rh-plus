/**
 * Script para testar a integração completa dos cards de horas extras
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

// Converter string de tempo HH:MM para minutos
function timeToMinutes(timeStr) {
    if (!timeStr || !timeStr.includes(':')) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours * 60) + minutes;
}

// Formatar minutos para HH:MM
function formatTime(totalMinutes) {
    if (totalMinutes === 0) return '00:00';
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// Testar integração completa
async function testIntegration() {
    console.log('=== TESTE DE INTEGRAÇÃO DOS CARDS DE HORAS EXTRAS ===');
    
    try {
        // 1. Buscar dados de horas extras
        const overtimeData = await makeRequest('/api/overtime', 'Horas Extras');
        
        if (!overtimeData.success || !overtimeData.data) {
            throw new Error('Não foi possível buscar dados de horas extras');
        }
        
        console.log(`\n=== DADOS DE HORAS EXTRAS ===`);
        console.log(`Total de registros: ${overtimeData.data.length}`);
        
        // 2. Buscar dados de colaboradores ativos
        const populationData = await makeRequest('/api/population/units', 'Colaboradores por Unidade');
        
        if (!populationData.success || !populationData.data) {
            throw new Error('Não foi possível buscar dados de colaboradores');
        }
        
        console.log(`\n=== DADOS DE COLABORADORES ===`);
        console.log(`Total de unidades: ${populationData.data.length}`);
        
        // 3. Mapear colaboradores ativos por unidade
        const activeEmployeesByUnit = {};
        populationData.data.forEach(unit => {
            const unitName = unit.unit_name || unit.name || '';
            if (unitName) {
                activeEmployeesByUnit[unitName] = parseInt(unit.active_employees) || 0;
            }
        });
        
        console.log('\n=== MAPEAMENTO DE UNIDADES ===');
        Object.entries(activeEmployeesByUnit).forEach(([unit, activeCount]) => {
            console.log(`${unit}: ${activeCount} colaboradores ativos`);
        });
        
        // 4. Calcular totais de horas extras
        let totalExtraMinutes = 0;
        const uniqueUnits = [...new Set(overtimeData.data.map(r => r.unidade || r.UNIDADE).filter(Boolean))];
        
        overtimeData.data.forEach(record => {
            const timeStr = record.extra || record.EXTRA || record.overtime_time;
            if (timeStr?.includes(':')) {
                totalExtraMinutes += timeToMinutes(timeStr);
            }
        });
        
        console.log(`\n=== CÁLCULOS DE HORAS ===`);
        console.log(`Total de horas extras: ${formatTime(totalExtraMinutes)} (${totalExtraMinutes} minutos)`);
        console.log(`Unidades com horas extras: ${uniqueUnits.length}`);
        
        // 5. Calcular horas esperadas e porcentagem
        let totalExpectedHours = 0;
        let totalActiveEmployees = 0;
        
        uniqueUnits.forEach(unitName => {
            let activeEmployees = activeEmployeesByUnit[unitName] || 0;
            
            // Tentar correspondência aproximada se não encontrar exata
            if (activeEmployees === 0) {
                const normalizedUnitName = unitName.toUpperCase().trim();
                const matchingKey = Object.keys(activeEmployeesByUnit).find(key => 
                    key.toUpperCase().trim() === normalizedUnitName ||
                    key.toUpperCase().trim().includes(normalizedUnitName) ||
                    normalizedUnitName.includes(key.toUpperCase().trim())
                );
                if (matchingKey) {
                    activeEmployees = activeEmployeesByUnit[matchingKey];
                    console.log(`Correspondência encontrada: "${unitName}" -> "${matchingKey}" (${activeEmployees} ativos)`);
                }
            }
            
            totalActiveEmployees += activeEmployees;
            totalExpectedHours += activeEmployees * 220;
        });
        
        const expectedMinutes = totalExpectedHours * 60;
        let extraPercentage = 0;
        if (expectedMinutes > 0) {
            extraPercentage = (totalExtraMinutes / expectedMinutes) * 100;
        }
        
        console.log(`\n=== RESULTADOS FINAIS ===`);
        console.log(`Total de colaboradores ativos (nas unidades com extras): ${totalActiveEmployees}`);
        console.log(`Horas esperadas (220h por ativo): ${formatTime(expectedMinutes)}`);
        console.log(`Porcentagem de extras vs esperado: ${extraPercentage.toFixed(1)}%`);
        
        // 6. Simular atualização dos cards
        console.log(`\n=== SIMULAÇÃO DOS CARDS ===`);
        console.log(`Card "Colaboradores Ativos": ${totalActiveEmployees}`);
        console.log(`Card "Horas Esperadas": ${formatTime(expectedMinutes)}`);
        console.log(`Card "% Extras vs Esperado": ${extraPercentage.toFixed(1)}%`);
        
        // 7. Indicador visual
        let cardColor = 'Verde';
        if (extraPercentage > 100) {
            cardColor = 'Vermelho (excesso)';
        } else if (extraPercentage > 80) {
            cardColor = 'Laranja (atenção)';
        }
        console.log(`Cor do card %: ${cardColor}`);
        
        // 8. Análise final
        console.log(`\n=== ANÁLISE ===`);
        if (totalActiveEmployees === 0) {
            console.log('!!! ATENÇÃO: Nenhum colaborador ativo encontrado para as unidades com horas extras !!!');
            console.log('Verifique se os nomes das unidades correspondem entre as duas bases de dados.');
        } else if (extraPercentage === 0) {
            console.log('!!! ATENÇÃO: Porcentagem de extras é 0% !!!');
            console.log('Verifique se há dados de horas extras ou se os cálculos estão corretos.');
        } else {
            console.log('Integração funcionando corretamente!');
            console.log(`Os cards devem mostrar os dados calculados acima.`);
        }
        
    } catch (error) {
        console.error('Erro no teste de integração:', error.message);
    }
}

// Executar teste
testIntegration();
