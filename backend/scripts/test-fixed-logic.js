/**
 * Script para Testar Lógica Corrigida de Desligamento
 */

const { query } = require('../config/database');

/**
 * Testar lógica corrigida
 */
async function testFixedLogic() {
    console.log('🔧 Testando lógica corrigida...\n');
    
    try {
        // 1. Verificar colaboradores desligados na unidade
        console.log('1. Verificando colaboradores desligados em NORDESTE LOCACOES - FORTALEZA:');
        const disconnectedResult = await query(`
            SELECT e.name, e."admissionDate", e."terminationDate", e.type, c.name as unit
            FROM employees e
            LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = '1'
            LEFT JOIN companies c ON ev.workplace_id = c.id
            WHERE c.name = $1
              AND e.type = 'Desligado'
            ORDER BY e."terminationDate" DESC
            LIMIT 10
        `, ['NORDESTE LOCACOES - FORTALEZA']);
        
        console.log('   Colaboradores desligados:');
        disconnectedResult.rows.forEach(row => {
            console.log(`   - ${row.name}: ${row.admissionDate} → ${row.terminationDate || 'N/A'}`);
        });
        
        // 2. Testar contagem corrigida para 2026
        console.log('\n2. Testando contagem corrigida para 2026:');
        const { countActiveEmployees } = require('../routes/overtime.js');
        const count2026 = await countActiveEmployees(null, '2026', 'NORDESTE LOCACOES - FORTALEZA');
        console.log(`   Contagem 2026: ${count2026}`);
        
        // 3. Testar contagem para janeiro 2026
        console.log('\n3. Testando contagem para janeiro 2026:');
        const countJan2026 = await countActiveEmployees('JANEIRO', '2026', 'NORDESTE LOCACOES - FORTALEZA');
        console.log(`   Contagem janeiro 2026: ${countJan2026}`);
        
        // 4. Testar contagem total (sem filtro de período)
        console.log('\n4. Testando contagem total (sem período):');
        const countTotal = await countActiveEmployees(null, null, 'NORDESTE LOCACOES - FORTALEZA');
        console.log(`   Contagem total: ${countTotal}`);
        
        // 5. Verificar desligamentos em 2026
        console.log('\n5. Verificando desligamentos em 2026:');
        const dismissals2026 = await query(`
            SELECT e.name, e."admissionDate", e."terminationDate"
            FROM employees e
            LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = '1'
            LEFT JOIN companies c ON ev.workplace_id = c.id
            WHERE c.name = $1
              AND e.type = 'Desligado'
              AND e."terminationDate" IS NOT NULL
              AND e."terminationDate" != ''
              AND e."terminationDate" LIKE '%2026%'
            ORDER BY e."terminationDate"
        `, ['NORDESTE LOCACOES - FORTALEZA']);
        
        console.log('   Desligamentos em 2026:');
        dismissals2026.rows.forEach(row => {
            console.log(`   - ${row.name}: ${row.admissionDate} → ${row.terminationDate}`);
        });
        
        // 6. Verificar admissões em 2026
        console.log('\n6. Verificando admissões em 2026:');
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
        
        // 7. Cálculo manual esperado
        console.log('\n7. Cálculo manual esperado:');
        const totalEmployees = await query(`
            SELECT COUNT(*) as count
            FROM employees e
            LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = '1'
            LEFT JOIN companies c ON ev.workplace_id = c.id
            WHERE c.name = $1
        `, ['NORDESTE LOCACOES - FORTALEZA']);
        
        console.log(`   Total de colaboradores na unidade: ${totalEmployees.rows[0].count}`);
        console.log(`   Desligados em 2026: ${dismissals2026.rows.length}`);
        console.log(`   Esperado para 2026: ${totalEmployees.rows[0].count - dismissals2026.rows.length}`);
        
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
        await testFixedLogic();
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
    testFixedLogic
};
