const { query } = require('./backend/config/database');
async function test() {
    try {
        const r = await query("SELECT column_name FROM information_schema.columns WHERE table_name = 'employee_archive'");
        console.log(r.rows.map(c => c.column_name));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
test();
