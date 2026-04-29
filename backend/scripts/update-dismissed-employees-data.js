/**
 * Script para Atualizar Dados de Colaboradores Desligados
 * Baseado no arquivo dadosdosdesligados.txt
 */

const { query } = require('../config/database');

/**
 * Analisar e atualizar dados de colaboradores desligados
 */
async function updateDismissedEmployeesData() {
    console.log('🔧 Analisando dados de colaboradores desligados...\n');
    
    try {
        // 1. Ler o arquivo de dados brutos
        const fs = require('fs');
        const filePath = 'c:\\Users\\NL - NIT\\Desktop\\GG\\dadosdosdesligados.txt';
        
        console.log('1. Lendo arquivo de dados desligados...');
        const data = fs.readFileSync(filePath, 'utf8');
        const lines = data.split('\n').filter(line => line.trim());
        
        console.log(`   Total de linhas no arquivo: ${lines.length}`);
        
        // 2. Analisar estrutura do arquivo
        console.log('\n2. Analisando estrutura dos dados...');
        
        // Encontrar linhas que parecem ter dados de desligamento
        const dismissedLines = lines.filter(line => {
            return line.includes('DESLIGADO') || 
                   line.includes('DESLIGADA') || 
                   line.includes('PEDIDO DE DEMISSÃO');
        });
        
        console.log(`   Linhas com desligamento: ${dismissedLines.length}`);
        
        // 3. Extrair dados específicos
        console.log('\n3. Extraindo dados de desligamento...');
        
        const dismissedData = [];
        
        dismissedLines.forEach((line, index) => {
            try {
                // Tentar extrair informações da linha
                const parts = line.split(/\s+/);
                
                // Procurar por padrões de data (DD/MM/YYYY ou DD/MM/YY)
                const datePattern = /\d{2}\/\d{2}\/\d{2,4}/g;
                const dates = line.match(datePattern) || [];
                
                // Procurar por nomes (após as datas)
                const namePattern = /[A-Z][a-záàâãéêíóôõúç\s]+/g;
                const names = line.match(namePattern) || [];
                
                if (dates.length >= 2 && names.length > 0) {
                    const dismissalDate = dates[dates.length - 1]; // Última data provavelmente é o desligamento
                    const admissionDate = dates[0]; // Primeira data provavelmente é a admissão
                    
                    // Extrair nome (geralmente aparece após os dados básicos)
                    let employeeName = '';
                    for (let i = names.length - 1; i >= 0; i--) {
                        if (names[i].length > 3 && !names[i].includes('DESLIGADO')) {
                            employeeName = names[i];
                            break;
                        }
                    }
                    
                    if (employeeName) {
                        dismissedData.push({
                            name: employeeName.trim(),
                            admissionDate: normalizeDate(admissionDate),
                            dismissalDate: normalizeDate(dismissalDate),
                            rawLine: line.substring(0, 100) + '...'
                        });
                    }
                }
            } catch (error) {
                console.log(`   Erro ao processar linha ${index + 1}: ${error.message}`);
            }
        });
        
        console.log(`   Dados extraídos: ${dismissedData.length}`);
        
        // 4. Mostrar primeiros exemplos
        console.log('\n4. Primeiros exemplos extraídos:');
        dismissedData.slice(0, 5).forEach((emp, index) => {
            console.log(`   ${index + 1}. ${emp.name}`);
            console.log(`      - Admissão: ${emp.admissionDate}`);
            console.log(`      - Desligamento: ${emp.dismissalDate}`);
            console.log(`      - Linha: ${emp.rawLine}`);
            console.log('');
        });
        
        // 5. Buscar correspondências no banco
        console.log('\n5. Buscando correspondências no banco de dados...');
        
        let updatedCount = 0;
        let notFoundCount = 0;
        
        for (const dismissed of dismissedData) {
            try {
                // Buscar colaborador por nome
                const result = await query(`
                    SELECT id, name, "admissionDate", "terminationDate", type
                    FROM employees
                    WHERE UPPER(name) LIKE UPPER($1)
                    LIMIT 5
                `, [`%${dismissed.name}%`]);
                
                if (result.rows.length > 0) {
                    console.log(`   ✅ Encontrado: ${dismissed.name}`);
                    
                    // Atualizar o primeiro匹配
                    const employee = result.rows[0];
                    
                    // Verificar se já tem dados de desligamento
                    if (!employee.terminationDate && employee.type !== 'Desligado') {
                        await query(`
                            UPDATE employees
                            SET "terminationDate" = $1, type = 'Desligado'
                            WHERE id = $2
                        `, [dismissed.dismissalDate, employee.id]);
                        
                        console.log(`      - Atualizado: ${employee.name} → ${dismissed.dismissalDate}`);
                        updatedCount++;
                    } else {
                        console.log(`      - Já possui dados: ${employee.terminationDate || employee.type}`);
                    }
                } else {
                    console.log(`   ❌ Não encontrado: ${dismissed.name}`);
                    notFoundCount++;
                }
            } catch (error) {
                console.log(`   Erro ao processar ${dismissed.name}: ${error.message}`);
            }
        }
        
        // 6. Resumo final
        console.log('\n6. Resumo da atualização:');
        console.log(`   - Total processados: ${dismissedData.length}`);
        console.log(`   - Atualizados com sucesso: ${updatedCount}`);
        console.log(`   - Não encontrados: ${notFoundCount}`);
        console.log(`   - Taxa de sucesso: ${((updatedCount / dismissedData.length) * 100).toFixed(1)}%`);
        
        // 7. Verificar impacto na contagem
        console.log('\n7. Verificando impacto na contagem de Janeiro 2026 - Fortaleza:');
        
        const testResult = await query(`
            SELECT COUNT(DISTINCT e.id) as count
            FROM employees e
            LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = '1'
            LEFT JOIN companies c ON ev.workplace_id = c.id
            WHERE c.name = $1
              AND (e."admissionDate" <= $2 OR e."admissionDate" IS NULL)
              AND (e.type IS NULL OR e.type != 'Desligado' OR 
                   e."terminationDate" IS NULL OR 
                   e."terminationDate" = '' OR 
                   e."terminationDate" > $2)
        `, ['NORDESTE LOCACOES - FORTALEZA', '2026-01-31']);
        
        console.log(`   - Nova contagem: ${testResult.rows[0].count}`);
        console.log(`   - Esperado: 63`);
        console.log(`   - Diferença: ${testResult.rows[0].count - 63}`);
        
        if (testResult.rows[0].count === 63) {
            console.log('   ✅ PERFEITO! Contagem corresponde ao esperado!');
        }
        
    } catch (error) {
        console.error('❌ Erro no processo:', error);
    }
}

/**
 * Normalizar data para formato YYYY-MM-DD
 */
function normalizeDate(dateStr) {
    if (!dateStr) return null;
    
    // Remover caracteres extras
    const cleanDate = dateStr.replace(/[^\d\/]/g, '');
    
    // Separar dia, mês, ano
    const parts = cleanDate.split('/');
    if (parts.length !== 3) return dateStr;
    
    let [day, month, year] = parts;
    
    // Ajustar ano (2 dígitos para 4)
    if (year.length === 2) {
        const yearNum = parseInt(year);
        year = yearNum >= 50 ? '19' + year : '20' + year;
    }
    
    // Formatar como YYYY-MM-DD
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

/**
 * Função principal
 */
async function main() {
    try {
        console.log('🔧 Conectando ao banco de dados...');
        await updateDismissedEmployeesData();
        console.log('\n🎉 Atualização concluída!');
    } catch (error) {
        console.error('❌ Erro no processo:', error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = {
    updateDismissedEmployeesData
};
