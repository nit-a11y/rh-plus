const express = require('express');
const crypto = require('crypto');
const db = require('../database');

const router = express.Router();
const generateId = () => crypto.randomBytes(4).toString('hex');

const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function runCb(err) {
        if (err) return reject(err);
        resolve(this);
    });
});

const dbGet = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
    });
});

const dbAll = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
    });
});

router.get('/list-summary', async (req, res) => {
    try {
        const rows = await dbAll(`
            WITH latest_exam AS (
                SELECT employee_id, MAX(exam_date) AS max_exam_date
                FROM aso_records
                GROUP BY employee_id
            )
            SELECT
                e.id,
                e.name,
                e."registrationNumber",
                e.role,
                e.sector,
                e.type,
                e."photoUrl",
                e.cbo,
                a.exam_date AS last_exam_date,
                a.expiry_date AS last_exam_expiry,
                a.result AS last_exam_result
            FROM employees e
            LEFT JOIN latest_exam le ON le.employee_id = e.id
            LEFT JOIN aso_records a ON a.employee_id = e.id AND a.exam_date = le.max_exam_date
            ORDER BY e.name ASC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/benefits/:bid/status', async (req, res) => {
    const { bid } = req.params;
    const { newStatus, responsible } = req.body;

    try {
        const row = await dbGet(`SELECT status FROM employee_benefits WHERE id = $1`, [bid]);
        if (!row) return res.status(404).json({ error: 'Beneficio nao encontrado' });
        const oldStatus = row.status;

        await dbRun(`UPDATE employee_benefits SET status = $1 WHERE id = $2`, [newStatus, bid]);
        await dbRun(
            `INSERT INTO benefit_history (benefit_id, status_anterior, status_novo, responsavel) VALUES ($1, $2, $3, $4)`,
            [bid, oldStatus, newStatus, responsible || 'Sistema']
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/benefits/bulk-init-va', async (req, res) => {
    const { responsible } = req.body;
    const vaName = 'VALE ALIMENTACAO';
    const vaValue = '0.10';
    const vaObs = 'R$ 22,00 POR DIA TRABALHADO';
    const today = new Date().toISOString().split('T')[0];

    try {
        const employees = await dbAll(`SELECT id FROM employees WHERE type != 'Desligado'`);
        let addedCount = 0;

        await dbRun('BEGIN TRANSACTION');

        for (const emp of employees) {
            const existing = await dbGet(
                `SELECT id FROM employee_benefits WHERE employee_id = ? AND (benefit_name = ? OR benefit_name = 'VALE ALIMENTA��O')`,
                [emp.id, vaName]
            );
            if (existing) continue;

            const bid = generateId();
            await dbRun(
                `INSERT INTO employee_benefits (id, employee_id, benefit_name, value, start_date, status, observation) VALUES (?,?,?,?,?,?,?)`,
                [bid, emp.id, vaName, vaValue, today, 'Concedido', vaObs]
            );
            await dbRun(
                `INSERT INTO benefit_history (benefit_id, status_anterior, status_novo, responsavel) VALUES (?, 'INEXISTENTE', 'Concedido', ?)`,
                [bid, responsible || 'Admin']
            );
            addedCount += 1;
        }

        await dbRun('COMMIT');
        res.json({ success: true, message: `Processo de VA concluido. ${addedCount} registro(s) adicionados.` });
    } catch (err) {
        await dbRun('ROLLBACK').catch(() => {});
        res.status(500).json({ error: err.message });
    }
});

router.post('/generic-delete/:table/:id', async (req, res) => {
    const { table, id } = req.params;
    
    // Lista de tabelas permitidas para evitar SQL injection
    const allowed = ['employee_benefits', 'employee_dependents', 'employee_emergency_contacts'];
    if (!allowed.includes(table)) return res.status(403).json({ error: 'Tabela nao permitida para exclusao direta' });

    try {
        await dbRun(`DELETE FROM ${table} WHERE id = $1`, [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/admit', async (req, res) => {
    const { emp, docs, sizes } = req.body;
    const id = generateId();
    const responsible = 'Sistema RH+ (Auto)';

    // Normalização automática dos dados do employee
    if (emp.name) emp.name = emp.name.toString().toUpperCase().trim();
    if (emp.role) emp.role = emp.role.toString().toUpperCase().trim();
    if (emp.sector) emp.sector = emp.sector.toString().toUpperCase().trim();
    if (emp.cbo) emp.cbo = emp.cbo.toString().replace(/[^\d]/g, '').padStart(6, '0');
    if (emp.fatherName) emp.fatherName = emp.fatherName.toString().toUpperCase().trim();
    if (emp.motherName) emp.motherName = emp.motherName.toString().toUpperCase().trim();
    if (emp.personalEmail) emp.personalEmail = emp.personalEmail.toString().toLowerCase().trim();
    if (emp.street) emp.street = emp.street.toString().toUpperCase().trim();
    if (emp.neighborhood) emp.neighborhood = emp.neighborhood.toString().toUpperCase().trim();
    if (emp.city) emp.city = emp.city.toString().toUpperCase().trim();
    if (emp.state_uf) emp.state_uf = emp.state_uf.toString().toUpperCase().trim();
    if (!emp.sector) emp.sector = 'ADMINISTRATIVO';

    emp.initialRole = emp.role;
    emp.initialSalary = emp.currentSalary;

    try {
        await dbRun('BEGIN TRANSACTION');

        const empKeys = ['id', ...Object.keys(emp)];
        const empValues = [id, ...Object.values(emp)];
        const empPlaceholders = empKeys.map(() => '?').join(',');
        await dbRun(`INSERT INTO employees (${empKeys.join(',')}) VALUES (${empPlaceholders})`, empValues);

        const docKeys = ['employee_id', ...Object.keys(docs)];
        const docValues = [id, ...Object.values(docs)];
        const docPlaceholders = docKeys.map(() => '?').join(',');
        await dbRun(`INSERT INTO employee_documents (${docKeys.join(',')}) VALUES (${docPlaceholders})`, docValues);

        const roleRow = await dbGet(`SELECT id FROM roles_master WHERE name = ?`, [emp.role]);
        if (roleRow) {
            const items = await dbAll(
                `SELECT ki.* FROM kit_items ki JOIN kits_master km ON ki.kit_id = km.id WHERE km.role_id = ?`,
                [roleRow.id]
            );

            for (const ki of items) {
                const itemId = generateId();
                const typeLower = String(ki.item_type || '').toLowerCase();
                let itemSize = 'M';

                if (typeLower.includes('camisa') || typeLower.includes('polo')) itemSize = sizes?.shirt || 'M';
                else if (typeLower.includes('calca') || typeLower.includes('cal�a') || typeLower.includes('jeans')) itemSize = sizes?.pants || '40';
                else if (typeLower.includes('bota') || typeLower.includes('sapato') || typeLower.includes('tenis') || typeLower.includes('t�nis')) itemSize = sizes?.shoe || '40';

                const cycleDays = emp.type === 'ADM' ? 365 : 180;
                const nextDate = new Date(emp.admissionDate);
                nextDate.setDate(nextDate.getDate() + cycleDays);

                await dbRun(
                    `INSERT INTO uniform_items (id, employee_id, type, color, size, dateGiven, nextExchangeDate, status) VALUES (?,?,?,?,?,?,?,?)`,
                    [itemId, id, ki.item_type, ki.color, itemSize, emp.admissionDate, nextDate.toISOString().split('T')[0], 'Em dia']
                );

                await dbRun(
                    `INSERT INTO uniform_history (item_id, employee_id, type, color, tipo_movimentacao, status_peca, observacao, responsavel)
                     VALUES (?, ?, ?, ?, 'RECEBIMENTO', 'NOVO', 'Injecao Automatica via Admissao', ?)`,
                    [itemId, id, ki.item_type, ki.color, responsible]
                );
            }
        }

        const asoId = generateId();
        const asoExpiry = new Date(emp.admissionDate);
        asoExpiry.setFullYear(asoExpiry.getFullYear() + 1);
        await dbRun(
            `INSERT INTO aso_records (id, employee_id, exam_type, exam_date, expiry_date, result, clinic, doctor_name, crm, observation)
             VALUES (?, ?, 'ADMISSAO', ?, ?, 'Apto', 'Clinica Credenciada', 'Dr. Automatico', 'CRM-AUTO', 'Gerado automaticamente na admissao')`,
            [asoId, id, emp.admissionDate, asoExpiry.toISOString().split('T')[0]]
        );

        const benId = generateId();
        await dbRun(
            `INSERT INTO employee_benefits (id, employee_id, benefit_name, value, start_date, status, observation)
             VALUES (?, ?, 'VALE ALIMENTACAO', '0.10', ?, 'Concedido', ?)`,
            [benId, id, emp.admissionDate, 'R$ 22,00 POR DIA TRABALHADO']
        );
        await dbRun(
            `INSERT INTO benefit_history (benefit_id, status_anterior, status_novo, responsavel) VALUES (?, 'INEXISTENTE', 'Concedido', 'Sistema RH+')`,
            [benId]
        );

        const careerId = generateId();
        await dbRun(
            `INSERT INTO career_history (id, employee_id, role, sector, salary, move_type, date, responsible, observation, cbo)
             VALUES (?, ?, ?, ?, ?, 'Admissao', ?, 'Sistema RH+ (Auto)', 'Registro inicial de contrato', ?)`,
            [careerId, id, emp.role, emp.sector, emp.currentSalary, emp.admissionDate, emp.cbo]
        );

        await dbRun('COMMIT');

        res.json({ success: true, id });
    } catch (err) {
        await dbRun('ROLLBACK').catch(() => {});
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id/full', (req, res) => res.redirect(`/api/employees-pro/${req.params.id}/dossier`));

router.get('/:id/dossier', async (req, res) => {
    const id = req.params.id;
    console.log(`🔍 Dossier solicitado para ID: ${id}`);
    
    try {
        const sqlEmp = `
            SELECT e.*, emp.name as employer_name, emp.cnpj as employer_cnpj, wp.name as workplace_name, wp.cnpj as workplace_cnpj
            FROM employees e
            LEFT JOIN companies emp ON e.employer_id = emp.id
            LEFT JOIN companies wp ON e.workplace_id = wp.id
            WHERE e.id = $1
        `;

        const empResult = await dbGet(sqlEmp, [id]);
        
        if (!empResult) {
            console.log(`❌ Colaborador ${id} não encontrado`);
            return res.status(404).json({ success: false, error: 'Colaborador nao localizado' });
        }
        
        console.log(`✅ Colaborador encontrado: ${empResult.name}`);

        const data = {
            success: true,
            employee: empResult,
            career: [],
            occurrences: [],
            uniformItems: [],
            uniformHistory: [],
            benefits: [],
            benefitHistory: [],
            documents: {},
            dependents: [],
            emergencyContacts: [],
            vacations: [],
            aso: [],
            absenteismo: [],
            toolItems: [],
            toolHistory: [],
            vinculos: [],
            terminationData: null,
            archiveData: null
        };

        // Buscar dados relacionados em paralelo
        const [
            career, occurrences, uniformItems, uniformHistory, benefits,
            benefitHistory, documents, dependents, emergencyContacts, vacations,
            aso, absenteismo, toolItems, toolHistory, vinculos, terminationData, archiveData
        ] = await Promise.all([
            dbAll(`SELECT * FROM career_history WHERE employee_id = $1 ORDER BY date DESC`, [id]),
            dbAll(`SELECT * FROM occurrences WHERE employee_id = $1 ORDER BY date DESC`, [id]),
            dbAll(`SELECT * FROM uniform_items WHERE employee_id = $1 AND status != 'Devolvido'`, [id]),
            dbAll(`SELECT * FROM uniform_history WHERE employee_id = $1 ORDER BY data_hora DESC`, [id]),
            dbAll(`SELECT * FROM employee_benefits WHERE employee_id = $1`, [id]),
            dbAll(`SELECT h.*, b.benefit_name FROM benefit_history h JOIN employee_benefits b ON h.benefit_id = b.id WHERE b.employee_id = $1 ORDER BY h.data_hora DESC`, [id]),
            dbGet(`SELECT * FROM employee_documents WHERE employee_id = $1`, [id]),
            dbAll(`SELECT * FROM employee_dependents WHERE employee_id = $1`, [id]),
            dbAll(`SELECT * FROM employee_emergency_contacts WHERE employee_id = $1`, [id]),
            dbAll(`SELECT * FROM vacation_records WHERE employee_id = $1 ORDER BY start_date DESC`, [id]),
            dbAll(`SELECT * FROM aso_records WHERE employee_id = $1 ORDER BY exam_date DESC`, [id]),
            dbAll(`SELECT * FROM sst_certificates WHERE employee_id = $1 ORDER BY start_date DESC`, [id]),
            dbAll(`SELECT * FROM tool_items WHERE employee_id = $1 AND status != 'Devolvido'`, [id]),
            dbAll(`SELECT * FROM tool_history WHERE employee_id = $1 ORDER BY data_hora DESC`, [id]),
            dbAll(`
                SELECT ev.*, emp.name as employer_name, emp.cnpj as employer_cnpj, wp.name as workplace_name, wp.cnpj as workplace_cnpj
                FROM employee_vinculos ev
                LEFT JOIN companies emp ON ev.employer_id = emp.id
                LEFT JOIN companies wp ON ev.workplace_id = wp.id
                WHERE ev.employee_id = $1
                ORDER BY ev.principal DESC
            `, [id]),
            dbGet(`
                SELECT * FROM employee_terminations
                WHERE employee_id = $1
                ORDER BY created_at DESC LIMIT 1
            `, [id]),
            dbGet(`
                SELECT * FROM employee_archive
                WHERE employee_id = $1
            `, [id]),
        ]);

        // Atribuir resultados
        data.career = career;
        data.occurrences = occurrences;
        data.uniformItems = uniformItems;
        data.uniformHistory = uniformHistory;
        data.benefits = benefits;
        data.benefitHistory = benefitHistory;
        data.documents = documents || {};
        data.dependents = dependents;
        data.emergencyContacts = emergencyContacts;
        data.vacations = vacations;
        data.aso = aso;
        data.absenteismo = absenteismo;
        data.toolItems = toolItems;
        data.toolHistory = toolHistory;
        data.vinculos = vinculos;
        data.terminationData = terminationData || null;
        data.archiveData = archiveData || null;

        // Parse archiveData se for string JSON
        if (data.archiveData && typeof data.archiveData.archive_data === 'string') {
            try {
                data.archiveData = JSON.parse(data.archiveData.archive_data);
            } catch (e) {
                data.archiveData = null;
            }
        }

        // Adicionar vinculos ao employee se existir
        if (data.vinculos && data.vinculos.length > 0) {
            data.employee.vinculos = data.vinculos;
            const principal = data.vinculos.find(v => v.principal) || data.vinculos[0];
            if (principal) {
                data.employee.employer_id = principal.employer_id;
                data.employee.workplace_id = principal.workplace_id;
                data.employee.employer_name = principal.employer_name;
                data.employee.employer_cnpj = principal.employer_cnpj;
                data.employee.workplace_name = principal.workplace_name;
                data.employee.workplace_cnpj = principal.workplace_cnpj;
            }
        }

        console.log(`✅ Dossier completo enviado para ${empResult.name}`);
        res.json(data);
        
    } catch (err) {
        console.error('❌ Erro ao carregar dossier:', err);
        res.status(500).json({ success: false, error: err.message, id });
    }
});

router.put('/:id/metadata', async (req, res) => {
    const { id } = req.params;
    const { emp, docs } = req.body;

    // Mapeamento de campos do frontend para colunas do banco
    const fieldMapping = {
        'birthdate': 'birthDate',
        'birth_date': 'birthDate',
        'admissiondate': 'admissionDate',
        'admission_date': 'admissionDate',
        'terminationdate': 'terminationDate',
        'termination_date': 'terminationDate',
        'postalcode': 'postalCode',
        'pis_pasep': 'pisPasep',
        'personal_email': 'personalEmail',
        'personalemail': 'personalEmail',
        'fathername': 'fatherName',
        'mothername': 'motherName',
        'work_schedule': 'work_schedule',
        'work_scale': 'work_scale',
        'educationlevel': 'educationLevel',
        'education_level': 'educationLevel',
        'maritalstatus': 'maritalStatus',
        'marital_status': 'maritalStatus',
        'placeofbirth': 'placeOfBirth',
        'place_of_birth': 'placeOfBirth',
        'initialrole': 'initialRole',
        'initialsalary': 'initialSalary',
        'terminationreason': 'terminationReason'
    };

    // Normaliza nomes de campos
    const normalizeFieldName = (name) => {
        const lower = name.toLowerCase();
        return fieldMapping[lower] || name;
    };

    // Normalização de campos do emp
    if (emp) {
        if (emp.registrationNumber) emp.registrationNumber = emp.registrationNumber.toString().replace(/[^\d]/g, '');
        if (emp.cpf) emp.cpf = emp.cpf.toString().replace(/[^\d]/g, '');
        if (emp.rg) emp.rg = emp.rg.toString().replace(/[^\dX]/gi, '').toUpperCase();
        if (emp.pisPasep) emp.pisPasep = emp.pisPasep.toString().replace(/[^\d]/g, '');
        if (emp.postalCode) emp.postalCode = emp.postalCode.toString().replace(/[^\d]/g, '');
        if (emp.cbo) emp.cbo = emp.cbo.toString().replace(/[^\d]/g, '').padStart(6, '0');
        if (emp.fatherName) emp.fatherName = emp.fatherName.toString().toUpperCase().trim();
        if (emp.motherName) emp.motherName = emp.motherName.toString().toUpperCase().trim();
        if (emp.personalEmail) emp.personalEmail = emp.personalEmail.toString().toLowerCase().trim();
        if (emp.street) emp.street = emp.street.toString().toUpperCase().trim();
        if (emp.neighborhood) emp.neighborhood = emp.neighborhood.toString().toUpperCase().trim();
        if (emp.city) emp.city = emp.city.toString().toUpperCase().trim();
        if (emp.state_uf) emp.state_uf = emp.state_uf.toString().toUpperCase().trim();
    }

    try {
        await dbRun('BEGIN TRANSACTION');

        // Atualiza funcionário - mapeando nomes de campos
        const empKeys = Object.keys(emp).filter(k => k !== 'vinculos');
        if (empKeys.length > 0) {
            const mappedKeys = empKeys.map(k => normalizeFieldName(k));
            const empSet = mappedKeys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
            await dbRun(`UPDATE employees SET ${empSet} WHERE id = $${mappedKeys.length + 1}`, 
                [...empKeys.map(k => emp[k]), id]);
        }

        // Salvar vínculos
        if (emp.vinculos && Array.isArray(emp.vinculos)) {
            const incomingVinculos = emp.vinculos
                .map(v => ({
                    employer_id: String(v.employer_id || '').trim(),
                    workplace_id: String(v.workplace_id || '').trim(),
                    principal: !!v.principal
                }))
                .filter(v => v.employer_id || v.workplace_id);

            if (incomingVinculos.length > 0) {
                const principalVinculo = incomingVinculos.find(v => v.principal) || incomingVinculos[0];

                // Remove vínculos antigos e insere os novos
                await dbRun(`DELETE FROM employee_vinculos WHERE employee_id = $1`, [id]);
                
                for (const vinculo of incomingVinculos) {
                    const vid = generateId();
                    await dbRun(`INSERT INTO employee_vinculos (id, employee_id, employer_id, workplace_id, principal) VALUES ($1, $2, $3, $4, $5)`,
                        [vid, id, vinculo.employer_id, vinculo.workplace_id, vinculo.principal ? 1 : 0]);
                }

                // Atualiza o vínculo principal no funcionário para retrocompatibilidade
                if (principalVinculo) {
                    await dbRun(`UPDATE employees SET employer_id = $1, workplace_id = $2 WHERE id = $3`,
                        [principalVinculo.employer_id || null, principalVinculo.workplace_id || null, id]);
                }
            }
        }

        // Atualiza career_history se necessário
        if (emp.initialRole || emp.initialSalary) {
            const updates = [];
            const params = [];
            let paramIndex = 1;
            if (emp.initialRole) {
                updates.push(`role = $${paramIndex++}`);
                params.push(emp.initialRole);
            }
            if (emp.initialSalary) {
                updates.push(`salary = $${paramIndex++}`);
                params.push(emp.initialSalary);
            }
            if (updates.length) {
                params.push(id);
                await dbRun(
                    `UPDATE career_history SET ${updates.join(', ')} WHERE employee_id = $${paramIndex} AND move_type IN ('Admissao','Admisso','Admissão')`,
                    params
                );
            }
        }

        // Remover documentFiles de employee_documents, já tratado em rota específica
        const documentFiles = docs.documentFiles;
        if (docs.documentFiles !== undefined) {
            delete docs.documentFiles;
        }

        // Processar documentos
        const docRow = await dbGet(`SELECT employee_id FROM employee_documents WHERE employee_id = $1`, [id]);

        if (docRow) {
            const docKeys = Object.keys(docs);
            if (docKeys.length > 0) {
                const docSet = docKeys.map((k, i) => `${k} = $${i + 1}`).join(', ');
                await dbRun(`UPDATE employee_documents SET ${docSet} WHERE employee_id = $${docKeys.length + 1}`, 
                    [...Object.values(docs), id]);
            }
        } else {
            const docKeys = ['employee_id', ...Object.keys(docs)];
            const docPlaceholders = docKeys.map((_, i) => `$${i + 1}`).join(',');
            await dbRun(`INSERT INTO employee_documents (${docKeys.join(',')}) VALUES (${docPlaceholders})`, 
                [id, ...Object.values(docs)]);
        }

        // Atualizar metadata se necessário
        if (documentFiles !== undefined) {
            await dbRun('UPDATE employees SET metadata = COALESCE(metadata, \'{}\') WHERE id = $1', [id]);
            const mRow = await dbGet('SELECT metadata FROM employees WHERE id = $1', [id]);
            let existingMetadata = {};
            try { existingMetadata = mRow && mRow.metadata ? JSON.parse(mRow.metadata) : {}; } catch (e) {}
            existingMetadata.documentFiles = documentFiles;
            await dbRun('UPDATE employees SET metadata = $1 WHERE id = $2', [JSON.stringify(existingMetadata), id]);
        }

        await dbRun('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await dbRun('ROLLBACK').catch(() => {});
        res.status(500).json({ error: err.message });
    }
});

router.post('/:id/benefits', async (req, res) => {
    const { id } = req.params;
    const { benefit_name, value, start_date, status, responsible, observation } = req.body;
    const bid = generateId();

    try {
        await dbRun(
            `INSERT INTO employee_benefits (id, employee_id, benefit_name, value, start_date, status, observation) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
            [bid, id, benefit_name, value, start_date, status, observation || '']
        );
        await dbRun(
            `INSERT INTO benefit_history (benefit_id, status_anterior, status_novo, responsavel) VALUES ($1, 'INEXISTENTE', $2, $3)`,
            [bid, status, responsible || 'Sistema']
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/:id/emergency', async (req, res) => {
    const { name, phone, relationship } = req.body;
    try {
        await dbRun(
            `INSERT INTO employee_emergency_contacts (id, employee_id, name, phone, relationship) VALUES ($1,$2,$3,$4,$5)`,
            [generateId(), req.params.id, name, phone, relationship]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/:id/dependents', async (req, res) => {
    const { name, cpf, birth_date, relationship } = req.body;
    try {
        await dbRun(
            `INSERT INTO employee_dependents (id, employee_id, name, cpf, birth_date, relationship) VALUES ($1,$2,$3,$4,$5,$6)`,
            [generateId(), req.params.id, name, cpf, birth_date, relationship]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/:id/vinculo-transfer', async (req, res) => {
    const { fromEmployerId, fromWorkplaceId, toEmployerId, toWorkplaceId } = req.body;
    const changedBy = req.body.changed_by || 'Sistema';
    const id = req.params.id;

    if (!id || !toEmployerId || !toWorkplaceId) {
        return res.status(400).json({ success: false, error: 'Parâmetros insuficientes para transferência' });
    }

    try {
        await dbRun('BEGIN TRANSACTION');

        // Ajusta vínculo principal atual
        await dbRun(`UPDATE employee_vinculos SET principal = 0 WHERE employee_id = $1`, [id]);

        // Verifica se já existe um vínculo destino
        const existing = await dbGet(`SELECT id FROM employee_vinculos WHERE employee_id = $1 AND employer_id = $2 AND workplace_id = $3`, 
            [id, toEmployerId, toWorkplaceId]);

        if (existing) {
            // Atualiza vínculo existente como principal
            await dbRun(`UPDATE employee_vinculos SET principal = 1 WHERE id = $1`, [existing.id]);
        } else {
            // Cria novo vínculo
            const newVinculoId = crypto.randomBytes(8).toString('hex');
            await dbRun(`INSERT INTO employee_vinculos (id, employee_id, employer_id, workplace_id, principal) VALUES ($1, $2, $3, $4, 1)`,
                [newVinculoId, id, toEmployerId, toWorkplaceId]);
        }

        // Salva histórico de transferência
        const transferId = crypto.randomBytes(8).toString('hex');
        await dbRun(`INSERT INTO employee_vinculo_transfers (id, employee_id, from_employer_id, from_workplace_id, to_employer_id, to_workplace_id, changed_by) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [transferId, id, fromEmployerId || null, fromWorkplaceId || null, toEmployerId, toWorkplaceId, changedBy]);

        // Atualiza base employee
        await dbRun('UPDATE employees SET employer_id = $1, workplace_id = $2 WHERE id = $3', 
            [toEmployerId, toWorkplaceId, id]);

        await dbRun('COMMIT');
        res.json({ success: true });
    } catch (err) {
        await dbRun('ROLLBACK').catch(() => {});
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/:id/documentFiles', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verifica se coluna metadata existe, se não, cria
        try {
            await dbRun(`ALTER TABLE employees ADD COLUMN metadata TEXT`);
        } catch (alterErr) {
            // Ignora erro se coluna já existe
            if (!alterErr.message.includes('already exists') && 
                !alterErr.message.includes('duplicate column')) {
                throw alterErr;
            }
        }

        // Busca metadata atual
        const row = await dbGet('SELECT metadata FROM employees WHERE id = $1', [id]);
        
        let meta = {};
        try { 
            if (row && row.metadata) meta = JSON.parse(row.metadata); 
        } catch (e) {}

        meta.documentFiles = req.body.documentFiles || [];

        // Salva metadata atualizada
        await dbRun('UPDATE employees SET metadata = $1 WHERE id = $2', 
            [JSON.stringify(meta), id]);
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
