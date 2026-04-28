
const express = require('express');
const router = express.Router();
const db = require('../database');
const crypto = require('crypto');

const generateId = () => crypto.randomBytes(4).toString('hex');

const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function runCb(err) {
        if (err) return reject(err);
        resolve(this);
    });
});

const dbAll = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
    });
});

router.get('/', (req, res) => {
    const sql = `
        SELECT k.*, r.name as role_name 
        FROM kits_master k
        JOIN roles_master r ON k.role_id = r.id
        ORDER BY r.name ASC
    `;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

router.get('/:id', (req, res) => {
    db.get(`SELECT * FROM kits_master WHERE id = ?`, [req.params.id], (err, kit) => {
        if (err || !kit) return res.status(404).json({ error: 'Kit não encontrado' });
        db.all(`SELECT * FROM kit_items WHERE kit_id = ?`, [kit.id], (err, items) => {
            res.json({ ...kit, items: items || [] });
        });
    });
});

// POST - Criar Kit(s) e Atualizar Fardamento dos Colaboradores
// Agora aceita role_ids (Array) ou role_id (String legado)
router.post('/', async (req, res) => {
    const { role_ids, role_id, kit_name, items } = req.body;
    
    // Normaliza para array
    const targetRoles = role_ids || [role_id];
    
    if (!targetRoles || targetRoles.length === 0) return res.status(400).json({ error: "Nenhum cargo selecionado." });

    const today = new Date().toISOString().split('T')[0];
    let totalEmployeesUpdated = 0;

    // Função auxiliar para processar um único cargo (Promisified)
    const processRole = (rId) => {
        return new Promise((resolve, reject) => {
            const kitId = generateId();
            
            // 1. Criar Kit Master
            db.run(`INSERT INTO kits_master (id, role_id, kit_name) VALUES (?, ?, ?)`, [kitId, rId, kit_name], (err) => {
                if (err) return reject(err);

                // 2. Criar Itens do Kit
                const itemPromises = items.map(item => {
                    return new Promise((resItem, rejItem) => {
                        db.run(`INSERT INTO kit_items (id, kit_id, item_category, item_type, color, quantity) VALUES (?, ?, ?, ?, ?, ?)`,
                            [generateId(), kitId, item.category, item.type, item.color, item.quantity], (err) => {
                                if (err) rejItem(err); else resItem();
                            });
                    });
                });

                Promise.all(itemPromises).then(() => {
                    // 3. Buscar Dados do Cargo para aplicar aos colaboradores
                    db.get(`SELECT name, category FROM roles_master WHERE id = ?`, [rId], (err, roleData) => {
                        if (err || !roleData) return resolve(0); // Cargo não existe, segue o baile

                        // 4. Buscar Colaboradores Ativos
                        db.all(`SELECT * FROM employees WHERE role = ? AND type != 'Desligado'`, [roleData.name], (err, employees) => {
                            if (err) return reject(err);
                            
                            if (employees.length === 0) return resolve(0);

                            // 5. Atualizar Colaboradores
                            const empPromises = employees.map(emp => {
                                return new Promise((resEmp) => {
                                    // A. Baixar itens antigos
                                    db.run(`UPDATE uniform_items SET status = 'Substituído (Novo Kit)', nextExchangeDate = ? WHERE employee_id = ? AND status != 'Devolvido'`, 
                                        [today, emp.id], () => {
                                            
                                        // B. Inserir Novos Itens
                                        const newItemPromises = items.map(ki => {
                                            return new Promise((resKi) => {
                                                // Lógica de Tamanho
                                                let itemSize = 'M';
                                                const typeLower = ki.type.toLowerCase();
                                                if (typeLower.includes('camisa') || typeLower.includes('polo')) itemSize = emp.shirtSize || 'M';
                                                else if (typeLower.includes('calça') || typeLower.includes('jeans')) itemSize = emp.pantsSize || '40';
                                                else if (typeLower.includes('bota') || typeLower.includes('sapato')) itemSize = emp.shoeSize || '40';

                                                // Validade
                                                const cycleType = roleData.category || emp.type || 'OP';
                                                const cycleDays = (cycleType === 'ADM') ? 365 : 180;
                                                const nextDate = new Date();
                                                nextDate.setDate(nextDate.getDate() + cycleDays);
                                                
                                                const newItemId = generateId();

                                                db.run(`INSERT INTO uniform_items (id, employee_id, type, color, size, dateGiven, nextExchangeDate, status) 
                                                        VALUES (?, ?, ?, ?, ?, ?, ?, 'Em dia')`,
                                                        [newItemId, emp.id, ki.type, ki.color, itemSize, today, nextDate.toISOString().split('T')[0]], () => {
                                                            
                                                    db.run(`INSERT INTO uniform_history (item_id, employee_id, type, color, tipo_movimentacao, status_peca, observacao, responsavel) 
                                                            VALUES (?, ?, ?, ?, 'TROCA AUTOMÁTICA', 'NOVO', ?, 'Sistema (Novo Kit)')`,
                                                            [newItemId, emp.id, ki.type, ki.color, `Atualização de Kit do Cargo: ${kit_name}`], () => resKi());
                                                });
                                            });
                                        });
                                        
                                        Promise.all(newItemPromises).then(() => resEmp());
                                    });
                                });
                            });

                            Promise.all(empPromises).then(() => resolve(employees.length));
                        });
                    });
                }).catch(reject);
            });
        });
    };

    // Executa em série ou paralelo (Paralelo é ok aqui)
    try {
        const results = await Promise.all(targetRoles.map(rId => processRole(rId)));
        totalEmployeesUpdated = results.reduce((a, b) => a + b, 0);
        
        res.json({ 
            success: true, 
            message: `Processo concluído! Kits criados para ${targetRoles.length} cargos. Inventário atualizado para ${totalEmployeesUpdated} colaboradores.` 
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Erro ao processar lote de kits: " + e.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await dbRun("BEGIN TRANSACTION");
        await dbRun(`DELETE FROM kit_items WHERE kit_id = $1`, [req.params.id]);
        await dbRun(`DELETE FROM kits_master WHERE id = $1`, [req.params.id]);
        await dbRun("COMMIT");
        res.json({ success: true });
    } catch (err) {
        await dbRun("ROLLBACK").catch(() => {});
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
