const { query } = require('./config/database');

async function checkAdmissionColumn() {
    try {
        console.log('Verificando coluna de admissão...');
        
        const result = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'employees' 
            AND column_name ILIKE '%admission%'
            ORDER BY ordinal_position
        `);
        
        console.log('Colunas com "admission":');
        if (result.rows.length === 0) {
            console.log('Nenhuma coluna encontrada com "admission"');
            
            // Verificar todas as colunas para encontrar a correta
            const allCols = await query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'employees' 
                ORDER BY ordinal_position
            `);
            
            console.log('Todas as colunas:');
            allCols.rows.forEach(row => {
                if (row.column_name.toLowerCase().includes('admission') || 
                    row.column_name.toLowerCase().includes('date')) {
                    console.log(`  ${row.column_name}: ${row.data_type} <-- POSSÍVEL`);
                } else {
                    console.log(`  ${row.column_name}: ${row.data_type}`);
                }
            });
        } else {
            result.rows.forEach(row => {
                console.log(`  ${row.column_name}: ${row.data_type}`);
            });
        }
        
        process.exit(0);
    } catch (err) {
        console.error('Erro:', err.message);
        process.exit(1);
    }
}

checkAdmissionColumn();
