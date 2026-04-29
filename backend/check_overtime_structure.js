const { query } = require('./config/database');

async function checkOvertimeStructure() {
    try {
        console.log('Analisando estrutura da tabela overtime_records...');
        
        // Verificar se a tabela existe
        const tableExists = await query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'overtime_records'
            ) as exists
        `);
        
        if (!tableExists.rows[0].exists) {
            console.log('Tabela overtime_records não existe');
            return;
        }
        
        // Buscar estrutura da tabela
        const columns = await query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'overtime_records' 
            ORDER BY ordinal_position
        `);
        
        console.log('\nEstrutura da tabela overtime_records:');
        columns.rows.forEach(col => {
            console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });
        
        // Verificar amostra de dados
        const sample = await query(`
            SELECT * FROM overtime_records 
            LIMIT 5
        `);
        
        console.log(`\nAmostra de dados (${sample.rows.length} registros):`);
        sample.rows.forEach((row, index) => {
            console.log(`\nRegistro ${index + 1}:`);
            Object.keys(row).forEach(key => {
                console.log(`  ${key}: ${row[key]}`);
            });
        });
        
        // Contar registros
        const count = await query(`
            SELECT COUNT(*) as total FROM overtime_records
        `);
        
        console.log(`\nTotal de registros: ${count.rows[0].total}`);
        
        // Verificar períodos de dados
        const periods = await query(`
            SELECT 
                MIN(created_at) as oldest,
                MAX(created_at) as newest,
                COUNT(DISTINCT DATE(created_at)) as unique_days
            FROM overtime_records 
            WHERE created_at IS NOT NULL
        `);
        
        console.log(`\nPeríodo dos dados:`);
        console.log(`- Mais antigo: ${periods.rows[0].oldest}`);
        console.log(`- Mais recente: ${periods.rows[0].newest}`);
        console.log(`- Dias únicos: ${periods.rows[0].unique_days}`);
        
    } catch (error) {
        console.error('Erro ao analisar estrutura:', error);
    }
}

checkOvertimeStructure();
