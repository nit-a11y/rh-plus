const { query } = require('../config/database');

async function createVinculoDeleteRoutes() {
    try {
        console.log('🔧 CRIANDO ROTAS PARA EXCLUSÃO DE VÍNCULOS...');
        
        // 1. Verificar se já existe a rota DELETE em employees_pro.js
        console.log('\n📋 1. Verificando rotas existentes...');
        
        const fs = require('fs');
        const path = require('path');
        
        const employeesProPath = path.join(__dirname, '../routes/employees_pro.js');
        
        if (!fs.existsSync(employeesProPath)) {
            console.log('❌ Arquivo employees_pro.js não encontrado');
            return;
        }
        
        let employeesContent = fs.readFileSync(employeesProPath, 'utf8');
        
        // 2. Adicionar rota DELETE para vínculos
        console.log('\n🔧 2. Adicionando rota DELETE para vínculos...');
        
        const deleteRoute = `
// Rota DELETE para excluir vínculo específico
router.delete('/:id/vinculos/:vinculoId', async (req, res) => {
    const { id, vinculoId } = req.params;
    
    try {
        // Iniciar transação
        await query('BEGIN');
        
        // 1. Verificar se o vínculo existe e pertence ao employee
        const vinculoCheck = await query(\`
            SELECT ev.*, 
                   COUNT(*) OVER() as total_vinculos,
                   COUNT(CASE WHEN ev.tipo_vinculo = 'ATUAL' AND ev.status = 'ATIVO' THEN 1 END) OVER() as ativos_count
            FROM employee_vinculos ev
            WHERE ev.id = \$1 AND ev.employee_id = \$2
        \`, [vinculoId, id]);
        
        if (vinculoCheck.rows.length === 0) {
            await query('ROLLBACK');
            return res.status(404).json({ error: 'Vínculo não encontrado' });
        }
        
        const vinculo = vinculoCheck.rows[0];
        const totalVinculos = vinculo.total_vinculos;
        const ativosCount = vinculo.ativos_count;
        
        // 2. Aplicar regras de exclusão
        const deleteRules = validateDeleteRules(vinculo, totalVinculos, ativosCount);
        
        if (!deleteRules.canDelete) {
            await query('ROLLBACK');
            return res.status(400).json({ error: deleteRules.reason });
        }
        
        // 3. Se for o único vínculo, também limpar a tabela employees
        if (totalVinculos === 1) {
            await query(\`
                UPDATE employees 
                SET employer_id = NULL, workplace_id = NULL, updated_at = CURRENT_TIMESTAMP
                WHERE id = \$1
            \`, [id]);
            
            console.log('✅ Tabela employees limpa (único vínculo removido)');
        }
        
        // 4. Se for vínculo ATUAL e houver PASSADOS, promover o mais recente
        if (vinculo.tipo_vinculo === 'ATUAL' && vinculo.status === 'ATIVO') {
            const promoteVinculo = await query(\`
                SELECT id FROM employee_vinculos 
                WHERE employee_id = \$1 AND id != \$2 
                ORDER BY data_inicio DESC 
                LIMIT 1
            \`, [id, vinculoId]);
            
            if (promoteVinculo.rows.length > 0) {
                await query(\`
                    UPDATE employee_vinculos 
                    SET tipo_vinculo = 'ATUAL', status = 'ATIVO', updated_at = CURRENT_TIMESTAMP
                    WHERE id = \$1
                \`, [promoteVinculo.rows[0].id]);
                
                // Atualizar employees para o novo vínculo ATUAL
                await query(\`
                    UPDATE employees e
                    SET employer_id = ev.employer_id, 
                        workplace_id = ev.workplace_id,
                        updated_at = CURRENT_TIMESTAMP
                    FROM employee_vinculos ev
                    WHERE e.id = \$1 AND ev.id = \$2
                \`, [id, promoteVinculo.rows[0].id]);
                
                console.log('✅ Vínculo promovido para ATUAL');
            }
        }
        
        // 5. Registrar exclusão no log
        await query(\`
            INSERT INTO operation_logs 
            (id, operation_type, table_name, record_id, old_data, status, created_at)
            VALUES (\$1, \$2, \$3, \$4, \$5, \$6, CURRENT_TIMESTAMP)
        \`, [
            require('crypto').randomBytes(8).toString('hex'),
            'DELETE',
            'employee_vinculos',
            vinculoId,
            JSON.stringify(vinculo),
            'SUCCESS'
        ]);
        
        // 6. Excluir o vínculo
        await query(\`
            DELETE FROM employee_vinculos 
            WHERE id = \$1 AND employee_id = \$2
        \`, [vinculoId, id]);
        
        // 7. Commit da transação
        await query('COMMIT');
        
        console.log(\`✅ Vínculo \${vinculoId} excluído com sucesso\`);
        
        res.json({
            success: true,
            message: 'Vínculo excluído com sucesso',
            vinculo_excluido: {
                id: vinculoId,
                employer_id: vinculo.employer_id,
                workplace_id: vinculo.workplace_id,
                sequencia: vinculo.sequencia,
                tipo_vinculo: vinculo.tipo_vinculo
            }
        });
        
    } catch (error) {
        await query('ROLLBACK');
        console.error('Erro ao excluir vínculo:', error);
        res.status(500).json({ error: error.message });
    }
});

// Função para validar regras de exclusão
function validateDeleteRules(vinculo, totalVinculos, ativosCount) {
    // Regra 1: Não pode excluir o único vínculo
    if (totalVinculos === 1) {
        return {
            canDelete: false,
            reason: 'Não é possível excluir o único vínculo do colaborador. Adicione um novo vínculo antes de excluir este.'
        };
    }
    
    // Regra 2: Pode excluir vínculos PASSADOS
    if (vinculo.tipo_vinculo === 'PASSADO') {
        return { canDelete: true };
    }
    
    // Regra 3: Pode excluir vínculo ATUAL se não houver PASSADOS
    if (vinculo.tipo_vinculo === 'ATUAL' && vinculo.status === 'ATIVO') {
        const hasPastVinculos = totalVinculos > ativosCount;
        
        if (hasPastVinculos) {
            return {
                canDelete: false,
                reason: 'Não é possível excluir o vínculo ATUAL enquanto houver vínculos PASSADOS. Exclua os vínculos PASSADOS primeiro.'
            };
        }
        
        return { canDelete: true };
    }
    
    // Regra 4: Pode excluir vínculos ENCERRADOS/TRANSFERIDOS
    if (vinculo.status === 'ENCERRADO' || vinculo.status === 'TRANSFERIDO') {
        return { canDelete: true };
    }
    
    return {
        canDelete: false,
        reason: 'Regras de exclusão não permitem esta operação.'
    };
}
`;
        
        // Verificar se a rota já existe
        if (employeesContent.includes("router.delete('/:id/vinculos/:vinculoId'")) {
            console.log('✅ Rota DELETE para vínculos já existe');
        } else {
            // Adicionar a rota antes do module.exports
            const moduleExportsIndex = employeesContent.indexOf('module.exports = router;');
            
            if (moduleExportsIndex !== -1) {
                employeesContent = employeesContent.slice(0, moduleExportsIndex) + 
                                 deleteRoute + 
                                 '\n\n' + 
                                 employeesContent.slice(moduleExportsIndex);
                
                fs.writeFileSync(employeesProPath, employeesContent);
                console.log('✅ Rota DELETE para vínculos adicionada');
            } else {
                console.log('⚠️ Não foi possível encontrar module.exports para adicionar a rota');
            }
        }
        
        // 3. Adicionar rota GET para listar vínculos com histórico
        console.log('\n🔧 3. Adicionando rota GET para vínculos...');
        
        const getRoute = `
// Rota GET para obter vínculos com histórico completo
router.get('/:id/vinculos-com-historico', async (req, res) => {
    const { id } = req.params;
    
    try {
        // Buscar todos os vínculos do colaborador
        const vinculos = await query(\`
            SELECT 
                ev.*,
                emp.name as employer_name,
                emp.cnpj as employer_cnpj,
                wp.name as workplace_name,
                wp.cnpj as workplace_cnpj,
                CASE 
                    WHEN ev.data_transferencia IS NOT NULL THEN 
                        'Transferido em ' || TO_CHAR(ev.data_transferencia, 'DD/MM/YYYY HH:MI')
                    WHEN ev.data_fim IS NOT NULL THEN 
                        'Encerrado em ' || TO_CHAR(ev.data_fim, 'DD/MM/YYYY')
                    ELSE 'Vínculo atual'
                END as status_descricao,
                CASE 
                    WHEN ev.sequencia = 1 THEN 'PRINCIPAL'
                    WHEN ev.tipo_vinculo = 'ATUAL' THEN 'ATUAL'
                    ELSE 'PASSADO'
                END as tipo_descricao
            FROM employee_vinculos ev
            LEFT JOIN companies emp ON ev.employer_id = emp.id
            LEFT JOIN companies wp ON ev.workplace_id = wp.id
            WHERE ev.employee_id = \$1 
            ORDER BY ev.sequencia
        \`, [id]);
        
        res.json(vinculos.rows);
        
    } catch (error) {
        console.error('Erro ao buscar vínculos:', error);
        res.status(500).json({ error: error.message });
    }
});
`;
        
        // Verificar se a rota GET já existe
        if (employeesContent.includes("router.get('/:id/vinculos-com-historico'")) {
            console.log('✅ Rota GET para vínculos já existe');
        } else {
            // Adicionar a rota antes do module.exports
            const moduleExportsIndex = employeesContent.indexOf('module.exports = router;');
            
            if (moduleExportsIndex !== -1) {
                employeesContent = employeesContent.slice(0, moduleExportsIndex) + 
                                 getRoute + 
                                 '\n\n' + 
                                 employeesContent.slice(moduleExportsIndex);
                
                fs.writeFileSync(employeesProPath, employeesContent);
                console.log('✅ Rota GET para vínculos adicionada');
            }
        }
        
        // 4. Criar rota POST para adicionar novos vínculos
        console.log('\n🔧 4. Adicionando rota POST para vínculos...');
        
        const postRoute = `
// Rota POST para adicionar novo vínculo
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
        
        // Verificar se a rota POST já existe
        if (employeesContent.includes("router.post('/:id/vinculos'")) {
            console.log('✅ Rota POST para vínculos já existe');
        } else {
            // Adicionar a rota antes do module.exports
            const moduleExportsIndex = employeesContent.indexOf('module.exports = router;');
            
            if (moduleExportsIndex !== -1) {
                employeesContent = employeesContent.slice(0, moduleExportsIndex) + 
                                 postRoute + 
                                 '\n\n' + 
                                 employeesContent.slice(moduleExportsIndex);
                
                fs.writeFileSync(employeesProPath, employeesContent);
                console.log('✅ Rota POST para vínculos adicionada');
            }
        }
        
        console.log('\n🎉 ROTAS DE VÍNCULOS IMPLEMENTADAS:');
        console.log(`
✅ DELETE /:id/vinculos/:vinculoId - Excluir vínculo específico
✅ GET /:id/vinculos-com-historico - Listar vínculos com histórico
✅ POST /:id/vinculos - Adicionar novo vínculo

🔧 REGRAS DE EXCLUSÃO:
1. Não pode excluir o único vínculo
2. Pode excluir vínculos PASSADOS
3. Pode excluir ATUAL se não houver PASSADOS
4. Promove automaticamente o próximo vínculo

📋 FUNCIONALIDADES:
- Validação de regras de negócio
- Transações seguras com rollback
- Atualização automática da tabela employees
- Logs de operações
- Promoção automática de vínculos
        `);
        
    } catch (error) {
        console.error('❌ Erro ao criar rotas:', error.message);
    } finally {
        process.exit(0);
    }
}

createVinculoDeleteRoutes();
