const { query } = require('./config/database');

async function checkColumnsCase() {
    try {
        console.log('Verificando case sensitivity das colunas...');
        
        const result = await query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'employees'
            ORDER BY ordinal_position
        `);
        
        console.log('Colunas exatas na tabela employees:');
        result.rows.forEach(row => {
            console.log(`  "${row.column_name}"`);
        });
        
        // Verificar especificamente por admission
        console.log('\n--- Verificando colunas com "admission" ---');
        const admissionCols = result.rows.filter(row => 
            row.column_name.toLowerCase().includes('admission')
        );
        
        if (admissionCols.length > 0) {
            admissionCols.forEach(col => {
                console.log(`  Encontrado: "${col.column_name}"`);
            });
        } else {
            console.log('  Nenhuma coluna com "admission" encontrada!');
        }
        
        process.exit(0);
    } catch (err) {
        console.error('Erro:', err.message);
        process.exit(1);
    }
}

checkColumnsCase();
