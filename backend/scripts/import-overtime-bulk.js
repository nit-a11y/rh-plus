/**
 * Script de Importação em Massa de Horas Extras
 * Processa dados textuais e mapeia colaboradores usando algoritmo de similaridade
 */

const { query } = require('../config/database');
const stringSimilarity = require('string-similarity');

// Carregar dados reais do arquivo
const fs = require('fs');
const path = require('path');

const realDataPath = path.join(__dirname, '../../dadoshorasextrabrutos.txt');
const realData = fs.readFileSync(realDataPath, 'utf8');

// Mapeamento de meses abreviados para nomes completos
const monthMap = {
    'jan': 'JANEIRO',
    'fev': 'FEVEREIRO', 
    'mar': 'MARCO',
    'abr': 'ABRIL',
    'mai': 'MAIO',
    'jun': 'JUNHO',
    'jul': 'JULHO',
    'ago': 'AGOSTO',
    'set': 'SETEMBRO',
    'out': 'OUTUBRO',
    'nov': 'NOVEMBRO',
    'dez': 'DEZEMBRO'
};

/**
 * Converte mês abreviado para formato completo
 */
function convertMonth(monthStr) {
    const parts = monthStr.split('/');
    if (parts.length !== 2) return monthStr.toUpperCase();
    
    const monthAbbr = parts[0].toLowerCase();
    let year = parts[1];
    
    // Converter ano de 2 dígitos para 4 dígitos
    if (year.length === 2) {
        // Assumir anos 2000-2099 para 00-99
        year = '20' + year;
    }
    
    const fullMonth = monthMap[monthAbbr] || monthAbbr.toUpperCase();
    
    return `${fullMonth} ${year}`;
}

/**
 * Normaliza valor monetário para número
 */
function parseMonetaryValue(valueStr) {
    if (!valueStr || valueStr.trim() === '') return null;
    
    const clean = valueStr
        .replace(/R\$\s*/gi, '')
        .replace(/\./g, '')      // Remove pontos de milhar
        .replace(',', '.');       // Troca vírgula por ponto decimal
    
    const num = parseFloat(clean);
    return isNaN(num) ? null : num;
}

/**
 * Normaliza tempo para formato HH:MM
 */
function normalizeTime(timeStr) {
    if (!timeStr || timeStr.trim() === '') return null;
    
    const clean = timeStr.trim();
    
    // Se já tem segundos, remove os segundos
    if (clean.match(/^\d{2}:\d{2}:\d{2}$/)) return clean.substring(0, 5);
    
    // Se tem apenas HH:MM
    if (clean.match(/^\d{2}:\d{2}$/)) return clean;
    
    // Formato inválido
    return null;
}

/**
 * Busca colaborador por nome com algoritmo de similaridade
 */
async function findEmployeeByName(name) {
    if (!name || name.trim() === '') return null;
    
    const searchName = name.trim().toUpperCase();
    
    try {
        // Primeiro: busca exata
        const exactResult = await query(
            `SELECT e.id, e.name, e.type, wp.name as workplace_name, ev.workplace_id
             FROM employees e 
             LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = 'S'
             LEFT JOIN companies wp ON ev.workplace_id = wp.id 
             WHERE UPPER(e.name) = $1`,
            [searchName]
        );
        
        if (exactResult.rows.length > 0) {
            return {
                ...exactResult.rows[0],
                match_type: 'exato',
                similarity: 1.0
            };
        }
        
        // Segundo: busca ILIKE
        const likeResult = await query(
            `SELECT e.id, e.name, e.type, wp.name as workplace_name, ev.workplace_id
             FROM employees e 
             LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = 'S'
             LEFT JOIN companies wp ON ev.workplace_id = wp.id 
             WHERE UPPER(e.name) ILIKE $1`,
            [`%${searchName}%`]
        );
        
        if (likeResult.rows.length > 0) {
            return {
                ...likeResult.rows[0],
                match_type: 'like',
                similarity: 0.9
            };
        }
        
        // Terceiro: busca por similaridade
        const allEmployees = await query(
            `SELECT e.id, e.name, e.type, wp.name as workplace_name, ev.workplace_id
             FROM employees e 
             LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = 'S'
             LEFT JOIN companies wp ON ev.workplace_id = wp.id`
        );
        
        const names = allEmployees.rows.map(emp => emp.name);
        const matches = stringSimilarity.findBestMatch(searchName, names);
        
        if (matches.bestMatch.rating >= 0.8) {
            const bestEmployee = allEmployees.rows.find(emp => emp.name === matches.bestMatch.target);
            return {
                ...bestEmployee,
                match_type: 'similaridade',
                similarity: matches.bestMatch.rating
            };
        }
        
        return null;
        
    } catch (error) {
        console.error('Erro ao buscar colaborador:', error);
        return null;
    }
}

/**
 * Processa linha de dados textuais
 */
async function processLine(line, lineNumber) {
    const columns = line.split('\t');
    
    if (columns.length < 5) {
        return {
            linha_original: line,
            numero_linha: lineNumber,
            status: 'erro',
            erro: 'Formato de linha inválido (menos de 5 colunas)',
            dados: null
        };
    }
    
    const [mesRaw, unidadeRaw, nomeRaw, extraRaw, valorRaw] = columns;
    
    // Processar campos
    const mes = convertMonth(mesRaw);
    const nome = nomeRaw.trim();
    const extra = normalizeTime(extraRaw);
    const valor = parseMonetaryValue(valorRaw);
    
    // Buscar colaborador
    const employee = await findEmployeeByName(nome);
    
    if (!employee) {
        return {
            linha_original: line,
            numero_linha: lineNumber,
            status: 'erro',
            erro: 'Colaborador não encontrado',
            dados: {
                mes,
                unidade: unidadeRaw.trim() || null,
                nome,
                extra,
                valor,
                employee_id: null,
                workplace_name: null
            }
        };
    }
    
    return {
        linha_original: line,
        numero_linha: lineNumber,
        status: 'sucesso',
        dados: {
            mes,
            unidade: employee.workplace_name || (unidadeRaw.trim() || null),
            nome: employee.name,
            extra,
            valor,
            employee_id: employee.id,
            workplace_name: employee.workplace_name,
            employee_type: employee.type,
            match_type: employee.match_type,
            similarity: employee.similarity
        }
    };
}

/**
 * Função principal de processamento
 */
async function processOvertimeImport(textData) {
    console.log('🚀 Iniciando processamento de importação de horas extras...\n');
    
    const lines = textData.split('\n').filter(line => line.trim() !== '');
    const headerLine = lines[0];
    const dataLines = lines.slice(1);
    
    console.log(`📊 Total de linhas: ${lines.length}`);
    console.log(`📋 Cabeçalho: ${headerLine}`);
    console.log(`📝 Linhas de dados: ${dataLines.length}\n`);
    
    const results = [];
    let processedCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < dataLines.length; i++) {
        const lineNumber = i + 2; // +2 porque linha 1 é header e começa do 2
        const line = dataLines[i];
        
        console.log(`⏳ Processando linha ${lineNumber}: ${line.substring(0, 50)}...`);
        
        const result = await processLine(line, lineNumber);
        results.push(result);
        
        if (result.status === 'sucesso') {
            processedCount++;
            console.log(`✅ Linha ${lineNumber}: ${result.dados.nome} -> ${result.dados.employee_id}`);
        } else {
            errorCount++;
            console.log(`❌ Linha ${lineNumber}: ${result.erro}`);
        }
    }
    
    // Estatísticas finais
    const successRate = ((processedCount / dataLines.length) * 100).toFixed(1);
    
    const finalResult = {
        estatisticas: {
            total_registros: dataLines.length,
            processados: processedCount,
            erros: errorCount,
            taxa_sucesso: `${successRate}%`
        },
        dados: results
    };
    
    console.log('\n📈 ESTATÍSTICAS FINAIS:');
    console.log(`📊 Total de registros: ${finalResult.estatisticas.total_registros}`);
    console.log(`✅ Processados com sucesso: ${finalResult.estatisticas.processados}`);
    console.log(`❌ Erros: ${finalResult.estatisticas.erros}`);
    console.log(`📈 Taxa de sucesso: ${finalResult.estatisticas.taxa_sucesso}`);
    
    return finalResult;
}

/**
 * Inserir registros processados na tabela overtime_records
 */
async function insertOvertimeRecords(processedData) {
    console.log('\n💾 Iniciando inserção em massa na tabela overtime_records...');
    
    const crypto = require('crypto');
    const generateId = () => crypto.randomBytes(4).toString('hex');
    
    const successRecords = processedData.dados.filter(record => record.status === 'sucesso');
    const recordsWithHours = successRecords.filter(record => record.dados.extra && record.dados.valor);
    
    console.log(`📊 Total de registros válidos: ${recordsWithHours.length}`);
    
    if (recordsWithHours.length === 0) {
        console.log('⚠️ Nenhum registro com horas extras para inserir');
        return { inserted: 0, errors: 0 };
    }
    
    let insertedCount = 0;
    let errorCount = 0;
    
    for (const record of recordsWithHours) {
        try {
            const id = generateId();
            const data = record.dados;
            
            await query(`
                INSERT INTO overtime_records (id, employee_id, mes, unidade, nome, extra, valor, workplace_id, created_by)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [
                id,
                data.employee_id,
                data.mes,
                data.unidade,
                data.nome,
                data.extra,
                data.valor,
                data.workplace_id,
                'Sistema'
            ]);
            
            insertedCount++;
            console.log(`✅ Inserido: ${data.nome} - ${data.extra} - R$ ${data.valor}`);
            
        } catch (error) {
            errorCount++;
            console.error(`❌ Erro ao inserir ${record.dados.nome}:`, error.message);
        }
    }
    
    console.log(`\n📈 RESULTADO DA INSERÇÃO:`);
    console.log(`✅ Inseridos: ${insertedCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    
    return { inserted: insertedCount, errors: errorCount };
}

/**
 * Executar o processamento com dados reais
 */
async function main() {
    try {
        console.log('🔧 Conectando ao banco de dados...');
        console.log(`📁 Carregando dados reais de: ${realDataPath}`);
        
        // Verificar tamanho do arquivo
        const lines = realData.split('\n').filter(line => line.trim() !== '');
        console.log(`📊 Total de linhas no arquivo: ${lines.length}`);
        console.log(`📝 Linhas de dados: ${lines.length - 1} (excluindo cabeçalho)`);
        
        const resultado = await processOvertimeImport(realData);
        
        console.log('\n📄 GERANDO JSON DE SAÍDA...');
        
        // Salvar em arquivo
        const outputPath = path.join(__dirname, 'import-overtime-real-result.json');
        fs.writeFileSync(outputPath, JSON.stringify(resultado, null, 2));
        
        console.log(`💾 Arquivo salvo: ${outputPath}`);
        
        // Inserir dados na tabela
        const insertResult = await insertOvertimeRecords(resultado);
        
        console.log('\n🎉 MIGRAÇÃO EM MASSA CONCLUÍDA!');
        console.log(`📈 Resumo final:`);
        console.log(`   - Registros processados: ${resultado.estatisticas.processados}`);
        console.log(`   - Registros inseridos: ${insertResult.inserted}`);
        console.log(`   - Taxa de sucesso: ${resultado.estatisticas.taxa_sucesso}`);
        
    } catch (error) {
        console.error('❌ Erro no processamento:', error);
    } finally {
        process.exit(0);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = {
    processOvertimeImport,
    findEmployeeByName,
    convertMonth,
    parseMonetaryValue,
    normalizeTime
};
