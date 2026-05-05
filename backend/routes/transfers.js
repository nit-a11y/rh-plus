const express = require('express');
const crypto = require('crypto');
const { query } = require('../config/database');

const router = express.Router();
const generateId = () => crypto.randomBytes(8).toString('hex');

// Função utilitária para obter vínculo atual
async function getVinculoAtual(employeeId) {
    const result = await query(`
        SELECT * FROM employee_vinculos 
        WHERE employee_id = $1 AND tipo_vinculo = 'ATUAL' AND status = 'ATIVO'
        ORDER BY sequencia DESC 
        LIMIT 1
    `, [employeeId]);
    return result.rows[0] || null;
}

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
        await query('BEGIN');
        
        // 1. Buscar dados do colaborador ATUAL
        const empResult = await query('SELECT * FROM employees WHERE id = $1', [id]);
        const emp = empResult.rows[0];

        if (!emp) {
            await query('ROLLBACK');
            return res.status(404).json({ error: 'Colaborador não encontrado' });
        }

        // Datas
        const novaData = new_admission_date || new Date().toISOString().split('T')[0];
        const dataDesligamento = termination_date || novaData;
        
        // 2. Gerar NOVO ID para o clone
        const novoId = generateId();
        
        // 3. Criar NOVO colaborador (clone com todos os dados)
        const novoEmployer = to_employer_id || emp.employer_id;
        const novoWorkplace = to_workplace_id || emp.workplace_id;
        const novoRole = new_role || emp.role;
        const novoSalary = new_salary || emp.currentSalary;
        
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
                $2, $4, observation, cpf,
                NULL, NULL
            FROM employees WHERE id = $7
        `, [
            novoId, novoRole, novaData, novoSalary, novoEmployer, novoWorkplace, id
        ]);

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

        // 6. Criar vínculo para o NOVO colaborador
        const vinculoAtual = await getVinculoAtual(id);
        const novoVinculoId = generateId();
        const dataInicio = novaData + 'T00:00:00';
        
        await query(`
            INSERT INTO employee_vinculos 
            (id, employee_id, employer_id, workplace_id, principal, data_inicio, data_fim, status, tipo_evento, tipo_vinculo, sequencia)
            VALUES ($1, $2, $3, $4, 'S', $5, NULL, 'ATIVO', 'REATIVACAO', 'ATUAL', $6)
        `, [
            novoVinculoId, novoId, novoEmployer, novoWorkplace, dataInicio,
            (vinculoAtual?.sequencia || 1) + 1
        ]);

        // 7. Encerrar vínculo do original se existir
        if (vinculoAtual) {
            const dataFim = dataDesligamento + 'T00:00:00';
            await query(`
                UPDATE employee_vinculos 
                SET data_fim = $1, status = 'PASSADO', tipo_vinculo = 'PASSADO'
                WHERE id = $2
            `, [dataFim, vinculoAtual.id]);
        }
        
        await query('COMMIT');
        
        res.json({
            success: true,
            message: 'Novo colaborador criado com sucesso!',
            new_employee_id: novoId,
            old_employee_id: id,
            new_admission_date: novaData,
            termination_date: dataDesligamento
        });

    } catch (error) {
        await query('ROLLBACK');
        console.error('Erro na reativação:', error);
        res.status(500).json({ error: error.message });
    }
});

// Rota simples de transferência
router.post('/employee/:id', async (req, res) => {
    const { id } = req.params;
    const { to_employer_id, to_workplace_id, reason, changed_by } = req.body;

    if (!to_employer_id && !to_workplace_id) {
        return res.status(400).json({ error: 'Informe pelo menos empregador ou unidade' });
    }

    try {
        const vinculoAtual = await getVinculoAtual(id);
        
        if (vinculoAtual) {
            await query(`
                UPDATE employee_vinculos 
                SET employer_id = COALESCE($1, employer_id), workplace_id = COALESCE($2, workplace_id)
                WHERE id = $3
            `, [to_employer_id, to_workplace_id, vinculoAtual.id]);
        }
        
        await query(`
            UPDATE employees 
            SET employer_id = COALESCE($1, employer_id), workplace_id = COALESCE($2, workplace_id)
            WHERE id = $3
        `, [to_employer_id, to_workplace_id, id]);

        res.json({ success: true, message: 'Transferência realizada' });
    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ error: error.message });
    }
});

// Rota GET histórico
router.get('/employee/:id/history', async (req, res) => {
    const { id } = req.params;
    
    try {
        let transferHistory = [];
        let vinculosHistory = [];
        
        try {
            transferHistory = await query(`
                SELECT evt.*, emp_from.name as from_employer_name, emp_to.name as to_employer_name,
                       wp_from.name as from_workplace_name, wp_to.name as to_workplace_name
                FROM employee_vinculo_transfers evt
                LEFT JOIN companies emp_from ON evt.from_employer_id = emp_from.id
                LEFT JOIN companies emp_to ON evt.to_employer_id = emp_to.id
                LEFT JOIN companies wp_from ON evt.from_workplace_id = wp_from.id
                LEFT JOIN companies wp_to ON evt.to_workplace_id = wp_to.id
                WHERE evt.employee_id = $1
                ORDER BY evt.changed_at DESC
            `, [id]);
            transferHistory = transferHistory.rows || [];
        } catch (e) {
            transferHistory = [];
        }
        
        try {
            vinculosHistory = await query(`
                SELECT ev.*, emp.name as employer_name, wp.name as workplace_name
                FROM employee_vinculos ev
                LEFT JOIN companies emp ON ev.employer_id = emp.id
                LEFT JOIN companies wp ON ev.workplace_id = wp.id
                WHERE ev.employee_id = $1
                ORDER BY ev.sequencia
            `, [id]);
            vinculosHistory = vinculosHistory.rows || [];
        } catch (e) {
            vinculosHistory = [];
        }

        res.json({
            success: true,
            transfer_history: transferHistory,
            vinculos_history: vinculosHistory
        });
    } catch (error) {
        console.error('Erro:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;