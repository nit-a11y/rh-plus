/**
 * Script para Ler Dados de Desligados - Versão Corrigida
 * Lê o arquivo com o formato correto que foi identificado
 */

const { query } = require('../config/database');
const fs = require('fs');
const path = require('path');

/**
 * Ler arquivo de dados dos desligados - versão corrigida
 */
function readFixedDisconnectedFile() {
    const filePath = path.join(__dirname, '../../dadosdosdesligados.txt');
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Dividir por linhas e processar
    const lines = content.split('\n');
    const employees = [];
    
    let i = 0;
    while (i < lines.length) {
        const line = lines[i].trim();
        
        // Procurar linhas que começam com data de admissão (formato DD/MM/AAAA)
        if (line.match(/^\d{2}\/\d{2}\/\d{4}/)) {
            const employee = parseEmployeeBlock(lines, i);
            if (employee && employee.name) {
                employees.push(employee);
            }
            i = employee.nextIndex || i + 1;
        } else {
            i++;
        }
    }
    
    return employees;
}

/**
 * Processar um bloco de dados de um colaborador
 */
function parseEmployeeBlock(lines, startIndex) {
    let employee = {
        admissionDate: '',
        dismissalDate: '',
        daysWorked: '',
        dismissalType: '',
        dismissalReason: '',
        employer_id: '',
        workplace_id: '',
        name: '',
        cpf: '',
        gender: '',
        birthDate: '',
        age: '',
        role: '',
        salary: '',
        sector: '',
        manager: '',
        lastASO: '',
        admissionProcess: '',
        dismissalProcess: '',
        companyTime: '',
        observation: ''
    };
    
    let i = startIndex;
    let fullText = '';
    
    // Processar a primeira linha (com data de admissão)
    const firstLine = lines[i];
    const parts = firstLine.split(/\s+/);
    
    if (parts.length >= 4) {
        employee.admissionDate = parts[0];
        employee.dismissalDate = parts[1] || '';
        employee.daysWorked = parts[2];
        employee.dismissalType = parts[3] || '';
    }
    
    // Acumular texto completo do bloco
    while (i < lines.length) {
        const currentLine = lines[i].trim();
        
        // Parar se encontrar outra data de admissão
        if (i > startIndex && currentLine.match(/^\d{2}\/\d{2}\/\d{4}/)) {
            break;
        }
        
        fullText += ' ' + currentLine;
        i++;
    }
    
    employee.nextIndex = i;
    
    // Extrair employer_id e workplace_id
    const employerMatch = fullText.match(/\b(a92a33c7|c2|edcfae9a)\b/);
    if (employerMatch) {
        employee.employer_id = employerMatch[1];
    }
    
    const workplaceMatch = fullText.match(/\b(u\d+|edcfae9a)\b/);
    if (workplaceMatch) {
        employee.workplace_id = workplaceMatch[1];
    }
    
    // Extrair CPF
    const cpfMatch = fullText.match(/\b(\d{11})\b/);
    if (cpfMatch) {
        employee.cpf = cpfMatch[1];
    }
    
    // Extrair gênero
    const genderMatch = fullText.match(/\b(Feminino|Masculino)\b/);
    if (genderMatch) {
        employee.gender = genderMatch[1];
    }
    
    // Extrair data de nascimento
    const birthMatches = fullText.match(/\b(\d{2}\/\d{2}\/\d{4})\b/g);
    if (birthMatches) {
        // A primeira data que não é de admissão/desligamento é a de nascimento
        for (const date of birthMatches) {
            if (date !== employee.admissionDate && date !== employee.dismissalDate) {
                employee.birthDate = date;
                break;
            }
        }
    }
    
    // Extrair idade
    const ageMatch = fullText.match(/\b(\d{1,2})\s+(ANO|ANOS)\b/i);
    if (ageMatch) {
        employee.age = ageMatch[1];
    }
    
    // Extrair nome (procurar nome em maiúsculas antes do CPF)
    const nameMatch = fullText.match(/([A-Z][A-Z\sÀ-Ú]{8,})\s+\d{11}/);
    if (nameMatch) {
        employee.name = nameMatch[1].trim();
    }
    
    // Extrair cargo
    const rolePatterns = [
        'ANALISTA DP PLENO',
        'ASSISTENTE DE PCM I',
        'ASSISTENTE COMERCIAL I',
        'ESTAGIÁRIA DE MARKETING',
        'MECÂNICO SENIOR II',
        'MECÂNICO JÚNIOR I',
        'ANALISTA FINANCEIRO JR',
        'AUX DE SERVIÇOS DIVERSOS',
        'CONTROLADOR JR',
        'ASSISTENTE DE TRANSPORTES I',
        'ASSISTENTE DE LOGÍSTICA I',
        'ESTAGIÁRIO DE PCM',
        'AUXILIAR DE EXPEDIÇÃO',
        'MECÂNICO PLENO II',
        'ANALISTA FINANCEIRO JR',
        'CONTROLADOR JR',
        'ASSISTENTE DE TRANSPORTES I',
        'ASSISTENTE DE LOGÍSTICA I'
    ];
    
    for (const pattern of rolePatterns) {
        if (fullText.includes(pattern)) {
            employee.role = pattern;
            break;
        }
    }
    
    // Extrair setor
    const sectorPatterns = [
        'Administrativo',
        'Manutenção',
        'Comercial',
        'Marketing',
        'Financeiro',
        'Controladoria',
        'Logística',
        'Serviços Diversos'
    ];
    
    for (const pattern of sectorPatterns) {
        if (fullText.includes(pattern)) {
            employee.sector = pattern;
            break;
        }
    }
    
    // Extrair salário
    const salaryMatch = fullText.match(/R\$\s*[\d\.,]+/);
    if (salaryMatch) {
        employee.salary = salaryMatch[0];
    }
    
    // Extrair gerente
    const managerMatch = fullText.match(/\b(Rafael|Ricardo)\b/);
    if (managerMatch) {
        employee.manager = managerMatch[1];
    }
    
    // Extrair motivo do desligamento
    const reasonPatterns = [
        'DESLIGADA POR INSUBORDINAÇÃO',
        'FINAL DO CONTRATO DE EXPERIÊNCIA',
        'DESLIGADO BAIXA PRODUTIVIDADE',
        'DESLIGADO ALINHAMENTO',
        'DESLIGADO A PEDIDO',
        'DESLIGADO',
        'PEDIDO DE DEMISSÃO'
    ];
    
    for (const pattern of reasonPatterns) {
        if (fullText.includes(pattern)) {
            employee.dismissalReason = pattern;
            break;
        }
    }
    
    return employee;
}

/**
 * Encontrar correspondências e atualizar dados
 */
async function processDisconnectedEmployees() {
    console.log('🔧 Processando dados de colaboradores desligados...\n');
    
    try {
        // 1. Ler arquivo
        const fileEmployees = readFixedDisconnectedFile();
        console.log(`📊 Colaboradores encontrados no arquivo: ${fileEmployees.length}`);
        
        // 2. Buscar colaboradores desligados no banco
        const dbResult = await query(`
            SELECT id, name, "registrationNumber", role, sector, type, "admissionDate"
            FROM employees
            WHERE type = 'Desligado'
            ORDER BY name
        `);
        
        console.log(`👥 Colaboradores desligados no banco: ${dbResult.rows.length}`);
        
        // 3. Mostrar exemplos do arquivo
        if (fileEmployees.length > 0) {
            console.log('\n📝 Exemplos do arquivo:');
            console.log('━'.repeat(120));
            console.log('NOME'.padEnd(35) + 'ADMISSÃO'.padEnd(12) + 'DESLIGAMENTO'.padEnd(12) + 'CARGO'.padEnd(25) + 'SETOR'.padEnd(15) + 'WORKPLACE');
            console.log('━'.repeat(120));
            
            fileEmployees.slice(0, 10).forEach(emp => {
                const name = emp.name.substring(0, 33);
                const admission = emp.admissionDate.substring(0, 10);
                const dismissal = emp.dismissalDate.substring(0, 10);
                const role = emp.role.substring(0, 23);
                const sector = emp.sector.substring(0, 13);
                const workplace = emp.workplace_id.substring(0, 13);
                
                console.log(`${name.padEnd(35)}${admission.padEnd(12)}${dismissal.padEnd(12)}${role.padEnd(25)}${sector.padEnd(15)}${workplace}`);
            });
            
            console.log('━'.repeat(120));
        }
        
        // 4. Encontrar correspondências
        const matches = [];
        const dbEmployees = dbResult.rows;
        
        fileEmployees.forEach(fileEmp => {
            const normalizedFileName = fileEmp.name.toLowerCase().trim();
            
            for (const dbEmp of dbEmployees) {
                const normalizedDbName = dbEmp.name.toLowerCase().trim();
                
                // Busca exata
                if (normalizedFileName === normalizedDbName) {
                    matches.push({ file: fileEmp, db: dbEmp });
                    break;
                }
                
                // Busca por similaridade
                const fileParts = normalizedFileName.split(' ');
                const dbParts = normalizedDbName.split(' ');
                
                if (fileParts[0] === dbParts[0] && fileParts.length > 1 && dbParts.length > 1) {
                    matches.push({ file: fileEmp, db: dbEmp });
                    break;
                }
            }
        });
        
        console.log(`\n✅ Correspondências encontradas: ${matches.length}`);
        
        // 5. Mostrar preview das correspondências
        if (matches.length > 0) {
            console.log('\n📝 Correspondências encontradas:');
            console.log('━'.repeat(120));
            console.log('NOME'.padEnd(35) + 'ROLE DB'.padEnd(15) + 'SECTOR DB'.padEnd(15) + 'ROLE FILE'.padEnd(20) + 'SECTOR FILE'.padEnd(15) + 'ADMISSÃO FILE');
            console.log('━'.repeat(120));
            
            matches.slice(0, 10).forEach(match => {
                const name = match.file.name.substring(0, 33);
                const dbRole = (match.db.role || 'N/A').substring(0, 13);
                const dbSector = (match.db.sector || 'N/A').substring(0, 13);
                const fileRole = match.file.role.substring(0, 18);
                const fileSector = match.file.sector.substring(0, 13);
                const fileAdmission = match.file.admissionDate.substring(0, 10);
                
                console.log(`${name.padEnd(35)}${dbRole.padEnd(15)}${dbSector.padEnd(15)}${fileRole.padEnd(20)}${fileSector.padEnd(15)}${fileAdmission}`);
            });
            
            if (matches.length > 10) {
                console.log(`... e mais ${matches.length - 10} correspondências`);
            }
            
            console.log('━'.repeat(120));
        }
        
        // 6. Executar atualizações
        let updatedCount = 0;
        
        for (const match of matches) {
            try {
                const needsUpdate = 
                    !match.db.role || 
                    !match.db.sector || 
                    !match.db.admissionDate ||
                    match.db.role === 'N/A' ||
                    match.db.sector === 'N/A' ||
                    match.db.admissionDate === 'N/A';
                
                if (needsUpdate) {
                    const updateData = {
                        role: match.file.role || match.db.role || 'COLABORADOR',
                        sector: match.file.sector || match.db.sector || 'OPERACIONAL',
                        admissionDate: match.file.admissionDate || match.db.admissionDate || '2024-01-01'
                    };
                    
                    await query(`
                        UPDATE employees 
                        SET role = $1, sector = $2, "admissionDate" = $3
                        WHERE id = $4
                    `, [
                        updateData.role,
                        updateData.sector,
                        updateData.admissionDate,
                        match.db.id
                    ]);
                    
                    updatedCount++;
                    console.log(`✅ Atualizado: ${match.file.name}`);
                }
                
            } catch (error) {
                console.error(`❌ Erro ao atualizar ${match.file.name}:`, error.message);
            }
        }
        
        console.log(`\n📈 Total de atualizações realizadas: ${updatedCount}`);
        
        return { 
            total: fileEmployees.length,
            matched: matches.length, 
            updated: updatedCount 
        };
        
    } catch (error) {
        console.error('❌ Erro no processo:', error);
        throw error;
    }
}

/**
 * Função principal
 */
async function main() {
    try {
        console.log('🔧 Conectando ao banco de dados...');
        
        const result = await processDisconnectedEmployees();
        
        console.log('\n🎉 Processo concluído!');
        console.log('\n📊 Resumo:');
        console.log(`   - Total no arquivo: ${result.total}`);
        console.log(`   - Correspondências: ${result.matched}`);
        console.log(`   - Atualizados: ${result.updated}`);
        
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
    processDisconnectedEmployees
};
