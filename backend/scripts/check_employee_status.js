const { query } = require('../config/database');

async function checkEmployeeStatus() {
    try {
        console.log('🔍 Verificando status do colaborador 3cdfbfa2...');
        
        const employeeId = '3cdfbfa2';
        
        // 1. Verificar se employee existe
        console.log('\n📋 1. Verificando existência...');
        const employeeCheck = await query(`
            SELECT id, name, "registrationNumber", status 
            FROM employees 
            WHERE id = $1
        `, [employeeId]);
        
        if (employeeCheck.rows.length === 0) {
            console.log('❌ Colaborador NÃO existe mais');
            return;
        }
        
        const employee = employeeCheck.rows[0];
        console.log('✅ Colaborador encontrado:');
        console.log(`  ID: ${employee.id}`);
        console.log(`  Nome: ${employee.name}`);
        console.log(`  Matrícula: ${employee.registrationNumber}`);
        console.log(`  Status: ${employee.status || 'N/A'}`);
        
        // 2. Verificar vínculos
        console.log('\n📋 2. Verificando vínculos...');
        const vinculosCheck = await query(`
            SELECT id, employer_id, workplace_id, status, data_inicio, data_fim, principal, tipo_evento
            FROM employee_vinculos 
            WHERE employee_id = $1 
            ORDER BY data_inicio DESC
        `, [employeeId]);
        
        console.log(`📊 Total de vínculos: ${vinculosCheck.rows.length}`);
        vinculosCheck.rows.forEach((v, index) => {
            console.log(`\n  Vínculo ${index + 1}:`);
            console.log(`    ID: ${v.id}`);
            console.log(`    Employer: ${v.employer_id}`);
            console.log(`    Workplace: ${v.workplace_id}`);
            console.log(`    Status: ${v.status}`);
            console.log(`    Período: ${v.data_inicio} até ${v.data_fim || 'ATUAL'}`);
            console.log(`    Principal: ${v.principal}`);
            console.log(`    Tipo Evento: ${v.tipo_evento}`);
        });
        
        // 3. Verificar se há transferências
        console.log('\n📋 3. Verificando transferências...');
        const transfersCheck = await query(`
            SELECT * FROM employee_vinculo_transfers 
            WHERE employee_id = $1 
            ORDER BY created_at DESC
        `, [employeeId]);
        
        console.log(`📊 Total de transferências: ${transfersCheck.rows.length}`);
        transfersCheck.rows.forEach((t, index) => {
            console.log(`\n  Transferência ${index + 1}:`);
            console.log(`    ID: ${t.id}`);
            console.log(`    De: ${t.from_employer_id} / ${t.from_workplace_id}`);
            console.log(`    Para: ${t.to_employer_id} / ${t.to_workplace_id}`);
            console.log(`    Data: ${t.created_at}`);
            console.log(`    Responsável: ${t.changed_by}`);
        });
        
        // 4. Verificar career history
        console.log('\n📋 4. Verificando career history...');
        const careerCheck = await query(`
            SELECT * FROM career_history 
            WHERE employee_id = $1 
            ORDER BY date DESC
        `, [employeeId]);
        
        console.log(`📊 Total de eventos: ${careerCheck.rows.length}`);
        careerCheck.rows.forEach((c, index) => {
            console.log(`\n  Evento ${index + 1}:`);
            console.log(`    Data: ${c.date}`);
            console.log(`    Tipo: ${c.move_type}`);
            console.log(`    Cargo: ${c.role}`);
            console.log(`    Setor: ${c.sector}`);
            console.log(`    Salário: ${c.salary}`);
        });
        
        console.log('\n🎉 Verificação concluída!');
        console.log('✅ Colaborador está OK e acessível');
        
    } catch (error) {
        console.error('❌ Erro na verificação:', error.message);
    } finally {
        process.exit(0);
    }
}

checkEmployeeStatus();
