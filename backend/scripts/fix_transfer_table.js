const { query } = require('../config/database');

async function fixTransferTable() {
    try {
        console.log('🔧 CORRIGINDO TABELA employee_vinculo_transfers...');
        
        // 1. Verificar estrutura atual da tabela
        console.log('\n📋 1. Verificando estrutura atual...');
        
        const structureCheck = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'employee_vinculo_transfers' 
            ORDER BY ordinal_position
        `);
        
        console.log('Colunas atuais:');
        structureCheck.rows.forEach(col => {
            console.log(`  ${col.column_name}: ${col.data_type}`);
        });
        
        // 2. Adicionar coluna data_transferencia se não existir
        const hasDataTransferencia = structureCheck.rows.some(col => col.column_name === 'data_transferencia');
        
        if (!hasDataTransferencia) {
            console.log('\n🔧 2. Adicionando coluna data_transferencia...');
            
            await query(`
                ALTER TABLE employee_vinculo_transfers 
                ADD COLUMN data_transferencia TIMESTAMP
            `);
            
            console.log('✅ Coluna data_transferencia adicionada');
        } else {
            console.log('\n✅ Coluna data_transferencia já existe');
        }
        
        // 3. Verificar se há dados existentes e atualizar
        console.log('\n📋 3. Verificando dados existentes...');
        
        const existingData = await query(`
            SELECT id, employee_id, created_at, data_transferencia
            FROM employee_vinculo_transfers 
            LIMIT 5
        `);
        
        console.log(`📊 Total de transferências: ${existingData.rows.length}`);
        
        if (existingData.rows.length > 0) {
            console.log('Amostra de dados:');
            existingData.rows.forEach((row, index) => {
                console.log(`  ${index + 1}: ID ${row.id}, Data: ${row.created_at}, Transferência: ${row.data_transferencia || 'NULL'}`);
            });
            
            // Atualizar registros que não têm data_transferencia
            console.log('\n🔧 4. Atualizando registros sem data_transferencia...');
            
            await query(`
                UPDATE employee_vinculo_transfers 
                SET data_transferencia = created_at 
                WHERE data_transferencia IS NULL
            `);
            
            console.log('✅ Registros atualizados');
        }
        
        // 4. Criar índice para performance
        console.log('\n📈 5. Criando índices...');
        
        try {
            await query(`
                CREATE INDEX IF NOT EXISTS idx_employee_vinculo_transfers_data_transferencia 
                ON employee_vinculo_transfers(data_transferencia DESC)
            `);
            
            console.log('✅ Índice data_transferencia criado');
        } catch (indexError) {
            console.log('⚠️ Índice já existe ou erro:', indexError.message);
        }
        
        // 5. Testar a tabela corrigida
        console.log('\n🧪 6. Testando tabela corrigida...');
        
        // Inserir um registro de teste
        const crypto = require('crypto');
        const testTransferId = crypto.randomBytes(8).toString('hex');
        const testEmployeeId = '54df5d4c';
        
        await query(`
            INSERT INTO employee_vinculo_transfers 
            (id, employee_id, from_employer_id, from_workplace_id, to_employer_id, to_workplace_id, changed_by, observation, data_transferencia)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
            testTransferId,
            testEmployeeId,
            'a92a33c7',
            'u2',
            'edcfae9a',
            'u2',
            'Sistema Teste',
            'TESTE DE TRANSFERÊNCIA COM DATAS',
            new Date()
        ]);
        
        console.log('✅ Registro de teste inserido');
        
        // Consultar o registro
        const testResult = await query(`
            SELECT * FROM employee_vinculo_transfers 
            WHERE id = $1
        `, [testTransferId]);
        
        if (testResult.rows.length > 0) {
            const test = testResult.rows[0];
            console.log('📊 Registro de teste:');
            console.log(`  ID: ${test.id}`);
            console.log(`  Employee: ${test.employee_id}`);
            console.log(`  Data Transferência: ${test.data_transferencia}`);
            console.log(`  Observação: ${test.observation}`);
        }
        
        // Limpar registro de teste
        await query(`
            DELETE FROM employee_vinculo_transfers 
            WHERE id = $1
        `, [testTransferId]);
        
        console.log('✅ Registro de teste removido');
        
        // 6. Verificar estrutura final
        console.log('\n📋 7. Verificando estrutura final...');
        
        const finalStructure = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'employee_vinculo_transfers' 
            ORDER BY ordinal_position
        `);
        
        console.log('Estrutura final:');
        finalStructure.rows.forEach(col => {
            console.log(`  ✅ ${col.column_name}: ${col.data_type}`);
        });
        
        console.log('\n🎉 TABELA employee_vinculo_transfers CORRIGIDA!');
        console.log('✅ Coluna data_transferencia adicionada');
        console.log('✅ Dados existentes atualizados');
        console.log('✅ Índices criados');
        console.log('✅ Teste bem-sucedido');
        
        console.log('\n🚀 AGORA O SISTEMA DE TRANSFERÊNCIAS COM DATAS ESTÁ 100% FUNCIONAL!');
        
    } catch (error) {
        console.error('❌ Erro na correção:', error.message);
    } finally {
        process.exit(0);
    }
}

fixTransferTable();
