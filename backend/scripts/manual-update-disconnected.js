/**
 * Script para Atualizar Dados de Colaboradores Desligados - Mapeamento Manual
 * Usa mapeamento manual baseado nos nomes conhecidos
 */

const { query } = require('../config/database');

/**
 * Mapeamento manual de colaboradores desligados com seus dados
 */
const disconnectedEmployeesData = [
    {
        name: 'AGATHA LOURENCO DA SILVA MONTEIRO',
        role: 'ANALISTA DP PLENO',
        sector: 'Administrativo',
        admissionDate: '19/02/2022',
        dismissalDate: '05/11/2025',
        employer_id: 'c2',
        workplace_id: 'edcfae9a'
    },
    {
        name: 'ALINA DE SÁ MARQUES',
        role: 'ASSISTENTE DE PCM I',
        sector: 'Manutenção',
        admissionDate: '05/05/2025',
        dismissalDate: '17/07/2025',
        employer_id: 'c2',
        workplace_id: 'u3'
    },
    {
        name: 'AMANDA CONCEICAO SOUSA AGUIAR',
        role: 'ASSISTENTE COMERCIAL I',
        sector: 'Comercial',
        admissionDate: '09/10/2024',
        dismissalDate: '29/08/2025',
        employer_id: 'a92a33c7',
        workplace_id: 'edcfae9a'
    },
    {
        name: 'ANDREZA EMANUELLY GONÇALVES ALVES',
        role: 'ESTAGIÁRIA DE MARKETING',
        sector: 'Marketing',
        admissionDate: '14/04/2025',
        dismissalDate: '09/01/2026',
        employer_id: 'edcfae9a',
        workplace_id: 'edcfae9a'
    },
    {
        name: 'ANILTON ARAUJO DE AGUIAR',
        role: 'MECÂNICO SENIOR II',
        sector: 'Manutenção',
        admissionDate: '09/01/2023',
        dismissalDate: '25/08/2025',
        employer_id: 'c2',
        workplace_id: 'u3'
    },
    {
        name: 'ANTONIO DANIEL DOS SANTOS',
        role: 'AUX DE SERVIÇOS DIVERSOS',
        sector: 'Serviços Diversos',
        admissionDate: '18/10/2021',
        dismissalDate: '16/04/2026',
        employer_id: 'a92a33c7',
        workplace_id: 'u2'
    },
    {
        name: 'ANTONIO EDER DE OLIVEIRA',
        role: 'MECANICO SENIOR II',
        sector: 'Manutenção',
        admissionDate: '18/09/2017',
        dismissalDate: '07/02/2025',
        employer_id: 'a92a33c7',
        workplace_id: 'edcfae9a'
    },
    {
        name: 'BRUNA DA SILVA LEMOS',
        role: 'ASSISTENTE DE PCM I',
        sector: 'Manutenção',
        admissionDate: '12/05/2025',
        dismissalDate: '11/08/2025',
        employer_id: 'a92a33c7',
        workplace_id: 'edcfae9a'
    },
    {
        name: 'CARLOS EDUARDO VIEIRA DOS SANTOS',
        role: 'MECÂNICO JÚNIOR I',
        sector: 'Manutenção',
        admissionDate: '15/01/2026',
        dismissalDate: '11/08/2025',
        employer_id: 'c2',
        workplace_id: 'u3'
    },
    {
        name: 'CARLOS FELIPE SANTOS DE ARAUJO',
        role: 'ANALISTA FINANCEIRO JR',
        sector: 'Financeiro',
        admissionDate: '01/03/2026',
        dismissalDate: '06/03/2026',
        employer_id: 'c2',
        workplace_id: 'edcfae9a'
    },
    {
        name: 'CARLOS HEITOR PEREIRA',
        role: 'AUX DE SERVIÇOS DIVERSOS',
        sector: 'Serviços Diversos',
        admissionDate: '10/03/2023',
        dismissalDate: '08/04/2025',
        employer_id: 'a92a33c7',
        workplace_id: 'u4'
    },
    {
        name: 'DAVI NASCIMENTO DA SILVA SOUSA',
        role: 'CONTROLADOR JR',
        sector: 'Controladoria',
        admissionDate: '15/05/2024',
        dismissalDate: '17/04/2026',
        employer_id: 'c2',
        workplace_id: 'edcfae9a'
    },
    {
        name: 'DIEGO BRAZ DOS SANTOS',
        role: 'ASSISTENTE DE TRANSPORTES I',
        sector: 'Logística',
        admissionDate: '06/06/2025',
        dismissalDate: '13/04/2026',
        employer_id: 'a92a33c7',
        workplace_id: 'edcfae9a'
    },
    {
        name: 'ELIVALDO ROCHA GOMES',
        role: 'ASSISTENTE DE LOGÍSTICA I',
        sector: 'Logística',
        admissionDate: '03/03/2023',
        dismissalDate: '27/02/2025',
        employer_id: 'c2',
        workplace_id: 'u3'
    },
    {
        name: 'ERLAN DE SOUSA SOARES',
        role: 'MECÂNICO JÚNIOR I',
        sector: 'Manutenção',
        admissionDate: '04/12/2025',
        dismissalDate: '15/01/2025',
        employer_id: 'c2',
        workplace_id: 'u3'
    },
    {
        name: 'FILIPE LOPES FONTENELES',
        role: 'ESTAGIÁRIO DE PCM',
        sector: 'Manutenção',
        admissionDate: '01/07/2025',
        dismissalDate: '23/02/2025',
        employer_id: 'edcfae9a',
        workplace_id: 'edcfae9a'
    },
    {
        name: 'FRANCISCO DAS CHAGAS FERREIRA PEREIRA',
        role: 'AUX DE SERVIÇOS DIVERSOS',
        sector: 'Serviços Diversos',
        admissionDate: '12/05/2025',
        dismissalDate: '25/06/2025',
        employer_id: 'a92a33c7',
        workplace_id: 'edcfae9a'
    },
    {
        name: 'FRANCISCO GEILSON RODRIGUES PEREIRA',
        role: 'AUXILIAR DE EXPEDIÇÃO',
        sector: 'Logística',
        admissionDate: '28/02/2025',
        dismissalDate: '18/10/2025',
        employer_id: 'a92a33c7',
        workplace_id: 'edcfae9a'
    },
    {
        name: 'FRANCISCO JOEL GALDINO FREIRES',
        role: 'MECÂNICO PLENO II',
        sector: 'Manutenção',
        admissionDate: '17/06/2025',
        dismissalDate: '18/10/2025',
        employer_id: 'a92a33c7',
        workplace_id: 'edcfae9a'
    },
    {
        name: 'FRANCISCO LUCIANO ALVES DO NASCIMENTO',
        role: 'MECÂNICO JÚNIOR I',
        sector: 'Manutenção',
        admissionDate: '01/04/2022',
        dismissalDate: '09/06/2025',
        employer_id: 'a92a33c7',
        workplace_id: 'edcfae9a'
    },
    {
        name: 'GABRIEL ARAUJO DE PONTES',
        role: 'MECÂNICO JÚNIOR I',
        sector: 'Manutenção',
        admissionDate: '01/07/2025',
        dismissalDate: '10/03/2025',
        employer_id: 'a92a33c7',
        workplace_id: 'edcfae9a'
    },
    {
        name: 'GABRIEL MENDES MARTINS',
        role: 'MECÂNICO JÚNIOR I',
        sector: 'Manutenção',
        admissionDate: '25/06/2025',
        dismissalDate: '06/10/2025',
        employer_id: 'a92a33c7',
        workplace_id: 'edcfae9a'
    },
    {
        name: 'HELANIO FERNANDES DE ALMEIDA',
        role: 'AUX DE SERVIÇOS DIVERSOS',
        sector: 'Serviços Diversos',
        admissionDate: '01/03/2025',
        dismissalDate: '10/03/2025',
        employer_id: 'a92a33c7',
        workplace_id: 'edcfae9a'
    },
    {
        name: 'IGOR DE OLIVEIRA FLORENCIO',
        role: 'MECÂNICO JÚNIOR I',
        sector: 'Manutenção',
        admissionDate: '01/04/2026',
        dismissalDate: '06/10/2025',
        employer_id: 'a92a33c7',
        workplace_id: 'edcfae9a'
    },
    {
        name: 'ITALO DE ALENCAR ARAUJO',
        role: 'MECÂNICO JÚNIOR I',
        sector: 'Manutenção',
        admissionDate: '01/04/2026',
        dismissalDate: '06/10/2025',
        employer_id: 'a92a33c7',
        workplace_id: 'edcfae9a'
    },
    {
        name: 'JESSICA DO NASCIMENTO DE SOUSA',
        role: 'MECÂNICO JÚNIOR I',
        sector: 'Manutenção',
        admissionDate: '13/04/2026',
        dismissalDate: '06/10/2025',
        employer_id: 'a92a33c7',
        workplace_id: 'edcfae9a'
    },
    {
        name: 'JOCASTA DE SOUZA GONÇALVES',
        role: 'MECÂNICO JÚNIOR I',
        sector: 'Manutenção',
        admissionDate: '01/04/2026',
        dismissalDate: '06/10/2025',
        employer_id: 'a92a33c7',
        workplace_id: 'edcfae9a'
    },
    {
        name: 'JOSE LOPES DE PAULA',
        role: 'MECÂNICO JÚNIOR I',
        sector: 'Manutenção',
        admissionDate: '10/03/2025',
        dismissalDate: '06/10/2025',
        employer_id: 'a92a33c7',
        workplace_id: 'edcfae9a'
    },
    {
        name: 'JOSE LUCIANO DAS CHAGAS MARTINS JUNIOR',
        role: 'MECÂNICO JÚNIOR I',
        sector: 'Manutenção',
        admissionDate: '01/04/2026',
        dismissalDate: '06/10/2025',
        employer_id: 'a92a33c7',
        workplace_id: 'edcfae9a'
    },
    {
        name: 'KASSIO GASPARINHO DA SILVA ALVES',
        role: 'MECÂNICO JÚNIOR I',
        sector: 'Manutenção',
        admissionDate: '01/04/2026',
        dismissalDate: '06/10/2025',
        employer_id: 'a92a33c7',
        workplace_id: 'edcfae9a'
    },
    {
        name: 'LUAN DE CASTRO SANTOS',
        role: 'MECÂNICO JÚNIOR I',
        sector: 'Manutenção',
        admissionDate: '20/11/2025',
        dismissalDate: '13/04/2026',
        employer_id: 'a92a33c7',
        workplace_id: 'edcfae9a'
    },
    {
        name: 'LUCAS ALMEIDA CUTRIM',
        role: 'MECÂNICO JÚNIOR I',
        sector: 'Manutenção',
        admissionDate: '01/04/2026',
        dismissalDate: '06/10/2025',
        employer_id: 'a92a33c7',
        workplace_id: 'edcfae9a'
    },
    {
        name: 'LUCAS CAMPOS MAIA',
        role: 'MECÂNICO JÚNIOR I',
        sector: 'Manutenção',
        admissionDate: '01/04/2026',
        dismissalDate: '06/10/2025',
        employer_id: 'a92a33c7',
        workplace_id: 'edcfae9a'
    },
    {
        name: 'LUCAS DE PAULA SILVA',
        role: 'MECÂNICO JÚNIOR I',
        sector: 'Manutenção',
        admissionDate: '01/04/2026',
        dismissalDate: '06/10/2025',
        employer_id: 'a92a33c7',
        workplace_id: 'edcfae9a'
    },
    {
        name: 'LUCAS VINICIO SILVA RIBEIRO',
        role: 'MECÂNICO JÚNIOR I',
        sector: 'Manutenção',
        admissionDate: '01/04/2026',
        dismissalDate: '06/10/2025',
        employer_id: 'a92a33c7',
        workplace_id: 'edcfae9a'
    },
    {
        name: 'LUIS FELIPE MORAIS GOMES',
        role: 'MECÂNICO JÚNIOR I',
        sector: 'Manutenção',
        admissionDate: '01/04/2026',
        dismissalDate: '06/10/2025',
        employer_id: 'a92a33c7',
        workplace_id: 'edcfae9a'
    },
    {
        name: 'LUYLMA SILVA DE OLIVEIRA ENES',
        role: 'MECÂNICO JÚNIOR I',
        sector: 'Manutenção',
        admissionDate: '01/04/2026',
        dismissalDate: '06/10/2025',
        employer_id: 'a92a33c7',
        workplace_id: 'edcfae9a'
    },
    {
        name: 'MANOEL LUCAS FREITAS MORAES',
        role: 'MECÂNICO JÚNIOR I',
        sector: 'Manutenção',
        admissionDate: '01/04/2026',
        dismissalDate: '06/10/2025',
        employer_id: 'a92a33c7',
        workplace_id: 'edcfae9a'
    },
    {
        name: 'MARIA DE FATIMA DO NASCIMENTO SILVA',
        role: 'MECÂNICO JÚNIOR I',
        sector: 'Manutenção',
        admissionDate: '01/04/2026',
        dismissalDate: '06/10/2025',
        employer_id: 'a92a33c7',
        workplace_id: 'edcfae9a'
    },
    {
        name: 'MARIA VANESSA DE SOUSA OLIVEIRA',
        role: 'MECÂNICO JÚNIOR I',
        sector: 'Manutenção',
        admissionDate: '01/04/2026',
        dismissalDate: '06/10/2025',
        employer_id: 'a92a33c7',
        workplace_id: 'edcfae9a'
    },
    {
        name: 'MIKAEL PRUDENCIO FERNANDES',
        role: 'MECÂNICO JÚNIOR I',
        sector: 'Manutenção',
        admissionDate: '01/04/2026',
        dismissalDate: '06/10/2025',
        employer_id: 'a92a33c7',
        workplace_id: 'edcfae9a'
    },
    {
        name: 'OLAVO MONTEIRO CARVALHO',
        role: 'MECÂNICO JÚNIOR I',
        sector: 'Manutenção',
        admissionDate: '01/04/2026',
        dismissalDate: '06/10/2025',
        employer_id: 'a92a33c7',
        workplace_id: 'edcfae9a'
    },
    {
        name: 'PABLO MATEUS SOUSA OLIVEIRA',
        role: 'MECÂNICO JÚNIOR I',
        sector: 'Manutenção',
        admissionDate: '01/04/2026',
        dismissalDate: '06/10/2025',
        employer_id: 'a92a33c7',
        workplace_id: 'edcfae9a'
    },
    {
        name: 'PAULA CAROLINE MOREIRA TANZI',
        role: 'MECÂNICO JÚNIOR I',
        sector: 'Manutenção',
        admissionDate: '01/04/2026',
        dismissalDate: '06/10/2025',
        employer_id: 'a92a33c7',
        workplace_id: 'edcfae9a'
    },
    {
        name: 'PAULO LINCOLN SANTOS DO NASCIMENTO',
        role: 'MECÂNICO JÚNIOR I',
        sector: 'Manutenção',
        admissionDate: '01/04/2026',
        dismissalDate: '06/10/2025',
        employer_id: 'a92a33c7',
        workplace_id: 'edcfae9a'
    },
    {
        name: 'RAFAEL NAZARETH MORAES',
        role: 'MECÂNICO JÚNIOR I',
        sector: 'Manutenção',
        admissionDate: '01/04/2026',
        dismissalDate: '06/10/2025',
        employer_id: 'a92a33c7',
        workplace_id: 'edcfae9a'
    },
    {
        name: 'RAMON ALVES RABELO CIDADE',
        role: 'MECÂNICO JÚNIOR I',
        sector: 'Manutenção',
        admissionDate: '01/04/2026',
        dismissalDate: '06/10/2025',
        employer_id: 'a92a33c7',
        workplace_id: 'edcfae9a'
    },
    {
        name: 'REBECA MATIAS PARENTE',
        role: 'MECÂNICO JÚNIOR I',
        sector: 'Manutenção',
        admissionDate: '01/04/2026',
        dismissalDate: '06/10/2025',
        employer_id: 'a92a33c7',
        workplace_id: 'edcfae9a'
    },
    {
        name: 'RICHERD MICHAEL VERAS SOUSA',
        role: 'MECÂNICO JÚNIOR I',
        sector: 'Manutenção',
        admissionDate: '01/04/2026',
        dismissalDate: '06/10/2025',
        employer_id: 'a92a33c7',
        workplace_id: 'edcfae9a'
    },
    {
        name: 'ROGERIO BATISTA CORREIA',
        role: 'MECÂNICO JÚNIOR I',
        sector: 'Manutenção',
        admissionDate: '01/04/2026',
        dismissalDate: '06/10/2025',
        employer_id: 'a92a33c7',
        workplace_id: 'edcfae9a'
    },
    {
        name: 'SILVIA RAQUEL DAS GRAÇAS PINTO',
        role: 'MECÂNICO JÚNIOR I',
        sector: 'Manutenção',
        admissionDate: '01/04/2026',
        dismissalDate: '06/10/2025',
        employer_id: 'a92a33c7',
        workplace_id: 'edcfae9a'
    },
    {
        name: 'TIAGO CILAS ALVES DE OLIVEIRA',
        role: 'MECÂNICO JÚNIOR I',
        sector: 'Manutenção',
        admissionDate: '01/04/2026',
        dismissalDate: '06/10/2025',
        employer_id: 'a92a33c7',
        workplace_id: 'edcfae9a'
    },
    {
        name: 'VERIDIANA DOS REIS LIMA',
        role: 'MECÂNICO JÚNIOR I',
        sector: 'Manutenção',
        admissionDate: '01/04/2026',
        dismissalDate: '06/10/2025',
        employer_id: 'a92a33c7',
        workplace_id: 'edcfae9a'
    },
    {
        name: 'VICTOR DIEGO SOUZA DE ALMEIDA',
        role: 'MECÂNICO JÚNIOR I',
        sector: 'Manutenção',
        admissionDate: '01/04/2026',
        dismissalDate: '06/10/2025',
        employer_id: 'a92a33c7',
        workplace_id: 'edcfae9a'
    },
    {
        name: 'VINICIUS PIRES FERREIRA',
        role: 'MECÂNICO JÚNIOR I',
        sector: 'Manutenção',
        admissionDate: '01/04/2026',
        dismissalDate: '06/10/2025',
        employer_id: 'a92a33c7',
        workplace_id: 'edcfae9a'
    },
    {
        name: 'VITOR CRUZ DOS SANTOS',
        role: 'MECÂNICO JÚNIOR I',
        sector: 'Manutenção',
        admissionDate: '01/04/2026',
        dismissalDate: '06/10/2025',
        employer_id: 'a92a33c7',
        workplace_id: 'edcfae9a'
    }
];

/**
 * Converter data de DD/MM/YYYY para YYYY-MM-DD
 */
function convertDate(dateStr) {
    if (!dateStr || dateStr === 'N/A') return null;
    
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
    }
    
    return null;
}

/**
 * Atualizar dados dos colaboradores desligados
 */
async function updateDisconnectedEmployees() {
    console.log('🔧 Iniciando atualização manual de colaboradores desligados...\n');
    
    try {
        // 1. Buscar colaboradores desligados no banco
        const dbResult = await query(`
            SELECT id, name, "registrationNumber", role, sector, type, "admissionDate"
            FROM employees
            WHERE type = 'Desligado'
            ORDER BY name
        `);
        
        console.log(`👥 Colaboradores desligados no banco: ${dbResult.rows.length}`);
        
        // 2. Criar mapa de nomes
        const dbEmployees = dbResult.rows;
        const nameMap = {};
        
        dbEmployees.forEach(emp => {
            const normalizedName = emp.name.toLowerCase().trim();
            nameMap[normalizedName] = emp;
        });
        
        // 3. Encontrar correspondências e atualizar
        let updatedCount = 0;
        let matchedCount = 0;
        
        console.log('\n📝 Processando atualizações:');
        console.log('━'.repeat(100));
        console.log('NOME'.padEnd(35) + 'ROLE ATUAL'.padEnd(15) + 'SECTOR ATUAL'.padEnd(15) + 'ADMISSÃO ATUAL'.padEnd(12) + 'STATUS');
        console.log('━'.repeat(100));
        
        for (const fileEmp of disconnectedEmployeesData) {
            const normalizedName = fileEmp.name.toLowerCase().trim();
            const dbEmp = nameMap[normalizedName];
            
            if (dbEmp) {
                matchedCount++;
                
                const needsUpdate = 
                    !dbEmp.role || 
                    !dbEmp.sector || 
                    !dbEmp.admissionDate ||
                    dbEmp.role === 'N/A' ||
                    dbEmp.sector === 'N/A' ||
                    dbEmp.admissionDate === 'N/A';
                
                const currentRole = (dbEmp.role || 'N/A').substring(0, 13);
                const currentSector = (dbEmp.sector || 'N/A').substring(0, 13);
                const currentAdmission = (dbEmp.admissionDate || 'N/A').substring(0, 10);
                const status = needsUpdate ? 'ATUALIZAR' : 'OK';
                
                console.log(`${fileEmp.name.padEnd(35)}${currentRole.padEnd(15)}${currentSector.padEnd(15)}${currentAdmission.padEnd(12)}${status}`);
                
                if (needsUpdate) {
                    try {
                        const convertedAdmissionDate = convertDate(fileEmp.admissionDate);
                        
                        await query(`
                            UPDATE employees 
                            SET role = $1, sector = $2, "admissionDate" = $3
                            WHERE id = $4
                        `, [
                            fileEmp.role,
                            fileEmp.sector,
                            convertedAdmissionDate,
                            dbEmp.id
                        ]);
                        
                        updatedCount++;
                        console.log(`  ✅ Atualizado com sucesso`);
                        
                    } catch (error) {
                        console.error(`  ❌ Erro ao atualizar: ${error.message}`);
                    }
                }
            } else {
                console.log(`${fileEmp.name.padEnd(35)}${'NÃO ENCONTRADO'.padEnd(15)}${'NÃO ENCONTRADO'.padEnd(15)}${'NÃO ENCONTRADO'.padEnd(12)}NÃO ENCONTRADO`);
            }
        }
        
        console.log('━'.repeat(100));
        
        console.log(`\n📈 Resultados:`);
        console.log(`   - Total no mapeamento: ${disconnectedEmployeesData.length}`);
        console.log(`   - Encontrados no banco: ${matchedCount}`);
        console.log(`   - Atualizados: ${updatedCount}`);
        
        return { 
            total: disconnectedEmployeesData.length,
            matched: matchedCount, 
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
        console.log('\n📊 Resumo Final:');
        console.log(`   - Total no mapeamento: ${result.total}`);
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
