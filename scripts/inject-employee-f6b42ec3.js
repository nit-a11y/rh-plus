#!/usr/bin/env node
/**
 * 🔄 INJEÇÃO DE DADOS: Funcionário f6b42ec3
 * Extrai do SQLite e insere/atualiza no PostgreSQL
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { query, transaction, getPool } = require('../backend/config/database');

const EMPLOYEE_ID = 'f6b42ec3';
const SQLITE_PATH = path.join(__dirname, '../backend/database/database.sqlite');

// Helpers para SQLite
function sqliteGet(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row || null);
        });
    });
}

function sqliteAll(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });
}

async function tableExistsSQLite(db, tableName) {
    try {
        const row = await sqliteGet(db, 
            "SELECT name FROM sqlite_master WHERE type='table' AND name=?", 
            [tableName]
        );
        return !!row;
    } catch (e) {
        return false;
    }
}

async function safeSqliteAll(db, tableName, sql, params = []) {
    const exists = await tableExistsSQLite(db, tableName);
    if (!exists) {
        console.log(`   ℹ️ Tabela ${tableName} não existe no SQLite - pulando`);
        return [];
    }
    try {
        return await sqliteAll(db, sql, params);
    } catch (err) {
        console.log(`   ⚠️ Erro ao ler ${tableName}: ${err.message}`);
        return [];
    }
}

async function safeSqliteGet(db, tableName, sql, params = []) {
    const exists = await tableExistsSQLite(db, tableName);
    if (!exists) {
        console.log(`   ℹ️ Tabela ${tableName} não existe no SQLite - pulando`);
        return null;
    }
    try {
        return await sqliteGet(db, sql, params);
    } catch (err) {
        console.log(`   ⚠️ Erro ao ler ${tableName}: ${err.message}`);
        return null;
    }
}

async function extractFromSQLite() {
    console.log(`🔍 Extraindo dados do funcionário ${EMPLOYEE_ID} do SQLite...\n`);
    
    const db = new sqlite3.Database(SQLITE_PATH, sqlite3.OPEN_READONLY);
    
    const data = {
        employee: null,
        documents: null,
        vinculos: [],
        benefits: [],
        dependents: [],
        emergency_contacts: [],
        career_history: [],
        vacation_records: [],
        overtime_records: [],
        occurrences: [],
        aso_records: [],
        uniform_items: [],
        goals: [],
        demands: []
    };
    
    try {
        // 1. Dados principais do funcionário
        data.employee = await sqliteGet(db, `SELECT * FROM employees WHERE id = ?`, [EMPLOYEE_ID]);
        console.log(data.employee ? '✅ Funcionário encontrado' : '❌ Funcionário não encontrado');
        
        if (!data.employee) {
            db.close();
            return null;
        }
        
        // 2. Documentos
        data.documents = await safeSqliteGet(db, 'employee_documents', `SELECT * FROM employee_documents WHERE employee_id = ?`, [EMPLOYEE_ID]);
        console.log(data.documents ? '✅ Documentos encontrados' : 'ℹ️ Sem documentos');
        
        // 3. Vínculos
        data.vinculos = await safeSqliteAll(db, 'employee_vinculos', `SELECT * FROM employee_vinculos WHERE employee_id = ?`, [EMPLOYEE_ID]);
        console.log(`✅ ${data.vinculos.length} vínculos encontrados`);
        
        // 4. Benefícios
        data.benefits = await safeSqliteAll(db, 'employee_benefits', `SELECT * FROM employee_benefits WHERE employee_id = ?`, [EMPLOYEE_ID]);
        console.log(`✅ ${data.benefits.length} benefícios encontrados`);
        
        // 5. Dependentes
        data.dependents = await safeSqliteAll(db, 'employee_dependents', `SELECT * FROM employee_dependents WHERE employee_id = ?`, [EMPLOYEE_ID]);
        console.log(`✅ ${data.dependents.length} dependentes encontrados`);
        
        // 6. Contatos de emergência
        data.emergency_contacts = await safeSqliteAll(db, 'employee_emergency_contacts', `SELECT * FROM employee_emergency_contacts WHERE employee_id = ?`, [EMPLOYEE_ID]);
        console.log(`✅ ${data.emergency_contacts.length} contatos de emergência`);
        
        // 7. Histórico de carreira
        data.career_history = await safeSqliteAll(db, 'career_history', `SELECT * FROM career_history WHERE employee_id = ?`, [EMPLOYEE_ID]);
        console.log(`✅ ${data.career_history.length} registros de carreira`);
        
        // 8. Férias
        data.vacation_records = await safeSqliteAll(db, 'vacation_records', `SELECT * FROM vacation_records WHERE employee_id = ?`, [EMPLOYEE_ID]);
        console.log(`✅ ${data.vacation_records.length} registros de férias`);
        
        // 9. Horas extras
        data.overtime_records = await safeSqliteAll(db, 'overtime_records', `SELECT * FROM overtime_records WHERE employee_id = ?`, [EMPLOYEE_ID]);
        console.log(`✅ ${data.overtime_records.length} registros de horas extras`);
        
        // 10. Ocorrências
        data.occurrences = await safeSqliteAll(db, 'occurrences', `SELECT * FROM occurrences WHERE employee_id = ?`, [EMPLOYEE_ID]);
        console.log(`✅ ${data.occurrences.length} ocorrências`);
        
        // 11. ASO/Exames
        data.aso_records = await safeSqliteAll(db, 'aso_records', `SELECT * FROM aso_records WHERE employee_id = ?`, [EMPLOYEE_ID]);
        console.log(`✅ ${data.aso_records.length} registros ASO`);
        
        // 12. Uniformes
        data.uniform_items = await safeSqliteAll(db, 'uniform_items', `SELECT * FROM uniform_items WHERE employee_id = ?`, [EMPLOYEE_ID]);
        console.log(`✅ ${data.uniform_items.length} itens de uniforme`);
        
        // 13. Metas/Goals
        data.goals = await safeSqliteAll(db, 'goals', `SELECT * FROM goals WHERE employee_id = ?`, [EMPLOYEE_ID]);
        console.log(`✅ ${data.goals.length} metas`);
        
        // 14. Demandas
        data.demands = await safeSqliteAll(db, 'user_demands', `SELECT * FROM user_demands WHERE employee_id = ?`, [EMPLOYEE_ID]);
        console.log(`✅ ${data.demands.length} demandas`);
        
        db.close();
        return data;
        
    } catch (err) {
        console.error('❌ Erro ao extrair do SQLite:', err.message);
        db.close();
        throw err;
    }
}

// Mapeamento de campos SQLite (snake_case) -> PostgreSQL (camelCase)
const FIELD_MAPPING = {
    'id': 'id',
    'name': 'name',
    'role': 'role',
    'sector': 'sector',
    'employer_id': 'employer_id',
    'workplace_id': 'workplace_id',
    'status': 'status',
    'cpf': 'cpf',
    'rg': 'rg',
    'registrationnumber': 'registrationNumber',
    'birthdate': 'birthDate',
    'birth_date': 'birthDate',
    'admissiondate': 'admissionDate',
    'admission_date': 'admissionDate',
    'terminationdate': 'terminationDate',
    'termination_date': 'terminationDate',
    'postalcode': 'postalCode',
    'postal_code': 'postalCode',
    'street': 'street',
    'number': 'number',
    'complement': 'complement',
    'neighborhood': 'neighborhood',
    'city': 'city',
    'state_uf': 'state_uf',
    'pis_pasep': 'pisPasep',
    'personal_email': 'personalEmail',
    'personalemail': 'personalEmail',
    'personal_phone': 'personalPhone',
    'personalphone': 'personalPhone',
    'work_phone': 'workPhone',
    'workphone': 'workPhone',
    'fathername': 'fatherName',
    'mothername': 'motherName',
    'gender': 'gender',
    'maritalstatus': 'maritalStatus',
    'ethnicity': 'ethnicity',
    'educationlevel': 'educationLevel',
    'placeofbirth': 'placeOfBirth',
    'place_of_birth': 'placeOfBirth',
    'work_schedule': 'work_schedule',
    'work_scale': 'work_scale',
    'cbo': 'cbo',
    'costcenter': 'costCenter',
    'cost_center': 'costCenter',
    'salary': 'salary',
    'initialsalary': 'initialSalary',
    'initial_role': 'initialRole',
    'initialrole': 'initialRole',
    'terminationreason': 'terminationReason',
    'bank_name': 'bankName',
    'bankname': 'bankName',
    'bank_agency': 'bankAgency',
    'bankagency': 'bankAgency',
    'bank_account': 'bankAccount',
    'bankaccount': 'bankAccount',
    'pix_key': 'pixKey',
    'pixkey': 'pixKey',
    'pix_type': 'pixType',
    'pixtype': 'pixType',
    'metadata': 'metadata',
    'observation': 'observation',
    'created_at': 'created_at',
    'updated_at': 'updated_at'
};

function mapFieldName(sqliteName) {
    const lower = sqliteName.toLowerCase();
    return FIELD_MAPPING[lower] || sqliteName;
}

// Função helper para inserir dados com quoted identifiers
async function insertWithQuotedColumns(client, tableName, dataRow, excludeColumns = []) {
    const columns = Object.keys(dataRow).filter(k => 
        !excludeColumns.includes(k) && dataRow[k] !== null
    );
    const mappedColumns = columns.map(mapFieldName);
    const quotedColumns = mappedColumns.map(k => `"${k}"`);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    const values = columns.map(k => dataRow[k]);
    
    const sql = `INSERT INTO ${tableName} (${quotedColumns.join(', ')}) VALUES (${placeholders})`;
    await client.query(sql, values);
}

async function injectToPostgreSQL(data) {
    console.log('\n💉 Injetando dados no PostgreSQL...\n');
    
    try {
        await transaction(async (client) => {
            // 1. Inserir/Atualizar funcionário
            if (data.employee) {
                const emp = data.employee;
                const sqliteColumns = Object.keys(emp).filter(k => emp[k] !== null && k !== 'id');
                const columns = sqliteColumns.map(mapFieldName);
                const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
                const values = sqliteColumns.map(k => emp[k]);
                
                console.log('📝 Campos do SQLite:', sqliteColumns.slice(0, 10).join(', '), '...');
                console.log('📝 Campos mapeados:', columns.slice(0, 10).join(', '), '...');
                
                // Verificar se já existe
                const existing = await client.query(`SELECT id FROM employees WHERE id = $1`, [EMPLOYEE_ID]);
                
                // Usar aspas duplas para preservar case no PostgreSQL
                const quotedColumns = columns.map(k => `"${k}"`);
                const quotedPlaceholders = quotedColumns.map((_, i) => `$${i + 1}`).join(', ');
                
                if (existing.rows.length === 0) {
                    await client.query(
                        `INSERT INTO employees (${quotedColumns.join(', ')}) VALUES (${quotedPlaceholders})`,
                        values
                    );
                    console.log('✅ Funcionário inserido');
                } else {
                    // Update
                    const setClause = quotedColumns.map((k, i) => `${k} = $${i + 1}`).join(', ');
                    await client.query(
                        `UPDATE employees SET ${setClause} WHERE "id" = $${quotedColumns.length + 1}`,
                        [...values, EMPLOYEE_ID]
                    );
                    console.log('✅ Funcionário atualizado');
                }
            }
            
            // 2. Documentos
            if (data.documents) {
                const doc = data.documents;
                const columns = Object.keys(doc).filter(k => k !== 'employee_id' && doc[k] !== null);
                const placeholders = columns.map((_, i) => `$${i + 2}`).join(', ');
                const values = columns.map(k => doc[k]);
                
                await client.query(`DELETE FROM employee_documents WHERE employee_id = $1`, [EMPLOYEE_ID]);
                await client.query(
                    `INSERT INTO employee_documents (employee_id, ${columns.join(', ')}) VALUES ($1, ${placeholders})`,
                    [EMPLOYEE_ID, ...values]
                );
                console.log('✅ Documentos inseridos');
            }
            
            // 3. Vínculos
            if (data.vinculos.length > 0) {
                await client.query(`DELETE FROM employee_vinculos WHERE employee_id = $1`, [EMPLOYEE_ID]);
                for (const v of data.vinculos) {
                    const columns = Object.keys(v).filter(k => v[k] !== null);
                    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
                    const values = columns.map(k => v[k]);
                    await client.query(
                        `INSERT INTO employee_vinculos (${columns.join(', ')}) VALUES (${placeholders})`,
                        values
                    );
                }
                console.log(`✅ ${data.vinculos.length} vínculos inseridos`);
            }
            
            // 4. Benefícios
            if (data.benefits.length > 0) {
                await client.query(`DELETE FROM employee_benefits WHERE employee_id = $1`, [EMPLOYEE_ID]);
                for (const b of data.benefits) {
                    const columns = Object.keys(b).filter(k => b[k] !== null);
                    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
                    const values = columns.map(k => b[k]);
                    await client.query(
                        `INSERT INTO employee_benefits (${columns.join(', ')}) VALUES (${placeholders})`,
                        values
                    );
                }
                console.log(`✅ ${data.benefits.length} benefícios inseridos`);
            }
            
            // 5. Dependentes
            if (data.dependents.length > 0) {
                await client.query(`DELETE FROM employee_dependents WHERE employee_id = $1`, [EMPLOYEE_ID]);
                for (const d of data.dependents) {
                    const columns = Object.keys(d).filter(k => d[k] !== null);
                    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
                    const values = columns.map(k => d[k]);
                    await client.query(
                        `INSERT INTO employee_dependents (${columns.join(', ')}) VALUES (${placeholders})`,
                        values
                    );
                }
                console.log(`✅ ${data.dependents.length} dependentes inseridos`);
            }
            
            // 6. Contatos de emergência
            if (data.emergency_contacts.length > 0) {
                await client.query(`DELETE FROM employee_emergency_contacts WHERE employee_id = $1`, [EMPLOYEE_ID]);
                for (const ec of data.emergency_contacts) {
                    const columns = Object.keys(ec).filter(k => ec[k] !== null);
                    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
                    const values = columns.map(k => ec[k]);
                    await client.query(
                        `INSERT INTO employee_emergency_contacts (${columns.join(', ')}) VALUES (${placeholders})`,
                        values
                    );
                }
                console.log(`✅ ${data.emergency_contacts.length} contatos de emergência inseridos`);
            }
            
            // 7. Histórico de carreira
            if (data.career_history.length > 0) {
                await client.query(`DELETE FROM career_history WHERE employee_id = $1`, [EMPLOYEE_ID]);
                for (const ch of data.career_history) {
                    const columns = Object.keys(ch).filter(k => ch[k] !== null);
                    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
                    const values = columns.map(k => ch[k]);
                    await client.query(
                        `INSERT INTO career_history (${columns.join(', ')}) VALUES (${placeholders})`,
                        values
                    );
                }
                console.log(`✅ ${data.career_history.length} registros de carreira inseridos`);
            }
            
            // 8. Férias
            if (data.vacation_records.length > 0) {
                await client.query(`DELETE FROM vacation_records WHERE employee_id = $1`, [EMPLOYEE_ID]);
                for (const vr of data.vacation_records) {
                    const columns = Object.keys(vr).filter(k => vr[k] !== null);
                    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
                    const values = columns.map(k => vr[k]);
                    await client.query(
                        `INSERT INTO vacation_records (${columns.join(', ')}) VALUES (${placeholders})`,
                        values
                    );
                }
                console.log(`✅ ${data.vacation_records.length} registros de férias inseridos`);
            }
            
            // 9. Horas extras
            if (data.overtime_records.length > 0) {
                await client.query(`DELETE FROM overtime_records WHERE employee_id = $1`, [EMPLOYEE_ID]);
                for (const ot of data.overtime_records) {
                    const columns = Object.keys(ot).filter(k => ot[k] !== null);
                    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
                    const values = columns.map(k => ot[k]);
                    await client.query(
                        `INSERT INTO overtime_records (${columns.join(', ')}) VALUES (${placeholders})`,
                        values
                    );
                }
                console.log(`✅ ${data.overtime_records.length} registros de horas extras inseridos`);
            }
            
            // 10. Ocorrências
            if (data.occurrences.length > 0) {
                await client.query(`DELETE FROM occurrences WHERE employee_id = $1`, [EMPLOYEE_ID]);
                for (const occ of data.occurrences) {
                    const columns = Object.keys(occ).filter(k => occ[k] !== null);
                    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
                    const values = columns.map(k => occ[k]);
                    await client.query(
                        `INSERT INTO occurrences (${columns.join(', ')}) VALUES (${placeholders})`,
                        values
                    );
                }
                console.log(`✅ ${data.occurrences.length} ocorrências inseridas`);
            }
            
            // 11. ASO
            if (data.aso_records.length > 0) {
                await client.query(`DELETE FROM aso_records WHERE employee_id = $1`, [EMPLOYEE_ID]);
                for (const aso of data.aso_records) {
                    const columns = Object.keys(aso).filter(k => aso[k] !== null);
                    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
                    const values = columns.map(k => aso[k]);
                    await client.query(
                        `INSERT INTO aso_records (${columns.join(', ')}) VALUES (${placeholders})`,
                        values
                    );
                }
                console.log(`✅ ${data.aso_records.length} registros ASO inseridos`);
            }
            
            // 12. Uniformes
            if (data.uniform_items.length > 0) {
                await client.query(`DELETE FROM uniform_items WHERE employee_id = $1`, [EMPLOYEE_ID]);
                for (const ui of data.uniform_items) {
                    const columns = Object.keys(ui).filter(k => ui[k] !== null);
                    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
                    const values = columns.map(k => ui[k]);
                    await client.query(
                        `INSERT INTO uniform_items (${columns.join(', ')}) VALUES (${placeholders})`,
                        values
                    );
                }
                console.log(`✅ ${data.uniform_items.length} itens de uniforme inseridos`);
            }
            
            // 13. Metas
            if (data.goals.length > 0) {
                await client.query(`DELETE FROM goals WHERE employee_id = $1`, [EMPLOYEE_ID]);
                for (const g of data.goals) {
                    const columns = Object.keys(g).filter(k => g[k] !== null);
                    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
                    const values = columns.map(k => g[k]);
                    await client.query(
                        `INSERT INTO goals (${columns.join(', ')}) VALUES (${placeholders})`,
                        values
                    );
                }
                console.log(`✅ ${data.goals.length} metas inseridas`);
            }
            
            // 14. Demandas
            if (data.demands.length > 0) {
                await client.query(`DELETE FROM user_demands WHERE employee_id = $1`, [EMPLOYEE_ID]);
                for (const d of data.demands) {
                    const columns = Object.keys(d).filter(k => d[k] !== null);
                    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
                    const values = columns.map(k => d[k]);
                    await client.query(
                        `INSERT INTO user_demands (${columns.join(', ')}) VALUES (${placeholders})`,
                        values
                    );
                }
                console.log(`✅ ${data.demands.length} demandas inseridas`);
            }
        });
        
        console.log('\n✅ Dados injetados com sucesso no PostgreSQL!');
        
    } catch (err) {
        console.error('\n❌ Erro ao injetar no PostgreSQL:', err.message);
        throw err;
    }
}

async function main() {
    console.log('='.repeat(60));
    console.log(`🔄 INJEÇÃO DE DADOS: Funcionário ${EMPLOYEE_ID}`);
    console.log('='.repeat(60));
    
    try {
        // 1. Extrair do SQLite
        const data = await extractFromSQLite();
        
        if (!data || !data.employee) {
            console.error('\n❌ Funcionário não encontrado no SQLite');
            process.exit(1);
        }
        
        console.log('\n📊 Resumo dos dados extraídos:');
        console.log(`   Nome: ${data.employee.name || 'N/A'}`);
        console.log(`   Cargo: ${data.employee.role || 'N/A'}`);
        console.log(`   Setor: ${data.employee.sector || 'N/A'}`);
        
        // 2. Injetar no PostgreSQL
        await injectToPostgreSQL(data);
        
        console.log('\n🎉 Processo concluído!');
        console.log('='.repeat(60));
        
    } catch (err) {
        console.error('\n💥 Erro:', err.message);
        console.error(err.stack);
        process.exit(1);
    }
    
    // Fechar pool
    const pool = getPool();
    await pool.end();
    process.exit(0);
}

main();
