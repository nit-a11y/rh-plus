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

// Lista de todas as tabelas que precisam existir
const tables = [
  'aso_history', 'aso_records', 'benefit_history', 'career_history', 'companies',
  'employee_archive', 'employee_benefits', 'employee_dependents', 'employee_documents',
  'employee_emergency_contacts', 'employee_terminations', 'employee_vinculo_transfers',
  'employee_vinculos', 'goals', 'human_center_events', 'kit_items', 'kits_master',
  'notifications', 'occurrences', 'onboarding_cargo_config', 'onboarding_steps',
  'overtime_records', 'population_history', 'recruitment_candidate_history',
  'recruitment_candidates', 'recruitment_hires', 'recruitment_jobs',
  'recruitment_pipeline_stages', 'recruitment_stage_outcomes', 'roles_master',
  'sst_certificates', 'sst_event_documents', 'talent_pool', 'tool_history',
  'tool_items', 'uniform_history', 'uniform_items', 'user_activity_log',
  'user_demands', 'user_sessions', 'users', 'vacation_records'
];

async function createTablesFromStructure() {
  try {
    console.log('Criando tabelas na VPS baseado na estrutura dos backups...');
    
    for (const tableName of tables) {
      try {
        // Verificar se o arquivo de backup existe
        const backupFile = `/tmp/${tableName}_backup.json`;
        if (!fs.existsSync(backupFile)) {
          console.log(`  -> ${tableName}: arquivo de backup não encontrado`);
          continue;
        }
        
        // Ler estrutura do backup
        const data = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
        
        if (data.length === 0) {
          console.log(`  -> ${tableName}: tabela vazia, ignorando`);
          continue;
        }
        
        // Obter colunas e tipos (simplificado)
        const columns = Object.keys(data[0]);
        const columnDefinitions = columns.map(col => {
          // Tentar inferir tipo baseado no primeiro valor
          const sampleValue = data[0][col];
          let dataType = 'TEXT';
          
          if (typeof sampleValue === 'number') {
            dataType = sampleValue % 1 === 0 ? 'INTEGER' : 'DECIMAL';
          } else if (sampleValue instanceof Date) {
            dataType = 'DATE';
          } else if (typeof sampleValue === 'boolean') {
            dataType = 'BOOLEAN';
          }
          
          return `${col} ${dataType}`;
        }).join(', ');
        
        // Criar tabela
        await pool.query(`
          CREATE TABLE IF NOT EXISTS ${tableName} (
            id SERIAL PRIMARY KEY,
            ${columnDefinitions}
          )
        `);
        
        console.log(`  -> ${tableName}: tabela criada com ${columns.length} colunas`);
        
      } catch (error) {
        console.error(`  -> Erro criando tabela ${tableName}:`, error.message);
      }
    }
    
    console.log('Criação de tabelas concluída!');
    
  } catch (error) {
    console.error('Erro geral:', error.message);
    throw error;
  }
}

createTablesFromStructure().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
