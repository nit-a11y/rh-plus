const { query } = require('./config/database');

async function testTables() {
  try {
    console.log('=== VERIFICANDO TABELAS E DADOS ===');
    
    // Verificar se population_history existe
    console.log('\n1. Verificando tabelas population...');
    const tables = await query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name LIKE '%population%'
    `);
    console.log('Tabelas encontradas:', tables.rows.map(r => r.table_name));
    
    // Verificar dados principais
    console.log('\n2. Verificando dados principais...');
    const employees = await query('SELECT COUNT(*) as count FROM employees');
    const companies = await query('SELECT COUNT(*) as count FROM companies');
    console.log('Total Employees:', employees.rows[0].count);
    console.log('Total Companies:', companies.rows[0].count);
    
    // Verificar relacionamento
    console.log('\n3. Verificando relacionamento...');
    const related = await query(`
      SELECT COUNT(*) as count FROM employees e
      JOIN companies c ON e.workplace_id = c.id
      WHERE e.workplace_id IS NOT NULL
    `);
    console.log('Employees com workplace:', related.rows[0].count);
    
    // Testar query do summary
    console.log('\n4. Testando query do summary...');
    const summary = await query(`
      SELECT 
        COUNT(DISTINCT c.id) as total_units,
        COUNT(e.id) as total_employees,
        COUNT(CASE WHEN e.type != 'Desligado' THEN 1 END) as active_employees,
        COUNT(CASE WHEN e.type = 'Desligado' THEN 1 END) as inactive_employees
      FROM companies c
      LEFT JOIN employees e ON e.workplace_id = c.id
      WHERE c.id IN (
        SELECT DISTINCT workplace_id FROM employees WHERE workplace_id IS NOT NULL
      )
    `);
    console.log('Summary result:', summary.rows[0]);
    
    // Testar query do units
    console.log('\n5. Testando query do units...');
    const units = await query(`
      SELECT 
        c.id as unit_id,
        c.name as unit_name,
        c.cnpj,
        COUNT(e.id) as total_employees,
        COUNT(CASE WHEN e.type != 'Desligado' THEN 1 END) as active_employees,
        COUNT(CASE WHEN e.type = 'Desligado' THEN 1 END) as inactive_employees
      FROM companies c
      LEFT JOIN employees e ON e.workplace_id = c.id
      WHERE c.id IN (
        SELECT DISTINCT workplace_id FROM employees WHERE workplace_id IS NOT NULL
      )
      GROUP BY c.id, c.name, c.cnpj
      ORDER BY c.name ASC
      LIMIT 3
    `);
    console.log('Units result (primeiros 3):');
    units.rows.forEach(unit => {
      console.log(`- ${unit.unit_name}: ${unit.total_employees} total, ${unit.active_employees} ativos`);
    });
    
    // Verificar se há alguma tabela de histórico
    console.log('\n6. Verificando tabelas de histórico...');
    const historyTables = await query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND (table_name LIKE '%history%' OR table_name LIKE '%temporal%')
    `);
    console.log('Tabelas de histórico:', historyTables.rows.map(r => r.table_name));
    
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

testTables();
