/**
 * Script para Atualizar Unidades em Registros de Horas Extras
 * Atualiza em massa os registros que ficaram sem unidade na importação
 */

const { query } = require('../config/database');

/**
 * Busca unidade do colaborador através dos vínculos
 */
async function getEmployeeUnit(employeeId) {
    try {
        const result = await query(`
            SELECT wp.name as workplace_name
            FROM employee_vinculos ev
            LEFT JOIN companies wp ON ev.workplace_id = wp.id
            WHERE ev.employee_id = $1 AND ev.principal = '1'
            LIMIT 1
        `, [employeeId]);
        
        return result.rows[0]?.workplace_name || null;
    } catch (error) {
        console.error(`Erro ao buscar unidade do colaborador ${employeeId}:`, error.message);
        return null;
    }
}

/**
 * Atualiza unidades em registros sem unidade
 */
async function updateMissingUnits() {
    console.log('🔧 Iniciando atualização de unidades em registros de horas extras...\n');
    
    try {
        // 1. Buscar todos os registros sem unidade
        const recordsWithoutUnit = await query(`
            SELECT id, employee_id, nome, mes, extra, valor
            FROM overtime_records 
            WHERE unidade IS NULL OR unidade = ''
            ORDER BY nome, mes
        `);
        
        console.log(`📊 Total de registros sem unidade: ${recordsWithoutUnit.rows.length}`);
        
        if (recordsWithoutUnit.rows.length === 0) {
            console.log('✅ Todos os registros já possuem unidades!');
            return { updated: 0, errors: 0 };
        }
        
        // 2. Para cada registro, buscar e atualizar a unidade
        let updatedCount = 0;
        let errorCount = 0;
        let notFoundCount = 0;
        
        for (const record of recordsWithoutUnit.rows) {
            try {
                console.log(`⏳ Processando: ${record.nome} (${record.employee_id})`);
                
                // Buscar unidade do colaborador
                const unit = await getEmployeeUnit(record.employee_id);
                
                if (unit) {
                    // Atualizar o registro
                    await query(`
                        UPDATE overtime_records 
                        SET unidade = $1 
                        WHERE id = $2
                    `, [unit, record.id]);
                    
                    updatedCount++;
                    console.log(`✅ Atualizado: ${record.nome} -> ${unit}`);
                } else {
                    notFoundCount++;
                    console.log(`⚠️ Sem unidade encontrada: ${record.nome} (${record.employee_id})`);
                }
                
            } catch (error) {
                errorCount++;
                console.error(`❌ Erro ao atualizar registro ${record.id}:`, error.message);
            }
        }
        
        // 3. Estatísticas finais
        console.log('\n📈 RESULTADO DA ATUALIZAÇÃO:');
        console.log(`✅ Atualizados: ${updatedCount}`);
        console.log(`⚠️ Sem unidade encontrada: ${notFoundCount}`);
        console.log(`❌ Erros: ${errorCount}`);
        console.log(`📊 Total processado: ${recordsWithoutUnit.rows.length}`);
        
        // 4. Verificar registros restantes
        const remaining = await query(`
            SELECT COUNT(*) as remaining 
            FROM overtime_records 
            WHERE unidade IS NULL OR unidade = ''
        `);
        
        console.log(`📋 Registros ainda sem unidade: ${remaining.rows[0].remaining}`);
        
        return { 
            updated: updatedCount, 
            notFound: notFoundCount,
            errors: errorCount,
            remaining: remaining.rows[0].remaining 
        };
        
    } catch (error) {
        console.error('❌ Erro geral no processo:', error);
        throw error;
    }
}

/**
 * Função principal
 */
async function main() {
    try {
        console.log('🔧 Conectando ao banco de dados...');
        
        const result = await updateMissingUnits();
        
        console.log('\n🎉 ATUALIZAÇÃO DE UNIDADES CONCLUÍDA!');
        console.log(`📊 Resumo final:`);
        console.log(`   - Registros atualizados: ${result.updated}`);
        console.log(`   - Sem unidade encontrada: ${result.notFound}`);
        console.log(`   - Erros: ${result.errors}`);
        console.log(`   - Ainda sem unidade: ${result.remaining}`);
        
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
    updateMissingUnits,
    getEmployeeUnit
};
