/**
 * Script Simplificado para Ler Dados de Desligados
 * Lê o arquivo de forma mais robusta
 */

const { query } = require('../config/database');
const fs = require('fs');
const path = require('path');

/**
 * Ler arquivo de forma simplificada
 */
function readDisconnectedFile() {
    const filePath = path.join(__dirname, '../../dadosdosdesligados.txt');
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Dividir em blocos por linhas que começam com data
    const blocks = content.split(/\n(?=\d{2}\/\d{2}\/\d{4})/);
    
    const employees = [];
    
    blocks.forEach(block => {
        const lines = block.trim().split('\n');
        if (lines.length === 0) return;
        
        const firstLine = lines[0];
        const fullText = block.replace(/\n/g, ' ');
        
        // Extrair dados básicos da primeira linha
        const dateMatch = firstLine.match(/^(\d{2}\/\d{2}\/\d{4})\s+(\d{2}\/\d{2}\/\d{4}|)\s+(\d+|\d+\.\d+)\s+(DESLIGADO|PEDIDO DE DEMISSÃO)/);
        
        if (dateMatch) {
            const employee = {
                admissionDate: dateMatch[1],
                dismissalDate: dateMatch[2] || '',
                daysWorked: dateMatch[3],
                dismissalType: dateMatch[4],
                name: '',
                cpf: '',
                role: '',
                sector: '',
                salary: '',
                employer_id: '',
                workplace_id: ''
            };
            
            // Extrair nome (procurar padrão de nome em maiúsculas)
            const nameMatch = fullText.match(/([A-Z][A-Z\sÀ-Ú]{10,})\s+\d{11}/);
            if (nameMatch) {
                employee.name = nameMatch[1].trim();
            }
            
            // Extrair CPF
            const cpfMatch = fullText.match(/(\d{11})/);
            if (cpfMatch) {
                employee.cpf = cpfMatch[1];
            }
            
            // Extrair employer_id e workplace_id
            const employerMatch = fullText.match(/(a92a33c7|c2|edcfae9a)/);
            if (employerMatch) {
                employee.employer_id = employerMatch[1];
            }
            
            const workplaceMatch = fullText.match(/(u\d+|u\d+|edcfae9a|u\d+|u\d+)/);
            if (workplaceMatch) {
                employee.workplace_id = workplaceMatch[1];
            }
            
            // Extrair cargo
            const rolePatterns = [
                'ASSISTENTE DE PCM I',
                'MECÂNICO JÚNIOR I', 
                'ANALISTA FINANCEIRO JR',
                'AUX DE SERVIÇOS DIVERSOS',
                'CONTROLADOR JR',
                'ASSISTENTE DE TRANSPORTES I',
                'MECÂNICO JÚNIOR I',
                'ASSISTENTE DE LOGÍSTICA I',
                'ESTAGIÁRIO DE PCM',
                'AUXILIAR DE EXPEDIÇÃO',
                'MECÂNICO PLENO II'
            ];
            
            for (const pattern of rolePatterns) {
                if (fullText.includes(pattern)) {
                    employee.role = pattern;
                    break;
                }
            }
            
            // Extrair setor
            const sectorPatterns = ['Manutenção', 'Financeiro', 'Controladoria', 'Logística', 'Serviços Diversos'];
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
            
            if (employee.name) {
                employees.push(employee);
            }
        }
    });
    
    return employees;
}

/**
 * Atualizar dados dos colaboradores
 */
async function updateDisconnectedEmployees() {
    console.log('🔧 Iniciando atualização simplificada...\n');
    
    try {
        // 1. Ler arquivo
        const fileEmployees = readDisconnectedFile();
        console.log(`📊 Colaboradores encontrados no arquivo: ${fileEmployees.length}`);
        
        // 2. Buscar colaboradores desligados no banco
        const dbResult = await query(`
            SELECT id, name, "registrationNumber", role, sector, type, "admissionDate"
            FROM employees
            WHERE type = 'Desligado'
            ORDER BY name
        `);
        
        console.log(`👥 Colaboradores desligados no banco: ${dbResult.rows.length}`);
        
        // 3. Mostrar alguns exemplos do arquivo
        console.log('\n📝 Exemplos do arquivo:');
        console.log('━'.repeat(100));
        console.log('NOME'.padEnd(35) + 'ADMISSÃO'.padEnd(12) + 'DESLIGAMENTO'.padEnd(12) + 'CARGO'.padEnd(25) + 'SETOR');
        console.log('━'.repeat(100));
        
        fileEmployees.slice(0, 10).forEach(emp => {
            const name = emp.name.substring(0, 33);
            const admission = emp.admissionDate.substring(0, 10);
            const dismissal = emp.dismissalDate.substring(0, 10);
            const role = emp.role.substring(0, 23);
            const sector = emp.sector.substring(0, 15);
            
            console.log(`${name.padEnd(35)}${admission.padEnd(12)}${dismissal.padEnd(12)}${role.padEnd(25)}${sector}`);
        });
        
        console.log('━'.repeat(100));
        
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
                
                // Busca por partes do nome
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
            console.log('━'.repeat(100));
            console.log('NOME'.padEnd(35) + 'ROLE DB'.padEnd(15) + 'SECTOR DB'.padEnd(15) + 'ROLE FILE'.padEnd(20) + 'SECTOR FILE');
            console.log('━'.repeat(100));
            
            matches.slice(0, 10).forEach(match => {
                const name = match.file.name.substring(0, 33);
                const dbRole = (match.db.role || 'N/A').substring(0, 13);
                const dbSector = (match.db.sector || 'N/A').substring(0, 13);
                const fileRole = match.file.role.substring(0, 18);
                const fileSector = match.file.sector.substring(0, 13);
                
                console.log(`${name.padEnd(35)}${dbRole.padEnd(15)}${dbSector.padEnd(15)}${fileRole.padEnd(20)}${fileSector}`);
            });
            
            if (matches.length > 10) {
                console.log(`... e mais ${matches.length - 10} correspondências`);
            }
            
            console.log('━'.repeat(100));
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
                    match.db.sector === 'N/A';
                
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
        
        const result = await updateDisconnectedEmployees();
        
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
    updateDisconnectedEmployees
};
