const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const crypto = require('crypto');

const generateId = () => crypto.randomBytes(4).toString('hex');

// Listar todos os colaboradores com todos os campos
router.get('/', async (req, res) => {
    try {
        const result = await query('SELECT * FROM employees ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Inserir novo colaborador (cirúrgico - todos os campos fornecidos)
router.post('/', async (req, res) => {
    const data = req.body;
    if (!data.name) return res.status(400).json({ error: 'Nome é obrigatório' });

    try {
        const id = data.id || generateId();
        
        // Colunas fornecidas pelo usuário
        const columns = [
            'id', 'name', 'registrationNumber', 'role', 'sector', 'type', 'hierarchy', 
            'admissionDate', 'birthDate', 'currentSalary', 'photoUrl', 'street', 'city', 
            'neighborhood', 'state_uf', 'cep', 'employer_id', 'workplace_id', 'fatherName', 
            'motherName', 'gender', 'maritalStatus', 'ethnicity', 'educationLevel', 
            'placeOfBirth', 'personalEmail', 'personalPhone', 'work_schedule', 'work_scale', 
            'cbo', 'criado_em', 'lat', 'lng', 'initialRole', 'initialSalary', 'metadata', 
            'terminationReason', 'terminationDate', 'observation', 'cpf'
        ];

        const values = [];
        const placeholders = [];
        const finalColumns = [];

        columns.forEach((col, index) => {
            if (data[col] !== undefined && data[col] !== '') {
                finalColumns.push(`"${col}"`);
                values.push(data[col]);
                placeholders.push(`$${values.length}`);
            } else if (col === 'metadata') {
                finalColumns.push(`"metadata"`);
                values.push('{}');
                placeholders.push(`$${values.length}`);
            } else if (col === 'id') {                finalColumns.push(`"id"`);
                values.push(id);
                placeholders.push(`$${values.length}`);
            }
        });

        const sql = `INSERT INTO employees (${finalColumns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING id`;
        const result = await query(sql, values);
        
        res.json({ success: true, message: 'Colaborador inserido com sucesso', id: result.rows[0].id });
    } catch (err) {
        console.error('Erro ao inserir colaborador:', err);
        res.status(500).json({ error: err.message });
    }
});

// Excluir colaborador (cirúrgico)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await query('DELETE FROM employees WHERE id = $1', [id]);
        res.json({ success: true, message: 'Colaborador excluído com sucesso' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Atualização parcial de campo (Edição In-Line)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const data = req.body; // Espera { field: "nome_do_campo", value: "valor" } ou um objeto com múltiplos campos

    try {
        let sql = '';
        let values = [];

        if (data.field && data.value !== undefined) {
            // Edição de campo único
            sql = `UPDATE employees SET "${data.field}" = $1, "updated_at" = CURRENT_TIMESTAMP WHERE id = $2`;
            values = [data.value === '' ? null : data.value, id];
        } else {
            // Edição de múltiplos campos
            const sets = [];
            Object.keys(data).forEach((key, i) => {
                sets.push(`"${key}" = $${i + 1}`);
                values.push(data[key] === '' ? null : data[key]);
            });
            values.push(id);
            sql = `UPDATE employees SET ${sets.join(', ')}, "updated_at" = CURRENT_TIMESTAMP WHERE id = $${values.length}`;
        }

        await query(sql, values);
        res.json({ success: true, message: 'Registro atualizado' });
    } catch (err) {
        console.error('Erro ao atualizar (raw):', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
