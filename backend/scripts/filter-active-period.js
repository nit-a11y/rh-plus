/**
 * Script para Filtrar Colaboradores Ativos em um Período Específico
 */

const { query } = require('../config/database');

/**
 * Filtrar todos os colaboradores que estavam ativos em janeiro 2026 - Fortaleza
 */
async function filterActiveInPeriod() {
    console.log('🔧 Filtrando colaboradores ativos em Janeiro 2026 - Fortaleza...\n');
    
    try {
        const unit = 'NORDESTE LOCACOES - FORTALEZA';
        const startDate = '2026-01-01';
        const endDate = '2026-01-31';
        
        // 1. Colaboradores que estavam ativos em algum momento do período
        console.log('1. Colaboradores ativos durante Janeiro 2026:');
        
        const activeDuringPeriod = await query(`
            SELECT DISTINCT e.id, e.name, e."admissionDate", e."terminationDate", e.type,
                   CASE 
                       WHEN e."admissionDate" <= $2 THEN 'Admitido antes'
                       WHEN e."admissionDate" BETWEEN $2 AND $3 THEN 'Admitido no período'
                       ELSE 'Admitido após'
                   END as admission_status,
                   CASE 
                       WHEN e.type = 'Desligado' AND e."terminationDate" IS NOT NULL 
                            AND e."terminationDate" <= $3 THEN 'Desligado no período'
                       WHEN e.type = 'Desligado' AND e."terminationDate" IS NOT NULL 
                            AND e."terminationDate" > $3 THEN 'Desligado após'
                       WHEN e.type = 'Desligado' THEN 'Desligado (sem data)'
                       ELSE 'Ativo'
                   END as dismissal_status
            FROM employees e
            LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = '1'
            LEFT JOIN companies c ON ev.workplace_id = c.id
            WHERE c.name = $1
              AND (
                  -- Admitido antes ou durante o período
                  (e."admissionDate" <= $3 OR e."admissionDate" IS NULL)
                  -- E ainda estava ativo no início do período OU não foi desligado antes do final
                  AND (e."admissionDate" <= $2 OR e."admissionDate" IS NULL)
                  AND (e.type IS NULL OR e.type != 'Desligado' OR 
                       e."terminationDate" IS NULL OR 
                       e."terminationDate" = '' OR 
                       e."terminationDate" > $2)
              )
            ORDER BY e.name
        `, [unit, startDate, endDate]);
        
        console.log(`   Total de colaboradores ativos no período: ${activeDuringPeriod.rows.length}`);
        
        // 2. Detalhar cada colaborador
        console.log('\n2. Detalhes dos colaboradores:');
        activeDuringPeriod.rows.forEach((emp, index) => {
            console.log(`   ${index + 1}. ${emp.name}`);
            console.log(`      - Admissão: ${emp.admissionDate || 'N/A'} (${emp.admission_status})`);
            console.log(`      - Status: ${emp.dismissal_status}`);
            if (emp.terminationDate) {
                console.log(`      - Desligamento: ${emp.terminationDate}`);
            }
            console.log('');
        });
        
        // 3. Separar por categorias
        console.log('3. Resumo por categorias:');
        
        const admittedBefore = activeDuringPeriod.rows.filter(emp => 
            emp.admission_status === 'Admitido antes'
        );
        
        const admittedDuring = activeDuringPeriod.rows.filter(emp => 
            emp.admission_status === 'Admitido no período'
        );
        
        const dismissedDuring = activeDuringPeriod.rows.filter(emp => 
            emp.dismissal_status === 'Desligado no período'
        );
        
        const stillActive = activeDuringPeriod.rows.filter(emp => 
            emp.dismissal_status === 'Ativo'
        );
        
        console.log(`   - Admitidos antes do período: ${admittedBefore.length}`);
        console.log(`   - Admitidos durante o período: ${admittedDuring.length}`);
        console.log(`   - Desligados durante o período: ${dismissedDuring.length}`);
        console.log(`   - Ainda ativos no final: ${stillActive.length}`);
        
        // 4. Mostrar admissões do período
        if (admittedDuring.length > 0) {
            console.log('\n4. Admissões durante Janeiro 2026:');
            admittedDuring.forEach(emp => {
                console.log(`   - ${emp.name}: ${emp.admissionDate}`);
            });
        }
        
        // 5. Mostrar desligamentos do período
        if (dismissedDuring.length > 0) {
            console.log('\n5. Desligamentos durante Janeiro 2026:');
            dismissedDuring.forEach(emp => {
                console.log(`   - ${emp.name}: ${emp.admissionDate} → ${emp.terminationDate}`);
            });
        } else {
            console.log('\n5. Não houve desligamentos em Janeiro 2026');
        }
        
        // 6. Comparar com diferentes lógicas de contagem
        console.log('\n6. Comparação de lógicas de contagem:');
        
        // Lógica A: Todos que passaram pelo período
        console.log(`   Lógica A (todos que passaram): ${activeDuringPeriod.rows.length}`);
        
        // Lógica B: Média entre início e fim
        const startCount = admittedBefore.length;
        const endCount = stillActive.length;
        const avgCount = Math.round((startCount + endCount) / 2);
        console.log(`   Lógica B (média início/fim): ${avgCount}`);
        
        // Lógica C: Apenas ativos no final
        console.log(`   Lógica C (ativos no final): ${endCount}`);
        
        // Lógica D: Esperado pelo usuário
        console.log(`   Lógica D (esperado): 63`);
        
        // 7. Análise da diferença
        console.log('\n7. Análise da diferença:');
        const diffA = activeDuringPeriod.rows.length - 63;
        const diffB = avgCount - 63;
        const diffC = endCount - 63;
        
        console.log(`   - Diferença Lógica A: ${diffA > 0 ? '+' : ''}${diffA}`);
        console.log(`   - Diferença Lógica B: ${diffB > 0 ? '+' : ''}${diffB}`);
        console.log(`   - Diferença Lógica C: ${diffC > 0 ? '+' : ''}${diffC}`);
        
        if (diffB === 0) {
            console.log('   ✅ Lógica B corresponde exatamente ao esperado!');
        }
        
    } catch (error) {
        console.error('❌ Erro na análise:', error);
    }
}

/**
 * Função principal
 */
async function main() {
    try {
        console.log('🔧 Conectando ao banco de dados...');
        await filterActiveInPeriod();
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
    filterActiveInPeriod
};
