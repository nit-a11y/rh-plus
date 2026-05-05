const { query, transaction } = require('../config/database');

async function refactorEmployeeVinculosStructure() {
    try {
        console.log('🔧 Iniciando refatoração da tabela employee_vinculos...');
        
        await transaction(async (client) => {
            console.log('📋 1. Adicionando colunas para controle histórico...');
            
            // Adicionar colunas necessárias
            await client.query(`
                ALTER TABLE employee_vinculos 
                ADD COLUMN IF NOT EXISTS data_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ADD COLUMN IF NOT EXISTS data_fim TIMESTAMP NULL,
                ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ATIVO',
                ADD COLUMN IF NOT EXISTS tipo_evento VARCHAR(20) DEFAULT 'ADMISSAO',
                ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            `);
            
            console.log('📋 2. Criando índices para performance...');
            
            // Criar índices
            const indexes = [
                'CREATE INDEX IF NOT EXISTS idx_employee_vinculos_employee_id ON employee_vinculos(employee_id)',
                'CREATE INDEX IF NOT EXISTS idx_employee_vinculos_employer_id ON employee_vinculos(employer_id)',
                'CREATE INDEX IF NOT EXISTS idx_employee_vinculos_workplace_id ON employee_vinculos(workplace_id)',
                'CREATE INDEX IF NOT EXISTS idx_employee_vinculos_status ON employee_vinculos(status)',
                'CREATE INDEX IF NOT EXISTS idx_employee_vinculos_data_inicio ON employee_vinculos(data_inicio)',
                'CREATE INDEX IF NOT EXISTS idx_employee_vinculos_data_fim ON employee_vinculos(data_fim)'
            ];
            
            for (const indexSql of indexes) {
                await client.query(indexSql);
            }
            
            console.log('📋 3. Migrando dados existentes...');
            
            // Migrar dados existentes
            await client.query(`
                UPDATE employee_vinculos 
                SET 
                    data_inicio = COALESCE(criado_em::timestamp, CURRENT_TIMESTAMP),
                    status = CASE 
                        WHEN principal = 'S' THEN 'ATIVO'
                        ELSE 'INATIVO'
                    END,
                    tipo_evento = 'ADMISSAO',
                    created_at = COALESCE(criado_em::timestamp, CURRENT_TIMESTAMP)
                WHERE data_inicio IS NULL
            `);
            
            console.log('📋 4. Criando trigger para updated_at...');
            
            // Criar trigger function
            await client.query(`
                CREATE OR REPLACE FUNCTION update_vinculos_updated_at()
                RETURNS TRIGGER AS $$
                BEGIN
                    NEW.updated_at = CURRENT_TIMESTAMP;
                    RETURN NEW;
                END;
                $$ language 'plpgsql'
            `);
            
            // Criar trigger
            await client.query(`
                DROP TRIGGER IF EXISTS trigger_employee_vinculos_updated_at ON employee_vinculos
            `);
            
            await client.query(`
                CREATE TRIGGER trigger_employee_vinculos_updated_at
                    BEFORE UPDATE ON employee_vinculos
                    FOR EACH ROW
                    EXECUTE FUNCTION update_vinculos_updated_at()
            `);
            
            console.log('📋 5. Criando views para consultas...');
            
            // View para vínculos atuais
            await client.query(`
                CREATE OR REPLACE VIEW vw_vinculos_atuais AS
                SELECT 
                    ev.*,
                    emp.name as employer_name,
                    emp.cnpj as employer_cnpj,
                    wp.name as workplace_name,
                    wp.cnpj as workplace_cnpj,
                    e.name as employee_name,
                    e."registrationNumber" as employee_registration
                FROM employee_vinculos ev
                LEFT JOIN companies emp ON ev.employer_id = emp.id
                LEFT JOIN companies wp ON ev.workplace_id = wp.id
                LEFT JOIN employees e ON ev.employee_id = e.id
                WHERE ev.status = 'ATIVO'
                ORDER BY ev.data_inicio DESC
            `);
            
            // View para analytics
            await client.query(`
                CREATE OR REPLACE VIEW vw_headcount_periodo AS
                SELECT 
                    ev.employer_id,
                    emp.name as employer_name,
                    ev.workplace_id,
                    wp.name as workplace_name,
                    ev.data_inicio,
                    ev.data_fim,
                    ev.status,
                    ev.tipo_evento,
                    e.name as employee_name,
                    e."registrationNumber"
                FROM employee_vinculos ev
                LEFT JOIN companies emp ON ev.employer_id = emp.id
                LEFT JOIN companies wp ON ev.workplace_id = wp.id
                LEFT JOIN employees e ON ev.employee_id = e.id
                WHERE ev.data_inicio IS NOT NULL
                ORDER BY ev.data_inicio DESC
            `);
        });
        
        console.log('✅ Refatoração concluída com sucesso!');
        
        // Verificar estrutura final
        const structure = await query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'employee_vinculos' 
            ORDER BY ordinal_position
        `);
        
        console.log('\n📊 Estrutura final da tabela:');
        console.log(JSON.stringify(structure.rows, null, 2));
        
        // Verificar dados
        const count = await query('SELECT COUNT(*) as total FROM employee_vinculos');
        console.log(`\n📈 Total de registros: ${count.rows[0].total}`);
        
        const activeCount = await query("SELECT COUNT(*) as total FROM employee_vinculos WHERE status = 'ATIVO'");
        console.log(`📈 Vínculos ativos: ${activeCount.rows[0].total}`);
        
    } catch (error) {
        console.error('❌ Erro na refatoração:', error.message);
        throw error;
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    refactorEmployeeVinculosStructure()
        .then(() => {
            console.log('🎉 Processo finalizado!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Falha no processo:', error);
            process.exit(1);
        });
}

module.exports = { refactorEmployeeVinculosStructure };
