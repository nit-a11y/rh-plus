/**
 * Script para Debugar Contagem Atual - Por que está 73?
 */

const { query } = require('../config/database');

/**
 * Debugar contagem atual para entender por que está 73
 */
async function debugCurrentCount() {
    console.log('🔧 Debugando contagem atual - Por que está 73?\n');
    
    try {
        const unit = 'NORDESTE LOCACOES - FORTALEZA';
        const month = 'JANEIRO';
        const year = '2026';
        
        // 1. Verificar contagem atual com a função do sistema
        console.log('1. Contagem atual com função do sistema:');
        const { countActiveEmployees } = require('../routes/overtime-fixed');
        const currentCount = await countActiveEmployees(month, year, unit);
        console.log(`   Contagem atual: ${currentCount}`);
        
        // 2. Verificar todos os colaboradores na unidade
        console.log('\n2. Todos os colaboradores na unidade:');
        const allEmployees = await query(`
            SELECT e.id, e.name, e."admissionDate", e."terminationDate", e.type
            FROM employees e
            LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = '1'
            LEFT JOIN companies c ON ev.workplace_id = c.id
            WHERE c.name = $1
            ORDER BY e.name
        `, [unit]);
        
        console.log(`   Total geral: ${allEmployees.rows.length}`);
        
        // 3. Separar por status
        const active = allEmployees.rows.filter(emp => emp.type !== 'Desligado');
        const dismissed = allEmployees.rows.filter(emp => emp.type === 'Desligado');
        const dismissedWithDate = dismissed.filter(emp => emp.terminationDate);
        const dismissedWithoutDateTotal = dismissed.filter(emp => !emp.terminationDate);
        
        console.log(`   - Ativos: ${active.length}`);
        console.log(`   - Desligados: ${dismissed.length}`);
        console.log(`     - Com data: ${dismissedWithDate.length}`);
        console.log(`     - Sem data: ${dismissedWithoutDateTotal.length}`);
        
        // 4. Verificar contagem específica do período
        console.log('\n3. Contagem específica para Janeiro 2026:');
        const periodCount = await query(`
            SELECT COUNT(DISTINCT e.id) as count
            FROM employees e
            LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = '1'
            LEFT JOIN companies c ON ev.workplace_id = c.id
            WHERE c.name = $1
              AND (
                  -- Admitidos antes ou durante o período
                  (e."admissionDate" <= $2 OR e."admissionDate" IS NULL)
                  -- E não desligados ou desligados após o período
                  AND (e.type IS NULL OR e.type != 'Desligado' OR 
                       e."terminationDate" IS NULL OR 
                       e."terminationDate" = '' OR 
                       e."terminationDate" > $2)
              )
        `, [unit, '2026-01-31']);
        
        console.log(`   Contagem do período: ${periodCount.rows[0].count}`);
        
        // 5. Verificar quem está sendo incluído indevidamente
        console.log('\n4. Verificando colaboradores incluídos na contagem:');
        const includedEmployees = await query(`
            SELECT DISTINCT e.id, e.name, e."admissionDate", e."terminationDate", e.type,
                   CASE 
                       WHEN e."admissionDate" <= '2026-01-31' THEN 'Dentro do período'
                       ELSE 'Fora do período'
                   END as admission_status,
                   CASE 
                       WHEN e.type = 'Desligado' AND e."terminationDate" IS NOT NULL 
                            AND e."terminationDate" <= '2026-01-31' THEN 'Desligado no período'
                       WHEN e.type = 'Desligado' AND e."terminationDate" IS NOT NULL 
                            AND e."terminationDate" > '2026-01-31' THEN 'Desligado após'
                       WHEN e.type = 'Desligado' THEN 'Desligado (sem data)'
                       ELSE 'Ativo'
                   END as dismissal_status
            FROM employees e
            LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = '1'
            LEFT JOIN companies c ON ev.workplace_id = c.id
            WHERE c.name = $1
              AND (
                  (e."admissionDate" <= '2026-01-31' OR e."admissionDate" IS NULL)
                  AND (e.type IS NULL OR e.type != 'Desligado' OR 
                       e."terminationDate" IS NULL OR 
                       e."terminationDate" = '' OR 
                       e."terminationDate" > '2026-01-31')
              )
            ORDER BY e.name
        `, [unit]);
        
        console.log(`   Total incluídos: ${includedEmployees.rows.length}`);
        
        // 6. Analisar problemas
        console.log('\n5. Análise dos problemas:');
        
        const admittedBefore = includedEmployees.rows.filter(emp => 
            emp.admission_status === 'Dentro do período'
        );
        
        const dismissedInPeriod = includedEmployees.rows.filter(emp => 
            emp.dismissal_status === 'Desligado no período'
        );
        
        const dismissedAfter = includedEmployees.rows.filter(emp => 
            emp.dismissal_status === 'Desligado após'
        );
        
        const dismissedWithoutDate = includedEmployees.rows.filter(emp => 
            emp.dismissal_status === 'Desligado (sem data)'
        );
        
        const stillActive = includedEmployees.rows.filter(emp => 
            emp.dismissal_status === 'Ativo'
        );
        
        console.log(`   - Admitidos dentro do período: ${admittedBefore.length}`);
        console.log(`   - Desligados no período: ${dismissedInPeriod.length}`);
        console.log(`   - Desligados após: ${dismissedAfter.length}`);
        console.log(`   - Desligados sem data: ${dismissedWithoutDate.length}`);
        console.log(`   - Ainda ativos: ${stillActive.length}`);
        
        // 7. Mostrar desligados sem data (problema)
        if (dismissedWithoutDate.length > 0) {
            console.log('\n6. Desligados sem data (possível problema):');
            dismissedWithoutDate.forEach(emp => {
                console.log(`   - ${emp.name}: ${emp.admissionDate} → (sem data)`);
            });
        }
        
        // 8. Calcular contagem correta
        console.log('\n7. Cálculo da contagem correta:');
        const correctCount = stillActive.length + dismissedAfter.length;
        console.log(`   Ativos (${stillActive.length}) + Desligados após (${dismissedAfter.length}) = ${correctCount}`);
        
        // 9. Comparar com esperado
        console.log('\n8. Comparação final:');
        console.log(`   - Contagem atual: ${currentCount}`);
        console.log(`   - Contagem correta: ${correctCount}`);
        console.log(`   - Esperado: 63`);
        console.log(`   - Diferença: ${currentCount - 63}`);
        
        if (currentCount === 73) {
            console.log('   ❌ CONFIRMADO: Sistema está contando 73');
            console.log('   🔍 PROVAVEL CAUSA: Desligados sem data estão sendo incluídos');
        }
        
    } catch (error) {
        console.error('❌ Erro no debug:', error);
    }
}

/**
 * Função principal
 */
async function main() {
    try {
        console.log('🔧 Conectando ao banco de dados...');
        await debugCurrentCount();
        console.log('\n🎉 Debug concluído!');
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
    debugCurrentCount
};
