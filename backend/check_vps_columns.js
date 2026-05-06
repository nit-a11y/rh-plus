const { query } = require('../config/database');

async function checkVPSColumns() {
    try {
        console.log('🔍 Verificando colunas da tabela employees na VPS...');
        
        const result = await query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'employees' 
            ORDER BY ordinal_position
        `);
        
        console.log('Colunas employees:', result.rows.map(c => c.column_name));
        
        // Verificar se há colunas que podem estar faltando
        const expectedColumns = [
            'id', 'name', 'registrationNumber', 'role', 'sector', 'type', 'hierarchy',
            'admissionDate', 'birthDate', 'currentSalary', 'photoUrl',
            'street', 'city', 'neighborhood', 'state_uf', 'cep',
            'employer_id', 'workplace_id', 'fatherName', 'motherName', 'gender',
            'maritalStatus', 'ethnicity', 'educationLevel', 'placeOfBirth',
            'personalEmail', 'personalPhone', 'work_schedule', 'work_scale', 'cbo',
            'initialRole', 'initialSalary', 'observation', 'cpf',
            'terminationReason', 'terminationDate'
        ];
        
        const existingColumns = result.rows.map(c => c.column_name);
        const missingColumns = expectedColumns.filter(col => !existingColumns.includes(col));
        
        if (missingColumns.length > 0) {
            console.log('❌ Colunas faltando:', missingColumns);
        } else {
            console.log('✅ Todas as colunas esperadas existem');
        }
        
    } catch (error) {
        console.error('Erro:', error.message);
    }
}

checkVPSColumns();
