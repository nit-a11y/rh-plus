// ===================================
// BUSCA COMPLETA DE DADOS DO USUÁRIO
// Database Architect Persona - .agent
// ===================================

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('🔍 BUSCA COMPLETA DE DADOS DO USUÁRIO\n');
console.log('🎯 USUÁRIO: AILTON VENANCIO DA FONSECA (ID: e26a2f89)\n');

// Conexão com banco de dados
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Objeto para armazenar todos os dados do usuário
const userData = {
    employee: {},
    vinculos: [],
    emergency_contacts: [],
    career_history: [],
    vacation_records: [],
    aso_records: [],
    sst_certificates: [],
    tool_items: [],
    uniform_items: [],
    employee_dependents: [],
    employee_documents: {},
    benefit_history: [],
    occurrences: [],
    pj_contracts: [],
    custom_events: [],
    logs_auditoria: []
};

console.log('📋 ETAPA 1: DADOS PRINCIPAIS DO FUNCIONÁRIO');

// 1. Buscar dados principais do funcionário
db.get(`SELECT * FROM employees WHERE id = 'e26a2f89'`, (err, employee) => {
    if (err) {
        console.error('❌ Erro ao buscar dados do funcionário:', err.message);
        return;
    }

    if (!employee) {
        console.log('❌ Funcionário não encontrado');
        return;
    }

    userData.employee = employee;
    console.log('✅ Dados do funcionário encontrados');
    console.log(`   Nome: ${employee.name}`);
    console.log(`   ID: ${employee.id}`);
    console.log(`   Tipo: ${employee.type}`);
    console.log(`   Status: ${employee.type === 'DESLIGADO' ? 'DESLIGADO' : 'ATIVO'}`);
    console.log(`   Admissão: ${employee.admissionDate}`);
    console.log(`   Salário: ${employee.currentSalary}`);
    console.log(`   Setor: ${employee.sector}`);
    console.log(`   Cargo: ${employee.role}`);

    // 2. Buscar vínculos corporativos
    console.log('\n📋 ETAPA 2: VÍNCULOS CORPORATIVOS');
    db.all(`SELECT * FROM employee_vinculos WHERE employee_id = 'e26a2f89'`, (err, vinculos) => {
        if (!err && vinculos) {
            userData.vinculos = vinculos;
            console.log(`✅ Encontrados ${vinculos.length} vínculos corporativos`);
            vinculos.forEach(vinculo => {
                console.log(`   - Empregador: ${vinculo.employer_id} | Unidade: ${vinculo.workplace_id} | Principal: ${vinculo.principal ? 'SIM' : 'NÃO'}`);
            });
        }

        // 3. Buscar contatos de emergência
        console.log('\n📋 ETAPA 3: CONTATOS DE EMERGÊNCIA');
        db.all(`SELECT * FROM emergency_contacts WHERE employee_id = 'e26a2f89'`, (err, contacts) => {
            if (!err && contacts) {
                userData.emergency_contacts = contacts;
                console.log(`✅ Encontrados ${contacts.length} contatos de emergência`);
                contacts.forEach(contact => {
                    console.log(`   - ${contact.name} | ${contact.relationship} | ${contact.phone}`);
                });
            }

            // 4. Buscar histórico de carreira
            console.log('\n📋 ETAPA 4: HISTÓRICO DE CARREIRA');
            db.all(`SELECT * FROM employee_career WHERE employee_id = 'e26a2f89' ORDER BY start_date DESC`, (err, career) => {
                if (!err && career) {
                    userData.career_history = career;
                    console.log(`✅ Encontrados ${career.length} registros de carreira`);
                    career.forEach(record => {
                        console.log(`   - ${record.position} | ${record.start_date} a ${record.end_date || 'ATUAL'} | Salário: ${record.salary}`);
                    });
                }

                // 5. Buscar registros de férias
                console.log('\n📋 ETAPA 5: REGISTROS DE FÉRIAS');
                db.all(`SELECT * FROM vacation_records WHERE employee_id = 'e26a2f89' ORDER BY start_date DESC`, (err, vacations) => {
                    if (!err && vacations) {
                        userData.vacation_records = vacations;
                        console.log(`✅ Encontrados ${vacations.length} registros de férias`);
                        vacations.forEach(record => {
                            console.log(`   - ${record.start_date} a ${record.end_date} | ${record.days} dias | Status: ${record.status}`);
                        });
                    }

                    // 6. Buscar ASOs
                    console.log('\n📋 ETAPA 6: EXAMES OCUPACIONAIS (ASOS)');
                    db.all(`SELECT * FROM aso_records WHERE employee_id = 'e26a2f89' ORDER BY exam_date DESC`, (err, asos) => {
                        if (!err && asos) {
                            userData.aso_records = asos;
                            console.log(`✅ Encontrados ${asos.length} ASOs`);
                            asos.forEach(aso => {
                                console.log(`   - ${aso.exam_type} | ${aso.exam_date} | Validade: ${aso.validity} | Status: ${aso.status}`);
                            });
                        }

                        // 7. Buscar certificados SST
                        console.log('\n📋 ETAPA 7: CERTIFICADOS SST');
                        db.all(`SELECT * FROM sst_certificates WHERE employee_id = 'e26a2f89' ORDER BY issue_date DESC`, (err, certificates) => {
                            if (!err && certificates) {
                                userData.sst_certificates = certificates;
                                console.log(`✅ Encontrados ${certificates.length} certificados SST`);
                                certificates.forEach(cert => {
                                    console.log(`   - ${cert.certificate_type} | ${cert.issue_date} | Validade: ${cert.validity}`);
                                });
                            }

                            // 8. Buscar itens de ferramentas
                            console.log('\n📋 ETAPA 8: FERRAMENTAS E ATIVOS');
                            db.all(`SELECT * FROM tool_items WHERE employee_id = 'e26a2f89' ORDER BY assignment_date DESC`, (err, tools) => {
                                if (!err && tools) {
                                    userData.tool_items = tools;
                                    console.log(`✅ Encontrados ${tools.length} itens de ferramentas`);
                                    tools.forEach(tool => {
                                        console.log(`   - ${tool.item_name} | ${tool.assignment_date} | Status: ${tool.status}`);
                                    });
                                }

                                // 9. Buscar itens de uniforme
                                console.log('\n📋 ETAPA 9: ITENS DE UNIFORME');
                                db.all(`SELECT * FROM uniform_items WHERE employee_id = 'e26a2f89' ORDER BY delivery_date DESC`, (err, uniforms) => {
                                    if (!err && uniforms) {
                                        userData.uniform_items = uniforms;
                                        console.log(`✅ Encontrados ${uniforms.length} itens de uniforme`);
                                        uniforms.forEach(uniform => {
                                            console.log(`   - ${uniform.item_name} | Tam: ${uniform.size} | ${uniform.delivery_date} | Status: ${uniform.status}`);
                                        });
                                    }

                                    // 10. Buscar dependentes
                                    console.log('\n📋 ETAPA 10: DEPENDENTES');
                                    db.all(`SELECT * FROM employee_dependents WHERE employee_id = 'e26a2f89'`, (err, dependents) => {
                                        if (!err && dependents) {
                                            userData.employee_dependents = dependents;
                                            console.log(`✅ Encontrados ${dependents.length} dependentes`);
                                            dependents.forEach(dep => {
                                                console.log(`   - ${dep.name} | ${dep.relationship} | ${dep.birth_date}`);
                                            });
                                        }

                                        // 11. Buscar documentos do funcionário
                                        console.log('\n📋 ETAPA 11: DOCUMENTOS DO FUNCIONÁRIO');
                                        db.get(`SELECT * FROM employee_documents WHERE employee_id = 'e26a2f89'`, (err, documents) => {
                                            if (!err && documents) {
                                                userData.employee_documents = documents;
                                                console.log('✅ Documentos encontrados');
                                                console.log(`   - CPF: ${documents.cpf || 'NÃO CADASTRADO'}`);
                                                console.log(`   - RG: ${documents.rg_number || 'NÃO CADASTRADO'}`);
                                                console.log(`   - CTPS: ${documents.ctps || 'NÃO CADASTRADO'}`);
                                                console.log(`   - CNH: ${documents.cnh || 'NÃO CADASTRADO'}`);
                                                console.log(`   - Título: ${documents.voter_title || 'NÃO CADASTRADO'}`);
                                            }

                                            // 12. Buscar histórico de benefícios
                                            console.log('\n📋 ETAPA 12: HISTÓRICO DE BENEFÍCIOS');
                                            db.all(`SELECT * FROM benefit_history WHERE employee_id = 'e26a2f89' ORDER BY created_at DESC`, (err, benefits) => {
                                                if (!err && benefits) {
                                                    userData.benefit_history = benefits;
                                                    console.log(`✅ Encontrados ${benefits.length} registros de benefícios`);
                                                    benefits.forEach(benefit => {
                                                        console.log(`   - ${benefit.benefit_type} | ${benefit.created_at} | Status: ${benefit.status}`);
                                                    });
                                                }

                                                // 13. Buscar ocorrências
                                                console.log('\n📋 ETAPA 13: OCORRÊNCIAS');
                                                db.all(`SELECT * FROM occurrences WHERE employee_id = 'e26a2f89' ORDER BY created_at DESC`, (err, occurrences) => {
                                                    if (!err && occurrences) {
                                                        userData.occurrences = occurrences;
                                                        console.log(`✅ Encontradas ${occurrences.length} ocorrências`);
                                                        occurrences.forEach(occurrence => {
                                                            console.log(`   - ${occurrence.type} | ${occurrence.created_at} | ${occurrence.description}`);
                                                        });
                                                    }

                                                    // 14. Buscar contratos PJ
                                                    console.log('\n📋 ETAPA 14: CONTRATOS PJ');
                                                    db.all(`SELECT * FROM pj_contracts WHERE employee_id = 'e26a2f89' ORDER BY created_at DESC`, (err, pjContracts) => {
                                                        if (!err && pjContracts) {
                                                            userData.pj_contracts = pjContracts;
                                                            console.log(`✅ Encontrados ${pjContracts.length} contratos PJ`);
                                                            pjContracts.forEach(contract => {
                                                                console.log(`   - ${contract.company_name} | ${contract.created_at} | Status: ${contract.status}`);
                                                            });
                                                        }

                                                        // 15. Buscar eventos personalizados
                                                        console.log('\n📋 ETAPA 15: EVENTOS PERSONALIZADOS');
                                                        db.all(`SELECT * FROM custom_events WHERE employee_id = 'e26a2f89' ORDER BY created_at DESC`, (err, events) => {
                                                            if (!err && events) {
                                                                userData.custom_events = events;
                                                                console.log(`✅ Encontrados ${events.length} eventos personalizados`);
                                                                events.forEach(event => {
                                                                    console.log(`   - ${event.event_type} | ${event.created_at} | ${event.description}`);
                                                                });
                                                            }

                                                            // 16. Buscar logs de auditoria
                                                            console.log('\n📋 ETAPA 16: LOGS DE AUDITORIA');
                                                            db.all(`SELECT * FROM logs_auditoria WHERE employee_id = 'e26a2f89' ORDER BY created_at DESC LIMIT 10`, (err, logs) => {
                                                                if (!err && logs) {
                                                                    userData.logs_auditoria = logs;
                                                                    console.log(`✅ Encontrados ${logs.length} logs de auditoria (últimos 10)`);
                                                                    logs.forEach(log => {
                                                                        console.log(`   - ${log.action} | ${log.created_at} | ${log.user}`);
                                                                    });
                                                                }

                                                                // Gerar relatório completo
                                                                generateCompleteReport();
                                                            });
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

// Gerar relatório completo no formato do dossier
function generateCompleteReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📋 DOSSIER COMPLETO - TODOS OS DADOS DO BANCO');
    console.log('='.repeat(80));
    
    console.log(`\n👤 Colaborador: ${userData.employee.name}`);
    console.log(`ID: ${userData.employee.id}`);
    console.log(`CONFIDENCIAL`);
    console.log(`Ficha de Registro Completa`);
    console.log(`Nordeste Locações • Dossiê 360º • Prontuário Digital`);
    
    // Situação Atual
    console.log(`\n🔎 Situação Atual`);
    const isActive = userData.employee.type !== 'DESLIGADO';
    console.log(`${isActive ? 'ATIVO' : 'DESLIGADO'}`);
    
    console.log(`\nStatus do Colaborador`);
    if (userData.employee.admissionDate) {
        const admissionDate = new Date(userData.employee.admissionDate);
        const currentDate = new Date();
        const monthsDiff = Math.floor((currentDate - admissionDate) / (1000 * 60 * 60 * 24 * 30));
        const years = Math.floor(monthsDiff / 12);
        const months = monthsDiff % 12;
        console.log(`${years} ano${years !== 1 ? 's' : ''} e ${months} mes${months !== 1 ? 'es' : ''}`);
    }
    
    console.log(`\nTempo de Casa Acumulado`);
    
    // Vínculo Corporativo
    console.log(`\n🏢 Vínculo Corporativo`);
    console.log(`Tipo Contratação: ${userData.employee.contracting_type || 'CLT'}`);
    
    if (userData.vinculos.length > 0) {
        const mainVinculo = userData.vinculos.find(v => v.principal) || userData.vinculos[0];
        console.log(`Empregador (Contratual): ${mainVinculo.employer_id}`);
        console.log(`Lotação Física (Unidade): ${mainVinculo.workplace_id}`);
    }
    
    console.log(`\nHistórico de Transferências`);
    console.log(`MOVIMENTAÇÃO DE VÍNCULOS`);
    if (userData.vinculos.length <= 1) {
        console.log(`Nenhum histórico de transferência encontrado.`);
    } else {
        userData.vinculos.forEach(vinculo => {
            console.log(`${vinculo.employer_id} | ${vinculo.workplace_id} | Principal: ${vinculo.principal ? 'SIM' : 'NÃO'}`);
        });
    }
    
    // Identificação & Filição
    console.log(`\n👤 Identificação & Filição`);
    console.log(`Nome Completo: ${userData.employee.name}`);
    console.log(`Nascimento: ${userData.employee.birthDate}`);
    console.log(`Gênero: ${userData.employee.gender}`);
    console.log(`Nome do Pai: ${userData.employee.fatherName}`);
    console.log(`Nome da Mãe: ${userData.employee.motherName}`);
    console.log(`Estado Civil: ${userData.employee.maritalStatus}`);
    console.log(`Escolaridade: ${userData.employee.educationLevel}`);
    console.log(`Etnia: ${userData.employee.ethnicity}`);
    console.log(`Naturalidade: ${userData.employee.placeOfBirth}`);
    
    // Contatos & Localização
    console.log(`\n📞 Contatos & Localização`);
    console.log(`E-mail: ${userData.employee.personalEmail}`);
    console.log(`Telefone: ${userData.employee.personalPhone}`);
    console.log(`Endereço: ${userData.employee.street}`);
    console.log(`Cidade/UF: ${userData.employee.city}/${userData.employee.state_uf}`);
    console.log(`CEP: ${userData.employee.cep}`);
    
    // Documentos
    console.log(`\n📄 Central de Documentos Legais`);
    if (userData.employee_documents.cpf) {
        console.log(`CPF: ${userData.employee_documents.cpf}`);
    }
    if (userData.employee_documents.pis_pasep) {
        console.log(`PIS/PASEP: ${userData.employee_documents.pis_pasep}`);
    }
    if (userData.employee_documents.rg_number) {
        console.log(`RG Número: ${userData.employee_documents.rg_number}`);
        console.log(`RG Órgão/UF: ${userData.employee_documents.rg_organ}/${userData.employee_documents.rg_uf}`);
    }
    if (userData.employee_documents.ctps) {
        console.log(`CTPS: ${userData.employee_documents.ctps}`);
    }
    if (userData.employee_documents.cnh) {
        console.log(`CNH: ${userData.employee_documents.cnh}`);
    }
    if (userData.employee_documents.voter_title) {
        console.log(`Título Eleitor: ${userData.employee_documents.voter_title}`);
        console.log(`Zona/Seção: ${userData.employee_documents.voter_zone}/${userData.employee_documents.voter_section}`);
    }
    
    // Configuração de Vínculo
    console.log(`\n💼 Configuração de Vínculo eSocial`);
    console.log(`Matrícula: ${userData.employee.registrationNumber}`);
    console.log(`Admissão: ${userData.employee.admissionDate}`);
    console.log(`Cargo: ${userData.employee.role}`);
    console.log(`CBO: ${userData.employee.cbo}`);
    console.log(`Setor: ${userData.employee.sector}`);
    console.log(`Salário Base: ${userData.employee.currentSalary}`);
    console.log(`Hierarquia: ${userData.employee.hierarchy}`);
    
    // Escala & Jornada
    console.log(`\n⏰ Escala & Jornada`);
    console.log(`Escala: ${userData.employee.work_scale || '5x2'}`);
    console.log(`Horário: ${userData.employee.work_schedule || '07:30 às 17:18'}`);
    
    // Dados de Entrada
    console.log(`\n📜 DADOS DE ENTRADA (HISTÓRICO)`);
    console.log(`Cargo Inicial (Admissão): ${userData.employee.initialRole}`);
    console.log(`Salário Inicial: ${userData.employee.initialSalary}`);
    
    // Fardamento
    console.log(`\n🎽 Logística de Fardamento (Ciclo de Vida)`);
    if (userData.uniform_items.length > 0) {
        console.log(`Itens Ativos no Momento`);
        userData.uniform_items.filter(item => item.status === 'DELIVERED').forEach(item => {
            console.log(`${item.item_name} | ${item.size} | ${item.delivery_date} | ${item.status}`);
        });
    } else {
        console.log(`Sem itens ativos.`);
    }
    
    // Ferramentas
    console.log(`\n💻 Inventário de Ativos & Ferramentas`);
    if (userData.tool_items.length > 0) {
        console.log(`Hardware sob Responsabilidade (Comodato)`);
        userData.tool_items.filter(item => item.status === 'ASSIGNED').forEach(tool => {
            console.log(`${tool.item_name} | ${tool.assignment_date} | ${tool.status}`);
        });
    } else {
        console.log(`Nenhum ativo vinculado no momento.`);
    }
    
    // Férias
    console.log(`\n📅 Gestão de Férias e Descansos`);
    if (userData.vacation_records.length > 0) {
        userData.vacation_records.forEach(record => {
            console.log(`${record.start_date} a ${record.end_date} | ${record.days} dias | ${record.status}`);
        });
    } else {
        console.log(`Sem histórico de férias registradas no prontuário.`);
    }
    
    // Absenteísmo
    console.log(`\n🏥 Histórico de Absenteísmo e Afastamentos`);
    console.log(`Total de Dias de Ausência (Histórico): 0 DIAS`);
    console.log(`Nenhum registro de afastamento médico.`);
    
    // Benefícios
    console.log(`\n🎁 Gestão de Benefícios & Verbas`);
    if (userData.benefit_history.length > 0) {
        console.log(`Benefícios Contratuais Vigentes`);
        userData.benefit_history.filter(b => b.status === 'ACTIVE').forEach(benefit => {
            console.log(`${benefit.benefit_type} | ${benefit.value} | ${benefit.status} | ${benefit.created_at}`);
        });
    }
    
    // Dependentes
    console.log(`\n👨‍👩‍👧 Dependentes Legais (IRRF / Salário Família)`);
    if (userData.employee_dependents.length > 0) {
        userData.employee_dependents.forEach(dep => {
            console.log(`${dep.name} | ${dep.cpf} | ${dep.birth_date} | ${dep.relationship}`);
        });
    } else {
        console.log(`Nenhum dependente vinculado.`);
    }
    
    // Contatos de Emergência
    console.log(`\n🆘 Contatos de Emergência`);
    if (userData.emergency_contacts.length > 0) {
        userData.emergency_contacts.forEach(contact => {
            console.log(`${contact.name} | ${contact.phone} | ${contact.relationship}`);
        });
    } else {
        console.log(`Nenhum contato SOS cadastrado.`);
    }
    
    // Carreira
    console.log(`\n📈 Jornada & Histórico Profissional`);
    if (userData.career_history.length > 0) {
        userData.career_history.forEach(record => {
            const date = new Date(record.created_at);
            console.log(`${date.toLocaleString('pt-BR')} | ${record.action} | ${record.position} | ${record.department}`);
        });
    }
    
    // Salários
    console.log(`\n💰 Evolução Salarial & Crescimento de Carreira`);
    console.log(`📊 Análise Comparativa`);
    console.log(`Salário Inicial (Admissão): ${userData.employee.initialSalary}`);
    console.log(`Salário Atual / Final: ${userData.employee.currentSalary}`);
    
    if (userData.employee.initialSalary && userData.employee.currentSalary) {
        const initial = parseFloat(userData.employee.initialSalary.replace(/[^\d.,]/g, '').replace(',', '.'));
        const current = parseFloat(userData.employee.currentSalary.replace(/[^\d.,]/g, '').replace(',', '.'));
        const variation = current - initial;
        const percent = ((variation / initial) * 100).toFixed(2);
        console.log(`Variação Total: R$ ${variation.toFixed(2)} (${percent}%)`);
    }
    
    // ASOs
    console.log(`\n🩺 Saúde Ocupacional (ASOs)`);
    if (userData.aso_records.length > 0) {
        userData.aso_records.forEach(aso => {
            console.log(`${aso.exam_type} | ${aso.exam_date} | ${aso.validity} | ${aso.status}`);
        });
    }
    
    // Status Demissional
    console.log(`\n🚪 Seção Demissional`);
    console.log(`Status do Colaborador: ${isActive ? 'Ativo' : 'Desligado'}`);
    if (!isActive) {
        console.log(`Data de Desligamento: ${userData.employee.type}`);
    } else {
        console.log(`Data de Desligamento: Colaborador ativo por enquanto.`);
    }
    
    // Data do relatório
    const now = new Date();
    console.log(`\nRelatório Gerado em: ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR')}`);
    console.log(`Dossiê Consolidado • Sistema Nordeste RH+`);
    
    // Salvar dados completos em JSON
    const jsonPath = path.join(__dirname, 'user_complete_data_e26a2f89.json');
    require('fs').writeFileSync(jsonPath, JSON.stringify(userData, null, 2));
    console.log(`\n💾 Dados completos salvos em: ${jsonPath}`);
    
    console.log('\n✅ BUSCA COMPLETA CONCLUÍDA!');
    console.log('🚀 Todos os dados do usuário foram coletados com sucesso!');
    
    db.close();
}
