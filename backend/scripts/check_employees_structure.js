const { query } = require('../config/database');

async function checkEmployeesStructure() {
    try {
        console.log('🔍 Verificando estrutura da tabela employees...');
        
        // Verificar estrutura completa
        const structure = await query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'employees' 
            ORDER BY ordinal_position
        `);
        
        console.log('\n📋 Estrutura da tabela employees:');
        structure.rows.forEach(col => {
            console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
        });
        
        // Verificar se coluna updated_at existe
        const hasUpdatedAt = structure.rows.some(col => col.column_name === 'updated_at');
        
        if (hasUpdatedAt) {
            console.log('\n✅ Coluna updated_at existe na tabela employees');
        } else {
            console.log('\n❌ Coluna updated_at NÃO existe na tabela employees');
            
            // Adicionar coluna updated_at
            console.log('🔧 Adicionando coluna updated_at...');
            await query(`
                ALTER TABLE employees 
                ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            `);
            
            console.log('✅ Coluna updated_at adicionada com sucesso');
        }
        
        // Verificar coluna metadata
        const hasMetadata = structure.rows.some(col => col.column_name === 'metadata');
        
        if (hasMetadata) {
            console.log('\n✅ Coluna metadata existe na tabela employees');
        } else {
            console.log('\n❌ Coluna metadata NÃO existe na tabela employees');
            
            // Adicionar coluna metadata
            console.log('🔧 Adicionando coluna metadata...');
            await query(`
                ALTER TABLE employees 
                ADD COLUMN metadata JSONB
            `);
            
            console.log('✅ Coluna metadata adicionada com sucesso');
        }
        
        // Verificar dados de exemplo
        console.log('\n📊 Verificando dados...');
        const count = await query('SELECT COUNT(*) as total FROM employees');
        console.log(`Total de colaboradores: ${count.rows[0].total}`);
        
        const sample = await query('SELECT id, name, metadata FROM employees LIMIT 2');
        console.log('\nAmostra de dados:');
        sample.rows.forEach(emp => {
            console.log(`  ${emp.id}: ${emp.name}`);
            console.log(`    metadata: ${emp.metadata || 'NULL'}`);
        });
        
        console.log('\n🎉 Verificação concluída!');
        
    } catch (error) {
        console.error('❌ Erro na verificação:', error.message);
    } finally {
        process.exit(0);
    }
}

checkEmployeesStructure();
