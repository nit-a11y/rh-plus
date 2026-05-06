const { query } = require('./config/database');

async function checkTransfer() {
    try {
        // Buscar pelo ID que está dando erro
        const result = await query(`
            SELECT id, name, type, "admissionDate", "terminationDate" 
            FROM employees 
            WHERE id LIKE 'a610ad55%'
            ORDER BY "admissionDate" DESC 
            LIMIT 5
        `);
        
        console.log('Busca por ID a610ad55:');
        console.log('Resultado:', result.rows);
        
        // Verificar últimos employees criados
        const recent = await query(`
            SELECT id, name, type, "admissionDate", "terminationDate" 
            FROM employees 
            ORDER BY "admissionDate" DESC 
            LIMIT 10
        `);
        
        console.log('\nÚltimos 10 employees criados:');
        recent.rows.forEach((emp, i) => {
            console.log(`${i + 1}. ID: ${emp.id} - Nome: ${emp.name} - Tipo: ${emp.type} - Admissão: ${emp.admissionDate}`);
        });
        
        // Verificar se há erro na tabela de histórico
        try {
            const history = await query(`
                SELECT * FROM employee_transfer_history 
                ORDER BY changed_at DESC 
                LIMIT 5
            `);
            console.log('\nHistórico recente:');
            console.log(history.rows);
        } catch (histError) {
            console.log('\nErro ao buscar histórico:', histError.message);
        }
        
    } catch (error) {
        console.error('Erro:', error.message);
    }
}

checkTransfer();
