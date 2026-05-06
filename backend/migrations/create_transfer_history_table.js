const { query } = require('../config/database');

async function createTransferHistoryTable() {
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS employee_transfer_history (
                id VARCHAR(32) PRIMARY KEY DEFAULT gen_random_uuid(),
                employee_id VARCHAR(32) NOT NULL,
                from_employer_id VARCHAR(32),
                to_employer_id VARCHAR(32),
                from_workplace_id VARCHAR(32),
                to_workplace_id VARCHAR(32),
                reason TEXT,
                changed_by VARCHAR(100),
                changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (employee_id) REFERENCES employees(id),
                FOREIGN KEY (from_employer_id) REFERENCES companies(id),
                FOREIGN KEY (to_employer_id) REFERENCES companies(id),
                FOREIGN KEY (from_workplace_id) REFERENCES companies(id),
                FOREIGN KEY (to_workplace_id) REFERENCES companies(id)
            );
            
            CREATE INDEX IF NOT EXISTS idx_employee_transfer_history_employee_id 
            ON employee_transfer_history(employee_id);
            
            CREATE INDEX IF NOT EXISTS idx_employee_transfer_history_changed_at 
            ON employee_transfer_history(changed_at DESC);
        `);
        
        console.log('✅ Tabela employee_transfer_history criada com sucesso');
        return true;
    } catch (error) {
        console.error('❌ Erro ao criar tabela employee_transfer_history:', error);
        return false;
    }
}

module.exports = { createTransferHistoryTable };
