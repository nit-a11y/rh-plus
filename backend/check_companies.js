const { query } = require('./config/database');

async function checkCompanies() {
    try {
        console.log('=== VERIFICANDO EMPLOYERS DISPONÍVEIS ===');
        
        const employers = await query('SELECT * FROM companies WHERE type = \'employer\' ORDER BY name');
        console.log('Employers disponíveis:');
        employers.rows.forEach(row => console.log(`ID: ${row.id}, Nome: ${row.name}`));
        
        console.log('\n=== VERIFICANDO WORKPLACES DISPONÍVEIS ===');
        const workplaces = await query('SELECT * FROM companies WHERE type = \'workplace\' ORDER BY name');
        console.log('Workplaces disponíveis:');
        workplaces.rows.forEach(row => console.log(`ID: ${row.id}, Nome: ${row.name}`));
        
        process.exit(0);
    } catch (error) {
        console.error('Erro:', error.message);
        process.exit(1);
    }
}

checkCompanies();
