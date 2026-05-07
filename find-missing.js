const { query } = require('./backend/config/database');
async function test() {
    try {
        const r = await query(`SELECT name, "admissionDate", workplace_id, type FROM employees WHERE "admissionDate" < '2025-01-31' AND (workplace_id = 'u4' OR workplace_id IS NULL)`);
        console.log(JSON.stringify(r.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
test();
