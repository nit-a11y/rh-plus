const { query } = require('./config/database');

async function checkIDs() {
    try {
        const result = await query('SELECT id, name FROM employees ORDER BY id LIMIT 10');
        console.log('Primeiros 10 IDs de colaboradores:');
        result.rows.forEach((emp, i) => {
            console.log(`${i + 1}. ID: ${emp.id} - Nome: ${emp.name}`);
        });
        
        // Verificar formato dos IDs
        console.log('\nFormato dos IDs:');
        result.rows.forEach(emp => {
            console.log(`ID: ${emp.id} (tamanho: ${emp.id.length})`);
        });
        
    } catch (error) {
        console.error('Erro:', error.message);
    }
}

checkIDs();
