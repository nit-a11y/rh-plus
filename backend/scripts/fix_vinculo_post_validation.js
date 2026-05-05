const fs = require('fs');
const path = require('path');

async function fixVinculoPostValidation() {
    try {
        console.log('🔧 CORRIGINDO VALIDAÇÃO NA ROTA POST DE VÍNCULOS...');
        
        // 1. Ler o arquivo employees_pro.js
        console.log('\n📋 1. Lendo arquivo employees_pro.js...');
        
        const employeesProPath = path.join(__dirname, '../routes/employees_pro.js');
        
        if (!fs.existsSync(employeesProPath)) {
            console.log('❌ Arquivo employees_pro.js não encontrado');
            return;
        }
        
        let employeesContent = fs.readFileSync(employeesProPath, 'utf8');
        
        // 2. Encontrar a rota POST de vínculos
        console.log('\n📋 2. Encontrando rota POST de vínculos...');
        
        const postRouteStart = employeesContent.indexOf("router.post('/:id/vinculos'");
        const postRouteEnd = employeesContent.indexOf('});', postRouteStart) + 3;
        
        if (postRouteStart === -1) {
            console.log('❌ Rota POST de vínculos não encontrada');
            return;
        }
        
        const currentRoute = employeesContent.slice(postRouteStart, postRouteEnd);
        console.log('Rota atual encontrada');
        
        // 3. Identificar o problema na validação
        console.log('\n🔍 3. Analisando problema na validação...');
        
        if (currentRoute.includes("Já existe um vínculo ativo")) {
            console.log('✅ Problema identificado: Validação incorreta de múltiplos ATIVOS');
            
            // 4. Criar a rota corrigida
            console.log('\n🔧 4. Criando rota corrigida...');
            
            const correctedRoute = `
// Rota POST para adicionar novo vínculo (CORRIGIDA)
router.post('/:id/vinculos', async (req, res) => {
    const { id } = req.params;
    const { 
        employer_id, workplace_id, data_inicio, data_fim, 
        data_transferencia, tipo_vinculo, status 
    } = req.body;
    
    if (!employer_id || !workplace_id || !data_inicio) {
        return res.status(400).json({ 
            error: 'Empregador, local e data de início são obrigatórios' 
        });
    }
    
    try {
        await query('BEGIN');
        
        // VERIFICAÇÃO CORRIGIDA: Permitir múltiplos ATIVOS temporariamente
        // A validação será feita pela correção automática de estado
        
        // 1. Se for ATUAL, encerrar o vínculo ATUAL atual
        if (tipo_vinculo === 'ATUAL') {
            await query(\`
                UPDATE employee_vinculos 
                SET data_fim = \$1, 
                    data_transferencia = \$1,
                    status = 'TRANSFERIDO',
                    tipo_vinculo = 'PASSADO',
                    updated_at = CURRENT_TIMESTAMP
                WHERE employee_id = \$2 AND tipo_vinculo = 'ATUAL' AND status = 'ATIVO'
            \`, [data_inicio, id]);
        }
        
        // 2. Determinar sequência
        const maxSequencia = await query(\`
            SELECT COALESCE(MAX(sequencia), 0) + 1 as nova_sequencia
            FROM employee_vinculos 
            WHERE employee_id = \$1
        \`, [id]);
        
        const novaSequencia = maxSequencia.rows[0].nova_sequencia;
        
        // 3. Criar novo vínculo
        const vinculoId = require('crypto').randomBytes(8).toString('hex');
        
        await query(\`
            INSERT INTO employee_vinculos 
            (id, employee_id, employer_id, workplace_id, data_inicio, data_fim, 
             status, tipo_evento, principal, tipo_vinculo, sequencia, data_transferencia)
            VALUES (\$1, \$2, \$3, \$4, \$5, \$6, \$7, 'ADMISSAO', 'N', \$8, \$9, \$10)
        \`, [
            vinculoId, id, employer_id, workplace_id, data_inicio, data_fim,
            status || 'ATIVO', tipo_vinculo, novaSequencia, data_transferencia
        ]);
        
        // 4. Se for ATUAL, atualizar tabela employees
        if (tipo_vinculo === 'ATUAL') {
            await query(\`
                UPDATE employees 
                SET employer_id = \$1, workplace_id = \$2, updated_at = CURRENT_TIMESTAMP
                WHERE id = \$3
            \`, [employer_id, workplace_id, id]);
        }
        
        // 5. CORREÇÃO AUTOMÁTICA: Garantir apenas um ATUAL
        await query(\`
            UPDATE employee_vinculos 
            SET status = 'PASSADO', tipo_vinculo = 'PASSADO'
            WHERE employee_id = \$1 
            AND id != (
                SELECT id FROM (
                    SELECT id FROM employee_vinculos 
                    WHERE employee_id = \$1 
                    AND tipo_vinculo = 'ATUAL' 
                    ORDER BY data_inicio DESC 
                    LIMIT 1
                ) as sub
            )
            AND tipo_vinculo = 'ATUAL'
            AND status = 'ATIVO'
        \`, [id, vinculoId]);
        
        await query('COMMIT');
        
        res.json({
            success: true,
            message: 'Vínculo adicionado com sucesso',
            vinculo: {
                id: vinculoId,
                employee_id: id,
                employer_id,
                workplace_id,
                data_inicio,
                data_fim,
                data_transferencia,
                tipo_vinculo,
                status: status || 'ATIVO',
                sequencia: novaSequencia
            }
        });
        
    } catch (error) {
        await query('ROLLBACK');
        console.error('Erro ao adicionar vínculo:', error);
        res.status(500).json({ error: error.message });
    }
});
`;
            
            // 5. Substituir a rota antiga pela corrigida
            console.log('\n🔧 5. Substituindo rota...');
            
            employeesContent = employeesContent.slice(0, postRouteStart) + 
                             correctedRoute + 
                             employeesContent.slice(postRouteEnd);
            
            fs.writeFileSync(employeesProPath, employeesContent);
            
            console.log('✅ Rota POST de vínculos corrigida');
            console.log('🔧 Validação removida, correção automática implementada');
            
        } else {
            console.log('⚠️ Problema diferente do esperado');
        }
        
        // 6. Adicionar função de correção automática
        console.log('\n🔧 6. Adicionando função de correção automática...');
        
        const correctionFunction = `
// Função para corrigir estado de vínculos automaticamente
async function corrigirEstadoVinculos(employeeId) {
    try {
        console.log(\`🔧 Corrigindo estado dos vínculos para employee \${employeeId}...\`);
        
        // 1. Identificar todos os vínculos ATUAIS
        const ativos = await query(\`
            SELECT id, data_inicio FROM employee_vinculos 
            WHERE employee_id = \$1 
            AND tipo_vinculo = 'ATUAL' 
            AND status = 'ATIVO'
            ORDER BY data_inicio DESC
        \`, [employeeId]);
        
        if (ativos.rows.length <= 1) {
            console.log('✅ Estado já está correto');
            return;
        }
        
        // 2. Manter apenas o mais recente como ATUAL
        const idManter = ativos.rows[0].id;
        
        await query(\`
            UPDATE employee_vinculos 
            SET status = 'PASSADO', tipo_vinculo = 'PASSADO'
            WHERE employee_id = \$1 
            AND id != \$2
            AND tipo_vinculo = 'ATUAL'
            AND status = 'ATIVO'
        \`, [employeeId, idManter]);
        
        console.log(\`✅ \${ativos.rows.length - 1} vínculos corrigidos para PASSADO\`);
        
        // 3. Atualizar employees para o vínculo ATUAL correto
        const vinculoAtual = await query(\`
            SELECT employer_id, workplace_id FROM employee_vinculos 
            WHERE id = \$1
        \`, [idManter]);
        
        if (vinculoAtual.rows.length > 0) {
            await query(\`
                UPDATE employees 
                SET employer_id = \$1, workplace_id = \$2, updated_at = CURRENT_TIMESTAMP
                WHERE id = \$3
            \`, [
                vinculoAtual.rows[0].employer_id,
                vinculoAtual.rows[0].workplace_id,
                employeeId
            ]);
            
            console.log('✅ Tabela employees atualizada');
        }
        
        console.log('✅ Estado dos vínculos corrigido');
        
    } catch (error) {
        console.error('❌ Erro ao corrigir estado:', error.message);
    }
}
`;
        
        // 7. Adicionar a função antes do module.exports
        const moduleExportsIndex = employeesContent.indexOf('module.exports = router;');
        
        if (moduleExportsIndex !== -1) {
            employeesContent = employeesContent.slice(0, moduleExportsIndex) + 
                             correctionFunction + 
                             '\n\n' + 
                             employeesContent.slice(moduleExportsIndex);
            
            fs.writeFileSync(employeesProPath, employeesContent);
            
            console.log('✅ Função de correção automática adicionada');
        }
        
        // 8. Criar middleware para correção automática
        console.log('\n🔧 8. Criando middleware para correção automática...');
        
        const middlewareCode = `
// Middleware para correção automática de estado de vínculos
router.use('/:id/vinculos', async (req, res, next) => {
    const { id } = req.params;
    
    // Corrigir estado antes de processar a requisição
    await corrigirEstadoVinculos(id);
    
    next();
});
`;
        
        // Adicionar middleware antes das rotas de vínculos
        const postRouteIndex = employeesContent.indexOf("router.post('/:id/vinculos'");
        
        if (postRouteIndex !== -1) {
            employeesContent = employeesContent.slice(0, postRouteIndex) + 
                             middlewareCode + 
                             '\n\n' + 
                             employeesContent.slice(postRouteIndex);
            
            fs.writeFileSync(employeesProPath, employeesContent);
            
            console.log('✅ Middleware de correção automática adicionado');
        }
        
        console.log('\n🎉 CORREÇÃO IMPLEMENTADA:');
        console.log(`
✅ PROBLEMA IDENTIFICADO:
   Validação "Já existe um vínculo ativo" incorreta
   Não permitia múltiplos ATIVOS temporariamente

✅ SOLUÇÃO IMPLEMENTADA:
   1. Removida validação bloqueante
   2. Correção automática de estado implementada
   3. Middleware para correção antes das operações
   4. Garantia de consistência dos dados

✅ BENEFÍCIOS:
   - Sistema mais robusto e tolerante
   - Correção automática de inconsistências
   - Sem bloqueio por validação incorreta
   - Manutenção da integridade dos dados

✅ PRÓXIMOS PASSOS:
   1. Reiniciar servidor backend
   2. Testar adição de vínculos
   3. Testar edição de vínculos
   4. Verificar sistema completo
        `);
        
    } catch (error) {
        console.error('❌ Erro na correção:', error.message);
    } finally {
        process.exit(0);
    }
}

fixVinculoPostValidation();
