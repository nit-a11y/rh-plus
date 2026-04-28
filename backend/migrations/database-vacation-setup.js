/* VACATION DATABASE SETUP - Criação e Migração de Tabelas */

const db = require('./database');

// Função para criar tabela de férias se não existir
function createVacationTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS vacation_records (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      days_taken INTEGER NOT NULL,
      abono_days INTEGER DEFAULT 0,
      total_value REAL DEFAULT 0,
      status TEXT DEFAULT 'Planejado',
      observation TEXT,
      approved_by TEXT,
      approved_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    );
  `;
  
  db.run(sql, (err) => {
    if (err) {
      console.error('Erro ao criar tabela vacation_records:', err);
    } else {
      console.log('✅ Tabela vacation_records criada/verificada com sucesso');
      
      // Cria índices para performance
      createVacationIndexes();
    }
  });
}

// Função para criar índices
function createVacationIndexes() {
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_vacation_records_employee_id ON vacation_records(employee_id)',
    'CREATE INDEX IF NOT EXISTS idx_vacation_records_start_date ON vacation_records(start_date)',
    'CREATE INDEX IF NOT EXISTS idx_vacation_records_status ON vacation_records(status)',
    'CREATE INDEX IF NOT EXISTS idx_vacation_records_employee_status ON vacation_records(employee_id, status)'
  ];
  
  indexes.forEach((indexSql, index) => {
    db.run(indexSql, (err) => {
      if (err) {
        console.error(`Erro ao criar índice ${index + 1}:`, err);
      } else {
        console.log(`✅ Índice ${index + 1} criado com sucesso`);
      }
    });
  });
}

// Função para migrar dados existentes (se houver)
function migrateExistingData() {
  // Verifica se já existem dados na tabela
  db.get('SELECT COUNT(*) as count FROM vacation_records', [], (err, row) => {
    if (err) {
      console.error('Erro ao verificar dados existentes:', err);
      return;
    }
    
    if (row.count === 0) {
      console.log('📋 Tabela vazia, pronto para novos dados');
    } else {
      console.log(`📊 Encontrados ${row.count} registros existentes`);
    }
  });
}

// Função para popular dados de exemplo (desenvolvimento)
function seedSampleData() {
  const sampleData = [
    {
      id: 'vac001',
      employee_id: 'emp001',
      start_date: '2024-01-15',
      end_date: '2024-02-13',
      days_taken: 30,
      abono_days: 0,
      total_value: 3000,
      status: 'Gozado',
      observation: 'Férias anuais regulares',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'vac002',
      employee_id: 'emp002',
      start_date: '2024-03-01',
      end_date: '2024-03-15',
      days_taken: 15,
      abono_days: 0,
      total_value: 1500,
      status: 'Planejado',
      observation: 'Férias parceladas',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
  
  // Verifica se já existem dados antes de popular
  db.get('SELECT COUNT(*) as count FROM vacation_records', [], (err, row) => {
    if (err) {
      console.error('Erro ao verificar dados:', err);
      return;
    }
    
    if (row.count === 0) {
      // Insere dados de exemplo
      const sql = `
        INSERT INTO vacation_records (
          id, employee_id, start_date, end_date, days_taken, 
          abono_days, total_value, status, observation, 
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      sampleData.forEach((data, index) => {
        db.run(sql, [
          data.id, data.employee_id, data.start_date, data.end_date,
          data.days_taken, data.abono_days, data.total_value,
          data.status, data.observation, data.created_at, data.updated_at
        ], function(err) {
          if (err) {
            console.error(`Erro ao inserir dados de exemplo ${index + 1}:`, err);
          } else {
            console.log(`✅ Dados de exemplo ${index + 1} inseridos com sucesso`);
          }
        });
      });
    }
  });
}

// Executa setup completo
function setupVacationDatabase() {
  console.log('🚀 Iniciando setup do banco de dados de férias...');
  
  createVacationTable();
  
  // Aguarda um pouco para a tabela ser criada
  setTimeout(() => {
    migrateExistingData();
    
    // Descomente para popular dados de exemplo (apenas desenvolvimento)
    // seedSampleData();
    
    console.log('✅ Setup do banco de dados de férias concluído!');
  }, 1000);
}

// Exporta funções
module.exports = {
  setupVacationDatabase,
  createVacationTable,
  migrateExistingData,
  seedSampleData
};
