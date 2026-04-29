/**
 * Script para Testar Contagem Simples
 */

const { query } = require('../config/database');

/**
 * Testar contagem simples
 */
async function testSimpleCount() {
    console.log('🔧 Testando contagem simples...\n');
    
    try {
        // 1. Testar sem JOINs
        console.log('1. Testando contagem sem JOINs:');
        const simpleResult = await query(`
            SELECT COUNT(*) as count
            FROM employees 
            WHERE type IS NULL OR type != 'Desligado'
        `);
        console.log(`   Simples: ${simpleResult.rows[0].count}`);
        
        // 2. Testar com JOINs básicos
        console.log('\n2. Testando com JOINs básicos:');
        const joinResult = await query(`
            SELECT COUNT(*) as count
            FROM employees e
            LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = '1'
            LEFT JOIN companies c ON ev.workplace_id = c.id
            WHERE e.type IS NULL OR e.type != 'Desligado'
        `);
        console.log(`   Com JOINs: ${joinResult.rows[0].count}`);
        
        // 3. Testar com filtro de unidade
        console.log('\n3. Testando com filtro de unidade:');
        const unitResult = await query(`
            SELECT COUNT(*) as count
            FROM employees e
            LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = '1'
            LEFT JOIN companies c ON ev.workplace_id = c.id
            WHERE e.type IS NULL OR e.type != 'Desligado'
              AND c.name = $1
        `, ['NORDESTE LOCACOES - FORTALEZA']);
        console.log(`   Com unidade: ${unitResult.rows[0].count}`);
        
        // 4. Testar com ano
        console.log('\n4. Testando com ano 2026:');
        const yearResult = await query(`
            SELECT COUNT(*) as count
            FROM employees e
            WHERE e.type IS NULL OR e.type != 'Desligado'
              AND (e."admissionDate" <= $1 OR e."admissionDate" IS NULL)
        `, ['2026-12-31']);
        console.log(`   Com ano: ${yearResult.rows[0].count}`);
        
        // 5. Testar com ambos
        console.log('\n5. Testando com ambos (unidade + ano):');
        const bothResult = await query(`
            SELECT COUNT(*) as count
            FROM employees e
            LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = '1'
            LEFT JOIN companies c ON ev.workplace_id = c.id
            WHERE e.type IS NULL OR e.type != 'Desligado'
              AND c.name = $1
              AND (e."admissionDate" <= $2 OR e."admissionDate" IS NULL)
        `, ['NORDESTE LOCACOES - FORTALEZA', '2026-12-31']);
        console.log(`   Com ambos: ${bothResult.rows[0].count}`);
        
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
        await testSimpleCount();
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
    testSimpleCount
};
