const { query } = require('./config/database');

async function deleteEmployee(employeeId) {
    try {
        console.log(`=== EXCLUINDO COLABORADOR ${employeeId} ===`);
        
        // 1. Excluir vínculo
        console.log('1. Excluindo vínculo...');
        const vinculoResult = await query('DELETE FROM employee_vinculos WHERE employee_id = $1', [employeeId]);
        console.log(`   Vínculos excluídos: ${vinculoResult.rowCount}`);
        
        // 2. Excluir colaborador
        console.log('2. Excluindo colaborador...');
        const employeeResult = await query('DELETE FROM employees WHERE id = $1', [employeeId]);
        console.log(`   Colaborador excluído: ${employeeResult.rowCount}`);
        
        // 3. Verificar exclusão
        console.log('3. Verificando exclusão...');
        const check = await query('SELECT * FROM employees WHERE id = $1', [employeeId]);
        
        if (check.rows.length === 0) {
            console.log('Colaborador excluído com sucesso!');
        } else {
            console.log('Erro: colaborador ainda existe');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Erro:', error.message);
        process.exit(1);
    }
}

deleteEmployee('7029acdd');
