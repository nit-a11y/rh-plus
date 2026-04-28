/**
 * Migração: Criar tabela de Hora Extra
 * Data: 2026-04-10
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/database.sqlite');

function runMigration() {
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('❌ Erro ao conectar ao banco:', err.message);
            process.exit(1);
        }
        console.log('✅ Conectado ao banco de dados\n');
    });

    console.log('⏰ Criando tabela de Hora Extra...\n');

    db.serialize(() => {
        // Criar tabela
        db.run(`CREATE TABLE IF NOT EXISTS overtime_records (
            id TEXT PRIMARY KEY,
            employee_id TEXT NOT NULL,
            month_year TEXT NOT NULL,
            overtime_time TEXT,
            overtime_value REAL DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now', 'localtime')),
            created_by TEXT,
            FOREIGN KEY (employee_id) REFERENCES employees(id)
        )`, (err) => {
            if (err) {
                console.log('   ❌ Erro ao criar tabela:', err.message);
            } else {
                console.log('   ✅ Tabela overtime_records criada');
            }
        });

        // Criar índices
        db.run(`CREATE INDEX IF NOT EXISTS idx_overtime_employee ON overtime_records(employee_id)`, (err) => {
            if (err) console.log('   ❌ Erro ao criar índice employee:', err.message);
            else console.log('   ✅ Índice idx_overtime_employee criado');
        });

        db.run(`CREATE INDEX IF NOT EXISTS idx_overtime_month ON overtime_records(month_year)`, (err) => {
            if (err) console.log('   ❌ Erro ao criar índice month:', err.message);
            else console.log('   ✅ Índice idx_overtime_month criado');
        });

        // Verificar se foi criada
        db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='overtime_records'`, (err, row) => {
            if (row) {
                console.log('\n✨ Migração concluída com sucesso!\n');
            } else {
                console.log('\n⚠️ Tabela não encontrada após criação\n');
            }
            db.close();
        });
    });
}

// Executar se chamado diretamente
if (require.main === module) {
    runMigration();
}

module.exports = { runMigration };
