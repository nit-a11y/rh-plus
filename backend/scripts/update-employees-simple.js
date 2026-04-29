#!/usr/bin/env node
/**
 * Migração Simplificada e Robusta de Employees
 * Atualização registro por registro com tratamento de erros
 * RH+ Sistema - Nordeste Locações
 */

const { query } = require('../config/database');
const XLSX = require('xlsx');
const path = require('path');

async function migrarEmployees() {
    console.log('=== INICIANDO MIGRAÇÃO SEGURA E SIMPLIFICADA ===');
    
    try {
        // 1. Carregar dados do Excel
        console.log('1. Carregando dados do Excel...');
        const excelPath = path.join(__dirname, '..', 'employees.xlsx');
        const workbook = XLSX.readFile(excelPath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const excelData = XLSX.utils.sheet_to_json(worksheet);
        
        console.log(`   ${excelData.length} registros carregados do Excel`);
        
        // 2. Preservar campos sensíveis do banco
        console.log('2. Preservando campos sensíveis...');
        const sensiveisResult = await query(`
            SELECT id, "photoUrl", metadata, criado_em 
            FROM employees 
            WHERE id IS NOT NULL
        `);
        
        const mapaSensiveis = {};
        sensiveisResult.rows.forEach(row => {
            mapaSensiveis[row.id] = {
                photoUrl: row.photoUrl,
                metadata: row.metadata,
                criado_em: row.criado_em
            };
        });
        
        console.log(`   ${sensiveisResult.rows.length} registros de campos sensíveis preservados`);
        
        // 3. Campos que não devem ser atualizados
        const camposProibidos = ['photoUrl', 'metadata', 'criado_em'];
        
        // 4. Atualizar cada registro individualmente
        let atualizados = 0;
        let erros = 0;
        
        console.log('3. Atualizando registros...');
        
        for (let i = 0; i < excelData.length; i++) {
            const excelRow = excelData[i];
            const employeeId = excelRow.id;
            
            try {
                // Verificar se existe no banco
                const existsResult = await query(
                    'SELECT id FROM employees WHERE id = $1',
                    [employeeId]
                );
                
                if (existsResult.rows.length === 0) {
                    console.warn(`   Aviso: ID ${employeeId} não encontrado no banco`);
                    continue;
                }
                
                // Preparar campos para atualização
                const camposAtualizar = [];
                const valores = [];
                let paramIndex = 1;
                
                // Adicionar todos os campos do Excel (exceto os proibidos)
                for (const [campo, valor] of Object.entries(excelRow)) {
                    if (!camposProibidos.includes(campo)) {
                        camposAtualizar.push(`"${campo}" = $${paramIndex++}`);
                        valores.push(valor);
                    }
                }
                
                // Adicionar campos sensíveis preservados
                const sensiveis = mapaSensiveis[employeeId];
                if (sensiveis) {
                    camposAtualizar.push(`"photoUrl" = $${paramIndex++}`);
                    valores.push(sensiveis.photoUrl);
                    
                    camposAtualizar.push(`"metadata" = $${paramIndex++}`);
                    valores.push(sensiveis.metadata);
                    
                    camposAtualizar.push(`"criado_em" = $${paramIndex++}`);
                    valores.push(sensiveis.criado_em);
                }
                
                // Adicionar ID para WHERE
                valores.push(employeeId);
                
                // Executar atualização
                const updateSQL = `
                    UPDATE employees 
                    SET ${camposAtualizar.join(', ')}
                    WHERE id = $${paramIndex}
                `;
                
                await query(updateSQL, valores);
                atualizados++;
                
                // Progresso
                if ((i + 1) % 20 === 0) {
                    console.log(`   Progresso: ${i + 1}/${excelData.length} (${atualizados} atualizados)`);
                }
                
            } catch (error) {
                erros++;
                console.error(`   Erro no registro ${employeeId}: ${error.message}`);
                
                // Continuar para o próximo registro
                continue;
            }
        }
        
        // 5. Relatório final
        console.log('\n=== MIGRAÇÃO CONCLUÍDA ===');
        console.log(`Total de registros: ${excelData.length}`);
        console.log(`Atualizados com sucesso: ${atualizados}`);
        console.log(`Erros: ${erros}`);
        console.log(`Taxa de sucesso: ${((atualizados / excelData.length) * 100).toFixed(2)}%`);
        
        // 6. Verificação rápida
        console.log('\n=== VERIFICAÇÃO RÁPIDA ===');
        const countResult = await query('SELECT COUNT(*) as total FROM employees');
        console.log(`Total de registros na tabela: ${countResult.rows[0].total}`);
        
        // Verificar campos sensíveis
        const photoUrlResult = await query('SELECT COUNT(*) as total FROM employees WHERE "photoUrl" IS NOT NULL');
        const metadataResult = await query('SELECT COUNT(*) as total FROM employees WHERE metadata IS NOT NULL');
        
        console.log(`photoUrl preenchidos: ${photoUrlResult.rows[0].total}`);
        console.log(`metadata preenchidos: ${metadataResult.rows[0].total}`);
        
        return {
            total: excelData.length,
            atualizados,
            erros,
            taxa_sucesso: ((atualizados / excelData.length) * 100).toFixed(2) + '%'
        };
        
    } catch (error) {
        console.error('ERRO FATAL NA MIGRAÇÃO:', error.message);
        throw error;
    }
}

// Executar migração
if (require.main === module) {
    migrarEmployees()
        .then((resultado) => {
            console.log('\nMigração concluída com sucesso!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Falha na migração:', error.message);
            process.exit(1);
        });
}

module.exports = { migrarEmployees };
