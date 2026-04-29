const { query } = require('./config/database');

async function testColaboradoresPorUnidade() {
    try {
        console.log('=== TESTE: COLABORADORES POR UNIDADE ===');
        
        // 1. Total de colaboradores na tabela
        const totalColaboradores = await query('SELECT COUNT(*) as total FROM employees');
        console.log('Total geral de colaboradores:', totalColaboradores.rows[0].total);
        
        // 2. Colaboradores por unidade (todos que já passaram)
        const sqlUnidades = `
            SELECT 
                c.name as unidade,
                COUNT(e.id) as total_colaboradores
            FROM employees e
            INNER JOIN companies c ON e.workplace_id = c.id
            WHERE 
                c.name IS NOT NULL 
                AND c.name != ''
            GROUP BY c.name
            ORDER BY total_colaboradores DESC
        `;
        
        const resultadoUnidades = await query(sqlUnidades);
        
        console.log('\n=== COLABORADORES POR UNIDADE (TODOS QUE JÁ PASSARAM) ===');
        resultadoUnidades.rows.forEach(row => {
            console.log(`${row.unidade}: ${row.total_colaboradores} colaboradores`);
        });
        
        // 3. Detalhe da unidade EUSÉBIO
        const sqlEusebio = `
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
        
        const resultadoEusebio = await query(sqlEusebio);
        
        console.log('\n=== DETALHES EUSÉBIO ===');
        console.log(`Total bruto: ${resultadoEusebio.rows.length} colaboradores`);
        
        resultadoEusebio.rows.forEach(emp => {
            console.log(`ID: ${emp.id} | Nome: ${emp.name} | Admissão: ${emp.admissionDate} | Desligamento: ${emp.terminationDate} | Tipo: ${emp.type || 'NULL'}`);
        });
        
        // 4. Teste específico para JANEIRO 2026
        console.log('\n=== TESTE JANEIRO 2026 ===');
        const periodoInicio = '2026-01-01';
        const periodoFim = '2026-01-31';
        
        const ativosJaneiro = resultadoEusebio.rows.filter(emp => {
            const admissionOk = !emp.admissionDate || emp.admissionDate <= periodoFim;
            const terminationOk = !emp.terminationDate || 
                                 emp.terminationDate === '' || 
                                 emp.terminationDate >= periodoInicio;
            
            return admissionOk && terminationOk;
        });
        
        console.log(`Ativos em JANEIRO 2026: ${ativosJaneiro.length} colaboradores`);
        console.log('Esperado: 7 colaboradores');
        console.log('Diferença:', ativosJaneiro.length - 7);
        
        if (ativosJaneiro.length > 0) {
            console.log('\nColaboradores ATIVOS em JANEIRO 2026:');
            ativosJaneiro.forEach(emp => {
                console.log(`ID: ${emp.id} | Nome: ${emp.name} | Admissão: ${emp.admissionDate} | Desligamento: ${emp.terminationDate}`);
            });
        }
        
    } catch (error) {
        console.error('Erro no teste:', error);
    }
}

testColaboradoresPorUnidade();
