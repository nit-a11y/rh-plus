const { query } = require('./config/database');

async function testData() {
    try {
        console.log('Testando dados de overtime_records...');
        
        // Contar registros
        const countResult = await query('SELECT COUNT(*) as total FROM overtime_records');
        console.log('Total de registros:', countResult.rows[0].total);
        
        // Testar amostra
        const sampleResult = await query('SELECT mes, unidade, nome, extra, valor FROM overtime_records LIMIT 3');
        console.log('Amostra de dados:');
        sampleResult.rows.forEach((row, i) => {
            console.log(`Registro ${i+1}: ${row.mes} - ${row.unidade} - ${row.nome} - ${row.extra} - ${row.valor}`);
        });
        
        // Testar API
        console.log('Testando API /api/overtime...');
        const apiResult = await query(`
            SELECT 
                o.id,
                o.employee_id,
                o.mes,
                o.unidade,
                o.nome,
                o.extra,
                o.valor,
                o.created_at,
                o.created_by,
                e.name as employee_name,
                e."registrationNumber",
                e.role,
                e.sector
            FROM overtime_records o
            JOIN employees e ON o.employee_id = e.id
            WHERE 1=1
            ORDER BY o.mes DESC, e.name ASC
            LIMIT 5
        `);
        
        console.log('Resultado da API (primeiros 5):');
        apiResult.rows.forEach((row, i) => {
            console.log(`API ${i+1}: ${row.mes} - ${row.unidade} - ${row.nome} - ${row.extra} - ${row.valor}`);
        });
        
    } catch (error) {
        console.error('Erro:', error);
    }
}

testData();
