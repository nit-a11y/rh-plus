
const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const crypto = require('crypto');

const generateId = () => crypto.randomBytes(4).toString('hex');

const dbAll = async (sql, params = []) => {
    const result = await query(sql, params);
    return result.rows || [];
};

const dbRun = async (sql, params = []) => {
    const result = await query(sql, params);
    return result;
};

router.get('/', async (req, res) => {
    try {
        const rows = await dbAll(`SELECT * FROM roles_master ORDER BY name ASC`, []);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const { name, cbo, sector, directorate, category } = req.body;
        const id = generateId();
        
        const normalizedName = name ? name.toString().toUpperCase().trim() : '';
        const normalizedSector = sector ? sector.toString().toUpperCase().trim() : 'ADMINISTRATIVO';
        const normalizedCbo = cbo ? cbo.toString().replace(/[^\d]/g, '').padStart(6, '0') : '';
        const normalizedDirectorate = directorate ? directorate.toString().toUpperCase().trim() : '';
        const normalizedCategory = category ? category.toString().toUpperCase().trim() : 'OP';
        
        await dbRun(`INSERT INTO roles_master (id, name, cbo, sector, directorate, category) VALUES ($1, $2, $3, $4, $5, $6)`,
            [id, normalizedName, normalizedCbo, normalizedSector, normalizedDirectorate, normalizedCategory]);
        res.json({ success: true, id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, cbo, sector, directorate, category } = req.body;
        
        const normalizedName = name ? name.toString().toUpperCase().trim() : '';
        const normalizedSector = sector ? sector.toString().toUpperCase().trim() : 'ADMINISTRATIVO';
        const normalizedCbo = cbo ? cbo.toString().replace(/[^\d]/g, '').padStart(6, '0') : '';
        const normalizedDirectorate = directorate ? directorate.toString().toUpperCase().trim() : '';
        const normalizedCategory = category ? category.toString().toUpperCase().trim() : 'OP';
        
        const result = await dbRun(`UPDATE roles_master SET name = $1, cbo = $2, sector = $3, directorate = $4, category = $5 WHERE id = $6`,
            [normalizedName, normalizedCbo, normalizedSector, normalizedDirectorate, normalizedCategory, id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Cargo não encontrado' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await dbRun(`DELETE FROM roles_master WHERE id = $1`, [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
