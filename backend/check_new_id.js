const { query } = require('./config/database');

async function checkNewId() {
    try {
        // Buscar pelo novo ID que deveria existir
        const result = await query(`
            SELECT id, name, type, "admissionDate" 
            FROM employees 
            WHERE id = 'cfd15bd4'
        `);
        
        console.log('Busca pelo novo ID cfd15bd4:');
        console.log('Resultado:', result.rows);
        
        // Buscar todos os employees criados hoje
        const todayResult = await query(`
            SELECT id, name, type, "admissionDate" 
            FROM employees 
            WHERE "admissionDate"::date = CURRENT_DATE 
            ORDER BY "admissionDate" DESC
        `);
        
        console.log('\nEmployees criados hoje:');
        console.log(todayResult.rows);
        
        // Verificar o employee original
        const originalResult = await query(`
            SELECT id, name, type, "admissionDate", "terminationDate" 
            FROM employees 
            WHERE id = '12fb19aeb8755da0'
        `);
        
        console.log('\nEmployee original 12fb19aeb8755da0:');
        console.log(originalResult.rows);
        
        // Verificar se há algum problema com a transação
        console.log('\nVerificando se há locks ou problemas...');
        
    } catch (error) {
        console.error('Erro:', error.message);
    }
}

checkNewId();
