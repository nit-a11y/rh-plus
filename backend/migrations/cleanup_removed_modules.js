/**
 * Migração: Limpar tabelas dos módulos removidos
 * Módulos removidos: B.I. Estratégico, Galeria de Temas, Auditoria do Sistema
 * Data: 2026-04-09
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/database.sqlite');

const TABLES_TO_DROP = [
    // Tabelas de BI (B.I. Estratégico)
    'bi_dim_date',
    'bi_dim_employee',
    'bi_dim_location',
    'bi_fact_headcount_daily',
    'bi_fact_turnover_monthly',
    'bi_fact_overtime_monthly',
    'bi_fact_recruitment_pipeline',
    'bi_fact_sessions_daily',
    'bi_etl_runs',
    // Views de BI
    'vw_bi_headcount_daily',
    'vw_bi_turnover_monthly',
    'vw_bi_sessions_daily',
    'vw_bi_employee_dim',
    'vw_bi_recruitment_pipeline',
    'vw_bi_colaboradores',
    'vw_bi_kpis',
    // Tabela de Temas (Galeria de Temas)
    'themes',
    // Tabela de Auditoria (Auditoria do Sistema)
    'system_audit'
];

function runMigration() {
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('❌ Erro ao conectar ao banco:', err.message);
            process.exit(1);
        }
        console.log('✅ Conectado ao banco de dados');
    });

    console.log('\n🧹 Iniciando limpeza das tabelas obsoletas...\n');

    let droppedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Processar drops sequencialmente
    function dropNext(index) {
        if (index >= TABLES_TO_DROP.length) {
            console.log(`\n📊 Resumo:`);
            console.log(`   ✅ Tabelas removidas: ${droppedCount}`);
            console.log(`   ⏭️  Tabelas inexistentes (puladas): ${skippedCount}`);
            console.log(`   ❌ Erros: ${errorCount}`);
            console.log('\n✨ Migração concluída!\n');
            
            // Atualizar EXPECTED_TABLES no código (instrução manual)
            console.log('⚠️  IMPORTANTE: Remova manualmente do database.js:');
            console.log('   - themes');
            console.log('   - system_audit');
            console.log('   - Todas as tabelas bi_*');
            console.log('   - Todas as views vw_bi_*\n');
            
            db.close();
            return;
        }

        const table = TABLES_TO_DROP[index];
        
        db.run(`DROP TABLE IF EXISTS ${table}`, (err) => {
            if (err) {
                // Tentar como view se falhar como tabela
                db.run(`DROP VIEW IF EXISTS ${table}`, (viewErr) => {
                    if (viewErr) {
                        console.log(`   ❌ Erro ao remover ${table}: ${viewErr.message}`);
                        errorCount++;
                    } else {
                        console.log(`   ✅ View removida: ${table}`);
                        droppedCount++;
                    }
                    dropNext(index + 1);
                });
            } else {
                console.log(`   ✅ Tabela removida: ${table}`);
                droppedCount++;
                dropNext(index + 1);
            }
        });
    }

    // Verificar tabelas existentes antes
    db.all("SELECT name FROM sqlite_master WHERE type IN ('table', 'view')", (err, rows) => {
        if (err) {
            console.error('Erro ao listar tabelas:', err);
            return;
        }
        
        const existing = rows.map(r => r.name);
        console.log('📋 Tabelas/Views existentes encontradas:', existing.length);
        
        // Filtrar apenas as que existem
        const toDrop = TABLES_TO_DROP.filter(t => existing.includes(t));
        
        if (toDrop.length === 0) {
            console.log('\n✅ Nenhuma tabela obsoleta encontrada. Nada a fazer.\n');
            db.close();
            return;
        }
        
        console.log(`\n🗑️  Serão removidas ${toDrop.length} tabelas/views...\n`);
        
        // Recriar array apenas com as existentes
        TABLES_TO_DROP.length = 0;
        TABLES_TO_DROP.push(...toDrop);
        
        dropNext(0);
    });
}

// Executar se chamado diretamente
if (require.main === module) {
    runMigration();
}

module.exports = { runMigration, TABLES_TO_DROP };
