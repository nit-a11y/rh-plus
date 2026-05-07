const { query } = require('./backend/config/database');
async function test() {
    try {
        const year = '2025';
        const month = 'JANEIRO';
        const monthMap = {
            'JANEIRO': 1, 'FEVEREIRO': 2, 'MARCO': 3, 'MARÇO': 3, 'ABRIL': 4,
            'MAIO': 5, 'JUNHO': 6, 'JULHO': 7, 'AGOSTO': 8,
            'SETEMBRO': 9, 'OUTUBRO': 10, 'NOVEMBRO': 11, 'DEZEMBRO': 12
        };

        const monthNum = monthMap[month.toUpperCase()];
        const startDate = `${year}-${monthNum.toString().padStart(2, '0')}-01`;
        const lastDay = new Date(parseInt(year), monthNum, 0).getDate();
        const endDate = `${year}-${monthNum.toString().padStart(2, '0')}-${lastDay}`;

        console.log('startDate:', startDate);
        console.log('endDate:', endDate);

        const sql = `
            SELECT 
                c.name as unit_name,
                COUNT(DISTINCT e.id) as active_employees
            FROM employees e
            JOIN companies c ON e.workplace_id = c.id
            WHERE 
                -- Colaborador admitido antes ou durante o mês em questão
                (e."admissionDate" IS NOT NULL AND e."admissionDate" != '' AND e."admissionDate" <= $2)
                AND 
                -- Colaborador não demitido OU demitido após o início do mês em questão
                (e."terminationDate" IS NULL OR e."terminationDate" = '' OR e."terminationDate" >= $1)
            GROUP BY c.name
            ORDER BY c.name
        `;

        const result = await query(sql, [startDate, endDate]);
        console.log('Result:', result.rows);
    } catch (e) {
        console.error('Error:', e);
    } finally {
        process.exit();
    }
}
test();
