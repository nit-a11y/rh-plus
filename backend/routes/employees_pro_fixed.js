// Substituir a seção de gerenciamento de vínculos no employees_pro.js
// Esta é a versão corrigida que permite apenas um vínculo por employee

// Função simplificada para CRUD de vínculos (apenas um por employee)
async function gerenciarVinculoSimples(client, employeeId, emp) {
    // Se não há dados de vínculo, não faz nada
    if (!emp.employer_id && !emp.workplace_id) {
        return;
    }

    // Buscar vínculo atual
    const vinculoAtual = await client.query(`
        SELECT * FROM employee_vinculos 
        WHERE employee_id = $1 AND status = 'ATIVO' 
        ORDER BY data_inicio DESC 
        LIMIT 1
    `, [employeeId]);

    const now = new Date().toISOString().split('T')[0]; // Data atual
    
    if (vinculoAtual.rows.length === 0) {
        // Criar novo vínculo (não existe nenhum)
        const vinculoId = require('crypto').randomBytes(8).toString('hex');
        
        await client.query(`
            INSERT INTO employee_vinculos 
            (id, employee_id, employer_id, workplace_id, principal, data_inicio, status, tipo_evento, tipo_vinculo, sequencia, created_at)
            VALUES ($1, $2, $3, $4, 'S', $5, 'ATIVO', 'ADMISSAO', 'ATUAL', 1, CURRENT_TIMESTAMP)
        `, [vinculoId, employeeId, emp.employer_id || null, emp.workplace_id || null, now]);
        
    } else {
        // Atualizar vínculo existente
        const vinculo = vinculoAtual.rows[0];
        
        await client.query(`
            UPDATE employee_vinculos 
            SET employer_id = $1, 
                workplace_id = $2, 
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
        `, [emp.employer_id || vinculo.employer_id, emp.workplace_id || vinculo.workplace_id, vinculo.id]);
    }
}

// Na rota PUT /:id/metadata, substituir a seção complexa por:
router.put('/:id/metadata', async (req, res) => {
    const { id } = req.params;
    const { emp, docs } = req.body;

    try {
        await transaction(async (client) => {
            // Atualizar dados do funcionário
            const empKeys = Object.keys(emp).filter(k => !['vinculos', 'employer_id', 'workplace_id'].includes(k));
            
            if (empKeys.length > 0) {
                const mappedKeys = empKeys.map(k => normalizeFieldName(k));
                const empSet = mappedKeys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
                await client.query(`UPDATE employees SET ${empSet} WHERE id = $${mappedKeys.length + 1}`, 
                    [...empKeys.map(k => emp[k]), id]);
            }

            // Gerenciar vínculo de forma simples (apenas um por employee)
            await gerenciarVinculoSimples(client, id, emp);

            // Atualizar tabela employees para compatibilidade
            const vinculoPrincipal = await client.query(`
                SELECT employer_id, workplace_id FROM employee_vinculos
                WHERE employee_id = $1 AND status = 'ATIVO' AND principal = 'S'
                LIMIT 1
            `, [id]);

            if (vinculoPrincipal.rows.length > 0) {
                await client.query(`
                    UPDATE employees
                    SET employer_id = $1, workplace_id = $2
                    WHERE id = $3
                `, [vinculoPrincipal.rows[0].employer_id, vinculoPrincipal.rows[0].workplace_id, id]);
            }

            // Atualizar documentos se necessário
            if (docs) {
                const docKeys = Object.keys(docs).filter(k => docs[k] !== undefined && docs[k] !== '');
                if (docKeys.length > 0) {
                    const existingDoc = await client.query('SELECT id FROM employee_documents WHERE employee_id = $1', [id]);
                    
                    if (existingDoc.rows.length > 0) {
                        // UPDATE
                        const docSet = docKeys.map((k, i) => `"${k}" = $${i + 2}`).join(', ');
                        await client.query(`UPDATE employee_documents SET ${docSet} WHERE employee_id = $1`, 
                            [id, ...docKeys.map(k => docs[k])]);
                    } else {
                        // INSERT
                        const docId = require('crypto').randomBytes(8).toString('hex');
                        const docColumns = ['id', 'employee_id', ...docKeys];
                        const placeholders = docColumns.map((_, i) => `$${i + 1}`).join(', ');
                        await client.query(`INSERT INTO employee_documents (${docColumns.join(', ')}) VALUES (${placeholders})`, 
                            [docId, id, ...docKeys.map(k => docs[k])]);
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
