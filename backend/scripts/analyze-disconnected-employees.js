/**
 * Script para Analisar Colaboradores Desligados
 * Identifica colaboradores desligados e seus dados para atualização
 */

const { query } = require('../config/database');
const fs = require('fs');
const path = require('path');

/**
 * Analisar dados brutos de vínculos para encontrar colaboradores desligados
 */
async function analyzeDisconnectedEmployees() {
    console.log('🔍 Analisando dados brutos de vínculos para encontrar colaboradores desligados...\n');
    
    try {
        // 1. Ler arquivo de dados brutos
        const filePath = path.join(__dirname, '../../dadosbrutos_vinculos_companies');
        const fileContent = fs.readFileSync(filePath, 'utf8');
        
        // Separar seções de vínculos e companies
        const sections = fileContent.split('\n\n');
        const vinculosSection = sections[0];
        const companiesSection = sections[1] || sections[sections.length - 1];
        
        // 2. Parse dos vínculos
        const vinculosLines = vinculosSection.split('\n').filter(line => line.trim());
        const vinculos = [];
        
        for (let i = 1; i < vinculosLines.length; i++) {
            const line = vinculosLines[i].trim();
            if (line && !line.startsWith('{')) {
                const parts = line.split(',').map(p => p.replace(/"/g, ''));
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
            }
        }
        
        console.log(`📊 Total de vínculos no arquivo: ${vinculos.length}`);
        
        // 3. Parse das companies
        const companiesLines = companiesSection.split('\n').filter(line => line.trim());
        const companies = {};
        
        for (let i = 1; i < companiesLines.length; i++) {
            const line = companiesLines[i].trim();
            if (line && !line.startsWith('}')) {
                const parts = line.split(',').map(p => p.replace(/"/g, ''));
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
        
        console.log(`📋 Total de companies no arquivo: ${Object.keys(companies).length}`);
        
        // 4. Buscar colaboradores no banco atual
        const dbEmployees = await query(`
            SELECT id, name, "registrationNumber", role, sector, type, "admissionDate"
            FROM employees
            ORDER BY name
        `);
        
        console.log(`👥 Total de colaboradores no banco: ${dbEmployees.rows.length}`);
        
        // 5. Identificar colaboradores desligados (type = 'Desligado')
        const disconnectedEmployees = dbEmployees.rows.filter(emp => emp.type === 'Desligado');
        console.log(`❌ Colaboradores desligados no banco: ${disconnectedEmployees.length}`);
        
        // 6. Mapear employee_ids dos vínculos para nomes
        const employeeMap = {};
        dbEmployees.rows.forEach(emp => {
            employeeMap[emp.id] = emp.name;
        });
        
        // 7. Analisar vínculos de colaboradores desligados
        console.log('\n🔍 Analisando vínculos de colaboradores desligados:');
        console.log('━'.repeat(100));
        
        const disconnectedWithVinculos = [];
        
        for (const vinculo of vinculos) {
            const employeeName = employeeMap[vinculo.employee_id];
            const workplace = companies[vinculo.workplace_id];
            
            const employee = dbEmployees.rows.find(emp => emp.id === vinculo.employee_id);
            
            if (employee && employee.type === 'Desligado') {
                disconnectedWithVinculos.push({
                    ...vinculo,
                    employee_name: employeeName,
                    employee_data: employee,
                    workplace_name: workplace?.name || 'N/A',
                    workplace_data: workplace
                });
            }
        }
        
        // 8. Exibir resultados
        console.log(`\n📋 Colaboradores desligados com vínculos encontrados: ${disconnectedWithVinculos.length}`);
        console.log('━'.repeat(120));
        console.log('NOME'.padEnd(45) + 'EMPLOYEE_ID'.padEnd(15) + 'WORKPLACE'.padEnd(35) + 'ADMISSÃO'.padEnd(12) + 'VÍNCULO');
        console.log('━'.repeat(120));
        
        disconnectedWithVinculos.forEach(item => {
            const nome = (item.employee_name || 'N/A').substring(0, 43);
            const empId = (item.employee_id || 'N/A').substring(0, 13);
            const workplace = (item.workplace_name || 'N/A').substring(0, 33);
            const admission = (item.employee_data?.admissionDate || 'N/A').substring(0, 10);
            const vinculo = (item.principal || 'N/A').substring(0, 7);
            
            console.log(`${nome.padEnd(45)}${empId.padEnd(15)}${workplace.padEnd(35)}${admission.padEnd(12)}${vinculo}`);
        });
        
        console.log('━'.repeat(120));
        
        // 9. Identificar colaboradores desligados sem vínculo
        const disconnectedWithoutVinculos = disconnectedEmployees.filter(emp => {
            return !vinculos.some(v => v.employee_id === emp.id);
        });
        
        console.log(`\n⚠️ Colaboradores desligados SEM vínculos: ${disconnectedWithoutVinculos.length}`);
        if (disconnectedWithoutVinculos.length > 0) {
            console.log('━'.repeat(80));
            console.log('NOME'.padEnd(45) + 'EMPLOYEE_ID'.padEnd(15) + 'ADMISSÃO');
            console.log('━'.repeat(80));
            
            disconnectedWithoutVinculos.forEach(emp => {
                const nome = (emp.name || 'N/A').substring(0, 43);
                const empId = (emp.id || 'N/A').substring(0, 13);
                const admission = (emp.admissionDate || 'N/A').substring(0, 10);
                
                console.log(`${nome.padEnd(45)}${empId.padEnd(15)}${admission}`);
            });
            console.log('━'.repeat(80));
        }
        
        // 10. Salvar resultado em JSON
        const result = {
            summary: {
                total_vinculos: vinculos.length,
                total_companies: Object.keys(companies).length,
                total_employees: dbEmployees.rows.length,
                disconnected_employees: disconnectedEmployees.length,
                disconnected_with_vinculos: disconnectedWithVinculos.length,
                disconnected_without_vinculos: disconnectedWithoutVinculos.length
            },
            disconnected_with_vinculos: disconnectedWithVinculos,
            disconnected_without_vinculos: disconnectedWithoutVinculos,
            companies: companies,
            all_vinculos: vinculos
        };
        
        const outputPath = path.join(__dirname, '../../disconnected-employees-analysis.json');
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
        
        console.log(`\n📁 Resultado salvo em: disconnected-employees-analysis.json`);
        
        return result;
        
    } catch (error) {
        console.error('❌ Erro na análise:', error);
        throw error;
    }
}

/**
 * Função principal
 */
async function main() {
    try {
        console.log('🔧 Conectando ao banco de dados...');
        
        const result = await analyzeDisconnectedEmployees();
        
        console.log('\n🎉 Análise concluída!');
        console.log('\n📊 Resumo:');
        console.log(`   - Colaboradores desligados com vínculos: ${result.summary.disconnected_with_vinculos}`);
        console.log(`   - Colaboradores desligados sem vínculos: ${result.summary.disconnected_without_vinculos}`);
        console.log(`   - Total de colaboradores desligados: ${result.summary.disconnected_employees}`);
        
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
    analyzeDisconnectedEmployees
};
