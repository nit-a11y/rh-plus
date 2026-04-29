/**
 * Script Final para Testar Lógica Exata dos Dados Reais
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
 * Função FINAL para contar colaboradores ativos por período
 * Baseada na análise dos dados reais
 */
async function countActiveEmployeesFinal(filterMonth, filterYear, filterUnit) {
    try {
        let sql = `
            SELECT COUNT(DISTINCT e.id) as count
            FROM employees e
            LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = '1'
            LEFT JOIN companies c ON ev.workplace_id = c.id
            WHERE 1=1
        `;
        const params = [];
        
        // Adicionar filtro de unidade
        if (filterUnit) {
            sql += ` AND c.name = $1`;
            params.push(filterUnit);
        }
        
        // Se há filtro de período, aplicar lógica temporal específica
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
                
                // Lógica baseada na análise dos dados reais:
                // 1. Colaboradores admitidos antes ou durante o período
                // 2. E que não foram desligados antes do final do período
                sql += ` AND (
                    -- Admitidos antes ou durante o período
                    (e."admissionDate" <= $${params.length + 1} OR e."admissionDate" IS NULL)
                    -- E não desligados antes do final do período
                    AND (e.type != 'Desligado' OR 
                         e."terminationDate" IS NULL OR 
                         e."terminationDate" = '' OR 
                         e."terminationDate" > $${params.length + 2})
                )`;
                
                params.push(endDate, endDate);
            } else if (targetYear) {
                // Apenas ano
                sql += ` AND (e."admissionDate" <= $${params.length + 1} OR e."admissionDate" IS NULL)`;
                params.push(`${targetYear}-12-31`);
            }
        } else {
            // Sem filtro específico, contar apenas colaboradores ativos
            sql += ` AND (e.type IS NULL OR e.type != 'Desligado')`;
        }
        
        const result = await query(sql, params);
        return parseInt(result.rows[0]?.count || 0);
        
    } catch (error) {
        console.error('Erro ao contar colaboradores ativos no período:', error);
        return 0;
    }
}

/**
 * Testar contagem final
 */
async function testFinalLogic() {
    console.log('🔧 Testando lógica FINAL com dados reais...\n');
    
    try {
        let correctCount = 0;
        let totalCount = 0;
        
        // Testar cada combinação dos dados reais
        console.log('1. Testando combinações dos dados reais:');
        
        for (const data of realData) {
            const monthYear = dateToMonthYear(data.data);
            const month = monthYear.split(' ')[0];
            const year = monthYear.split(' ')[1];
            
            console.log(`\n   Testando: ${data.unidade} - ${monthYear} (esperado: ${data.qtd})`);
            
            // Testar com a função final
            const actualCount = await countActiveEmployeesFinal(month, year, data.unidade);
            
            console.log(`     Resultado atual: ${actualCount}`);
            console.log(`     Diferença: ${actualCount - data.qtd}`);
            
            totalCount++;
            if (actualCount === data.qtd) {
                console.log(`     ✅ CORRETO!`);
                correctCount++;
            } else {
                console.log(`     ❌ INCORRETO`);
            }
        }
        
        // 3. Testar contagem total por mês
        console.log('\n2. Testando contagem total por mês:');
        const months = ['JANEIRO', 'FEVEREIRO', 'MARCO'];
        
        for (const month of months) {
            const expectedTotal = realData
                .filter(d => dateToMonthYear(d.data).startsWith(month))
                .reduce((sum, d) => sum + d.qtd, 0);
            
            const actualTotal = await countActiveEmployeesFinal(month, '2026', null);
            
            console.log(`   ${month} 2026: esperado ${expectedTotal}, atual ${actualTotal}`);
            
            if (actualTotal === expectedTotal) {
                console.log(`   ✅ CORRETO!`);
                correctCount++;
            } else {
                console.log(`   ❌ INCORRETO`);
            }
            totalCount++;
        }
        
        // Resultado final
        console.log(`\n📊 RESULTADO FINAL:`);
        console.log(`   Corretos: ${correctCount}/${totalCount}`);
        console.log(`   Precisão: ${((correctCount / totalCount) * 100).toFixed(1)}%`);
        
        if (correctCount === totalCount) {
            console.log(`   🎉 PERFEITO! Todos os resultados correspondem!`);
        } else {
            console.log(`   ⚠️  Ainda precisamos ajustar a lógica`);
        }
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    }
}

/**
 * Função principal
 */
async function main() {
    try {
        console.log('🔧 Conectando ao banco de dados...');
        await testFinalLogic();
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
    testFinalLogic,
    countActiveEmployeesFinal,
    realData,
    dateToMonthYear
};
