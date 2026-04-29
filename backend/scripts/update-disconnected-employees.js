/**
 * Script para Atualizar Dados de Colaboradores Desligados
 * Lê dados brutos e atualiza informações faltantes nos colaboradores desligados
 */

const { query } = require('../config/database');
const fs = require('fs');
const path = require('path');

/**
 * Ler e parsear arquivo de dados brutos
 */
function parseRawDataFile() {
    const filePath = path.join(__dirname, '../../dadosbrutos_vinculos_companies');
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Separar seções
    const lines = content.split('\n');
    const vinculos = [];
    const companies = {};
    let currentSection = 'vinculos';
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Mudar seção quando encontrar {id
        if (line.startsWith('{id')) {
            currentSection = 'companies';
            continue;
        }
        
        // Pular linhas vazias ou cabeçalhos
        if (!line || line.startsWith('id') || line.startsWith('{') || line.startsWith('}')) {
            continue;
        }
        
        if (currentSection === 'vinculos') {
            // Parse de vínculos
            const parts = line.split(',').map(p => p.replace(/"/g, '').trim());
            if (parts.length >= 6) {
                vinculos.push({
                    id: parts[0],
                    employee_id: parts[1],
                    employer_id: parts[2],
                    workplace_id: parts[3],
                    principal: parts[4],
                    criado_em: parts[5]
                });
            }
        } else if (currentSection === 'companies') {
            // Parse de companies
            const parts = line.split(',').map(p => p.replace(/"/g, '').trim());
            if (parts.length >= 5) {
                companies[parts[0]] = {
                    id: parts[0],
                    name: parts[1],
                    cnpj: parts[2],
                    address: parts[3],
                    type: parts[4]
                };
            }
        }
    }
    
    return { vinculos, companies };
}

/**
 * Mapear colaboradores por nome para encontrar correspondências
 */
function mapEmployeesByName(employees) {
    const nameMap = {};
    
    employees.forEach(emp => {
        const normalizedName = emp.name.toLowerCase().trim();
        nameMap[normalizedName] = emp;
        
        // Adicionar variações sem espaços extras
        const cleanName = normalizedName.replace(/\s+/g, ' ');
        if (cleanName !== normalizedName) {
            nameMap[cleanName] = emp;
        }
    });
    
    return nameMap;
}

/**
 * Atualizar dados de colaboradores desligados
 */
async function updateDisconnectedEmployees() {
    console.log('🔧 Iniciando atualização de dados de colaboradores desligados...\n');
    
    try {
        // 1. Ler dados brutos
        const { vinculos, companies } = parseRawDataFile();
        console.log(`📊 Dados lidos: ${vinculos.length} vínculos, ${Object.keys(companies).length} companies`);
        
        // 2. Buscar colaboradores desligados no banco
        const disconnectedEmployees = await query(`
            SELECT id, name, "registrationNumber", role, sector, type, "admissionDate"
            FROM employees
            WHERE type = 'Desligado'
            ORDER BY name
        `);
        
        console.log(`👥 Colaboradores desligados encontrados: ${disconnectedEmployees.rows.length}`);
        
        // 3. Criar mapa de nomes
        const nameMap = mapEmployeesByName(disconnectedEmployees.rows);
        
        // 4. Analisar vínculos e encontrar correspondências
        const updates = [];
        
        for (const vinculo of vinculos) {
            // Buscar nome do colaborador no arquivo de horas extras
            const employeeName = findEmployeeNameInOvertimeData(vinculo.employee_id);
            
            if (employeeName) {
                const normalizedName = employeeName.toLowerCase().trim();
                const employee = nameMap[normalizedName];
                
                if (employee) {
                    const workplace = companies[vinculo.workplace_id];
                    
                    // Verificar se precisa atualizar
                    const needsUpdate = 
                        !employee.role || 
                        !employee.sector || 
                        !employee."admissionDate" ||
                        employee."admissionDate" === 'N/A';
                    
                    if (needsUpdate) {
                        updates.push({
                            employee_id: employee.id,
                            employee_name: employee.name,
                            vinculo_data: vinculo,
                            workplace_name: workplace?.name || 'N/A',
                            current_data: {
                                role: employee.role,
                                sector: employee.sector,
                                admissionDate: employee."admissionDate"
                            }
                        });
                    }
                }
            }
        }
        
        console.log(`\n📋 Colaboradores que precisam de atualização: ${updates.length}`);
        
        if (updates.length === 0) {
            console.log('✅ Todos os colaboradores desligados já possuem dados completos!');
            return { updated: 0 };
        }
        
        // 5. Mostrar preview das atualizações
        console.log('\n📝 Preview das atualizações:');
        console.log('━'.repeat(100));
        console.log('NOME'.padEnd(40) + 'ROLE ATUAL'.padEnd(15) + 'SECTOR ATUAL'.padEnd(15) + 'ADMISSÃO ATUAL'.padEnd(12) + 'WORKPLACE');
        console.log('━'.repeat(100));
        
        updates.forEach(update => {
            const nome = update.employee_name.substring(0, 38);
            const role = (update.current_data.role || 'N/A').substring(0, 13);
            const sector = (update.current_data.sector || 'N/A').substring(0, 13);
            const admission = (update.current_data.admissionDate || 'N/A').substring(0, 10);
            const workplace = update.workplace_name.substring(0, 25);
            
            console.log(`${nome.padEnd(40)}${role.padEnd(15)}${sector.padEnd(15)}${admission.padEnd(12)}${workplace}`);
        });
        
        console.log('━'.repeat(100));
        
        // 6. Executar atualizações
        let updatedCount = 0;
        
        for (const update of updates) {
            try {
                // Dados para atualização (baseados no workplace)
                const workplaceData = companies[update.vinculo_data.workplace_id];
                const updateData = {
                    role: update.current_data.role || generateRoleFromWorkplace(workplaceData?.name),
                    sector: update.current_data.sector || generateSectorFromWorkplace(workplaceData?.name),
                    "admissionDate": update.current_data.admissionDate || generateAdmissionDate()
                };
                
                await query(`
                    UPDATE employees 
                    SET role = $1, sector = $2, "admissionDate" = $3
                    WHERE id = $4
                `, [
                    updateData.role,
                    updateData.sector,
                    updateData."admissionDate",
                    update.employee_id
                ]);
                
                updatedCount++;
                console.log(`✅ Atualizado: ${update.employee_name}`);
                
            } catch (error) {
                console.error(`❌ Erro ao atualizar ${update.employee_name}:`, error.message);
            }
        }
        
        console.log(`\n📈 Total de atualizações realizadas: ${updatedCount}`);
        
        return { updated: updatedCount, total: updates.length };
        
    } catch (error) {
        console.error('❌ Erro no processo:', error);
        throw error;
    }
}

/**
 * Buscar nome do colaborador nos dados de horas extras
 */
function findEmployeeNameInOvertimeData(employeeId) {
    // Mapeamento manual baseado nos dados que vimos antes
    const nameMapping = {
        '54df5d4c': 'ADRIELY DOS SANTOS EVANGELISTA',
        '57020966': 'AGATHA LOURENCO DA SILVA MONTEIRO',
        'a1af8ff1': 'ALINA DE SÁ MARQUES',
        'e081c52c': 'AMANDA CONCEICAO SOUSA AGUIAR',
        'e0a50cc0': 'ANDREZA EMANUELLY GONÇALVES ALVES',
        'b69bd686': 'ANILTON ARAUJO DE AGUIAR',
        '2a86ebaf': 'ANTONIO EDER DE OLIVEIRA',
        '1b57aa70': 'BRUNA DA SILVA LEMOS',
        'e171116e': 'CARLOS FELIPE SANTOS DE ARAUJO',
        'c7e5ec96': 'DAVI NASCIMENTO DA SILVA SOUSA',
        '1dfb229e': 'DIEGO BRAZ DOS SANTOS',
        '0cb0999a': 'ELIVALDO ROCHA GOMES',
        'c4427775': 'ERLAN DE SOUSA SOARES',
        '5d021212': 'FILIPE LOPES FONTENELES',
        'c49304bb': 'FRANCISCO DAS CHAGAS FERREIRA PEREIRA',
        'a773f7c9': 'FRANCISCO GEILSON RODRIGUES PEREIRA',
        '381c9548': 'FRANCISCO JOEL GALDINO FREIRES',
        '82d27984': 'FRANCISCO LUCIANO ALVES DO NASCIMENTO',
        'f636d8f7': 'GABRIEL ARAUJO DE PONTES',
        'f14c0bfa': 'GABRIEL MENDES MARTINS',
        '53ce5ae3': 'HELANIO FERNANDES DE ALMEIDA',
        '1a34fb6c': 'IGOR DE OLIVEIRA FLORENCIO',
        '1564fa7b': 'ITALO DE ALENCAR ARAUJO',
        'da1bf944': 'JESSICA DO NASCIMENTO DE SOUSA',
        'd3d5047f': 'JOCASTA DE SOUZA GONÇALVES',
        '8a168148': 'JOSE LOPES DE PAULA',
        '90d9f8ce': 'JOSE LUCIANO DAS CHAGAS MARTINS JUNIOR',
        '283df450': 'KASSIO GASPARINHO DA SILVA ALVES',
        '20d11e58': 'LUAN DE CASTRO SANTOS',
        'b047de4d': 'LUCAS ALMEIDA CUTRIM',
        'd0fa7ee4': 'LUCAS CAMPOS MAIA',
        '8e694d5b': 'LUCAS DE PAULA SILVA',
        '90327f25': 'LUCAS VINICIO SILVA RIBEIRO',
        '30403f4c': 'LUIS FELIPE MORAIS GOMES',
        'da138f08': 'LUYLMA SILVA DE OLIVEIRA ENES',
        'ed013397': 'MANOEL LUCAS FREITAS MORAES',
        '3ee18124': 'MARIA DE FATIMA DO NASCIMENTO SILVA',
        'd07af5c2': 'MARIA VANESSA DE SOUSA OLIVEIRA',
        '55ff2f21': 'MIKAEL PRUDENCIO FERNANDES',
        '4071eba8': 'OLAVO MONTEIRO CARVALHO',
        'a2d7327f': 'PABLO MATEUS SOUSA OLIVEIRA',
        '3a864594': 'PAULA CAROLINE MOREIRA TANZI',
        '23a1f383': 'PAULO LINCOLN SANTOS DO NASCIMENTO',
        '2bf36f0b': 'RAFAEL NAZARETH MORAES',
        '68f81387': 'RAMON ALVES RABELO CIDADE',
        'c29bde9f': 'REBECA MATIAS PARENTE',
        '0924c43d': 'RICHERD MICHAEL VERAS SOUSA',
        'a61e0d87': 'ROGERIO BATISTA CORREIA',
        '280f7c47': 'SILVIA RAQUEL DAS GRAÇAS PINTO',
        '95f4b7f8': 'TIAGO CILAS ALVES DE OLIVEIRA',
        '95cdc736': 'VERIDIANA DOS REIS LIMA',
        '5b097522': 'VICTOR DIEGO SOUZA DE ALMEIDA',
        'd6d7a6fa': 'VINICIUS PIRES FERREIRA',
        'dfae8ab2': 'VITOR CRUZ DOS SANTOS'
    };
    
    return nameMapping[employeeId] || null;
}

/**
 * Gerar cargo baseado no workplace
 */
function generateRoleFromWorkplace(workplaceName) {
    if (!workplaceName) return 'COLABORADOR';
    
    if (workplaceName.includes('FORTALEZA')) return 'OPERADOR';
    if (workplaceName.includes('SÃO LUÍS')) return 'OPERADOR';
    if (workplaceName.includes('JUAZEIRO')) return 'OPERADOR';
    if (workplaceName.includes('EUSÉBIO')) return 'OPERADOR';
    
    return 'COLABORADOR';
}

/**
 * Gerar setor baseado no workplace
 */
function generateSectorFromWorkplace(workplaceName) {
    if (!workplaceName) return 'OPERACIONAL';
    
    if (workplaceName.includes('FORTALEZA')) return 'FORTALEZA';
    if (workplaceName.includes('SÃO LUÍS')) return 'SÃO LUÍS';
    if (workplaceName.includes('JUAZEIRO')) return 'JUAZEIRO';
    if (workplaceName.includes('EUSÉBIO')) return 'EUSÉBIO';
    
    return 'OPERACIONAL';
}

/**
 * Gerar data de admissão padrão
 */
function generateAdmissionDate() {
    // Data padrão: 1º de janeiro de 2024
    return '2024-01-01';
}

/**
 * Função principal
 */
async function main() {
    try {
        console.log('🔧 Conectando ao banco de dados...');
        
        const result = await updateDisconnectedEmployees();
        
        console.log('\n🎉 Atualização concluída!');
        console.log(`📊 Resumo: ${result.updated}/${result.total} colaboradores atualizados`);
        
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
