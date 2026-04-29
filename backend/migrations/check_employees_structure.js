/**
 * Verificar estrutura da tabela employees
 */

const { query } = require('../config/database');

async function checkEmployeesStructure() {
    console.log('🔍 Verificando estrutura da tabela employees...\n');

    try {
        const result = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'employees' 
            ORDER BY ordinal_position
        `);
        
        console.log('📋 Estrutura da tabela employees:');
        result.rows.forEach(col => {
            console.log(`      ${col.column_name}: ${col.data_type}`);
        });
        
        // Verificar especificamente por colunas de matrícula
        const registrationColumns = result.rows.filter(col => 
            col.column_name.toLowerCase().includes('registration') || 
            col.column_name.toLowerCase().includes('matricula')
        );
        
        console.log('\n🔍 Colunas de matrícula encontradas:');
        registrationColumns.forEach(col => {
            console.log(`      ${col.column_name}: ${col.data_type}`);
        });
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

if (require.main === module) {
    checkEmployeesStructure();
}

module.exports = { checkEmployeesStructure };
