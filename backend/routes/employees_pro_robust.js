const express = require('express');
const crypto = require('crypto');
const { query, transaction } = require('../config/database');

const router = express.Router();
const generateId = () => crypto.randomBytes(8).toString('hex');

// Função para validar JSON
function validateJSON(jsonString) {
    try {
        if (!jsonString || jsonString.trim() === '') {
            return '{}';
        }
        JSON.parse(jsonString);
        return jsonString;
    } catch (error) {
        console.log('JSON inválido detectado, corrigindo:', error.message);
        return '{}';
    }
}

// Função para log de operações
async function logOperation(operationType, tableName, recordId, oldData, newData, status, errorMessage = null, userId = null) {
    try {
        await query(`
            INSERT INTO operation_logs 
            (id, operation_type, table_name, record_id, old_data, new_data, status, error_message, user_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
            generateId(),
            operationType,
            tableName,
            recordId,
            oldData ? JSON.stringify(oldData) : null,
            newData ? JSON.stringify(newData) : null,
            status,
            errorMessage,
            userId
        ]);
    } catch (logError) {
        console.error('Erro ao fazer log:', logError.message);
    }
}

// Rota metadata robusta com transações
router.put('/:id/metadata', async (req, res) => {
    const { id } = req.params;
    const { emp, docs } = req.body;
    
    if (!emp || !emp.id) {
        return res.status(400).json({ success: false, error: 'Dados do colaborador inválidos' });
    }
    
    const client = await query('BEGIN');
    
    try {
        // 1. Verificar se employee existe
        const employeeCheck = await query('SELECT id, name, metadata FROM employees WHERE id = $1', [id]);
        
        if (employeeCheck.rows.length === 0) {
            await query('ROLLBACK');
            return res.status(404).json({ success: false, error: 'Colaborador não encontrado' });
        }
        
        const oldEmployee = employeeCheck.rows[0];
        
        // 2. Validar e corrigir metadata
        const metadataValidado = validateJSON(emp.metadata);
        
        // 3. Atualizar dados básicos do employee
        const updateEmployee = await query(`
            UPDATE employees 
            SET name = $1, "registrationNumber" = $2, role = $3, sector = $4,
                currentSalary = $5, personalEmail = $6, personalPhone = $7,
                observation = $8, metadata = $9, updated_at = CURRENT_TIMESTAMP
            WHERE id = $10
            RETURNING id, name, updated_at
        `, [
            emp.name,
            emp.registrationNumber,
            emp.role,
            emp.sector,
            emp.currentSalary,
            emp.personalEmail,
            emp.personalPhone,
            emp.observation,
            metadataValidado,
            id
        ]);
        
        // 4. Gerenciar vínculos (se fornecidos)
        if (emp.vinculos && Array.isArray(emp.vinculos)) {
            // Buscar vínculos atuais
            const currentVinculos = await query(`
                SELECT id, employer_id, workplace_id, principal, status, tipo_vinculo, sequencia
                FROM employee_vinculos 
                WHERE employee_id = $1 
                ORDER BY sequencia
            `, [id]);
            
            // Mapear vínculos atuais
            const currentMap = new Map();
            currentVinculos.rows.forEach(v => {
                const key = `${v.employer_id}_${v.workplace_id}`;
                currentMap.set(key, v);
            });
            
            // Processar vínculos recebidos
            const incomingMap = new Map();
            emp.vinculos.forEach(v => {
                const key = `${v.employer_id}_${v.workplace_id}`;
                incomingMap.set(key, v);
            });
            
            // Identificar vínculos para encerrar
            for (const [key, currentVinculo] of currentMap) {
                if (!incomingMap.has(key)) {
                    await query(`
                        UPDATE employee_vinculos 
                        SET data_fim = CURRENT_TIMESTAMP, status = 'ENCERRADO',
                            tipo_vinculo = 'PASSADO', updated_at = CURRENT_TIMESTAMP
                        WHERE id = $1
                    `, [currentVinculo.id]);
                }
            }
            
            // Atualizar ou criar vínculos
            let sequencia = 1;
            for (const [key, incomingVinculo] of incomingMap) {
                const currentVinculo = currentMap.get(key);
                
                if (currentVinculo) {
                    // Atualizar vínculo existente
                    await query(`
                        UPDATE employee_vinculos 
                        SET principal = $1, updated_at = CURRENT_TIMESTAMP
                        WHERE id = $2
                    `, [incomingVinculo.principal ? 'S' : 'N', currentVinculo.id]);
                } else {
                    // Criar novo vínculo
                    const vinculoId = generateId();
                    await query(`
                        INSERT INTO employee_vinculos 
                        (id, employee_id, employer_id, workplace_id, data_inicio, status, 
                         tipo_evento, principal, tipo_vinculo, sequencia)
                        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, 'ATIVO', 
                                'ADMISSAO', $5, 'ATUAL', $6)
                    `, [vinculoId, id, incomingVinculo.employer_id, incomingVinculo.workplace_id,
                        incomingVinculo.principal ? 'S' : 'N', sequencia]);
                }
                sequencia++;
            }
            
            // Garantir apenas um vínculo principal
            await query(`
                UPDATE employee_vinculos 
                SET principal = 'N' 
                WHERE employee_id = $1 AND principal = 'S'
            `, [id]);
            
            const principalVinculo = emp.vinculos.find(v => v.principal);
            if (principalVinculo) {
                await query(`
                    UPDATE employee_vinculos 
                    SET principal = 'S' 
                    WHERE employee_id = $1 AND employer_id = $2 AND workplace_id = $3
                `, [id, principalVinculo.employer_id, principalVinculo.workplace_id]);
                
                // Atualizar employees para retrocompatibilidade
                await query(`
                    UPDATE employees 
                    SET employer_id = $1, workplace_id = $2 
                    WHERE id = $3
                `, [principalVinculo.employer_id, principalVinculo.workplace_id, id]);
            }
        }
        
        // 5. Atualizar documentos (se fornecidos)
        if (docs) {
            await query(`
                INSERT INTO employee_documents (employee_id, cpf, pis_pasep, rg_number, rg_organ, 
                                              rg_uf, rg_date, ctps_number, cnh_number, voter_title, 
                                              voter_zone, voter_section)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                ON CONFLICT (employee_id) DO UPDATE SET
                    cpf = EXCLUDED.cpf, pis_pasep = EXCLUDED.pis_pasep, rg_number = EXCLUDED.rg_number,
                    rg_organ = EXCLUDED.rg_organ, rg_uf = EXCLUDED.rg_uf, rg_date = EXCLUDED.rg_date,
                    ctps_number = EXCLUDED.ctps_number, cnh_number = EXCLUDED.cnh_number,
                    voter_title = EXCLUDED.voter_title, voter_zone = EXCLUDED.voter_zone,
                    voter_section = EXCLUDED.voter_section
            `, [
                id, docs.cpf, docs.pis_pasep, docs.rg_number, docs.rg_organ, docs.rg_uf,
                docs.rg_date, docs.ctps_number, docs.cnh_number, docs.voter_title,
                docs.voter_zone, docs.voter_section
            ]);
        }
        
        // 6. Commit da transação
        await query('COMMIT');
        
        // 7. Log da operação
        await logOperation('UPDATE', 'employees', id, oldEmployee, emp, 'SUCCESS', null, req.user?.id);
        
        res.json({ 
            success: true, 
            message: 'Dados atualizados com sucesso',
            employee: updateEmployee.rows[0]
        });
        
    } catch (error) {
        await query('ROLLBACK');
        
        // Log do erro
        await logOperation('UPDATE', 'employees', id, null, req.body, 'ERROR', error.message, req.user?.id);
        
        console.error('Erro ao atualizar metadata:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro interno do servidor',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Rota para salvar arquivos de documentos (robusta)
router.post('/:id/documentFiles', async (req, res) => {
    const { id } = req.params;
    const { documentFiles } = req.body;
    
    if (!documentFiles || !Array.isArray(documentFiles)) {
        return res.status(400).json({ error: 'documentFiles deve ser um array' });
    }
    
    try {
        // Validar JSON dos arquivos
        const validFiles = documentFiles.map(file => ({
            ...file,
            metadata: validateJSON(file.metadata)
        }));
        
        // Salvar usando transação
        await query('BEGIN');
        
        await query(`
            UPDATE employees 
            SET metadata = COALESCE(metadata, '{}') || $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
        `, [JSON.stringify({ documentFiles: validFiles }), id]);
        
        await query('COMMIT');
        
        res.json({ success: true, message: 'Arquivos salvos com sucesso' });
        
    } catch (error) {
        await query('ROLLBACK');
        console.error('Erro ao salvar arquivos:', error);
        res.status(500).json({ error: error.message });
    }
});

// Health check para a API
router.get('/health', async (req, res) => {
    try {
        await query('SELECT 1');
        res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    } catch (error) {
        res.status(500).json({ status: 'unhealthy', error: error.message });
    }
});

module.exports = router;
