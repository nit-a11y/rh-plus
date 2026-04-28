const { query } = require('./config/database');

async function testCareerQuery() {
    try {
        console.log('Testando query do career.js...');
        
        // Simular a query que está falhando
        const camposArquivo = [
            'hierarchy', 'admissionDate', 'birthDate', 'currentSalary', 'street', 'city',
            'neighborhood', 'state_uf', 'cep', 'fatherName', 'motherName', 'gender',
            'maritalStatus', 'ethnicity', 'educationLevel', 'placeOfBirth',
            'personalEmail', 'personalPhone', 'work_schedule', 'work_scale', 'cbo',
            'initialRole', 'initialSalary', 'metadata', 'observation', 'criado_em'
        ];
        
        const sql = `SELECT ${camposArquivo.join(',')} FROM employees WHERE id = $1`;
        console.log('SQL:', sql);
        
        // Testar com um ID válido
        const testId = '5b097522'; // ID do erro
        const result = await query(sql, [testId]);
        
        console.log('Query executada com sucesso!');
        console.log('Rows:', result.rowCount);
        
        if (result.rows.length > 0) {
            console.log('Dados encontrados:');
            Object.keys(result.rows[0]).forEach(key => {
                console.log(`  ${key}: ${result.rows[0][key]}`);
            });
        } else {
            console.log('Nenhum dado encontrado para o ID:', testId);
        }
        
        process.exit(0);
    } catch (err) {
        console.error('Erro na query:', err.message);
        process.exit(1);
    }
}

testCareerQuery();
