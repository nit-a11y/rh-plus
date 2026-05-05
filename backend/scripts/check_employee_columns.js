const { query } = require('../config/database');

async function checkEmployeeColumns() {
    try {
        console.log('🔍 VERIFICANDO COLUNAS DA TABELA EMPLOYEES...');
        
        // Verificar estrutura da tabela employees
        const structureResult = await query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'employees'
            ORDER BY ordinal_position
        `);
        
        console.log('\n📋 Estrutura da tabela employees:');
        structureResult.rows.forEach(col => {
            console.log(`   - ${col.column_name} (${col.data_type})`);
        });
        
        // Procurar colunas relacionadas a salário
        const salaryColumns = structureResult.rows.filter(col => 
            col.column_name.toLowerCase().includes('salary') ||
            col.column_name.toLowerCase().includes('salario') ||
            col.column_name.toLowerCase().includes('current')
        );
        
        console.log('\n💰 Colunas relacionadas a salário:');
        salaryColumns.forEach(col => {
            console.log(`   - ${col.column_name} (${col.data_type})`);
        });
        
        // Procurar colunas relacionadas a cargo
        const roleColumns = structureResult.rows.filter(col => 
            col.column_name.toLowerCase().includes('role') ||
            col.column_name.toLowerCase().includes('cargo') ||
            col.column_name.toLowerCase().includes('position')
        );
        
        console.log('\n💼 Colunas relacionadas a cargo:');
        roleColumns.forEach(col => {
            console.log(`   - ${col.column_name} (${col.data_type})`);
        });
        
        // Procurar colunas relacionadas a setor
        const sectorColumns = structureResult.rows.filter(col => 
            col.column_name.toLowerCase().includes('sector') ||
            col.column_name.toLowerCase().includes('setor') ||
            col.column_name.toLowerCase().includes('department')
        );
        
        console.log('\n🏢 Colunas relacionadas a setor:');
        sectorColumns.forEach(col => {
            console.log(`   - ${col.column_name} (${col.data_type})`);
        });
        
        // Mostrar amostra dos dados
        console.log('\n📊 Amostra dos dados:');
        const sampleResult = await query(`
            SELECT id, name, role, sector, currentSalary, employer_id, workplace_id
            FROM employees 
            LIMIT 5
        `);
        
        console.table(sampleResult.rows);
        
    } catch (error) {
        console.error('❌ Erro ao verificar estrutura:', error.message);
    } finally {
        process.exit(0);
    }
}

checkEmployeeColumns();
