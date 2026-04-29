const { query } = require('./config/database');

async function checkDates() {
    try {
        console.log('Verificando estrutura de datas...');
        
        // Verificar colunas de data
        const columns = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'employees' 
            AND (column_name LIKE '%date%' OR column_name LIKE '%Date%')
            ORDER BY column_name
        `);
        
        console.log('Colunas de data encontradas:');
        columns.rows.forEach(col => {
            console.log(`- ${col.column_name}: ${col.data_type}`);
        });
        
        // Verificar amostra de dados
        const sample = await query(`
            SELECT id, name, "admissionDate", "terminationDate", criado_em 
            FROM employees 
            LIMIT 5
        `);
        
        console.log('\nAmostra de dados:');
        sample.rows.forEach(emp => {
            console.log(`ID: ${emp.id}`);
            console.log(`Nome: ${emp.name}`);
            console.log(`Admissão: ${emp.admissionDate}`);
            console.log(`Desligamento: ${emp.terminationDate}`);
            console.log(`Criado em: ${emp.criado_em}`);
            console.log('---');
        });
        
        // Contar registros com datas
        const counts = await query(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN "admissionDate" IS NOT NULL THEN 1 END) as with_admission,
                COUNT(CASE WHEN "terminationDate" IS NOT NULL THEN 1 END) as with_termination
            FROM employees
        `);
        
        console.log('\nContagem de datas:');
        console.log(`Total: ${counts.rows[0].total}`);
        console.log(`Com admissão: ${counts.rows[0].with_admission}`);
        console.log(`Com desligamento: ${counts.rows[0].with_termination}`);
        
    } catch (error) {
        console.error('Erro:', error);
    }
}

checkDates();
