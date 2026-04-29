const { query } = require('./config/database');

async function checkEmployee(employeeId) {
    try {
        console.log(`=== VERIFICANDO COLABORADOR ${employeeId} ===`);
        
        // Buscar dados do colaborador
        const employee = await query('SELECT * FROM employees WHERE id = $1', [employeeId]);
        
        if (employee.rows.length === 0) {
            console.log('Colaborador não encontrado');
            return;
        }
        
        console.log('Dados do colaborador:');
        console.log(employee.rows[0]);
        
        // Buscar vínculos
        const vinculos = await query(`
            SELECT ev.*, c.name as company_name 
            FROM employee_vinculos ev 
            LEFT JOIN companies c ON ev.workplace_id = c.id 
            WHERE ev.employee_id = $1
        `, [employeeId]);
        
        console.log('\nVínculos:');
        if (vinculos.rows.length > 0) {
            vinculos.rows.forEach(v => console.log(v));
        } else {
            console.log('Nenhum vínculo encontrado');
        }
        
        // Verificar horas extras
        const overtime = await query('SELECT COUNT(*) as total FROM overtime_records WHERE employee_id = $1', [employeeId]);
        console.log(`\nHoras extras registradas: ${overtime.rows[0].total}`);
        
        process.exit(0);
    } catch (error) {
        console.error('Erro:', error.message);
        process.exit(1);
    }
}

checkEmployee('7029acdd');
