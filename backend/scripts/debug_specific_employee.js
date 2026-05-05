const { query } = require('../config/database');

async function debugSpecificEmployee() {
    try {
        console.log('🔍 Debugando employee específico: 3cdfbfa2');
        
        const employeeId = '3cdfbfa2';
        
        // 1. Verificar dados básicos do employee
        console.log('\n📋 1. Verificando dados básicos...');
        const basicData = await query(`
            SELECT id, name, "registrationNumber", metadata
            FROM employees 
            WHERE id = $1
        `, [employeeId]);
        
        if (basicData.rows.length === 0) {
            console.log('❌ Employee não encontrado');
            return;
        }
        
        const employee = basicData.rows[0];
        console.log('✅ Employee encontrado:');
        console.log(`  ID: ${employee.id}`);
        console.log(`  Nome: ${employee.name}`);
        console.log(`  Matrícula: ${employee.registrationNumber}`);
        console.log(`  Metadata: ${employee.metadata}`);
        
        // 2. Verificar se há caracteres problemáticos nos dados
        console.log('\n🔍 2. Verificando caracteres problemáticos...');
        
        const problematicChars = [];
        const fieldsToCheck = ['name', 'registrationNumber'];
        
        for (const field of fieldsToCheck) {
            const value = employee[field];
            if (value) {
                for (let i = 0; i < value.length; i++) {
                    const char = value[i];
                    const code = value.charCodeAt(i);
                    
                    // Caracteres de controle (exceto whitespace normal)
                    if (code < 32 && code !== 9 && code !== 10 && code !== 13) {
                        problematicChars.push({
                            field,
                            position: i,
                            char: char,
                            code: code,
                            description: 'Caractere de controle'
                        });
                    }
                    
                    // Unicode inválido
                    if (code >= 0xD800 && code <= 0xDFFF) {
                        problematicChars.push({
                            field,
                            position: i,
                            char: char,
                            code: code,
                            description: 'Unicode surrogate'
                        });
                    }
                }
            }
        }
        
        if (problematicChars.length > 0) {
            console.log('❌ Caracteres problemáticos encontrados:');
            problematicChars.forEach(pc => {
                console.log(`  ${pc.field}[${pc.position}]: "${pc.char}" (${pc.code}) - ${pc.description}`);
            });
        } else {
            console.log('✅ Nenhum caractere problemático encontrado');
        }
        
        // 3. Verificar career_history (múltiplas queries detectadas)
        console.log('\n📈 3. Analisando career_history...');
        
        const careerHistory = await query(`
            SELECT * FROM career_history 
            WHERE employee_id = $1 
            ORDER BY date DESC
        `, [employeeId]);
        
        console.log(`📊 Total de registros: ${careerHistory.rows.length}`);
        
        careerHistory.rows.forEach((record, index) => {
            console.log(`\n  Registro ${index + 1}:`);
            console.log(`    ID: ${record.id}`);
            console.log(`    Data: ${record.date}`);
            console.log(`    Move Type: ${record.move_type}`);
            console.log(`    Role: ${record.role}`);
            console.log(`    Observation: ${record.observation}`);
            
            // Verificar caracteres problemáticos no observation
            if (record.observation) {
                for (let i = 0; i < Math.min(record.observation.length, 50); i++) {
                    const char = record.observation[i];
                    const code = record.observation.charCodeAt(i);
                    
                    if (code < 32 && code !== 9 && code !== 10 && code !== 13) {
                        console.log(`    ⚠️ Caractere problemático em observation[${i}]: "${char}" (${code})`);
                    }
                }
            }
        });
        
        // 4. Simular resposta JSON do dossier
        console.log('\n📝 4. Simulando resposta JSON...');
        
        try {
            // Simular query completa do dossier
            const dossierData = await query(`
                SELECT e.*, ed.*, eb.*, edep.*, eec.*, vr.*, uh.*, ti.*, th.*,
                       ev.*, emp.name as employer_name, emp.cnpj as employer_cnpj,
                       wp.name as workplace_name, wp.cnpj as workplace_cnpj
                FROM employees e
                LEFT JOIN employee_documents ed ON e.id = ed.employee_id
                LEFT JOIN employee_benefits eb ON e.id = eb.employee_id
                LEFT JOIN employee_dependents edep ON e.id = edep.employee_id
                LEFT JOIN employee_emergency_contacts eec ON e.id = eec.employee_id
                LEFT JOIN vacation_records vr ON e.id = vr.employee_id
                LEFT JOIN uniform_history uh ON e.id = uh.employee_id
                LEFT JOIN tool_items ti ON e.id = ti.employee_id AND ti.status != 'Devolvido'
                LEFT JOIN tool_history th ON e.id = th.employee_id
                LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id
                LEFT JOIN companies emp ON ev.employer_id = emp.id
                LEFT JOIN companies wp ON ev.workplace_id = wp.id
                WHERE e.id = $1
            `, [employeeId]);
            
            console.log(`📊 Dossier registros: ${dossierData.rows.length}`);
            
            if (dossierData.rows.length > 0) {
                const data = dossierData.rows[0];
                
                // Tentar serializar para JSON
                const jsonString = JSON.stringify(data);
                console.log(`📏 JSON size: ${jsonString.length} bytes`);
                
                // Verificar primeiros caracteres
                const first20 = jsonString.substring(0, 20);
                console.log(`🔍 Primeiros 20 chars: "${first20}"`);
                
                // Verificar se começa com {
                if (!jsonString.startsWith('{')) {
                    console.log('❌ JSON não começa com {');
                    console.log('Primeiro caractere:', jsonString.charCodeAt(0));
                } else {
                    console.log('✅ JSON começa corretamente com {');
                }
                
                // Tentar parsear (teste de sanidade)
                try {
                    JSON.parse(jsonString);
                    console.log('✅ JSON parseado com sucesso');
                } catch (parseError) {
                    console.log('❌ Erro ao parsear JSON:', parseError.message);
                    console.log('Posição:', parseError.message.match(/position (\d+)/)?.[1]);
                }
            }
            
        } catch (dossierError) {
            console.error('❌ Erro ao buscar dossier:', dossierError.message);
        }
        
        // 5. Verificar se há problema de N+1 queries
        console.log('\n🔄 5. Verificando possível problema N+1...');
        
        // Contar queries que seriam executadas
        const queriesCount = await query(`
            SELECT 
                (SELECT COUNT(*) FROM employee_documents WHERE employee_id = $1) as docs,
                (SELECT COUNT(*) FROM employee_benefits WHERE employee_id = $1) as benefits,
                (SELECT COUNT(*) FROM employee_dependents WHERE employee_id = $1) as dependents,
                (SELECT COUNT(*) FROM employee_emergency_contacts WHERE employee_id = $1) as contacts,
                (SELECT COUNT(*) FROM vacation_records WHERE employee_id = $1) as vacations,
                (SELECT COUNT(*) FROM uniform_history WHERE employee_id = $1) as uniforms,
                (SELECT COUNT(*) FROM tool_items WHERE employee_id = $1) as tools,
                (SELECT COUNT(*) FROM tool_history WHERE employee_id = $1) as tool_history,
                (SELECT COUNT(*) FROM career_history WHERE employee_id = $1) as career,
                (SELECT COUNT(*) FROM employee_vinculos WHERE employee_id = $1) as vinculos
        `, [employeeId]);
        
        const totalQueries = Object.values(queriesCount.rows[0]).reduce((a, b) => a + b, 0);
        console.log(`📊 Total de queries que seriam executadas: ${totalQueries}`);
        
        if (totalQueries > 20) {
            console.log('⚠️ Possível problema N+1 detectado');
            console.log('💡 Recomendação: Usar JOINs ou carregar dados em lote');
        } else {
            console.log('✅ Número de queries parece normal');
        }
        
        console.log('\n🎉 Debug concluído!');
        
    } catch (error) {
        console.error('❌ Erro no debug:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        process.exit(0);
    }
}

debugSpecificEmployee();
