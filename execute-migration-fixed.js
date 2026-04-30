const fs = require('fs');
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
    
    await pool.query('SET search_path TO public');
    await pool.query('BEGIN');
    
    const commands = sql.split(';').filter(cmd => cmd.trim());
    
    for (let i = 0; i < commands.length; i++) {
      const cmd = commands[i].trim();
      if (cmd) {
        try {
          await pool.query(cmd);
          if (i % 100 === 0) {
            console.log(`Progresso: ${Math.round((i / commands.length) * 100)}%`);
          }
        } catch (e) {
          console.error(`Erro no comando ${i + 1}:`, e.message);
          console.error(`SQL:`, cmd.substring(0, 200));
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

executeMigration().then(() => process.exit(0));
