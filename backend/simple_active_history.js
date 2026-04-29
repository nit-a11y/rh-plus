/**
 * HISTÓRICO SIMPLES - CONTAR APENAS ATIVOS POR MÊS
 * Lógica: Para cada mês, contar quantos colaboradores ATIVOS existiam naquele período
 */

const { query } = require('./config/database');

async function generateActiveHistory() {
    try {
        console.log('Gerando histórico de ativos (lógica simples)...');
        
        // 1. Buscar data mais antiga e mais recente
        const dateRange = await query(`
            SELECT 
                MIN(TO_DATE("admissionDate", 'YYYY-MM-DD')) as oldest_date,
                MAX(COALESCE(TO_DATE("terminationDate", 'YYYY-MM-DD'), CURRENT_DATE)) as newest_date
            FROM employees 
            WHERE "admissionDate" IS NOT NULL AND "admissionDate" != ''
        `);
        
        if (!dateRange.rows[0]?.oldest_date) {
            console.log('Nenhuma data encontrada');
            return [];
        }
        
        const oldestDate = new Date(dateRange.rows[0].oldest_date);
        const newestDate = new Date(dateRange.rows[0].newest_date);
        
        console.log(`Período: ${oldestDate.toISOString().split('T')[0]} até ${newestDate.toISOString().split('T')[0]}`);
        
        // 2. Buscar todas as unidades
        const units = await query(`
            SELECT DISTINCT 
                c.id as unit_id,
                c.name as unit_name
            FROM companies c
            WHERE c.id IN (
                SELECT DISTINCT workplace_id FROM employees WHERE workplace_id IS NOT NULL
            )
            ORDER BY c.name
        `);
        
        // 3. Gerar mês a mês
        const history = [];
        let currentDate = new Date(oldestDate.getFullYear(), oldestDate.getMonth(), 1);
        
        while (currentDate <= newestDate) {
            const recordDate = currentDate.toISOString().split('T')[0];
            const nextMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
            
            for (const unit of units.rows) {
                // Contar ATIVOS nesta unidade neste mês
                const activeCount = await countActiveEmployees(unit.unit_id, recordDate, nextMonthDate);
                
                if (activeCount > 0) { // Só adicionar se tiver ativos
                    history.push({
                        record_date: recordDate,
                        unit_id: unit.unit_id,
                        unit_name: unit.unit_name,
                        total_employees: activeCount,
                        active_employees: activeCount,
                        inactive_employees: 0,
                        admissions_count: 0,
                        terminations_count: 0
                    });
                }
            }
            
            // Avançar para o próximo mês
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
        
        // 4. Salvar no banco
        await saveActiveHistory(history);
        
        console.log(`Histórico gerado: ${history.length} registros`);
        return history;
        
    } catch (error) {
        console.error('Erro ao gerar histórico:', error);
        throw error;
    }
}

async function countActiveEmployees(unitId, startDate, endDate) {
    try {
        const result = await query(`
            SELECT COUNT(*) as active_count
            FROM employees 
            WHERE workplace_id = $1
            AND type != 'Desligado'
            AND "admissionDate" IS NOT NULL 
            AND "admissionDate" != ''
            AND TO_DATE("admissionDate", 'YYYY-MM-DD') <= $2
            AND (
                "terminationDate" IS NULL 
                OR "terminationDate" = ''
                OR TO_DATE("terminationDate", 'YYYY-MM-DD') > $2
            )
        `, [unitId, endDate]);
        
        return parseInt(result.rows[0].active_count) || 0;
        
    } catch (error) {
        console.error('Erro ao contar ativos:', error);
        return 0;
    }
}

async function saveActiveHistory(history) {
    try {
        console.log('Salvando histórico de ativos...');
        
        // Limpar tabela
        await query('DELETE FROM population_history');
        
        // Inserir registros
        for (const record of history) {
            await query(`
                INSERT INTO population_history 
                (id, record_date, unit_id, unit_name, total_employees, active_employees, inactive_employees, admissions_count, terminations_count, recorded_at)
                VALUES 
                ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
            `, [
                require('crypto').randomBytes(4).toString('hex'),
                record.record_date,
                record.unit_id,
                record.unit_name,
                record.total_employees,
                record.active_employees,
                record.inactive_employees,
                record.admissions_count,
                record.terminations_count
            ]);
        }
        
        console.log('Histórico de ativos salvo com sucesso!');
        
    } catch (error) {
        console.error('Erro ao salvar histórico:', error);
        throw error;
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    generateActiveHistory()
        .then(() => {
            console.log('Histórico de ativos gerado com sucesso!');
            process.exit(0);
        })
        .catch(error => {
            console.error('Falha:', error);
            process.exit(1);
        });
}

module.exports = { generateActiveHistory };
