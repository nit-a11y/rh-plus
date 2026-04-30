const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'rh',
  user: 'rh_user',
  password: 'RhPlus2026!Secure'
});

async function migrateUsers() {
  try {
    console.log('Migrando users...');
    const data = JSON.parse(fs.readFileSync('/tmp/users_backup.json', 'utf8'));
    
    await pool.query('BEGIN');
    
    for (const user of data) {
      const columns = Object.keys(user);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      const values = columns.map(col => user[col]);
      
      await pool.query(`
        INSERT INTO users (${columns.join(', ')})
        VALUES (${placeholders})
      `, values);
    }
    
    await pool.query('COMMIT');
    console.log(`Users migrados: ${data.length}`);
    
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Erro:', error.message);
  }
}

migrateUsers().then(() => process.exit(0));
