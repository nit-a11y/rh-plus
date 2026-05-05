const { query } = require('../config/database');

async function checkEmployeeVinculosStructure() {
    try {
        console.log('🔍 Verificando estrutura da tabela employee_vinculos...');
        
        const result = await query(`
            SELECT column_name, data_type, is_nullable, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'employee_vinculos' 
            ORDER BY ordinal_position
        `);
        
        console.log('\n📋 Estrutura atual:');
        console.log(JSON.stringify(result.rows, null, 2));
        
        // Verificar se tabela existe
        if (result.rows.length === 0) {
            console.log('\n❌ Tabela employee_vinculos não existe!');
            return;
        }
        
        console.log('\n✅ Tabela existe com', result.rows.length, 'colunas');
        
        // Verificar dados existentes
        const countResult = await query('SELECT COUNT(*) as total FROM employee_vinculos');
        console.log(`📊 Total de registros: ${countResult.rows[0].total}`);
        
        // Mostrar amostra de dados
        const sampleResult = await query('SELECT * FROM employee_vinculos LIMIT 3');
        if (sampleResult.rows.length > 0) {
            console.log('\n📝 Amostra de dados:');
            console.log(JSON.stringify(sampleResult.rows, null, 2));
        }
        
    } catch (error) {
        console.error('❌ Erro ao verificar estrutura:', error.message);
    } finally {
        process.exit(0);
    }
}

checkEmployeeVinculosStructure();
