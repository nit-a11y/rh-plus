const { query } = require('./backend/config/database');
const fs = require('fs');

async function compareDatabases() {
  console.log('=== COMPARAÇÃO: LOCAL vs VPS ===\n');
  
  try {
    // Carregar estrutura local
    const localStructure = JSON.parse(fs.readFileSync('backups/migracao/local-db-structure.json', 'utf8'));
    
    // Analisar estrutura da VPS (tabelas principais)
    const mainTables = ['users', 'employees', 'companies', 'roles_master', 'population_history'];
    
    console.log('DIFERENÇAS ENCONTRADAS:\n');
    
    for (const tableName of mainTables) {
      console.log(`=== TABELA: ${tableName.toUpperCase()} ===`);
      
      const localCols = localStructure[tableName]?.columns || [];
      console.log('\nLOCAL (estrutura correta):');
      localCols.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
      
      console.log('\nVPS (estrutura atual):');
      // Obter estrutura da VPS
      try {
        const vpsCols = await query(`
          SELECT column_name, data_type
          FROM information_schema.columns 
          WHERE table_name = '${tableName}' 
          ORDER BY ordinal_position
        `);
        
        vpsCols.rows.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type}`);
        });
        
        // Comparar
        console.log('\nDIFERENÇAS:');
        const localColNames = localCols.map(c => c.column_name);
        const vpsColNames = vpsCols.rows.map(c => c.column_name);
        
        const missingInVps = localColNames.filter(name => !vpsColNames.includes(name));
        const extraInVps = vpsColNames.filter(name => !localColNames.includes(name));
        
        if (missingInVps.length > 0) {
          console.log('  FALTANDO na VPS:');
          missingInVps.forEach(name => {
            const localCol = localCols.find(c => c.column_name === name);
            console.log(`    - ${name}: ${localCol.data_type}`);
          });
        }
        
        if (extraInVps.length > 0) {
          console.log('  EXCESSO na VPS:');
          extraInVps.forEach(name => {
            const vpsCol = vpsCols.rows.find(c => c.column_name === name);
            console.log(`    - ${name}: ${vpsCol.data_type}`);
          });
        }
        
        if (missingInVps.length === 0 && extraInVps.length === 0) {
          console.log('  -> Estrutura IDÊNTICA');
        }
        
      } catch (e) {
        console.log(`  -> ERRO ao acessar tabela: ${e.message}`);
      }
      
      console.log('\n' + '='.repeat(50) + '\n');
    }
    
  } catch (error) {
    console.error('Erro na comparação:', error.message);
    throw error;
  }
}

compareDatabases().then(() => {
  console.log('=== COMPARAÇÃO CONCLUÍDA ===');
  process.exit(0);
}).catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
