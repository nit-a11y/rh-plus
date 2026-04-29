/**
 * Script para Testar Lógica de Intersecção de Períodos - Versão Corrigida
 */

const { query } = require('../config/database');

/**
 * Testar a nova lógica de intersecção de períodos
 */
async function testPeriodIntersection() {
    console.log('🔧 Testando lógica de intersecção de períodos...\n');
    
    try {
        // 1. Testar com exemplos fornecidos pelo usuário
        console.log('1. Testando exemplos fornecidos:');
        
        // Exemplo 1: Colaborador 01/01/2020 - 01/03/2021 vs Janeiro/2021 = DEVE CONTAR
        console.log('\n   Exemplo 1: Colaborador 01/01/2020 - 01/03/2021 vs Janeiro/2021');
        const result1 = await countActiveWithIntersection('JANEIRO', '2021', null, '01/01/2020', '01/03/2021');
        console.log(`     Resultado: ${result1} (esperado: CONTA)`);
        
        // Exemplo 2: Colaborador 01/01/2020 - 01/03/2021 vs Abril/2021 = NÃO DEVE CONTAR
        console.log('\n   Exemplo 2: Colaborador 01/01/2020 - 01/03/2021 vs Abril/2021');
        const result2 = await countActiveWithIntersection('ABRIL', '2021', null, '01/01/2020', '01/03/2021');
        console.log(`     Resultado: ${result2} (esperado: NÃO CONTA)`);
        
        // Exemplo 3: Admissão 10/01/2026 vs Janeiro/2026 = DEVE CONTAR (primeira quinzena)
        console.log('\n   Exemplo 3: Admissão 10/01/2026 vs Janeiro/2026');
        const result3 = await countActiveWithIntersection('JANEIRO', '2026', null, '10/01/2026', null);
        console.log(`     Resultado: ${result3} (esperado: CONTA - primeira quinzena)`);
        
        // Exemplo 4: Admissão 20/01/2026 vs Janeiro/2026 = NÃO DEVE CONTAR (segunda quinzena)
        console.log('\n   Exemplo 4: Admissão 20/01/2026 vs Janeiro/2026');
        const result4 = await countActiveWithIntersection('JANEIRO', '2026', null, '20/01/2026', null);
        console.log(`     Resultado: ${result4} (esperado: NÃO CONTA - segunda quinzena)`);
        
        // 2. Testar com dados reais do banco
        console.log('\n2. Testando com dados reais do banco:');
        
        const unit = 'NORDESTE LOCACOES - FORTALEZA';
        
        // Testar Janeiro 2026 com dados reais
        console.log(`\n   Testando Janeiro 2026 - ${unit}:`);
        const realResult = await countActiveWithIntersection('JANEIRO', '2026', unit);
        console.log(`     Resultado real: ${realResult}`);
        
        // 3. Analisar casos específicos
        console.log('\n3. Analisando casos específicos:');
        await analyzeSpecificCases(unit);
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    }
}

/**
 * Nova função de contagem com lógica de intersecção - VERSÃO CORRIGIDA
 */
async function countActiveWithIntersection(filterMonth, filterYear, filterUnit, testAdmissionDate = null, testTerminationDate = null) {
    try {
        // Converter mês para número
        const monthMap = {
            'JANEIRO': '01', 'FEVEREIRO': '02', 'MARCO': '03', 'ABRIL': '04',
            'MAIO': '05', 'JUNHO': '06', 'JULHO': '07', 'AGOSTO': '08',
            'SETEMBRO': '09', 'OUTUBRO': '10', 'NOVEMBRO': '11', 'DEZEMBRO': '12'
        };
        
        const monthNum = monthMap[filterMonth.toUpperCase()] || '01';
        const startDate = `${filterYear}-${monthNum}-01`;
        const endDate = `${filterYear}-${monthNum}-31`;
        
        let sql = `
            SELECT COUNT(DISTINCT e.id) as count
            FROM employees e
            LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = '1'
            LEFT JOIN companies c ON ev.workplace_id = c.id
            WHERE 1=1
        `;
        const params = [];
        
        // Filtro de unidade
        if (filterUnit) {
            sql += ` AND c.name = $${params.length + 1}`;
            params.push(filterUnit);
        }
        
        // Lógica simplificada de intersecção - SEM USAR COALESCE
        if (testAdmissionDate || testTerminationDate) {
            // Modo de teste com datas específicas
            sql += ` AND (
                -- Intersecção básica: colaborador estava ativo durante o período
                ($${params.length + 1} <= $${params.length + 2})
                AND ($${params.length + 3} IS NULL OR $${params.length + 3} >= $${params.length + 4})
            )`;
            params.push(testAdmissionDate || startDate, endDate, testTerminationDate, startDate);
        } else {
            // Modo real com dados do banco
            sql += ` AND (
                -- Condição 1: Admitido antes ou durante o período
                (e."admissionDate" <= $${params.length + 1} OR e."admissionDate" IS NULL)
                
                -- Condição 2: Não desligado ou desligado após o início do período
                AND (e.type IS NULL OR e.type != 'Desligado' OR 
                     e."terminationDate" IS NULL OR 
                     e."terminationDate" = '' OR 
                     e."terminationDate" >= $${params.length + 2})
            )`;
            params.push(endDate, startDate);
        }
        
        const result = await query(sql, params);
        return parseInt(result.rows[0]?.count || 0);
        
    } catch (error) {
        console.error('Erro na contagem com intersecção:', error);
        return 0;
    }
}

/**
 * Analisar casos específicos do banco - VERSÃO CORRIGIDA
 */
async function analyzeSpecificCases(unit) {
    try {
        // Buscar colaboradores admitidos em Janeiro 2026
        console.log('\n   Colaboradores admitidos em Janeiro 2026:');
        const janAdmissions = await query(`
            SELECT e.name, e."admissionDate", e."terminationDate", e.type
            FROM employees e
            LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = '1'
            LEFT JOIN companies c ON ev.workplace_id = c.id
            WHERE c.name = $1
              AND e."admissionDate" >= $2
              AND e."admissionDate" <= $3
            ORDER BY e."admissionDate"
        `, [unit, '2026-01-01', '2026-01-31']);
        
        janAdmissions.rows.forEach(emp => {
            if (emp.admissionDate) {
                const day = parseInt(emp.admissionDate.split('-')[2]);
                const counts = day <= 15 ? 'CONTA' : 'NÃO CONTA';
                console.log(`     - ${emp.name}: ${emp.admissionDate} (dia ${day}) → ${counts}`);
            }
        });
        
        // Buscar colaboradores desligados em Janeiro 2026
        console.log('\n   Colaboradores desligados em Janeiro 2026:');
        const janDismissals = await query(`
            SELECT e.name, e."admissionDate", e."terminationDate", e.type
            FROM employees e
            LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = '1'
            LEFT JOIN companies c ON ev.workplace_id = c.id
            WHERE c.name = $1
              AND e.type = 'Desligado'
              AND e."terminationDate" >= $2
              AND e."terminationDate" <= $3
            ORDER BY e."terminationDate"
        `, [unit, '2026-01-01', '2026-01-31']);
        
        if (janDismissals.rows.length > 0) {
            janDismissals.rows.forEach(emp => {
                if (emp.terminationDate) {
                    const day = parseInt(emp.terminationDate.split('-')[2]);
                    const counts = day <= 15 ? 'CONTA' : 'NÃO CONTA';
                    console.log(`     - ${emp.name}: ${emp.terminationDate} (dia ${day}) → ${counts}`);
                }
            });
        } else {
            console.log('     Nenhum desligamento em Janeiro 2026');
        }
        
    } catch (error) {
        console.error('Erro na análise específica:', error);
    }
}

/**
 * Função principal
 */
async function main() {
    try {
        console.log('🔧 Conectando ao banco de dados...');
        await testPeriodIntersection();
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
    testPeriodIntersection,
    countActiveWithIntersection
};
