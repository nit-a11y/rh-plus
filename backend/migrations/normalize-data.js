/**
 * Script de Normalização de Dados - RH+
 * Executar: node backend/migrations/normalize-data.js
 */

const db = require('../database');

const SECTOR_MAP = {
    // Mapeamento de variações para padrão
    'ADMINISTRATIVO': 'ADMINISTRATIVO',
    'administrativo': 'ADMINISTRATIVO',
    'MANUTENÇÃO': 'MANUTENÇÃO',
    'MANUTENCAO': 'MANUTENÇÃO',
    'manutenção': 'MANUTENÇÃO',
    'LOGÍSTICA': 'LOGÍSTICA',
    'LOGISTICA': 'LOGÍSTICA',
    'logística': 'LOGÍSTICA',
    'COMERCIAL': 'COMERCIAL',
    'comercial': 'COMERCIAL',
    'MARKETING': 'MARKETING',
    'marketing': 'MARKETING',
    'FINANCEIRO': 'FINANCEIRO',
    'financeiro': 'FINANCEIRO',
    'COMPRAS': 'COMPRAS',
    'contábil': 'CONTÁBIL',
    'CONTÁBIL': 'CONTÁBIL',
    'fiscal': 'FISCAL',
    'FISCAL': 'FISCAL',
    'ALMOXARIFADO': 'ALMOXARIFADO',
    'almoxarifado': 'ALMOXARIFADO',
    'SERVIÇOS DIVERSOS': 'SERVIÇOS DIVERSOS',
    'Serviços Diversos': 'SERVIÇOS DIVERSOS',
    'SERVIÇOS GERAIS': 'SERVIÇOS GERAIS',
    'Serviços Gerais': 'SERVIÇOS GERAIS',
    'BI': 'BI',
    'MANUTENÇÃO / PCM': 'MANUTENÇÃO',
    'Manutenção / PCM': 'MANUTENÇÃO'
};

function normalizeSector(sector) {
    if (!sector) return 'ADMINISTRATIVO'; // Default
    const normalized = sector.toString().trim();
    return SECTOR_MAP[normalized] || normalized.toUpperCase();
}

function normalizeCBO(cbo) {
    if (!cbo) return null;
    // Remove hífens eiformata como 6 dígitos
    return cbo.replace(/[^\d]/g, '').padStart(6, '0');
}

const migrationLog = {
    companies: [],
    roles: [],
    employees: [],
    errors: []
};

console.log('========================================');
console.log('🚀 INICIANDO NORMALIZAÇÃO DE DADOS RH+');
console.log('========================================\n');

//=======================
// 1. NORMALIZAR COMPANIES
//=======================
console.log('📋 [1/4] Normalizando Companies...\n');

db.all(`SELECT * FROM companies`, [], (err, companies) => {
    if (err) {
        console.error('❌ Erro ao buscar companies:', err.message);
        process.exit(1);
    }

    // Agrupar por CNPJ para encontrar duplicados
    const byCnpj = {};
    companies.forEach(c => {
        const cnpjClean = c.cnpj.replace(/[^\d]/g, '');
        if (!byCnpj[cnpjClean]) byCnpj[cnpjClean] = [];
        byCnpj[cnpjClean].push(c);
    });

    // Processar duplicados
    const toKeep = []; // IDs para manter
    const toDelete = []; // IDs para deletar

    Object.entries(byCnpj).forEach(([cnpjClean, comps]) => {
        if (comps.length === 1) {
            toKeep.push(comps[0].id);
            // Atualizar para tipo padronizado
            const comp = comps[0];
            let newType = comp.type;
            if (comp.name.toLowerCase().includes('nordeste') && comp.type === 'Unidade') {
                newType = 'Unidade'; // OK
            }
            if (comp.type === 'Ambos') {
                newType = 'Empregador'; // Preferir Employer como principal
            }
            
            if (newType !== comp.type) {
                db.run(`UPDATE companies SET type = ? WHERE id = ?`, [newType, comp.id]);
                migrationLog.companies.push({ id: comp.id, action: 'type_change', from: comp.type, to: newType });
            }
            return;
        }

        // Encontrar o melhor registro para manter
        let best = comps[0];
        comps.forEach(c => {
            // Preferir nome com "LTDA" ou mais detalhado
            if (c.name.length > best.name.length) best = c;
        });

        toKeep.push(best.id);
        comps.forEach(c => {
            if (c.id !== best.id) {
                toDelete.push(c.id);
                migrationLog.companies.push({ 
                    id: c.id, 
                    action: 'delete_duplicate', 
                    name: c.name, 
                    cnpj: c.cnpj,
                    kept_id: best.id
                });
            }
        });
    });

    console.log(`   • ${companies.length} registros encontrados`);
    console.log(`   • ${toDelete.length} duplicados identificados para remoção`);
    console.log(`   • ${Object.keys(byCnpj).length} CNPJs únicos`);

    // Deletar duplicados
    if (toDelete.length > 0) {
        const placeholders = toDelete.map(() => '?').join(',');
        db.run(`DELETE FROM companies WHERE id IN (${placeholders})`, toDelete, (delErr) => {
            if (delErr) {
                console.error('   ❌ Erro ao deletar duplicados:', delErr.message);
            } else {
                console.log(`   ✅ ${toDelete.length} duplicados removidos`);
            }
        });
    }

    // Atualizar nomes para padrão (uppercase)
    companies.forEach(c => {
        const nameUpper = c.name.toUpperCase();
        if (c.name !== nameUpper) {
            db.run(`UPDATE companies SET name = ? WHERE id = ?`, [nameUpper, c.id]);
            migrationLog.companies.push({ id: c.id, action: 'name_normalize', from: c.name, to: nameUpper });
        }
    });

    //=======================
    // 2. NORMALIZAR ROLES
    //=======================
    console.log('\n📋 [2/4] Normalizando Roles...\n');

    db.all(`SELECT * FROM roles_master`, [], (roleErr, roles) => {
        if (roleErr) {
            console.error('❌ Erro ao buscar roles:', roleErr.message);
        } else {
            console.log(`   • ${roles.length} cargos encontrados`);

            let normalizedCount = 0;
            let cboFixed = 0;
            let categoryAdded = 0;

            roles.forEach(role => {
                let needsUpdate = false;
                const updates = [];
                const params = [];

                // Normalizar nome
                const nameNorm = role.name.toUpperCase().trim();
                if (role.name !== nameNorm) {
                    updates.push('name = ?');
                    params.push(nameNorm);
                    needsUpdate = true;
                }

                // Normalizar setor
                const sectorNorm = normalizeSector(role.sector);
                if (role.sector !== sectorNorm) {
                    updates.push('sector = ?');
                    params.push(sectorNorm);
                    needsUpdate = true;
                    migrationLog.roles.push({ id: role.id, action: 'sector_normalize', from: role.sector, to: sectorNorm });
                }

                // Normalizar CBO
                const cboNorm = normalizeCBO(role.cbo);
                if (cboNorm && role.cbo !== cboNorm) {
                    updates.push('cbo = ?');
                    params.push(cboNorm);
                    needsUpdate = true;
                    cboFixed++;
                    migrationLog.roles.push({ id: role.id, action: 'cbo_normalize', from: role.cbo, to: cboNorm });
                }

                // Preencher category se null
                if (!role.category) {
                    updates.push('category = ?');
                    params.push('OP'); // Default
                    needsUpdate = true;
                    categoryAdded++;
                    migrationLog.roles.push({ id: role.id, action: 'category_default', from: null, to: 'OP' });
                }

                if (needsUpdate) {
                    params.push(role.id);
                    db.run(`UPDATE roles_master SET ${updates.join(', ')} WHERE id = ?`, params);
                    normalizedCount++;
                }
            });

            console.log(`   • ${normalizedCount} registros atualizados`);
            console.log(`   • ${cboFixed} CBOs normalizados`);
            console.log(`   • ${categoryAdded} categories preenchidas (default OP)`);
            console.log(`   ✅ Roles normalizados`);
        }

        //=======================
        // 3. NORMALIZAR EMPLOYEES
        //=======================
        console.log('\n📋 [3/4] Normalizando Employees...\n');

        db.all(`SELECT id, name, sector, role, employer_id, workplace_id FROM employees`, [], (empErr, employees) => {
            if (empErr) {
                console.error('❌ Erro ao buscar employees:', empErr.message);
            } else {
                console.log(`   • ${employees.length} colaboradores encontrados`);

                let sectorNormalized = 0;
                let companyMapped = 0;

                employees.forEach(emp => {
                    let needsUpdate = false;
                    const updates = [];
                    const params = [];

                    // Normalizar setor
                    const sectorNorm = normalizeSector(emp.sector);
                    if (emp.sector !== sectorNorm) {
                        updates.push('sector = ?');
                        params.push(sectorNorm);
                        needsUpdate = true;
                        migrationLog.employees.push({ id: emp.id, action: 'sector_normalize', from: emp.sector, to: sectorNorm });
                    }

                    if (needsUpdate) {
                        params.push(emp.id);
                        db.run(`UPDATE employees SET ${updates.join(', ')} WHERE id = ?`, params);
                        sectorNormalized++;
                    }
                });

                console.log(`   • ${sectorNormalized} setores normalizados`);
                console.log(`   ✅ Employees normalizados`);
            }

            //=======================
            // 4. ATUALIZAR CAREER_HISTORY
            //=======================
            console.log('\n📋 [4/4] Normalizando Career History...\n');

            db.all(`SELECT id, employee_id, sector FROM career_history`, [], (careerErr, careers) => {
                if (careerErr) {
                    console.error('❌ Erro ao buscar career:', careerErr.message);
                } else {
                    console.log(`   • ${careers.length} histórico de carreira encontrados`);

                    let historyNormalized = 0;

                    careers.forEach(ch => {
                        const sectorNorm = normalizeSector(ch.sector);
                        if (ch.sector !== sectorNorm) {
                            db.run(`UPDATE career_history SET sector = ? WHERE id = ?`, [sectorNorm, ch.id]);
                            historyNormalized++;
                        }
                    });

                    console.log(`   • ${historyNormalized} setores de histórico normalizados`);
                    console.log(`   ✅ Career History normalizado`);
                }

                //=======================
                // RESUMO
                //=======================
                console.log('\n========================================');
                console.log('✅ NORMALIZAÇÃO CONCLUÍDA');
                console.log('========================================\n');

                console.log('📊 RESUMO:');
                console.log(`   Companies: ${migrationLog.companies.length} alterações`);
                console.log(`   Roles: ${migrationLog.roles.length} alterações`);
                console.log(`   Employees: ${migrationLog.employees.length} alterações`);

                // Salvar log de migração
                const logFile = `migration_log_${Date.now()}.json`;
                const fs = require('fs');
                fs.writeFileSync(`backend/database/${logFile}`, JSON.stringify(migrationLog, null, 2));
                console.log(`\n   📄 Log salvo em: backend/database/${logFile}`);

                console.log('\n⚠️  IMPORTANTE:');
                console.log('   - Backup disponível em: database/backup_*.sqlite');
                console.log('   - Em caso de erro, restaurar o backup e investigar');
                console.log('   - Todos os setores agora são UPPERCASE e normalizados');

                // Validar integridade
                console.log('\n🔍 Validando integridade...\n');
                
                db.all(`SELECT COUNT(*) as count FROM employees`, [], (e, r) => {
                    console.log(`   • Employees: ${r[0].count}`);
                });
                db.all(`SELECT COUNT(*) as count FROM companies`, [], (e, r) => {
                    console.log(`   • Companies: ${r[0].count}`);
                });
                db.all(`SELECT COUNT(*) as count FROM roles_master`, [], (e, r) => {
                    console.log(`   • Roles: ${r[0].count}`);
                });

                // Verificar setores únicos
                db.all(`SELECT DISTINCT sector FROM employees ORDER BY sector`, [], (e, rows) => {
                    console.log(`   • Setores únicos: ${rows.map(r => r.sector).join(', ')}`);
                    
                    process.exit(0);
                });
            });
        });
    });
});