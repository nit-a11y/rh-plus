const { query } = require('./config/database');

async function testFixedQuery() {
    try {
        console.log('Testando query CORRIGIDA com aspas duplas...');
        
        const camposArquivo = [
            'hierarchy', 'admissionDate', 'birthDate', 'currentSalary', 'street', 'city',
            'neighborhood', 'state_uf', 'cep', 'fatherName', 'motherName', 'gender',
            'maritalStatus', 'ethnicity', 'educationLevel', 'placeOfBirth',
            'personalEmail', 'personalPhone', 'work_schedule', 'work_scale', 'cbo',
            'initialRole', 'initialSalary', 'metadata', 'observation', 'criado_em'
        ];
        
        // Query CORRIGIDA com aspas duplas
        const sql = `SELECT ${camposArquivo.map(f => `"${f}"`).join(',')} FROM employees WHERE id = $1`;
        console.log('SQL CORRIGIDA:', sql);
        
        const testId = '5b097522';
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

testFixedQuery();
