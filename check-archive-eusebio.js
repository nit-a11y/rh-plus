const { query } = require('./backend/config/database');
async function test() {
    try {
        const r = await query('SELECT name, "admissionDate", "terminationDate", workplace_id FROM employee_archive WHERE workplace_id = \'u4\'');
        console.log(JSON.stringify(r.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
test();
