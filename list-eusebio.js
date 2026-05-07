const { query } = require('./backend/config/database');
async function test() {
    try {
        const r = await query(`SELECT name, "admissionDate", workplace_id FROM employees WHERE workplace_id = 'u4' ORDER BY "admissionDate" ASC`);
        console.log(JSON.stringify(r.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
test();
