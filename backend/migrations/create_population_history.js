/**
 * MIGRATION: Criar tabela de histórico populacional
 * Objetivo: Armazenar dados históricos de colaboradores por unidade
 * Fonte: employees + companies (mesma estrutura do employees-pro)
 */

const { query } = require('../config/database');

async function createPopulationHistoryTable() {
    try {
        console.log('Criando tabela population_history...');
        
        // Criar tabela se não existir
        await query(`
            CREATE TABLE IF NOT EXISTS population_history (
                id TEXT PRIMARY KEY,
                record_date DATE NOT NULL,
                unit_id TEXT NOT NULL,
                unit_name VARCHAR(255) NOT NULL,
                total_employees INTEGER DEFAULT 0,
                active_employees INTEGER DEFAULT 0,
                inactive_employees INTEGER DEFAULT 0,
                admissions_count INTEGER DEFAULT 0,
                terminations_count INTEGER DEFAULT 0,
                recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(unit_id, record_date)
            )
        `);

        // Criar índices para performance
        await query(`CREATE INDEX IF NOT EXISTS idx_population_history_date ON population_history(record_date)`);
        await query(`CREATE INDEX IF NOT EXISTS idx_population_history_unit ON population_history(unit_id)`);
        await query(`CREATE INDEX IF NOT EXISTS idx_population_history_recorded ON population_history(recorded_at)`);

        console.log('Tabela population_history criada com sucesso!');
        return true;
    } catch (error) {
        console.error('Erro ao criar tabela population_history:', error);
        throw error;
    }
}

async function importHistoricalData() {
    try {
        console.log('Importando dados históricos...');
        
        // Buscar a data da admissão mais antiga
        const oldestAdmission = await query(`
            SELECT MIN("admissionDate") as oldest_date FROM employees WHERE "admissionDate" IS NOT NULL
        `);
        
        if (!oldestAdmission.rows[0]?.oldest_date) {
            console.log('Nenhuma admissão encontrada para importar histórico');
            return;
        }
        
        const oldestDate = new Date(oldestAdmission.rows[0].oldest_date);
        const today = new Date();
        
        // Gerar registros mensais desde a admissão mais antiga
        const records = [];
        let currentDate = new Date(oldestDate.getFullYear(), oldestDate.getMonth(), 1);
        
        while (currentDate <= today) {
            const recordDate = currentDate.toISOString().split('T')[0];
            records.push(recordDate);
            
            // Avançar para o próximo mês
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
        
        console.log(`Gerando histórico para ${records.length} meses...`);
        
        // Para cada mês, calcular dados por unidade
        for (const recordDate of records) {
            const units = await query(`
                SELECT DISTINCT 
                    c.id as unit_id,
                    c.name as unit_name
                FROM companies c
                WHERE c.id IN (
                    SELECT DISTINCT workplace_id 
                    FROM employees 
                    WHERE workplace_id IS NOT NULL
                )
                ORDER BY c.name
            `);
            
            for (const unit of units.rows) {
                // Calcular dados para esta unidade neste mês
                const stats = await query(`
                    SELECT 
                        COUNT(*) as total_employees,
                        COUNT(CASE WHEN type != 'Desligado' THEN 1 END) as active_employees,
                        COUNT(CASE WHEN type = 'Desligado' THEN 1 END) as inactive_employees,
                        COUNT(CASE WHEN "admissionDate" <= $1 AND "admissionDate" IS NOT NULL THEN 1 END) as admissions_count,
                        COUNT(CASE WHEN "terminationDate" <= $1 AND "terminationDate" IS NOT NULL THEN 1 END) as terminations_count
                    FROM employees 
                    WHERE workplace_id = $2
                    AND (
                        ("admissionDate" <= $1) OR ("admissionDate" IS NULL)
                    )
                `, [recordDate, unit.unit_id]);
                
                const stat = stats.rows[0];
                
                // Inserir registro se não existir
                await query(`
                    INSERT INTO population_history 
                    (id, record_date, unit_id, unit_name, total_employees, active_employees, inactive_employees, admissions_count, terminations_count)
                    VALUES 
                    ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    ON CONFLICT (unit_id, record_date) DO NOTHING
                `, [
                    require('crypto').randomBytes(4).toString('hex'),
                    recordDate,
                    unit.unit_id,
                    unit.unit_name,
                    stat.total_employees,
                    stat.active_employees,
                    stat.inactive_employees,
                    stat.admissions_count,
                    stat.terminations_count
                ]);
            }
        }
        
        console.log('Dados históricos importados com sucesso!');
        
    } catch (error) {
        console.error('Erro ao importar dados históricos:', error);
        throw error;
    }
}

// Executar migração
async function runMigration() {
    try {
        await createPopulationHistoryTable();
        await importHistoricalData();
        console.log('Migração concluída com sucesso!');
    } catch (error) {
        console.error('Falha na migração:', error);
        process.exit(1);
    }
}

// Exportar funções para uso em outros scripts
module.exports = {
    createPopulationHistoryTable,
    importHistoricalData,
    runMigration
};

// Executar se chamado diretamente
if (require.main === module) {
    runMigration();
}
