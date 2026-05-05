const db = require('./backend/config/database');

async function testEmptyDates() {
    try {
        const result = await db.query('SELECT "birthDate", "admissionDate", "terminationDate" FROM employees WHERE "birthDate" = \'\' OR "admissionDate" = \'\' OR "terminationDate" = \'\' LIMIT 5');
        console.log('Datas vazias encontradas:');
        result.rows.forEach(row => {
            console.log(`Birth: "${row.birthDate}", Admission: "${row.admissionDate}", Termination: "${row.terminationDate}"`);
        });
        
        const totalEmpty = await db.query('SELECT COUNT(*) as count FROM employees WHERE "birthDate" = \'\' OR "admissionDate" = \'\' OR "terminationDate" = \'\'');
        console.log(`\nTotal de registros com datas vazias: ${totalEmpty.rows[0].count}`);
    } catch (error) {
        console.error('Erro:', error.message);
    }
}

testEmptyDates();
