/**
 * Rotas para gerenciamento de colaboradores arquivados
 */

const express = require('express');
const router = express.Router();
const db = require('../database');
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
    'hierarchy', 'admissionDate', 'birthDate', 'currentSalary', 'street', 'city',
    'neighborhood', 'state_uf', 'cep', 'fatherName', 'motherName', 'gender',
    'maritalStatus', 'ethnicity', 'educationLevel', 'placeOfBirth',
    'personalEmail', 'personalPhone', 'work_schedule', 'work_scale', 'cbo',
    'initialRole', 'initialSalary', 'metadata', 'observation', 'criado_em'
];

// ROTA: Listar todos os arquivados
router.get('/terminated', (req, res) => {
    db.all(`
        SELECT 
            e.id,
            e.name,
            e.registrationNumber,
            e.role,
            e.sector,
            e.type,
            e.terminationDate,
            e.terminationReason,
            e.photoUrl,
            emp.name as employer_name,
            wp.name as workplace_name,
            t.termination_date,
            t.termination_reason as term_reason,
            t.grrf_value,
            t.rescisao_value,
            a.archived_at
        FROM employees e
        LEFT JOIN employee_terminations t ON e.id = t.employee_id
        LEFT JOIN employee_archive a ON e.id = a.employee_id
        LEFT JOIN companies emp ON e.employer_id = emp.id
        LEFT JOIN companies wp ON e.workplace_id = wp.id
        WHERE e.type = 'Desligado'
        ORDER BY e.terminationDate DESC, t.termination_date DESC
    `, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, data: rows || [] });
    });
});

// ROTA: Obter dados completos de um arquivado (merge archive + employees)
router.get('/terminated/:id/full', (req, res) => {
    const { id } = req.params;

    db.get(`SELECT * FROM employees WHERE id = ?`, [id], (err, employee) => {
        if (err || !employee) {
            return res.status(404).json({ error: 'Colaborador não encontrado' });
        }

        db.get(`SELECT * FROM employee_archive WHERE employee_id = ?`, [id], (err, archive) => {
            let archiveData = {};
            if (archive && archive.archive_data) {
                try {
                    archiveData = JSON.parse(archive.archive_data);
                } catch (e) { }
            }

            db.get(`SELECT * FROM employee_terminations WHERE employee_id = ? ORDER BY created_at DESC LIMIT 1`,
                [id], (err, termination) => {
                    
                    // Merge dos dados
                    const fullData = {
                        ...archiveData,
                        ...employee,
                        terminationDetails: termination || null,
                        archivedAt: archive?.archived_at || null
                    };

                    res.json({ success: true, data: fullData });
                }
            );
        });
    });
});

// ROTA: Arquivar um colaborador (usado durante desligamento)
router.post('/archive/:employeeId', async (req, res) => {
    const { employeeId } = req.params;
    const { termination_id } = req.body;

    try {
        // 1. Buscar dados completos do colaborador
        const employee = await new Promise((resolve, reject) => {
            db.get(`SELECT * FROM employees WHERE id = ?`, [employeeId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!employee) {
            return res.status(404).json({ error: 'Colaborador não encontrado' });
        }

        // 2. Preparar dados para arquivo
        const archiveData = {};
        ARCHIVE_FIELDS.forEach(field => {
            if (employee[field] !== undefined && employee[field] !== null) {
                archiveData[field] = employee[field];
            }
        });

        // 3. Verificar se já existe arquivo
        const existing = await new Promise((resolve) => {
            db.get(`SELECT id FROM employee_archive WHERE employee_id = ?`, [employeeId], (err, row) => {
                resolve(row);
            });
        });

        if (existing) {
            // Atualizar arquivo existente
            await new Promise((resolve, reject) => {
                db.run(`UPDATE employee_archive SET archive_data = ?, termination_id = ? WHERE employee_id = ?`,
                    [JSON.stringify(archiveData), termination_id, employeeId],
                    (err) => err ? reject(err) : resolve()
                );
            });
        } else {
            // Criar novo arquivo
            const archiveId = generateId();
            await new Promise((resolve, reject) => {
                db.run(`INSERT INTO employee_archive (id, employee_id, archive_data, termination_id, is_active)
                        VALUES (?, ?, ?, ?, 0)`,
                    [archiveId, employeeId, JSON.stringify(archiveData), termination_id],
                    (err) => err ? reject(err) : resolve()
                );
            });
        }

        // 4. Limpar campos de employees
        const updates = ARCHIVE_FIELDS.map(f => `${f} = NULL`).join(', ');
        await new Promise((resolve, reject) => {
            db.run(`UPDATE employees SET ${updates} WHERE id = ?`, [employeeId],
                (err) => err ? reject(err) : resolve()
            );
        });

        res.json({ success: true, message: 'Colaborador arquivado com sucesso' });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ROTA: Restaurar dados do arquivo para employees (caso necessário)
router.post('/restore/:employeeId', async (req, res) => {
    const { employeeId } = req.params;

    try {
        const archive = await new Promise((resolve) => {
            db.get(`SELECT * FROM employee_archive WHERE employee_id = ?`, [employeeId], (err, row) => {
                resolve(row);
            });
        });

        if (!archive) {
            return res.status(404).json({ error: 'Arquivo não encontrado' });
        }

        let archiveData = {};
        try {
            archiveData = JSON.parse(archive.archive_data);
        } catch (e) {
            return res.status(500).json({ error: 'Dados do arquivo corrompidos' });
        }

        // Restaurar campos
        const fields = Object.keys(archiveData);
        const updates = fields.map(f => `${f} = ?`).join(', ');
        const values = fields.map(f => archiveData[f]);

        await new Promise((resolve, reject) => {
            db.run(`UPDATE employees SET ${updates} WHERE id = ?`, [...values, employeeId],
                (err) => err ? reject(err) : resolve()
            );
        });

        res.json({ success: true, message: 'Dados restaurados' });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
