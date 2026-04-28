#!/usr/bin/env node
/**
 * 🚀 SCRIPT DE SETUP INICIAL
 * Prepara o ambiente para desenvolvimento
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

function log(msg, color = 'reset') {
    console.log(`${colors[color]}${msg}${colors.reset}`);
}

async function setup() {
    log('\n🚀 RH+ - Setup de Desenvolvimento\n', 'cyan');
    
    // 1. Verificar Node.js
    log('📦 Verificando Node.js...', 'blue');
    try {
        const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
        log(`   ✅ Node.js: ${nodeVersion}`, 'green');
    } catch {
        log('   ❌ Node.js não encontrado. Instale o Node.js primeiro.', 'red');
        process.exit(1);
    }
    
    // 2. Verificar dependências
    log('\n📥 Verificando dependências...', 'blue');
    if (!fs.existsSync('node_modules')) {
        log('   📦 Instalando dependências...', 'yellow');
        execSync('npm install', { stdio: 'inherit' });
    } else {
        log('   ✅ Dependências já instaladas', 'green');
    }
    
    // 3. Verificar arquivo .env
    log('\n🔐 Verificando configuração...', 'blue');
    if (!fs.existsSync('.env')) {
        if (fs.existsSync('.env.example')) {
            fs.copyFileSync('.env.example', '.env');
            log('   ✅ Arquivo .env criado a partir de .env.example', 'green');
            log('   ⚠️  Edite o .env com suas configurações!', 'yellow');
        } else {
            log('   ❌ .env.example não encontrado', 'red');
        }
    } else {
        log('   ✅ Arquivo .env já existe', 'green');
    }
    
    // 4. Verificar PostgreSQL
    log('\n🐘 Verificando PostgreSQL...', 'blue');
    try {
        execSync('psql --version', { encoding: 'utf8' });
        log('   ✅ PostgreSQL instalado', 'green');
    } catch {
        log('   ⚠️  PostgreSQL não encontrado no PATH', 'yellow');
        log('      Baixe em: https://www.postgresql.org/download/', 'yellow');
    }
    
    // 5. Criar banco de dados (se possível)
    log('\n🗄️  Verificando banco de dados...', 'blue');
    log('   ℹ️  Crie o banco manualmente ou use: npm run db:create', 'yellow');
    
    // 6. Verificar estrutura
    log('\n📁 Verificando estrutura...', 'blue');
    const dirs = ['public', 'backend', 'backend/routes', 'backend/config', 'logs', 'uploads'];
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            log(`   ✅ Criado: ${dir}`, 'green');
        }
    });
    
    // 7. Testar conexão
    log('\n🔌 Testando conexão...', 'blue');
    try {
        const db = require('../backend/config/database');
        const status = await db.checkConnection();
        if (status.connected) {
            log(`   ✅ Conectado ao PostgreSQL`, 'green');
            log(`   🕐 Versão: ${status.version}`, 'cyan');
        } else {
            log(`   ❌ Não foi possível conectar: ${status.error}`, 'red');
        }
    } catch (err) {
        log(`   ⚠️  Erro ao testar: ${err.message}`, 'yellow');
    }
    
    // Resumo
    log('\n' + '='.repeat(50), 'cyan');
    log('✅ Setup concluído!', 'green');
    log('='.repeat(50), 'cyan');
    log('\nPróximos passos:', 'yellow');
    log('  1. Edite o arquivo .env com suas configurações');
    log('  2. Configure o PostgreSQL (veja PostgreSQL/Configuracao_PostgreSQL.md)');
    log('  3. Execute: npm run db:migrate');
    log('  4. Inicie o servidor: npm start');
    log('  5. Acesse: http://localhost:3001\n');
}

setup().catch(err => {
    log(`\n❌ Erro no setup: ${err.message}`, 'red');
    process.exit(1);
});
