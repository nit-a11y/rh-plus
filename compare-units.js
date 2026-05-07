const { query } = require('./backend/config/database');
async function compare() {
    try {
        console.log('--- CONTAGEM GERAL DE COLABORADORES POR UNIDADE (TODOS OS TEMPOS) ---');
        
        const sql = `
            SELECT 
                c.name as unit_name,
                COUNT(*) as total,
                COUNT(CASE WHEN e.type != 'Desligado' THEN 1 END) as ativos_atualmente,
                COUNT(CASE WHEN e.type = 'Desligado' THEN 1 END) as desligados_atualmente
            FROM employees e
            JOIN companies c ON e.workplace_id = c.id
            GROUP BY c.name
            ORDER BY c.name
        `;
        
        const r = await query(sql);
        console.table(r.rows);

        console.log('\n--- DETALHAMENTO DE COLABORADORES POR UNIDADE ---');
        
        const sqlDetail = `
            SELECT 
                c.name as unit_name,
                e.name as employee_name,
                e.type as status_atual,
                e."admissionDate",
                e."terminationDate"
            FROM employees e
            JOIN companies c ON e.workplace_id = c.id
            ORDER BY c.name, e.name
        `;
        
        const rDetail = await query(sqlDetail);
        
        let currentUnit = '';
        rDetail.rows.forEach(row => {
            if (row.unit_name !== currentUnit) {
                currentUnit = row.unit_name;
                console.log(`\n📍 UNIDADE: ${currentUnit}`);
            }
            console.log(`   - [${row.status_atual.padEnd(10)}] ${row.employee_name.padEnd(40)} | Entr: ${row.admissionDate || 'N/A'} | Saída: ${row.terminationDate || 'N/A'}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
compare();
