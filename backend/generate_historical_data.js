/**
 * GERAR HISTÓRICO POPULACIONAL REAL
 * Reconstrói a evolução mensal desde o início baseado em admissões/desligamentos
 */

const { query } = require('./config/database');

async function generateHistoricalData() {
    try {
        console.log('Gerando histórico populacional real...');
        
        // 1. Buscar data mais antiga de admissão
        const oldestDateResult = await query(`
            SELECT MIN("admissionDate") as oldest_date FROM employees 
            WHERE "admissionDate" IS NOT NULL AND "admissionDate" != ''
        `);
        
        if (!oldestDateResult.rows[0]?.oldest_date) {
            console.log('Nenhuma data de admissão encontrada');
            return [];
        }
        
        console.log(`Data mais antiga encontrada: ${oldestDateResult.rows[0].oldest_date}`);
        
        const oldestDate = new Date(oldestDateResult.rows[0].oldest_date);
        const today = new Date();
        
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
        
        // 3. Buscar todos os colaboradores com datas
        const employees = await query(`
            SELECT 
                id,
                name,
                workplace_id,
                "admissionDate",
                "terminationDate",
                type
            FROM employees
            WHERE workplace_id IS NOT NULL
            ORDER BY "admissionDate"
        `);
        
        console.log(`Processando ${employees.rows.length} colaboradores desde ${oldestDate.toISOString().split('T')[0]}`);
        
        // 4. Gerar histórico mês a mês
        const historicalData = [];
        let currentDate = new Date(oldestDate.getFullYear(), oldestDate.getMonth(), 1);
        
        while (currentDate <= today) {
            const recordDate = currentDate.toISOString().split('T')[0];
            const nextMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
            
            for (const unit of units.rows) {
                // Calcular estado nesta data para esta unidade
                const unitStats = calculateUnitStats(unit.unit_id, recordDate, nextMonthDate, employees.rows);
                
                // Sempre adicionar registro (mesmo que zero) para mostrar evolução completa
                historicalData.push({
                    record_date: recordDate,
                    unit_id: unit.unit_id,
                    unit_name: unit.unit_name,
                    total_employees: unitStats.total_employees,
                    active_employees: unitStats.active_employees,
                    inactive_employees: unitStats.inactive_employees,
                    admissions_count: unitStats.admissions_count,
                    terminations_count: unitStats.terminations_count
                });
            }
            
            // Avançar para o próximo mês
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
        
        // 5. Salvar no banco de dados
        console.log(`Gerados ${historicalData.length} registros históricos`);
        await saveHistoricalData(historicalData);
        
        return historicalData;
        
    } catch (error) {
        console.error('Erro ao gerar histórico:', error);
        throw error;
    }
}

function calculateUnitStats(unitId, recordDate, nextMonthDate, employees) {
    const stats = {
        total_employees: 0,
        active_employees: 0,
        inactive_employees: 0,
        admissions_count: 0,
        terminations_count: 0
    };
    
    for (const emp of employees) {
        if (emp.workplace_id !== unitId) continue;
        
        const admissionDate = emp.admissionDate ? new Date(emp.admissionDate) : null;
        const terminationDate = emp.terminationDate ? new Date(emp.terminationDate) : null;
        
        // Verificar se o colaborador existia nesta data
        if (admissionDate && admissionDate <= recordDate && emp.admissionDate && emp.admissionDate !== '') {
            stats.total_employees++;
            
            // Verificar se estava ativo ou inativo nesta data
            if (!terminationDate || terminationDate > recordDate) {
                // Não foi desligado ainda ou desligamento é depois desta data
                if (emp.type !== 'Desligado') {
                    stats.active_employees++;
                } else {
                    stats.inactive_employees++;
                }
            } else {
                // Já foi desligado antes desta data
                stats.inactive_employees++;
            }
            
            // Verificar se foi admitido neste mês
            if (admissionDate >= recordDate && admissionDate < nextMonthDate) {
                stats.admissions_count++;
            }
            
            // Verificar se foi desligado neste mês
            if (terminationDate && terminationDate >= recordDate && terminationDate < nextMonthDate) {
                stats.terminations_count++;
            }
        }
    }
    
    return stats;
}

async function saveHistoricalData(historicalData) {
    try {
        console.log('Salvando dados históricos...');
        
        // Limpar dados existentes
        await query('DELETE FROM population_history');
        
        // Inserir novos dados
        for (const record of historicalData) {
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
        
        console.log('Dados históricos salvos com sucesso!');
        
    } catch (error) {
        console.error('Erro ao salvar dados históricos:', error);
        throw error;
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    generateHistoricalData()
        .then(() => {
            console.log('Histórico gerado com sucesso!');
            process.exit(0);
        })
        .catch(error => {
            console.error('Falha:', error);
            process.exit(1);
        });
}

module.exports = { generateHistoricalData, calculateUnitStats };
