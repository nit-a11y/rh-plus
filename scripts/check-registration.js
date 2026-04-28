const { query, getPool } = require('../backend/config/database');

async function check() {
  try {
    console.log('🔍 Verificando colunas de registration...\n');
    
    const result = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'employees' 
      ORDER BY column_name
    `);
    
    console.log('Todas as colunas da tabela employees:');
    result.rows.forEach(r => console.log(` - ${r.column_name}`));
    
    const regCols = result.rows.filter(r => 
      r.column_name.toLowerCase().includes('registration')
    );
    
    console.log('\n🔎 Colunas com "registration":');
    if (regCols.length > 0) {
      regCols.forEach(r => console.log(` ✅ ${r.column_name}`));
    } else {
      console.log(' ❌ Nenhuma coluna encontrada');
    }
    
  } catch (e) {
    console.error('❌ Erro:', e.message);
  }
  
  const pool = getPool();
  await pool.end();
  process.exit(0);
}

check();
