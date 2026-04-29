#!/usr/bin/env node
/**
 * Backup Completo e Seguro da Tabela Employees
 * RH+ Sistema - Nordeste Locações
 */

const { query, transaction } = require('../config/database');
const fs = require('fs').promises;
const path = require('path');

async function criarBackupCompleto() {
    console.log('=== INICIANDO BACKUP COMPLETO DA TABELA EMPLOYEES ===');
    
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const backupFileName = `employees_backup_${timestamp}.json`;
        const backupPath = path.join(__dirname, '..', 'backups', backupFileName);
        
        // Criar diretório de backups se não existir
        await fs.mkdir(path.dirname(backupPath), { recursive: true });
        
        // 1. Contar registros na tabela
        console.log('1. Verificando quantidade de registros...');
        const countResult = await query('SELECT COUNT(*) as total FROM employees');
        const totalRegistros = parseInt(countResult.rows[0].total);
        console.log(`   Total de registros: ${totalRegistros}`);
        
        if (totalRegistros === 0) {
            throw new Error('Tabela employees está vazia!');
        }
        
        // 2. Backup completo de todos os dados
        console.log('2. Realizando backup completo...');
        const allDataResult = await query('SELECT * FROM employees ORDER BY id');
        
        // 3. Preparar dados do backup
        const backupData = {
            metadata: {
                timestamp: new Date().toISOString(),
                total_registros: totalRegistros,
                tabela: 'employees',
                backup_type: 'completo',
                versao: '1.0',
                ambiente: process.env.NODE_ENV || 'development'
            },
            dados: allDataResult.rows,
            colunas: Object.keys(allDataResult.rows[0] || {})
        };
        
        // 4. Salvar backup em arquivo JSON
        console.log('3. Salvando backup em arquivo...');
        await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));
        
        // 5. Criar tabela de backup no banco (opcional, para rollback rápido)
        const backupTableName = `employees_backup_${timestamp.replace(/-/g, '_')}`;
        console.log('4. Criando tabela de backup no banco...');
        
        await transaction(async (client) => {
            // Remover tabela de backup anterior se existir
            await client.query(`DROP TABLE IF EXISTS ${backupTableName}`);
            
            // Criar tabela de backup idêntica
            await client.query(`CREATE TABLE ${backupTableName} AS SELECT * FROM employees`);
            
            // Adicionar comentário na tabela
            await client.query(`
                COMMENT ON TABLE ${backupTableName} IS 
                'Backup automático da tabela employees - ${new Date().toISOString()}'
            `);
        });
        
        // 6. Verificar integridade do backup
        console.log('5. Verificando integridade do backup...');
        const backupCountResult = await query(`SELECT COUNT(*) as total FROM ${backupTableName}`);
        const backupTotalRegistros = parseInt(backupCountResult.rows[0].total);
        
        if (backupTotalRegistros !== totalRegistros) {
            throw new Error(`Erro de integridade: Original ${totalRegistros}, Backup ${backupTotalRegistros}`);
        }
        
        // 6. Análise de campos sensíveis
        console.log('6. Analisando campos sensíveis...');
        const camposSensiveis = ['photoUrl', 'metadata'];
        const analiseSensiveis = {};
        
        for (const campo of camposSensiveis) {
            const countResult = await query(`
                SELECT 
                    COUNT(*) as total,
                    COUNT("${campo}") as preenchidos,
                    COUNT(*) - COUNT("${campo}") as nulos
                FROM employees
            `);
            
            analiseSensiveis[campo] = {
                total: countResult.rows[0].total,
                preenchidos: countResult.rows[0].preenchidos,
                nulos: countResult.rows[0].nulos,
                percentual_preenchido: ((countResult.rows[0].preenchidos / countResult.rows[0].total) * 100).toFixed(2) + '%'
            };
        }
        
        // 8. Gerar relatório do backup
        const relatorio = {
            backup: {
                arquivo: backupFileName,
                caminho: backupPath,
                tabela_banco: backupTableName,
                timestamp: new Date().toISOString()
            },
            dados: {
                total_registros: totalRegistros,
                total_colunas: backupData.colunas.length,
                colunas: backupData.colunas
            },
            campos_sensiveis: analiseSensiveis,
            integridade: {
                backup_valido: true,
                registros_correspondentes: backupTotalRegistros === totalRegistros
            }
        };
        
        // Salvar relatório
        const relatorioPath = backupPath.replace('.json', '_relatorio.json');
        await fs.writeFile(relatorioPath, JSON.stringify(relatorio, null, 2));
        
        console.log('\n=== BACKUP CONCLUÍDO COM SUCESSO ===');
        console.log(`Arquivo: ${backupFileName}`);
        console.log(`Tabela backup: ${backupTableName}`);
        console.log(`Registros: ${totalRegistros}`);
        console.log(`Relatório: ${relatorioPath}`);
        
        // Exibir análise de campos sensíveis
        console.log('\n=== ANÁLISE DE CAMPOS SENSÍVEIS ===');
        for (const [campo, dados] of Object.entries(analiseSensiveis)) {
            console.log(`${campo}:`);
            console.log(`  Total: ${dados.total}`);
            console.log(`  Preenchidos: ${dados.preenchidos} (${dados.percentual_preenchido})`);
            console.log(`  Nulos: ${dados.nulos}`);
        }
        
        return {
            sucesso: true,
            backup: relatorio.backup,
            dados: relatorio.dados,
            campos_sensiveis: relatorio.campos_sensiveis
        };
        
    } catch (error) {
        console.error('ERRO NO BACKUP:', error.message);
        throw error;
    }
}

// Executar backup
if (require.main === module) {
    criarBackupCompleto()
        .then((resultado) => {
            console.log('\nBackup realizado com sucesso!');
            console.log('Pronto para migração dos dados do Excel.');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Falha no backup:', error.message);
            process.exit(1);
        });
}

module.exports = { criarBackupCompleto };
