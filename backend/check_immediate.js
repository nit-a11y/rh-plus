const { query } = require('./config/database');

async function checkImmediate() {
    try {
        console.log('🔍 VERIFICAÇÃO IMEDIATA - Buscando employee 965102d2...');
        
        // Busca imediata pelo ID
        const result = await query(`
            SELECT id, name, type, "admissionDate", "terminationDate" 
            FROM employees 
            WHERE id = '965102d2'
        `);
        
        console.log('Resultado imediato:', result.rows);
        
        // Buscar todos os employees com admission date hoje
        const todayResult = await query(`
            SELECT id, name, type, "admissionDate" 
            FROM employees 
            WHERE "admissionDate"::date = CURRENT_DATE 
            ORDER BY "admissionDate" DESC
        `);
        
        console.log('\nEmployees criados hoje:', todayResult.rows);
        
        // Verificar o employee original
        const originalResult = await query(`
            SELECT id, name, type, "admissionDate", "terminationDate" 
            FROM employees 
            WHERE id = '12fb19aeb8755da0'
        `);
        
        console.log('\nEmployee original:', originalResult.rows);
        
        // Buscar últimos 5 employees criados
        const recentResult = await query(`
            SELECT id, name, type, "admissionDate" 
            FROM employees 
            ORDER BY "admissionDate" DESC 
            LIMIT 5
        `);
        
        console.log('\nÚltimos 5 employees:', recentResult.rows);
        
    } catch (error) {
        console.error('Erro:', error.message);
    }
}

checkImmediate();
