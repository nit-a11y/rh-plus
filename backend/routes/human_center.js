
const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const crypto = require('crypto');

const generateId = () => crypto.randomBytes(4).toString('hex');

// Resumo Geral (Calendário e Listas)
router.get('/summary', async (req, res) => {
    try {
        const today = new Date();
        
        // Puxa todos os colaboradores ativos
        const empResult = await query(`SELECT id, name, sector, role, photoUrl, birthDate, admissionDate, personalPhone, personalEmail FROM employees WHERE type != 'Desligado'`);
        const employees = empResult.rows;

        // Puxa férias do ano atual em diante (PostgreSQL usa EXTRACT em vez de strftime)
        const vacResult = await query(`SELECT * FROM vacation_records WHERE EXTRACT(YEAR FROM start_date) >= $1`, [today.getFullYear()]);
        const vacations = vacResult.rows;
        
        // Puxa eventos criados manualmente
        const evtResult = await query(`SELECT * FROM human_center_events`);
        const events = evtResult.rows;
        
        // Puxa APENAS Promoções REAIS do histórico de carreira
        const promoResult = await query(`SELECT * FROM career_history WHERE move_type = 'Promoção' ORDER BY date DESC`);
        const promos = promoResult.rows;
        
        const vacationList = vacations.map(v => {
            const emp = employees.find(e => e.id === v.employee_id);
            return { ...v, employee_name: emp?.name || 'Desconhecido', photoUrl: emp?.photoUrl };
        });

        const promoList = promos.map(p => {
            const emp = employees.find(e => e.id === p.employee_id);
            return { ...p, emp_name: emp?.name || 'Desconhecido', photoUrl: emp?.photoUrl };
        });

        res.json({
            employees: employees || [],
            vacations: vacationList,
            events: events || [],
            promotions: promoList
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Criar Evento Customizado
router.post('/events', async (req, res) => {
    try {
        const { title, date, type, description, color } = req.body;
        const id = generateId();
        await query(`INSERT INTO human_center_events (id, title, date, type, description, color) VALUES ($1,$2,$3,$4,$5,$6)`,
            [id, title, date, type, description, color || '#D32F2F']);
        res.json({ success: true, id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Deletar Evento
router.delete('/events/:id', async (req, res) => {
    try {
        await query(`DELETE FROM human_center_events WHERE id = $1`, [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
