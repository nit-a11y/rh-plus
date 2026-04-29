/**
 * Script para Testar Lógica de Desligamento
 */

const { query } = require('../config/database');

/**
 * Testar lógica de contagem com desligamento
 */
async function testDismissalLogic() {
    console.log('🔧 Testando lógica de desligamento...\n');
    
    try {
        // 1. Verificar colaboradores desligados
        console.log('1. Verificando colaboradores desligados:');
        const disconnectedResult = await query(`
            SELECT e.name, e."admissionDate", e."dismissalDate", e.type, c.name as unit
            FROM employees e
            LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = '1'
            LEFT JOIN companies c ON ev.workplace_id = c.id
            WHERE e.type = 'Desligado'
            ORDER BY e.name
            LIMIT 10
        `);
        
        console.log('   Colaboradores desligados:');
        disconnectedResult.rows.forEach(row => {
            console.log(`   - ${row.name}: ${row.admissionDate} | ${row.dismissalDate || 'N/A'} | ${row.unit || 'N/A'}`);
        });
        
        // 2. Testar contagem para 2026
        console.log('\n2. Testando contagem para 2026:');
        
        // Lógica correta: considerar data de desligamento
        const correctResult = await query(`
            SELECT COUNT(DISTINCT e.id) as count
            FROM employees e
            LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = '1'
            LEFT JOIN companies c ON ev.workplace_id = c.id
            WHERE c.name = $1
              AND (
                -- Colaboradores ativos (não desligados)
                (e.type IS NULL OR e.type != 'Desligado')
                OR
                -- Colaboradores desligados que ainda estavam ativos em 2026
                (e.type = 'Desligado' AND (
                    -- Não tem data de desligamento OU
                    -- Data de desligamento é posterior ao período
                    e."dismissalDate" IS NULL OR 
                    e."dismissalDate" = '' OR
                    e."dismissalDate" > $2
                ))
              )
        `, ['NORDESTE LOCACOES - FORTALEZA', '2026-12-31']);
        
        console.log(`   Contagem correta: ${correctResult.rows[0].count}`);
        
        // 3. Comparar com lógica atual
        console.log('\n3. Testando lógica atual:');
        const { countActiveEmployees } = require('./overtime.js');
        const currentCount = await countActiveEmployees(null, '2026', 'NORDESTE LOCACOES - FORTALEZA');
        console.log(`   Contagem atual: ${currentCount}`);
        
        // 4. Verificar desligamentos em 2026
        console.log('\n4. Verificando desligamentos em 2026:');
        const dismissals2026 = await query(`
            SELECT e.name, e."admissionDate", e."dismissalDate"
            FROM employees e
            LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = '1'
            LEFT JOIN companies c ON ev.workplace_id = c.id
            WHERE c.name = $1
              AND e.type = 'Desligado'
              AND e."dismissalDate" IS NOT NULL
              AND e."dismissalDate" != ''
              AND e."dismissalDate" LIKE '%2026%'
            ORDER BY e."dismissalDate"
        `, ['NORDESTE LOCACOES - FORTALEZA']);
        
        console.log('   Desligamentos em 2026:');
        dismissals2026.rows.forEach(row => {
            console.log(`   - ${row.name}: ${row.admissionDate} → ${row.dismissalDate}`);
        });
        
        // 5. Verificar admissões em 2026
        console.log('\n5. Verificando admissões em 2026:');
        const admissions2026 = await query(`
            SELECT e.name, e."admissionDate", e.type
            FROM employees e
            LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = '1'
            LEFT JOIN companies c ON ev.workplace_id = c.id
            WHERE c.name = $1
              AND e."admissionDate" IS NOT NULL
              AND e."admissionDate" != ''
              AND e."admissionDate" LIKE '%2026%'
            ORDER BY e."admissionDate"
        `, ['NORDESTE LOCACOES - FORTALEZA']);
        
        console.log('   Admissões em 2026:');
        admissions2026.rows.forEach(row => {
            console.log(`   - ${row.name}: ${row.admissionDate} (${row.type})`);
        });
        
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
        await testDismissalLogic();
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
    testDismissalLogic
};
