const express = require('express');
const crypto = require('crypto');
const { query } = require('../config/database');

const router = express.Router();
const generateId = () => crypto.randomBytes(4).toString('hex'); // Corrigido: 4 bytes = 8 caracteres


// Rota de reativação/transferência - CRIA NOVO COLABORADOR (CLONE)
router.post('/employee/:id/reativar', async (req, res) => {
    const { id } = req.params;
    const { 
        to_employer_id, 
        to_workplace_id, 
        new_role, 
        new_salary, 
        new_admission_date,
        termination_date,
        reason, 
        changed_by 
    } = req.body;

    try {
        // 1. Buscar dados do colaborador ATUAL
        const empResult = await query('SELECT * FROM employees WHERE id = $1', [id]);
        const emp = empResult.rows[0];

        if (!emp) {
            return res.status(404).json({ error: 'Colaborador não encontrado' });
        }

        // Datas
        const novaData = new_admission_date || new Date().toISOString().split('T')[0];
        const dataDesligamento = termination_date || novaData;
        
        // 2. Gerar NOVO ID para o clone
        const novoId = generateId();
        console.log('🔄 DEBUG - Novo ID gerado:', novoId);
        
        // 3. Criar NOVO colaborador (clone com todos os dados)
        const novoEmployer = to_employer_id || emp.employer_id;
        const novoWorkplace = to_workplace_id || emp.workplace_id;
        const novoRole = new_role || emp.role;
        const novoSalary = new_salary || emp.currentSalary;
        
        console.log('🔄 DEBUG - Dados da transferência:', {
            novoId,
            novoEmployer,
            novoWorkplace,
            novoRole,
            novoSalary,
            novaData,
            dataDesligamento
        });
        
        await query(`
            INSERT INTO employees (
                id, name, "registrationNumber", role, sector, type, hierarchy,
                "admissionDate", "birthDate", "currentSalary", "photoUrl",
                street, city, neighborhood, "state_uf", cep,
                employer_id, workplace_id, "fatherName", "motherName", gender,
                "maritalStatus", ethnicity, "educationLevel", "placeOfBirth",
                "personalEmail", "personalPhone", "work_schedule", "work_scale", cbo,
                "initialRole", "initialSalary", observation, cpf,
                "terminationReason", "terminationDate"
            )
            SELECT 
                $1, name, "registrationNumber", $2, sector, 'Ativo', hierarchy,
                $3, "birthDate", $4, "photoUrl",
                street, city, neighborhood, "state_uf", cep,
                $5, $6, "fatherName", "motherName", gender,
                "maritalStatus", ethnicity, "educationLevel", "placeOfBirth",
                "personalEmail", "personalPhone", "work_schedule", "work_scale", cbo,
                "initialRole", "initialSalary", observation, cpf,
                NULL, NULL
            FROM employees WHERE id = $7
        `, [
            novoId, novoRole, novaData, novoSalary, novoEmployer, novoWorkplace, id
        ]);

        console.log('🔄 DEBUG - Novo employee inserido com sucesso');
        
        // VERIFICAÇÃO: Confirmar que o novo employee foi realmente criado
        const verifyNewEmployee = await query('SELECT id FROM employees WHERE id = $1', [novoId]);
        if (verifyNewEmployee.rows.length === 0) {
            console.error('❌ ERRO CRÍTICO: Novo employee não foi criado despite INSERT success!');
            throw new Error('Falha na criação do novo employee - INSERT não persistiu');
        }
        console.log('✅ VERIFICAÇÃO: Novo employee criado com sucesso:', novoId);

        // 4. Buscar e copiar DOCUMENTOS do original
        const docs = await query('SELECT * FROM employee_documents WHERE employee_id = $1', [id]);
        if (docs.rows.length > 0) {
            const doc = docs.rows[0];
            await query(`
                INSERT INTO employee_documents 
                (employee_id, cpf, pis_pasep, rg_number, rg_organ, rg_uf, rg_date, ctps_number, cnh_number, voter_title, voter_zone, voter_section)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            `, [
                novoId, doc.cpf, doc.pis_pasep, doc.rg_number, doc.rg_organ, doc.rg_uf, doc.rg_date, doc.ctps_number, doc.cnh_number, doc.voter_title, doc.voter_zone, doc.voter_section
            ]);
        }

        // 5. DESLIGAR o colaborador original com data MANUAL
        await query(`
            UPDATE employees 
            SET type = 'Desligado', "terminationDate" = $1, "terminationReason" = $2
            WHERE id = $3
        `, [dataDesligamento, reason || 'Reativação', id]);
        
        console.log('🔄 DEBUG - Employee original desligado com sucesso');

        // 6. Registrar histórico de reativação (se tabela existir)
        try {
            // Truncar IDs para 32 caracteres para caber na tabela
            const truncatedId = id.substring(0, 32);
            const truncatedFromEmployer = emp.employer_id ? emp.employer_id.substring(0, 32) : null;
            const truncatedToEmployer = novoEmployer ? novoEmployer.substring(0, 32) : null;
            const truncatedFromWorkplace = emp.workplace_id ? emp.workplace_id.substring(0, 32) : null;
            const truncatedToWorkplace = novoWorkplace ? novoWorkplace.substring(0, 32) : null;
            
            await query(`
                INSERT INTO employee_transfer_history 
                (employee_id, from_employer_id, to_employer_id, from_workplace_id, to_workplace_id, reason, changed_by, changed_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
            `, [truncatedId, truncatedFromEmployer, truncatedToEmployer, truncatedFromWorkplace, truncatedToWorkplace, reason || 'Reativação', changed_by]);
        } catch (histError) {
            console.warn('Histórico não registrado (tabela pode não existir):', histError.message);
            // Continuar sem histórico - não é erro crítico
        }
        
        console.log('🔄 DEBUG - Todas as operações concluídas com sucesso');
        console.log('🔄 DEBUG - Retornando response com novo ID:', novoId);
        
        res.json({
            success: true,
            message: 'Novo colaborador criado com sucesso!',
            new_employee_id: novoId,
            old_employee_id: id,
            new_admission_date: novaData,
            termination_date: dataDesligamento
        });

    } catch (error) {
        console.error('Erro na reativação:', error);
        res.status(500).json({ error: error.message });
    }
});

// Rota simples de transferência -Atualiza apenas tabela employees
router.post('/employee/:id', async (req, res) => {
    const { id } = req.params;
    const { to_employer_id, to_workplace_id, reason, changed_by } = req.body;

    if (!to_employer_id && !to_workplace_id) {
        return res.status(400).json({ error: 'Informe pelo menos empregador ou unidade' });
    }

    try {
        // Buscar dados atuais para histórico
        const currentEmp = await query('SELECT * FROM employees WHERE id = $1', [id]);
        if (currentEmp.rows.length === 0) {
            return res.status(404).json({ error: 'Colaborador não encontrado' });
        }
        
        const emp = currentEmp.rows[0];
        
        // Atualizar apenas tabela employees
        await query(`
            UPDATE employees 
            SET employer_id = COALESCE($1, employer_id), 
                workplace_id = COALESCE($2, workplace_id),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
        `, [to_employer_id, to_workplace_id, id]);

        // Registrar histórico simples (se existir tabela)
        try {
            // Truncar IDs para 32 caracteres para caber na tabela
            const truncatedId = id.substring(0, 32);
            const truncatedFromEmployer = emp.employer_id ? emp.employer_id.substring(0, 32) : null;
            const truncatedToEmployer = (to_employer_id || emp.employer_id) ? (to_employer_id || emp.employer_id).substring(0, 32) : null;
            const truncatedFromWorkplace = emp.workplace_id ? emp.workplace_id.substring(0, 32) : null;
            const truncatedToWorkplace = (to_workplace_id || emp.workplace_id) ? (to_workplace_id || emp.workplace_id).substring(0, 32) : null;
            
            await query(`
                INSERT INTO employee_transfer_history 
                (employee_id, from_employer_id, to_employer_id, from_workplace_id, to_workplace_id, reason, changed_by, changed_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
            `, [truncatedId, truncatedFromEmployer, truncatedToEmployer, truncatedFromWorkplace, truncatedToWorkplace, reason, changed_by]);
        } catch (histError) {
            // Tabela de histórico pode não existir, ignorar
            console.warn('Histórico não registrado (tabela pode não existir):', histError.message);
            // Continuar sem histórico - não é erro crítico
        }

        res.json({ 
            success: true, 
            message: 'Transferência realizada com sucesso',
            from_employer_id: emp.employer_id,
            to_employer_id: to_employer_id || emp.employer_id,
            from_workplace_id: emp.workplace_id,
            to_workplace_id: to_workplace_id || emp.workplace_id
        });
    } catch (error) {
        console.error('Erro na transferência:', error);
        res.status(500).json({ error: error.message });
    }
});

// Rota GET histórico - Simplificado para usar apenas employees
router.get('/employee/:id/history', async (req, res) => {
    const { id } = req.params;
    
    try {
        let transferHistory = [];
        
        // Tentar buscar da tabela de histórico simples (se existir)
        try {
            transferHistory = await query(`
                SELECT eth.*, 
                       emp_from.name as from_employer_name, 
                       emp_to.name as to_employer_name,
                       wp_from.name as from_workplace_name, 
                       wp_to.name as to_workplace_name
                FROM employee_transfer_history eth
                LEFT JOIN companies emp_from ON eth.from_employer_id = emp_from.id
                LEFT JOIN companies emp_to ON eth.to_employer_id = emp_to.id
                LEFT JOIN companies wp_from ON eth.from_workplace_id = wp_from.id
                LEFT JOIN companies wp_to ON eth.to_workplace_id = wp_to.id
                WHERE eth.employee_id = $1
                ORDER BY eth.changed_at DESC
            `, [id]);
            transferHistory = transferHistory.rows || [];
        } catch (e) {
            // Se tabela não existir, retornar histórico vazio
            console.warn('Tabela de histórico não encontrada:', e.message);
            transferHistory = [];
        }

        // Buscar dados atuais do colaborador
        const employeeData = await query(`
            SELECT e.*, 
                   emp.name as employer_name, 
                   wp.name as workplace_name
            FROM employees e
            LEFT JOIN companies emp ON e.employer_id = emp.id
            LEFT JOIN companies wp ON e.workplace_id = wp.id
            WHERE e.id = $1
        `, [id]);
        
        const currentData = employeeData.rows[0] || null;

        res.json({
            success: true,
            current_vinculo: currentData ? {
                employer_id: currentData.employer_id,
                workplace_id: currentData.workplace_id,
                employer_name: currentData.employer_name,
                workplace_name: currentData.workplace_name
            } : null,
            transfer_history: transferHistory
        });
    } catch (error) {
        console.error('Erro ao buscar histórico:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;