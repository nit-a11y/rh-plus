const { query } = require('../config/database');

async function analyzePerformance() {
    try {
        console.log('🔍 Analisando performance das queries do dossier...');
        
        // 1. Analisar estrutura das tabelas envolvidas no dossier
        console.log('\n📋 1. Analisando estrutura das tabelas...');
        
        const tables = [
            'employees',
            'employee_documents', 
            'employee_benefits',
            'benefit_history',
            'employee_dependents',
            'employee_emergency_contacts',
            'vacation_records',
            'uniform_history',
            'tool_items',
            'tool_history',
            'employee_vinculos',
            'companies'
        ];
        
        for (const table of tables) {
            const structure = await query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = $1 
                ORDER BY ordinal_position
            `, [table]);
            
            const count = await query(`SELECT COUNT(*) as total FROM ${table}`);
            console.log(`\n📊 ${table}:`);
            console.log(`  Registros: ${count.rows[0].total}`);
            console.log(`  Colunas: ${structure.rows.length}`);
            
            // Verificar índices
            const indexes = await query(`
                SELECT indexname, indexdef 
                FROM pg_indexes 
                WHERE tablename = $1
            `, [table]);
            
            console.log(`  Índices: ${indexes.rows.length}`);
            if (indexes.rows.length === 0) {
                console.log(`  ⚠️ SEM ÍNDICES - PERFORMANCE AFETADA`);
            }
        }
        
        // 2. Analisar query específica do dossier
        console.log('\n🔍 2. Analisando query do dossier...');
        
        const employeeId = '56f87d16'; // ID que demorou 195ms
        
        console.log(`Testando com employee_id: ${employeeId}`);
        
        // Medir tempo de cada query individualmente
        const queries = [
            {
                name: 'employee_documents',
                sql: 'SELECT * FROM employee_documents WHERE employee_id = $1',
                params: [employeeId]
            },
            {
                name: 'employee_benefits + benefit_history',
                sql: `
                    SELECT b.*, h.benefit_name 
                    FROM employee_benefits b
                    LEFT JOIN benefit_history h ON b.id = h.benefit_id
                    WHERE b.employee_id = $1
                `,
                params: [employeeId]
            },
            {
                name: 'employee_dependents',
                sql: 'SELECT * FROM employee_dependents WHERE employee_id = $1',
                params: [employeeId]
            },
            {
                name: 'employee_emergency_contacts',
                sql: 'SELECT * FROM employee_emergency_contacts WHERE employee_id = $1',
                params: [employeeId]
            },
            {
                name: 'vacation_records',
                sql: 'SELECT * FROM vacation_records WHERE employee_id = $1 ORDER BY start_date DESC',
                params: [employeeId]
            },
            {
                name: 'uniform_history',
                sql: 'SELECT * FROM uniform_history WHERE employee_id = $1',
                params: [employeeId]
            },
            {
                name: 'tool_items',
                sql: 'SELECT * FROM tool_items WHERE employee_id = $1 AND status != \'Devolvido\'',
                params: [employeeId]
            },
            {
                name: 'tool_history',
                sql: 'SELECT * FROM tool_history WHERE employee_id = $1 ORDER BY data_hora DESC',
                params: [employeeId]
            },
            {
                name: 'employee_vinculos + companies',
                sql: `
                    SELECT ev.*, emp.name as employer_name, emp.cnpj as employer_cnpj, 
                           wp.name as workplace_name, wp.cnpj as workplace_cnpj
                    FROM employee_vinculos ev
                    LEFT JOIN companies emp ON ev.employer_id = emp.id
                    LEFT JOIN companies wp ON ev.workplace_id = wp.id
                    WHERE ev.employee_id = $1
                    ORDER BY ev.principal DESC
                `,
                params: [employeeId]
            }
        ];
        
        for (const queryTest of queries) {
            const startTime = Date.now();
            const result = await query(queryTest.sql, queryTest.params);
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            console.log(`\n⏱️ ${queryTest.name}: ${duration}ms (${result.rows.length} registros)`);
            
            if (duration > 50) {
                console.log(`  ⚠️ LENTO - Acima de 50ms`);
                
                // Sugerir otimização
                if (queryTest.name.includes('companies') && !queryTest.sql.includes('INDEX')) {
                    console.log(`  💡 Sugestão: Adicionar índice em employee_vinculos(employer_id, workplace_id)`);
                }
                
                if (queryTest.name.includes('benefit_history') && !queryTest.sql.includes('INDEX')) {
                    console.log(`  💡 Sugestão: Adicionar índice em benefit_history(benefit_id)`);
                }
            }
        }
        
        // 3. Verificar queries lentas no log
        console.log('\n📈 3. Verificando padrões de performance...');
        
        // Comparar performance entre diferentes employees
        const testEmployees = ['3cdfbfa2', '56f87d16']; // Rápido vs Lento
        
        for (const empId of testEmployees) {
            console.log(`\n👤 Testando employee: ${empId}`);
            
            const startTime = Date.now();
            
            // Simular query completa do dossier
            const dossierResult = await query(`
                SELECT e.*, ed.*, eb.*, bh.benefit_name, 
                       edep.*, eec.*, vr.*, uh.*, ti.*, th.*,
                       ev.*, emp.name as employer_name, emp.cnpj as employer_cnpj,
                       wp.name as workplace_name, wp.cnpj as workplace_cnpj
                FROM employees e
                LEFT JOIN employee_documents ed ON e.id = ed.employee_id
                LEFT JOIN employee_benefits eb ON e.id = eb.employee_id
                LEFT JOIN benefit_history bh ON eb.id = bh.benefit_id
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
            `, [empId]);
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            console.log(`⏱️ Dossier completo: ${duration}ms`);
            
            if (duration > 100) {
                console.log(`  ⚠️ MUITO LENTO - Acima de 100ms`);
                console.log(`  💡 Problemas prováveis:`);
                console.log(`    - Muitos LEFT JOINs sem índices adequados`);
                console.log(`    - Falta de índices compostos`);
                console.log(`    - Queries N+1 sem otimização`);
            }
        }
        
        // 4. Recomendações de otimização
        console.log('\n💡 4. Recomendações de otimização:');
        
        console.log('\n🔧 Índices recomendados:');
        console.log('  CREATE INDEX CONCURRENTLY idx_employee_benefits_employee_id ON employee_benefits(employee_id);');
        console.log('  CREATE INDEX CONCURRENTLY idx_benefit_history_benefit_id ON benefit_history(benefit_id);');
        console.log('  CREATE INDEX CONCURRENTLY idx_employee_dependents_employee_id ON employee_dependents(employee_id);');
        console.log('  CREATE INDEX CONCURRENTLY idx_vacation_records_employee_id_start_date ON vacation_records(employee_id, start_date DESC);');
        console.log('  CREATE INDEX CONCURRENTLY idx_tool_items_employee_id_status ON tool_items(employee_id, status);');
        console.log('  CREATE INDEX CONCURRENTLY idx_tool_history_employee_id_data_hora ON tool_history(employee_id, data_hora DESC);');
        
        console.log('\n📝 Otimizações de query:');
        console.log('  - Usar EXISTS em vez de LEFT JOIN quando possível');
        console.log('  - Limitar colunas retornadas (SELECT * vs SELECT específicas)');
        console.log('  - Considerar cache para dados frequentemente acessados');
        console.log('  - Separar query do dossier em múltiplas chamadas menores');
        
        console.log('\n🎉 Análise de performance concluída!');
        
    } catch (error) {
        console.error('❌ Erro na análise:', error.message);
    } finally {
        process.exit(0);
    }
}

analyzePerformance();
