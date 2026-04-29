const { query } = require('./config/database');

async function testAPI() {
  try {
    console.log('Testando query do summary...');
    const result = await query(`
      SELECT 
        COUNT(DISTINCT c.id) as total_units,
        COUNT(e.id) as total_employees,
        COUNT(CASE WHEN e.type != 'Desligado' THEN 1 END) as active_employees,
        COUNT(CASE WHEN e.type = 'Desligado' THEN 1 END) as inactive_employees,
        ROUND(AVG(unit_counts.employee_count), 2) as avg_employees_per_unit
      FROM companies c
      LEFT JOIN employees e ON e.workplace_id = c.id
      LEFT JOIN (
        SELECT 
          workplace_id,
          COUNT(id) as employee_count
        FROM employees
        WHERE workplace_id IS NOT NULL
        GROUP BY workplace_id
      ) unit_counts ON c.id = unit_counts.workplace_id
      WHERE c.id IN (
        SELECT DISTINCT workplace_id FROM employees WHERE workplace_id IS NOT NULL
      )
    `);
    console.log('Resultado:', result.rows);
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

testAPI();
