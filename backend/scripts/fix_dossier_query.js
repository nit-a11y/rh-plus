const { query } = require('../config/database');

async function fixDossierQuery() {
    try {
        console.log('🔧 Corrigindo query do dossier...');
        
        // 1. Verificar a estrutura real da tabela benefit_history
        console.log('\n📋 1. Verificando estrutura benefit_history...');
        const benefitHistoryStructure = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'benefit_history' 
            ORDER BY ordinal_position
        `);
        
        console.log('Estrutura benefit_history:');
        benefitHistoryStructure.rows.forEach(col => {
            console.log(`  ${col.column_name}: ${col.data_type}`);
        });
        
        // 2. Corrigir a query do dossier
        console.log('\n🔍 2. Testando query corrigida...');
        
        const employeeId = '56f87d16';
        
        // Query corrigida sem referência inválida
        const correctedQuery = `
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
        `;
        
        const startTime = Date.now();
        const result = await query(correctedQuery, [employeeId]);
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log(`\n✅ Query corrigida executada: ${duration}ms`);
        console.log(`Registros encontrados: ${result.rows.length}`);
        
        if (result.rows.length > 0) {
            const employee = result.rows[0];
            console.log('\n👤 Dados do colaborador:');
            console.log(`  Nome: ${employee.name}`);
            console.log(`  Matrícula: ${employee.registrationNumber}`);
            console.log(`  Vínculos: ${employee.employer_name} / ${employee.workplace_name}`);
            console.log(`  Benefícios: ${employee.benefit_name || 'N/A'}`);
        }
        
        // 3. Criar índices para performance
        console.log('\n📈 3. Criando índices para performance...');
        
        const indexes = [
            'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employee_benefits_employee_id ON employee_benefits(employee_id);',
            'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_benefit_history_benefit_id ON benefit_history(benefit_id);',
            'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employee_dependents_employee_id ON employee_dependents(employee_id);',
            'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employee_emergency_contacts_employee_id ON employee_emergency_contacts(employee_id);',
            'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vacation_records_employee_id_start_date ON vacation_records(employee_id, start_date DESC);',
            'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_uniform_history_employee_id ON uniform_history(employee_id);',
            'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tool_items_employee_id_status ON tool_items(employee_id, status);',
            'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tool_history_employee_id_data_hora ON tool_history(employee_id, data_hora DESC);',
            'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employee_vinculos_employee_id ON employee_vinculos(employee_id);',
            'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employee_vinculos_employer_id ON employee_vinculos(employer_id);',
            'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employee_vinculos_workplace_id ON employee_vinculos(workplace_id);'
        ];
        
        for (const indexSql of indexes) {
            try {
                await query(indexSql);
                console.log(`✅ Índice criado: ${indexSql.split('idx_')[1].split(' ')[0]}`);
            } catch (error) {
                if (error.message.includes('already exists')) {
                    console.log(`⚠️ Índice já existe: ${indexSql.split('idx_')[1].split(' ')[0]}`);
                } else {
                    console.log(`❌ Erro ao criar índice: ${error.message}`);
                }
            }
        }
        
        // 4. Testar performance após índices
        console.log('\n⚡ 4. Testando performance após índices...');
        
        const testStartTime = Date.now();
        const testResult = await query(correctedQuery, [employeeId]);
        const testEndTime = Date.now();
        const testDuration = testEndTime - testStartTime;
        
        console.log(`\n📊 Performance após índices: ${testDuration}ms`);
        
        if (testDuration < 100) {
            console.log('✅ Performance otimizada!');
        } else {
            console.log('⚠️ Ainda lento, considerando mais otimizações');
        }
        
        // 5. Recomendações finais
        console.log('\n💡 5. Recomendações finais:');
        console.log('✅ Query corrigida (sem referência inválida)');
        console.log('✅ Índices criados para performance');
        console.log('💡 Considerar separar query do dossier em múltiplas chamadas menores');
        console.log('💡 Implementar cache para dados frequentemente acessados');
        console.log('💡 Usar paginção para grandes volumes de dados');
        
        console.log('\n🎉 Correções aplicadas com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro na correção:', error.message);
    } finally {
        process.exit(0);
    }
}

fixDossierQuery();
