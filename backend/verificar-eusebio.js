const { query } = require('./config/database');

async function verificarDadosEusebio() {
    try {
        const sql = `
            SELECT 
                e.id,
                e.name,
                e.admissionDate,
                e.terminationDate,
                e.type,
                c.name as unidade
            FROM employees e
            INNER JOIN companies c ON e.workplace_id = c.id
            WHERE 
                c.name = 'NORDESTE LOCAÇÕES - EUSÉBIO'
                AND c.name IS NOT NULL 
                AND c.name != ''
            ORDER BY e.admissionDate
        `;
        
        const result = await query(sql);
        console.log('📋 Dados brutos employees - Eusébio:');
        console.log('Total:', result.rows.length);
        console.log('Ativos (type != Desligado):', result.rows.filter(e => e.type !== 'Desligado').length);
        console.log('Com admissionDate:', result.rows.filter(e => e.admissionDate).length);
        console.log('Primeiros 5:');
        result.rows.slice(0, 5).forEach((emp, i) => {
            console.log(`  ${i+1}. ${emp.name} - ${emp.admissionDate} - ${emp.terminationDate} - ${emp.type}`);
        });
        
    } catch (error) {
        console.error('Erro:', error);
    }
}

verificarDadosEusebio();
