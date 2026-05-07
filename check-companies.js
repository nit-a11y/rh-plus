const { query } = require('./backend/config/database');
async function test() {
    try {
        const r = await query("SELECT id, name FROM companies WHERE id IN ('u4', 'u3', 'edcfae9a', 'a92a33c7', 'c2')");
        console.log(JSON.stringify(r.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
test();
