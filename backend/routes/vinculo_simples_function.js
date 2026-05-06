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

module.exports = { gerenciarVinculoSimples };
