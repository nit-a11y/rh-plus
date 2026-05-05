const { query } = require('../config/database');

async function simpleDossierFix() {
    try {
        console.log('🔧 Aplicando fix simples para o dossier...');
        
        const employeeId = '3cdfbfa2';
        
        // 1. Query simples e direta (sem WITH clauses complexas)
        console.log('\n📋 1. Testando query simples...');
        
        const simpleQuery = `
            SELECT 
                e.id, e.name, e."registrationNumber", e.role, e.sector, 
                e.admissionDate, e.birthDate, e.currentSalary, e.photoUrl,
                e.street, e.city, e.neighborhood, e.state_uf, e.cep,
                e.fatherName, e.motherName, e.gender, e.maritalStatus,
                e.ethnicity, e.educationLevel, e.placeOfBirth,
                e.personalEmail, e.personalPhone, e.work_schedule,
                e.work_scale, e.cbo, e.hierarchy, e.type,
                e.initialRole, e.initialSalary, e.terminationReason,
                e.terminationDate, e.observation, e.cpf,
                emp.name as employer_name, emp.cnpj as employer_cnpj,
                wp.name as workplace_name, wp.cnpj as workplace_cnpj,
                ed.cpf as doc_cpf, ed.pis_pasep as doc_pis_pasep,
                ed.rg_number as doc_rg_number, ed.rg_organ as doc_rg_organ,
                ed.rg_date as doc_rg_date, ed.rg_uf as doc_rg_uf,
                ed.ctps_number as doc_ctps_number, ed.cnh_number as doc_cnh_number,
                ed.voter_title as doc_voter_title, ed.voter_zone as doc_voter_zone,
                ed.voter_section as doc_voter_section
            FROM employees e
            LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.status = 'ATIVO'
            LEFT JOIN companies emp ON ev.employer_id = emp.id
            LEFT JOIN companies wp ON ev.workplace_id = wp.id
            LEFT JOIN employee_documents ed ON e.id = ed.employee_id
            WHERE e.id = $1
        `;
        
        const startTime = Date.now();
        const result = await query(simpleQuery, [employeeId]);
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log(`✅ Query simples: ${duration}ms`);
        console.log(`📊 Registros: ${result.rows.length}`);
        
        if (result.rows.length > 0) {
            const data = result.rows[0];
            
            // Testar JSON
            try {
                const jsonString = JSON.stringify(data);
                console.log(`📏 JSON size: ${jsonString.length} bytes`);
                
                // Verificar primeiros caracteres
                const first30 = jsonString.substring(0, 30);
                console.log(`🔍 Primeiros 30 chars: "${first30}"`);
                
                JSON.parse(jsonString);
                console.log('✅ JSON válido');
                
            } catch (jsonError) {
                console.log('❌ Erro no JSON:', jsonError.message);
                
                // Tentar identificar caractere problemático
                const jsonString = JSON.stringify(data);
                for (let i = 0; i < Math.min(jsonString.length, 100); i++) {
                    const char = jsonString[i];
                    const code = jsonString.charCodeAt(i);
                    
                    if (code < 32 && code !== 9 && code !== 10 && code !== 13) {
                        console.log(`❌ Caractere problemático na posição ${i}: "${char}" (${code})`);
                        break;
                    }
                }
            }
        }
        
        // 2. Verificar se há metadata corrompido
        console.log('\n🔍 2. Verificando metadata...');
        
        const metadataQuery = await query(`
            SELECT metadata FROM employees WHERE id = $1
        `, [employeeId]);
        
        if (metadataQuery.rows.length > 0) {
            const metadata = metadataQuery.rows[0].metadata;
            console.log('Metadata bruto:', metadata);
            
            if (metadata) {
                try {
                    JSON.parse(metadata);
                    console.log('✅ Metadata JSON válido');
                } catch (metaError) {
                    console.log('❌ Metadata JSON inválido:', metaError.message);
                    
                    // Corrigir metadata
                    console.log('🔧 Corrigindo metadata...');
                    await query(`
                        UPDATE employees 
                        SET metadata = '{}' 
                        WHERE id = $1
                    `, [employeeId]);
                    
                    console.log('✅ Metadata corrigido');
                }
            }
        }
        
        // 3. Limpar caracteres problemáticos
        console.log('\n🧹 3. Limpando caracteres problemáticos...');
        
        const cleanQuery = `
            UPDATE employees 
            SET 
                name = REGEXP_REPLACE(name, '[^\\x20-\\x7E]', '', 'g'),
                "registrationNumber" = REGEXP_REPLACE("registrationNumber", '[^\\x20-\\x7E]', '', 'g'),
                observation = REGEXP_REPLACE(observation, '[^\\x20-\\x7E]', '', 'g')
            WHERE id = $1
        `;
        
        await query(cleanQuery, [employeeId]);
        console.log('✅ Caracteres problemáticos limpos');
        
        console.log('\n🎉 Fix simples aplicado!');
        console.log('✅ Query simplificada');
        console.log('✅ Metadata corrigido');
        console.log('✅ Caracteres limpos');
        
    } catch (error) {
        console.error('❌ Erro no fix:', error.message);
    } finally {
        process.exit(0);
    }
}

simpleDossierFix();
