
const express = require('express');
const router = express.Router();
const { query, transaction } = require('../config/database');
const crypto = require('crypto');

const generateId = () => crypto.randomBytes(4).toString('hex');

const dbAll = async (sql, params = []) => {
    const result = await query(sql, params);
    return result.rows || [];
};

const dbGet = async (sql, params = []) => {
    const result = await query(sql, params);
    return result.rows[0] || null;
};

const dbRun = async (sql, params = []) => {
    const result = await query(sql, params);
    return result;
};

// Obter inventário e histórico unificado de um colaborador específico
router.get('/uniforms/employee/:id', async (req, res) => {
    try {
        const empId = req.params.id;
        if (!empId) return res.status(400).json({ error: 'ID inválido' });

        const sqlItems = `SELECT * FROM uniform_items WHERE employee_id = $1 AND status != 'Devolvido'`;
        const sqlHistory = `SELECT 
                                COALESCE(item_id, id::text) as id,
                                item_id, 
                                employee_id, 
                                type, 
                                color, 
                                tipo_movimentacao, 
                                status_peca, 
                                observacao, 
                                data_hora, 
                                responsavel 
                            FROM uniform_history 
                            WHERE employee_id = $1 
                            ORDER BY data_hora DESC`;

        const items = await dbAll(sqlItems, [empId]);
        const history = await dbAll(sqlHistory, [empId]);
        
        res.json({ items: items || [], history: history || [] });
    } catch (err) {
        res.status(500).json({ error: err.message, items: [], history: [] });
    }
});

// Adicionar Item Avulso
router.post('/uniforms/item', async (req, res) => {
    try {
        const { employeeId, type, color, size, dateGiven, responsible } = req.body;
        
        if (!employeeId || !type) return res.status(400).json({ error: 'Dados incompletos' });

        const emp = await dbGet(`SELECT type as emp_type FROM employees WHERE id = $1`, [employeeId]);
        if (!emp) return res.status(404).json({ error: 'Colaborador não encontrado' });

        const itemId = generateId();
        const cycle = (emp.emp_type === 'ADM') ? 12 : 6;
        const nextDate = new Date(dateGiven);
        nextDate.setMonth(nextDate.getMonth() + cycle);
        const nextExchangeDate = nextDate.toISOString().split('T')[0];

        await transaction(async (client) => {
            await client.query(`INSERT INTO uniform_items (id, employee_id, type, color, size, dateGiven, nextExchangeDate) 
                    VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [itemId, employeeId, type, color, size, dateGiven, nextExchangeDate]);

            await client.query(`INSERT INTO uniform_history (item_id, employee_id, type, color, tipo_movimentacao, status_peca, observacao, responsavel) 
                    VALUES ($1, $2, $3, $4, 'RECEBIMENTO', 'NOVO', 'Entrega de item avulso fora de kit.', $5)`,
                [itemId, employeeId, type, color, responsible || 'Sistema']);
        });
        
        res.json({ success: true, itemId });
    } catch (err) {
        console.error('Erro ao gravar item:', err);
        res.status(500).json({ error: 'Erro ao gravar item: ' + err.message });
    }
});

// Registrar Troca
router.post('/uniforms/exchange', async (req, res) => {
    try {
        const { itemId, date, nextExchangeDate, status, reason, observation, responsible } = req.body;
        const item = await dbGet(`SELECT employee_id, type, color FROM uniform_items WHERE id = $1`, [itemId]);
        if (!item) return res.status(404).json({ error: 'Item não localizado' });

        await transaction(async (client) => {
            await client.query(`UPDATE uniform_items SET dateGiven = $1, nextExchangeDate = $2, status = $3 WHERE id = $4`, 
                [date, nextExchangeDate, status, itemId]);
            const logObs = `TROCA: Motivo: ${reason}. Obs: ${observation || ''}`;
            await client.query(`INSERT INTO uniform_history (item_id, employee_id, type, color, tipo_movimentacao, status_peca, observacao, responsavel) VALUES ($1, $2, $3, $4, 'TROCA', $5, $6, $7)`,
                [itemId, item.employee_id, item.type, item.color, status, logObs, responsible]);
        });
        
        res.json({ success: true });
    } catch (err) {
        console.error('Erro na troca:', err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/uniforms/return', async (req, res) => {
    try {
        const { itemId, reason, observation, responsible } = req.body;
        const item = await dbGet(`SELECT employee_id, type, color FROM uniform_items WHERE id = $1`, [itemId]);
        if (!item) return res.status(404).json({ error: 'Item não localizado' });
        
        await transaction(async (client) => {
            await client.query(`UPDATE uniform_items SET status = 'Devolvido', nextExchangeDate = NULL WHERE id = $1`, [itemId]);
            await client.query(`INSERT INTO uniform_history (item_id, employee_id, type, color, tipo_movimentacao, status_peca, observacao, responsavel) VALUES ($1, $2, $3, $4, 'DEVOLUCAO', 'INATIVO', $5, $6)`,
                [itemId, item.employee_id, item.type, item.color, `DEVOLUCAO: ${reason}`, responsible]);
        });
        
        res.json({ success: true });
    } catch (err) {
        console.error('Erro na devolução:', err);
        res.status(500).json({ error: err.message });
    }
});

// Adicionar entrada diretamente ao histórico (sem afetar inventário)
router.post('/uniforms/history', async (req, res) => {
    try {
        const { employeeId, type, color, tipo_movimentacao, observacao, data_hora, responsavel } = req.body;
        
        if (!employeeId || !type || !tipo_movimentacao) {
            return res.status(400).json({ error: 'Dados incompletos' });
        }
        
        const itemId = generateId();
        const dateTime = data_hora || new Date().toISOString();
        
        await dbRun(`INSERT INTO uniform_history (item_id, employee_id, type, color, tipo_movimentacao, status_peca, observacao, data_hora, responsavel) 
                VALUES ($1, $2, $3, $4, $5, 'REGISTRO', $6, $7, $8)`,
            [itemId, employeeId, type, color || '-', tipo_movimentacao, observacao || '', dateTime, responsavel || 'Sistema']);
        
        res.json({ success: true, historyId: itemId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Buscar peças do inventário atual do colaborador para o dropdown de registro
router.get('/uniforms/available-types/:employeeId', async (req, res) => {
    try {
        const empId = req.params.employeeId;
        
        // Busca peças ativas do inventário do colaborador
        const items = await dbAll(
            `SELECT id, type, color, size FROM uniform_items 
             WHERE employee_id = $1 AND status != 'Devolvido' AND status != 'INATIVO'
             ORDER BY type, color`,
            [empId]
        );

        res.json({ types: items || [] });
    } catch (err) {
        res.status(500).json({ error: err.message, types: [] });
    }
});

// Registrar Item Histórico (apenas histórico, sem afetar inventário atual)
router.post('/uniforms/register-history', async (req, res) => {
    try {
        const { employeeId, type, color, tipo_movimentacao, observacao, data_hora, responsible } = req.body;
        
        if (!employeeId || !type || !tipo_movimentacao) {
            return res.status(400).json({ error: 'Dados incompletos' });
        }
        
        const emp = await dbGet(`SELECT type as emp_type FROM employees WHERE id = $1`, [employeeId]);
        if (!emp) return res.status(404).json({ error: 'Colaborador não encontrado' });

        const itemId = generateId();
        const dateTime = data_hora || new Date().toISOString();
        const statusPeca = tipo_movimentacao === 'DEVOLUCAO' ? 'INATIVO' : 'REGISTRO';
        
        // Insere o registro e retorna o ID gerado (PostgreSQL)
        const insertResult = await query(
            `INSERT INTO uniform_history (item_id, employee_id, type, color, tipo_movimentacao, status_peca, observacao, data_hora, responsavel) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING id`,
            [itemId, employeeId, type, color || '-', tipo_movimentacao, statusPeca, observacao || '', dateTime, responsible || 'Sistema']
        );
        
        const generatedId = insertResult.rows[0]?.id || itemId;
        console.log('Registro inserido com ID:', generatedId, 'item_id:', itemId);
        
        res.json({ success: true, historyId: generatedId, itemId });
    } catch (err) {
        console.error('Erro ao registrar histórico:', err);
        res.status(500).json({ error: 'Erro ao registrar: ' + err.message });
    }
});

// Buscar histórico por ID ou item_id
router.get('/uniforms/history/:id', async (req, res) => {
    try {
        const historyId = req.params.id;
        
        console.log('Buscando histórico com ID:', historyId);
        
        // Tenta buscar por id (converte para int se for número) ou item_id (text)
        let history = null;
        
        // Se parece ser número (ID inteiro), busca por id
        if (/^\d+$/.test(historyId)) {
            history = await dbGet(`SELECT * FROM uniform_history WHERE id = $1`, [parseInt(historyId)]);
        }
        
        // Se não encontrou ou é string (UUID/hex), busca por item_id
        if (!history) {
            history = await dbGet(`SELECT * FROM uniform_history WHERE item_id = $1`, [historyId]);
        }
        
        console.log('Resultado busca:', history ? 'encontrado' : 'não encontrado');
        
        if (!history) {
            return res.status(404).json({ error: 'Registro não encontrado' });
        }
        
        res.json(history);
    } catch (err) {
        console.error('Erro ao buscar histórico:', err);
        res.status(500).json({ error: err.message });
    }
});

// Atualizar histórico (PUT) - suporta id ou item_id
router.put('/uniforms/history/:id', async (req, res) => {
    try {
        const historyId = req.params.id;
        const { type, color, tipo_movimentacao, observacao, data_hora, responsavel } = req.body;
        
        // Determina se é ID numérico ou item_id string
        const isNumeric = /^\d+$/.test(historyId);
        
        // Verifica se registro existe
        let existing = null;
        let whereClause = '';
        let queryId = historyId;
        
        if (isNumeric) {
            existing = await dbGet(`SELECT id FROM uniform_history WHERE id = $1`, [parseInt(historyId)]);
            whereClause = 'id = $7';
            queryId = parseInt(historyId);
        }
        
        if (!existing) {
            existing = await dbGet(`SELECT id FROM uniform_history WHERE item_id = $1`, [historyId]);
            whereClause = 'item_id = $7';
        }
        
        if (!existing) {
            return res.status(404).json({ error: 'Registro não encontrado' });
        }
        
        // Atualiza registro
        await dbRun(`UPDATE uniform_history 
                     SET type = $1, 
                         color = $2, 
                         tipo_movimentacao = $3, 
                         observacao = $4, 
                         data_hora = $5,
                         responsavel = $6
                     WHERE ${whereClause}`,
            [
                type || '-',
                color || '-', 
                tipo_movimentacao || 'RECEBIMENTO',
                observacao || '',
                data_hora || new Date().toISOString(),
                responsavel || 'Sistema',
                queryId
            ]
        );
        
        res.json({ success: true, message: 'Registro atualizado com sucesso' });
    } catch (err) {
        console.error('Erro ao atualizar histórico:', err);
        res.status(500).json({ error: 'Erro ao atualizar: ' + err.message });
    }
});

// Excluir histórico (DELETE) - suporta id ou item_id
router.delete('/uniforms/history/:id', async (req, res) => {
    try {
        const historyId = req.params.id;
        
        // Determina se é ID numérico ou item_id string
        const isNumeric = /^\d+$/.test(historyId);
        
        // Verifica se registro existe
        let existing = null;
        let whereClause = '';
        let queryId = historyId;
        
        if (isNumeric) {
            existing = await dbGet(`SELECT id FROM uniform_history WHERE id = $1`, [parseInt(historyId)]);
            whereClause = 'id = $1';
            queryId = parseInt(historyId);
        }
        
        if (!existing) {
            existing = await dbGet(`SELECT id FROM uniform_history WHERE item_id = $1`, [historyId]);
            whereClause = 'item_id = $1';
        }
        
        if (!existing) {
            return res.status(404).json({ error: 'Registro não encontrado' });
        }
        
        // Exclui registro
        await dbRun(`DELETE FROM uniform_history WHERE ${whereClause}`, [queryId]);
        
        res.json({ success: true, message: 'Registro excluído com sucesso' });
    } catch (err) {
        console.error('Erro ao excluir histórico:', err);
        res.status(500).json({ error: 'Erro ao excluir: ' + err.message });
    }
});

module.exports = router;
