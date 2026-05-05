const { query } = require('../config/database');

async function analyzeDatabaseStructure() {
    try {
        console.log('🔍 ANÁLISE COMPLETA DA ESTRUTURA DO BANCO DE DADOS...');
        
        // 1. Listar todas as tabelas
        console.log('\n📋 1. TODAS AS TABELAS:');
        const tablesResult = await query(`
            SELECT table_name, table_type 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        
        tablesResult.rows.forEach(table => {
            console.log(`   - ${table.table_name} (${table.table_type})`);
        });
        
        // 2. Estrutura detalhada das principais tabelas
        const mainTables = ['employees', 'employee_vinculos', 'employee_vinculo_transfers', 'companies', 'benefits_va'];
        
        for (const tableName of mainTables) {
            console.log(`\n📋 2. ESTRUTURA DA TABELA: ${tableName}`);
            console.log('─'.repeat(60));
            
            const structureResult = await query(`
                SELECT column_name, data_type, is_nullable, column_default, character_maximum_length
                FROM information_schema.columns
                WHERE table_name = $1
                ORDER BY ordinal_position
            `, [tableName]);
            
            structureResult.rows.forEach(col => {
                const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
                const defaultValue = col.column_default ? `DEFAULT ${col.column_default}` : '';
                const maxLength = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
                
                console.log(`   ${col.column_name.padEnd(25)} | ${col.data_type.padEnd(20)} ${maxLength.padEnd(8)} | ${nullable.padEnd(8)} | ${defaultValue.padEnd(15)}`);
            });
            
            console.log('─'.repeat(60));
        }
        
        // 3. Análise de relacionamentos
        console.log('\n📋 3. ANÁLISE DE RELACIONAMENTOS:');
        
        // 3.1. Employees x Employee_Vinculos
        console.log('\n📊 Employees ↔ Employee_Vinculos:');
        const vinculosAnalysis = await query(`
            SELECT 
                e.id as employee_id,
                e.name as employee_name,
                e.cpf,
                ev.id as vinculo_id,
                ev.employer_id,
                ev.workplace_id,
                ev.data_inicio,
                ev.data_fim,
                ev.tipo_vinculo,
                ev.sequencia,
                c1.name as company_name
            FROM employees e
            LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id
            LEFT JOIN companies c1 ON ev.employer_id = c1.id
            WHERE e.cpf IN (
                '605.584.543-13', '078.097.553-74', '067.170.173-84'
            )
            ORDER BY e.name, ev.sequencia
        `);
        
        console.table(vinculosAnalysis.rows);
        
        // 3.2. Employee_Vinculos x Employee_Vinculo_Transfers
        console.log('\n📊 Employee_Vinculos ↔ Employee_Vinculo_Transfers:');
        const transfersAnalysis = await query(`
            SELECT 
                ev.id as vinculo_id,
                ev.employee_id,
                ev.data_transferencia,
                evt.id as transfer_id,
                evt.from_employer_id,
                evt.to_employer_id,
                evt.changed_by,
                evt.observation,
                e.name as employee_name
            FROM employee_vinculos ev
            LEFT JOIN employee_vinculo_transfers evt ON ev.id = evt.employee_id AND ev.data_transferencia = evt.data_transferencia
            LEFT JOIN employees e ON ev.employee_id = e.id
            WHERE e.cpf IN (
                '605.584.543-13', '078.097.553-74'
            )
            ORDER BY e.name, ev.data_transferencia
        `);
        
        console.table(transfersAnalysis.rows);
        
        // 4. Contagem de registros
        console.log('\n📋 4. CONTAGEM DE REGISTROS:');
        
        const counts = {};
        
        // Contagem por tabela
        for (const tableName of mainTables) {
            const countResult = await query(`SELECT COUNT(*) as count FROM ${tableName}`);
            counts[tableName] = countResult.rows[0].count;
            console.log(`   ${tableName}: ${counts[tableName]} registros`);
        }
        
        // Contagem por tipo de vínculo
        const vinculosCount = await query(`
            SELECT 
                tipo_vinculo,
                COUNT(*) as count
            FROM employee_vinculos 
            GROUP BY tipo_vinculo
        `);
        
        console.log('\n📊 Vínculos por tipo:');
        vinculosCount.rows.forEach(row => {
            console.log(`   ${row.tipo_vinculo}: ${row.count}`);
        });
        
        // 5. Verificação de integridade
        console.log('\n📋 5. VERIFICAÇÃO DE INTEGRIDADE:');
        
        // 5.1. Employees sem vínculos
        const employeesSemVinculos = await query(`
            SELECT COUNT(*) as count
            FROM employees e
            LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id
            WHERE ev.id IS NULL
        `);
        
        console.log(`   Employees sem vínculos: ${employeesSemVinculos.rows[0].count}`);
        
        // 5.2. Vínculos sem employees
        const vinculosSemEmployees = await query(`
            SELECT COUNT(*) as count
            FROM employee_vinculos ev
            LEFT JOIN employees e ON ev.employee_id = e.id
            WHERE e.id IS NULL
        `);
        
        console.log(`   Vínculos sem employees: ${vinculosSemEmployees.rows[0].count}`);
        
        // 5.3. CPFs duplicados
        const cpfsDuplicados = await query(`
            SELECT cpf, COUNT(*) as count
            FROM employees
            GROUP BY cpf
            HAVING COUNT(*) > 1
        `);
        
        if (cpfsDuplicados.rows.length > 0) {
            console.log('\n⚠️ CPFs duplicados encontrados:');
            console.table(cpfsDuplicados.rows);
        }
        
        // 6. Resumo final
        console.log('\n📋 6. RESUMO FINAL:');
        console.log(`   Total de tabelas: ${tablesResult.rows.length}`);
        console.log(`   Total de employees: ${counts.employees || 0}`);
        console.log(`   Total de vínculos: ${counts.employee_vinculos || 0}`);
        console.log(`   Total de transferências: ${counts.employee_vinculo_transfers || 0}`);
        console.log(`   Total de companies: ${counts.companies || 0}`);
        console.log(`   Total de benefits_va: ${counts.benefits_va || 0}`);
        
    } catch (error) {
        console.error('❌ Erro na análise:', error.message);
    } finally {
        process.exit(0);
    }
}

analyzeDatabaseStructure();
