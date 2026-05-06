const { query } = require('./config/database');

async function checkRelation() {
    try {
        const result = await query(`
            SELECT ev.employee_id, ev.id as vinculo_id, e.name 
            FROM employee_vinculos ev 
            JOIN employees e ON ev.employee_id = e.id 
            WHERE ev.id = '0f1220eac25d2c3e'
        `);
        
        console.log('Relação ID vínculo x employee:');
        console.log('Resultado:', result.rows);
        
        // Verificar qual ID aparece na listagem
        const listResult = await query(`
            SELECT ev.id, ev.employee_id, e.name, e.type
            FROM employee_vinculos ev
            JOIN employees e ON ev.employee_id = e.id
            WHERE ev.id = '0f1220eac25d2c3e'
            ORDER BY ev.created_at DESC
        `);
        
        console.log('\nIDs que aparecem na listagem:');
        console.log('Resultado:', listResult.rows);
        
    } catch (error) {
        console.error('Erro:', error.message);
    }
}

checkRelation();
