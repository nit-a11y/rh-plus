const { query } = require('./backend/config/database');
const fs = require('fs');

async function createExactMigration() {
  console.log('=== CRIANDO MIGRAÇÃO EXATA ===\n');
  
  try {
    // 1. Ler estrutura local
    const localStructure = JSON.parse(fs.readFileSync('backups/migracao/local-db-structure.json', 'utf8'));
    
    // 2. Lista de tabelas para migrar (ignorando backups e testes)
    const tablesToMigrate = Object.keys(localStructure).filter(table => 
      !table.includes('backup') && 
      !table.includes('test_') &&
      localStructure[table].recordCount > 0
    );
    
    console.log(`Tabelas a migrar: ${tablesToMigrate.length}`);
    console.log('Tabelas:', tablesToMigrate.join(', '));
    
    // 3. Criar script SQL completo
    let migrationSQL = '-- MIGRAÇÃO EXATA DO BANCO LOCAL PARA VPS\n';
    migrationSQL += '-- Gerado em: ' + new Date().toISOString() + '\n\n';
    
    // 4. Para cada tabela, criar DDL + DML
    for (const tableName of tablesToMigrate) {
      const tableInfo = localStructure[tableName];
      const columns = tableInfo.columns;
      
      console.log(`\nProcessando tabela: ${tableName} (${tableInfo.recordCount} registros)`);
      
      // Criar DDL (CREATE TABLE)
      migrationSQL += `-- TABELA: ${tableName}\n`;
      migrationSQL += `DROP TABLE IF EXISTS ${tableName} CASCADE;\n`;
      migrationSQL += `CREATE TABLE ${tableName} (\n`;
      
      const columnDefs = columns.map(col => {
        let def = `  ${col.column_name} ${col.data_type}`;
        if (col.is_nullable === 'NO') def += ' NOT NULL';
        if (col.column_default) def += ` DEFAULT ${col.column_default}`;
        return def;
      });
      
      migrationSQL += columnDefs.join(',\n');
      migrationSQL += '\n);\n\n';
      
      // Adicionar dados (se houver registros)
      if (tableInfo.recordCount > 0) {
        migrationSQL += `-- Inserindo dados para ${tableName}\n`;
        
        // Ler backup
        const backupFile = `backups/migracao/complete/${tableName}_backup.json`;
        if (fs.existsSync(backupFile)) {
          const data = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
          
          // Gerar INSERTs
          for (const row of data) {
            const columns = Object.keys(row);
            const values = columns.map(col => {
              let val = row[col];
              if (val === null || val === undefined) return 'NULL';
              if (typeof val === 'string') {
                // Escapar aspas simples
                val = val.replace(/'/g, "''");
                return `'${val}'`;
              }
              if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
              return val;
            });
            
            migrationSQL += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
          }
        }
      }
      
      migrationSQL += '\n';
    }
    
    // 5. Salvar script SQL
    const sqlFile = 'backups/migracao/exact-migration.sql';
    fs.writeFileSync(sqlFile, migrationSQL);
    console.log(`\nScript SQL salvo em: ${sqlFile}`);
    
    // 6. Criar script Node.js para executar na VPS
    const vpsScript = `const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'rh',
  user: 'rh_user',
  password: 'RhPlus2026!Secure'
});

async function executeMigration() {
  try {
    console.log('Iniciando migração exata...');
    
    const sql = fs.readFileSync('/tmp/exact-migration.sql', 'utf8');
    
    await pool.query('BEGIN');
    
    // Executar cada comando separadamente
    const commands = sql.split(';').filter(cmd => cmd.trim());
    
    for (let i = 0; i < commands.length; i++) {
      const cmd = commands[i].trim();
      if (cmd) {
        try {
          await pool.query(cmd);
          if (i % 100 === 0) {
            console.log(\`Progresso: \${Math.round((i / commands.length) * 100)}%\`);
          }
        } catch (e) {
          console.error(\`Erro no comando \${i + 1}:\`, e.message);
          console.error(\`SQL:\`, cmd.substring(0, 200));
          throw e;
        }
      }
    }
    
    await pool.query('COMMIT');
    console.log('Migração concluída com sucesso!');
    
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Erro na migração:', error.message);
    process.exit(1);
  }
}

executeMigration().then(() => process.exit(0));`;
    
    const vpsScriptFile = 'backups/migracao/execute-exact-migration.js';
    fs.writeFileSync(vpsScriptFile, vpsScript);
    console.log(`Script VPS salvo em: ${vpsScriptFile}`);
    
    console.log('\n=== MIGRAÇÃO EXATA CRIADA ===');
    console.log('Para executar:');
    console.log('1. scp backups/migracao/exact-migration.sql root@147.93.10.11:/tmp/');
    console.log('2. scp backups/migracao/execute-exact-migration.js root@147.93.10.11:/tmp/');
    console.log('3. ssh root@147.93.10.11 "cd /var/www/rh-plus && cp /tmp/execute-exact-migration.js . && node execute-exact-migration.js"');
    
  } catch (error) {
    console.error('Erro:', error.message);
    throw error;
  }
}

createExactMigration().then(() => {
  console.log('\n=== SCRIPTS CRIADOS ===');
  process.exit(0);
}).catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
