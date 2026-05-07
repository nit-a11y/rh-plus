const { query } = require('./backend/config/database');
async function test() {
    try {
        const r = await query('SELECT "admissionDate", name FROM employees ORDER BY "admissionDate" ASC LIMIT 20');
        console.log(JSON.stringify(r.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
test();
