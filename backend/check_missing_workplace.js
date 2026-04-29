const { query } = require('./config/database');

async function checkMissingWorkplace() {
    try {
        console.log('=== BUSCANDO COLABORADORES SEM WORKPLACE_ID ===');
        
        const result = await query(`
            SELECT e.id, e.name 
            FROM employees e 
            LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id 
            WHERE ev.workplace_id IS NULL OR ev.workplace_id = ''
        `);
        
        console.log('Colaboradores sem workplace_id:');
        result.rows.forEach(row => console.log(`ID: ${row.id}, Nome: ${row.name}`));
        console.log(`\nTotal: ${result.rows.length}`);
        
        process.exit(0);
    } catch (error) {
        console.error('Erro:', error.message);
        process.exit(1);
    }
}

checkMissingWorkplace();
