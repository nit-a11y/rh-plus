const express = require('express');
const crypto = require('crypto');
const { query } = require('../config/database');

const router = express.Router();
const generateId = () => crypto.randomBytes(8).toString('hex');

// Registrar transferência de empregador/unidade
router.post('/employee/:id', async (req, res) => {
    const { id } = req.params;
    const { to_employer_id, to_workplace_id, reason, changed_by } = req.body;
    
    if (!to_employer_id && !to_workplace_id) {
        return res.status(400).json({ error: 'Informe pelo menos empregador ou unidade de destino' });
    }

    try {
        // Buscar dados atuais do colaborador
        const empResult = await query('SELECT * FROM employees WHERE id = $1', [id]);
        const emp = empResult.rows[0];

        if (!emp) return res.status(404).json({ error: 'Colaborador não encontrado' });

        // Registrar transferência
        const transferId = generateId();
        await query(`
            INSERT INTO employee_vinculo_transfers 
            (id, employee_id, from_employer_id, from_workplace_id, to_employer_id, to_workplace_id, changed_by, observation) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [transferId, id, emp.employer_id, emp.workplace_id, to_employer_id, to_workplace_id, changed_by, reason]);

        // Atualizar dados do colaborador
        await query(`
            UPDATE employees SET employer_id = $1, workplace_id = $2 WHERE id = $3
        `, [to_employer_id || emp.employer_id, to_workplace_id || emp.workplace_id, id]);

        // Adicionar ao histórico de carreira
        const careerId = generateId();
        const now = new Date().toISOString().split('T')[0];
        await query(`
            INSERT INTO career_history 
            (id, employee_id, role, sector, salary, move_type, date, responsible, observation) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [careerId, id, emp.role, emp.sector, emp.currentSalary, 'TRANSFERENCIA', now, changed_by, reason]);

        // Buscar nomes das empresas/unidades para retorno
        const [fromEmployer, toEmployer, fromWorkplace, toWorkplace] = await Promise.all([
            emp.employer_id ? query('SELECT name FROM companies WHERE id = $1', [emp.employer_id]).then(r => r.rows[0]) : null,
            to_employer_id ? query('SELECT name FROM companies WHERE id = $1', [to_employer_id]).then(r => r.rows[0]) : null,
            emp.workplace_id ? query('SELECT name FROM companies WHERE id = $1', [emp.workplace_id]).then(r => r.rows[0]) : null,
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
                date: now,
                changed_by
            }
        });

    } catch (error) {
        console.error('Erro na transferência:', error);
        res.status(500).json({ error: error.message });
    }
});

// Listar histórico de transferências de um colaborador
router.get('/employee/:id/history', async (req, res) => {
    const { id } = req.params;
    
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
