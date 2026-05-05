const db = require('./backend/config/database');

async function testBirthDate() {
    try {
        const result = await db.query('SELECT "birthDate" FROM employees LIMIT 5');
        console.log('Dados de birthDate:');
        result.rows.forEach(row => {
            console.log(row.birthDate);
        });
    } catch (error) {
        console.error('Erro:', error.message);
    }
}

testBirthDate();
