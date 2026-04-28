#!/usr/bin/env node
/**
 * 🔄 SCRIPT DE MIGRAÇÃO: SQLite → PostgreSQL
 * Migra dados do banco SQLite atualizado para PostgreSQL
 */

const fs = require('fs');
const path = require('path');

// Verificar se sqlite3 está instalado
try {
    require('sqlite3');
} catch (e) {
    console.error('❌ sqlite3 não está instalado. Execute primeiro:');
    console.error('   npm install sqlite3');
    process.exit(1);
}

const sqlite3 = require('sqlite3').verbose();
const { query, getPool } = require('../backend/config/database');

// Configurações
const SQLITE_PATH = path.join(__dirname, '../backend/database/database.sqlite');
const BATCH_SIZE = 100; // Inserir em lotes para evitar sobrecarga

// Lista de tabelas para migrar (na ordem de dependências)
const TABLES = [
    // 1. Tabelas base (sem FK)
    'users',
    'companies',
    'roles_master',
    'recruitment_pipeline_stages',
    
    // 2. Funcionários
    'employees',
    'employees_pro',
    'career_history',
    'termination_records',
    
    // 3. Recrutamento
    'recruitment_jobs',
    'recruitment_candidates',
    'recruitment_candidate_history',
    'recruitment_interviews',
    
    // 4. Férias
    'vacation_records',
    'vacation_planning',
    
    // 5. Uniformes
    'uniform_items',
    'uniform_history',
    
    // 6. ASO/SST
    'aso_records',
    'sst_certificates',
    
    // 7. Horas extras
    'overtime_records',
    'overtime_compensations',
    
    // 8. Ocorrências
    'occurrences',
    'occurrence_history',
    
    // 9. Kits
    'kits',
    'kit_items',
    'kit_assignments',
    
    // 10. Transferências
    'transfer_requests',
    'transfer_history',
    
    // 11. Centro Humano
    'goals',
    'user_demands',
    'activity_log',
    
    // 12. Arquivamento
    'archived_employees',
    
    // 13. Outros
    'sst_training',
    'document_requests',
    'notifications'
];

// Estatísticas
const stats = {
    tabelasProcessadas: 0,
    registrosMigrados: 0,
    registrosIgnorados: 0,
    erros: []
};

/**
 * Verificar se tabela existe no PostgreSQL
 */
async function tableExistsPostgreSQL(tableName) {
    try {
        const result = await query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = $1
            )
        `, [tableName]);
        return result.rows[0].exists;
    } catch (err) {
        console.error(`   ❌ Erro ao verificar tabela ${tableName}:`, err.message);
        return false;
    }
}

/**
 * Verificar se registro já existe (para evitar duplicatas)
 */
async function recordExistsPostgreSQL(tableName, id) {
    try {
        const result = await query(`SELECT id FROM ${tableName} WHERE id = $1 LIMIT 1`, [id]);
        return result.rows.length > 0;
    } catch (err) {
        // Se a coluna 'id' não existir, tentar outras formas de verificação
        return false;
    }
}

/**
 * Obter estrutura da tabela do PostgreSQL
 */
async function getPostgreSQLColumns(tableName) {
    try {
        const result = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = $1
            ORDER BY ordinal_position
        `, [tableName]);
        return result.rows;
    } catch (err) {
        return [];
    }
}

/**
 * Migrar uma tabela
 */
async function migrateTable(tableName, sqliteDb) {
    console.log(`\n📦 Processando tabela: ${tableName}`);
    
    // Verificar se tabela existe no PostgreSQL
    const pgExists = await tableExistsPostgreSQL(tableName);
    if (!pgExists) {
        console.log(`   ⚠️  Tabela ${tableName} não existe no PostgreSQL - pulando`);
        return;
    }
    
    // Obter colunas do PostgreSQL
    const pgColumns = await getPostgreSQLColumns(tableName);
    if (pgColumns.length === 0) {
        console.log(`   ⚠️  Não foi possível obter colunas de ${tableName}`);
        return;
    }
    
    // Ler dados do SQLite
    const sqliteRows = await new Promise((resolve, reject) => {
        sqliteDb.all(`SELECT * FROM ${tableName}`, [], (err, rows) => {
            if (err) {
                if (err.message.includes('no such table')) {
                    resolve([]); // Tabela não existe no SQLite
                } else {
                    reject(err);
                }
            } else {
                resolve(rows);
            }
        });
    });
    
    if (sqliteRows.length === 0) {
        console.log(`   ℹ️  Nenhum registro para migrar em ${tableName}`);
        return;
    }
    
    console.log(`   📊 ${sqliteRows.length} registros encontrados no SQLite`);
    
    // Preparar colunas comuns entre SQLite e PostgreSQL
    // Mapear nomes do SQLite -> PostgreSQL (preservando case do PostgreSQL)
    const columnNames = Object.keys(sqliteRows[0]);
    const columnMapping = {};
    
    for (const sqliteCol of columnNames) {
        const pgCol = pgColumns.find(pgCol => pgCol.column_name.toLowerCase() === sqliteCol.toLowerCase());
        if (pgCol) {
            columnMapping[sqliteCol] = pgCol.column_name; // Usar nome exato do PostgreSQL
        }
    }
    
    const validColumns = Object.keys(columnMapping);
    
    if (validColumns.length === 0) {
        console.log(`   ⚠️  Nenhuma coluna compatível entre SQLite e PostgreSQL`);
        return;
    }
    
    // Migrar em lotes
    let migrados = 0;
    let ignorados = 0;
    let erros = 0;
    
    for (const row of sqliteRows) {
        try {
            // Verificar se já existe
            if (row.id && await recordExistsPostgreSQL(tableName, row.id)) {
                ignorados++;
                continue;
            }
            
            // Construir INSERT com nomes corretos do PostgreSQL (quoted identifiers)
            const pgColumnsList = validColumns.map(sqliteCol => `"${columnMapping[sqliteCol]}"`);
            const values = validColumns.map(sqliteCol => row[sqliteCol]);
            const placeholders = validColumns.map((_, i) => `$${i + 1}`).join(', ');
            const columnsStr = pgColumnsList.join(', ');
            
            await query(
                `INSERT INTO "${tableName}" (${columnsStr}) VALUES (${placeholders})`,
                values
            );
            
            migrados++;
        } catch (err) {
            erros++;
            if (erros <= 5) { // Mostrar só os primeiros erros
                console.error(`   ❌ Erro ao inserir registro:`, err.message);
            }
        }
    }
    
    console.log(`   ✅ Migrados: ${migrados} | Ignorados (duplicatas): ${ignorados} | Erros: ${erros}`);
    
    stats.tabelasProcessadas++;
    stats.registrosMigrados += migrados;
    stats.registrosIgnorados += ignorados;
}

/**
 * Função principal
 */
async function main() {
    console.log('='.repeat(60));
    console.log('🔄 MIGRAÇÃO DE DADOS: SQLite → PostgreSQL');
    console.log('='.repeat(60));
    console.log(`📁 SQLite: ${SQLITE_PATH}`);
    console.log(`🗄️  PostgreSQL: ${process.env.DB_HOST || 'localhost'}`);
    console.log('='.repeat(60));
    
    // Verificar se arquivo SQLite existe
    if (!fs.existsSync(SQLITE_PATH)) {
        console.error(`\n❌ Arquivo SQLite não encontrado: ${SQLITE_PATH}`);
        process.exit(1);
    }
    
    // Conectar ao SQLite
    const sqliteDb = new sqlite3.Database(SQLITE_PATH, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
            console.error('\n❌ Erro ao conectar ao SQLite:', err.message);
            process.exit(1);
        }
    });
    
    console.log('\n✅ Conectado ao SQLite (modo leitura)');
    
    // Verificar conexão PostgreSQL
    try {
        const result = await query('SELECT NOW() as now');
        console.log('✅ Conectado ao PostgreSQL');
        console.log(`🕐 ${result.rows[0].now}`);
    } catch (err) {
        console.error('\n❌ Erro ao conectar ao PostgreSQL:', err.message);
        sqliteDb.close();
        process.exit(1);
    }
    
    // Obter lista de tabelas do SQLite
    const sqliteTables = await new Promise((resolve, reject) => {
        sqliteDb.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'", [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows.map(r => r.name));
        });
    });
    
    console.log(`\n📋 Tabelas encontradas no SQLite: ${sqliteTables.length}`);
    console.log(sqliteTables.join(', '));
    
    // Perguntar confirmação
    console.log('\n⚠️  ATENÇÃO: Esta operação irá migrar dados para o PostgreSQL.');
    console.log('   Registros existentes com mesmo ID serão ignorados (não duplicados).');
    console.log('\n🚀 Iniciando migração em 5 segundos... (Ctrl+C para cancelar)');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Migrar tabelas
    for (const tableName of TABLES) {
        if (sqliteTables.includes(tableName)) {
            await migrateTable(tableName, sqliteDb);
        } else {
            console.log(`\n📦 ${tableName}: ℹ️  Não existe no SQLite`);
        }
    }
    
    // Resumo
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DA MIGRAÇÃO');
    console.log('='.repeat(60));
    console.log(`Tabelas processadas: ${stats.tabelasProcessadas}`);
    console.log(`Registros migrados: ${stats.registrosMigrados}`);
    console.log(`Registros ignorados (duplicatas): ${stats.registrosIgnorados}`);
    console.log('='.repeat(60));
    
    if (stats.erros.length > 0) {
        console.log('\n❌ Erros encontrados:');
        stats.erros.forEach(e => console.log(`   - ${e}`));
    } else {
        console.log('\n✅ Migração concluída com sucesso!');
    }
    
    // Fechar conexões
    sqliteDb.close();
    const pool = getPool();
    await pool.end();
    
    console.log('\n🔚 Conexões fechadas.');
}

// Executar
main().catch(err => {
    console.error('\n💥 Erro fatal:', err);
    process.exit(1);
});
