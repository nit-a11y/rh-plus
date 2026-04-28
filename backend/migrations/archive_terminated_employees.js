/**
 * Migração: Arquivar colaboradores desligados
 * Data: 2026-04-10
 * 
 * O que faz:
 * 1. Cria tabela employee_archive
 * 2. Migra desligados existentes para o arquivo
 * 3. Cria registros em employee_terminations baseado em career_history
 * 4. Limpa dados desnecessários de employees (mantém apenas essenciais)
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

const dbPath = path.join(__dirname, '../database/database.sqlite');
const generateId = () => crypto.randomBytes(4).toString('hex');

const ESSENTIAL_FIELDS = [
    'id', 'name', 'registrationNumber', 'role', 'sector', 'type',
    'employer_id', 'workplace_id', 'terminationDate', 'terminationReason',
    'photoUrl', 'cpf'
];

const ARCHIVE_FIELDS = [
    'hierarchy', 'admissionDate', 'birthDate', 'currentSalary', 'street', 'city',
    'neighborhood', 'state_uf', 'cep', 'fatherName', 'motherName', 'gender',
    'maritalStatus', 'ethnicity', 'educationLevel', 'placeOfBirth',
    'personalEmail', 'personalPhone', 'work_schedule', 'work_scale', 'cbo',
    'initialRole', 'initialSalary', 'metadata', 'observation', 'criado_em'
];

function runMigration() {
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('❌ Erro ao conectar ao banco:', err.message);
            process.exit(1);
        }
        console.log('✅ Conectado ao banco de dados\n');
    });

    console.log('🗄️  INICIANDO ARQUIVAMENTO DE DESLIGADOS\n');
    console.log('=' .repeat(70));

    let stats = {
        totalDesligados: 0,
        arquivados: 0,
        terminacoesCriadas: 0,
        camposRemovidos: 0,
        errors: []
    };

    db.serialize(() => {
        // 1. Criar tabela employee_archive se não existir
        console.log('\n📦 Etapa 1: Criando tabela employee_archive...');
        db.run(`CREATE TABLE IF NOT EXISTS employee_archive (
            id TEXT PRIMARY KEY,
            employee_id TEXT NOT NULL UNIQUE,
            archived_at TEXT DEFAULT (datetime('now', 'localtime')),
            archive_data TEXT NOT NULL,
            termination_id TEXT,
            is_active INTEGER DEFAULT 0
        )`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_archive_employee ON employee_archive(employee_id)`);
        console.log('   ✅ Tabela employee_archive pronta');

        // 2. Buscar desligados
        console.log('\n📋 Etapa 2: Buscando colaboradores desligados...');
        db.all(`SELECT * FROM employees WHERE type = 'Desligado' OR terminationDate IS NOT NULL`, [], (err, desligados) => {
            if (err) {
                console.error('   ❌ Erro:', err);
                stats.errors.push(err.message);
                return;
            }
            
            stats.totalDesligados = desligados.length;
            console.log(`   📊 Encontrados: ${desligados.length} desligados`);

            if (desligados.length === 0) {
                console.log('   ⚠️ Nenhum desligado para arquivar');
                finishMigration(db, stats);
                return;
            }

            // 3. Processar cada desligado
            console.log('\n📂 Etapa 3: Arquivando colaboradores...');
            let processed = 0;

            desligados.forEach((emp) => {
                const archiveId = generateId();
                
                // Buscar dados de career_history para desligamento
                db.get(`
                    SELECT date, observation, responsible 
                    FROM career_history 
                    WHERE employee_id = ? AND move_type LIKE '%Desligamento%' 
                    ORDER BY date DESC LIMIT 1
                `, [emp.id], (err, careerData) => {
                    
                    if (err) {
                        stats.errors.push(`Erro ao buscar career para ${emp.id}: ${err.message}`);
                    }

                    const termDate = emp.terminationDate || (careerData?.date ? careerData.date.split(' ')[0] : null);
                    const termReason = emp.terminationReason || 'NÃO INFORMADO';
                    
                    // Criar registro de terminação
                    const termId = generateId();
                    const grrfValue = 0; // Não temos esse dado historicamente
                    const rescisaoValue = 0; // Não temos esse dado historicamente
                    
                    db.run(`INSERT INTO employee_terminations 
                            (id, employee_id, termination_date, termination_reason, observation, grrf_value, rescisao_value, responsible)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [termId, emp.id, termDate, termReason, careerData?.observation || '', grrfValue, rescisaoValue, careerData?.responsible || 'Migração'],
                        (err) => {
                            if (err) {
                                stats.errors.push(`Erro ao criar terminação para ${emp.id}: ${err.message}`);
                            } else {
                                stats.terminacoesCriadas++;
                            }

                            // Preparar dados para arquivo
                            const archiveData = {};
                            ARCHIVE_FIELDS.forEach(field => {
                                if (emp[field] !== undefined && emp[field] !== null && emp[field] !== '') {
                                    archiveData[field] = emp[field];
                                }
                            });

                            // Inserir no arquivo
                            db.run(`INSERT INTO employee_archive 
                                    (id, employee_id, archive_data, termination_id, is_active)
                                    VALUES (?, ?, ?, ?, 0)`,
                                [archiveId, emp.id, JSON.stringify(archiveData), termId],
                                (err) => {
                                    if (err) {
                                        stats.errors.push(`Erro ao arquivar ${emp.id}: ${err.message}`);
                                    } else {
                                        stats.arquivados++;
                                    }

                                    processed++;
                                    if (processed % 10 === 0) {
                                        console.log(`   📝 Processados: ${processed}/${desligados.length}`);
                                    }

                                    if (processed === desligados.length) {
                                        // 4. Limpar dados de employees
                                        console.log('\n🧹 Etapa 4: Limpando dados de employees...');
                                        limparEmployees(db, desligados, stats, () => {
                                            finishMigration(db, stats);
                                        });
                                    }
                                }
                            );
                        }
                    );
                });
            });
        });
    });
}

function limparEmployees(db, desligados, stats, callback) {
    let cleaned = 0;
    
    desligados.forEach((emp) => {
        // Limpar todos os campos não essenciais
        const updates = [];
        const params = [];
        
        ARCHIVE_FIELDS.forEach(field => {
            updates.push(`${field} = NULL`);
        });
        
        // Manter apenas dados mínimos
        const sql = `UPDATE employees SET ${updates.join(', ')} WHERE id = ?`;
        
        db.run(sql, [emp.id], (err) => {
            if (err) {
                stats.errors.push(`Erro ao limpar ${emp.id}: ${err.message}`);
            } else {
                cleaned++;
            }
            
            if (cleaned === desligados.length) {
                stats.camposRemovidos = cleaned * ARCHIVE_FIELDS.length;
                callback();
            }
        });
    });
}

function finishMigration(db, stats) {
    console.log('\n' + '='.repeat(70));
    console.log('\n📊 RESUMO DA MIGRAÇÃO:\n');
    console.log(`   ✅ Desligados encontrados: ${stats.totalDesligados}`);
    console.log(`   ✅ Arquivados: ${stats.arquivados}`);
    console.log(`   ✅ Terminações criadas: ${stats.terminacoesCriadas}`);
    console.log(`   ✅ Campos removidos de employees: ${stats.camposRemovidos}`);
    console.log(`   ❌ Erros: ${stats.errors.length}`);
    
    if (stats.errors.length > 0) {
        console.log('\n⚠️  Erros encontrados:');
        stats.errors.slice(0, 5).forEach(e => console.log(`      - ${e}`));
        if (stats.errors.length > 5) {
            console.log(`      ... e mais ${stats.errors.length - 5} erros`);
        }
    }
    
    console.log('\n✨ Migração concluída!\n');
    console.log('💡 Próximos passos:');
    console.log('   1. Reiniciar o servidor para carregar novas tabelas');
    console.log('   2. Verificar dados no painel de colaboradores');
    console.log('   3. Testar consulta de desligados no dossiê\n');
    
    db.close();
}

// Executar se chamado diretamente
if (require.main === module) {
    runMigration();
}

module.exports = { runMigration };
