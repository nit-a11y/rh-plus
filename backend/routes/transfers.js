const express = require('express');
const crypto = require('crypto');
const { query, transaction } = require('../config/database');

const router = express.Router();
const generateId = () => crypto.randomBytes(8).toString('hex');

// Função utilitária para obter vínculo ativo
async function getVinculoAtual(employeeId) {
    const result = await query(`
        SELECT * FROM employee_vinculos 
        WHERE employee_id = $1 AND status = 'ATIVO' 
        ORDER BY data_inicio DESC 
        LIMIT 1
    `, [employeeId]);
    return result.rows[0] || null;
}

// Registrar transferência de empregador/unidade (REFATORADO)

// Função utilitária para obter vínculo atual
async function getVinculoAtual(employeeId) {
    const result = await query(`
        SELECT * FROM employee_vinculos 
        WHERE employee_id = $1 AND tipo_vinculo = 'ATUAL' AND status = 'ATIVO'
        ORDER BY sequencia DESC 
        LIMIT 1
    `, [employeeId]);
    return result.rows[0] || null;
}

// Rota de transferência com datas de mudança
router.post('/employee/:id', async (req, res) => {
    const { id } = req.params;
    const { to_employer_id, to_workplace_id, reason, changed_by } = req.body;
    
    if (!to_employer_id && !to_workplace_id) {
        return res.status(400).json({ error: 'Informe pelo menos empregador ou unidade de destino' });
    }

    try {
        // Iniciar transação
        await query('BEGIN');
        
        // 1. Buscar dados atuais do colaborador
        const empResult = await query('SELECT * FROM employees WHERE id = $1', [id]);
        const emp = empResult.rows[0];

        if (!emp) {
            await query('ROLLBACK');
            return res.status(404).json({ error: 'Colaborador não encontrado' });
        }

        // 2. Buscar vínculo atual
        const vinculoAtual = await getVinculoAtual(id);
        
        if (!vinculoAtual) {
            await query('ROLLBACK');
            return res.status(400).json({ error: 'Nenhum vínculo ativo encontrado' });
        }

        // 3. Definir data da transferência (marcador temporal)
        const dataTransferencia = new Date();
        const novaSequencia = (vinculoAtual.sequencia || 1) + 1;

        // 4. Atualizar vínculo atual para PASSADO com data de transferência
        await query(`
            UPDATE employee_vinculos 
            SET data_fim = $1, 
                data_transferencia = $1,
                status = 'TRANSFERIDO',
                tipo_vinculo = 'PASSADO',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
        `, [dataTransferencia, vinculoAtual.id]);

        // 5. Criar novo vínculo ATUAL
        const novoVinculoId = generateId();
        await query(`
            INSERT INTO employee_vinculos 
            (id, employee_id, employer_id, workplace_id, data_inicio, data_fim, 
             status, tipo_evento, principal, tipo_vinculo, sequencia, data_transferencia)
            VALUES ($1, $2, $3, $4, $5, NULL, 'ATIVO', 'TRANSFERENCIA', 'N', 'ATUAL', $6, NULL)
        `, [
            novoVinculoId, 
            id, 
            to_employer_id || vinculoAtual.employer_id, 
            to_workplace_id || vinculoAtual.workplace_id,
            dataTransferencia,
            novaSequencia
        ]);

        // 6. Atualizar tabela employees (retrocompatibilidade)
        await query(`
            UPDATE employees 
            SET employer_id = $1, workplace_id = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
        `, [to_employer_id || vinculoAtual.employer_id, to_workplace_id || vinculoAtual.workplace_id, id]);

        // 7. Registrar transferência no histórico
        const transferId = generateId();
        await query(`
            INSERT INTO employee_vinculo_transfers 
            (id, employee_id, from_employer_id, from_workplace_id, to_employer_id, to_workplace_id, changed_by, observation, data_transferencia)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
            transferId, 
            id, 
            vinculoAtual.employer_id, 
            vinculoAtual.workplace_id, 
            to_employer_id || vinculoAtual.employer_id, 
            to_workplace_id || vinculoAtual.workplace_id, 
            changed_by, 
            reason,
            dataTransferencia
        ]);

        // 8. Adicionar ao histórico de carreira
        const careerId = generateId();
        await query(`
            INSERT INTO career_history 
            (id, employee_id, role, sector, salary, move_type, date, responsible, observation)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
            careerId, 
            id, 
            emp.role, 
            emp.sector, 
            emp.currentSalary, 
            'TRANSFERENCIA', 
            dataTransferencia.toISOString().split('T')[0], 
            changed_by, 
            reason
        ]);

        // 9. Commit da transação
        await query('COMMIT');

        // 10. Buscar nomes para retorno
        const [fromEmployer, toEmployer, fromWorkplace, toWorkplace] = await Promise.all([
            vinculoAtual.employer_id ? query('SELECT name FROM companies WHERE id = $1', [vinculoAtual.employer_id]).then(r => r.rows[0]) : null,
            to_employer_id ? query('SELECT name FROM companies WHERE id = $1', [to_employer_id]).then(r => r.rows[0]) : null,
            vinculoAtual.workplace_id ? query('SELECT name FROM companies WHERE id = $1', [vinculoAtual.workplace_id]).then(r => r.rows[0]) : null,
            to_workplace_id ? query('SELECT name FROM companies WHERE id = $1', [to_workplace_id]).then(r => r.rows[0]) : null
        ]);

        res.json({
            success: true,
            transfer: {
                id: transferId,
                employee_name: emp.name,
                from_employer: fromEmployer?.name,
                to_employer: toEmployer?.name,
                from_workplace: fromWorkplace?.name,
                to_workplace: toWorkplace?.name,
                data_transferencia: dataTransferencia,
                sequencia_antiga: vinculoAtual.sequencia,
                sequencia_nova: novaSequencia,
                date: dataTransferencia.toISOString().split('T')[0],
                changed_by
            },
            novo_vinculo: {
                id: novoVinculoId,
                sequencia: novaSequencia,
                data_inicio: dataTransferencia,
                tipo_vinculo: 'ATUAL'
            }
        });

    } catch (error) {
        await query('ROLLBACK');
        console.error('Erro na transferência:', error);
        res.status(500).json({ error: error.message });
    }
});

// Rota GET para obter histórico de transferências de um colaborador
router.get('/employee/:id/history', async (req, res) => {
    const { id } = req.params;
    
    try {
        // Buscar histórico de transferências
        const transferHistory = await query(`
            SELECT 
                evt.*,
                emp_from.name as from_employer_name,
                emp_to.name as to_employer_name,
                wp_from.name as from_workplace_name,
                wp_to.name as to_workplace_name
            FROM employee_vinculo_transfers evt
            LEFT JOIN companies emp_from ON evt.from_employer_id = emp_from.id
            LEFT JOIN companies emp_to ON evt.to_employer_id = emp_to.id
            LEFT JOIN companies wp_from ON evt.from_workplace_id = wp_from.id
            LEFT JOIN companies wp_to ON evt.to_workplace_id = wp_to.id
            WHERE evt.employee_id = $1
            ORDER BY evt.changed_at DESC
        `, [id]);

        // Buscar histórico de vínculos
        const vinculosHistory = await query(`
            SELECT 
                ev.*,
                emp.name as employer_name,
                wp.name as workplace_name
            FROM employee_vinculos ev
            LEFT JOIN companies emp ON ev.employer_id = emp.id
            LEFT JOIN companies wp ON ev.workplace_id = wp.id
            WHERE ev.employee_id = $1
            ORDER BY ev.sequencia
        `, [id]);

        res.json({
            success: true,
            transfer_history: transferHistory.rows,
            vinculos_history: vinculosHistory.rows
        });

    } catch (error) {
        console.error('Erro na transferência:', error);
        res.status(500).json({ error: error.message });
    }
});

// Listar todas as transferências
router.get('/all', async (req, res) => {
    try {
        const result = await query(`
            SELECT t.*, 
                   fe.name as from_employer_name,
                   te.name as to_employer_name,
                   fw.name as from_workplace_name,
                   tw.name as to_workplace_name,
                   e.name as employee_name
            FROM employee_vinculo_transfers t
            LEFT JOIN employees e ON t.employee_id = e.id
            LEFT JOIN companies fe ON t.from_employer_id = fe.id
            LEFT JOIN companies te ON t.to_employer_id = te.id
            LEFT JOIN companies fw ON t.from_workplace_id = fw.id
            LEFT JOIN companies tw ON t.to_workplace_id = tw.id
            WHERE t.employee_id = $1
            ORDER BY t.changed_at DESC
        `, [id]);

        res.json(result.rows || []);
    } catch (error) {
        console.error('Erro ao buscar histórico:', error);
        res.status(500).json({ error: error.message });
    }
});

// Listar todas as transferências (admin)
router.get('/all', async (req, res) => {
    try {
        const result = await query(`
            SELECT t.*, 
                   fe.name as from_employer_name,
                   te.name as to_employer_name,
                   fw.name as from_workplace_name,
                   tw.name as to_workplace_name,
                   e.name as employee_name,
                   e.registrationNumber
            FROM employee_vinculo_transfers t
            LEFT JOIN employees e ON t.employee_id = e.id
            LEFT JOIN companies fe ON t.from_employer_id = fe.id
            LEFT JOIN companies te ON t.to_employer_id = te.id
            LEFT JOIN companies fw ON t.from_workplace_id = fw.id
            LEFT JOIN companies tw ON t.to_workplace_id = tw.id
            ORDER BY t.changed_at DESC
        `);

        res.json(result.rows || []);
    } catch (error) {
        console.error('Erro ao listar transferências:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
