const { query } = require('./config/database');

async function checkEmployee() {
    try {
        const result = await query('SELECT id, name FROM employees WHERE id = $1', ['a274de9b14510dd3']);
        console.log('Resultado:', result.rows);
        
        if (result.rows.length === 0) {
            console.log('Colaborador NÃO encontrado');
            
            // Verificar IDs similares
            const similar = await query('SELECT id, name FROM employees WHERE id LIKE $1', ['a274de9%']);
            console.log('IDs similares:', similar.rows);
        } else {
            console.log('Colaborador encontrado:', result.rows[0].name);
        }
    } catch (error) {
        console.error('Erro:', error.message);
    }
}

checkEmployee();
