#!/usr/bin/env node
/**
 * Migração Segura de Dados do Excel para Tabela Employees
 * Preservação de campos sensíveis (photoUrl, metadata)
 * RH+ Sistema - Nordeste Locações
 */

const { query, transaction } = require('../config/database');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs').promises;

class EmployeeMigrator {
    constructor() {
        this.excelData = null;
        this.backupData = null;
        this.camposSensiveis = ['photoUrl', 'metadata', 'criado_em'];
        this.camposParaAtualizar = [];
        this.estatisticas = {
            total_registros: 0,
            atualizados: 0,
            erros: [],
            CamposPreservados: {},
            CamposAtualizados: []
        };
    }

    async carregarDadosExcel() {
        console.log('=== CARREGANDO DADOS DO EXCEL ===');
        
        try {
            const excelPath = path.join(__dirname, '..', 'employees.xlsx');
            const workbook = XLSX.readFile(excelPath);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            
            // Converter para JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            console.log(`Carregados ${jsonData.length} registros do Excel`);
            
            // Validar estrutura
            if (jsonData.length === 0) {
                throw new Error('Arquivo Excel está vazio');
            }
            
            this.excelData = jsonData;
            this.estatisticas.total_registros = jsonData.length;
            
            // Identificar colunas do Excel
            const colunasExcel = Object.keys(jsonData[0]);
            console.log(`Colunas encontradas: ${colunasExcel.length}`);
            
            return jsonData;
            
        } catch (error) {
            console.error('Erro ao carregar Excel:', error.message);
            throw error;
        }
    }

    async carregarDadosBanco() {
        console.log('=== CARREGANDO DADOS DO BANCO ===');
        
        try {
            const result = await query('SELECT * FROM employees ORDER BY id');
            console.log(`Carregados ${result.rows.length} registros do banco`);
            
            this.backupData = result.rows;
            return result.rows;
            
        } catch (error) {
            console.error('Erro ao carregar dados do banco:', error.message);
            throw error;
        }
    }

    async validarEstrutura() {
        console.log('=== VALIDANDO ESTRUTURA DOS DADOS ===');
        
        if (!this.excelData || !this.backupData) {
            throw new Error('Dados não carregados');
        }
        
        // Comparar quantidades
        if (this.excelData.length !== this.backupData.length) {
            console.warn(`Atenção: Excel tem ${this.excelData.length}, Banco tem ${this.backupData.length}`);
        }
        
        // Identificar colunas para atualizar (exceto campos sensíveis)
        const colunasExcel = Object.keys(this.excelData[0]);
        const colunasBanco = Object.keys(this.backupData[0]);
        
        this.camposParaAtualizar = colunasExcel.filter(col => 
            !this.camposSensiveis.includes(col) && 
            colunasBanco.includes(col)
        );
        
        console.log(`Campos para atualizar: ${this.camposParaAtualizar.length}`);
        console.log(`Campos preservados: ${this.camposSensiveis.join(', ')}`);
        
        return {
            colunas_excel: colunasExcel,
            colunas_banco: colunasBanco,
            campos_atualizar: this.camposParaAtualizar,
            campos_preservar: this.camposSensiveis
        };
    }

    async preservarCamposSensiveis() {
        console.log('=== PRESERVANDO CAMPOS SENSÍVEIS ===');
        
        try {
            // Buscar campos sensíveis do banco
            const camposSensiveisStr = this.camposSensiveis.map(c => `"${c}"`).join(', ');
            const result = await query(`
                SELECT id, ${camposSensiveisStr} 
                FROM employees 
                WHERE id IS NOT NULL
                ORDER BY id
            `);
            
            const mapaSensiveis = {};
            result.rows.forEach(row => {
                mapaSensiveis[row.id] = {
                    photoUrl: row.photoUrl,
                    metadata: row.metadata,
                    criado_em: row.criado_em
                };
            });
            
            console.log(`Campos sensíveis preservados para ${result.rows.length} registros`);
            
            return mapaSensiveis;
            
        } catch (error) {
            console.error('Erro ao preservar campos sensíveis:', error.message);
            throw error;
        }
    }

    async executarMigracao() {
        console.log('=== EXECUTANDO MIGRAÇÃO SEGURA ===');
        
        const mapaSensiveis = await this.preservarCamposSensiveis();
        
        return await transaction(async (client) => {
            console.log('Transação iniciada...');
            
            for (let i = 0; i < this.excelData.length; i++) {
                const excelRow = this.excelData[i];
                const employeeId = excelRow.id;
                
                try {
                    // Verificar se registro existe no banco
                    const existingResult = await client.query(
                        'SELECT id FROM employees WHERE id = $1',
                        [employeeId]
                    );
                    
                    if (existingResult.rows.length === 0) {
                        console.warn(`Registro ID ${employeeId} não encontrado no banco`);
                        continue;
                    }
                    
                    // Preparar dados para atualização
                    const updateData = {};
                    const updateValues = [];
                    let paramCount = 1;
                    
                    // Adicionar campos do Excel (exceto sensíveis)
                    for (const campo of this.camposParaAtualizar) {
                        updateData[campo] = excelRow[campo];
                        updateValues.push(excelRow[campo]);
                    }
                    
                    // Adicionar campos sensíveis preservados
                    const sensiveis = mapaSensiveis[employeeId];
                    if (sensiveis) {
                        updateData.photourl = sensiveis.photoUrl;
                        updateData.metadata = sensiveis.metadata;
                        updateData.criado_em = sensiveis.criado_em;
                        
                        updateValues.push(sensiveis.photoUrl);
                        updateValues.push(sensiveis.metadata);
                        updateValues.push(sensiveis.criado_em);
                    }
                    
                    // Construir SQL dinâmico
                    const setClauses = [];
                    const allFields = [...this.camposParaAtualizar, ...this.camposSensiveis];
                    
                    for (let j = 0; j < allFields.length; j++) {
                        const campo = allFields[j];
                        if (campo === 'photourl') {
                            setClauses.push(`photoUrl = $${paramCount++}`);
                        } else if (campo === 'metadata') {
                            setClauses.push(`metadata = $${paramCount++}`);
                        } else if (campo === 'criado_em') {
                            setClauses.push(`criado_em = $${paramCount++}`);
                        } else {
                            setClauses.push(`${campo} = $${paramCount++}`);
                        }
                    }
                    
                    // Executar atualização
                    const updateSQL = `
                        UPDATE employees 
                        SET ${setClauses.join(', ')}
                        WHERE id = $${paramCount}
                    `;
                    
                    updateValues.push(employeeId);
                    
                    await client.query(updateSQL, updateValues);
                    
                    this.estatisticas.atualizados++;
                    
                    if ((i + 1) % 10 === 0) {
                        console.log(`Progresso: ${i + 1}/${this.excelData.length} registros`);
                    }
                    
                } catch (error) {
                    const erroInfo = {
                        id: employeeId,
                        linha: i + 2,
                        erro: error.message,
                        dados: excelRow
                    };
                    this.estatisticas.erros.push(erroInfo);
                    console.error(`Erro no registro ${employeeId}:`, error.message);
                }
            }
            
            console.log('Transação concluída com sucesso!');
            return this.estatisticas;
        });
    }

    async gerarRelatorio() {
        console.log('=== GERANDO RELATÓRIO FINAL ===');
        
        const relatorio = {
            migracao: {
                timestamp: new Date().toISOString(),
                total_registros: this.estatisticas.total_registros,
                atualizados: this.estatisticas.atualizados,
                erros: this.estatisticas.erros.length,
                taxa_sucesso: ((this.estatisticas.atualizados / this.estatisticas.total_registros) * 100).toFixed(2) + '%'
            },
            campos: {
                atualizados: this.camposParaAtualizar,
                preservados: this.camposSensiveis
            },
            erros: this.estatisticas.erros
        };
        
        // Salvar relatório
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const relatorioPath = path.join(__dirname, '..', 'backups', `migracao_relatorio_${timestamp}.json`);
        
        await fs.mkdir(path.dirname(relatorioPath), { recursive: true });
        await fs.writeFile(relatorioPath, JSON.stringify(relatorio, null, 2));
        
        console.log(`Relatório salvo: ${relatorioPath}`);
        
        return relatorio;
    }

    async executar() {
        try {
            console.log('INICIANDO MIGRAÇÃO SEGURA DE DADOS');
            console.log('='.repeat(50));
            
            // 1. Carregar dados
            await this.carregarDadosExcel();
            await this.carregarDadosBanco();
            
            // 2. Validar estrutura
            await this.validarEstrutura();
            
            // 3. Executar migração
            await this.executarMigracao();
            
            // 4. Gerar relatório
            const relatorio = await this.gerarRelatorio();
            
            console.log('\n=== MIGRAÇÃO CONCLUÍDA ===');
            console.log(`Total de registros: ${relatorio.migracao.total_registros}`);
            console.log(`Atualizados: ${relatorio.migracao.atualizados}`);
            console.log(`Erros: ${relatorio.migracao.erros}`);
            console.log(`Taxa de sucesso: ${relatorio.migracao.taxa_sucesso}`);
            
            if (relatorio.migracao.erros > 0) {
                console.log('\n=== ERROS ENCONTRADOS ===');
                relatorio.erros.forEach(erro => {
                    console.log(`ID ${erro.id}: ${erro.erro}`);
                });
            }
            
            return relatorio;
            
        } catch (error) {
            console.error('ERRO NA MIGRAÇÃO:', error.message);
            throw error;
        }
    }
}

// Executar migração
if (require.main === module) {
    const migrator = new EmployeeMigrator();
    
    migrator.executar()
        .then((relatorio) => {
            console.log('\nMigração concluída com sucesso!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Falha na migração:', error.message);
            process.exit(1);
        });
}

module.exports = { EmployeeMigrator };
