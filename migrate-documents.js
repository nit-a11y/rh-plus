const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'rh',
  user: 'rh_user',
  password: 'RhPlus2026!Secure'
});

async function migrateEmployeeDocuments() {
  try {
    console.log('Migrando employee_documents...');
    const data = JSON.parse(fs.readFileSync('/tmp/employee_documents_backup.json', 'utf8'));
    
    await pool.query('BEGIN');
    
    for (const doc of data) {
      const columns = Object.keys(doc);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      const values = columns.map(col => doc[col]);
      
      await pool.query(`
        INSERT INTO employee_documents (${columns.join(', ')})
        VALUES (${placeholders})
      `, values);
    }
    
    await pool.query('COMMIT');
    console.log(`Employee_documents migrados: ${data.length}`);
    
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Erro:', error.message);
  }
}

migrateEmployeeDocuments().then(() => process.exit(0));
