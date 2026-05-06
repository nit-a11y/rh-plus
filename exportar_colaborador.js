const { query } = require('./backend/config/database');
const fs = require('fs');

async function exportarColaborador() {
    const employeeId = '3cdfbfa2';
    
    try {
        console.log('🔍 Buscando dados do colaborador JOSE EMERSON MOREIRA NERI...');
        
        // 1. Dados principais do employee
        const employee = await query('SELECT * FROM employees WHERE id = $1', [employeeId]);
        
        if (employee.rows.length === 0) {
            console.log('❌ Colaborador não encontrado no banco local');
            return;
        }
        
        console.log('✅ Employee encontrado');
        
        // 2. Buscar todos os dados relacionados
        const [
            career, documents, dependents, emergencyContacts,
            benefits, benefitHistory, uniformItems, uniformHistory,
            vacations, aso, occurrences, sstCertificates,
            toolItems, toolHistory, terminations, archive
        ] = await Promise.all([
            query('SELECT * FROM career_history WHERE employee_id = $1', [employeeId]),
            query('SELECT * FROM employee_documents WHERE employee_id = $1', [employeeId]),
            query('SELECT * FROM employee_dependents WHERE employee_id = $1', [employeeId]),
            query('SELECT * FROM employee_emergency_contacts WHERE employee_id = $1', [employeeId]),
            query('SELECT * FROM employee_benefits WHERE employee_id = $1', [employeeId]),
            query('SELECT h.*, b.benefit_name FROM benefit_history h JOIN employee_benefits b ON h.benefit_id = b.id WHERE b.employee_id = $1', [employeeId]),
            query('SELECT * FROM uniform_items WHERE employee_id = $1', [employeeId]),
            query('SELECT * FROM uniform_history WHERE employee_id = $1', [employeeId]),
            query('SELECT * FROM vacation_records WHERE employee_id = $1', [employeeId]),
            query('SELECT * FROM aso_records WHERE employee_id = $1', [employeeId]),
            query('SELECT * FROM occurrences WHERE employee_id = $1', [employeeId]),
            query('SELECT * FROM sst_certificates WHERE employee_id = $1', [employeeId]),
            query('SELECT * FROM tool_items WHERE employee_id = $1', [employeeId]),
            query('SELECT * FROM tool_history WHERE employee_id = $1', [employeeId]),
            query('SELECT * FROM employee_terminations WHERE employee_id = $1', [employeeId]),
            query('SELECT * FROM employee_archive WHERE employee_id = $1', [employeeId])
        ]);
        
        // 3. Compilar dados completos
        const dadosCompletos = {
            employee: employee.rows[0],
            career: career.rows,
            documents: documents.rows[0] || null,
            dependents: dependents.rows,
            emergencyContacts: emergencyContacts.rows,
            benefits: benefits.rows,
            benefitHistory: benefitHistory.rows,
            uniformItems: uniformItems.rows,
            uniformHistory: uniformHistory.rows,
            vacations: vacations.rows,
            aso: aso.rows,
            occurrences: occurrences.rows,
            sstCertificates: sstCertificates.rows,
            toolItems: toolItems.rows,
            toolHistory: toolHistory.rows,
            terminations: terminations.rows,
            archive: archive.rows[0] || null
        };
        
        // 4. Salvar em arquivo JSON
        fs.writeFileSync('colaborador_3cdfbfa2_backup.json', JSON.stringify(dadosCompletos, null, 2));
        
        console.log('✅ Dados exportados com sucesso!');
        console.log('📁 Arquivo: colaborador_3cdfbfa2_backup.json');
        console.log(`📊 Total de registros: ${JSON.stringify(dadosCompletos).length} bytes`);
        
        // 5. Gerar script de inserção para VPS
        const scriptVPS = gerarScriptInsercao(dadosCompletos);
        fs.writeFileSync('injetar_colaborador_vps.js', scriptVPS);
        
        console.log('✅ Script de injeção gerado: injetar_colaborador_vps.js');
        
    } catch (error) {
        console.error('❌ Erro ao exportar:', error);
    }
}

function gerarScriptInsercao(dados) {
    return `
// Script para injetar colaborador na VPS
const { query, transaction } = require('./backend/config/database');

async function injetarColaborador() {
    const employeeId = '${dados.employee.id}';
    
    try {
        console.log('🔥 Injetando colaborador JOSE EMERSON MOREIRA NERI na VPS...');
        
        await transaction(async (client) => {
            // 1. Inserir employee principal
            const emp = dados.employee;
            await client.query(\`
                INSERT INTO employees (id, name, "registrationNumber", role, sector, type, "photoUrl", cbo, 
                admissiondate, birthdate, cpf, rg, pis_pasep, postalcode, street, neighborhood, city, 
                state_uf, personal_email, fathername, mothername, work_schedule, work_scale, 
                educationlevel, maritalstatus, placeofbirth, initialrole, initialsalary, 
                terminationreason, employer_id, workplace_id, metadata, currentsalary, 
                terminationdate, gender, phone, nationality, bloodtype, handicapped, 
                educationlevel_description, cbo_description, mother_name, father_name, 
                person_name, social_name, email, company_email, admission_date, 
                birth_date, termination_date, postal_code, personal_email, 
                father_name, mother_name, work_schedule, work_scale, 
                education_level, marital_status, place_of_birth, initial_role, 
                initial_salary, termination_reason, photo_url, registration_number)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46, $47, $48, $49, $50, $51, $52, $53, $54, $55, $56, $57, $58, $59, $60, $61, $62)
            \`, [
                emp.id, emp.name, emp.registrationNumber, emp.role, emp.sector, emp.type, emp.photoUrl, emp.cbo,
                emp.admissiondate, emp.birthdate, emp.cpf, emp.rg, emp.pis_pasep, emp.postalcode, emp.street, emp.neighborhood, emp.city,
                emp.state_uf, emp.personal_email, emp.fathername, emp.mothername, emp.work_schedule, emp.work_scale,
                emp.educationlevel, emp.maritalstatus, emp.placeofbirth, emp.initialrole, emp.initialsalary,
                emp.terminationreason, emp.employer_id, emp.workplace_id, emp.metadata, emp.currentsalary,
                emp.terminationdate, emp.gender, emp.phone, emp.nationality, emp.bloodtype, emp.handicapped,
                emp.educationlevel_description, emp.cbo_description, emp.mother_name, emp.father_name,
                emp.person_name, emp.social_name, emp.email, emp.company_email, emp.admission_date,
                emp.birth_date, emp.termination_date, emp.postal_code, emp.personal_email,
                emp.father_name, emp.mother_name, emp.work_schedule, emp.work_scale,
                emp.education_level, emp.marital_status, emp.place_of_birth, emp.initial_role,
                emp.initial_salary, emp.termination_reason, emp.photo_url, emp.registration_number
            ]);
            
            console.log('✅ Employee inserido');
            
            // 2. Inserir documents
            if (dados.documents) {
                const doc = dados.documents;
                await client.query(\`
                    INSERT INTO employee_documents (employee_id, rg, cpf, pis, cnh, reservista, 
                    titulo_eleitor, certidao_nascimento, certidao_casamento, 
                    comprovante_residencia, carteira_vacinacao, aso, 
                    exame_admissional, ficha_registro, termo_responsabilidade)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                \`, [
                    doc.employee_id, doc.rg, doc.cpf, doc.pis, doc.cnh, doc.reservista,
                    doc.titulo_eleitor, doc.certidao_nascimento, doc.certidao_casamento,
                    doc.comprovante_residencia, doc.carteira_vacinacao, doc.aso,
                    doc.exame_admissional, doc.ficha_registro, doc.termo_responsabilidade
                ]);
                console.log('✅ Documents inserido');
            }
            
            // 3. Inserir career history
            for (const career of dados.career) {
                await client.query(\`
                    INSERT INTO career_history (id, employee_id, role, sector, salary, move_type, date, responsible, observation, cbo)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                \`, [career.id, career.employee_id, career.role, career.sector, career.salary, career.move_type, career.date, career.responsible, career.observation, career.cbo]);
            }
            console.log(\`✅ \${dados.career.length} registros de career inseridos\`);
            
            // 4. Inserir benefits
            for (const benefit of dados.benefits) {
                await client.query(\`
                    INSERT INTO employee_benefits (id, employee_id, benefit_name, value, start_date, status, observation)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                \`, [benefit.id, benefit.employee_id, benefit.benefit_name, benefit.value, benefit.start_date, benefit.status, benefit.observation]);
            }
            console.log(\`✅ \${dados.benefits.length} benefits inseridos\`);
            
            // 5. Inserir ASO
            for (const aso of dados.aso) {
                await client.query(\`
                    INSERT INTO aso_records (id, employee_id, exam_type, exam_date, expiry_date, result, clinic, doctor_name, crm, observation)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                \`, [aso.id, aso.employee_id, aso.exam_type, aso.exam_date, aso.expiry_date, aso.result, aso.clinic, aso.doctor_name, aso.crm, aso.observation]);
            }
            console.log(\`✅ \${dados.aso.length} registros ASO inseridos\`);
            
            // 6. Inserir outros registros se existirem...
            // (dependents, emergency_contacts, uniform_items, etc.)
            
        });
        
        console.log('🎉 Colaborador injetado com sucesso na VPS!');
        
    } catch (error) {
        console.error('❌ Erro ao injetar:', error);
        throw error;
    }
}

injetarColaborador();
`;
}

exportarColaborador().then(() => process.exit(0));
