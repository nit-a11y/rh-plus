const { query } = require('./backend/config/database');
async function test() {
    try {
        const startDate = '2025-01-01';
        const endDate = '2025-01-31';
        const unitName = 'NORDESTE LOCAÇÕES - EUSÉBIO';
        const sql = `
            SELECT COUNT(e.id) as count
            FROM employees e
            JOIN companies c ON e.workplace_id = c.id
            WHERE c.name = $1
              AND (e."admissionDate" IS NOT NULL AND e."admissionDate" != '' AND e."admissionDate" <= $3)
              AND (e."terminationDate" IS NULL OR e."terminationDate" = '' OR e."terminationDate" >= $2)
        `;
        const r = await query(sql, [unitName, startDate, endDate]);
        console.log(`Headcount for ${unitName} in Jan 2025:`, r.rows[0].count);
        
        // Let's see who they are
        const sql2 = `
            SELECT e.name, e."admissionDate", e."terminationDate"
            FROM employees e
            JOIN companies c ON e.workplace_id = c.id
            WHERE c.name = $1
              AND (e."admissionDate" IS NOT NULL AND e."admissionDate" != '' AND e."admissionDate" <= $3)
              AND (e."terminationDate" IS NULL OR e."terminationDate" = '' OR e."terminationDate" >= $2)
        `;
        const r2 = await query(sql2, [unitName, startDate, endDate]);
        console.log('Employees:', r2.rows);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
test();
