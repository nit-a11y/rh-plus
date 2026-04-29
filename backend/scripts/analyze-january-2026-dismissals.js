/**
 * Script para Analisar Desligamentos em Janeiro 2026 - Fortaleza
 */

const { query } = require('../config/database');

/**
 * Analisar desligamentos em janeiro 2026 na unidade Fortaleza
 */
async function analyzeJanuary2026Dismissals() {
    console.log('🔧 Analisando desligamentos em Janeiro 2026 - Fortaleza...\n');
    
    try {
        // 1. Verificar todos os desligamentos em janeiro 2026 na unidade
        console.log('1. Desligamentos em Janeiro 2026 - Fortaleza:');
        const dismissalsResult = await query(`
            SELECT e.name, e."admissionDate", e."terminationDate", e.type
            FROM employees e
            LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = '1'
            LEFT JOIN companies c ON ev.workplace_id = c.id
            WHERE c.name = $1
              AND e.type = 'Desligado'
              AND e."terminationDate" IS NOT NULL
              AND e."terminationDate" != ''
              AND e."terminationDate" >= $2
              AND e."terminationDate" <= $3
            ORDER BY e."terminationDate"
        `, ['NORDESTE LOCACOES - FORTALEZA', '2026-01-01', '2026-01-31']);
        
        console.log(`   Total de desligamentos: ${dismissalsResult.rows.length}`);
        dismissalsResult.rows.forEach(emp => {
            console.log(`   - ${emp.name}: ${emp.admissionDate} → ${emp.terminationDate}`);
        });
        
        // 2. Verificar colaboradores ativos no início de janeiro 2026
        console.log('\n2. Colaboradores ativos no início de Janeiro 2026:');
        const activeAtStart = await query(`
            SELECT e.name, e."admissionDate", e."terminationDate", e.type
            FROM employees e
            LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = '1'
            LEFT JOIN companies c ON ev.workplace_id = c.id
            WHERE c.name = $1
              AND (e."admissionDate" <= $2 OR e."admissionDate" IS NULL)
              AND (e.type IS NULL OR e.type != 'Desligado' OR 
                   e."terminationDate" IS NULL OR 
                   e."terminationDate" = '' OR 
                   e."terminationDate" > $2)
            ORDER BY e.name
        `, ['NORDESTE LOCACOES - FORTALEZA', '2026-01-01']);
        
        console.log(`   Total ativos em 01/01/2026: ${activeAtStart.rows.length}`);
        
        // 3. Verificar colaboradores ativos no final de janeiro 2026
        console.log('\n3. Colaboradores ativos no final de Janeiro 2026:');
        const activeAtEnd = await query(`
            SELECT e.name, e."admissionDate", e."terminationDate", e.type
            FROM employees e
            LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = '1'
            LEFT JOIN companies c ON ev.workplace_id = c.id
            WHERE c.name = $1
              AND (e."admissionDate" <= $2 OR e."admissionDate" IS NULL)
              AND (e.type IS NULL OR e.type != 'Desligado' OR 
                   e."terminationDate" IS NULL OR 
                   e."terminationDate" = '' OR 
                   e."terminationDate" > $2)
            ORDER BY e.name
        `, ['NORDESTE LOCACOES - FORTALEZA', '2026-01-31']);
        
        console.log(`   Total ativos em 31/01/2026: ${activeAtEnd.rows.length}`);
        
        // 4. Calcular variação
        const variation = activeAtEnd.rows.length - activeAtStart.rows.length;
        console.log(`\n   Variação no mês: ${variation > 0 ? '+' : ''}${variation}`);
        
        // 5. Mostrar admissões no período
        console.log('\n4. Admissões em Janeiro 2026:');
        const admissionsResult = await query(`
            SELECT e.name, e."admissionDate", e.type
            FROM employees e
            LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = '1'
            LEFT JOIN companies c ON ev.workplace_id = c.id
            WHERE c.name = $1
              AND e."admissionDate" >= $2
              AND e."admissionDate" <= $3
            ORDER BY e."admissionDate"
        `, ['NORDESTE LOCACOES - FORTALEZA', '2026-01-01', '2026-01-31']);
        
        console.log(`   Total de admissões: ${admissionsResult.rows.length}`);
        admissionsResult.rows.forEach(emp => {
            console.log(`   - ${emp.name}: ${emp.admissionDate} (${emp.type || 'N/A'})`);
        });
        
        // 6. Simular contagem usando diferentes lógicas
        console.log('\n5. Testando diferentes lógicas de contagem:');
        
        // Lógica 1: Contar todos que estavam ativos em algum momento do mês
        const logic1 = await query(`
            SELECT COUNT(DISTINCT e.id) as count
            FROM employees e
            LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = '1'
            LEFT JOIN companies c ON ev.workplace_id = c.id
            WHERE c.name = $1
              AND (
                  -- Admitidos antes ou durante janeiro
                  (e."admissionDate" <= $2 OR e."admissionDate" IS NULL)
                  -- E não desligados antes do final de janeiro
                  AND (e.type IS NULL OR e.type != 'Desligado' OR 
                       e."terminationDate" IS NULL OR 
                       e."terminationDate" = '' OR 
                       e."terminationDate" > $3)
              )
        `, ['NORDESTE LOCACOES - FORTALEZA', '2026-01-31', '2026-01-31']);
        
        console.log(`   Lógica 1 (acumulado): ${logic1.rows[0].count}`);
        
        // Lógica 2: Contar apenas ativos no final do mês
        const logic2 = await query(`
            SELECT COUNT(DISTINCT e.id) as count
            FROM employees e
            LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = '1'
            LEFT JOIN companies c ON ev.workplace_id = c.id
            WHERE c.name = $1
              AND (e."admissionDate" <= $2 OR e."admissionDate" IS NULL)
              AND (e.type IS NULL OR e.type != 'Desligado' OR 
                   e."terminationDate" IS NULL OR 
                   e."terminationDate" = '' OR 
                   e."terminationDate" > $2)
        `, ['NORDESTE LOCACOES - FORTALEZA', '2026-01-31']);
        
        console.log(`   Lógica 2 (final do mês): ${logic2.rows[0].count}`);
        
        // Lógica 3: Contar média entre início e fim
        const avgCount = Math.round((activeAtStart.rows.length + activeAtEnd.rows.length) / 2);
        console.log(`   Lógica 3 (média): ${avgCount}`);
        
        // 7. Comparar com dados esperados
        console.log('\n6. Comparação com dados esperados:');
        console.log(`   Esperado para Janeiro 2026: 63 colaboradores`);
        console.log(`   Resultados obtidos:`);
        console.log(`     - Lógica 1: ${logic1.rows[0].count} (diferença: ${logic1.rows[0].count - 63})`);
        console.log(`     - Lógica 2: ${logic2.rows[0].count} (diferença: ${logic2.rows[0].count - 63})`);
        console.log(`     - Lógica 3: ${avgCount} (diferença: ${avgCount - 63})`);
        
        // 8. Análise específica dos 3 desligamentos mencionados
        if (dismissalsResult.rows.length >= 3) {
            console.log('\n7. Análise dos 3 primeiros desligamentos:');
            const top3 = dismissalsResult.rows.slice(0, 3);
            top3.forEach((emp, index) => {
                console.log(`   ${index + 1}. ${emp.name}:`);
                console.log(`      - Admissão: ${emp.admissionDate}`);
                console.log(`      - Desligamento: ${emp.terminationDate}`);
                console.log(`      - Dias trabalhados: ${calculateWorkDays(emp.admissionDate, emp.terminationDate)}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Erro na análise:', error);
    }
}

/**
 * Calcular dias trabalhados entre duas datas
 */
function calculateWorkDays(startDate, endDate) {
    if (!startDate || !endDate) return 'N/A';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
}

/**
 * Função principal
 */
async function main() {
    try {
        console.log('🔧 Conectando ao banco de dados...');
        await analyzeJanuary2026Dismissals();
        console.log('\n🎉 Análise concluída!');
    } catch (error) {
        console.error('❌ Erro no processo:', error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = {
    analyzeJanuary2026Dismissals
};
