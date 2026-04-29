/**
 * Script para Debug da Contagem de Colaboradores
 */

const { query } = require('../config/database');

/**
 * Testar a contagem de colaboradores com diferentes filtros
 */
async function debugEmployeeCount() {
    console.log('🔧 Debug da contagem de colaboradores...\n');
    
    try {
        // 1. Testar contagem total
        console.log('1. Testando contagem total de colaboradores ativos:');
        const totalResult = await query(`
            SELECT COUNT(*) as count
            FROM employees 
            WHERE type != 'Desligado' OR type IS NULL
        `);
        console.log(`   Total: ${totalResult.rows[0].count}`);
        
        // 2. Testar contagem com JOINs
        console.log('\n2. Testando contagem com JOINs (sem filtros):');
        const joinResult = await query(`
            SELECT COUNT(DISTINCT e.id) as count
            FROM employees e
            LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = 1
            LEFT JOIN companies c ON ev.workplace_id = c.id
            WHERE (e.type != 'Desligado' OR e.type IS NULL)
        `);
        console.log(`   Com JOINs: ${joinResult.rows[0].count}`);
        
        // 3. Listar unidades disponíveis
        console.log('\n3. Listando unidades disponíveis:');
        const unitsResult = await query(`
            SELECT DISTINCT c.name, COUNT(*) as employees_count
            FROM employees e
            LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = 1
            LEFT JOIN companies c ON ev.workplace_id = c.id
            WHERE c.name IS NOT NULL AND c.name != ''
            GROUP BY c.name
            ORDER BY employees_count DESC
        `);
        
        console.log('   Unidades encontradas:');
        unitsResult.rows.forEach(row => {
            console.log(`   - ${row.name}: ${row.employees_count} colaboradores`);
        });
        
        // 4. Testar filtro específico
        const targetUnit = 'NORDESTE LOCACOES - FORTALEZA';
        console.log(`\n4. Testando filtro específico: "${targetUnit}"`);
        
        const filterResult = await query(`
            SELECT COUNT(DISTINCT e.id) as count
            FROM employees e
            LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = 1
            LEFT JOIN companies c ON ev.workplace_id = c.id
            WHERE c.name = $1
              AND (e.type != 'Desligado' OR e.type IS NULL)
        `, [targetUnit]);
        
        console.log(`   Colaboradores em "${targetUnit}": ${filterResult.rows[0].count}`);
        
        // 5. Testar com período
        console.log('\n5. Testando com período 2026:');
        const periodResult = await query(`
            SELECT COUNT(DISTINCT e.id) as count
            FROM employees e
            LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = 1
            LEFT JOIN companies c ON ev.workplace_id = c.id
            WHERE c.name = $1
              AND (e.type != 'Desligado' OR e.type IS NULL)
              AND (
                (e."admissionDate" <= $2 AND (e.type != 'Desligado' OR e.type IS NULL))
                OR
                (e."admissionDate" <= $2 AND e.type = 'Desligado' AND (
                  e."dismissalDate" IS NULL OR 
                  e."dismissalDate" = '' OR
                  e."dismissalDate" > $3
                ))
              )
        `, [targetUnit, '2026-01-01', '2026-12-31']);
        
        console.log(`   Colaboradores em "${targetUnit}" em 2026: ${periodResult.rows[0].count}`);
        
        // 6. Verificar dados de admissão
        console.log('\n6. Verificando dados de admissão de colaboradores na unidade:');
        const admissionResult = await query(`
            SELECT e.name, e."admissionDate", e.type, e."dismissalDate", c.name as unit
            FROM employees e
            LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = 1
            LEFT JOIN companies c ON ev.workplace_id = c.id
            WHERE c.name = $1
            ORDER BY e."admissionDate" DESC
            LIMIT 10
        `, [targetUnit]);
        
        console.log(`   Colaboradores em "${targetUnit}":`);
        admissionResult.rows.forEach(row => {
            console.log(`   - ${row.name}: ${row.admissionDate} | ${row.type} | ${row.dismissalDate || 'N/A'}`);
        });
        
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
        await debugEmployeeCount();
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
    debugEmployeeCount
};
