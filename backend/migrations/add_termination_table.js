/**
 * Migração: Criar tabela employee_terminations
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

    console.log('🔧 Criando tabela employee_terminations...\n');

    db.serialize(() => {
        // Criar tabela
        db.run(`CREATE TABLE IF NOT EXISTS employee_terminations (
            id TEXT PRIMARY KEY,
            employee_id TEXT NOT NULL,
            termination_date TEXT,
            termination_reason TEXT,
            observation TEXT,
            grrf_value REAL DEFAULT 0,
            rescisao_value REAL DEFAULT 0,
            responsible TEXT,
            created_at TEXT DEFAULT (datetime('now', 'localtime'))
        )`, (err) => {
            if (err) {
                console.log('   ❌ Erro ao criar tabela:', err.message);
            } else {
                console.log('   ✅ Tabela employee_terminations criada');
            }
        });

        // Criar índice
        db.run(`CREATE INDEX IF NOT EXISTS idx_terminations_employee ON employee_terminations(employee_id)`, (err) => {
            if (err) {
                console.log('   ❌ Erro ao criar índice:', err.message);
            } else {
                console.log('   ✅ Índice criado');
            }
        });

        // Verificar se colunas existem em employees
        db.all(`PRAGMA table_info(employees)`, (err, rows) => {
            if (err || !rows) {
                console.log('   ⚠️ Não foi possível verificar colunas da tabela employees');
                db.close();
                return;
            }

            const cols = rows.map(c => c.name);

            // Adicionar terminationDate se não existir
            if (!cols.includes('terminationDate')) {
                db.run(`ALTER TABLE employees ADD COLUMN terminationDate TEXT`, (err) => {
                    if (err) console.log('   ❌ Erro ao adicionar terminationDate:', err.message);
                    else console.log('   ✅ Coluna terminationDate adicionada');
                });
            } else {
                console.log('   ℹ️ Coluna terminationDate já existe');
            }

            // Adicionar terminationReason se não existir
            if (!cols.includes('terminationReason')) {
                db.run(`ALTER TABLE employees ADD COLUMN terminationReason TEXT`, (err) => {
                    if (err) console.log('   ❌ Erro ao adicionar terminationReason:', err.message);
                    else console.log('   ✅ Coluna terminationReason adicionada');
                });
            } else {
                console.log('   ℹ️ Coluna terminationReason já existe');
            }

            setTimeout(() => {
                console.log('\n✨ Migração concluída!');
                db.close();
            }, 1000);
        });
    });
}

// Executar se chamado diretamente
if (require.main === module) {
    runMigration();
}

module.exports = { runMigration };
