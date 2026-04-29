/**
 * Script para atualizar tabela employee_vinculos com base na planilha
 * Processo: Limpar tabela existente e inserir novos dados da planilha
 */

const xlsx = require('xlsx');
const { query, transaction } = require('./config/database');
const path = require('path');

async function updateEmployeeVinculos() {
    try {
        console.log('=== INICIANDO ATUALIZAÇÃO DA TABELA employee_vinculos ===\n');

        // 1. Ler planilha
        console.log('1. Lendo planilha employees_vinculos.xlsx...');
        const workbook = xlsx.readFile(path.join(__dirname, 'employees_vinculos.xlsx'));
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const dadosPlanilha = xlsx.utils.sheet_to_json(worksheet);
        
        console.log(`   Encontrados ${dadosPlanilha.length} registros na planilha`);
        console.log('   Estrutura:', Object.keys(dadosPlanilha[0] || {}));
        console.log('');

        // 2. Validar estrutura
        console.log('2. Validando estrutura dos dados...');
        const colunasEsperadas = ['employee_id', 'employer_id', 'workplace_id'];
        const colunasPlanilha = Object.keys(dadosPlanilha[0] || {});
        
        const colunasFaltantes = colunasEsperadas.filter(col => !colunasPlanilha.includes(col));
        if (colunasFaltantes.length > 0) {
            throw new Error(`Colunas faltantes na planilha: ${colunasFaltantes.join(', ')}`);
        }
        
        console.log('   Estrutura validada com sucesso');
        console.log('');

        // 3. Limpar tabela existente
        console.log('3. Limpando tabela employee_vinculos...');
        await query('DELETE FROM employee_vinculos');
        console.log('   Tabela limpa com sucesso');
        console.log('');

        // 4. Inserir novos dados em lote
        console.log('4. Inserindo novos registros...');
        
        const resultado = await transaction(async (client) => {
            const insertSQL = `
                INSERT INTO employee_vinculos (id, employee_id, employer_id, workplace_id, principal, criado_em)
                VALUES ($1, $2, $3, $4, $5, $6)
            `;
            
            const dataAtual = new Date().toISOString();
            let registrosInseridos = 0;
            
            // Processar em lotes de 50 para melhor performance
            const loteSize = 50;
            for (let i = 0; i < dadosPlanilha.length; i += loteSize) {
                const lote = dadosPlanilha.slice(i, i + loteSize);
                
                for (const registro of lote) {
                    const id = `vinc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    const values = [
                        id,
                        registro.employee_id,
                        registro.employer_id,
                        registro.workplace_id,
                        'S', // Vínculo principal por padrão
                        dataAtual
                    ];
                    
                    await client.query(insertSQL, values);
                    registrosInseridos++;
                }
                
                console.log(`   Lote ${Math.floor(i/loteSize) + 1}/${Math.ceil(dadosPlanilha.length/loteSize)} processado (${registrosInseridos} registros)`);
            }
            
            return registrosInseridos;
        });

        console.log(`   Total de registros inseridos: ${resultado}`);
        console.log('');

        // 5. Verificação final
        console.log('5. Verificando dados inseridos...');
        const countResult = await query('SELECT COUNT(*) as total FROM employee_vinculos');
        const sampleResult = await query('SELECT * FROM employee_vinculos LIMIT 3');
        
        console.log(`   Total de registros na tabela: ${countResult.rows[0].total}`);
        console.log('   Amostra dos dados inseridos:');
        sampleResult.rows.forEach((row, index) => {
            console.log(`   ${index + 1}. ID: ${row.id}, Employee: ${row.employee_id}, Employer: ${row.employer_id}, Workplace: ${row.workplace_id}`);
        });
        console.log('');

        console.log('=== ATUALIZAÇÃO CONCLUÍDA COM SUCESSO ===');
        console.log(`Resumo:`);
        console.log(`- Registros lidos da planilha: ${dadosPlanilha.length}`);
        console.log(`- Registros inseridos na tabela: ${resultado}`);
        console.log(`- Data/Hora da atualização: ${new Date().toLocaleString('pt-BR')}`);

    } catch (error) {
        console.error('ERRO DURANTE ATUALIZAÇÃO:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Executar script
if (require.main === module) {
    updateEmployeeVinculos()
        .then(() => {
            console.log('\nScript executado com sucesso!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\nFalha na execução do script:', error.message);
            process.exit(1);
        });
}

module.exports = { updateEmployeeVinculos };
