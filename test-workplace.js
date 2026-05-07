const { query } = require('./backend/config/database');
async function test() {
    try {
        const r = await query('SELECT e.name, e."admissionDate", c.name as workplace FROM employees e JOIN companies c ON e.workplace_id = c.id WHERE e."admissionDate" < \'2025-01-31\' LIMIT 10');
        console.log(JSON.stringify(r.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
test();
