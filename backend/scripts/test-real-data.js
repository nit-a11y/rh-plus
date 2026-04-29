/**
 * Script para Testar Contagem com Dados Reais Fornecidos
 */

const { query } = require('../config/database');

/**
 * Dados reais fornecidos pelo usuário
 */
const realData = [
    { unidade: 'Eusébio', qtd: 7, data: '01/01/2026' },
    { unidade: 'Fortaleza', qtd: 63, data: '01/01/2026' },
    { unidade: 'Juazeiro do Norte', qtd: 10, data: '01/01/2026' },
    { unidade: 'São Luís', qtd: 18, data: '01/01/2026' },
    { unidade: 'Eusébio', qtd: 7, data: '01/02/2026' },
    { unidade: 'Fortaleza', qtd: 66, data: '01/02/2026' },
    { unidade: 'Juazeiro do Norte', qtd: 11, data: '01/02/2026' },
    { unidade: 'São Luís', qtd: 18, data: '01/02/2026' },
    { unidade: 'Eusébio', qtd: 8, data: '01/03/2026' },
    { unidade: 'Fortaleza', qtd: 68, data: '01/03/2026' },
    { unidade: 'Juazeiro do Norte', qtd: 11, data: '01/03/2026' },
    { unidade: 'São Luís', qtd: 15, data: '01/03/2026' }
];

/**
 * Função para converter data do formato DD/MM/YYYY para YYYY-MM-DD
 */
function convertDate(dateStr) {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
}

/**
 * Função para converter data para mês-ano
 */
function dateToMonthYear(dateStr) {
    const [day, month, year] = dateStr.split('/');
    const monthNames = {
        '01': 'JANEIRO', '02': 'FEVEREIRO', '03': 'MARCO',
        '04': 'ABRIL', '05': 'MAIO', '06': 'JUNHO',
        '07': 'JULHO', '08': 'AGOSTO', '09': 'SETEMBRO',
        '10': 'OUTUBRO', '11': 'NOVEMBRO', '12': 'DEZEMBRO'
    };
    return `${monthNames[month]} ${year}`;
}

/**
 * Testar contagem com dados reais
 */
async function testRealData() {
    console.log('🔧 Testando contagem com dados reais fornecidos...\n');
    
    try {
        // 1. Verificar unidades existentes no banco
        console.log('1. Verificando unidades no banco:');
        const unitsResult = await query(`
            SELECT DISTINCT c.name, COUNT(DISTINCT e.id) as total_employees
            FROM companies c
            LEFT JOIN employee_vinculos ev ON c.id = ev.workplace_id AND ev.principal = '1'
            LEFT JOIN employees e ON ev.employee_id = e.id
            WHERE c.name IS NOT NULL
            GROUP BY c.name
            ORDER BY c.name
        `);
        
        console.log('   Unidades encontradas:');
        unitsResult.rows.forEach(unit => {
            console.log(`   - ${unit.name}: ${unit.total_employees} colaboradores`);
        });
        
        // 2. Testar cada combinação dos dados reais
        console.log('\n2. Testando combinações dos dados reais:');
        
        for (const data of realData) {
            const monthYear = dateToMonthYear(data.data);
            const month = monthYear.split(' ')[0];
            const year = monthYear.split(' ')[1];
            
            console.log(`\n   Testando: ${data.unidade} - ${monthYear} (esperado: ${data.qtd})`);
            
            // Testar com a função atual
            const { countActiveEmployees } = require('../routes/overtime-fixed');
            const actualCount = await countActiveEmployees(month, year, data.unidade);
            
            console.log(`     Resultado atual: ${actualCount}`);
            console.log(`     Diferença: ${actualCount - data.qtd}`);
            
            if (actualCount === data.qtd) {
                console.log(`     ✅ CORRETO!`);
            } else {
                console.log(`     ❌ INCORRETO`);
                
                // Analisar o que está acontecendo
                await analyzeDiscrepancy(data, month, year);
            }
        }
        
        // 3. Testar contagem total por mês
        console.log('\n3. Testando contagem total por mês:');
        const months = ['JANEIRO', 'FEVEREIRO', 'MARCO'];
        
        for (const month of months) {
            const expectedTotal = realData
                .filter(d => dateToMonthYear(d.data).startsWith(month))
                .reduce((sum, d) => sum + d.qtd, 0);
            
            const { countActiveEmployees } = require('../routes/overtime-fixed');
            const actualTotal = await countActiveEmployees(month, '2026', null);
            
            console.log(`   ${month} 2026: esperado ${expectedTotal}, atual ${actualTotal}`);
        }
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    }
}

/**
 * Analisar discrepância nos resultados
 */
async function analyzeDiscrepancy(expectedData, month, year) {
    console.log(`     🔍 Analisando discrepância para ${expectedData.unidade}:`);
    
    try {
        // Verificar colaboradores na unidade
        const unitEmployees = await query(`
            SELECT e.name, e."admissionDate", e."terminationDate", e.type
            FROM employees e
            LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = '1'
            LEFT JOIN companies c ON ev.workplace_id = c.id
            WHERE c.name = $1
            ORDER BY e.name
        `, [expectedData.unidade]);
        
        console.log(`       Total de colaboradores na unidade: ${unitEmployees.rows.length}`);
        
        // Verificar admissões no período
        const admissions = await query(`
            SELECT COUNT(*) as count
            FROM employees e
            LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = '1'
            LEFT JOIN companies c ON ev.workplace_id = c.id
            WHERE c.name = $1
              AND e."admissionDate" <= $2
              AND (e.type IS NULL OR e.type != 'Desligado')
        `, [expectedData.unidade, `${year}-12-31`]);
        
        console.log(`       Admitidos até ${year}: ${admissions.rows[0].count}`);
        
        // Verificar desligamentos no período
        const dismissals = await query(`
            SELECT COUNT(*) as count
            FROM employees e
            LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = '1'
            LEFT JOIN companies c ON ev.workplace_id = c.id
            WHERE c.name = $1
              AND e.type = 'Desligado'
              AND e."terminationDate" IS NOT NULL
              AND e."terminationDate" <= $2
        `, [expectedData.unidade, `${year}-12-31`]);
        
        console.log(`       Desligados até ${year}: ${dismissals.rows[0].count}`);
        
    } catch (error) {
        console.error(`       Erro na análise: ${error.message}`);
    }
}

/**
 * Função principal
 */
async function main() {
    try {
        console.log('🔧 Conectando ao banco de dados...');
        await testRealData();
        console.log('\n🎉 Teste concluído!');
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
    testRealData,
    realData,
    dateToMonthYear
};
