/**
 * Script para Testar Contagem com Dados Reais - Versão Corrigida
 */

const { query } = require('../config/database');

/**
 * Dados reais fornecidos pelo usuário com mapeamento correto para unidades do banco
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
 * Função melhorada para contar colaboradores ativos por período
 */
async function countActiveEmployeesFixed(filterMonth, filterYear, filterUnit) {
    try {
        let sql = `
            SELECT COUNT(DISTINCT e.id) as count
            FROM employees e
            LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = '1'
            LEFT JOIN companies c ON ev.workplace_id = c.id
            WHERE (e.type IS NULL OR e.type != 'Desligado')
        `;
        const params = [];
        
        // Adicionar filtro de unidade
        if (filterUnit) {
            sql += ` AND c.name = $1`;
            params.push(filterUnit);
        }
        
        // Se há filtro de período, aplicar lógica temporal
        if (filterMonth || filterYear) {
            let targetMonth = '';
            let targetYear = '';
            
            if (filterMonth) {
                targetMonth = filterMonth;
            }
            
            if (filterYear) {
                targetYear = filterYear;
            }
            
            // Converter mês para número
            const monthMap = {
                'JANEIRO': '01', 'FEVEREIRO': '02', 'MARCO': '03', 'ABRIL': '04',
                'MAIO': '05', 'JUNHO': '06', 'JULHO': '07', 'AGOSTO': '08',
                'SETEMBRO': '09', 'OUTUBRO': '10', 'NOVEMBRO': '11', 'DEZEMBRO': '12'
            };
            
            const monthNum = monthMap[targetMonth.toUpperCase()] || '';
            
            if (targetYear && monthNum) {
                // Período específico: YYYY-MM-DD
                const startDate = `${targetYear}-${monthNum}-01`;
                const endDate = `${targetYear}-${monthNum}-31`;
                
                // Contar colaboradores admitidos antes do final do período
                // E que não foram desligados antes do início do período
                sql += ` AND (
                    (e."admissionDate" <= $${params.length + 1} OR e."admissionDate" IS NULL)
                    AND (e."terminationDate" IS NULL OR e."terminationDate" = '' OR e."terminationDate" >= $${params.length + 2})
                )`;
                
                params.push(endDate, startDate);
            } else if (targetYear) {
                // Apenas ano
                sql += ` AND (e."admissionDate" <= $${params.length + 1} OR e."admissionDate" IS NULL)`;
                params.push(`${targetYear}-12-31`);
            }
        }
        
        const result = await query(sql, params);
        return parseInt(result.rows[0]?.count || 0);
        
    } catch (error) {
        console.error('Erro ao contar colaboradores ativos no período:', error);
        return 0;
    }
}

/**
 * Testar contagem com dados reais corrigidos
 */
async function testRealDataFixed() {
    console.log('🔧 Testando contagem com dados reais corrigidos...\n');
    
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
            
            // Testar com a função corrigida
            const actualCount = await countActiveEmployeesFixed(month, year, data.unidade);
            
            console.log(`     Resultado atual: ${actualCount}`);
            console.log(`     Diferença: ${actualCount - data.qtd}`);
            
            if (actualCount === data.qtd) {
                console.log(`     ✅ CORRETO!`);
            } else {
                console.log(`     ❌ INCORRETO`);
                
                // Analisar o que está acontecendo
                await analyzeDiscrepancyFixed(data, month, year);
            }
        }
        
        // 3. Testar contagem total por mês
        console.log('\n3. Testando contagem total por mês:');
        const months = ['JANEIRO', 'FEVEREIRO', 'MARCO'];
        
        for (const month of months) {
            const expectedTotal = realData
                .filter(d => dateToMonthYear(d.data).startsWith(month))
                .reduce((sum, d) => sum + d.qtd, 0);
            
            const actualTotal = await countActiveEmployeesFixed(month, '2026', null);
            
            console.log(`   ${month} 2026: esperado ${expectedTotal}, atual ${actualTotal}`);
        }
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    }
}

/**
 * Analisar discrepância nos resultados - versão corrigida
 */
async function analyzeDiscrepancyFixed(expectedData, month, year) {
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
              AND (e.type IS NULL OR e.type != 'Desligado')
              AND (e."admissionDate" <= $2 OR e."admissionDate" IS NULL)
              AND (e."terminationDate" IS NULL OR e."terminationDate" = '' OR e."terminationDate" >= $3)
        `, [expectedData.unidade, `${year}-12-31`, `${year}-01-01`]);
        
        console.log(`       Ativos no período: ${admissions.rows[0].count}`);
        
        // Verificar desligamentos no período
        const dismissals = await query(`
            SELECT e.name, e."admissionDate", e."terminationDate"
            FROM employees e
            LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = '1'
            LEFT JOIN companies c ON ev.workplace_id = c.id
            WHERE c.name = $1
              AND e.type = 'Desligado'
              AND e."terminationDate" IS NOT NULL
              AND e."terminationDate" != ''
            ORDER BY e."terminationDate"
        `, [expectedData.unidade]);
        
        if (dismissals.rows.length > 0) {
            console.log(`       Desligamentos na unidade:`);
            dismissals.rows.forEach(d => {
                console.log(`         - ${d.name}: ${d.admissionDate} → ${d.terminationDate}`);
            });
        }
        
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
        await testRealDataFixed();
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
    testRealDataFixed,
    countActiveEmployeesFixed,
    realData,
    dateToMonthYear
};
