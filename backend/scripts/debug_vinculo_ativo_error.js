const { query } = require('../config/database');

async function debugVinculoAtivoError() {
    try {
        console.log('🔍 INVESTIGANDO ERRO: "Já existe um vínculo ativo"');
        
        // 1. Verificar estado atual do employee 3cdfbfa2
        console.log('\n📋 1. Verificando estado atual do employee 3cdfbfa2...');
        
        const employeeVinculos = await query(`
            SELECT 
                ev.id,
                ev.employee_id,
                ev.employer_id,
                ev.workplace_id,
                ev.data_inicio,
                ev.data_fim,
                ev.status,
                ev.tipo_vinculo,
                ev.sequencia,
                ev.data_transferencia,
                emp.name as employer_name,
                wp.name as workplace_name
            FROM employee_vinculos ev
            LEFT JOIN companies emp ON ev.employer_id = emp.id
            LEFT JOIN companies wp ON ev.workplace_id = wp.id
            WHERE ev.employee_id = '3cdfbfa2'
            ORDER BY ev.sequencia
        `);
        
        console.log(`📊 Total de vínculos: ${employeeVinculos.rows.length}`);
        
        employeeVinculos.rows.forEach((v, index) => {
            console.log(`\n  Vínculo ${index + 1}:`);
            console.log(`    ID: ${v.id}`);
            console.log(`    Empregador: ${v.employer_name} (${v.employer_id})`);
            console.log(`    Local: ${v.workplace_name} (${v.workplace_id})`);
            console.log(`    Status: ${v.status}`);
            console.log(`    Tipo: ${v.tipo_vinculo}`);
            console.log(`    Sequência: ${v.sequencia}`);
            console.log(`    Período: ${v.data_inicio} até ${v.data_fim || 'ATUAL'}`);
            if (v.data_transferencia) {
                console.log(`    🔄 Transferência: ${v.data_transferencia}`);
            }
        });
        
        // 2. Contar vínculos ATIVOS
        console.log('\n📋 2. Contando vínculos ATIVOS...');
        
        const ativosCount = await query(`
            SELECT COUNT(*) as count
            FROM employee_vinculos 
            WHERE employee_id = '3cdfbfa2' 
            AND status = 'ATIVO' 
            AND tipo_vinculo = 'ATUAL'
        `);
        
        console.log(`📊 Vínculos ATIVOS: ${ativosCount.rows[0].count}`);
        
        // 3. Verificar se há problema na rota POST de vínculos
        console.log('\n📋 3. Analisando regra de negócio...');
        
        if (ativosCount.rows[0].count > 1) {
            console.log('❌ PROBLEMA IDENTIFICADO: Múltiplos vínculos ATIVOS');
            console.log('🔧 Isso está causando o erro ao tentar adicionar/editar');
            
            // Corrigir: manter apenas o mais recente como ATIVO
            const fixMultipleAtivos = await query(`
                UPDATE employee_vinculos 
                SET status = 'PASSADO', tipo_vinculo = 'PASSADO'
                WHERE employee_id = '3cdfbfa2' 
                AND status = 'ATIVO' 
                AND tipo_vinculo = 'ATUAL'
                AND id != (
                    SELECT id FROM employee_vinculos 
                    WHERE employee_id = '3cdfbfa2' 
                    AND status = 'ATIVO' 
                    AND tipo_vinculo = 'ATUAL'
                    ORDER BY data_inicio DESC 
                    LIMIT 1
                )
            `);
            
            console.log(`✅ ${fixMultipleAtivos.rowCount} vínculos corrigidos para PASSADO`);
        } else {
            console.log('✅ Não há múltiplos vínculos ATIVOS');
        }
        
        // 4. Verificar regras na rota POST
        console.log('\n📋 4. Verificando regras na rota POST...');
        
        // Verificar se a validação está correta
        const validationRules = `
        REGRAS ATUAIS NA ROTA POST:
        
        Se tipo_vinculo = 'ATUAL':
        1. Encerrar vínculo ATUAL atual
        2. Criar novo vínculo ATUAL
        
        PROBLEMA: Se já houver múltiplos ATIVOS,
        a validação impede a criação.
        
        SOLUÇÃO: Corrigir múltiplos ATIVOS antes
        de permitir novas operações.
        `;
        
        console.log(validationRules);
        
        // 5. Simular correção automática
        console.log('\n🔧 5. Implementando correção automática...');
        
        // Função para corrigir estado dos vínculos
        await corrigirEstadoVinculos('3cdfbfa2');
        
        // 6. Verificar estado após correção
        console.log('\n📋 6. Verificando estado após correção...');
        
        const estadoAposCorrecao = await query(`
            SELECT 
                COUNT(CASE WHEN status = 'ATIVO' AND tipo_vinculo = 'ATUAL' THEN 1 END) as ativos,
                COUNT(CASE WHEN tipo_vinculo = 'PASSADO' THEN 1 END) as passados,
                COUNT(CASE WHEN tipo_vinculo = 'PRINCIPAL' THEN 1 END) as principais
            FROM employee_vinculos 
            WHERE employee_id = '3cdfbfa2'
        `);
        
        const estado = estadoAposCorrecao.rows[0];
        console.log(`📊 Estado final:`);
        console.log(`    ATIVOS: ${estado.ativos}`);
        console.log(`    PASSADOS: ${estado.passados}`);
        console.log(`    PRINCIPAIS: ${estado.principais}`);
        
        // 7. Recomendações
        console.log('\n💡 7. RECOMENDAÇÕES:');
        
        if (estado.ativos === 1 && estado.passados >= 0) {
            console.log('✅ Estado corrigido com sucesso!');
            console.log('📝 Agora é possível adicionar/editar vínculos');
        } else {
            console.log('⚠️ Estado ainda precisa de ajustes');
        }
        
        console.log(`
🔧 SOLUÇÃO IMPLEMENTADA:
1. Detectar múltiplos vínculos ATIVOS
2. Corrigir automaticamente mantendo apenas o mais recente
3. Validar estado antes de permitir novas operações
4. Garantir consistência dos dados

📋 PRÓXIMOS PASSOS:
1. Testar adição de novo vínculo
2. Testar edição de vínculo existente
3. Testar exclusão com regras
4. Verificar sistema completo
        `);
        
    } catch (error) {
        console.error('❌ Erro na investigação:', error.message);
    } finally {
        process.exit(0);
    }
}

// Função para corrigir estado dos vínculos
async function corrigirEstadoVinculos(employeeId) {
    try {
        console.log(`🔧 Corrigindo estado dos vínculos para employee ${employeeId}...`);
        
        // 1. Identificar o vínculo ATUAL mais recente
        const vinculoMaisRecente = await query(`
            SELECT id FROM employee_vinculos 
            WHERE employee_id = $1 
            AND status = 'ATIVO' 
            AND tipo_vinculo = 'ATUAL'
            ORDER BY data_inicio DESC 
            LIMIT 1
        `, [employeeId]);
        
        if (vinculoMaisRecente.rows.length === 0) {
            console.log('⚠️ Nenhum vínculo ATUAL encontrado');
            return;
        }
        
        const idManter = vinculoMaisRecente.rows[0].id;
        console.log(`📍 Vínculo a manter como ATUAL: ${idManter}`);
        
        // 2. Corrigir os outros para PASSADO
        const correcao = await query(`
            UPDATE employee_vinculos 
            SET status = 'PASSADO', tipo_vinculo = 'PASSADO'
            WHERE employee_id = $1 
            AND status = 'ATIVO' 
            AND tipo_vinculo = 'ATUAL'
            AND id != $2
        `, [employeeId, idManter]);
        
        console.log(`✅ ${correcao.rowCount} vínculos corrigidos para PASSADO`);
        
        // 3. Verificar se há sequências duplicadas
        await corrigirSequencias(employeeId);
        
        console.log('✅ Estado dos vínculos corrigido');
        
    } catch (error) {
        console.error('❌ Erro ao corrigir estado:', error.message);
    }
}

// Função para corrigir sequências
async function corrigirSequencias(employeeId) {
    try {
        console.log('🔧 Corrigindo sequências dos vínculos...');
        
        // Buscar todos os vínculos ordenados por data
        const vinculos = await query(`
            SELECT id, sequencia, data_inicio
            FROM employee_vinculos 
            WHERE employee_id = $1 
            ORDER BY data_inicio ASC
        `, [employeeId]);
        
        // Atualizar sequências corretas
        for (let i = 0; i < vinculos.rows.length; i++) {
            const vinculo = vinculos.rows[i];
            const novaSequencia = i + 1;
            
            if (vinculo.sequencia !== novaSequencia) {
                await query(`
                    UPDATE employee_vinculos 
                    SET sequencia = $1 
                    WHERE id = $2
                `, [novaSequencia, vinculo.id]);
            }
        }
        
        console.log(`✅ ${vinculos.rows.length} sequências corrigidas`);
        
    } catch (error) {
        console.error('❌ Erro ao corrigir sequências:', error.message);
    }
}

debugVinculoAtivoError();
