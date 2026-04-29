#!/usr/bin/env node
/**
 * Validação Pós-Atualização da Tabela Employees
 * Verificação de integridade e campos sensíveis preservados
 * RH+ Sistema - Nordeste Locações
 */

const { query } = require('../config/database');
const fs = require('fs').promises;
const path = require('path');

class EmployeeValidator {
    constructor() {
        this.resultados = {
            integridade: {},
            campos_sensiveis: {},
            dados_atualizados: {},
            erros: [],
            warnings: []
        };
    }

    async validarIntegridade() {
        console.log('=== VALIDANDO INTEGRIDADE DOS DADOS ===');
        
        try {
            // 1. Verificar total de registros
            const countResult = await query('SELECT COUNT(*) as total FROM employees');
            const totalRegistros = parseInt(countResult.rows[0].total);
            
            console.log(`Total de registros: ${totalRegistros}`);
            
            // 2. Verificar duplicatas de ID
            const duplicateResult = await query(`
                SELECT id, COUNT(*) as count 
                FROM employees 
                GROUP BY id 
                HAVING COUNT(*) > 1
            `);
            
            const duplicatas = duplicateResult.rows;
            if (duplicatas.length > 0) {
                this.resultados.erros.push(`Encontradas ${duplicatas.length} duplicatas de ID`);
                console.error(`ERRO: ${duplicatas.length} duplicatas de ID encontradas`);
            } else {
                console.log('Nenhuma duplicata de ID encontrada');
            }
            
            // 3. Verificar registros nulos essenciais
            const nullChecks = [
                { campo: 'id', descricao: 'ID do colaborador' },
                { campo: 'name', descricao: 'Nome do colaborador' },
                { campo: 'registrationNumber', descricao: 'Número de registro' }
            ];
            
            for (const check of nullChecks) {
                const nullResult = await query(`
                    SELECT COUNT(*) as count 
                    FROM employees 
                    WHERE "${check.campo}" IS NULL OR "${check.campo}" = ''
                `);
                
                const nullCount = parseInt(nullResult.rows[0].count);
                if (nullCount > 0) {
                    this.resultados.warnings.push(`${check.descricao}: ${nullCount} registros nulos`);
                    console.warn(`AVISO: ${nullCount} registros com ${check.descricao} nulo`);
                }
            }
            
            // 4. Verificar tipos de dados
            const typeChecks = [
                { campo: 'currentSalary', tipo: 'numeric', descricao: 'Salário atual' },
                { campo: 'admissionDate', tipo: 'date', descricao: 'Data de admissão' },
                { campo: 'birthDate', tipo: 'date', descricao: 'Data de nascimento' }
            ];
            
            for (const check of typeChecks) {
                try {
                    if (check.tipo === 'numeric') {
                        const invalidResult = await query(`
                            SELECT COUNT(*) as count 
                            FROM employees 
                            WHERE "${check.campo}" IS NOT NULL 
                            AND "${check.campo}" !~ '^[0-9]+(\.[0-9]+)?$'
                        `);
                        
                        const invalidCount = parseInt(invalidResult.rows[0].count);
                        if (invalidCount > 0) {
                            this.resultados.warnings.push(`${check.descricao}: ${invalidCount} valores inválidos`);
                        }
                    }
                } catch (error) {
                    console.warn(`Não foi possível validar ${check.campo}:`, error.message);
                }
            }
            
            this.resultados.integridade = {
                total_registros: totalRegistros,
                duplicatas_id: duplicatas.length,
                registros_validos: totalRegistros - duplicatas.length
            };
            
            return this.resultados.integridade;
            
        } catch (error) {
            console.error('Erro na validação de integridade:', error.message);
            throw error;
        }
    }

    async validarCamposSensiveis() {
        console.log('=== VALIDANDO CAMPOS SENSÍVEIS PRESERVADOS ===');
        
        try {
            const camposSensiveis = ['photoUrl', 'metadata', 'criado_em'];
            
            for (const campo of camposSensiveis) {
                const result = await query(`
                    SELECT 
                        COUNT(*) as total,
                        COUNT("${campo}") as preenchidos,
                        COUNT(*) - COUNT("${campo}") as nulos,
                        COUNT(DISTINCT "${campo}") as valores_unicos
                    FROM employees
                `);
                
                const stats = result.rows[0];
                
                this.resultados.campos_sensiveis[campo] = {
                    total_registros: parseInt(stats.total),
                    preenchidos: parseInt(stats.preenchidos),
                    nulos: parseInt(stats.nulos),
                    valores_unicos: parseInt(stats.valores_unicos),
                    percentual_preenchido: ((stats.preenchidos / stats.total) * 100).toFixed(2) + '%'
                };
                
                console.log(`${campo}:`);
                console.log(`  Total: ${stats.total}`);
                console.log(`  Preenchidos: ${stats.preenchidos} (${((stats.preenchidos / stats.total) * 100).toFixed(2)}%)`);
                console.log(`  Nulos: ${stats.nulos}`);
                console.log(`  Valores únicos: ${stats.valores_unicos}`);
            }
            
            // Verificar se há perda de dados sensíveis
            const backupDir = path.join(__dirname, '..', 'backups');
            const backupFiles = await fs.readdir(backupDir);
            const latestBackup = backupFiles
                .filter(f => f.startsWith('employees_backup_') && f.endsWith('.json'))
                .sort()
                .pop();
            
            if (latestBackup) {
                const backupPath = path.join(backupDir, latestBackup);
                const backupData = JSON.parse(await fs.readFile(backupPath, 'utf8'));
                
                console.log('\nComparando com backup mais recente...');
                
                // Verificar se backupData.dados é um array
                const backupArray = Array.isArray(backupData.dados) ? backupData.dados : [];
                
                for (const campo of camposSensiveis) {
                    const backupPreenchidos = backupArray.filter(row => row[campo] != null).length;
                    const atualPreenchidos = this.resultados.campos_sensiveis[campo].preenchidos;
                    
                    if (atualPreenchidos < backupPreenchidos) {
                        const perda = backupPreenchidos - atualPreenchidos;
                        this.resultados.erros.push(`PERDA DE DADOS: ${campo} - ${perda} registros perdidos`);
                        console.error(`ERRO: Perda de ${perda} registros em ${campo}`);
                    } else {
                        console.log(`${campo}: Dados preservados (${backupPreenchidos} -> ${atualPreenchidos})`);
                    }
                }
            }
            
            return this.resultados.campos_sensiveis;
            
        } catch (error) {
            console.error('Erro na validação de campos sensíveis:', error.message);
            throw error;
        }
    }

    async validarDadosAtualizados() {
        console.log('=== VALIDANDO DADOS ATUALIZADOS ===');
        
        try {
            // 1. Verificar distribuição por tipo
            const typeResult = await query(`
                SELECT type, COUNT(*) as count 
                FROM employees 
                WHERE type IS NOT NULL 
                GROUP BY type 
                ORDER BY count DESC
            `);
            
            this.resultados.dados_atualizados.distribuicao_tipo = typeResult.rows;
            
            console.log('Distribuição por tipo:');
            typeResult.rows.forEach(row => {
                const pct = ((row.count / this.resultados.integridade.total_registros) * 100).toFixed(1);
                console.log(`  ${row.type}: ${row.count} (${pct}%)`);
            });
            
            // 2. Verificar distribuição por setor
            const sectorResult = await query(`
                SELECT sector, COUNT(*) as count 
                FROM employees 
                WHERE sector IS NOT NULL 
                GROUP BY sector 
                ORDER BY count DESC 
                LIMIT 10
            `);
            
            this.resultados.dados_atualizados.top_setores = sectorResult.rows;
            
            console.log('\nTop 10 setores:');
            sectorResult.rows.forEach(row => {
                const pct = ((row.count / this.resultados.integridade.total_registros) * 100).toFixed(1);
                console.log(`  ${row.sector}: ${row.count} (${pct}%)`);
            });
            
            // 3. Verificar salários
            const salaryResult = await query(`
                SELECT 
                    COUNT(*) as total,
                    MIN("currentSalary"::numeric) as minimo,
                    MAX("currentSalary"::numeric) as maximo,
                    AVG("currentSalary"::numeric) as media
                FROM employees 
                WHERE "currentSalary" IS NOT NULL 
                AND "currentSalary" != ''
                AND "currentSalary"::numeric > 0
            `);
            
            const salaryStats = salaryResult.rows[0];
            this.resultados.dados_atualizados.estatisticas_salarial = {
                total: parseInt(salaryStats.total),
                minimo: parseFloat(salaryStats.minimo),
                maximo: parseFloat(salaryStats.maximo),
                media: parseFloat(salaryStats.media),
                mediana: null // Simplificado - sem MEDIAN por compatibilidade
            };
            
            console.log('\nEstatísticas salariais:');
            console.log(`  Total com salário: ${salaryStats.total}`);
            console.log(`  Média: R$ ${salaryStats.media ? parseFloat(salaryStats.media).toFixed(2) : 'N/A'}`);
            console.log(`  Mínimo: R$ ${salaryStats.minimo ? parseFloat(salaryStats.minimo).toFixed(2) : 'N/A'}`);
            console.log(`  Máximo: R$ ${salaryStats.maximo ? parseFloat(salaryStats.maximo).toFixed(2) : 'N/A'}`);
            
            return this.resultados.dados_atualizados;
            
        } catch (error) {
            console.error('Erro na validação de dados atualizados:', error.message);
            throw error;
        }
    }

    async gerarRelatorio() {
        console.log('=== GERANDO RELATÓRIO DE VALIDAÇÃO ===');
        
        const relatorio = {
            validacao: {
                timestamp: new Date().toISOString(),
                status: this.resultados.erros.length === 0 ? 'SUCESSO' : 'ERROS_ENCONTRADOS',
                total_erros: this.resultados.erros.length,
                total_warnings: this.resultados.warnings.length
            },
            integridade: this.resultados.integridade,
            campos_sensiveis: this.resultados.campos_sensiveis,
            dados_atualizados: this.resultados.dados_atualizados,
            erros: this.resultados.erros,
            warnings: this.resultados.warnings,
            recomendacoes: []
        };
        
        // Gerar recomendações
        if (relatorio.validacao.total_erros > 0) {
            relatorio.recomendacoes.push('CORRIGIR ERROS: Existem erros críticos que precisam ser corrigidos');
        }
        
        if (relatorio.validacao.total_warnings > 0) {
            relatorio.recomendacoes.push('REVISAR WARNINGS: Existem avisos que devem ser analisados');
        }
        
        if (relatorio.integridade.duplicatas_id > 0) {
            relatorio.recomendacoes.push('REMOVER DUPLICATAS: Existem IDs duplicados na tabela');
        }
        
        // Salvar relatório
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const relatorioPath = path.join(__dirname, '..', 'backups', `validacao_relatorio_${timestamp}.json`);
        
        await fs.mkdir(path.dirname(relatorioPath), { recursive: true });
        await fs.writeFile(relatorioPath, JSON.stringify(relatorio, null, 2));
        
        console.log(`Relatório salvo: ${relatorioPath}`);
        
        return relatorio;
    }

    async executar() {
        try {
            console.log('INICIANDO VALIDAÇÃO PÓS-ATUALIZAÇÃO');
            console.log('='.repeat(50));
            
            // 1. Validar integridade
            await this.validarIntegridade();
            
            // 2. Validar campos sensíveis
            await this.validarCamposSensiveis();
            
            // 3. Validar dados atualizados
            await this.validarDadosAtualizados();
            
            // 4. Gerar relatório
            const relatorio = await this.gerarRelatorio();
            
            console.log('\n=== RESUMO DA VALIDAÇÃO ===');
            console.log(`Status: ${relatorio.validacao.status}`);
            console.log(`Erros: ${relatorio.validacao.total_erros}`);
            console.log(`Warnings: ${relatorio.validacao.total_warnings}`);
            console.log(`Total de registros: ${relatorio.integridade.total_registros}`);
            
            if (relatorio.erros.length > 0) {
                console.log('\n=== ERROS ENCONTRADOS ===');
                relatorio.erros.forEach(erro => console.log(`- ${erro}`));
            }
            
            if (relatorio.warnings.length > 0) {
                console.log('\n=== WARNINGS ===');
                relatorio.warnings.forEach(warning => console.log(`- ${warning}`));
            }
            
            if (relatorio.recomendacoes.length > 0) {
                console.log('\n=== RECOMENDAÇÕES ===');
                relatorio.recomendacoes.forEach(rec => console.log(`- ${rec}`));
            }
            
            return relatorio;
            
        } catch (error) {
            console.error('ERRO NA VALIDAÇÃO:', error.message);
            throw error;
        }
    }
}

// Executar validação
if (require.main === module) {
    const validator = new EmployeeValidator();
    
    validator.executar()
        .then((relatorio) => {
            console.log('\nValidação concluída!');
            if (relatorio.validacao.status === 'SUCESSO') {
                console.log('Todos os dados foram validados com sucesso!');
            } else {
                console.log('Atenção: Foram encontrados problemas que precisam ser corrigidos.');
            }
            process.exit(0);
        })
        .catch((error) => {
            console.error('Falha na validação:', error.message);
            process.exit(1);
        });
}

module.exports = { EmployeeValidator };
