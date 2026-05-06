const { query } = require('./config/database');

async function searchInvalidID() {
    try {
        // Buscar por qualquer parte do ID inválido
        const result = await query(`
            SELECT id, name, cpf, "admissionDate" 
            FROM employees 
            WHERE id LIKE '%a274de9%' 
               OR name ILIKE '%a274de9%' 
               OR cpf ILIKE '%a274de9%'
            ORDER BY id
            LIMIT 10
        `);
        
        console.log('Busca por partes do ID inválido:');
        console.log('Resultado:', result.rows);
        
        // Buscar todos os IDs para ver padrão
        const allIds = await query('SELECT id, name FROM employees ORDER BY id LIMIT 20');
        console.log('\nPrimeiros 20 IDs no banco:');
        allIds.rows.forEach((emp, i) => {
            console.log(`${i + 1}. ${emp.id} - ${emp.name}`);
        });
        
        // Verificar se há algum ID com mais de 8 caracteres
        const longIds = await query("SELECT id, name FROM employees WHERE LENGTH(id) > 8");
        console.log('\nIDs com mais de 8 caracteres:');
        console.log('Resultado:', longIds.rows);
        
    } catch (error) {
        console.error('Erro:', error.message);
    }
}

searchInvalidID();
