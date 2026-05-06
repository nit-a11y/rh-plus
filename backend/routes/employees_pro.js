const express = require('express');
const crypto = require('crypto');
const { query, transaction } = require('../config/database');

const router = express.Router();
const generateId = () => crypto.randomBytes(4).toString('hex');

router.get('/list-summary', async (req, res) => {
    try {
        const result = await query(`
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
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Rota para calcular tempo acumulado por CPF
router.get('/tempo-acumulado-cpf/:cpf', async (req, res) => {
    const { cpf } = req.params;
    
    try {
        const cpfLimpo = cpf.replace(/\D/g, '');
        
        // Buscar todos os funcionários com o mesmo CPF na tabela employees
        let employees_result = [];
        try {
            employees_result = await query(`
                SELECT 
                    id,
                    name,
                    "registrationNumber",
                    "admissionDate",
                    type,
                    "photoUrl",
                    "terminationDate"
                FROM employees 
                WHERE REPLACE(REPLACE(cpf, '.', ''), '-', '') = $1
            `, [cpfLimpo]);
            employees_result = employees_result.rows || [];
        } catch (e) {
            employees_result = [];
        }
        
        // Sistema simplificado - busca apenas na tabela employees
        let todosRegistros = [];
        
        // Adicionar apenas employees
        for (const emp of employees_result) {
            todosRegistros.push({
                ...emp,
                from_table: 'employees',
                dataAdmissao: emp.admissionDate,
                dataTerminacao: emp.terminationDate || emp.type === 'Desligado' ? emp.terminationDate : null
            });
        }
        
        if (todosRegistros.length === 0) {
            return res.json({ 
                tempoAcumulado: '0 meses',
                totalDias: 0,
                registros: [],
                totalRegistros: 0,
                cpf: cpfLimpo
            });
        }
        
        let totalDias = 0;
        const registrosComTempo = [];
        
        for (const emp of todosRegistros) {
            const dataAdmissao = emp.dataAdmissao || emp.admission_date;
            const dataTerminacao = emp.dataTerminacao || emp.termination_date;
            
            if (!dataAdmissao) continue;
            
            const inicio = new Date(dataAdmissao);
            const fim = dataTerminacao ? new Date(dataTerminacao) : new Date();
            const dias = Math.floor((fim - inicio) / (1000 * 60 * 60 * 24));
            
            if (dias > 0) {
                totalDias += dias;
                registrosComTempo.push({
                    ...emp,
                    dataAdmissao,
                    dataTerminacao,
                    dias,
                    tempo: calcularTempoCasaFormatado(dias)
                });
            }
        }
        
        const tempoAcumulado = calcularTempoCasaFormatado(totalDias);
        
        res.json({
            tempoAcumulado,
            totalDias,
            registros: registrosComTempo,
            totalRegistros: registrosComTempo.length,
            cpf: cpfLimpo
        });
        
    } catch (err) {
        console.error('Erro ao calcular tempo acumulado:', err);
        res.status(500).json({ error: err.message });
    }
});

// Função auxiliar para formatar tempo
function calcularTempoCasaFormatado(dias) {
    if (dias <= 0) return '0 meses';
    
    const anos = Math.floor(dias / 365);
    const meses = Math.floor((dias % 365) / 30);
    
    if (anos === 0) return `${meses} meses`;
    return `${anos} anos e ${meses} meses`;
}

router.put('/benefits/:bid/status', async (req, res) => {
    const { bid } = req.params;
    const { newStatus, responsible } = req.body;

    try {
        const result = await query(`SELECT status FROM employee_benefits WHERE id = $1`, [bid]);
        if (!result.rows[0]) return res.status(404).json({ error: 'Beneficio nao encontrado' });
        const oldStatus = result.rows[0].status;

        await query(`UPDATE employee_benefits SET status = $1 WHERE id = $2`, [newStatus, bid]);
        await query(
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
        const employees = await query(`SELECT id FROM employees WHERE type != 'Desligado'`);
        let addedCount = 0;

        await transaction(async (client) => {
            for (const emp of employees.rows) {
                const existing = await client.query(
                    `SELECT id FROM employee_benefits WHERE employee_id = $1 AND (benefit_name = $2 OR benefit_name = 'VALE ALIMENTAÇÃO')`,
                    [emp.id, vaName]
                );
                if (existing.rows.length > 0) continue;

                const bid = generateId();
                await client.query(
                    `INSERT INTO employee_benefits (id, employee_id, benefit_name, value, start_date, status, observation) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
                    [bid, emp.id, vaName, vaValue, today, 'Concedido', vaObs]
                );
                await client.query(
                    `INSERT INTO benefit_history (benefit_id, status_anterior, status_novo, responsavel) VALUES ($1, 'INEXISTENTE', 'Concedido', $2)`,
                    [bid, responsible || 'Admin']
                );
                addedCount += 1;
            }
        });
        res.json({ success: true, message: `Processo de VA concluido. ${addedCount} registro(s) adicionados.` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/generic-delete/:table/:id', async (req, res) => {
    const { table, id } = req.params;
    
    // Lista de tabelas permitidas para evitar SQL injection
    const allowed = ['employee_benefits', 'employee_dependents', 'employee_emergency_contacts'];
    if (!allowed.includes(table)) return res.status(403).json({ error: 'Tabela nao permitida para exclusao direta' });

    try {
        await query(`DELETE FROM ${table} WHERE id = $1`, [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/admit', async (req, res) => {
    const { emp, docs, sizes } = req.body;
    const id = generateId();
    const responsible = 'Sistema RH+ (Auto)';

    // Normalizacao automatica dos dados do employee
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
        await transaction(async (client) => {
            // Mapeamento de campos do frontend para colunas do banco PostgreSQL
            const fieldMapping = {
                'admissiondate': 'admissionDate',
                'admission_date': 'admissionDate',
                'admissiondate': 'admissionDate',
                'birthdate': 'birthDate',
                'birth_date': 'birthDate',
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
                'terminationreason': 'terminationReason',
                'photourl': 'photoUrl',
                'registrationnumber': 'registrationNumber'
            };

            // Normaliza nomes de campos para PostgreSQL
            const normalizeFieldName = (name) => {
                const lower = name.toLowerCase();
                return fieldMapping[lower] || name;
            };

            // Preparar campos e valores para insercao
            const empKeys = Object.keys(emp).map(k => normalizeFieldName(k));
            const empValues = Object.values(emp);
            const allKeys = ['id', ...empKeys];
            const allValues = [id, ...empValues];
            const empPlaceholders = allKeys.map((_, i) => `$${i + 1}`).join(',');
            
            console.log('?? DEBUG - Campos recebidos:', Object.keys(emp));
            console.log('?? DEBUG - Campos mapeados:', empKeys);
            console.log('?? DEBUG - SQL final:', `INSERT INTO employees (${allKeys.join(',')}) VALUES (${empPlaceholders})`);
            
            await client.query(`INSERT INTO employees (${allKeys.map(k => `"${k}"`).join(',')}) VALUES (${empPlaceholders})`, allValues);

            
            const roleResult = await client.query(`SELECT id FROM roles_master WHERE name = $1`, [emp.role]);
            if (roleResult.rows[0]) {
                const itemsResult = await client.query(
                    `SELECT ki.* FROM kit_items ki JOIN kits_master km ON ki.kit_id = km.id WHERE km.role_id = $1`,
                    [roleResult.rows[0].id]
                );

                for (const ki of itemsResult.rows) {
                    const itemId = generateId();
                    const typeLower = String(ki.item_type || '').toLowerCase();
                    let itemSize = 'M';

                    if (typeLower.includes('camisa') || typeLower.includes('polo')) itemSize = sizes?.shirt || 'M';
                    else if (typeLower.includes('calca') || typeLower.includes('calça') || typeLower.includes('jeans')) itemSize = sizes?.pants || '40';
                    else if (typeLower.includes('bota') || typeLower.includes('sapato') || typeLower.includes('tenis') || typeLower.includes('tênis')) itemSize = sizes?.shoe || '40';

                    const cycleDays = emp.type === 'ADM' ? 365 : 180;
                    const nextDate = new Date(emp.admissionDate);
                    nextDate.setDate(nextDate.getDate() + cycleDays);

                    await client.query(
                        `INSERT INTO uniform_items (id, employee_id, type, color, size, dateGiven, nextExchangeDate, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
                        [itemId, id, ki.item_type, ki.color, itemSize, emp.admissionDate, nextDate.toISOString().split('T')[0], 'Em dia']
                    );

                    await client.query(
                        `INSERT INTO uniform_history (item_id, employee_id, type, color, tipo_movimentacao, status_peca, observacao, responsavel)
                         VALUES ($1, $2, $3, $4, 'RECEBIMENTO', 'NOVO', 'Injecao Automatica via Admissao', $5)`,
                        [itemId, id, ki.item_type, ki.color, responsible]
                    );
                }
            }

            const asoId = generateId();
            const asoExpiry = new Date(emp.admissionDate);
            asoExpiry.setFullYear(asoExpiry.getFullYear() + 1);
            await client.query(
                `INSERT INTO aso_records (id, employee_id, exam_type, exam_date, expiry_date, result, clinic, doctor_name, crm, observation)
                 VALUES ($1, $2, 'ADMISSAO', $3, $4, 'Apto', 'Clinica Credenciada', 'Dr. Automatico', 'CRM-AUTO', 'Gerado automaticamente na admissao')`,
                [asoId, id, emp.admissionDate, asoExpiry.toISOString().split('T')[0]]
            );

            const benId = generateId();
            await client.query(
                `INSERT INTO employee_benefits (id, employee_id, benefit_name, value, start_date, status, observation)
                 VALUES ($1, $2, 'VALE ALIMENTACAO', '0.10', $3, 'Concedido', $4)`,
                [benId, id, emp.admissionDate, 'R$ 22,00 POR DIA TRABALHADO']
            );
            await client.query(
                `INSERT INTO benefit_history (benefit_id, status_anterior, status_novo, responsavel) VALUES ($1, 'INEXISTENTE', 'Concedido', 'Sistema RH+')`,
                [benId]
            );

            const careerId = generateId();
            await client.query(
                `INSERT INTO career_history (id, employee_id, role, sector, salary, move_type, date, responsible, observation, cbo)
                 VALUES ($1, $2, $3, $4, $5, 'Admissao', $6, 'Sistema RH+ (Auto)', 'Registro inicial de contrato', $7)`,
                [careerId, id, emp.role, emp.sector, emp.currentSalary, emp.admissionDate, emp.cbo]
            );
        });

        res.json({ success: true, id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id/full', (req, res) => res.redirect(`/api/employees-pro/${req.params.id}/dossier`));

router.get('/:id/dossier', async (req, res) => {
    const id = req.params.id;
    console.log(`?? Dossier solicitado para ID: ${id}`);
    
    try {
        const sqlEmp = `
            SELECT e.*, emp.name as employer_name, emp.cnpj as employer_cnpj, wp.name as workplace_name, wp.cnpj as workplace_cnpj
            FROM employees e
            LEFT JOIN companies emp ON e.employer_id = emp.id
            LEFT JOIN companies wp ON e.workplace_id = wp.id
            WHERE e.id = $1
        `;

        const empResult = await query(sqlEmp, [id]);
        
        if (!empResult.rows[0]) {
            console.log(`? Colaborador ${id} não encontrado`);
            return res.status(404).json({ 
                success: false, 
                error: 'Colaborador não localizado',
                received_id: id,
                suggestion: 'Verifique se o ID está correto ou recarregue a página'
            });
        }
        
        console.log(`? Colaborador encontrado: ${empResult.rows[0].name}`);

        const data = {
            success: true,
            employee: empResult.rows[0],
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
            query(`SELECT * FROM career_history WHERE employee_id = $1 ORDER BY date DESC`, [id]),
            query(`SELECT * FROM occurrences WHERE employee_id = $1 ORDER BY date DESC`, [id]),
            query(`SELECT * FROM uniform_items WHERE employee_id = $1 AND status != 'Devolvido'`, [id]),
            query(`SELECT * FROM uniform_history WHERE employee_id = $1 ORDER BY data_hora DESC`, [id]),
            query(`SELECT * FROM employee_benefits WHERE employee_id = $1`, [id]),
            query(`SELECT h.*, b.benefit_name FROM benefit_history h JOIN employee_benefits b ON h.benefit_id = b.id WHERE b.employee_id = $1 ORDER BY h.data_hora DESC`, [id]),
            query(`SELECT * FROM employee_documents WHERE employee_id = $1`, [id]),
            query(`SELECT * FROM employee_dependents WHERE employee_id = $1`, [id]),
            query(`SELECT * FROM employee_emergency_contacts WHERE employee_id = $1`, [id]),
            query(`SELECT * FROM vacation_records WHERE employee_id = $1 ORDER BY start_date DESC`, [id]),
            query(`SELECT * FROM aso_records WHERE employee_id = $1 ORDER BY exam_date DESC`, [id]),
            query(`SELECT * FROM sst_certificates WHERE employee_id = $1 ORDER BY start_date DESC`, [id]),
            query(`SELECT * FROM tool_items WHERE employee_id = $1 AND status != 'Devolvido'`, [id]),
            query(`SELECT * FROM tool_history WHERE employee_id = $1 ORDER BY data_hora DESC`, [id]),
            Promise.resolve({ rows: [] }), // Não busca mais employee_vinculos
            query(`
                SELECT * FROM employee_terminations
                WHERE employee_id = $1
                ORDER BY created_at DESC LIMIT 1
            `, [id]),
            query(`
                SELECT * FROM employee_archive
                WHERE employee_id = $1
            `, [id]),
        ]);

        // Atribuir resultados
        data.career = career.rows;
        data.occurrences = occurrences.rows;
        data.uniformItems = uniformItems.rows;
        data.uniformHistory = uniformHistory.rows;
        data.benefits = benefits.rows;
        data.benefitHistory = benefitHistory.rows;
        data.documents = documents.rows[0] || {};
        data.dependents = dependents.rows;
        data.emergencyContacts = emergencyContacts.rows;
        data.vacations = vacations.rows;
        data.aso = aso.rows;
        data.absenteismo = absenteismo.rows;
        data.toolItems = toolItems.rows;
        data.toolHistory = toolHistory.rows;
        data.vinculos = vinculos.rows;
        data.terminationData = terminationData.rows[0] || null;
        data.archiveData = archiveData.rows[0] || null;

        // Parse archiveData se for string JSON
        if (data.archiveData && typeof data.archiveData.archive_data === 'string') {
            try {
                data.archiveData = JSON.parse(data.archiveData.archive_data);
            } catch (e) {
                data.archiveData = null;
            }
        }

        // Não usa mais employee_vinculos - dados diretos do employee

        console.log(`? Dossier completo enviado para ${empResult.rows[0].name}`);
        res.json(data);
        
    } catch (err) {
        console.error('? Erro ao carregar dossier:', err);
        res.status(500).json({ success: false, error: err.message, id });
    }
});

// Função utilitária para obter vínculo ativo
async function getVinculoAtual(employeeId) {
    const result = await query(`
        SELECT * FROM employee_vinculos 
        WHERE employee_id = $1 AND status = 'ATIVO' 
        ORDER BY data_inicio DESC 
        LIMIT 1
    `, [employeeId]);
    return result.rows[0] || null;
}

// Middleware anti-cache para rota metadata
router.use('/:id/metadata', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

// ROTA PRINCIPAL DE SALVAMENTO - SIMPLIFICADA
router.put('/:id/metadata', async (req, res) => {
    const { id } = req.params;
    const { emp, docs } = req.body;

    // VALIDAÇÃO JSON ROBUSTA
    if (emp && emp.metadata) {
        try {
            const parsed = JSON.parse(emp.metadata);
            emp.metadata = JSON.stringify(parsed);
        } catch (jsonError) {
            console.log('Metadata inválido detectado, limpando:', jsonError.message);
            emp.metadata = '{}';
        }
    }

    // MAPEAMENTO DE CAMPOS - Frontend → Banco
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

    // FUNÇÃO DE NORMALIZAÇÃO
    const normalizeFieldName = (name) => {
        const lower = name.toLowerCase();
        return fieldMapping[lower] || name;
    };

    // NORMALIZAÇÃO DE DADOS
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
        await transaction(async (client) => {
            // 1. ATUALIZAR DADOS DO FUNCIONÁRIO
            const empKeys = Object.keys(emp).filter(k => k !== 'vinculos');
            if (empKeys.length > 0) {
                const mappedKeys = empKeys.map(k => normalizeFieldName(k));
                const empSet = mappedKeys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
                await client.query(`UPDATE employees SET ${empSet} WHERE id = $${mappedKeys.length + 1}`, 
                    [...empKeys.map(k => emp[k]), id]);
            }

            // 2. ATUALIZAR VÍNCULOS (Simplificado - apenas campos diretos)
            if (emp.vinculos && Array.isArray(emp.vinculos) && emp.vinculos.length > 0) {
                const vinculoPrincipal = emp.vinculos.find(v => v.principal) || emp.vinculos[0];
                
                if (vinculoPrincipal && (vinculoPrincipal.employer_id || vinculoPrincipal.workplace_id)) {
                    await client.query(`
                        UPDATE employees 
                        SET employer_id = $1, workplace_id = $2, updated_at = $3
                        WHERE id = $4
                    `, [
                        vinculoPrincipal.employer_id || null,
                        vinculoPrincipal.workplace_id || null,
                        new Date(),
                        id
                    ]);
                }
            }

            // 3. ATUALIZAR DOCUMENTOS (employee_documents)
            if (docs) {
                const docKeys = Object.keys(docs).filter(k => docs[k] !== undefined && docs[k] !== '');
                if (docKeys.length > 0) {
                    // Verificar se já existe
                    const existingDoc = await client.query('SELECT employee_id FROM employee_documents WHERE employee_id = $1', [id]);
                    
                    if (existingDoc.rows.length > 0) {
                        // UPDATE
                        const docSet = docKeys.map((k, i) => `"${k}" = $${i + 2}`).join(', ');
                        await client.query(`UPDATE employee_documents SET ${docSet} WHERE employee_id = $1`, 
                            [id, ...docKeys.map(k => docs[k])]);
                    } else {
                        // INSERT
                        const docColumns = ['employee_id', ...docKeys];
                        const docValues = [id, ...docKeys.map(k => docs[k])];
                        const placeholders = docColumns.map((_, i) => `$${i + 1}`).join(', ');
                        
                        await client.query(`INSERT INTO employee_documents (${docColumns.join(', ')}) VALUES (${placeholders})`, docValues);
                    }
                }
            }
        });

        res.json({ success: true, message: 'Dados atualizados com sucesso' });
        
    } catch (err) {
        console.error('Erro ao atualizar metadata:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ROTA PARA SALVAR ARQUIVOS DE DOCUMENTOS - CORRIGIDA
router.post('/:id/documentFiles', async (req, res) => {
    const { id } = req.params;
    const { documentFiles } = req.body;
    
    try {
        if (!documentFiles || !Array.isArray(documentFiles)) {
            return res.status(400).json({ error: 'documentFiles deve ser um array' });
        }
        
        // Buscar metadata atual
        const currentMeta = await query('SELECT metadata FROM employees WHERE id = $1', [id]);
        const existingMeta = currentMeta.rows[0]?.metadata || '{}';
        
        // Fazer parse do metadata existente
        let parsedMeta = {};
        try {
            parsedMeta = JSON.parse(existingMeta);
        } catch (e) {
            parsedMeta = {};
        }
        
        // Adicionar documentFiles ao metadata
        parsedMeta.documentFiles = documentFiles;
        
        // Atualizar metadata completo
        await query(`
            UPDATE employees 
            SET metadata = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
        `, [JSON.stringify(parsedMeta), id]);
        
        res.json({ success: true, message: 'Arquivos salvos com sucesso' });
        
    } catch (error) {
        console.error('Erro ao salvar arquivos:', error);
        res.status(500).json({ error: error.message });
    }
});


// Rota DELETE para excluir vínculo específico
router.delete('/:id/vinculos/:vinculoId', async (req, res) => {
    const { id, vinculoId } = req.params;
    
    try {
        // Iniciar transação
        await query('BEGIN');
        
        // 1. Verificar se o vínculo existe e pertence ao employee
        const vinculoCheck = await query(`
            SELECT ev.*, 
                   COUNT(*) OVER() as total_vinculos,
                   COUNT(CASE WHEN ev.tipo_vinculo = 'ATUAL' AND ev.status = 'ATIVO' THEN 1 END) OVER() as ativos_count
            FROM employee_vinculos ev
            WHERE ev.id = $1 AND ev.employee_id = $2
        `, [vinculoId, id]);
        
        if (vinculoCheck.rows.length === 0) {
            await query('ROLLBACK');
            return res.status(404).json({ error: 'Vínculo não encontrado' });
        }
        
        const vinculo = vinculoCheck.rows[0];
        const totalVinculos = vinculo.total_vinculos;
        const ativosCount = vinculo.ativos_count;
        
        // 2. Aplicar regras de exclusão
        const deleteRules = validateDeleteRules(vinculo, totalVinculos, ativosCount);
        
        if (!deleteRules.canDelete) {
            await query('ROLLBACK');
            return res.status(400).json({ error: deleteRules.reason });
        }
        
        // 3. Se for o único vínculo, também limpar a tabela employees
        if (totalVinculos === 1) {
            await query(`
                UPDATE employees 
                SET employer_id = NULL, workplace_id = NULL, updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [id]);
            
            console.log('? Tabela employees limpa (único vínculo removido)');
        }
        
        // 4. Se for vínculo ATUAL e houver PASSADOS, promover o mais recente
        if (vinculo.tipo_vinculo === 'ATUAL' && vinculo.status === 'ATIVO') {
            const promoteVinculo = await query(`
                SELECT id FROM employee_vinculos 
                WHERE employee_id = $1 AND id != $2 
                ORDER BY data_inicio DESC 
                LIMIT 1
            `, [id, vinculoId]);
            
            if (promoteVinculo.rows.length > 0) {
                await query(`
                    UPDATE employee_vinculos 
                    SET tipo_vinculo = 'ATUAL', status = 'ATIVO', updated_at = CURRENT_TIMESTAMP
                    WHERE id = $1
                `, [promoteVinculo.rows[0].id]);
                
                // Atualizar employees para o novo vínculo ATUAL
                await query(`
                    UPDATE employees e
                    SET employer_id = ev.employer_id, 
                        workplace_id = ev.workplace_id,
                        updated_at = CURRENT_TIMESTAMP
                    FROM employee_vinculos ev
                    WHERE e.id = $1 AND ev.id = $2
                `, [id, promoteVinculo.rows[0].id]);
                
                console.log('? Vínculo promovido para ATUAL');
            }
        }
        
        // 5. Registrar exclusão no log
        await query(`
            INSERT INTO operation_logs 
            (id, operation_type, table_name, record_id, old_data, status, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        `, [
            require('crypto').randomBytes(8).toString('hex'),
            'DELETE',
            'employee_vinculos',
            vinculoId,
            JSON.stringify(vinculo),
            'SUCCESS'
        ]);
        
        // 6. Excluir o vínculo
        await query(`
            DELETE FROM employee_vinculos 
            WHERE id = $1 AND employee_id = $2
        `, [vinculoId, id]);
        
        // 7. Commit da transação
        await query('COMMIT');
        
        console.log(`? Vínculo ${vinculoId} excluído com sucesso`);
        
        res.json({
            success: true,
            message: 'Vínculo excluído com sucesso',
            vinculo_excluido: {
                id: vinculoId,
                employer_id: vinculo.employer_id,
                workplace_id: vinculo.workplace_id,
                sequencia: vinculo.sequencia,
                tipo_vinculo: vinculo.tipo_vinculo
            }
        });
        
    } catch (error) {
        await query('ROLLBACK');
        console.error('Erro ao excluir v�nculo:', error);
        res.status(500).json({ error: error.message });
    }
});

// Fun��o para validar regras de exclus�o
function validateDeleteRules(vinculo, totalVinculos, ativosCount) {
    // Regra 1: N�o pode excluir o �nico v�nculo
    if (totalVinculos === 1) {
        return {
            canDelete: false,
            reason: 'N�o � poss�vel excluir o �nico v�nculo do colaborador. Adicione um novo v�nculo antes de excluir este.'
        };
    }
    
    // Regra 2: Pode excluir v�nculos PASSADOS
    if (vinculo.tipo_vinculo === 'PASSADO') {
        return { canDelete: true };
    }
    
    // Regra 3: Pode excluir v�nculo ATUAL se n�o houver PASSADOS
    if (vinculo.tipo_vinculo === 'ATUAL' && vinculo.status === 'ATIVO') {
        const hasPastVinculos = totalVinculos > ativosCount;
        
        if (hasPastVinculos) {
            return {
                canDelete: false,
                reason: 'N�o � poss�vel excluir o v�nculo ATUAL enquanto houver v�nculos PASSADOS. Exclua os v�nculos PASSADOS primeiro.'
            };
        }
        
        return { canDelete: true };
    }
    
    // Regra 4: Pode excluir v�nculos ENCERRADOS/TRANSFERIDOS
    if (vinculo.status === 'ENCERRADO' || vinculo.status === 'TRANSFERIDO') {
        return { canDelete: true };
    }
    
    return {
        canDelete: false,
        reason: 'Regras de exclus�o n�o permitem esta opera��o.'
    };
}



// Rota GET para obter v�nculos com hist�rico completo
router.get('/:id/vinculos-com-historico', async (req, res) => {
    const { id } = req.params;
    
    try {
        // Buscar todos os v�nculos do colaborador
        const vinculos = await query(`
            SELECT 
                ev.*,
                emp.name as employer_name,
                emp.cnpj as employer_cnpj,
                wp.name as workplace_name,
                wp.cnpj as workplace_cnpj,
                CASE 
                    WHEN ev.data_transferencia IS NOT NULL THEN 
                        'Transferido em ' || TO_CHAR(ev.data_transferencia, 'DD/MM/YYYY HH:MI')
                    WHEN ev.data_fim IS NOT NULL THEN 
                        'Encerrado em ' || TO_CHAR(ev.data_fim, 'DD/MM/YYYY')
                    ELSE 'V�nculo atual'
                END as status_descricao,
                CASE 
                    WHEN ev.sequencia = 1 THEN 'PRINCIPAL'
                    WHEN ev.tipo_vinculo = 'ATUAL' THEN 'ATUAL'
                    ELSE 'PASSADO'
                END as tipo_descricao
            FROM employee_vinculos ev
            LEFT JOIN companies emp ON ev.employer_id = emp.id
            LEFT JOIN companies wp ON ev.workplace_id = wp.id
            WHERE ev.employee_id = $1 
            ORDER BY ev.sequencia
        `, [id]);
        
        res.json(vinculos.rows);
        
    } catch (error) {
        console.error('Erro ao buscar v�nculos:', error);
        res.status(500).json({ error: error.message });
    }
});



// Rota POST para adicionar novo v�nculo

// Middleware para corre��o autom�tica de estado de v�nculos
router.use('/:id/vinculos', async (req, res, next) => {
    const { id } = req.params;
    
    // Corrigir estado antes de processar a requisi��o
    await corrigirEstadoVinculos(id);
    
    next();
});


router.post('/:id/vinculos', async (req, res) => {
    const { id } = req.params;
    const { 
        employer_id, workplace_id, data_inicio, data_fim, 
        data_transferencia, tipo_vinculo, status 
    } = req.body;
    
    if (!employer_id || !workplace_id || !data_inicio) {
        return res.status(400).json({ 
            error: 'Empregador, local e data de in�cio s�o obrigat�rios' 
        });
    }
    
    try {
        await query('BEGIN');
        
        // 1. Se for ATUAL, encerrar o v�nculo ATUAL atual
        if (tipo_vinculo === 'ATUAL') {
            await query(`
                UPDATE employee_vinculos 
                SET data_fim = $1, 
                    data_transferencia = $1,
                    status = 'TRANSFERIDO',
                    tipo_vinculo = 'PASSADO',
                    updated_at = CURRENT_TIMESTAMP
                WHERE employee_id = $2 AND tipo_vinculo = 'ATUAL' AND status = 'ATIVO'
            `, [data_inicio, id]);
        }
        
        // 2. Determinar sequ�ncia
        const maxSequencia = await query(`
            SELECT COALESCE(MAX(sequencia), 0) + 1 as nova_sequencia
            FROM employee_vinculos 
            WHERE employee_id = $1
        `, [id]);
        
        const novaSequencia = maxSequencia.rows[0].nova_sequencia;
        
        // 3. Criar novo v�nculo
        const vinculoId = require('crypto').randomBytes(8).toString('hex');
        
        await query(`
            INSERT INTO employee_vinculos 
            (id, employee_id, employer_id, workplace_id, data_inicio, data_fim, 
             status, tipo_evento, principal, tipo_vinculo, sequencia, data_transferencia)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'ADMISSAO', 'N', $8, $9, $10)
        `, [
            vinculoId, id, employer_id, workplace_id, data_inicio, data_fim,
            status || 'ATIVO', tipo_vinculo, novaSequencia, data_transferencia
        ]);
        
        // 4. Se for ATUAL, atualizar tabela employees
        if (tipo_vinculo === 'ATUAL') {
            await query(`
                UPDATE employees 
                SET employer_id = $1, workplace_id = $2, updated_at = CURRENT_TIMESTAMP
                WHERE id = $3
            `, [employer_id, workplace_id, id]);
        }
        
        await query('COMMIT');
        
        res.json({
            success: true,
            message: 'V�nculo adicionado com sucesso',
            vinculo: {
                id: vinculoId,
                employee_id: id,
                employer_id,
                workplace_id,
                data_inicio,
                data_fim,
                data_transferencia,
                tipo_vinculo,
                status: status || 'ATIVO',
                sequencia: novaSequencia
            }
        });
        
    } catch (error) {
        await query('ROLLBACK');
        console.error('Erro ao adicionar v�nculo:', error);
        res.status(500).json({ error: error.message });
    }
});



// Fun��o para corrigir estado de v�nculos automaticamente
async function corrigirEstadoVinculos(employeeId) {
    try {
        console.log(`?? Corrigindo estado dos v�nculos para employee ${employeeId}...`);
        
        // 1. Identificar todos os v�nculos ATUAIS
        const ativos = await query(`
            SELECT id, data_inicio FROM employee_vinculos 
            WHERE employee_id = $1 
            AND tipo_vinculo = 'ATUAL' 
            AND status = 'ATIVO'
            ORDER BY data_inicio DESC
        `, [employeeId]);
        
        if (ativos.rows.length <= 1) {
            console.log('? Estado j� est� correto');
            return;
        }
        
        // 2. Manter apenas o mais recente como ATUAL
        const idManter = ativos.rows[0].id;
        
        await query(`
            UPDATE employee_vinculos 
            SET status = 'PASSADO', tipo_vinculo = 'PASSADO'
            WHERE employee_id = $1 
            AND id != $2
            AND tipo_vinculo = 'ATUAL'
            AND status = 'ATIVO'
        `, [employeeId, idManter]);
        
        console.log(`? ${ativos.rows.length - 1} v�nculos corrigidos para PASSADO`);
        
        // 3. Atualizar employees para o v�nculo ATUAL correto
        const vinculoAtual = await query(`
            SELECT employer_id, workplace_id FROM employee_vinculos 
            WHERE id = $1
        `, [idManter]);
        
        if (vinculoAtual.rows.length > 0) {
            await query(`
                UPDATE employees 
                SET employer_id = $1, workplace_id = $2, updated_at = CURRENT_TIMESTAMP
                WHERE id = $3
            `, [
                vinculoAtual.rows[0].employer_id,
                vinculoAtual.rows[0].workplace_id,
                employeeId
            ]);
            
            console.log('? Tabela employees atualizada');
        }
        
        console.log('? Estado dos v�nculos corrigido');
        
    } catch (error) {
        console.error('? Erro ao corrigir estado:', error.message);
    }
}

// Rota para buscar CPF (retorna todos os registros com esse CPF)
router.get('/search-by-cpf/:cpf', async (req, res) => {
    const { cpf } = req.params;
    const cpfLimpo = cpf.replace(/\D/g, '');
    
    if (!cpfLimpo || cpfLimpo.length < 11) {
        return res.json({ found: false, employees: [] });
    }
    
    try {
        const result = await query(`
            SELECT 
                id,
                name,
                "registrationNumber",
                "admissionDate",
                "terminationDate",
                type,
                role,
                sector,
                "photoUrl",
                employer_id,
                workplace_id
            FROM employees 
            WHERE REPLACE(REPLACE(REPLACE(cpf, '.', ''), '-', ''), ' ', '') = $1
            ORDER BY "admissionDate" DESC
        `, [cpfLimpo]);
        
        const employees = result.rows || [];
        
        if (employees.length === 0) {
            return res.json({ found: false, employees: [] });
        }
        
        const hasActive = employees.some(e => e.type !== 'Desligado');
        
        res.json({
            found: true,
            hasActive,
            employees: employees.map(e => ({
                id: e.id,
                name: e.name,
                registrationNumber: e.registrationNumber,
                admissionDate: e.admissionDate,
                terminationDate: e.terminationDate,
                type: e.type,
                role: e.role,
                sector: e.sector,
                photoUrl: e.photoUrl,
                employer_id: e.employer_id,
                workplace_id: e.workplace_id
            }))
        });
    } catch (err) {
        console.error('Erro ao buscar CPF:', err.message);
        res.json({ found: false, employees: [], error: err.message });
    }
});

module.exports = router;
