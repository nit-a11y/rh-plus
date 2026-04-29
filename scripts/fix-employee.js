/**
 * 🔧 CORREÇÃO DE COLABORADOR ESPECÍFICO
 * ITHALO RAFAEL REGIS QUEIROZ CORDEIRO - ID: 28b8f043
 */

const { query } = require('../backend/config/database');

async function fixEmployee() {
    try {
        console.log('🔧 Corrigindo colaborador: ITHALO RAFAEL REGIS QUEIROZ CORDEIRO\n');
        
        const employeeId = '28b8f043';
        
        // 1. Verificar dados atuais
        const currentData = await query(`
            SELECT * FROM employees WHERE id = $1
        `, [employeeId]);
        
        if (currentData.rows.length === 0) {
            console.log('❌ Funcionário não encontrado');
            return;
        }
        
        const employee = currentData.rows[0];
        console.log('📋 DADOS ATUAIS:');
        console.log('─'.repeat(50));
        console.log(`• Nome: ${employee.name}`);
        console.log(`• Type: ${employee.type}`);
        console.log(`• Admissão: ${employee.admissionDate}`);
        console.log(`• Salário: ${employee.currentSalary}`);
        console.log(`• Termination Date: ${employee.terminationDate}`);
        console.log(`• Termination Reason: ${employee.terminationReason}`);
        
        // 2. Aplicar correções necessárias
        console.log('\n🔧 APLICANDO CORREÇÕES:');
        console.log('─'.repeat(50));
        
        const corrections = [];
        
        // Correção principal: mudar de "Desligado" para "OP"
        if (employee.type === 'Desligado') {
            corrections.push('type = \'OP\'');
            console.log('✅ Type: Desligado → OP');
        }
        
        // Limpar dados de desligamento se não houver data confirmada
        if (!employee.terminationDate && (employee.terminationReason || employee.type === 'Desligado')) {
            corrections.push('terminationReason = NULL');
            corrections.push('terminationDate = NULL');
            console.log('✅ Limpar dados de desligamento');
        }
        
        // Atualizar data de admissão se necessário
        const referenceAdmissionDate = '2025-08-04'; // Formatado para PostgreSQL
        if (employee.admissionDate !== referenceAdmissionDate) {
            corrections.push(`"admissionDate" = '${referenceAdmissionDate}'`);
            console.log(`✅ Admissão: ${employee.admissionDate} → ${referenceAdmissionDate}`);
        }
        
        if (corrections.length === 0) {
            console.log('✅ Nenhuma correção necessária');
            return;
        }
        
        // 3. Executar atualização
        const updateQuery = `
            UPDATE employees 
            SET ${corrections.join(', ')}
            WHERE id = $1
        `;
        
        console.log(`\n🔄 Executando UPDATE...`);
        await query(updateQuery, [employeeId]);
        
        // 4. Verificar resultado
        const updatedData = await query(`
            SELECT id, name, type, "admissionDate", currentSalary, terminationDate, terminationReason
            FROM employees WHERE id = $1
        `, [employeeId]);
        
        console.log('\n📋 DADOS ATUALIZADOS:');
        console.log('─'.repeat(50));
        const updated = updatedData.rows[0];
        console.log(`• ID: ${updated.id}`);
        console.log(`• Nome: ${updated.name}`);
        console.log(`• Type: ${updated.type}`);
        console.log(`• Admissão: ${updated.admissionDate}`);
        console.log(`• Salário: ${updated.currentSalary}`);
        console.log(`• Termination Date: ${updated.terminationDate}`);
        console.log(`• Termination Reason: ${updated.terminationReason}`);
        
        console.log('\n✅ Correção concluída com sucesso!');
        console.log('🎯 Funcionário agora está como OP (ativo)');
        
    } catch (error) {
        console.error('❌ Erro na correção:', error.message);
        throw error;
    }
}

// Executar correção
if (require.main === module) {
    fixEmployee()
        .then(() => {
            console.log('\n🎉 Processo finalizado!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Erro fatal:', error);
            process.exit(1);
        });
}

module.exports = { fixEmployee };
