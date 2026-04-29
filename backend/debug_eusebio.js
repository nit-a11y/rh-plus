const { query } = require('./config/database');

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
    ORDER BY e."admissionDate"
`;

query(sql).then(result => {
    const periodoInicio = '2026-01-01';
    const periodoFim = '2026-01-31';
    
    const colaboradoresAtivos = result.rows.filter(emp => {
        const admissionOk = !emp.admissionDate || emp.admissionDate <= periodoFim;
        const terminationOk = !emp.terminationDate || 
                             emp.terminationDate === '' || 
                             emp.terminationDate >= periodoInicio;
        
        return admissionOk && terminationOk;
    });
    
    console.log('=== DEBUG EUSÉBIO ===');
    console.log('Período: JANEIRO 2026');
    console.log('Total bruto:', result.rows.length);
    console.log('Total filtrado:', colaboradoresAtivos.length);
    console.log('Esperado: 7');
    console.log('Diferença:', colaboradoresAtivos.length - 7);
    console.log('');
    console.log('COLABORADORES ATIVOS:');
    colaboradoresAtivos.forEach(emp => {
        console.log(`ID: ${emp.id} | Nome: ${emp.name} | Admissão: ${emp.admissionDate} | Desligamento: ${emp.terminationDate}`);
    });
    
    console.log('');
    console.log('TODOS OS COLABORADORES:');
    result.rows.forEach(emp => {
        const ativo = (!emp.admissionDate || emp.admissionDate <= periodoFim) && 
                     (!emp.terminationDate || emp.terminationDate === '' || emp.terminationDate >= periodoInicio);
        console.log(`ID: ${emp.id} | Nome: ${emp.name} | Admissão: ${emp.admissionDate} | Desligamento: ${emp.terminationDate} | ATIVO: ${ativo ? 'SIM' : 'NÃO'}`);
    });
}).catch(console.error);
