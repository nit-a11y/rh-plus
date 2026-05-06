const { query } = require('./config/database');

async function checkNewEmployee() {
    try {
        // Buscar employees criados hoje
        const result = await query(`
            SELECT id, name, type, "admissionDate" 
            FROM employees 
            WHERE "admissionDate"::date >= CURRENT_DATE 
            ORDER BY "admissionDate" DESC 
            LIMIT 5
        `);
        
        console.log('Employees criados hoje:');
        console.log(result.rows);
        
        // Buscar pelo ID específico que está dando erro
        const specificResult = await query(`
            SELECT id, name, type, "admissionDate" 
            FROM employees 
            WHERE id = '22f20fab'
        `);
        
        console.log('\nBusca pelo ID 22f20fab:');
        console.log(specificResult.rows);
        
        // Verificar o employee original
        const originalResult = await query(`
            SELECT id, name, type, "admissionDate", "terminationDate" 
            FROM employees 
            WHERE id = '12fb19aeb8755da0'
        `);
        
        console.log('\nEmployee original 12fb19aeb8755da0:');
        console.log(originalResult.rows);
        
    } catch (error) {
        console.error('Erro:', error.message);
    }
}

checkNewEmployee();
