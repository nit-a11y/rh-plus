/**
 * Script para Verificar Coluna de Desligamento
 */

const { query } = require('../config/database');

/**
 * Verificar colunas relacionadas a desligamento
 */
async function checkDismissalColumn() {
    console.log('🔧 Verificando colunas de desligamento...\n');
    
    try {
        // 1. Verificar todas as colunas da tabela employees
        console.log('1. Colunas da tabela employees:');
        const empColumns = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'employees' 
              AND (column_name ILIKE '%dismiss%' OR column_name ILIKE '%termination%' OR column_name ILIKE '%deslig%')
            ORDER BY column_name
        `);
        
        empColumns.rows.forEach(col => {
            console.log(`  ${col.column_name}: ${col.data_type}`);
        });
        
        // 2. Verificar dados de desligamento
        console.log('\n2. Verificando dados de desligamento:');
        const dismissalData = await query(`
            SELECT e.name, e.type, e.admissionDate, e.terminationDate, e.observation, c.name as unit
            FROM employees e
            LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = '1'
            LEFT JOIN companies c ON ev.workplace_id = c.id
            WHERE e.type = 'Desligado'
            ORDER BY e.name
            LIMIT 10
        `);
        
        console.log('   Dados de colaboradores desligados:');
        dismissalData.rows.forEach(row => {
            console.log(`   - ${row.name}: ${row.type} | ${row.admissionDate} → ${row.terminationDate || 'N/A'} | ${row.unit || 'N/A'}`);
        });
        
        // 3. Verificar se há coluna dismissalDate
        console.log('\n3. Testando com dismissalDate:');
        try {
            const testResult = await query(`
                SELECT COUNT(*) as count
                FROM employees e
                WHERE e.type = 'Desligado'
                  AND e.dismissalDate IS NOT NULL
                LIMIT 1
            `);
            console.log(`   dismissalDate existe: ${testResult.rows.length > 0 ? 'SIM' : 'NÃO'}`);
        } catch (error) {
            console.log(`   dismissalDate NÃO existe: ${error.message}`);
        }
        
        // 4. Verificar se há coluna terminationDate
        console.log('\n4. Testando com terminationDate:');
        try {
            const testResult = await query(`
                SELECT COUNT(*) as count
                FROM employees e
                WHERE e.type = 'Desligado'
                  AND e.terminationDate IS NOT NULL
                LIMIT 1
            `);
            console.log(`   terminationDate existe: ${testResult.rows.length > 0 ? 'SIM' : 'NÃO'}`);
            
            if (testResult.rows.length > 0) {
                // Mostrar exemplos de terminationDate
                const examples = await query(`
                    SELECT e.name, e.terminationDate, e.admissionDate
                    FROM employees e
                    WHERE e.type = 'Desligado'
                      AND e.terminationDate IS NOT NULL
                    ORDER BY e.terminationDate DESC
                    LIMIT 5
                `);
                
                console.log('   Exemplos de terminationDate:');
                examples.rows.forEach(row => {
                    console.log(`     - ${row.name}: ${row.admissionDate} → ${row.terminationDate}`);
                });
            }
        } catch (error) {
            console.log(`   terminationDate NÃO existe: ${error.message}`);
        }
        
    } catch (error) {
        console.error('Erro:', error);
    }
}

/**
 * Função principal
 */
async function main() {
    try {
        await checkDismissalColumn();
    } catch (error) {
        console.error('Erro no processo:', error);
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
    checkDismissalColumn
};
