#!/usr/bin/env node

/**
 * 🔄 SWITCH ENVIRONMENT - RH+ SISTEMA
 * Utilitário para alternar entre ambientes de desenvolvimento
 */

const fs = require('fs');
const path = require('path');

const environments = ['development', 'test', 'production'];
const currentEnv = process.env.NODE_ENV || 'development';

function showHelp() {
    console.log(`
🔄 SWITCH ENVIRONMENT - RH+ Sistema

Uso: node scripts/switch-env.js [ambiente]

Ambientes disponíveis:
  - development (padrão)
  - test
  - production

Exemplos:
  node scripts/switch-env.js development
  node scripts/switch-env.js test
  node scripts/switch-env.js production

Status atual: ${currentEnv}
`);
}

function switchEnvironment(targetEnv) {
    if (!environments.includes(targetEnv)) {
        console.error(`❌ Ambiente inválido: ${targetEnv}`);
        console.log(`Ambientes válidos: ${environments.join(', ')}`);
        process.exit(1);
    }

    const envFile = `.env.${targetEnv}`;
    const envPath = path.join(process.cwd(), envFile);

    if (!fs.existsSync(envPath)) {
        console.error(`❌ Arquivo ${envFile} não encontrado!`);
        console.log(`📝 Crie o arquivo com base em ${envFile}.example`);
        process.exit(1);
    }

    // Fazer backup do .env atual
    const currentEnvPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(currentEnvPath)) {
        const backupPath = path.join(process.cwd(), `.env.backup.${Date.now()}`);
        fs.copyFileSync(currentEnvPath, backupPath);
        console.log(`💾 Backup criado: ${backupPath}`);
    }

    // Criar link simbólico ou copiar arquivo
    try {
        if (process.platform === 'win32') {
            // Windows: copiar arquivo
            fs.copyFileSync(envPath, currentEnvPath);
        } else {
            // Linux/Mac: criar link simbólico
            if (fs.existsSync(currentEnvPath)) {
                fs.unlinkSync(currentEnvPath);
            }
            fs.symlinkSync(envPath, currentEnvPath);
        }
        
        console.log(`✅ Ambiente alterado para: ${targetEnv}`);
        console.log(`📄 Arquivo ativo: ${envFile}`);
        
        // Mostrar configuração atual
        const envContent = fs.readFileSync(envPath, 'utf8');
        const nodeEnv = envContent.match(/NODE_ENV=(.+)/);
        const dbName = envContent.match(/DB_NAME=(.+)/);
        
        console.log(`\n🔍 Configuração atual:`);
        console.log(`   NODE_ENV: ${nodeEnv ? nodeEnv[1] : 'Não definido'}`);
        console.log(`   DB_NAME: ${dbName ? dbName[1] : 'Não definido'}`);
        
    } catch (error) {
        console.error(`❌ Erro ao alterar ambiente: ${error.message}`);
        process.exit(1);
    }
}

// Processar argumentos
const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
}

const targetEnv = args[0];
switchEnvironment(targetEnv);
