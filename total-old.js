const { query } = require('./backend/config/database');
async function test() {
    try {
        const r = await query('SELECT COUNT(*) FROM employees WHERE "admissionDate" < \'2025-01-01\'');
        console.log('Total hired before 2025:', r.rows[0].count);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
test();
