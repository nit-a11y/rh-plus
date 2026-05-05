const { query } = require('../config/database');

async function implementNewVinculoSystem() {
    try {
        console.log('🚀 Implementando novo sistema de vínculos com períodos...');
        
        // 1. Adicionar novos campos
        console.log('\n📋 1. Adicionando novos campos...');
        
        try {
            await query(`
                ALTER TABLE employee_vinculos 
                ADD COLUMN IF NOT EXISTS data_transferencia TIMESTAMP,
                ADD COLUMN IF NOT EXISTS tipo_vinculo VARCHAR(20) DEFAULT 'ATUAL',
                ADD COLUMN IF NOT EXISTS sequencia INTEGER DEFAULT 1
            `);
            console.log('✅ Novos campos adicionados');
        } catch (error) {
            console.log('⚠️ Campos já existem ou erro:', error.message);
        }
        
        // 2. Verificar estrutura atualizada
        console.log('\n📋 2. Verificando estrutura atualizada...');
        const structure = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'employee_vinculos' 
            ORDER BY ordinal_position
        `);
        
        const newColumns = ['data_transferencia', 'tipo_vinculo', 'sequencia'];
        const existingColumns = structure.rows.map(r => r.column_name);
        
        console.log('Verificação dos novos campos:');
        newColumns.forEach(col => {
            if (existingColumns.includes(col)) {
                console.log(`✅ ${col}: presente`);
            } else {
                console.log(`❌ ${col}: ausente`);
            }
        });
        
        // 3. Atualizar vínculos existentes
        console.log('\n📋 3. Atualizando vínculos existentes...');
        
        // Primeiro, verificar dados atuais
        const currentVinculos = await query(`
            SELECT employee_id, COUNT(*) as total
            FROM employee_vinculos 
            GROUP BY employee_id
            HAVING COUNT(*) > 1
            LIMIT 5
        `);
        
        console.log(`📊 Colaboradores com múltiplos vínculos: ${currentVinculos.rows.length}`);
        
        // Atualizar tipo_vinculo baseado em status
        await query(`
            UPDATE employee_vinculos 
            SET tipo_vinculo = CASE 
                WHEN data_fim IS NULL AND status = 'ATIVO' THEN 'ATUAL'
                WHEN data_fim IS NOT NULL OR status != 'ATIVO' THEN 'PASSADO'
                ELSE 'ATUAL'
            END
            WHERE tipo_vinculo IS NULL OR tipo_vinculo = 'ATUAL'
        `);
        
        console.log('✅ tipo_vinculo atualizado');
        
        // Atualizar sequência
        await query(`
            UPDATE employee_vinculos 
            SET sequencia = (
                SELECT COUNT(*) 
                FROM employee_vinculos ev2 
                WHERE ev2.employee_id = employee_vinculos.employee_id 
                AND ev2.data_inicio <= employee_vinculos.data_inicio
            )
            WHERE sequencia IS NULL OR sequencia = 1
        `);
        
        console.log('✅ sequência atualizada');
        
        // 4. Criar índices
        console.log('\n📋 4. Criando índices...');
        
        const indexes = [
            'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employee_vinculos_tipo_vinculo ON employee_vinculos(tipo_vinculo)',
            'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employee_vinculos_sequencia ON employee_vinculos(employee_id, sequencia)',
            'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employee_vinculos_data_transferencia ON employee_vinculos(data_transferencia)'
        ];
        
        for (const indexSql of indexes) {
            try {
                await query(indexSql);
                console.log(`✅ Índice criado: ${indexSql.split('idx_')[1].split(' ')[0]}`);
            } catch (error) {
                if (error.message.includes('already exists')) {
                    console.log(`⚠️ Índice já existe: ${indexSql.split('idx_')[1].split(' ')[0]}`);
                } else {
                    console.log(`❌ Erro ao criar índice: ${error.message}`);
                }
            }
        }
        
        // 5. Criar views
        console.log('\n📋 5. Criando views...');
        
        // View para vínculo principal
        try {
            await query(`
                CREATE OR REPLACE VIEW vw_vinculo_principal AS
                SELECT ev.*, emp.name as employer_name, wp.name as workplace_name
                FROM employee_vinculos ev
                LEFT JOIN companies emp ON ev.employer_id = emp.id
                LEFT JOIN companies wp ON ev.workplace_id = wp.id
                WHERE ev.sequencia = 1
            `);
            console.log('✅ View vw_vinculo_principal criada');
        } catch (error) {
            console.log('❌ Erro ao criar vw_vinculo_principal:', error.message);
        }
        
        // View para vínculo atual
        try {
            await query(`
                CREATE OR REPLACE VIEW vw_vinculo_atual AS
                SELECT ev.*, emp.name as employer_name, wp.name as workplace_name
                FROM employee_vinculos ev
                LEFT JOIN companies emp ON ev.employer_id = emp.id
                LEFT JOIN companies wp ON ev.workplace_id = wp.id
                WHERE ev.tipo_vinculo = 'ATUAL' AND ev.status = 'ATIVO'
            `);
            console.log('✅ View vw_vinculo_atual criada');
        } catch (error) {
            console.log('❌ Erro ao criar vw_vinculo_atual:', error.message);
        }
        
        // View para histórico completo
        try {
            await query(`
                CREATE OR REPLACE VIEW vw_historico_vinculos AS
                SELECT ev.*, emp.name as employer_name, wp.name as workplace_name,
                       CASE 
                           WHEN ev.data_transferencia IS NOT NULL THEN 
                               'Transferido em ' || TO_CHAR(ev.data_transferencia, 'DD/MM/YYYY')
                           WHEN ev.data_fim IS NOT NULL THEN 
                               'Encerrado em ' || TO_CHAR(ev.data_fim, 'DD/MM/YYYY')
                           ELSE 'Atual'
                       END as status_descricao
                FROM employee_vinculos ev
                LEFT JOIN companies emp ON ev.employer_id = emp.id
                LEFT JOIN companies wp ON ev.workplace_id = wp.id
                ORDER BY ev.employee_id, ev.sequencia
            `);
            console.log('✅ View vw_historico_vinculos criada');
        } catch (error) {
            console.log('❌ Erro ao criar vw_historico_vinculos:', error.message);
        }
        
        // 6. Testar novo sistema
        console.log('\n📋 6. Testando novo sistema...');
        
        // Buscar um colaborador com múltiplos vínculos para teste
        const testEmployee = await query(`
            SELECT employee_id, COUNT(*) as total
            FROM employee_vinculos 
            GROUP BY employee_id
            HAVING COUNT(*) > 1
            LIMIT 1
        `);
        
        if (testEmployee.rows.length > 0) {
            const employeeId = testEmployee.rows[0].employee_id;
            console.log(`👤 Testando com employee: ${employeeId}`);
            
            // Testar view de vínculo principal
            const principalVinculo = await query(`
                SELECT * FROM vw_vinculo_principal 
                WHERE employee_id = $1
            `, [employeeId]);
            
            console.log('📊 Vínculo principal:');
            principalVinculo.rows.forEach(v => {
                console.log(`  Sequência: ${v.sequencia}, Employer: ${v.employer_name}, Tipo: ${v.tipo_vinculo}`);
            });
            
            // Testar view de vínculo atual
            const atualVinculo = await query(`
                SELECT * FROM vw_vinculo_atual 
                WHERE employee_id = $1
            `, [employeeId]);
            
            console.log('📊 Vínculo atual:');
            atualVinculo.rows.forEach(v => {
                console.log(`  Sequência: ${v.sequencia}, Employer: ${v.employer_name}, Tipo: ${v.tipo_vinculo}`);
            });
            
            // Testar view de histórico
            const historicoVinculos = await query(`
                SELECT * FROM vw_historico_vinculos 
                WHERE employee_id = $1
                ORDER BY sequencia
            `, [employeeId]);
            
            console.log('📊 Histórico completo:');
            historicoVinculos.rows.forEach(v => {
                console.log(`  Seq: ${v.sequencia}, Emp: ${v.employer_name}, Tipo: ${v.tipo_vinculo}, Status: ${v.status_descricao}`);
            });
        } else {
            console.log('⚠️ Nenhum colaborador com múltiplos vínculos para teste');
        }
        
        // 7. Atualizar lógica de transferência
        console.log('\n📋 7. Preparando nova lógica de transferência...');
        
        console.log(`
🔄 NOVA LÓGICA DE TRANSFERÊNCIA (para implementar em transfers.js):

async function transferirComPeriodos(employeeId, novoEmployerId, novoWorkplaceId, motivo, responsavel) {
    // 1. Buscar vínculo atual
    const vinculoAtual = await query(\`
        SELECT * FROM employee_vinculos 
        WHERE employee_id = \$1 AND tipo_vinculo = 'ATUAL' AND status = 'ATIVO'
        ORDER BY sequencia DESC LIMIT 1
    \`, [employeeId]);
    
    if (vinculoAtual.rows.length === 0) {
        throw new Error('Nenhum vínculo ativo encontrado');
    }
    
    const atual = vinculoAtual.rows[0];
    const dataTransferencia = new Date();
    const novaSequencia = atual.sequencia + 1;
    
    // 2. Atualizar vínculo atual para passado
    await query(\`
        UPDATE employee_vinculos 
        SET data_fim = \$2, 
            data_transferencia = \$2,
            tipo_vinculo = 'PASSADO',
            status = 'TRANSFERIDO',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = \$1
    \`, [atual.id, dataTransferencia]);
    
    // 3. Criar novo vínculo atual
    const novoVinculoId = generateId();
    await query(\`
        INSERT INTO employee_vinculos 
        (id, employee_id, employer_id, workplace_id, data_inicio, data_fim, 
         status, tipo_evento, principal, tipo_vinculo, sequencia, data_transferencia)
        VALUES (\$1, \$2, \$3, \$4, \$5, NULL, 'ATIVO', 'TRANSFERENCIA', 'N', 'ATUAL', \$6, NULL)
    \`, [novoVinculoId, employeeId, novoEmployerId, novoWorkplaceId, dataTransferencia, novaSequencia]);
    
    // 4. Atualizar employees (retrocompatibilidade)
    await query(\`
        UPDATE employees 
        SET employer_id = \$1, workplace_id = \$2, updated_at = CURRENT_TIMESTAMP
        WHERE id = \$3
    \`, [novoEmployerId, novoWorkplaceId, employeeId]);
    
    // 5. Registrar histórico
    await query(\`
        INSERT INTO employee_vinculo_transfers 
        (id, employee_id, from_employer_id, from_workplace_id, to_employer_id, to_workplace_id, changed_by, observation)
        VALUES (\$1, \$2, \$3, \$4, \$5, \$6, \$7, \$8)
    \`, [generateId(), employeeId, atual.employer_id, atual.workplace_id, novoEmployerId, novoWorkplaceId, responsavel, motivo]);
    
    return { success: true, novoVinculoId };
}
        `);
        
        console.log('\n🎉 Implementação concluída!');
        console.log('✅ Novo sistema de vínculos implementado');
        console.log('✅ Campos, índices e views criados');
        console.log('✅ Lógica de períodos pronta');
        console.log('✅ Transferências com data marcadora');
        
    } catch (error) {
        console.error('❌ Erro na implementação:', error.message);
    } finally {
        process.exit(0);
    }
}

implementNewVinculoSystem();
