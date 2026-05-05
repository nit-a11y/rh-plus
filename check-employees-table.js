const { query } = require('./backend/config/database');

async function checkTable() {
    try {
        const result = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'employees' 
            ORDER BY ordinal_position
        `);
        
        console.log('📋 Estrutura da tabela employees:');
        result.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type}`);
        });
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
    
    process.exit(0);
}

checkTable();
