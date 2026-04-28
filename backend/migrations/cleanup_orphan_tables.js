/**
 * Migração: Limpar tabelas e views orfãs
 * Data: 2026-04-10
 * 
 * Tabelas/Views a remover:
 * - custom_events (não usada no código)
 * - logs_auditoria (não usada no código)
 * - monitoring_rules (não usada no código)
 * - user_action_history (não usada no código)
 * - vw_bi_colaboradores_completos (view não usada)
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/database.sqlite');

const TABLES_TO_DROP = [
    'custom_events',
    'logs_auditoria',
    'monitoring_rules',
    'user_action_history'
];

const VIEWS_TO_DROP = [
    'vw_bi_colaboradores_completos'
];

function runMigration() {
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('❌ Erro ao conectar ao banco:', err.message);
            process.exit(1);
        }
        console.log('✅ Conectado ao banco de dados\n');
    });

    console.log('🧹 Iniciando limpeza de tabelas/views orfãs...\n');

    let droppedTables = 0;
    let droppedViews = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Processar views primeiro
    function dropViews(index, callback) {
        if (index >= VIEWS_TO_DROP.length) {
            return callback();
        }

        const view = VIEWS_TO_DROP[index];
        db.run(`DROP VIEW IF EXISTS ${view}`, (err) => {
            if (err) {
                console.log(`   ❌ Erro ao remover view ${view}: ${err.message}`);
                errorCount++;
            } else {
                console.log(`   ✅ View removida: ${view}`);
                droppedViews++;
            }
            dropViews(index + 1, callback);
        });
    }

    // Processar tabelas
    function dropTables(index, callback) {
        if (index >= TABLES_TO_DROP.length) {
            return callback();
        }

        const table = TABLES_TO_DROP[index];
        db.run(`DROP TABLE IF EXISTS ${table}`, (err) => {
            if (err) {
                console.log(`   ❌ Erro ao remover tabela ${table}: ${err.message}`);
                errorCount++;
            } else {
                console.log(`   ✅ Tabela removida: ${table}`);
                droppedTables++;
            }
            dropTables(index + 1, callback);
        });
    }

    // Verificar o que existe antes de dropar
    db.all("SELECT name, type FROM sqlite_master WHERE type IN ('table', 'view')", (err, rows) => {
        if (err) {
            console.error('Erro ao listar objetos:', err);
            db.close();
            return;
        }

        const existing = rows.map(r => r.name);
        console.log('📋 Objetos existentes encontrados:', existing.length);

        // Filtrar apenas os que existem
        const tablesToDrop = TABLES_TO_DROP.filter(t => existing.includes(t));
        const viewsToDrop = VIEWS_TO_DROP.filter(v => existing.includes(v));

        if (tablesToDrop.length === 0 && viewsToDrop.length === 0) {
            console.log('\n✅ Nenhuma tabela/view orfã encontrada. Nada a fazer.\n');
            db.close();
            return;
        }

        console.log(`\n🗑️  Serão removidos:`);
        console.log(`   • ${tablesToDrop.length} tabela(s)`);
        console.log(`   • ${viewsToDrop.length} view(s)\n`);

        // Atualizar arrays para dropar apenas os existentes
        TABLES_TO_DROP.length = 0;
        TABLES_TO_DROP.push(...tablesToDrop);
        VIEWS_TO_DROP.length = 0;
        VIEWS_TO_DROP.push(...viewsToDrop);

        // Executar remoção
        dropViews(0, () => {
            dropTables(0, () => {
                // Resumo
                console.log(`\n📊 Resumo da Migração:`);
                console.log(`   ✅ Views removidas: ${droppedViews}`);
                console.log(`   ✅ Tabelas removidas: ${droppedTables}`);
                console.log(`   ⏭️  Inexistentes (pulados): ${skippedCount}`);
                console.log(`   ❌ Erros: ${errorCount}`);
                console.log('\n✨ Limpeza concluída!\n');

                // Atualizar EXPECTED_TABLES no database.js
                console.log('⚠️  IMPORTANTE: Remova manualmente do database.js se estiver em EXPECTED_TABLES:');
                if (tablesToDrop.includes('custom_events')) console.log('   - custom_events');
                if (tablesToDrop.includes('logs_auditoria')) console.log('   - logs_auditoria');
                if (tablesToDrop.includes('monitoring_rules')) console.log('   - monitoring_rules');
                if (tablesToDrop.includes('user_action_history')) console.log('   - user_action_history');
                if (viewsToDrop.includes('vw_bi_colaboradores_completos')) console.log('   - vw_bi_colaboradores_completos (view)');
                console.log('');

                db.close();
            });
        });
    });
}

// Executar se chamado diretamente
if (require.main === module) {
    runMigration();
}

module.exports = { runMigration, TABLES_TO_DROP, VIEWS_TO_DROP };
