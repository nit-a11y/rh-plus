const fs = require('fs');
const { Pool } = require('pg');

// Configurar conexão PostgreSQL VPS
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'rh',
  user: 'rh_user',
  password: 'RhPlus2026!Secure'
});

async function migrateEmployees() {
  try {
    console.log('Migrando employees...');
    const employees = JSON.parse(fs.readFileSync('/tmp/employees_backup.json', 'utf8'));
    
    await pool.query('BEGIN');
    
    for (const emp of employees) {
      await pool.query(`
        INSERT INTO employees (id, name, registration, company, cost_center, role, admission_date, termination_date, salary, type, workplace, directorate, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          registration = EXCLUDED.registration,
          company = EXCLUDED.company,
          cost_center = EXCLUDED.cost_center,
          role = EXCLUDED.role,
          admission_date = EXCLUDED.admission_date,
          termination_date = EXCLUDED.termination_date,
          salary = EXCLUDED.salary,
          type = EXCLUDED.type,
          workplace = EXCLUDED.workplace,
          directorate = EXCLUDED.directorate,
          status = EXCLUDED.status,
          updated_at = CURRENT_TIMESTAMP
      `, [emp.id, emp.name, emp.registration, emp.company, emp.cost_center, emp.role, emp.admission_date, emp.termination_date, emp.salary, emp.type, emp.workplace, emp.directorate, emp.status, emp.created_at, emp.updated_at]);
    }
    
    await pool.query('COMMIT');
    console.log('Employees migrados:', employees.length);
    
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Erro migrating employees:', error.message);
    throw error;
  }
}

async function migratePopulationHistory() {
  try {
    console.log('Migrando population_history...');
    const population = JSON.parse(fs.readFileSync('/tmp/population_history_backup.json', 'utf8'));
    
    await pool.query('BEGIN');
    
    for (const pop of population) {
      await pool.query(`
        INSERT INTO population_history (id, date, total_employees, active_employees, terminated_employees, clt_employees, pj_employees, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          date = EXCLUDED.date,
          total_employees = EXCLUDED.total_employees,
          active_employees = EXCLUDED.active_employees,
          terminated_employees = EXCLUDED.terminated_employees,
          clt_employees = EXCLUDED.clt_employees,
          pj_employees = EXCLUDED.pj_employees
      `, [pop.id, pop.date, pop.total_employees, pop.active_employees, pop.terminated_employees, pop.clt_employees, pop.pj_employees, pop.created_at]);
    }
    
    await pool.query('COMMIT');
    console.log('Population_history migrados:', population.length);
    
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Erro migrating population_history:', error.message);
    throw error;
  }
}

async function main() {
  try {
    await migrateEmployees();
    await migratePopulationHistory();
    console.log('Migração concluída com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('Erro na migração:', error.message);
    process.exit(1);
  }
}

main();
