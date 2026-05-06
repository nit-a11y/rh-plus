// Script corrigido para injetar colaborador na VPS
const fs = require('fs');
const { query, transaction } = require('./backend/config/database');

async function injetarColaborador() {
    try {
        console.log('🔥 Injetando colaborador JOSE EMERSON MOREIRA NERI na VPS...');
        
        // Carregar dados do backup
        const dadosJSON = fs.readFileSync('colaborador_3cdfbfa2_backup.json', 'utf8');
        const dados = JSON.parse(dadosJSON);
        
        const employeeId = dados.employee.id;
        
        await transaction(async (client) => {
            // 1. Verificar se employee já existe
            const existing = await client.query('SELECT id FROM employees WHERE id = $1', [employeeId]);
            if (existing.rows.length > 0) {
                console.log('⚠️  Employee já existe, atualizando...');
                await client.query('DELETE FROM employees WHERE id = $1', [employeeId]);
            }
            
            // 2. Inserir employee principal
            const emp = dados.employee;
            await client.query(`
                INSERT INTO employees (id, name, "registrationNumber", role, sector, type, "photoUrl", cbo, 
                admission_date, birth_date, cpf, rg, pis_pasep, postal_code, street, neighborhood, city, 
                state_uf, personal_email, father_name, mother_name, work_schedule, work_scale, 
                education_level, marital_status, place_of_birth, initial_role, initial_salary, 
                termination_reason, employer_id, workplace_id, metadata, current_salary, 
                termination_date, gender, phone, nationality, blood_type, handicapped, 
                education_level_description, cbo_description, person_name, social_name, 
                email, company_email, photo_url, registration_number)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46, $47, $48, $49, $50)
            `, [
                emp.id, emp.name, emp.registrationNumber, emp.role, emp.sector, emp.type, emp.photoUrl, emp.cbo,
                emp.admission_date, emp.birth_date, emp.cpf, emp.rg, emp.pis_pasep, emp.postal_code, emp.street, emp.neighborhood, emp.city,
                emp.state_uf, emp.personal_email, emp.father_name, emp.mother_name, emp.work_schedule, emp.work_scale,
                emp.education_level, emp.marital_status, emp.place_of_birth, emp.initial_role, emp.initial_salary,
                emp.termination_reason, emp.employer_id, emp.workplace_id, emp.metadata, emp.current_salary,
                emp.termination_date, emp.gender, emp.phone, emp.nationality, emp.blood_type, emp.handicapped,
                emp.education_level_description, emp.cbo_description, emp.person_name, emp.social_name,
                emp.email, emp.company_email, emp.photo_url, emp.registration_number
            ]);
            
            console.log('✅ Employee inserido');
            
            // 3. Inserir documents se existir
            if (dados.documents) {
                const doc = dados.documents;
                await client.query(`
                    DELETE FROM employee_documents WHERE employee_id = $1
                `, [doc.employee_id]);
                
                await client.query(`
                    INSERT INTO employee_documents (employee_id, rg, cpf, pis, cnh, reservista, 
                    titulo_eleitor, certidao_nascimento, certidao_casamento, 
                    comprovante_residencia, carteira_vacinacao, aso, 
                    exame_admissional, ficha_registro, termo_responsabilidade)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                `, [
                    doc.employee_id, doc.rg, doc.cpf, doc.pis, doc.cnh, doc.reservista,
                    doc.titulo_eleitor, doc.certidao_nascimento, doc.certidao_casamento,
                    doc.comprovante_residencia, doc.carteira_vacinacao, doc.aso,
                    doc.exame_admissional, doc.ficha_registro, doc.termo_responsabilidade
                ]);
                console.log('✅ Documents inserido');
            }
            
            // 4. Inserir career history
            if (dados.career && dados.career.length > 0) {
                await client.query('DELETE FROM career_history WHERE employee_id = $1', [employeeId]);
                
                for (const career of dados.career) {
                    await client.query(`
                        INSERT INTO career_history (id, employee_id, role, sector, salary, move_type, date, responsible, observation, cbo)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    `, [career.id, career.employee_id, career.role, career.sector, career.salary, career.move_type, career.date, career.responsible, career.observation, career.cbo]);
                }
                console.log(`✅ ${dados.career.length} registros de career inseridos`);
            }
            
            // 5. Inserir benefits
            if (dados.benefits && dados.benefits.length > 0) {
                await client.query('DELETE FROM employee_benefits WHERE employee_id = $1', [employeeId]);
                
                for (const benefit of dados.benefits) {
                    await client.query(`
                        INSERT INTO employee_benefits (id, employee_id, benefit_name, value, start_date, status, observation)
                        VALUES ($1, $2, $3, $4, $5, $6, $7)
                    `, [benefit.id, benefit.employee_id, benefit.benefit_name, benefit.value, benefit.start_date, benefit.status, benefit.observation]);
                }
                console.log(`✅ ${dados.benefits.length} benefits inseridos`);
            }
            
            // 6. Inserir ASO
            if (dados.aso && dados.aso.length > 0) {
                await client.query('DELETE FROM aso_records WHERE employee_id = $1', [employeeId]);
                
                for (const aso of dados.aso) {
                    await client.query(`
                        INSERT INTO aso_records (id, employee_id, exam_type, exam_date, expiry_date, result, clinic, doctor_name, crm, observation)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    `, [aso.id, aso.employee_id, aso.exam_type, aso.exam_date, aso.expiry_date, aso.result, aso.clinic, aso.doctor_name, aso.crm, aso.observation]);
                }
                console.log(`✅ ${dados.aso.length} registros ASO inseridos`);
            }
            
            // 7. Inserir uniform items
            if (dados.uniformItems && dados.uniformItems.length > 0) {
                await client.query('DELETE FROM uniform_items WHERE employee_id = $1', [employeeId]);
                
                for (const item of dados.uniformItems) {
                    await client.query(`
                        INSERT INTO uniform_items (id, employee_id, type, color, size, dateGiven, nextExchangeDate, status)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    `, [item.id, item.employee_id, item.type, item.color, item.size, item.dateGiven, item.nextExchangeDate, item.status]);
                }
                console.log(`✅ ${dados.uniformItems.length} uniform items inseridos`);
            }
            
        });
        
        console.log('🎉 Colaborador injetado com sucesso na VPS!');
        
    } catch (error) {
        console.error('❌ Erro ao injetar:', error);
        throw error;
    }
}

injetarColaborador().then(() => process.exit(0));
