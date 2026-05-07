const { query } = require('./backend/config/database');
async function test() {
    try {
        const r = await query('SELECT name, "admissionDate" FROM employees WHERE workplace_id IS NULL AND "admissionDate" < \'2025-01-31\'');
        console.log(JSON.stringify(r.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
test();
