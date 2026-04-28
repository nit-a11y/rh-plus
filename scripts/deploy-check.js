#!/usr/bin/env node
/**
 * 🔍 VERIFICAÇÃO PRÉ-DEPLOY
 * Valida se o sistema está pronto para produção
 */

const fs = require('fs');
const { checkConnection } = require('../backend/config/database');
const config = require('../backend/config');

const checks = [];

function check(name, condition, message) {
    checks.push({ name, pass: condition, message });
    const icon = condition ? '✅' : '❌';
    console.log(`${icon} ${name}`);
    if (!condition && message) {
        console.log(`   ${message}`);
    }
}

async function runChecks() {
    console.log('\n🔍 Verificação Pré-Deploy\n');
    console.log('=' .repeat(50));
    
    // 1. Ambiente
    console.log('\n📋 Configuração:\n');
    check('NODE_ENV definido', !!process.env.NODE_ENV, 'Defina NODE_ENV=production');
    check('Não está em modo dev', process.env.NODE_ENV === 'production', 'Use NODE_ENV=production para deploy');
    
    // 2. Arquivos
    console.log('\n📁 Arquivos:\n');
    check('.env existe', fs.existsSync('.env'), 'Crie o arquivo .env');
    check('.env não exposto', !fs.existsSync('.env.example') || fs.readFileSync('.env', 'utf8').includes('sua-senha'), 'Altere senhas padrão no .env!');
    check('node_modules existe', fs.existsSync('node_modules'), 'Execute: npm install');
    
    // 3. Segurança
    console.log('\n🔐 Segurança:\n');
    const jwtSecret = process.env.JWT_SECRET;
    check('JWT_SECRET definido', !!jwtSecret, 'Defina JWT_SECRET no .env');
    check('JWT_SECRET é forte', jwtSecret && jwtSecret.length >= 32 && !jwtSecret.includes('dev'), 'Use pelo menos 32 caracteres aleatórios');
    
    // 4. Banco de dados
    console.log('\n🗄️  Banco de Dados:\n');
    const dbStatus = await checkConnection();
    check('Conecta ao PostgreSQL', dbStatus.connected, dbStatus.error);
    if (dbStatus.connected) {
        check('Versão do PostgreSQL', true, `v${dbStatus.version}`);
    }
    
    // 5. Resumo
    console.log('\n' + '='.repeat(50));
    const passed = checks.filter(c => c.pass).length;
    const total = checks.length;
    
    if (passed === total) {
        console.log('\n✅ Todos os checks passaram! Sistema pronto para deploy.\n');
        process.exit(0);
    } else {
        console.log(`\n⚠️  ${passed}/${total} checks passaram. Corrija os erros antes do deploy.\n`);
        process.exit(1);
    }
}

runChecks().catch(err => {
    console.error('\n❌ Erro na verificação:', err.message);
    process.exit(1);
});
