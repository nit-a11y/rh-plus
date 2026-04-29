const { query } = require('./config/database');

async function checkAllCompanies() {
    try {
        console.log('=== VERIFICANDO TODAS AS COMPANIES ===');
        
        const companies = await query('SELECT * FROM companies ORDER BY name');
        console.log('Todas as companies:');
        companies.rows.forEach(row => console.log(`ID: ${row.id}, Nome: ${row.name}, Type: ${row.type}`));
        
        process.exit(0);
    } catch (error) {
        console.error('Erro:', error.message);
        process.exit(1);
    }
}

checkAllCompanies();
