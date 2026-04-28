
const express = require('express');
const router = express.Router();
const db = require('../database');
const crypto = require('crypto');

const generateId = () => crypto.randomBytes(4).toString('hex');

// Obter dados de férias do colaborador (período atual)
router.get('/:employeeId', (req, res) => {
    db.get(`SELECT * FROM vacations WHERE employee_id = ? ORDER BY eligibility_date DESC LIMIT 1`, [req.params.employeeId], (err, vacation) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (!vacation) return res.json(null);

        db.all(`SELECT * FROM vacation_periods WHERE vacation_id = ?`, [vacation.id], (err, periods) => {
            vacation.periods = periods || [];
            res.json(vacation);
        });
    });
});

// Criar registro de férias (usado na admissão ou após conclusão)
router.post('/init', (req, res) => {
    const { employeeId, admissionDate } = req.body;
    const id = generateId();
    
    const adm = new Date(admissionDate);
    // Regra: Carência 18 meses
    const eligibility = new Date(adm); eligibility.setMonth(eligibility.getMonth() + 18);
    // Regra: Limite 24 meses (Liberação + 6 meses)
    const limit = new Date(eligibility); limit.setMonth(limit.getMonth() + 6);

    const sql = `INSERT INTO vacations (id, employee_id, admission_date, eligibility_date, limit_date, status) VALUES (?, ?, ?, ?, ?, 'EM CARÊNCIA')`;
    db.run(sql, [id, employeeId, admissionDate, eligibility.toISOString().split('T')[0], limit.toISOString().split('T')[0]], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Período de férias iniciado', id });
    });
});

// Planejar Férias (Solicitação)
router.post('/plan', (req, res) => {
    const { vacationId, model, soldDays, periods, observation } = req.body;
    
    db.run(`UPDATE vacations SET model = ?, sold_days = ?, status = 'AGUARDANDO APROVAÇÃO', observation = ? WHERE id = ?`, 
        [model, soldDays, observation, vacationId], function(err) {
        if (err) return res.status(500).json({ error: err.message });

        // Limpar períodos anteriores e inserir novos
        db.run(`DELETE FROM vacation_periods WHERE vacation_id = ?`, [vacationId], () => {
            const stmt = db.prepare(`INSERT INTO vacation_periods (id, vacation_id, start_date, days) VALUES (?, ?, ?, ?)`);
            periods.forEach(p => stmt.run(generateId(), vacationId, p.start_date, p.days));
            stmt.finalize();
            res.json({ message: 'Planejamento enviado para aprovação' });
        });
    });
});

// Aprovação de Férias (Líder ou RH)
router.post('/approve', (req, res) => {
    const { vacationId, role, approved } = req.body; // role: 'leader' ou 'rh'
    const column = role === 'leader' ? 'approved_leader' : 'approved_rh';
    
    db.run(`UPDATE vacations SET ${column} = ? WHERE id = ?`, [approved ? 1 : 0, vacationId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        // Verifica se ambas aprovações foram concedidas
        db.get(`SELECT approved_leader, approved_rh FROM vacations WHERE id = ?`, [vacationId], (err, row) => {
            if (row.approved_leader && row.approved_rh) {
                db.run(`UPDATE vacations SET status = 'APROVADO' WHERE id = ?`, [vacationId]);
            }
            res.json({ message: 'Status de aprovação atualizado' });
        });
    });
});

module.exports = router;
