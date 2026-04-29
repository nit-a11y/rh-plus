/**
 * Script para Analisar Padrão dos Dados Reais
 */

const { query } = require('../config/database');

/**
 * Dados reais fornecidos pelo usuário
 */
const realData = [
    { unidade: 'NORDESTE LOCAÇÕES - EUSÉBIO', qtd: 7, data: '01/01/2026' },
    { unidade: 'NORDESTE LOCACOES - FORTALEZA', qtd: 63, data: '01/01/2026' },
    { unidade: 'NORDESTE LOCAÇÕES - JUAZEIRO', qtd: 10, data: '01/01/2026' },
    { unidade: 'NORDESTE LOCAÇÕES - SÃO LUÍS', qtd: 18, data: '01/01/2026' },
    { unidade: 'NORDESTE LOCAÇÕES - EUSÉBIO', qtd: 7, data: '01/02/2026' },
    { unidade: 'NORDESTE LOCACOES - FORTALEZA', qtd: 66, data: '01/02/2026' },
    { unidade: 'NORDESTE LOCAÇÕES - JUAZEIRO', qtd: 11, data: '01/02/2026' },
    { unidade: 'NORDESTE LOCAÇÕES - SÃO LUÍS', qtd: 18, data: '01/02/2026' },
    { unidade: 'NORDESTE LOCAÇÕES - EUSÉBIO', qtd: 8, data: '01/03/2026' },
    { unidade: 'NORDESTE LOCACOES - FORTALEZA', qtd: 68, data: '01/03/2026' },
    { unidade: 'NORDESTE LOCAÇÕES - JUAZEIRO', qtd: 11, data: '01/03/2026' },
    { unidade: 'NORDESTE LOCAÇÕES - SÃO LUÍS', qtd: 15, data: '01/03/2026' }
];

/**
 * Analisar padrão dos dados
 */
async function analyzePattern() {
    console.log('🔧 Analisando padrão dos dados reais...\n');
    
    try {
        // 1. Analisar uma unidade específica em detalhe
        console.log('1. Analisando NORDESTE LOCACOES - FORTALEZA em detalhe:');
        
        const fortalezaData = realData.filter(d => d.unidade === 'NORDESTE LOCACOES - FORTALEZA');
        console.log('   Dados esperados:');
        fortalezaData.forEach(d => {
            console.log(`     ${d.data}: ${d.qtd} colaboradores`);
        });
        
        // 2. Verificar todos os colaboradores na unidade
        console.log('\n2. Todos os colaboradores na unidade:');
        const allEmployees = await query(`
            SELECT e.name, e."admissionDate", e."terminationDate", e.type
            FROM employees e
            LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = '1'
            LEFT JOIN companies c ON ev.workplace_id = c.id
            WHERE c.name = $1
            ORDER BY e."admissionDate", e.name
        `, ['NORDESTE LOCACOES - FORTALEZA']);
        
        console.log(`   Total: ${allEmployees.rows.length} colaboradores`);
        
        // 3. Analisar admissões por mês
        console.log('\n3. Admissões por mês:');
        const admissionsByMonth = {};
        
        allEmployees.rows.forEach(emp => {
            if (emp.admissionDate) {
                const month = emp.admissionDate.substring(0, 7); // YYYY-MM
                if (!admissionsByMonth[month]) {
                    admissionsByMonth[month] = [];
                }
                admissionsByMonth[month].push(emp);
            }
        });
        
        Object.keys(admissionsByMonth).sort().forEach(month => {
            console.log(`     ${month}: ${admissionsByMonth[month].length} admissões`);
            admissionsByMonth[month].forEach(emp => {
                console.log(`       - ${emp.name}: ${emp.admissionDate} (${emp.type || 'N/A'})`);
            });
        });
        
        // 4. Analisar desligamentos por mês
        console.log('\n4. Desligamentos por mês:');
        const dismissalsByMonth = {};
        
        allEmployees.rows.forEach(emp => {
            if (emp.type === 'Desligado' && emp.terminationDate) {
                const month = emp.terminationDate.substring(0, 7); // YYYY-MM
                if (!dismissalsByMonth[month]) {
                    dismissalsByMonth[month] = [];
                }
                dismissalsByMonth[month].push(emp);
            }
        });
        
        Object.keys(dismissalsByMonth).sort().forEach(month => {
            console.log(`     ${month}: ${dismissalsByMonth[month].length} desligamentos`);
            dismissalsByMonth[month].forEach(emp => {
                console.log(`       - ${emp.name}: ${emp.admissionDate} → ${emp.terminationDate}`);
            });
        });
        
        // 5. Simular contagem acumulada mês a mês
        console.log('\n5. Simulação de contagem acumulada:');
        const months = ['2026-01', '2026-02', '2026-03'];
        
        for (const month of months) {
            const expectedData = fortalezaData.find(d => d.data.includes(month.substring(5)));
            const expected = expectedData ? expectedData.qtd : 0;
            
            // Contar colaboradores ativos até o final do mês
            let activeCount = 0;
            
            allEmployees.rows.forEach(emp => {
                // Admitido antes ou durante o mês
                const admitted = !emp.admissionDate || emp.admissionDate <= `${month}-31`;
                
                // Não desligado antes do final do mês
                const notDismissed = emp.type !== 'Desligado' || 
                                   !emp.terminationDate || 
                                   emp.terminationDate > `${month}-31`;
                
                if (admitted && notDismissed) {
                    activeCount++;
                }
            });
            
            console.log(`     ${month}: esperado ${expected}, calculado ${activeCount}`);
        }
        
        // 6. Testar diferentes lógicas de contagem
        console.log('\n6. Testando diferentes lógicas:');
        
        // Lógica 1: Acumulado simples
        console.log('\n   Lógica 1 - Acumulado simples:');
        for (const month of months) {
            const expectedData = fortalezaData.find(d => d.data.includes(month.substring(5)));
            const expected = expectedData ? expectedData.qtd : 0;
            
            const result1 = await query(`
                SELECT COUNT(DISTINCT e.id) as count
                FROM employees e
                LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = '1'
                LEFT JOIN companies c ON ev.workplace_id = c.id
                WHERE c.name = $1
                  AND (e."admissionDate" <= $2 OR e."admissionDate" IS NULL)
                  AND (e.type != 'Desligado' OR e."terminationDate" IS NULL OR e."terminationDate" > $3)
            `, ['NORDESTE LOCACOES - FORTALEZA', `${month}-31`, `${month}-31`]);
            
            console.log(`     ${month}: esperado ${expected}, resultado ${result1.rows[0].count}`);
        }
        
        // Lógica 2: Considerando apenas mês corrente
        console.log('\n   Lógica 2 - Apenas mês corrente:');
        for (const month of months) {
            const expectedData = fortalezaData.find(d => d.data.includes(month.substring(5)));
            const expected = expectedData ? expectedData.qtd : 0;
            
            const result2 = await query(`
                SELECT COUNT(DISTINCT e.id) as count
                FROM employees e
                LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = '1'
                LEFT JOIN companies c ON ev.workplace_id = c.id
                WHERE c.name = $1
                  AND e."admissionDate" <= $2
                  AND e."admissionDate" >= $3
                  AND (e.type != 'Desligado' OR e."terminationDate" IS NULL OR e."terminationDate" >= $4)
            `, ['NORDESTE LOCACOES - FORTALEZA', `${month}-31`, `${month}-01`, `${month}-31`]);
            
            console.log(`     ${month}: esperado ${expected}, resultado ${result2.rows[0].count}`);
        }
        
    } catch (error) {
        console.error('❌ Erro na análise:', error);
    }
}

/**
 * Função principal
 */
async function main() {
    try {
        console.log('🔧 Conectando ao banco de dados...');
        await analyzePattern();
        console.log('\n🎉 Análise concluída!');
    } catch (error) {
        console.error('❌ Erro no processo:', error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = {
    analyzePattern,
    realData
};
