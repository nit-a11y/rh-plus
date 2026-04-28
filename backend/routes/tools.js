const express = require('express');
const crypto = require('crypto');
const { query } = require('../config/database');

const router = express.Router();
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

// Pega ferramentas e histórico do empregado
router.get('/employee/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = { items: [], history: [], employee: null };

        const emp = await dbGet(`SELECT e.*, c.name as employer_name, w.name as workplace_name 
                FROM employees e 
                LEFT JOIN companies c ON e.employer_id = c.id 
                LEFT JOIN companies w ON e.workplace_id = w.id 
                WHERE e.id = $1`, [id]);
        data.employee = emp;

        data.items = await dbAll(`SELECT * FROM tool_items WHERE employee_id = $1 AND status != 'REMOVIDO'`, [id]);
        data.history = await dbAll(`SELECT * FROM tool_history WHERE employee_id = $1 ORDER BY data_hora DESC`, [id]);
        
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Registrar nova entrega de ferramenta
router.post('/item', async (req, res) => {
    try {
        const { employeeId, type, brand, model, serial_number, patrimonio, accessories, date_given, responsible } = req.body;
        const id = generateId();

        await dbRun(
            `INSERT INTO tool_items (id, employee_id, type, brand, model, serial_number, patrimonio, accessories, date_given, status) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Em uso')`,
            [id, employeeId, type, brand, model, serial_number, patrimonio, accessories, date_given]
        );

        await dbRun(
            `INSERT INTO tool_history (tool_id, employee_id, action, status_item, observation, responsavel) 
             VALUES ($1, $2, 'ENTREGA', 'NOVO', $3, $4)`,
            [id, employeeId, `Entrega de ${type} - ${brand} ${model}`, responsible || 'Sistema']
        );
        
        res.json({ success: true, id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Devolver ferramenta
router.post('/return', async (req, res) => {
    try {
        const { toolId, reason, observation, responsible } = req.body;

        const item = await dbGet(`SELECT * FROM tool_items WHERE id = $1`, [toolId]);
        if (!item) return res.status(404).json({ error: 'Item não localizado' });

        await dbRun(`UPDATE tool_items SET status = 'Disponível', employee_id = NULL WHERE id = $1`, [toolId]);

        await dbRun(
            `INSERT INTO tool_history (tool_id, employee_id, action, status_item, observation, responsavel) 
             VALUES ($1, $2, 'DEVOLUCAO', 'RETORNO ESTOQUE', $3, $4)`,
            [toolId, item.employee_id, reason, observation || 'Retorno ao estoque para disponibilidade', responsible || 'Sistema']
        );
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Listar todos os ativos do inventário global
router.get('/all', async (req, res) => {
    try {
        const sql = `
            SELECT t.*, 
                   e.name as employee_name, e.sector as employee_sector, e."registrationNumber",
                   c.name as employer_name, w.name as workplace_name
            FROM tool_items t
            LEFT JOIN employees e ON t.employee_id = e.id
            LEFT JOIN companies c ON e.employer_id = c.id
            LEFT JOIN companies w ON e.workplace_id = w.id
            WHERE t.status != 'REMOVIDO'
            ORDER BY t.patrimonio ASC
        `;
        const rows = await dbAll(sql, []);
        res.json(rows || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Listar apenas equipamentos disponíveis em estoque
router.get('/available', async (req, res) => {
    try {
        const sql = `
            SELECT t.*, 
                   COALESCE(t.unit, 'ESTOQUE') as unit
            FROM tool_items t
            WHERE t.employee_id IS NULL 
            AND t.status = 'Disponível'
            AND t.status != 'REMOVIDO'
            ORDER BY t.type ASC, t.patrimonio ASC
        `;
        const rows = await dbAll(sql, []);
        res.json(rows || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Obter dados individuais de um equipamento
router.get('/item/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const sql = `
            SELECT t.*, 
                   e.name as employee_name, e.sector as employee_sector, e."registrationNumber",
                   c.name as employer_name, w.name as workplace_name
            FROM tool_items t
            LEFT JOIN employees e ON t.employee_id = e.id
            LEFT JOIN companies c ON e.employer_id = c.id
            LEFT JOIN companies w ON e.workplace_id = w.id
            WHERE t.id = $1 AND t.status != 'REMOVIDO'
        `;
        const item = await dbGet(sql, [id]);
        
        if (!item) {
            return res.status(404).json({ error: 'Equipamento não encontrado' });
        }
        
        res.json(item);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Estatísticas globais do painel de gestão
router.get('/stats', async (req, res) => {
    try {
        const stats = { total: 0, alocados: 0, disponiveis: 0, employeeCount: 0, byUnit: [] };
        
        const row = await dbGet(`SELECT COUNT(*) as total, 
                       SUM(CASE WHEN employee_id IS NOT NULL THEN 1 ELSE 0 END) as alocados,
                       SUM(CASE WHEN employee_id IS NULL THEN 1 ELSE 0 END) as disponiveis
                 FROM tool_items WHERE status != 'REMOVIDO'`, []);
        
        stats.total = row.total || 0;
        stats.alocados = row.alocados || 0;
        stats.disponiveis = row.disponiveis || 0;

        const rowE = await dbGet(`SELECT COUNT(*) as count FROM employees WHERE type != 'Desligado'`, []);
        stats.employeeCount = rowE.count || 0;

        const rowsU = await dbAll(`SELECT COALESCE(t.unit, 'ESTOQUE') as unit, COUNT(t.id) as count 
                FROM tool_items t
                WHERE t.status != 'REMOVIDO'
                GROUP BY unit`, []);
        stats.byUnit = rowsU || [];
        
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Processar troca de equipamento (Swap)
router.post('/swap', async (req, res) => {
    try {
        const { oldToolId, newToolId, newTool, swapType, reason, notes, responsible } = req.body;

        await query('BEGIN TRANSACTION');
        
        // Primeiro, liberar o equipamento antigo
        const oldItem = await dbGet(`SELECT * FROM tool_items WHERE id = $1`, [oldToolId]);
        if (!oldItem) {
            await query('ROLLBACK');
            return res.status(404).json({ error: 'Equipamento antigo não encontrado' });
        }
        
        await dbRun(`UPDATE tool_items SET status = 'Disponível', employee_id = NULL WHERE id = $1`, [oldToolId]);
        await dbRun(`INSERT INTO tool_history (tool_id, employee_id, action, status_item, observation, responsavel) 
                VALUES ($1, $2, 'DEVOLUCAO', 'TROCA', $3, $4)`, 
                [oldToolId, oldItem.employee_id, `Recolhido para troca: ${reason}${notes ? ' - ' + notes : ''}`, responsible]);

        let newToolAssignedId;
        
        if (swapType === 'available') {
            // Usar máquina existente do estoque
            if (!newToolId) {
                await query('ROLLBACK');
                return res.status(400).json({ error: 'ID da nova máquina não fornecido' });
            }
            
            // Alocar a máquina disponível para o funcionário
            await dbRun(`UPDATE tool_items SET status = 'Em uso', employee_id = $1, date_given = $2 WHERE id = $3`, 
                [oldItem.employee_id, new Date().toISOString().split('T')[0], newToolId]);
            
            await dbRun(`INSERT INTO tool_history (tool_id, employee_id, action, status_item, observation, responsavel) 
                    VALUES ($1, $2, 'ENTREGA', 'TROCA', $3, $4)`, 
                    [newToolId, oldItem.employee_id, `Entregue via troca: ${reason}${notes ? ' - ' + notes : ''}`, responsible]);
            
            newToolAssignedId = newToolId;
        } else {
            // Criar nova máquina
            if (!newTool) {
                await query('ROLLBACK');
                return res.status(400).json({ error: 'Dados da nova máquina não fornecidos' });
            }
            
            const newId = generateId();
            await dbRun(
                `INSERT INTO tool_items (id, employee_id, type, brand, model, serial_number, patrimonio, accessories, status, date_given, unit, ram, storage, tier) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Em uso', $9, $10, $11, $12, $13)`,
                [newId, newTool.employeeId, newTool.type, newTool.brand, newTool.model, newTool.serial_number, 
                 newTool.patrimonio, newTool.accessories, newTool.date_given, newTool.unit, newTool.ram, newTool.storage, newTool.tier]
            );
            await dbRun(`INSERT INTO tool_history (tool_id, employee_id, action, status_item, observation, responsavel) 
                    VALUES ($1, $2, 'ENTREGA', 'TROCA', $3, $4)`, 
                    [newId, newTool.employeeId, `Entregue via troca: ${reason}${notes ? ' - ' + notes : ''}`, responsible]);
            
            newToolAssignedId = newId;
        }

        await query('COMMIT');
        res.json({ success: true, newToolId: newToolAssignedId });
    } catch (err) {
        await query('ROLLBACK').catch(() => {});
        console.error('Erro no swap:', err);
        res.status(500).json({ error: err.message });
    }
});

// Tornar todos os ativos disponíveis (Reset de inventário para estoque)
router.post('/make-all-available', async (req, res) => {
    try {
        const { responsible } = req.body;
        
        await dbRun(`UPDATE tool_items SET status = 'Disponível', employee_id = NULL WHERE status != 'REMOVIDO'`, []);
        
        await dbRun(`INSERT INTO tool_history (action, status_item, observation, responsavel) 
                VALUES ($1, 'ESTOQUE', 'Reset global de ativos para disponibilidade geral', $2)`, 
                ['RESET', responsible || 'Sistema']);
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Alocar equipamento para funcionário
router.post('/allocate', async (req, res) => {
    try {
        const { toolId, employeeId, responsible, date_given, accessories } = req.body;
        
        await dbRun(`UPDATE tool_items SET status = 'Em uso', employee_id = $1, date_given = $2, accessories = $3 WHERE id = $4`, 
            [employeeId, date_given || new Date().toISOString().split('T')[0], accessories || '', toolId]);
        
        await dbRun(`INSERT INTO tool_history (tool_id, employee_id, action, status_item, observation, responsavel) 
                VALUES ($1, $2, 'ENTREGA', 'ALOCACAO', $3, $4)`,
                [toolId, employeeId, `Alocação de item em estoque. Acessórios: ${accessories || 'Padrão'}`, responsible || 'Sistema']);
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Migrar unidade dos ativos existentes
router.post('/migrate-unit', async (req, res) => {
    try {
        const sql = `
            UPDATE tool_items 
            SET unit = (
                SELECT w.name FROM employees e 
                LEFT JOIN companies w ON e.workplace_id = w.id 
                WHERE e.id = tool_items.employee_id
            )
            WHERE tool_items.employee_id IS NOT NULL
            AND unit IS NULL
        `;
        await dbRun(sql, []);
        res.json({ success: true });
    } catch (err) {
        console.error('Migração unit:', err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/migrate-unit', async (req, res) => {
    try {
        const sql = `
            UPDATE tool_items 
            SET unit = (
                SELECT w.name FROM employees e 
                LEFT JOIN companies w ON e.workplace_id = w.id 
                WHERE e.id = tool_items.employee_id
            )
            WHERE tool_items.employee_id IS NOT NULL
            AND unit IS NULL
        `;
        await dbRun(sql, []);
        res.json({ success: true, message: 'Migração executada' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/debug-stats', async (req, res) => {
    try {
        const rows = await dbAll(`SELECT COALESCE(t.unit, 'ESTOQUE') as unit, COUNT(t.id) as count 
                FROM tool_items t
                WHERE t.status != 'REMOVIDO'
                GROUP BY unit`, []);
        res.json({ rows, count: rows.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
