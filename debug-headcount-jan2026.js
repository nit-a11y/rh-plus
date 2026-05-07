const { query } = require('./backend/config/database');
async function test() {
    try {
        const startDate = '2026-01-01';
        const endDate = '2026-01-31';
        const unitId = 'u4'; // Eusébio
        const sql = `
            SELECT name, "admissionDate", "terminationDate", type
            FROM employees 
            WHERE workplace_id = $1
              AND ("admissionDate" IS NOT NULL AND "admissionDate" != '' AND "admissionDate" <= $3)
              AND ("terminationDate" IS NULL OR "terminationDate" = '' OR "terminationDate" >= $2)
        `;
        const r = await query(sql, [unitId, startDate, endDate]);
        console.log(`Active employees in Eusébio in Jan 2026 (${r.rows.length}):`);
        console.log(JSON.stringify(r.rows, null, 2));

        // Let's also check if there are people with NULL workplace_id who might be in Eusébio
        const r2 = await query(`SELECT name, "admissionDate", "terminationDate", workplace_id FROM employees WHERE ("admissionDate" <= $2) AND ("terminationDate" IS NULL OR "terminationDate" = '' OR "terminationDate" >= $1) AND workplace_id IS NULL`, [startDate, endDate]);
        console.log(`\nActive employees with NULL workplace_id in Jan 2026 (${r2.rows.length}):`);
        console.log(JSON.stringify(r2.rows, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
test();
