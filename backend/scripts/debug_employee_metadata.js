const { query } = require('../config/database');

async function debugEmployeeMetadata() {
    try {
        console.log('🔍 Debugando erro na rota /metadata...');
        
        const employeeId = '3cdfbfa2';
        console.log(`👤 Verificando employee_id: ${employeeId}`);
        
        // 1. Verificar se colaborador existe
        console.log('\n📋 1. Verificando existência do colaborador...');
        const employeeCheck = await query('SELECT id, name, "registrationNumber" FROM employees WHERE id = $1', [employeeId]);
        
        if (employeeCheck.rows.length === 0) {
            console.log('❌ Colaborador NÃO existe na tabela employees');
            return;
        }
        
        const employee = employeeCheck.rows[0];
        console.log('✅ Colaborador encontrado:');
        console.log(`  ID: ${employee.id}`);
        console.log(`  Nome: ${employee.name}`);
        console.log(`  Matrícula: ${employee.registrationNumber}`);
        
        // 2. Verificar vínculos do colaborador
        console.log('\n📋 2. Verificando vínculos do colaborador...');
        const vinculosCheck = await query(`
            SELECT * FROM employee_vinculos 
            WHERE employee_id = $1 
            ORDER BY data_inicio DESC
        `, [employeeId]);
        
        console.log(`📊 Total de vínculos: ${vinculosCheck.rows.length}`);
        vinculosCheck.rows.forEach((v, i) => {
            console.log(`  Vínculo ${i + 1}:`);
            console.log(`    ID: ${v.id}`);
            console.log(`    Employer: ${v.employer_id}`);
            console.log(`    Workplace: ${v.workplace_id}`);
            console.log(`    Status: ${v.status}`);
            console.log(`    Data Início: ${v.data_inicio}`);
            console.log(`    Data Fim: ${v.data_fim}`);
        });
        
        // 3. Verificar documentos do colaborador
        console.log('\n📋 3. Verificando documentos...');
        const docsCheck = await query('SELECT * FROM employee_documents WHERE employee_id = $1', [employeeId]);
        
        if (docsCheck.rows.length > 0) {
            console.log('✅ Documentos encontrados:');
            Object.keys(docsCheck.rows[0]).forEach(key => {
                if (docsCheck.rows[0][key] && key !== 'id' && key !== 'employee_id') {
                    console.log(`    ${key}: ${docsCheck.rows[0][key]}`);
                }
            });
        } else {
            console.log('⚠️ Nenhum documento encontrado');
        }
        
        // 4. Simular a lógica da rota metadata
        console.log('\n📋 4. Simulando lógica da rota metadata...');
        
        // Simular payload que viria do frontend
        const mockPayload = {
            emp: {
                name: employee.name,
                employer_id: employee.employer_id,
                workplace_id: employee.workplace_id,
                vinculos: vinculosCheck.rows.map(v => ({
                    employer_id: v.employer_id,
                    workplace_id: v.workplace_id,
                    principal: v.principal === 'S'
                }))
            },
            docs: docsCheck.rows[0] || {}
        };
        
        console.log('Payload simulado:');
        console.log(JSON.stringify(mockPayload, null, 2));
        
        // 5. Testar query de atualização
        console.log('\n📋 5. Testando query de atualização...');
        
        try {
            const testUpdate = await query(`
                UPDATE employees 
                SET name = $1, updated_at = CURRENT_TIMESTAMP 
                WHERE id = $2
                RETURNING id, name, updated_at
            `, [employee.name, employeeId]);
            
            console.log('✅ UPDATE testado com sucesso:');
            console.log(`  ID: ${testUpdate.rows[0].id}`);
            console.log(`  Nome: ${testUpdate.rows[0].name}`);
            console.log(`  Updated: ${testUpdate.rows[0].updated_at}`);
            
        } catch (updateError) {
            console.error('❌ Erro no UPDATE test:', updateError.message);
        }
        
        // 6. Verificar estrutura da tabela employee_documents
        console.log('\n📋 6. Verificando estrutura employee_documents...');
        const docsStructure = await query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'employee_documents' 
            ORDER BY ordinal_position
        `);
        
        console.log('Estrutura da tabela employee_documents:');
        docsStructure.rows.forEach(col => {
            console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
        });
        
        console.log('\n🎉 Debug concluído!');
        
    } catch (error) {
        console.error('❌ Erro no debug:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        process.exit(0);
    }
}

debugEmployeeMetadata();
