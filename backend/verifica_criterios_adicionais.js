const { query } = require('./config/database');

async function verificaCriteriosAdicionais() {
    try {
        console.log('=== VERIFICANDO CRITÉRIOS ADICIONAIS ===');
        
        // Buscar todos os OP e ADM de Eusébio
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
                AND e.type IN ('OP', 'ADM')
                AND e."admissionDate" <= '2026-01-31'
                AND (
                    e."terminationDate" IS NULL OR 
                    e."terminationDate" = '' OR 
                    e."terminationDate" >= '2026-01-01'
                )
            ORDER BY e."admissionDate"
        `;
        
        const resultado = await query(sql);
        
        console.log('Total encontrado:', resultado.rows.length);
        console.log('Esperado: 7');
        
        // Verificar critérios que poderiam excluir alguns colaboradores
        
        // 1. Verificar se algum foi admitido DEPOIS de 01/01/2026 (mas antes de 31/01/2026)
        const admitidosEmJaneiro = resultado.rows.filter(emp => 
            emp.admissionDate >= '2026-01-01' && emp.admissionDate <= '2026-01-31'
        );
        
        console.log('\n=== ADMITIDOS EM JANEIRO 2026 ===');
        console.log('Total:', admitidosEmJaneiro.length);
        admitidosEmJaneiro.forEach(emp => {
            console.log(`ID: ${emp.id} | Nome: ${emp.name} | Admissão: ${emp.admissionDate}`);
        });
        
        // 2. Verificar se algum tem data de admissão muito recente
        const admitidosRecentes = resultado.rows.filter(emp => 
            emp.admissionDate >= '2025-12-01'
        );
        
        console.log('\n=== ADMITIDOS RECENTES (DEZ/2025 em diante) ===');
        console.log('Total:', admitidosRecentes.length);
        admitidosRecentes.forEach(emp => {
            console.log(`ID: ${emp.id} | Nome: ${emp.name} | Admissão: ${emp.admissionDate}`);
        });
        
        // 3. Se considerarmos apenas quem foi admitido ANTES de 01/01/2026
        const admitidosAntesDeJaneiro = resultado.rows.filter(emp => 
            emp.admissionDate < '2026-01-01'
        );
        
        console.log('\n=== ADMITIDOS ANTES DE 01/01/2026 ===');
        console.log('Total:', admitidosAntesDeJaneiro.length);
        if (admitidosAntesDeJaneiro.length === 7) {
            console.log('*** ESTE PODE SER O CRITÉRIO CORRETO! ***');
            admitidosAntesDeJaneiro.forEach(emp => {
                console.log(`ID: ${emp.id} | Nome: ${emp.name} | Admissão: ${emp.admissionDate}`);
            });
        }
        
        // 4. Verificar se há algum campo adicional que possa indicar status
        console.log('\n=== VERIFICANDO CAMPOS ADICIONAIS ===');
        const sqlCampos = `
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'employees' 
            AND table_schema = 'public'
            ORDER BY column_name
        `;
        
        const campos = await query(sqlCampos);
        console.log('Colunas disponíveis na tabela employees:');
        campos.rows.forEach(col => {
            console.log(`- ${col.column_name} (${col.data_type})`);
        });
        
    } catch (error) {
        console.error('Erro na verificação:', error);
    }
}

verificaCriteriosAdicionais();
