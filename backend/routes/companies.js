
const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const crypto = require('crypto');

const generateId = () => crypto.randomBytes(4).toString('hex');


router.get('/', async (req, res) => {
    try {
        const result = await query(`SELECT * FROM companies ORDER BY name ASC`);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const { name, cnpj, address, type } = req.body;
        const id = generateId();
        
        const normalizedName = name ? name.toString().toUpperCase().trim() : '';
        const normalizedCnpj = cnpj ? cnpj.toString().trim() : '';
        const normalizedAddress = address ? address.toString().toUpperCase().trim() : '';
        const normalizedType = type ? type.toString().trim() : 'Ambos';
        
        await query(`INSERT INTO companies (id, name, cnpj, address, type) VALUES ($1, $2, $3, $4, $5)`,
            [id, normalizedName, normalizedCnpj, normalizedAddress, normalizedType]);
        res.json({ success: true, id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await query(`DELETE FROM companies WHERE id = $1`, [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, cnpj, address, type } = req.body;
        
        const normalizedName = name ? name.toString().toUpperCase().trim() : '';
        const normalizedCnpj = cnpj ? cnpj.toString().trim() : '';
        const normalizedAddress = address ? address.toString().toUpperCase().trim() : '';
        const normalizedType = type ? type.toString().trim() : 'Ambos';
        
        const result = await query(`UPDATE companies SET name = $1, cnpj = $2, address = $3, type = $4 WHERE id = $5`,
            [normalizedName, normalizedCnpj, normalizedAddress, normalizedType, id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Empresa não encontrada' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Criar empresa
router.post('/', (req, res) => {
    const { name, cnpj, address, type } = req.body;
    const id = generateId();
    
    // Normalização automática para evitar dados despadronizados
    const normalizedName = name ? name.toString().toUpperCase().trim() : '';
    const normalizedCnpj = cnpj ? cnpj.toString().trim() : '';
    const normalizedAddress = address ? address.toString().toUpperCase().trim() : '';
    const normalizedType = type ? type.toString().trim() : 'Ambos';
    
    db.run(`INSERT INTO companies (id, name, cnpj, address, type) VALUES (?, ?, ?, ?, ?)`,
        [id, normalizedName, normalizedCnpj, normalizedAddress, normalizedType], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id });
        });
});

// Deletar empresa
router.delete('/:id', (req, res) => {
    db.run(`DELETE FROM companies WHERE id = ?`, [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Atualizar empresa
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { name, cnpj, address, type } = req.body;
    
    // Normalização automática
    const normalizedName = name ? name.toString().toUpperCase().trim() : '';
    const normalizedCnpj = cnpj ? cnpj.toString().trim() : '';
    const normalizedAddress = address ? address.toString().toUpperCase().trim() : '';
    const normalizedType = type ? type.toString().trim() : 'Ambos';
    
    const sql = `UPDATE companies SET name = ?, cnpj = ?, address = ?, type = ? WHERE id = ?`;
    db.run(sql, [normalizedName, normalizedCnpj, normalizedAddress, normalizedType, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Empresa não encontrada' });
        res.json({ success: true });
    });
});

module.exports = router;
