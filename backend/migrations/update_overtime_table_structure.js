/**
 * Migração: Atualizar estrutura da tabela overtime_records
 * Adicionar colunas em português e relacionamentos
 * Data: 28/04/2026
 */

const { query } = require('../config/database');

async function runMigration() {
    console.log('🔧 Iniciando migração da tabela overtime_records...\n');

    try {
        // 1. Adicionar colunas em português
        console.log('📝 Adicionando colunas em português...');
        
        await query(`ALTER TABLE overtime_records ADD COLUMN IF NOT EXISTS MES TEXT`);
        console.log('   ✅ Coluna MES adicionada');
        
        await query(`ALTER TABLE overtime_records ADD COLUMN IF NOT EXISTS UNIDADE TEXT`);
        console.log('   ✅ Coluna UNIDADE adicionada');
        
        await query(`ALTER TABLE overtime_records ADD COLUMN IF NOT EXISTS NOME TEXT`);
        console.log('   ✅ Coluna NOME adicionada');
        
        await query(`ALTER TABLE overtime_records ADD COLUMN IF NOT EXISTS EXTRA TEXT`);
        console.log('   ✅ Coluna EXTRA adicionada');
        
        await query(`ALTER TABLE overtime_records ADD COLUMN IF NOT EXISTS VALOR TEXT`);
        console.log('   ✅ Coluna VALOR adicionada');

        // 2. Migrar dados existentes para as novas colunas
        console.log('\n🔄 Migrando dados existentes...');
        
        const migrationQuery = `
            UPDATE overtime_records 
            SET 
                MES = month_year,
                NOME = (SELECT name FROM employees WHERE id = overtime_records.employee_id),
                EXTRA = overtime_time,
                VALOR = CAST(overtime_value AS TEXT)
            WHERE MES IS NULL OR NOME IS NULL
        `;
        
        await query(migrationQuery);
        console.log('   ✅ Dados migrados para novas colunas');

        // 3. Popular coluna UNIDADE usando employee_vinculos
        console.log('\n🏢 Populando coluna UNIDADE...');
        
        const updateUnidadeQuery = `
            UPDATE overtime_records 
            SET UNIDADE = wp.name
            FROM employee_vinculos ev
            JOIN companies wp ON ev.workplace_id = wp.id
            WHERE overtime_records.employee_id = ev.employee_id 
                AND ev.principal = 1
                AND overtime_records.UNIDADE IS NULL
        `;
        
        await query(updateUnidadeQuery);
        console.log('   ✅ Coluna UNIDADE populada com nome da unidade');

        // 4. Criar índices para performance
        console.log('\n📊 Criando índices...');
        
        await query(`CREATE INDEX IF NOT EXISTS idx_overtime_mes ON overtime_records(MES)`);
        console.log('   ✅ Índice idx_overtime_mes criado');
        
        await query(`CREATE INDEX IF NOT EXISTS idx_overtime_unidade ON overtime_records(UNIDADE)`);
        console.log('   ✅ Índice idx_overtime_unidade criado');
        
        await query(`CREATE INDEX IF NOT EXISTS idx_overtime_nome ON overtime_records(NOME)`);
        console.log('   ✅ Índice idx_overtime_nome criado');

        // 5. Criar índice composto para performance das queries principais
        await query(`CREATE INDEX IF NOT EXISTS idx_overtime_employee_mes ON overtime_records(employee_id, MES)`);
        console.log('   ✅ Índice composto idx_overtime_employee_mes criado');

        // 6. Verificar resultados
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

// Função para verificar se a migração já foi executada
async function checkMigrationStatus() {
    try {
        const result = await query(`
            SELECT COUNT(*) as count 
            FROM information_schema.columns 
            WHERE table_name = 'overtime_records' 
                AND column_name = 'MES'
        `);
        
        return result.rows[0].count > 0;
    } catch (error) {
        // Se a tabela information_schema não existir (SQLite), assume que não migrou
        return false;
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    checkMigrationStatus().then(alreadyMigrated => {
        if (alreadyMigrated) {
            console.log('⚠️ Migração já foi executada anteriormente.');
            console.log('💡 Para forçar a migração, remova as colunas manualmente primeiro.');
        } else {
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
    });
}

module.exports = { runMigration, checkMigrationStatus };
