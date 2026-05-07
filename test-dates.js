const { query } = require('./backend/config/database');
async function test() {
    try {
        const r = await query('SELECT "admissionDate", "terminationDate", name FROM employees WHERE "admissionDate" IS NOT NULL LIMIT 10');
        console.log(JSON.stringify(r.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
test();
