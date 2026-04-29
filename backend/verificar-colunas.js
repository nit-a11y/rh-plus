const { query } = require('./config/database');

async function verificarColunas() {
    try {
        const sql = `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'employees' 
            ORDER BY ordinal_position
        `;
        
        const result = await query(sql);
        console.log('📋 Colunas da tabela employees:');
        result.rows.forEach((col, i) => {
            console.log(`  ${i+1}. ${col.column_name}`);
        });
        
    } catch (error) {
        console.error('Erro:', error);
    }
}

verificarColunas();
