const { query } = require('../config/database');
const crypto = require('crypto');

// Mapeamento de entidades do sistema
const entidades = {
    'a92a33c7': { nome: 'AR2 SERVIÇOS E SOLUÇÕES LTDA', tipo: 'Empregador' },
    'edcfae9a': { nome: 'NORDESTE LOCAÇÕES - FORTALEZA', tipo: 'Ambos' },
    'c2': { nome: 'AER2 SERVIÇOS E SOLUÇÕES LTDA', tipo: 'Empregador' },
    'u3': { nome: 'NORDESTE LOCAÇÕES - SÃO LUÍS', tipo: 'Unidade' },
    'u4': { nome: 'NORDESTE LOCAÇÕES - EUSÉBIO', tipo: 'Unidade' },
    '38917ce0': { nome: 'AMPLA MANUTENÇÕES', tipo: 'Empregador' }
};

// Operações de transferência
const transferencias = [
    { 
        nome: 'VANESSA DOS SANTOS XAVIER', 
        cpf: '60558454313',
        de: { empresa: 'a92a33c7', unidade: 'u4' },
        para: { empresa: 'a92a33c7', unidade: 'edcfae9a' },
        data: '08/02/2025',
        cargoNovo: 'SDR',
        salarioNovo: 1766.52
    },
    { 
        nome: 'JOSE EMERSON MOREIRA NERI', 
        cpf: '07809755374',
        de: { empresa: 'a92a33c7', unidade: 'u4' },
        para: { empresa: 'a92a33c7', unidade: 'edcfae9a' },
        data: '08/02/2025',
        cargoNovo: 'ANALISTA DE OPERAÇÕES',
        salarioNovo: 2583.93
    }
];

// Readmissões
const readmissoes = [
    { 
        nome: 'MIKAEL PRUDÊNCIO FERNANDES', 
        cpf: '06717017384',
        ciclos: [
            { 
                cargo: 'SUPERVISOR COMERCIAL', 
                salario: 3815.80,
                periodo: ['04/01/2024', '05/06/2025'],
                setor: 'Comercial',
                diretoria: 'Ricardo'
            },
            { 
                cargo: 'CONSULTOR COMERCIAL EXTERNO SENIOR I', 
                salario: 2885.49,
                periodo: ['01/09/2025', '31/10/2025'],
                setor: 'Comercial',
                diretoria: 'Ricardo'
            }
        ]
    }
];

// Novos colaboradores
const novosColaboradores = [
    { 
        nome: 'ALEXIS WINNICIUS GAMA SALAZAR', 
        cpf: '61735867381',
        empresa: 'c2', 
        unidade: 'u3',
        cargo: 'MECÂNICO PLENO I', 
        salario: 2359.79,
        setor: 'Manutenção',
        diretoria: 'Rafael',
        periodo: ['08/04/2026', null], // ATUAL
        nascimento: '14/09/1998',
        sexo: 'Masculino'
    },
    { 
        nome: 'DAVI MACIEL RABELO', 
        cpf: '62594806366',
        empresa: 'edcfae9a', 
        unidade: 'edcfae9a',
        cargo: 'ESTAGIÁRIO DE PCM', 
        salario: 900.00,
        setor: 'Manutenção',
        diretoria: 'Rafael',
        periodo: ['04/03/2026', null], // ATUAL
        nascimento: '07/04/2004',
        sexo: 'Masculino'
    },
    { 
        nome: 'RICKELME ANGELL SOUZA ALMEIDA', 
        cpf: '61826823379',
        empresa: 'c2', 
        unidade: 'u3',
        cargo: 'MECÂNICO PLENO I', 
        salario: 2359.79,
        setor: 'Manutenção',
        diretoria: 'Rafael',
        periodo: ['25/03/2026', null], // ATUAL
        nascimento: '30/04/2004',
        sexo: 'Masculino'
    },
    { 
        nome: 'THIAGO GUIMARÃES LISBOA RIBEIRO', 
        cpf: '02148414135',
        empresa: 'edcfae9a', 
        unidade: 'edcfae9a',
        cargo: 'GERENTE COMERCIAL', 
        salario: null, // não informado
        setor: 'Comercial',
        diretoria: 'Ricardo',
        periodo: ['01/04/2026', null], // ATUAL
        nascimento: '26/09/1989',
        sexo: 'Masculino'
    }
];

async function executarSincronizacao() {
    try {
        console.log('🚀 INICIANDO SINCRONIZAÇÃO DE DADOS...');
        console.log(`📊 Total de operações: ${transferencias.length} transferências, ${readmissoes.length} readmissões, ${novosColaboradores.length} novos`);
        
        await query('BEGIN');
        
        // 1. Processar transferências
        console.log('\n🔄 1. Processando transferências...');
        for (const transferencia of transferencias) {
            await processarTransferencia(transferencia);
        }
        
        // 2. Processar readmissões
        console.log('\n🔄 2. Processando readmissões...');
        for (const readmissao of readmissoes) {
            await processarReadmissao(readmissao);
        }
        
        // 3. Inserir novos colaboradores
        console.log('\n➕ 3. Inserindo novos colaboradores...');
        for (const colaborador of novosColaboradores) {
            await inserirNovoColaborador(colaborador);
        }
        
        await query('COMMIT');
        
        // 4. Validação final
        await validarSincronizacao();
        
        console.log('\n🎉 SINCRONIZAÇÃO CONCLUÍDA COM SUCESSO!');
        
    } catch (error) {
        await query('ROLLBACK');
        console.error('❌ Erro na sincronização:', error.message);
        throw error;
    }
}

async function processarTransferencia(transferencia) {
    console.log(`   🔄 Processando transferência: ${transferencia.nome}`);
    
    // 1. Buscar employee existente
    const employeeResult = await query('SELECT id FROM employees WHERE cpf = $1', [transferencia.cpf]);
    
    if (employeeResult.rows.length === 0) {
        console.log(`   ⚠️ Employee não encontrado: ${transferencia.cpf}`);
        return;
    }
    
    const employeeId = employeeResult.rows[0].id;
    
    // 2. Buscar vínculo ATUAL atual
    const vinculoAtualResult = await query(`
        SELECT * FROM employee_vinculos 
        WHERE employee_id = $1 AND tipo_vinculo = 'ATUAL' AND status = 'ATIVO'
        ORDER BY data_inicio DESC LIMIT 1
    `, [employeeId]);
    
    if (vinculoAtualResult.rows.length === 0) {
        console.log(`   ⚠️ Vínculo ATUAL não encontrado: ${transferencia.nome}`);
        return;
    }
    
    const vinculoAtual = vinculoAtualResult.rows[0];
    
    // 3. Encerrar vínculo atual
    await query(`
        UPDATE employee_vinculos 
        SET data_fim = $1, 
            data_transferencia = $1,
            status = 'TRANSFERIDO',
            tipo_vinculo = 'PASSADO',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
    `, [transferencia.data, vinculoAtual.id]);
    
    // 4. Criar novo vínculo ATUAL
    const novoVinculoId = crypto.randomBytes(8).toString('hex');
    
    await query(`
        INSERT INTO employee_vinculos 
        (id, employee_id, employer_id, workplace_id, data_inicio, data_fim, 
         status, tipo_evento, principal, tipo_vinculo, sequencia, data_transferencia)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
        novoVinculoId, employeeId, transferencia.para.empresa, transferencia.para.unidade,
        transferencia.data, null, 'ATIVO', 'TRANSFERENCIA', 'N', 'ATUAL', 
        vinculoAtual.sequencia + 1, transferencia.data
    ]);
    
    // 5. Atualizar tabela employees
    await query(`
        UPDATE employees 
        SET employer_id = $1, workplace_id = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
    `, [transferencia.para.empresa, transferencia.para.unidade, employeeId]);
    
    // 6. Registrar transferência
    const transferId = crypto.randomBytes(8).toString('hex');
    await query(`
        INSERT INTO employee_vinculo_transfers 
        (id, employee_id, from_employer_id, from_workplace_id, to_employer_id, to_workplace_id, 
         changed_by, observation, data_transferencia)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
        transferId, employeeId, transferencia.de.empresa, transferencia.de.unidade,
        transferencia.para.empresa, transferencia.para.unidade, 'SISTEMA', 
        `Transferência: ${transferencia.de.unidade} → ${transferencia.para.unidade}`, transferencia.data
    ]);
    
    console.log(`   ✅ Transferência processada: ${transferencia.nome}`);
}

async function processarReadmissao(readmissao) {
    console.log(`   🔄 Processando readmissão: ${readmissao.nome}`);
    
    // 1. Buscar employee existente
    const employeeResult = await query('SELECT id FROM employees WHERE cpf = $1', [readmissao.cpf]);
    
    if (employeeResult.rows.length === 0) {
        console.log(`   ⚠️ Employee não encontrado: ${readmissao.cpf}`);
        return;
    }
    
    const employeeId = employeeResult.rows[0].id;
    
    // 2. Processar cada ciclo
    for (let i = 0; i < readmissao.ciclos.length; i++) {
        const ciclo = readmissao.ciclos[i];
        const sequencia = i + 1;
        
        console.log(`      📋 Ciclo ${sequencia}: ${ciclo.cargo} (${ciclo.periodo[0]} → ${ciclo.periodo[1] || 'ATUAL'})`);
        
        // 3. Criar vínculo para o ciclo
        const vinculoId = crypto.randomBytes(8).toString('hex');
        
        await query(`
            INSERT INTO employee_vinculos 
            (id, employee_id, employer_id, workplace_id, data_inicio, data_fim, 
             status, tipo_evento, principal, tipo_vinculo, sequencia)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
            vinculoId, employeeId, 'a92a33c7', 'edcfae9a',
            ciclo.periodo[0], ciclo.periodo[1],
            ciclo.periodo[1] ? 'PASSADO' : 'ATIVO',
            'ADMISSAO', sequencia === 1 ? 'S' : 'N', 
            ciclo.periodo[1] ? 'PASSADO' : 'ATUAL', sequencia
        ]);
        
        // 4. Se for o último ciclo e estiver ATIVO, atualizar employees
        if (!ciclo.periodo[1]) {
            await query(`
                UPDATE employees 
                SET employer_id = $1, workplace_id = $2, updated_at = CURRENT_TIMESTAMP
                WHERE id = $3
            `, ['a92a33c7', 'edcfae9a', employeeId]);
        }
    }
    
    console.log(`   ✅ Readmissão processada: ${readmissao.nome} (${readmissao.ciclos.length} ciclos)`);
}

async function inserirNovoColaborador(colaborador) {
    console.log(`   ➕ Inserindo colaborador: ${colaborador.nome}`);
    
    // 1. Verificar se já existe
    const existenteResult = await query('SELECT id FROM employees WHERE cpf = $1', [colaborador.cpf]);
    
    if (existenteResult.rows.length > 0) {
        console.log(`   ⚠️ Colaborador já existe: ${colaborador.cpf}`);
        return;
    }
    
    // 2. Inserir employee
    const employeeId = crypto.randomBytes(8).toString('hex');
    
    await query(`
        INSERT INTO employees 
        (id, name, cpf, birthDate, gender, role, sector, currentSalary, 
         employer_id, workplace_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
        employeeId, colaborador.nome, colaborador.cpf, colaborador.nascimento, 
        colaborador.sexo, colaborador.cargo, colaborador.setor, colaborador.salario,
        colaborador.empresa, colaborador.unidade
    ]);
    
    // 3. Criar vínculo
    const vinculoId = crypto.randomBytes(8).toString('hex');
    
    await query(`
        INSERT INTO employee_vinculos 
        (id, employee_id, employer_id, workplace_id, data_inicio, data_fim, 
         status, tipo_evento, principal, tipo_vinculo, sequencia)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
        vinculoId, employeeId, colaborador.empresa, colaborador.unidade,
        colaborador.periodo[0], colaborador.periodo[1],
        colaborador.periodo[1] ? 'PASSADO' : 'ATIVO',
        'ADMISSAO', 'S', colaborador.periodo[1] ? 'PASSADO' : 'ATUAL', 1
    ]);
    
    // 4. Inicializar benefícios VA
    await query(`
        INSERT INTO benefits_va (employee_id, status, created_at, updated_at)
        VALUES ($1, 'PENDING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [employeeId]);
    
    console.log(`   ✅ Colaborador inserido: ${colaborador.nome}`);
}

async function validarSincronizacao() {
    console.log('\n📊 4. Validando sincronização...');
    
    // Contar employees
    const employeesCount = await query('SELECT COUNT(*) as count FROM employees');
    console.log(`   📊 Total de employees: ${employeesCount.rows[0].count}`);
    
    // Contar vínculos
    const vinculosCount = await query('SELECT COUNT(*) as count FROM employee_vinculos');
    console.log(`   📊 Total de vínculos: ${vinculosCount.rows[0].count}`);
    
    // Verificar transferências
    const transfersCount = await query('SELECT COUNT(*) as count FROM employee_vinculo_transfers');
    console.log(`   📊 Total de transferências: ${transfersCount.rows[0].count}`);
    
    // Validar contagem esperada
    const esperado = 158 + 7; // 158 existentes + 7 novos/ajustes
    const atual = employeesCount.rows[0].count;
    
    if (atual === esperado) {
        console.log(`   ✅ Contagem correta: ${atual} (esperado: ${esperado})`);
    } else {
        console.log(`   ⚠️ Diferença na contagem: ${atual} (esperado: ${esperado})`);
    }
    
    return {
        employees: atual,
        esperado: esperado,
        vinculos: vinculosCount.rows[0].count,
        transfers: transfersCount.rows[0].count
    };
}

// Executar sincronização
if (require.main === module) {
    executarSincronizacao()
        .then(() => {
            console.log('\n🎉 SINCRONIZAÇÃO FINALIZADA COM SUCESSO!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ ERRO NA SINCRONIZAÇÃO:', error.message);
            process.exit(1);
        });
}

module.exports = {
    executarSincronizacao,
    processarTransferencia,
    processarReadmissao,
    inserirNovoColaborador,
    validarSincronizacao
};
