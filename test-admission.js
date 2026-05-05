const db = require('./backend/config/database');

async function testAdmission() {
    try {
        const result = await db.query('SELECT "admissionDate", "terminationDate" FROM employees LIMIT 5');
        console.log('Datas:');
        result.rows.forEach(row => {
            console.log(`Admission: ${row.admissionDate}, Termination: ${row.terminationDate}`);
        });
    } catch (error) {
        console.error('Erro:', error.message);
    }
}

testAdmission();
