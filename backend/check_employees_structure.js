const { query } = require('./config/database');

async function checkEmployeesStructure() {
    try {
        const result = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'employees' 
            ORDER BY ordinal_position
        `);
        
        console.log('Colunas da tabela employees:');
        result.rows.forEach(col => {
            console.log(`- ${col.column_name}: ${col.data_type}`);
        });
        
        // Verificar também algumas linhas de exemplo
        const sample = await query('SELECT * FROM employees LIMIT 2');
        console.log('\nExemplo de dados:');
        console.log(JSON.stringify(sample.rows, null, 2));
        
    } catch (error) {
        console.error('Erro:', error);
    }
}

checkEmployeesStructure();
