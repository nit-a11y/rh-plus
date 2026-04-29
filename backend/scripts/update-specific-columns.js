#!/usr/bin/env node
/**
 * Atualização Específica de Colunas por ID
 * Atualiza apenas: type, admissionDate, employer_id, workplace_id
 * RH+ Sistema - Nordeste Locações
 */

const { query } = require('../config/database');
const XLSX = require('xlsx');
const path = require('path');

async function atualizarColunasEspecificas() {
    console.log('=== ATUALIZAÇÃO ESPECÍFICA DE COLUNAS ===');
    console.log('Colunas a atualizar: type, admissionDate, employer_id, workplace_id');
    
    try {
        // 1. Carregar dados do Excel
        console.log('1. Carregando dados do Excel...');
        const excelPath = path.join(__dirname, '..', 'employees.xlsx');
        const workbook = XLSX.readFile(excelPath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const excelData = XLSX.utils.sheet_to_json(worksheet);
        
        console.log(`   ${excelData.length} registros carregados do Excel`);
        
        // 2. Mapear dados por ID do Excel
        console.log('2. Mapeando dados do Excel por ID...');
        const dadosExcel = {};
        excelData.forEach(row => {
            if (row.id) {
                dadosExcel[row.id] = {
                    type: row.type,
                    admissionDate: row.admissionDate,
                    employer_id: row.employer_id,
                    workplace_id: row.workplace_id
                };
            }
        });
        
        console.log(`   ${Object.keys(dadosExcel).length} IDs mapeados do Excel`);
        
        // 3. Verificar quais IDs existem no banco
        console.log('3. Verificando IDs no banco...');
        const idsExcel = Object.keys(dadosExcel);
        const idsResult = await query(
            'SELECT id FROM employees WHERE id = ANY($1)',
            [idsExcel]
        );
        
        const idsBanco = idsResult.rows.map(row => row.id);
        console.log(`   ${idsBanco.length} IDs encontrados no banco`);
        
        // 4. Atualizar cada registro
        let atualizados = 0;
        let erros = 0;
        let naoEncontrados = 0;
        
        console.log('4. Atualizando registros...');
        
        for (const [id, dados] of Object.entries(dadosExcel)) {
            try {
                // Verificar se ID existe no banco
                if (!idsBanco.includes(id)) {
                    naoEncontrados++;
                    console.warn(`   ID ${id} não encontrado no banco`);
                    continue;
                }
                
                // Preparar campos para atualização (só os não nulos)
                const camposAtualizar = [];
                const valores = [];
                let paramIndex = 1;
                
                if (dados.type !== null && dados.type !== undefined && dados.type !== '') {
                    camposAtualizar.push(`"type" = $${paramIndex++}`);
                    valores.push(dados.type);
                }
                
                if (dados.admissionDate !== null && dados.admissionDate !== undefined && dados.admissionDate !== '') {
                    camposAtualizar.push(`"admissionDate" = $${paramIndex++}`);
                    valores.push(dados.admissionDate);
                }
                
                if (dados.employer_id !== null && dados.employer_id !== undefined && dados.employer_id !== '') {
                    camposAtualizar.push(`"employer_id" = $${paramIndex++}`);
                    valores.push(dados.employer_id);
                }
                
                if (dados.workplace_id !== null && dados.workplace_id !== undefined && dados.workplace_id !== '') {
                    camposAtualizar.push(`"workplace_id" = $${paramIndex++}`);
                    valores.push(dados.workplace_id);
                }
                
                // Se não há nada para atualizar, pular
                if (camposAtualizar.length === 0) {
                    console.log(`   ID ${id}: Nenhum dado para atualizar`);
                    continue;
                }
                
                // Adicionar ID para WHERE
                valores.push(id);
                
                // Executar atualização
                const updateSQL = `
                    UPDATE employees 
                    SET ${camposAtualizar.join(', ')}
                    WHERE id = $${paramIndex}
                `;
                
                await query(updateSQL, valores);
                atualizados++;
                
                // Log detalhado
                const detalhesAtualizacao = [];
                if (dados.type) detalhesAtualizacao.push(`type: ${dados.type}`);
                if (dados.admissionDate) detalhesAtualizacao.push(`admissionDate: ${dados.admissionDate}`);
                if (dados.employer_id) detalhesAtualizacao.push(`employer_id: ${dados.employer_id}`);
                if (dados.workplace_id) detalhesAtualizacao.push(`workplace_id: ${dados.workplace_id}`);
                
                console.log(`   ID ${id}: Atualizado (${detalhesAtualizacao.join(', ')})`);
                
                // Progresso
                if (atualizados % 20 === 0) {
                    console.log(`   Progresso: ${atualizados} atualizados`);
                }
                
            } catch (error) {
                erros++;
                console.error(`   Erro no ID ${id}: ${error.message}`);
            }
        }
        
        // 5. Relatório final
        console.log('\n=== ATUALIZAÇÃO CONCLUÍDA ===');
        console.log(`Total de IDs no Excel: ${Object.keys(dadosExcel).length}`);
        console.log(`IDs encontrados no banco: ${idsBanco.length}`);
        console.log(`Atualizados com sucesso: ${atualizados}`);
        console.log(`Erros: ${erros}`);
        console.log(`IDs não encontrados: ${naoEncontrados}`);
        console.log(`Taxa de sucesso: ${((atualizados / idsBanco.length) * 100).toFixed(2)}%`);
        
        // 6. Verificação rápida
        console.log('\n=== VERIFICAÇÃO RÁPIDA ===');
        
        // Verificar type
        const typeResult = await query(`
            SELECT type, COUNT(*) as count 
            FROM employees 
            WHERE type IS NOT NULL 
            GROUP BY type 
            ORDER BY count DESC
        `);
        
        console.log('Distribuição atualizada por type:');
        typeResult.rows.forEach(row => {
            console.log(`  ${row.type}: ${row.count}`);
        });
        
        // Verificar admissionDate
        const admissionResult = await query(`
            SELECT COUNT(*) as total,
                   COUNT("admissionDate") as preenchidos
            FROM employees
        `);
        
        console.log(`\nAdmission Date: ${admissionResult.rows[0].preenchidos}/${admissionResult.rows[0].total} preenchidos`);
        
        // Verificar employer_id e workplace_id
        const employerResult = await query(`
            SELECT COUNT(*) as total,
                   COUNT("employer_id") as preenchidos
            FROM employees
        `);
        
        const workplaceResult = await query(`
            SELECT COUNT(*) as total,
                   COUNT("workplace_id") as preenchidos
            FROM employees
        `);
        
        console.log(`Employer ID: ${employerResult.rows[0].preenchidos}/${employerResult.rows[0].total} preenchidos`);
        console.log(`Workplace ID: ${workplaceResult.rows[0].preenchidos}/${workplaceResult.rows[0].total} preenchidos`);
        
        return {
            total_excel: Object.keys(dadosExcel).length,
            encontrados_banco: idsBanco.length,
            atualizados,
            erros,
            nao_encontrados: naoEncontrados,
            taxa_sucesso: ((atualizados / idsBanco.length) * 100).toFixed(2) + '%'
        };
        
    } catch (error) {
        console.error('ERRO NA ATUALIZAÇÃO:', error.message);
        throw error;
    }
}

// Executar atualização
if (require.main === module) {
    atualizarColunasEspecificas()
        .then((resultado) => {
            console.log('\nAtualização específica concluída com sucesso!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Falha na atualização:', error.message);
            process.exit(1);
        });
}

module.exports = { atualizarColunasEspecificas };
