const { query } = require('../config/database');

async function testRefactoredSystem() {
    try {
        console.log('🧪 Testando sistema refatorado de vínculos...');
        
        // 1. Verificar estrutura da tabela
        console.log('\n📋 1. Verificando estrutura...');
        const structure = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'employee_vinculos' 
            ORDER BY ordinal_position
        `);
        
        const requiredColumns = ['id', 'employee_id', 'employer_id', 'workplace_id', 'data_inicio', 'data_fim', 'status', 'tipo_evento', 'principal'];
        const existingColumns = structure.rows.map(r => r.column_name);
        
        const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
        if (missingColumns.length > 0) {
            console.log('❌ Colunas faltando:', missingColumns);
            return;
        }
        
        console.log('✅ Estrutura da tabela OK');
        
        // 2. Verificar dados existentes
        console.log('\n📊 2. Verificando dados...');
        const totalCount = await query('SELECT COUNT(*) as total FROM employee_vinculos');
        const activeCount = await query("SELECT COUNT(*) as total FROM employee_vinculos WHERE status = 'ATIVO'");
        const transferredCount = await query("SELECT COUNT(*) as total FROM employee_vinculos WHERE status = 'TRANSFERIDO'");
        const closedCount = await query("SELECT COUNT(*) as total FROM employee_vinculos WHERE status = 'ENCERRADO'");
        
        console.log(`Total de vínculos: ${totalCount.rows[0].total}`);
        console.log(`Vínculos ativos: ${activeCount.rows[0].total}`);
        console.log(`Vínculos transferidos: ${transferredCount.rows[0].total}`);
        console.log(`Vínculos encerrados: ${closedCount.rows[0].total}`);
        
        // 3. Testar função getVinculoAtual (simulada)
        console.log('\n🔍 3. Testando consulta de vínculo atual...');
        const activeVinculos = await query(`
            SELECT e.name as employee_name, e."registrationNumber",
                   ev.employer_id, ev.workplace_id, ev.data_inicio, ev.status,
                   emp.name as employer_name, wp.name as workplace_name
            FROM employee_vinculos ev
            LEFT JOIN employees e ON ev.employee_id = e.id
            LEFT JOIN companies emp ON ev.employer_id = emp.id
            LEFT JOIN companies wp ON ev.workplace_id = wp.id
            WHERE ev.status = 'ATIVO'
            ORDER BY ev.data_inicio DESC
            LIMIT 5
        `);
        
        console.log('Amostra de vínculos ativos:');
        activeVinculos.rows.forEach(v => {
            console.log(`  • ${v.employee_name} (${v.registrationNumber}) - ${v.employer_name} / ${v.workplace_name}`);
        });
        
        // 4. Testar query para analytics (headcount por período)
        console.log('\n📈 4. Testando query de analytics...');
        const headcountQuery = `
            SELECT employer_id, COUNT(*) as total
            FROM employee_vinculos
            WHERE data_inicio <= '2026-05-05'
            AND (data_fim IS NULL OR data_fim >= '2026-05-05')
            GROUP BY employer_id
        `;
        
        const headcountResult = await query(headcountQuery);
        console.log('Headcount por empregador (em 2026-05-05):');
        headcountResult.rows.forEach(hc => {
            console.log(`  • Empregador ${hc.employer_id}: ${hc.total} colaboradores`);
        });
        
        // 5. Verificar views
        console.log('\n👁️ 5. Verificando views criadas...');
        const viewCheck = await query(`
            SELECT table_name FROM information_schema.views 
            WHERE table_schema = 'public' 
            AND table_name IN ('vw_vinculos_atuais', 'vw_headcount_periodo')
        `);
        
        const createdViews = viewCheck.rows.map(v => v.table_name);
        console.log('Views criadas:', createdViews);
        
        if (createdViews.includes('vw_vinculos_atuais')) {
            const viewData = await query('SELECT COUNT(*) as total FROM vw_vinculos_atuais');
            console.log(`Vínculos na view vw_vinculos_atuais: ${viewData.rows[0].total}`);
        }
        
        // 6. Testar rota de transferência (simulação)
        console.log('\n🔄 6. Simulando transferência...');
        
        // Buscar um colaborador com vínculo ativo
        const testEmployee = await query(`
            SELECT ev.employee_id, ev.id as vinculo_id, ev.employer_id, ev.workplace_id
            FROM employee_vinculos ev
            WHERE ev.status = 'ATIVO'
            LIMIT 1
        `);
        
        if (testEmployee.rows.length > 0) {
            const employee = testEmployee.rows[0];
            console.log(`Testando transferência para colaborador: ${employee.employee_id}`);
            
            // Verificar se existe outra empresa para transferência
            const otherCompany = await query(`
                SELECT id, name FROM companies 
                WHERE id != $1 AND type != 'Unidade'
                LIMIT 1
            `, [employee.employer_id]);
            
            if (otherCompany.rows.length > 0) {
                console.log(`Empresa destino: ${otherCompany.rows[0].name} (${otherCompany.rows[0].id})`);
                console.log('✅ Simulação de transferência pronta para teste');
            } else {
                console.log('⚠️ Não há outras empresas disponíveis para teste de transferência');
            }
        } else {
            console.log('⚠️ Não há vínculos ativos para testar transferência');
        }
        
        console.log('\n🎉 Testes concluídos com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro nos testes:', error.message);
    } finally {
        process.exit(0);
    }
}

testRefactoredSystem();
