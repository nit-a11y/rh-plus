/**
 * Migração: Atualizar estrutura da tabela overtime_records
 * Adicionar colunas em português e relacionamentos
 * Data: 28/04/2026
 */

const { query } = require('../config/database');

async function runMigration() {
    console.log('🔧 Iniciando migração da tabela overtime_records...\n');

    try {
        // 1. Adicionar colunas em português (se não existirem)
        console.log('📝 Adicionando colunas em português...');
        
        try {
            await query(`ALTER TABLE overtime_records ADD COLUMN MES TEXT`);
            console.log('   ✅ Coluna MES adicionada');
        } catch (e) {
            if (!e.message.includes('already exists')) {
                throw e;
            }
            console.log('   ℹ️ Coluna MES já existe');
        }
        
        try {
            await query(`ALTER TABLE overtime_records ADD COLUMN UNIDADE TEXT`);
            console.log('   ✅ Coluna UNIDADE adicionada');
        } catch (e) {
            if (!e.message.includes('already exists')) {
                throw e;
            }
            console.log('   ℹ️ Coluna UNIDADE já existe');
        }
        
        try {
            await query(`ALTER TABLE overtime_records ADD COLUMN NOME TEXT`);
            console.log('   ✅ Coluna NOME adicionada');
        } catch (e) {
            if (!e.message.includes('already exists')) {
                throw e;
            }
            console.log('   ℹ️ Coluna NOME já existe');
        }
        
        try {
            await query(`ALTER TABLE overtime_records ADD COLUMN EXTRA TEXT`);
            console.log('   ✅ Coluna EXTRA adicionada');
        } catch (e) {
            if (!e.message.includes('already exists')) {
                throw e;
            }
            console.log('   ℹ️ Coluna EXTRA já existe');
        }
        
        try {
            await query(`ALTER TABLE overtime_records ADD COLUMN VALOR TEXT`);
            console.log('   ✅ Coluna VALOR adicionada');
        } catch (e) {
            if (!e.message.includes('already exists')) {
                throw e;
            }
            console.log('   ℹ️ Coluna VALOR já existe');
        }

        // 2. Migrar dados existentes para as novas colunas
        console.log('\n🔄 Migrando dados existentes...');
        
        // Migração em etapas simples
        try {
            await query(`UPDATE overtime_records SET MES = month_year WHERE MES IS NULL`);
            console.log('   ✅ MES migrado');
        } catch (e) {
            console.log('   ⚠️ Erro ao migrar MES:', e.message);
        }
        
        try {
            await query(`UPDATE overtime_records SET NOME = (SELECT name FROM employees WHERE id = overtime_records.employee_id) WHERE NOME IS NULL`);
            console.log('   ✅ NOME migrado');
        } catch (e) {
            console.log('   ⚠️ Erro ao migrar NOME:', e.message);
        }
        
        try {
            await query(`UPDATE overtime_records SET EXTRA = overtime_time WHERE EXTRA IS NULL`);
            console.log('   ✅ EXTRA migrado');
        } catch (e) {
            console.log('   ⚠️ Erro ao migrar EXTRA:', e.message);
        }
        
        try {
            await query(`UPDATE overtime_records SET VALOR = overtime_value WHERE VALOR IS NULL`);
            console.log('   ✅ VALOR migrado');
        } catch (e) {
            console.log('   ⚠️ Erro ao migrar VALOR:', e.message);
        }

        // 3. Popular coluna UNIDADE usando employee_vinculos (se possível)
        console.log('\n🏢 Populando coluna UNIDADE...');
        
        try {
            // Verificar se tabelas relacionadas existem
            const vinculoCheck = await query(`
                SELECT COUNT(*) as count 
                FROM information_schema.tables 
                WHERE table_name = 'employee_vinculos'
            `);
            
            const companyCheck = await query(`
                SELECT COUNT(*) as count 
                FROM information_schema.tables 
                WHERE table_name = 'companies'
            `);
            
            if (vinculoCheck.rows[0].count > 0 && companyCheck.rows[0].count > 0) {
                await query(`
                    UPDATE overtime_records 
                    SET UNIDADE = wp.name 
                    FROM employee_vinculos ev 
                    JOIN companies wp ON ev.workplace_id = wp.id 
                    WHERE overtime_records.employee_id = ev.employee_id 
                        AND ev.principal = 1 
                        AND overtime_records.UNIDADE IS NULL
                `);
                console.log('   ✅ Coluna UNIDADE populada com nome da unidade');
            } else {
                console.log('   ⚠️ Tabelas relacionadas não encontradas, pulando população de UNIDADE');
            }
        } catch (e) {
            console.log('   ⚠️ Erro ao popular UNIDADE:', e.message);
        }

        // 4. Criar índices para performance
        console.log('\n📊 Criando índices...');
        
        try {
            await query(`CREATE INDEX IF NOT EXISTS idx_overtime_mes ON overtime_records(MES)`);
            console.log('   ✅ Índice idx_overtime_mes criado');
        } catch (e) {
            console.log('   ⚠️ Erro ao criar índice MES:', e.message);
        }
        
        try {
            await query(`CREATE INDEX IF NOT EXISTS idx_overtime_unidade ON overtime_records(UNIDADE)`);
            console.log('   ✅ Índice idx_overtime_unidade criado');
        } catch (e) {
            console.log('   ⚠️ Erro ao criar índice UNIDADE:', e.message);
        }
        
        try {
            await query(`CREATE INDEX IF NOT EXISTS idx_overtime_nome ON overtime_records(NOME)`);
            console.log('   ✅ Índice idx_overtime_nome criado');
        } catch (e) {
            console.log('   ⚠️ Erro ao criar índice NOME:', e.message);
        }

        try {
            await query(`CREATE INDEX IF NOT EXISTS idx_overtime_employee_mes ON overtime_records(employee_id, MES)`);
            console.log('   ✅ Índice composto idx_overtime_employee_mes criado');
        } catch (e) {
            console.log('   ⚠️ Erro ao criar índice composto:', e.message);
        }

        // 5. Verificar resultados
        console.log('\n🔍 Verificando migração...');
        
        const checkQuery = `
            SELECT 
                COUNT(*) as total,
                COUNT(MES) as com_mes,
                COUNT(UNIDADE) as com_unidade,
                COUNT(NOME) as com_nome,
                COUNT(EXTRA) as com_extra,
                COUNT(VALOR) as com_valor
            FROM overtime_records
        `;
        
        const result = await query(checkQuery);
        const stats = result.rows[0];
        
        console.log(`   📊 Estatísticas da migração:`);
        console.log(`      Total de registros: ${stats.total}`);
        console.log(`      Com MES: ${stats.com_mes}`);
        console.log(`      Com UNIDADE: ${stats.com_unidade}`);
        console.log(`      Com NOME: ${stats.com_nome}`);
        console.log(`      Com EXTRA: ${stats.com_extra}`);
        console.log(`      Com VALOR: ${stats.com_valor}`);

        console.log('\n✨ Migração concluída com sucesso!\n');
        
        return {
            success: true,
            message: 'Migração concluída',
            stats: stats
        };
        
    } catch (error) {
        console.error('❌ Erro durante a migração:', error.message);
        throw error;
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    runMigration()
        .then(result => {
            console.log('🎉 Processo finalizado com sucesso!');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Falha na migração:', error.message);
            process.exit(1);
        });
}

module.exports = { runMigration };
