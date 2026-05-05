
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


module.exports = router;
