const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'rh',
  user: 'rh_user',
  password: 'RhPlus2026!Secure'
});

async function updatePhotoUrl() {
  try {
    console.log('Atualizando photoUrl...');
    const data = JSON.parse(fs.readFileSync('/tmp/users_backup.json', 'utf8'));
    
    await pool.query('BEGIN');
    
    for (const user of data) {
      if (user.photoUrl) {
        await pool.query(`
          UPDATE users SET photoUrl = $1 WHERE id = $2
        `, [user.photoUrl, user.id]);
      }
    }
    
    await pool.query('COMMIT');
    console.log('PhotoUrl atualizado com sucesso!');
    
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Erro:', error.message);
  }
}

updatePhotoUrl().then(() => process.exit(0));
