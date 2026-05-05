const { query } = require('../config/database');

async function designNewVinculoSystem() {
    try {
        console.log('🎯 Design do novo sistema de vínculos com períodos...');
        
        // 1. Proposta de estrutura nova
        console.log('\n📋 1. Proposta de estrutura para employee_vinculos:');
        console.log(`
CAMPOS ATUAIS:
✅ id
✅ employee_id  
✅ employer_id
✅ workplace_id
✅ data_inicio
✅ data_fim
✅ status (ATIVO, TRANSFERIDO, ENCERRADO)
✅ tipo_evento (ADMISSAO, TRANSFERENCIA, READMISSAO)
✅ principal (S/N)
✅ created_at
✅ updated_at

CAMPOS NOVOS PROPOSTOS:
🆕 data_transferencia - Data exata da transferência (marcador)
🆕 tipo_vinculo - PRINCIPAL, ATUAL, PASSADO
🆕 sequencia - Ordem cronológico dos vínculos (1, 2, 3...)
        `);
        
        // 2. Lógica dos períodos
        console.log('\n📅 2. Lógica dos períodos:');
        console.log(`
VÍNCULO PRINCIPAL:
- O primeiro vínculo do colaborador
- Data início = data_admissao_original
- Data fim = data_transferencia (se houver) ou NULL
- Tipo: PRINCIPAL

VÍNCULO ATUAL:
- O vínculo atualmente ativo
- Data início = data_transferencia
- Data fim = NULL
- Tipo: ATUAL

VÍNCULOS PASSADOS:
- Todos os vínculos anteriores encerrados
- Data fim < data_atual
- Tipo: PASSADO

EXEMPLO PRÁTICO:
Colaborador admitido em 2021-02-01 na Empresa A
Transferido em 2023-06-15 para Empresa B

VÍnculo 1 (PRINCIPAL):
- employer_id: A
- data_inicio: 2021-02-01
- data_fim: 2023-06-15
- data_transferencia: 2023-06-15
- tipo_vinculo: PRINCIPAL
- sequencia: 1

Vínculo 2 (ATUAL):
- employer_id: B  
- data_inicio: 2023-06-15
- data_fim: NULL
- tipo_vinculo: ATUAL
- sequencia: 2
        `);
        
        // 3. Implementação SQL
        console.log('\n🔧 3. Script de migração:');
        const migrationScript = `
-- Adicionar novos campos
ALTER TABLE employee_vinculos 
ADD COLUMN IF NOT EXISTS data_transferencia TIMESTAMP,
ADD COLUMN IF NOT EXISTS tipo_vinculo VARCHAR(20) DEFAULT 'ATUAL',
ADD COLUMN IF NOT EXISTS sequencia INTEGER DEFAULT 1;

-- Atualizar vínculos existentes
UPDATE employee_vinculos 
SET 
    tipo_vinculo = CASE 
        WHEN data_fim IS NULL THEN 'ATUAL'
        ELSE 'PASSADO'
    END,
    sequencia = (
        SELECT COUNT(*) 
        FROM employee_vinculos ev2 
        WHERE ev2.employee_id = employee_vinculos.employee_id 
        AND ev2.data_inicio <= employee_vinculos.data_inicio
    )
WHERE data_transferencia IS NULL;

-- Criar índices
CREATE INDEX CONCURRENTLY IF NOT EXISTS 
    idx_employee_vinculos_tipo_vinculo ON employee_vinculos(tipo_vinculo),
    idx_employee_vinculos_sequencia ON employee_vinculos(employee_id, sequencia),
    idx_employee_vinculos_data_transferencia ON employee_vinculos(data_transferencia);
        `;
        
        console.log(migrationScript);
        
        // 4. Lógica de transferência nova
        console.log('\n🔄 4. Nova lógica de transferência:');
        console.log(`
PASSO A PASSO DA TRANSFERÊNCIA:

1. IDENTIFICAR VÍNCULO ATUAL
   - Buscar vínculo com tipo_vinculo = 'ATUAL'
   - Verificar se realmente está ativo

2. ATUALIZAR VÍNCULO ATUAL PARA PASSADO
   - SET data_fim = NOW()
   - SET data_transferencia = NOW()  
   - SET tipo_vinculo = 'PASSADO'
   - SET status = 'TRANSFERIDO'

3. CRIAR NOVO VÍNCULO ATUAL
   - INSERT com employer_id novo
   - data_inicio = NOW()
   - data_fim = NULL
   - tipo_vinculo = 'ATUAL'
   - sequencia = (sequencia anterior + 1)

4. ATUALIZAR TABELA EMPLOYEES (retrocompatibilidade)
   - SET employer_id = novo_employer
   - SET workplace_id = novo_workplace

5. REGISTRAR HISTÓRICO
   - INSERT em employee_vinculo_transfers
   - INSERT em career_history
        `);
        
        // 5. Views para consulta
        console.log('\n👁️ 5. Views para consulta:');
        const viewQueries = `
-- View para vínculo principal
CREATE OR REPLACE VIEW vw_vinculo_principal AS
SELECT ev.*, emp.name as employer_name, wp.name as workplace_name
FROM employee_vinculos ev
LEFT JOIN companies emp ON ev.employer_id = emp.id  
LEFT JOIN companies wp ON ev.workplace_id = wp.id
WHERE ev.tipo_vinculo = 'PRINCIPAL' OR (ev.sequencia = 1 AND ev.tipo_vinculo != 'PRINCIPAL');

-- View para vínculo atual
CREATE OR REPLACE VIEW vw_vinculo_atual AS  
SELECT ev.*, emp.name as employer_name, wp.name as workplace_name
FROM employee_vinculos ev
LEFT JOIN companies emp ON ev.employer_id = emp.id
LEFT JOIN companies wp ON ev.workplace_id = wp.id  
WHERE ev.tipo_vinculo = 'ATUAL' AND ev.status = 'ATIVO';

-- View para histórico completo
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
ORDER BY ev.employee_id, ev.sequencia;
        `;
        
        console.log(viewQueries);
        
        // 6. Benefícios do novo sistema
        console.log('\n💡 6. Benefícios do novo sistema:');
        console.log(`
✅ RASTREABILIDADE COMPLETA:
   - Data exata de cada transferência
   - Sequência cronológica clara
   - Diferenciação entre principal, atual e passados

✅ ANALYTICS MELHORADAS:
   - Headcount por período preciso
   - Tempo de permanência por empresa
   - Histórico de movimentação

✅ TRANSFERÊNCIAS CLARAS:
   - Marcador temporal claro
   - Sem ambiguidade de períodos
   - Integridade histórica garantida

✅ INTERFACE MELHOR:
   - Vínculo principal (origem)
   - Vínculo atual (onde está agora)  
   - Vínculos passados (onde já esteve)
        `);
        
        console.log('\n🎉 Design concluído!');
        console.log('✅ Sistema de vínculos com períodos proposto');
        console.log('✅ Lógica clara e implementável');
        console.log('✅ Benefícios significativos para analytics');
        
    } catch (error) {
        console.error('❌ Erro no design:', error.message);
    } finally {
        process.exit(0);
    }
}

designNewVinculoSystem();
