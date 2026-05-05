const { query } = require('../config/database');

async function createSwapTermsTable() {
    try {
        console.log('🔄 Criando tabela swap_terms...');
        
        await query(`
            CREATE TABLE IF NOT EXISTS swap_terms (
                id TEXT PRIMARY KEY,
                employee_id TEXT NOT NULL,
                employee_name TEXT NOT NULL,
                employee_cpf TEXT,
                employee_empresa TEXT,
                employee_unidade TEXT,
                
                old_patrimonio TEXT NOT NULL,
                old_tipo TEXT,
                old_modelo TEXT,
                old_marca TEXT,
                old_processador TEXT,
                old_memoria TEXT,
                old_armazenamento TEXT,
                old_tier TEXT,
                old_acessorios TEXT,
                
                new_patrimonio TEXT NOT NULL,
                new_tipo TEXT,
                new_modelo TEXT,
                new_marca TEXT,
                new_processador TEXT,
                new_memoria TEXT,
                new_armazenamento TEXT,
                new_tier TEXT,
                new_acessorios TEXT,
                
                motivo_troca TEXT,
                observacoes TEXT,
                data_troca TEXT NOT NULL,
                responsavel TEXT,
                
                codigo_documento TEXT UNIQUE,
                data_emissao TEXT NOT NULL,
                
                created_at TEXT DEFAULT (datetime('now', 'localtime')),
                updated_at TEXT DEFAULT (datetime('now', 'localtime'))
            )
        `);
        
        // Criar índices para performance
        await query(`CREATE INDEX IF NOT EXISTS idx_swap_employee_id ON swap_terms(employee_id)`);
        await query(`CREATE INDEX IF NOT EXISTS idx_swap_old_patrimonio ON swap_terms(old_patrimonio)`);
        await query(`CREATE INDEX IF NOT EXISTS idx_swap_new_patrimonio ON swap_terms(new_patrimonio)`);
        await query(`CREATE INDEX IF NOT EXISTS idx_swap_data_troca ON swap_terms(data_troca)`);
        await query(`CREATE INDEX IF NOT EXISTS idx_swap_codigo_documento ON swap_terms(codigo_documento)`);
        
        console.log('✅ Tabela swap_terms criada com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao criar tabela swap_terms:', error);
        throw error;
    }
}

// Executar a criação
if (require.main === module) {
    createSwapTermsTable()
        .then(() => {
            console.log('🎉 Migração concluída com sucesso!');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Erro na migração:', error);
            process.exit(1);
        });
}

module.exports = { createSwapTermsTable };
