/**
 * Script para Analisar e Corrigir Workplace IDs Inválidos
 * Identifica workplace_ids que não existem na tabela companies e substitui por edcfae9a
 */

const { query } = require('../config/database');

/**
 * Verificar quais workplace_ids nos vínculos não existem na tabela companies
 */
async function analyzeInvalidWorkplaceIds() {
    console.log('🔍 Analisando workplace_ids inválidos nos vínculos...\n');
    
    try {
        // 1. Buscar todos os workplace_ids distintos na tabela employee_vinculos
        const vinculosResult = await query(`
            SELECT DISTINCT workplace_id, COUNT(*) as count
            FROM employee_vinculos 
            WHERE workplace_id IS NOT NULL AND workplace_id != ''
            GROUP BY workplace_id
            ORDER BY workplace_id
        `);
        
        console.log('📊 Workplace_ids encontrados nos vínculos:');
        console.log('━'.repeat(50));
        vinculosResult.rows.forEach(row => {
            console.log(`${row.workplace_id.padEnd(15)} (${row.count} vínculos)`);
        });
        console.log('━'.repeat(50));
        
        // 2. Buscar todos os IDs válidos na tabela companies
        const companiesResult = await query(`
            SELECT id, name, type
            FROM companies
            ORDER BY id
        `);
        
        console.log('\n📋 Companies válidas no sistema:');
        console.log('━'.repeat(60));
        companiesResult.rows.forEach(row => {
            console.log(`${row.id.padEnd(15)} ${row.name.padEnd(30)} (${row.type})`);
        });
        console.log('━'.repeat(60));
        
        // 3. Identificar IDs inválidos
        const validIds = new Set(companiesResult.rows.map(c => c.id));
        const invalidIds = [];
        
        vinculosResult.rows.forEach(row => {
            if (!validIds.has(row.workplace_id)) {
                invalidIds.push({
                    workplace_id: row.workplace_id,
                    count: row.count
                });
            }
        });
        
        if (invalidIds.length === 0) {
            console.log('\n✅ Todos os workplace_ids são válidos!');
            return { invalidIds: [], totalInvalid: 0 };
        }
        
        console.log('\n❌ Workplace_ids INVÁLIDOS encontrados:');
        console.log('━'.repeat(50));
        invalidIds.forEach(row => {
            console.log(`${row.workplace_id.padEnd(15)} (${row.count} vínculos)`);
        });
        console.log('━'.repeat(50));
        
        // 4. Mostrar detalhes dos colaboradores afetados
        console.log('\n👥 Colaboradores afetados pelos IDs inválidos:');
        console.log('━'.repeat(80));
        
        for (const invalid of invalidIds) {
            const affectedEmployees = await query(`
                SELECT ev.employee_id, e.name as employee_name, ev.workplace_id
                FROM employee_vinculos ev
                LEFT JOIN employees e ON ev.employee_id = e.id
                WHERE ev.workplace_id = $1
                LIMIT 5
            `, [invalid.workplace_id]);
            
            console.log(`\nWorkplace ID ${invalid.workplace_id} (${invalid.count} vínculos):`);
            affectedEmployees.rows.forEach(emp => {
                console.log(`  - ${emp.employee_name} (${emp.employee_id})`);
            });
            
            if (invalid.count > 5) {
                console.log(`  ... e mais ${invalid.count - 5} colaboradores`);
            }
        }
        
        return { 
            invalidIds, 
            totalInvalid: invalidIds.reduce((sum, item) => sum + item.count, 0),
            validCompanies: companiesResult.rows
        };
        
    } catch (error) {
        console.error('❌ Erro na análise:', error);
        throw error;
    }
}

/**
 * Corrigir workplace_ids inválidos substituindo por edcfae9a
 */
async function fixInvalidWorkplaceIds(invalidIds) {
    console.log('\n🔧 Iniciando correção dos workplace_ids inválidos...\n');
    
    if (invalidIds.length === 0) {
        console.log('✅ Nenhum workplace_id inválido para corrigir!');
        return { updated: 0 };
    }
    
    let totalUpdated = 0;
    
    for (const invalid of invalidIds) {
        try {
            console.log(`⏳ Corrigindo workplace_id "${invalid.workplace_id}" para "edcfae9a"...`);
            
            const result = await query(`
                UPDATE employee_vinculos 
                SET workplace_id = 'edcfae9a'
                WHERE workplace_id = $1
            `, [invalid.workplace_id]);
            
            const updatedCount = result.rowCount || 0;
            totalUpdated += updatedCount;
            
            console.log(`✅ Atualizados: ${updatedCount} vínculos`);
            
        } catch (error) {
            console.error(`❌ Erro ao corrigir workplace_id ${invalid.workplace_id}:`, error);
        }
    }
    
    console.log(`\n📈 Total de vínculos atualizados: ${totalUpdated}`);
    
    return { updated: totalUpdated };
}

/**
 * Verificar resultado após correção
 */
async function verifyFix() {
    console.log('\n🔍 Verificando resultado após correção...\n');
    
    try {
        const result = await query(`
            SELECT DISTINCT workplace_id, COUNT(*) as count
            FROM employee_vinculos 
            WHERE workplace_id IS NOT NULL AND workplace_id != ''
            GROUP BY workplace_id
            ORDER BY workplace_id
        `);
        
        console.log('📊 Workplace_ids após correção:');
        console.log('━'.repeat(50));
        result.rows.forEach(row => {
            console.log(`${row.workplace_id.padEnd(15)} (${row.count} vínculos)`);
        });
        console.log('━'.repeat(50));
        
        // Verificar se ainda existem ids inválidos
        const companiesResult = await query(`SELECT id FROM companies`);
        const validIds = new Set(companiesResult.rows.map(c => c.id));
        
        const stillInvalid = result.rows.filter(row => !validIds.has(row.workplace_id));
        
        if (stillInvalid.length === 0) {
            console.log('\n✅ Todos os workplace_ids agora são válidos!');
        } else {
            console.log('\n⚠️ Ainda existem workplace_ids inválidos:');
            stillInvalid.forEach(row => {
                console.log(`  - ${row.workplace_id} (${row.count} vínculos)`);
            });
        }
        
    } catch (error) {
        console.error('❌ Erro na verificação:', error);
    }
}

/**
 * Função principal
 */
async function main() {
    try {
        console.log('🔧 Conectando ao banco de dados...');
        
        // 1. Analisar IDs inválidos
        const analysis = await analyzeInvalidWorkplaceIds();
        
        if (analysis.invalidIds.length > 0) {
            // 2. Corrigir IDs inválidos
            await fixInvalidWorkplaceIds(analysis.invalidIds);
            
            // 3. Verificar resultado
            await verifyFix();
        }
        
        console.log('\n🎉 Processo de correção concluído!');
        
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
    analyzeInvalidWorkplaceIds,
    fixInvalidWorkplaceIds,
    verifyFix
};
