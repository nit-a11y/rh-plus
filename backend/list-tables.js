const { query } = require('./config/database');

async function listTables() {
  try {
    const result = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('Tabelas encontradas:');
    result.rows.forEach(t => console.log('- ' + t.table_name));
    
    return result.rows;
  } catch (error) {
    console.error('Erro:', error.message);
    throw error;
  }
}

listTables();
