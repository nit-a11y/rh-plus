const { query } = require('./backend/config/database');
async function test() {
    try {
        const names = ['JANDERSON', 'EDSLEY', 'CARLOS', 'EDILBERTO', 'GEOVANNA', 'ITHALO'];
        for (const name of names) {
            const r = await query(`SELECT name, "admissionDate", "terminationDate", workplace_id FROM employees WHERE name ILIKE $1`, [`%${name}%`]);
            console.log(`Results for ${name}:`, JSON.stringify(r.rows, null, 2));
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
test();
