/**
 * Script para Verificar Estrutura das Tabelas
 */

const { query } = require('../config/database');

/**
 * Verificar estrutura das tabelas
 */
async function checkTables() {
    console.log('🔧 Verificando estrutura das tabelas...\n');
    
    try {
        console.log('Estrutura da tabela employees:');
        const empColumns = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'employees' 
            ORDER BY ordinal_position
        `);
        empColumns.rows.forEach(col => {
            console.log(`  ${col.column_name}: ${col.data_type}`);
        });
        
        console.log('\nEstrutura da tabela employee_vinculos:');
        const vincColumns = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'employee_vinculos' 
            ORDER BY ordinal_position
        `);
        vincColumns.rows.forEach(col => {
            console.log(`  ${col.column_name}: ${col.data_type}`);
        });
        
        console.log('\nEstrutura da tabela companies:');
        const compColumns = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'companies' 
            ORDER BY ordinal_position
        `);
        compColumns.rows.forEach(col => {
            console.log(`  ${col.column_name}: ${col.data_type}`);
        });
        
        // Testar JOIN simples
        console.log('\nTestando JOIN simples:');
        const joinTest = await query(`
            SELECT e.id, e.name, e.type, c.name as company_name
            FROM employees e
            LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id
            LEFT JOIN companies c ON ev.workplace_id = c.id
            WHERE e.id = 'a92a33c7'
            LIMIT 1
        `);
        
        console.log('Resultado do JOIN:');
        joinTest.rows.forEach(row => {
            console.log(`  ${row.id}: ${row.name} | ${row.type} | ${row.company_name || 'N/A'}`);
        });
        
    } catch (error) {
        console.error('Erro:', error);
    }
}

/**
 * Função principal
 */
async function main() {
    try {
        await checkTables();
    } catch (error) {
        console.error('Erro no processo:', error);
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
    checkTables
};
