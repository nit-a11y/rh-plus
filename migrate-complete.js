const { query } = require('./backend/config/database');
const fs = require('fs');

// Lista de todas as tabelas encontradas
const tables = [
  'aso_history', 'aso_records', 'benefit_history', 'career_history', 'companies',
  'employee_archive', 'employee_benefits', 'employee_dependents', 'employee_documents',
  'employee_emergency_contacts', 'employee_terminations', 'employee_vinculo_transfers',
  'employee_vinculos', 'employees', 'employees_backup_2026_04_29', 'employees_backup_2026_04_29t13_28_32',
  'employees_backup_2026_04_29t13_29_16', 'goals', 'human_center_events', 'kit_items',
  'kits_master', 'notifications', 'occurrences', 'onboarding_cargo_config', 'onboarding_steps',
  'overtime_records', 'population_history', 'recruitment_candidate_history', 'recruitment_candidates',
  'recruitment_hires', 'recruitment_jobs', 'recruitment_pipeline_stages', 'recruitment_stage_outcomes',
  'roles_master', 'sst_certificates', 'sst_event_documents', 'talent_pool', 'test_case',
  'test_col', 'tool_history', 'tool_items', 'uniform_history', 'uniform_items',
  'user_activity_log', 'user_demands', 'user_sessions', 'users', 'vacation_records'
];

// Ignorar tabelas de backup
const ignoreTables = [
  'employees_backup_2026_04_29',
  'employees_backup_2026_04_29t13_28_32',
  'employees_backup_2026_04_29t13_29_16',
  'test_case',
  'test_col'
];

const tablesToMigrate = tables.filter(t => !ignoreTables.includes(t));

async function backupAllTables() {
  console.log('Iniciando backup completo de todas as tabelas...');
  
  const backupDir = 'backups/migracao/complete';
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  for (const tableName of tablesToMigrate) {
    try {
      console.log(`Fazendo backup da tabela: ${tableName}`);
      
      const result = await query(`SELECT * FROM ${tableName}`);
      const data = JSON.stringify(result.rows, null, 2);
      
      const filename = `${backupDir}/${tableName}_backup.json`;
      fs.writeFileSync(filename, data);
      
      console.log(`  -> ${result.rows.length} registros salvos em ${filename}`);
      
    } catch (error) {
      console.error(`  -> Erro no backup da tabela ${tableName}:`, error.message);
    }
  }
  
  console.log('Backup completo concluído!');
}

async function createMigrationScript() {
  console.log('Criando script de migração para VPS...');
  
  let script = `const fs = require('fs');
const { Pool } = require('pg');

// Configurar conexão PostgreSQL VPS
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'rh',
  user: 'rh_user',
  password: 'RhPlus2026!Secure'
});

async function migrateTable(tableName) {
  try {
    console.log(\`Migrando tabela: \${tableName}...\`);
    
    const data = JSON.parse(fs.readFileSync(\`/tmp/\${tableName}_backup.json\`, 'utf8'));
    
    if (data.length === 0) {
      console.log(\`  -> Tabela \${tableName} está vazia\`);
      return;
    }
    
    await pool.query('BEGIN');
    
    // Obter colunas da tabela
    const columns = Object.keys(data[0]);
    const placeholders = columns.map((_, i) => \`$\${i + 1}\`).join(', ');
    const columnNames = columns.join(', ');
    
    // Criar query de inserção com ON CONFLICT para a primeira coluna (geralmente ID)
    const firstColumn = columns[0];
    
    for (const row of data) {
      const values = columns.map(col => row[col]);
      
      await pool.query(\`
        INSERT INTO \${tableName} (\${columnNames})
        VALUES (\${placeholders})
        ON CONFLICT (\${firstColumn}) DO UPDATE SET
          \${columns.filter(col => col !== firstColumn).map(col => \`\${col} = EXCLUDED.\${col}\`).join(', ')}
      \`, values);
    }
    
    await pool.query('COMMIT');
    console.log(\`  -> \${data.length} registros migrados\`);
    
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error(\`  -> Erro migrando tabela \${tableName}:\`, error.message);
    throw error;
  }
}

async function main() {
  try {
    const tables = [${tablesToMigrate.map(t => `'${t}'`).join(', ')}];
    
    for (const table of tables) {
      await migrateTable(table);
    }
    
    console.log('Migração completa concluída com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('Erro na migração:', error.message);
    process.exit(1);
  }
}

main();
`;

  fs.writeFileSync('../migrate-vps-complete.js', script);
  console.log('Script de migração criado: migrate-vps-complete.js');
}

async function main() {
  try {
    await backupAllTables();
    await createMigrationScript();
    console.log('Processo de preparação para migração concluído!');
    console.log('Execute os seguintes comandos:');
    console.log('1. scp backups/migracao/complete/*_backup.json root@147.93.10.11:/tmp/');
    console.log('2. scp migrate-vps-complete.js root@147.93.10.11:/tmp/');
    console.log('3. ssh root@147.93.10.11 "cd /tmp && node migrate-vps-complete.js"');
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

main();
