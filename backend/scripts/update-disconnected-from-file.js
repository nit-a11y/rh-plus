/**
 * Script para Atualizar Dados de Colaboradores Desligados
 * Lê o arquivo dadosdosdesligados.txt e atualiza informações no banco
 */

const { query } = require('../config/database');
const fs = require('fs');
const path = require('path');

/**
 * Ler e parsear arquivo de dados dos desligados
 */
function parseDisconnectedFile() {
    const filePath = path.join(__dirname, '../../dadosdosdesligados.txt');
    const content = fs.readFileSync(filePath, 'utf8');
    
    const lines = content.split('\n').filter(line => line.trim());
    const employees = [];
    
    let currentEmployee = {};
    let lineIndex = 0;
    
    while (lineIndex < lines.length) {
        const line = lines[lineIndex].trim();
        
        // Verificar se é uma linha de dados (começa com data)
        if (line.match(/^\d{2}\/\d{2}\/\d{4}/)) {
            // Parse da linha principal
            const parts = line.split(/\s+/);
            
            if (parts.length >= 10) {
                currentEmployee = {
                    admissionDate: parts[0],
                    dismissalDate: parts[1] || '',
                    type: parts[2] || '',
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
                    dismissalProcessDate: '',
                    dismissalProcessType: ''
                };
                
                // Encontrar o motivo do desligamento
                let reasonStart = 3;
                if (parts[3] === 'DESLIGADO') {
                    currentEmployee.dismissalReason = 'DESLIGADO';
                    reasonStart = 4;
                } else if (parts.slice(3, 6).join(' ') === 'PEDIDO DE DEMISSÃO') {
                    currentEmployee.dismissalReason = 'PEDIDO DE DEMISSÃO';
                    reasonStart = 6;
                }
                
                // Continuar parseando nas próximas linhas se necessário
                let nextLineIndex = lineIndex + 1;
                let continuationLine = '';
                
                while (nextLineIndex < lines.length && !lines[nextLineIndex].match(/^\d{2}\/\d{2}\/\d{4}/)) {
                    continuationLine += ' ' + lines[nextLineIndex].trim();
                    nextLineIndex++;
                }
                
                const fullLine = line + continuationLine;
                const allParts = fullLine.split(/\s+/);
                
                // Extrair informações específicas
                for (let i = reasonStart; i < allParts.length; i++) {
                    const part = allParts[i];
                    
                    // Employer ID (geralmente começa com 'a' ou 'c' seguido de números e letras)
                    if (part.match(/^[ac]\d+[a-z]*$/i)) {
                        currentEmployee.employer_id = part;
                    }
                    // Workplace ID (geralmente 'u' seguido de número ou 'edcfae9a')
                    else if (part.match(/^u\d+$|^edcfae9a$/)) {
                        currentEmployee.workplace_id = part;
                    }
                    // CPF (11 dígitos)
                    else if (part.match(/^\d{11}$/)) {
                        currentEmployee.cpf = part;
                    }
                    // Gênero
                    else if (part === 'Feminino' || part === 'Masculino') {
                        currentEmployee.gender = part;
                    }
                    // Data de nascimento
                    else if (part.match(/^\d{2}\/\d{2}\/\d{4}$/) && !currentEmployee.birthDate) {
                        currentEmployee.birthDate = part;
                    }
                    // Idade (geralmente número seguido de cargo)
                    else if (part.match(/^\d{1,2}$/) && i + 1 < allParts.length && !allParts[i + 1].match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                        currentEmployee.age = part;
                    }
                    // Salário (começa com R$)
                    else if (part.startsWith('R$')) {
                        let salaryStr = part;
                        let j = i + 1;
                        while (j < allParts.length && !allParts[j].match(/^[A-Z]/)) {
                            salaryStr += ' ' + allParts[j];
                            j++;
                        }
                        currentEmployee.salary = salaryStr;
                        i = j - 1;
                    }
                }
                
                // Extrair nome (geralmente está entre workplace_id e CPF)
                const nameMatch = fullLine.match(/([A-Z][A-Z\sÀ-Ú]+)\s+\d{11}/);
                if (nameMatch) {
                    currentEmployee.name = nameMatch[1].trim();
                }
                
                // Extrair setor e gerente
                const sectorMatch = fullLine.match(/(Manutenção|Financeiro|Logística|Controladoria|Serviços Diversos)/i);
                if (sectorMatch) {
                    currentEmployee.sector = sectorMatch[1];
                }
                
                const managerMatch = fullLine.match(/\b(Rafael|Ricardo)\b/i);
                if (managerMatch) {
                    currentEmployee.manager = managerMatch[1];
                }
                
                employees.push(currentEmployee);
                lineIndex = nextLineIndex;
            } else {
                lineIndex++;
            }
        } else {
            lineIndex++;
        }
    }
    
    return employees;
}

/**
 * Mapear colaboradores do banco por nome
 */
async function mapEmployeesByName() {
    const result = await query(`
        SELECT id, name, "registrationNumber", role, sector, type, "admissionDate"
        FROM employees
        WHERE type = 'Desligado'
        ORDER BY name
    `);
    
    const nameMap = {};
    result.rows.forEach(emp => {
        const normalizedName = emp.name.toLowerCase().trim();
        nameMap[normalizedName] = emp;
        
        // Adicionar variações
        const cleanName = normalizedName.replace(/\s+/g, ' ');
        if (cleanName !== normalizedName) {
            nameMap[cleanName] = emp;
        }
    });
    
    return { employees: result.rows, nameMap };
}

/**
 * Encontrar correspondência de nomes
 */
function findNameMatch(fileEmployeeName, dbEmployees) {
    const normalizedName = fileEmployeeName.toLowerCase().trim();
    
    // Busca exata
    for (const dbEmp of dbEmployees) {
        const dbName = dbEmp.name.toLowerCase().trim();
        if (dbName === normalizedName) {
            return dbEmp;
        }
    }
    
    // Busca por similaridade
    for (const dbEmp of dbEmployees) {
        const dbName = dbEmp.name.toLowerCase().trim();
        if (dbName.includes(normalizedName.split(' ')[0]) || 
            normalizedName.includes(dbName.split(' ')[0])) {
            return dbEmp;
        }
    }
    
    return null;
}

/**
 * Atualizar dados dos colaboradores desligados
 */
async function updateDisconnectedEmployees() {
    console.log('🔧 Iniciando atualização de dados de colaboradores desligados...\n');
    
    try {
        // 1. Ler arquivo de dados
        const fileEmployees = parseDisconnectedFile();
        console.log(`📊 Colaboradores no arquivo: ${fileEmployees.length}`);
        
        // 2. Buscar colaboradores no banco
        const { employees: dbEmployees, nameMap } = await mapEmployeesByName();
        console.log(`👥 Colaboradores desligados no banco: ${dbEmployees.length}`);
        
        // 3. Encontrar correspondências
        const matches = [];
        const unmatched = [];
        
        fileEmployees.forEach(fileEmp => {
            const match = findNameMatch(fileEmp.name, dbEmployees);
            if (match) {
                matches.push({
                    file: fileEmp,
                    db: match
                });
            } else {
                unmatched.push(fileEmp);
            }
        });
        
        console.log(`✅ Correspondências encontradas: ${matches.length}`);
        console.log(`❌ Sem correspondência: ${unmatched.length}`);
        
        // 4. Mostrar preview das atualizações
        console.log('\n📝 Preview das atualizações:');
        console.log('━'.repeat(120));
        console.log('NOME DO ARQUIVO'.padEnd(40) + 'NOME NO BANCO'.padEnd(40) + 'ROLE ATUAL'.padEnd(15) + 'SECTOR ATUAL');
        console.log('━'.repeat(120));
        
        matches.slice(0, 10).forEach(match => {
            const fileName = match.file.name.substring(0, 38);
            const dbName = match.db.name.substring(0, 38);
            const role = (match.db.role || 'N/A').substring(0, 13);
            const sector = (match.db.sector || 'N/A').substring(0, 13);
            
            console.log(`${fileName.padEnd(40)}${dbName.padEnd(40)}${role.padEnd(15)}${sector}`);
        });
        
        if (matches.length > 10) {
            console.log(`... e mais ${matches.length - 10} correspondências`);
        }
        
        console.log('━'.repeat(120));
        
        // 5. Executar atualizações
        let updatedCount = 0;
        
        for (const match of matches) {
            try {
                const needsUpdate = 
                    !match.db.role || 
                    !match.db.sector || 
                    !match.db.admissionDate ||
                    match.db.admissionDate === 'N/A';
                
                if (needsUpdate) {
                    const updateData = {
                        role: match.db.role || match.file.role || 'COLABORADOR',
                        sector: match.db.sector || match.file.sector || 'OPERACIONAL',
                        admissionDate: match.db.admissionDate || match.file.admissionDate || '2024-01-01'
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
        
        // 6. Mostrar não correspondidos
        if (unmatched.length > 0) {
            console.log('\n⚠️ Colaboradores sem correspondência no banco:');
            console.log('━'.repeat(80));
            console.log('NOME'.padEnd(50) + 'ADMISSÃO'.padEnd(12) + 'DESLIGAMENTO');
            console.log('━'.repeat(80));
            
            unmatched.slice(0, 10).forEach(emp => {
                const name = emp.name.substring(0, 48);
                const admission = emp.admissionDate.substring(0, 10);
                const dismissal = emp.dismissalDate.substring(0, 10);
                
                console.log(`${name.padEnd(50)}${admission.padEnd(12)}${dismissal}`);
            });
            
            if (unmatched.length > 10) {
                console.log(`... e mais ${unmatched.length - 10} sem correspondência`);
            }
            
            console.log('━'.repeat(80));
        }
        
        return { 
            updated: updatedCount, 
            matched: matches.length, 
            unmatched: unmatched.length,
            total: fileEmployees.length 
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
        
        const result = await updateDisconnectedEmployees();
        
        console.log('\n🎉 Atualização concluída!');
        console.log('\n📊 Resumo:');
        console.log(`   - Total no arquivo: ${result.total}`);
        console.log(`   - Correspondências: ${result.matched}`);
        console.log(`   - Sem correspondência: ${result.unmatched}`);
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
    updateDisconnectedEmployees
};
