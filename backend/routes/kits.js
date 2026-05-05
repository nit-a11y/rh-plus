const express = require('express');
const router = express.Router();
const { query, transaction } = require('../config/database');
const crypto = require('crypto');

const generateId = () => crypto.randomBytes(4).toString('hex');

router.get('/', async (req, res) => {
    try {
        const sql = `
            SELECT k.*, r.name as role_name 
            FROM kits_master k
            JOIN roles_master r ON k.role_id = r.id
            ORDER BY r.name ASC
        `;
        const result = await query(sql);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const kitResult = await query(`SELECT * FROM kits_master WHERE id = $1`, [req.params.id]);
        if (!kitResult.rows[0]) return res.status(404).json({ error: 'Kit não encontrado' });
        
        const itemsResult = await query(`SELECT * FROM kit_items WHERE kit_id = $1`, [kitResult.rows[0].id]);
        res.json({ ...kitResult.rows[0], items: itemsResult.rows || [] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST - Criar Kit(s) e Atualizar Fardamento dos Colaboradores
router.post('/', async (req, res) => {
    const { role_ids, role_id, kit_name, items } = req.body;
    
    // Normaliza para array
    const targetRoles = role_ids || [role_id];
    
    try {
        let totalUpdated = 0;

        for (const rId of targetRoles) {
            await transaction(async (client) => {
                const kitId = generateId();
                
                // 1. Criar Kit Master
                await client.query(`INSERT INTO kits_master (id, role_id, kit_name) VALUES ($1, $2, $3)`, [kitId, rId, kit_name]);

                // 2. Criar Itens do Kit
                for (const item of items) {
                    await client.query(`INSERT INTO kit_items (id, kit_id, item_category, item_type, color, quantity) VALUES ($1, $2, $3, $4, $5, $6)`,
                        [generateId(), kitId, item.category, item.type, item.color, item.quantity]);
                }

                // 3. Buscar Dados do Cargo para aplicar aos colaboradores
                const roleResult = await client.query(`SELECT name, category FROM roles_master WHERE id = $1`, [rId]);
                if (!roleResult.rows[0]) return 0; // Cargo não existe, segue o baile

                // 4. Buscar Colaboradores Ativos
                const employeesResult = await client.query(`SELECT * FROM employees WHERE role = $1 AND type != 'Desligado'`, [roleResult.rows[0].name]);
                
                if (employeesResult.rows.length === 0) return 0;

                const today = new Date().toISOString().split('T')[0];
                const roleCategory = roleResult.rows[0].category;

                // 5. Para cada colaborador, atualizar fardamento
                for (const emp of employeesResult.rows) {
                    // A. Baixar itens antigos
                    await client.query(`UPDATE uniform_items SET status = 'Substituído (Novo Kit)', nextExchangeDate = $1 WHERE employee_id = $2 AND status != 'Devolvido'`, 
                        [today, emp.id]);

                    // B. Inserir Novos Itens
                    for (const ki of items) {
                        const cycleDays = roleCategory === 'ADM' ? 365 : 180;
                        const nextDate = new Date(today);
                        nextDate.setDate(nextDate.getDate() + cycleDays);

                        // Determinar tamanho (lógica simplificada)
                        const typeLower = String(ki.type || '').toLowerCase();
                        let itemSize = 'M';
                        if (typeLower.includes('camisa') || typeLower.includes('polo')) itemSize = 'M';
                        else if (typeLower.includes('calca') || typeLower.includes('calça') || typeLower.includes('jeans')) itemSize = '40';
                        else if (typeLower.includes('bota') || typeLower.includes('sapato') || typeLower.includes('tenis') || typeLower.includes('tênis')) itemSize = '40';

                        const newItemId = generateId();

                        await client.query(`INSERT INTO uniform_items (id, employee_id, type, color, size, dateGiven, nextExchangeDate, status) 
                                VALUES ($1, $2, $3, $4, $5, $6, $7, 'Em dia')`,
                                [newItemId, emp.id, ki.type, ki.color, itemSize, today, nextDate.toISOString().split('T')[0]]);

                        await client.query(`INSERT INTO uniform_history (item_id, employee_id, type, color, tipo_movimentacao, status_peca, observacao, responsavel) 
                                VALUES ($1, $2, $3, $4, 'TROCA AUTOMÁTICA', 'NOVO', $5, 'Sistema (Novo Kit)')`,
                                [newItemId, emp.id, ki.type, ki.color, `Atualização de Kit do Cargo: ${kit_name}`]);
                    }
                }

                return employeesResult.rows.length;
            });
        }

        res.json({ success: true, message: `Kit criado e fardamento atualizado para ${totalUpdated} colaboradores.` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT - Atualizar Kit
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { kit_name, items } = req.body;
    
    try {
        await transaction(async (client) => {
            // Atualizar nome do kit
            await client.query(`UPDATE kits_master SET kit_name = $1 WHERE id = $2`, [kit_name, id]);
            
            // Remover itens antigos
            await client.query(`DELETE FROM kit_items WHERE kit_id = $1`, [id]);
            
            // Inserir novos itens
            for (const item of items) {
                await client.query(`INSERT INTO kit_items (id, kit_id, item_category, item_type, color, quantity) VALUES ($1, $2, $3, $4, $5, $6)`,
                    [generateId(), id, item.category, item.type, item.color, item.quantity]);
            }
        });
        
        res.json({ success: true, message: 'Kit atualizado com sucesso' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE - Excluir Kit
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        await transaction(async (client) => {
            // Remover itens primeiro (foreign key)
            await client.query(`DELETE FROM kit_items WHERE kit_id = $1`, [id]);
            // Remover kit master
            await client.query(`DELETE FROM kits_master WHERE id = $1`, [id]);
        });
        
        res.json({ success: true, message: 'Kit excluído com sucesso' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
