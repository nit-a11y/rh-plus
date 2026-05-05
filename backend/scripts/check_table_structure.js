const { query } = require('../config/database');

async function checkTableStructure() {
    try {
        console.log('🔍 VERIFICANDO ESTRUTURA DA TABELA EMPLOYEES...');
        
        // Verificar estrutura da tabela employees
        const structureResult = await query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'employees'
            ORDER BY ordinal_position
        `);
        
        console.log('\n📋 Estrutura da tabela employees:');
        console.table(structureResult.rows);
        
        // Verificar se existe birth_date ou similar
        const dateColumns = structureResult.rows.filter(col => 
            col.column_name.toLowerCase().includes('birth') || 
            col.column_name.toLowerCase().includes('nasc') ||
            col.column_name.toLowerCase().includes('date')
        );
        
        console.log('\n📅 Colunas relacionadas a data:');
        dateColumns.forEach(col => {
            console.log(`   - ${col.column_name} (${col.data_type})`);
        });
        
        // Verificar colunas principais
        const mainColumns = ['id', 'name', 'cpf', 'role', 'sector', 'currentSalary', 'employer_id', 'workplace_id'];
        console.log('\n📋 Verificando colunas principais:');
        
        mainColumns.forEach(col => {
            const exists = structureResult.rows.find(c => c.column_name === col);
            console.log(`   - ${col}: ${exists ? '✅' : '❌'}`);
        });
        
        // Verificar estrutura da tabela employee_vinculos
        console.log('\n🔍 VERIFICANDO ESTRUTURA DA TABELA EMPLOYEE_VINCULOS...');
        
        const vinculosStructureResult = await query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'employee_vinculos'
            ORDER BY ordinal_position
        `);
        
        console.log('\n📋 Estrutura da tabela employee_vinculos:');
        console.table(vinculosStructureResult.rows);
        
        // Verificar colunas importantes
        const vinculosColumns = ['id', 'employee_id', 'employer_id', 'workplace_id', 'data_inicio', 'data_fim', 'tipo_vinculo', 'sequencia'];
        console.log('\n📋 Verificando colunas importantes:');
        
        vinculosColumns.forEach(col => {
            const exists = vinculosStructureResult.rows.find(c => c.column_name === col);
            console.log(`   - ${col}: ${exists ? '✅' : '❌'}`);
        });
        
    } catch (error) {
        console.error('❌ Erro ao verificar estrutura:', error.message);
    } finally {
        process.exit(0);
    }
}

checkTableStructure();
