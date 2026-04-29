/**
 * Migração: Atualizar estrutura da tabela overtime_records
 * Adicionar colunas em português e relacionamentos
 * Data: 28/04/2026
 */

const { query } = require('../config/database');

async function runMigration() {
    console.log('🔧 Iniciando migração da tabela overtime_records...\n');

    try {
        // Verificar estrutura atual da tabela
        console.log('🔍 Verificando estrutura atual da tabela...');
        const tableCheck = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'overtime_records' 
            ORDER BY ordinal_position
        `);
        
        console.log('   📋 Estrutura atual:');
        tableCheck.rows.forEach(col => {
            console.log(`      ${col.column_name}: ${col.data_type}`);
        });
        
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
        
        // Verificar se coluna VALOR já existe
        const valorCheck = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'overtime_records' 
                AND column_name = 'valor'
        `);
        
        if (valorCheck.rows.length === 0) {
            await query(`ALTER TABLE overtime_records ADD COLUMN VALOR TEXT`);
            console.log('   ✅ Coluna VALOR adicionada');
        } else {
            console.log('   ℹ️ Coluna VALOR já existe como tipo: ' + valorCheck.rows[0].data_type);
        }

        // 2. Migrar dados existentes para as novas colunas
        console.log('\n🔄 Migrando dados existentes...');
        
        // Migração em etapas para evitar erro de query complexa
        await query(`UPDATE overtime_records SET MES = month_year WHERE MES IS NULL`);
        await query(`UPDATE overtime_records SET NOME = (SELECT name FROM employees WHERE id = overtime_records.employee_id) WHERE NOME IS NULL`);
        await query(`UPDATE overtime_records SET EXTRA = overtime_time WHERE EXTRA IS NULL`);
        await query(`UPDATE overtime_records SET VALOR = CAST(overtime_value AS NUMERIC) WHERE VALOR IS NULL`);
        
        console.log('   ✅ Dados migrados para novas colunas');

        // 3. Popular coluna UNIDADE usando employee_vinculos
        console.log('\n🏢 Populando coluna UNIDADE...');
        
        // Primeiro verificar estrutura das tabelas
        const vinculoCheck = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'employee_vinculos' 
                AND column_name = 'workplace_id'
        `);
        
        const companyCheck = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'companies' 
                AND column_name = 'id'
        `);
        
        console.log('   📋 Estrutura employee_vinculos.workplace_id:', vinculoCheck.rows[0]?.data_type);
        console.log('   📋 Estrutura companies.id:', companyCheck.rows[0]?.data_type);
        
        // Ajustar query conforme tipos encontrados (ambos TEXT)
        const updateUnidadeQuery = `UPDATE overtime_records SET UNIDADE = wp.name FROM employee_vinculos ev JOIN companies wp ON ev.workplace_id = wp.id WHERE overtime_records.employee_id = ev.employee_id AND ev.principal = 1 AND overtime_records.UNIDADE IS NULL`;
        
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
        
        const checkQuery = `SELECT COUNT(*) as total, COUNT(MES) as com_mes, COUNT(UNIDADE) as com_unidade, COUNT(NOME) as com_nome, COUNT(EXTRA) as com_extra, COUNT(VALOR) as com_valor FROM overtime_records`;
        
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
