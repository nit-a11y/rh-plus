const { query } = require('./config/database');

async function debugTipoColaborador() {
    try {
        console.log('=== DEBUG: TIPO DE COLABORADOR EUSÉBIO ===');
        
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
        
        const resultado = await query(sql);
        
        console.log('Total bruto:', resultado.rows.length);
        
        // Análise por tipo
        const porTipo = {};
        resultado.rows.forEach(emp => {
            const tipo = emp.type || 'NULL';
            if (!porTipo[tipo]) {
                porTipo[tipo] = [];
            }
            porTipo[tipo].push(emp);
        });
        
        console.log('\n=== ANÁLISE POR TIPO ===');
        Object.keys(porTipo).forEach(tipo => {
            console.log(`${tipo}: ${porTipo[tipo].length} colaboradores`);
        });
        
        // Teste 1: Lógica atual (API)
        const periodoInicio = '2026-01-01';
        const periodoFim = '2026-01-31';
        
        const logicaAtual = resultado.rows.filter(emp => {
            const admissionOk = !emp.admissionDate || emp.admissionDate <= periodoFim;
            const terminationOk = !emp.terminationDate || 
                                 emp.terminationDate === '' || 
                                 emp.terminationDate >= periodoInicio;
            
            return admissionOk && terminationOk;
        });
        
        console.log('\n=== LÓGICA ATUAL (API) ===');
        console.log('Ativos:', logicaAtual.length);
        
        // Teste 2: Excluindo tipo 'Desligado'
        const semDesligado = resultado.rows.filter(emp => {
            if (emp.type === 'Desligado') return false;
            
            const admissionOk = !emp.admissionDate || emp.admissionDate <= periodoFim;
            const terminationOk = !emp.terminationDate || 
                                 emp.terminationDate === '' || 
                                 emp.terminationDate >= periodoInicio;
            
            return admissionOk && terminationOk;
        });
        
        console.log('\n=== EXCLUINDO TIPO "DESLIGADO" ===');
        console.log('Ativos:', semDesligado.length);
        
        // Teste 3: Apenas tipo OP e ADM
        const apenasOpAdm = resultado.rows.filter(emp => {
            if (emp.type !== 'OP' && emp.type !== 'ADM') return false;
            
            const admissionOk = !emp.admissionDate || emp.admissionDate <= periodoFim;
            const terminationOk = !emp.terminationDate || 
                                 emp.terminationDate === '' || 
                                 emp.terminationDate >= periodoInicio;
            
            return admissionOk && terminationOk;
        });
        
        console.log('\n=== APENAS TIPO OP E ADM ===');
        console.log('Ativos:', apenasOpAdm.length);
        
        // Teste 4: Verificar os 7 esperados
        console.log('\n=== COLABORADORES TIPO OP E ADM ===');
        apenasOpAdm.forEach(emp => {
            console.log(`ID: ${emp.id} | Nome: ${emp.name} | Tipo: ${emp.type} | Admissão: ${emp.admissionDate}`);
        });
        
        // Verificar se tem admissionDate nulo
        const comAdmissaoNula = resultado.rows.filter(emp => !emp.admissionDate);
        console.log('\n=== COLABORADORES COM DATA DE ADMISSÃO NULA ===');
        console.log('Total:', comAdmissaoNula.length);
        comAdmissaoNula.forEach(emp => {
            console.log(`ID: ${emp.id} | Nome: ${emp.name} | Tipo: ${emp.type}`);
        });
        
    } catch (error) {
        console.error('Erro no debug:', error);
    }
}

debugTipoColaborador();
