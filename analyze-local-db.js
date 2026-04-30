const { query } = require('./backend/config/database');
const fs = require('fs');

async function analyzeLocalDatabase() {
  console.log('=== ANÁLISE COMPLETA DO BANCO LOCAL ===\n');
  
  try {
    // 1. Listar todas as tabelas
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('TABELAS ENCONTRADAS:');
    tablesResult.rows.forEach(t => console.log(`- ${t.table_name}`));
    console.log(`\nTotal: ${tablesResult.rows.length} tabelas\n`);
    
    // 2. Analisar estrutura de cada tabela
    const dbStructure = {};
    
    for (const table of tablesResult.rows) {
      const tableName = table.table_name;
      
      // Obter colunas
      const columnsResult = await query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = '${tableName}' 
        ORDER BY ordinal_position
      `);
      
      // Obter constraints
      const constraintsResult = await query(`
        SELECT constraint_name, constraint_type
        FROM information_schema.table_constraints 
        WHERE table_name = '${tableName}'
      `);
      
      // Obter índices
      const indexesResult = await query(`
        SELECT indexname, indexdef
        FROM pg_indexes 
        WHERE tablename = '${tableName}'
      `);
      
      // Contar registros
      let count = 0;
      try {
        const countResult = await query(`SELECT COUNT(*) as count FROM ${tableName}`);
        count = parseInt(countResult.rows[0].count);
      } catch (e) {
        count = 0;
      }
      
      dbStructure[tableName] = {
        columns: columnsResult.rows,
        constraints: constraintsResult.rows,
        indexes: indexesResult.rows,
        recordCount: count
      };
      
      console.log(`\n=== TABELA: ${tableName} ===`);
      console.log(`Registros: ${count}`);
      console.log('\nColunas:');
      columnsResult.rows.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default || ''}`);
      });
      
      if (constraintsResult.rows.length > 0) {
        console.log('\nConstraints:');
        constraintsResult.rows.forEach(con => {
          console.log(`  - ${con.constraint_name}: ${con.constraint_type}`);
        });
      }
      
      if (indexesResult.rows.length > 0) {
        console.log('\nÍndices:');
        indexesResult.rows.forEach(idx => {
          console.log(`  - ${idx.indexname}`);
        });
      }
    }
    
    // 3. Salvar estrutura completa
    const structureFile = 'backups/migracao/local-db-structure.json';
    if (!fs.existsSync('backups/migracao')) {
      fs.mkdirSync('backups/migracao', { recursive: true });
    }
    fs.writeFileSync(structureFile, JSON.stringify(dbStructure, null, 2));
    console.log(`\n\nEstrutura completa salva em: ${structureFile}`);
    
    // 4. Focar nas tabelas principais que o sistema usa
    console.log('\n=== TABELAS PRINCIPAIS DO SISTEMA ===');
    const mainTables = ['users', 'employees', 'companies', 'roles_master', 'population_history'];
    
    for (const tableName of mainTables) {
      if (dbStructure[tableName]) {
        console.log(`\n--- ${tableName.toUpperCase()} ---`);
        console.log(`Registros: ${dbStructure[tableName].recordCount}`);
        console.log('Colunas principais:');
        dbStructure[tableName].columns.forEach(col => {
          if (['id', 'name', 'username', 'email', 'photoUrl', 'created_at', 'updated_at'].includes(col.column_name)) {
            console.log(`  - ${col.column_name}: ${col.data_type}`);
          }
        });
      }
    }
    
    return dbStructure;
    
  } catch (error) {
    console.error('Erro na análise:', error.message);
    throw error;
  }
}

analyzeLocalDatabase().then(() => {
  console.log('\n=== ANÁLISE CONCLUÍDA ===');
  process.exit(0);
}).catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
