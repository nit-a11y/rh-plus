/**
 * Rotas para gerenciamento de colaboradores arquivados
 */

const express = require('express');
const router = express.Router();
const { query, transaction } = require('../config/database');
const crypto = require('crypto');

const generateId = () => crypto.randomBytes(4).toString('hex');

// ESSENCIAL_FIELDS que permanecem em employees
const ESSENTIAL_FIELDS = [
    'id', 'name', 'registrationNumber', 'role', 'sector', 'type',
    'employer_id', 'workplace_id', 'terminationDate', 'terminationReason',
    'photoUrl', 'cpf'
];

// Campos que vão para o arquivo
const ARCHIVE_FIELDS = [
    'admissionDate', 'birthDate', 'currentSalary', 'street', 'city',
    'neighborhood', 'state_uf', 'postalCode', 'phone', 'personalEmail',
    'fatherName', 'motherName', 'maritalStatus', 'educationLevel',
    'placeOfBirth', 'gender', 'race', 'pisPasep', 'rg', 'work_schedule',
    'work_scale', 'cbo', 'initialRole', 'initialSalary', 'observation'
];

// ROTA: Listar todos os arquivados
router.get('/terminated', async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                e.id,
                e.name,
                e."registrationNumber",
                e.role,
                e.sector,
                e.type,
                e."terminationDate",
                e."terminationReason",
                e."photoUrl",
                e.cpf,
                emp.name as employer_name,
                emp.cnpj as employer_cnpj,
                wp.name as workplace_name,
                wp.cnpj as workplace_cnpj,
                t.created_at as termination_created_at,
                t.responsible as termination_responsible,
                t.motivo as termination_motivo,
                t.data_demissao as termination_data_demissao,
                t.tipo_demissao as termination_tipo_demissao,
                t.observacoes as termination_observacoes
            FROM employees e
            LEFT JOIN companies emp ON e.employer_id = emp.id
            LEFT JOIN companies wp ON e.workplace_id = wp.id
            LEFT JOIN employee_terminations t ON e.id = t.employee_id
            WHERE e.type = 'Desligado'
            ORDER BY e."terminationDate" DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ROTA: Obter dados completos de um arquivado
router.get('/terminated/:id/full', async (req, res) => {
    const { id } = req.params;

    try {
        const employeeResult = await query(`SELECT * FROM employees WHERE id = $1`, [id]);
        if (!employeeResult.rows[0]) {
            return res.status(404).json({ error: 'Colaborador não encontrado' });
        }

        const archiveResult = await query(`SELECT * FROM employee_archive WHERE employee_id = $1`, [id]);
        let archiveData = {};
        if (archiveResult.rows[0] && archiveResult.rows[0].archive_data) {
            try {
                archiveData = JSON.parse(archiveResult.rows[0].archive_data);
            } catch (e) { }
        }

        const terminationResult = await query(`SELECT * FROM employee_terminations WHERE employee_id = $1 ORDER BY created_at DESC LIMIT 1`, [id]);
        
        // Merge dos dados
        const fullData = {
            ...employeeResult.rows[0],
            ...archiveData,
            termination: terminationResult.rows[0] || null
        };

        res.json(fullData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ROTA: Arquivar colaborador
router.post('/archive/:employeeId', async (req, res) => {
    const { employeeId } = req.params;
    const { termination_id } = req.body;

    try {
        await transaction(async (client) => {
            // 1. Buscar dados completos do colaborador
            const employeeResult = await client.query(`SELECT * FROM employees WHERE id = $1`, [employeeId]);
            if (!employeeResult.rows[0]) {
                throw new Error('Colaborador não encontrado');
            }

            const employee = employeeResult.rows[0];

            // 2. Montar dados para arquivar
            const archiveData = {};
            ARCHIVE_FIELDS.forEach(field => {
                if (employee[field] !== undefined && employee[field] !== null) {
                    archiveData[field] = employee[field];
                }
            });

            // 3. Verificar se já existe arquivo
            const existingResult = await client.query(`SELECT id FROM employee_archive WHERE employee_id = $1`, [employeeId]);

            if (existingResult.rows[0]) {
                // Atualizar arquivo existente
                await client.query(`UPDATE employee_archive SET archive_data = $1, termination_id = $2 WHERE employee_id = $3`,
                    [JSON.stringify(archiveData), termination_id, employeeId]);
            } else {
                // Criar novo arquivo
                const archiveId = generateId();
                await client.query(`INSERT INTO employee_archive (id, employee_id, archive_data, termination_id, is_active)
                        VALUES ($1, $2, $3, $4, 0)`,
                    [archiveId, employeeId, JSON.stringify(archiveData), termination_id]);
            }

            // 4. Limpar campos de employees
            const updates = ARCHIVE_FIELDS.map(f => `${f} = NULL`).join(', ');
            await client.query(`UPDATE employees SET ${updates} WHERE id = $1`, [employeeId]);
        });

        res.json({ success: true, message: 'Colaborador arquivado com sucesso' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ROTA: Restaurar colaborador
router.post('/restore/:employeeId', async (req, res) => {
    const { employeeId } = req.params;
    const { fields } = req.body; // campos específicos para restaurar

    try {
        await transaction(async (client) => {
            // 1. Buscar dados arquivados
            const archiveResult = await client.query(`SELECT * FROM employee_archive WHERE employee_id = $1`, [employeeId]);
            if (!archiveResult.rows[0]) {
                throw new Error('Arquivo não encontrado');
            }

            const archiveData = JSON.parse(archiveResult.rows[0].archive_data || '{}');

            // 2. Restaurar campos solicitados
            const fieldsToRestore = fields && fields.length > 0 ? fields : ARCHIVE_FIELDS;
            const validFields = fieldsToRestore.filter(f => archiveData[f] !== undefined);
            
            if (validFields.length === 0) {
                throw new Error('Nenhum campo válido para restaurar');
            }

            // 3. Atualizar employees
            const updates = validFields.map(f => `${f} = $${validFields.indexOf(f) + 1}`).join(', ');
            const values = validFields.map(f => archiveData[f]);

            await client.query(`UPDATE employees SET ${updates} WHERE id = $1`, [...values, employeeId]);
        });

        res.json({ success: true, message: 'Colaborador restaurado com sucesso' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ROTA: Excluir arquivo permanentemente
router.delete('/archive/:employeeId', async (req, res) => {
    const { employeeId } = req.params;

    try {
        await transaction(async (client) => {
            // Verificar se existe arquivo
            const archiveResult = await client.query(`SELECT id FROM employee_archive WHERE employee_id = $1`, [employeeId]);
            if (!archiveResult.rows[0]) {
                throw new Error('Arquivo não encontrado');
            }

            // Excluir arquivo
            await client.query(`DELETE FROM employee_archive WHERE employee_id = $1`, [employeeId]);
        });

        res.json({ success: true, message: 'Arquivo excluído permanentemente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
