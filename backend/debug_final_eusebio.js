const { query } = require('./config/database');

async function debugFinalEusebio() {
    try {
        console.log('=== DEBUG FINAL EUSÉBIO ===');
        
        const sql = `
            SELECT 
                e.id,
                e.name,
                e."admissionDate",
                e."terminationDate",
                e.type,
                c.name as unidade
            FROM employees e
            INNER JOIN companies c ON e.workplace_id = c.id
            WHERE 
                c.name = 'NORDESTE LOCAÇÕES - EUSÉBIO'
                AND c.name IS NOT NULL 
                AND c.name != ''
                AND e.type != 'Desligado'
                AND e."admissionDate" <= '2026-01-31'
                AND (
                    e."terminationDate" IS NULL OR 
                    e."terminationDate" = '' OR 
                    e."terminationDate" >= '2026-01-01'
                )
            ORDER BY e."admissionDate"
        `;
        
        const resultado = await query(sql);
        
        console.log('Total com filtro corrigido:', resultado.rows.length);
        console.log('Esperado: 7');
        console.log('Diferença:', resultado.rows.length - 7);
        
        console.log('\n=== COLABORADORES CONTADOS ===');
        resultado.rows.forEach((emp, index) => {
            console.log(`${index + 1}. ID: ${emp.id} | Nome: ${emp.name} | Tipo: ${emp.type} | Admissão: ${emp.admissionDate} | Desligamento: ${emp.terminationDate}`);
        });
        
        // Verificar se algum tem admissionDate > 2026-01-31
        const comAdmissaoDepois = resultado.rows.filter(emp => emp.admissionDate > '2026-01-31');
        if (comAdmissaoDepois.length > 0) {
            console.log('\n=== ADMITIDOS DEPOIS DE 31/01/2026 ===');
            comAdmissaoDepois.forEach(emp => {
                console.log(`ID: ${emp.id} | Nome: ${emp.name} | Admissão: ${emp.admissionDate}`);
            });
        }
        
        // Verificar se algum tem terminationDate < 2026-01-01
        const comDesligamentoAntes = resultado.rows.filter(emp => {
            return emp.terminationDate && emp.terminationDate < '2026-01-01';
        });
        
        if (comDesligamentoAntes.length > 0) {
            console.log('\n=== DESLIGADOS ANTES DE 01/01/2026 ===');
            comDesligamentoAntes.forEach(emp => {
                console.log(`ID: ${emp.id} | Nome: ${emp.name} | Desligamento: ${emp.terminationDate}`);
            });
        }
        
    } catch (error) {
        console.error('Erro no debug:', error);
    }
}

debugFinalEusebio();
