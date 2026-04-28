const express = require('express');
const crypto = require('crypto');
const db = require('../database');
const router = express.Router();
const generateId = () => crypto.randomBytes(8).toString('hex');

// Middleware para validar CNPJ
function validateCNPJ(cnpj) {
    // Remover caracteres não numéricos
    cnpj = cnpj.replace(/[^\d]/g, '');
    
    // Para desenvolvimento: aceitar CNPJs de teste com padrão conhecido
    if (cnpj === '12345678901234' || cnpj === '11111111111111' || cnpj === '00000000000000') {
        console.log('⚠️ CNPJ de teste aceito para desenvolvimento:', cnpj);
        return true;
    }
    
    // Verificar se tem 14 dígitos
    if (cnpj.length !== 14) {
        console.log('❌ CNPJ com tamanho incorreto:', cnpj.length);
        return false;
    }
    
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{13}$/.test(cnpj)) {
        console.log('❌ CNPJ com dígitos repetidos:', cnpj);
        return false;
    }
    
    // Algoritmo de validação de CNPJ
    let length = cnpj.length - 2;
    let numbers = cnpj.substring(0, length);
    const digits = cnpj.substring(length);
    let sum = 0;
    let pos = length - 7;
    
    for (let i = length; i >= 1; i--) {
        sum += numbers.charAt(length - i) * pos--;
        if (pos < 2) pos = 9;
    }
    
    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    
    if (result !== parseInt(digits.charAt(0))) {
        console.log('❌ Primeiro dígito verificador inválido');
        return false;
    }
    
    length = length + 1;
    numbers = cnpj.substring(0, length);
    sum = 0;
    pos = length - 7;
    
    for (let i = length; i >= 1; i--) {
        sum += numbers.charAt(length - i) * pos--;
        if (pos < 2) pos = 9;
    }
    
    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    
    const isValid = result === parseInt(digits.charAt(1));
    console.log('🔍 Validação CNPJ:', { cnpj, isValid, result, expected: digits.charAt(1) });
    
    return isValid;
}

// Formatar CNPJ
function formatCNPJ(cnpj) {
    cnpj = cnpj.replace(/[^\d]/g, '');
    if (cnpj.length !== 14) return cnpj;
    
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

// GET /api/pj/documentation/:employeeId - Obter documentação PJ
router.get('/documentation/:employeeId', async (req, res) => {
    const { employeeId } = req.params;
    
    try {
        const documentation = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM pj_documentation WHERE employee_id = ?', [employeeId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        res.json(documentation || null);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/pj/documentation/:employeeId - Criar/atualizar documentação PJ
router.post('/documentation/:employeeId', async (req, res) => {
    const { employeeId } = req.params;
    const {
        cnpj,
        company_name,
        company_address,
        company_phone,
        company_email,
        responsible_name,
        responsible_cpf,
        responsible_role,
        notes
    } = req.body;
    
    // Log para debug
    console.log('📝 Recebendo documentação PJ:', {
        employeeId,
        cnpj,
        company_name,
        body: req.body
    });
    
    if (!cnpj || !company_name) {
        console.log('❌ Validação falhou: CNPJ ou nome da empresa ausente');
        return res.status(400).json({ error: 'CNPJ e nome da empresa são obrigatórios' });
    }
    
    if (!validateCNPJ(cnpj)) {
        console.log('❌ Validação falhou: CNPJ inválido:', cnpj);
        return res.status(400).json({ error: 'CNPJ inválido' });
    }
    
    try {
        // Verificar se já existe documentação
        const existing = await new Promise((resolve, reject) => {
            db.get('SELECT id FROM pj_documentation WHERE employee_id = ?', [employeeId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        const formattedCNPJ = formatCNPJ(cnpj);
        
        if (existing) {
            // Atualizar documentação existente
            await new Promise((resolve, reject) => {
                db.run(`UPDATE pj_documentation SET 
                    cnpj = ?, company_name = ?, company_address = ?, company_phone = ?, 
                    company_email = ?, responsible_name = ?, responsible_cpf = ?, 
                    responsible_role = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE employee_id = ?`, [
                    formattedCNPJ, company_name, company_address, company_phone,
                    company_email, responsible_name, responsible_cpf, responsible_role,
                    notes, employeeId
                ], (err) => err ? reject(err) : resolve());
            });
        } else {
            // Criar nova documentação
            const docId = generateId();
            await new Promise((resolve, reject) => {
                db.run(`INSERT INTO pj_documentation 
                    (id, employee_id, cnpj, company_name, company_address, company_phone,
                     company_email, responsible_name, responsible_cpf, responsible_role, notes) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                    docId, employeeId, formattedCNPJ, company_name, company_address, company_phone,
                    company_email, responsible_name, responsible_cpf, responsible_role, notes
                ], (err) => err ? reject(err) : resolve());
            });
        }
        
        // Atualizar tipo de contratação do colaborador
        await new Promise((resolve, reject) => {
            db.run('UPDATE employees SET contracting_type = ?, pj_cnpj = ?, pj_company_name = ? WHERE id = ?', 
                ['PJ', formattedCNPJ, company_name, employeeId], (err) => err ? reject(err) : resolve());
        });
        
        res.json({ success: true, message: 'Documentação PJ salva com sucesso' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/pj/contracts/:employeeId - Obter contratos PJ
router.get('/contracts/:employeeId', async (req, res) => {
    const { employeeId } = req.params;
    
    try {
        const contracts = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM pj_contracts WHERE employee_id = ? ORDER BY start_date DESC', [employeeId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
        
        res.json(contracts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/pj/contracts/:employeeId - Criar contrato PJ
router.post('/contracts/:employeeId', async (req, res) => {
    const { employeeId } = req.params;
    const {
        contract_number,
        start_date,
        end_date,
        monthly_value,
        payment_method,
        payment_day,
        description,
        auto_renew,
        renewal_notice_days
    } = req.body;
    
    if (!start_date || !end_date || !monthly_value) {
        return res.status(400).json({ error: 'Data início, data fim e valor mensal são obrigatórios' });
    }
    
    try {
        const contractId = generateId();
        
        await new Promise((resolve, reject) => {
            db.run(`INSERT INTO pj_contracts 
                (id, employee_id, contract_number, start_date, end_date, monthly_value,
                 payment_method, payment_day, description, auto_renew, renewal_notice_days) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                contractId, employeeId, contract_number, start_date, end_date, monthly_value,
                payment_method, payment_day, description, auto_renew || 0, renewal_notice_days || 30
            ], (err) => err ? reject(err) : resolve());
        });
        
        res.json({ success: true, contractId, message: 'Contrato PJ criado com sucesso' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/pj/attachments/:employeeId - Obter anexos PJ
router.get('/attachments/:employeeId', async (req, res) => {
    const { employeeId } = req.params;
    
    try {
        const attachments = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM pj_attachments WHERE employee_id = ? ORDER BY upload_date DESC', [employeeId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
        
        res.json(attachments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/pj/attachments/:employeeId - Fazer upload de anexo
router.post('/attachments/:employeeId', async (req, res) => {
    const { employeeId } = req.params;
    const { file_name, file_path, file_type, file_size, mime_type, contract_id, notes } = req.body;
    
    if (!file_name || !file_path) {
        return res.status(400).json({ error: 'Nome e caminho do arquivo são obrigatórios' });
    }
    
    try {
        const attachmentId = generateId();
        
        await new Promise((resolve, reject) => {
            db.run(`INSERT INTO pj_attachments 
                (id, employee_id, contract_id, file_name, file_path, file_type, file_size, mime_type, notes) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                attachmentId, employeeId, contract_id, file_name, file_path, file_type, file_size, mime_type, notes
            ], (err) => err ? reject(err) : resolve());
        });
        
        res.json({ success: true, attachmentId, message: 'Anexo salvo com sucesso' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/pj/templates - Obter templates de contratos
router.get('/templates', async (req, res) => {
    try {
        const templates = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM pj_contract_templates ORDER BY is_default DESC, name ASC', (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
        
        res.json(templates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/pj/templates - Criar template de contrato
router.post('/templates', async (req, res) => {
    const { name, description, template_content, variables, is_default } = req.body;
    
    if (!name || !template_content) {
        return res.status(400).json({ error: 'Nome e conteúdo do template são obrigatórios' });
    }
    
    try {
        const templateId = generateId();
        
        await new Promise((resolve, reject) => {
            db.run(`INSERT INTO pj_contract_templates 
                (id, name, description, template_content, variables, is_default) 
                VALUES (?, ?, ?, ?, ?, ?)`, [
                templateId, name, description, template_content, variables, is_default || 0
            ], (err) => err ? reject(err) : resolve());
        });
        
        res.json({ success: true, templateId, message: 'Template criado com sucesso' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/pj/employees/:id/contracting-type - Atualizar tipo de contratação
router.put('/employees/:id/contracting-type', async (req, res) => {
    const { id } = req.params;
    const { contracting_type } = req.body;
    
    if (!['CLT', 'PJ'].includes(contracting_type)) {
        return res.status(400).json({ error: 'Tipo de contratação inválido' });
    }
    
    try {
        // Verificar se a coluna existe antes de tentar atualizar
        const tableInfo = await new Promise((resolve, reject) => {
            db.all("PRAGMA table_info(employees)", (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        const hasContractingType = tableInfo.some(col => col.name === 'contracting_type');
        
        if (!hasContractingType) {
            return res.status(400).json({ error: 'Coluna contracting_type não existe na tabela employees' });
        }
        
        await new Promise((resolve, reject) => {
            db.run('UPDATE employees SET contracting_type = ? WHERE id = ?', [contracting_type, id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        res.json({ success: true, message: 'Tipo de contratação atualizado' });
    } catch (error) {
        console.error('Erro ao atualizar tipo de contratação:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
