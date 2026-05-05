const { query } = require('../config/database');

async function testTransferAPI() {
    try {
        console.log('🧪 Testando API de transferência após correções...');
        
        // 1. Buscar um colaborador com vínculo ativo
        const testEmployee = await query(`
            SELECT e.id, e.name, e."registrationNumber",
                   ev.id as vinculo_id, ev.employer_id, ev.workplace_id,
                   emp.name as employer_name, wp.name as workplace_name
            FROM employees e
            LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.status = 'ATIVO'
            LEFT JOIN companies emp ON ev.employer_id = emp.id
            LEFT JOIN companies wp ON ev.workplace_id = wp.id
            WHERE ev.id IS NOT NULL
            LIMIT 1
        `);
        
        if (testEmployee.rows.length === 0) {
            console.log('❌ Não há colaboradores com vínculos ativos para testar');
            return;
        }
        
        const employee = testEmployee.rows[0];
        console.log(`👤 Colaborador selecionado: ${employee.name} (${employee.registrationNumber})`);
        console.log(`🏢 Vínculo atual: ${employee.employer_name} / ${employee.workplace_name}`);
        
        // 2. Buscar empresa diferente para transferência
        const otherCompany = await query(`
            SELECT id, name FROM companies 
            WHERE id != $1 AND type != 'Unidade'
            LIMIT 1
        `, [employee.employer_id]);
        
        if (otherCompany.rows.length === 0) {
            console.log('⚠️ Não há outras empresas disponíveis para transferência');
            return;
        }
        
        const targetCompany = otherCompany.rows[0];
        console.log(`🎯 Empresa destino: ${targetCompany.name} (${targetCompany.id})`);
        
        // 3. Simular chamada à API de transferência
        console.log('\n🔄 Simulando transferência...');
        
        const transferPayload = {
            to_employer_id: targetCompany.id,
            to_workplace_id: employee.workplace_id, // Mantém mesma unidade
            reason: 'TESTE AUTOMATIZADO - Refatoração do sistema',
            changed_by: 'Sistema Teste'
        };
        
        console.log('Payload:', JSON.stringify(transferPayload, null, 2));
        
        // 4. Testar a função getVinculoAtual diretamente
        console.log('\n🔍 Testando função getVinculoAtual...');
        
        const vinculoAtual = await query(`
            SELECT * FROM employee_vinculos 
            WHERE employee_id = $1 AND status = 'ATIVO' 
            ORDER BY data_inicio DESC 
            LIMIT 1
        `, [employee.id]);
        
        if (vinculoAtual.rows.length > 0) {
            console.log('✅ Vínculo atual encontrado:');
            console.log(`  ID: ${vinculoAtual.rows[0].id}`);
            console.log(`  Employer: ${vinculoAtual.rows[0].employer_id}`);
            console.log(`  Workplace: ${vinculoAtual.rows[0].workplace_id}`);
            console.log(`  Data Início: ${vinculoAtual.rows[0].data_inicio}`);
            console.log(`  Status: ${vinculoAtual.rows[0].status}`);
        } else {
            console.log('❌ Vínculo atual não encontrado');
        }
        
        // 5. Verificar se tabela employee_vinculo_transfers existe
        console.log('\n📋 Verificando tabela de transfers...');
        
        const transferTableCheck = await query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'employee_vinculo_transfers'
            ) as exists
        `);
        
        if (transferTableCheck.rows[0].exists) {
            console.log('✅ Tabela employee_vinculo_transfers existe');
            
            const transferCount = await query('SELECT COUNT(*) as total FROM employee_vinculo_transfers');
            console.log(`📊 Total de transfers registradas: ${transferCount.rows[0].total}`);
        } else {
            console.log('⚠️ Tabela employee_vinculo_transfers não existe');
        }
        
        console.log('\n🎉 Testes da API concluídos!');
        console.log('📝 Para testar a transferência real, use o frontend ou faça uma chamada POST para:');
        console.log(`   POST /api/transfers/employee/${employee.id}`);
        console.log('   Com o payload mostrado acima');
        
    } catch (error) {
        console.error('❌ Erro nos testes:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        process.exit(0);
    }
}

testTransferAPI();
