
const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
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

router.get('/', async (req, res) => {
    try {
        const rows = await dbAll(`SELECT * FROM employees ORDER BY name ASC`);
        
        const promises = rows.map(async (emp) => {
            emp.items = await dbAll(`SELECT * FROM uniform_items WHERE employee_id = $1 AND status != 'Devolvido'`, [emp.id]);
            emp.history = await dbAll(`SELECT data_hora, tipo_movimentacao, type, color, observacao, responsavel 
                    FROM uniform_history WHERE employee_id = $1 ORDER BY data_hora DESC`, [emp.id]);
            emp.occurrences = await dbAll(`SELECT * FROM occurrences WHERE employee_id = $1 ORDER BY date DESC`, [emp.id]);
            emp.career = await dbAll(`SELECT * FROM career_history WHERE employee_id = $1 ORDER BY date DESC`, [emp.id]);
            return emp;
        });
        
        const result = await Promise.all(promises);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const { name, registrationNumber, role, sector, type, admissionDate, birthDate, currentSalary, photoUrl, street, city, neighborhood, state_uf } = req.body;
        const id = generateId();
        
        const normalizedName = name ? name.toString().toUpperCase().trim() : '';
        const normalizedRole = role ? role.toString().toUpperCase().trim() : '';
        const normalizedSector = sector ? sector.toString().toUpperCase().trim() : 'ADMINISTRATIVO';
        const normalizedStreet = street ? street.toString().toUpperCase().trim() : '';
        const normalizedCity = city ? city.toString().toUpperCase().trim() : '';
        const normalizedNeighborhood = neighborhood ? neighborhood.toString().toUpperCase().trim() : '';
        const normalizedState = state_uf ? state_uf.toString().toUpperCase().trim() : 'CE';
        
        const sql = `INSERT INTO employees (id, name, "registrationNumber", role, sector, type, "admissionDate", "birthDate", "currentSalary", "photoUrl", street, city, neighborhood, state_uf, lat, lng) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`;
        await dbRun(sql, [id, normalizedName, registrationNumber, normalizedRole, normalizedSector, type, admissionDate, birthDate, currentSalary, photoUrl, normalizedStreet, normalizedCity, normalizedNeighborhood, normalizedState, -3.717, -38.528]);
        
        res.json({ message: 'Criado', id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Atualizar colaborador
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { type, status, observation } = req.body;
        
        // Construir SQL dinamicamente com apenas os campos fornecidos
        const updates = [];
        const values = [];
        
        if (type !== undefined) {
            updates.push(`type = ?`);
            values.push(type);
        }
        
        if (status !== undefined) {
            updates.push(`status = ?`);
            values.push(status);
        }
        
        if (observation !== undefined) {
            updates.push(`observation = ?`);
            values.push(observation);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'Nenhum campo para atualizar' });
        }
        
        // Adicionar ID como último parâmetro
        values.push(id);
        
        const sql = `UPDATE employees SET ${updates.join(', ')} WHERE id = ?`;
        await dbRun(sql, values);
        
        res.json({ success: true, message: 'Colaborador atualizado com sucesso' });
    } catch (err) {
        console.error('Erro ao atualizar colaborador:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
