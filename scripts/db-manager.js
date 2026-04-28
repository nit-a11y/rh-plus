#!/usr/bin/env node
/**
 * 🗄️ GERENCIADOR DE BANCO DE DADOS
 * Comandos: create, migrate, seed, reset, status
 */

const { query, transaction, checkConnection } = require('../backend/config/database');

const commands = {
    // Criar banco de dados
    async create() {
        console.log('🗄️  Criando banco de dados...');
        // Note: precisa conectar ao postgres (banco do sistema) primeiro
        // Isso é feito via psql ou manualmente
        console.log('⚠️  Execute manualmente:');
        console.log('   createdb rh -U rhplus_user');
        console.log('   # ou no psql: CREATE DATABASE rh;');
    },

    // Status da conexão
    async status() {
        console.log('\n📊 Status do Banco de Dados\n');
        const status = await checkConnection();
        
        if (status.connected) {
            console.log('✅ Conectado: SIM');
            console.log(`🕐 Timestamp: ${status.timestamp}`);
            console.log(`🐘 Versão: ${status.version}`);
            console.log(`🌍 Ambiente: ${status.environment}`);
            
            // Verificar tabelas
            const tables = await query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name
            `);
            console.log(`\n📋 Tabelas encontradas: ${tables.rowCount}`);
            tables.rows.forEach((t, i) => {
                console.log(`   ${i + 1}. ${t.table_name}`);
            });
        } else {
            console.log('❌ Conectado: NÃO');
            console.log(`   Erro: ${status.error}`);
        }
    },

    // Executar migrações
    async migrate() {
        console.log('\n🔄 Executando migrações...\n');
        
        await transaction(async (client) => {
            // Tabela de controle de migrações
            await client.query(`
                CREATE TABLE IF NOT EXISTS _migrations (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    executed_at TIMESTAMP DEFAULT NOW()
                )
            `);
            
            // Verificar migrações pendentes
            const executed = await client.query('SELECT name FROM _migrations');
            const executedNames = executed.rows.map(r => r.name);
            
            console.log(`✅ ${executedNames.length} migrações já executadas`);
            
            // Aqui você adicionaria novas migrações
            // Por enquanto apenas validamos a estrutura existente
        });
        
        console.log('\n✅ Migrações concluídas!');
    },

    // Popular com dados iniciais
    async seed() {
        console.log('\n🌱 Populando dados iniciais...\n');
        
        const env = process.env.NODE_ENV || 'development';
        if (env === 'production') {
            console.log('⚠️  Não é recomendado rodar seed em produção!');
            const readline = require('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            
            const answer = await new Promise(resolve => {
                rl.question('Continuar mesmo assim? (s/N): ', resolve);
            });
            rl.close();
            
            if (answer.toLowerCase() !== 's') {
                console.log('❌ Cancelado');
                return;
            }
        }
        
        // Dados de exemplo para desenvolvimento
        await transaction(async (client) => {
            // Verificar se já tem dados
            const count = await client.query('SELECT COUNT(*) FROM companies');
            if (count.rows[0].count > 0) {
                console.log('⚠️  Dados já existem. Pulando seed.');
                return;
            }
            
            console.log('➕ Adicionando empresa exemplo...');
            await client.query(`
                INSERT INTO companies (id, name, cnpj, created_at) 
                VALUES ('emp001', 'Nordeste Locações', '12.345.678/0001-90', NOW())
                ON CONFLICT DO NOTHING
            `);
            
            console.log('✅ Seed concluído!');
        });
    },

    // Resetar banco (⚠️ cuidado!)
    async reset() {
        console.log('\n⚠️  ⚠️  ⚠️  ATENÇÃO! ⚠️  ⚠️  ⚠️\n');
        console.log('Isso vai APAGAR TODOS OS DADOS!\n');
        
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        const answer = await new Promise(resolve => {
            rl.question('Digite "APAGAR TUDO" para confirmar: ', resolve);
        });
        rl.close();
        
        if (answer !== 'APAGAR TUDO') {
            console.log('❌ Cancelado');
            return;
        }
        
        console.log('\n💥 Resetando banco de dados...\n');
        
        await transaction(async (client) => {
            // Dropar todas as tabelas
            const tables = await client.query(`
                SELECT tablename FROM pg_tables WHERE schemaname = 'public'
            `);
            
            for (const table of tables.rows) {
                if (!table.tablename.startsWith('_')) {
                    await client.query(`DROP TABLE IF EXISTS "${table.tablename}" CASCADE`);
                    console.log(`   ❌ Dropped: ${table.tablename}`);
                }
            }
        });
        
        console.log('\n✅ Banco resetado! Execute "migrate" e "seed" novamente.');
    },

    // Backup
    async backup() {
        const { execSync } = require('child_process');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup_${timestamp}.sql`;
        
        console.log(`\n💾 Criando backup: ${filename}\n`);
        
        try {
            const env = require('../backend/config');
            const cmd = `pg_dump "${env.database.url}" > backups/${filename}`;
            execSync(cmd, { stdio: 'inherit' });
            console.log(`\n✅ Backup criado: backups/${filename}`);
        } catch (err) {
            console.log('\n❌ Erro ao criar backup. Instale pg_dump ou faça manualmente:');
            console.log('   pg_dump -U rhplus_user -h localhost rh > backup.sql');
        }
    },

    // Ajuda
    help() {
        console.log(`
🗄️  Gerenciador de Banco de Dados RH+

Uso: node scripts/db-manager.js [comando]

Comandos:
  status    - Ver status da conexão e tabelas
  migrate   - Executar migrações pendentes
  seed      - Popular com dados de exemplo
  reset     - ⚠️  APAGAR TUDO (cuidado!)
  backup    - Criar backup do banco
  help      - Mostrar esta ajuda

Exemplos:
  node scripts/db-manager.js status
  NODE_ENV=test node scripts/db-manager.js migrate
        `);
    }
};

// Execução principal
const cmd = process.argv[2] || 'help';

if (commands[cmd]) {
    commands[cmd]().catch(err => {
        console.error(`\n❌ Erro: ${err.message}`);
        process.exit(1);
    });
} else {
    console.log(`\n❌ Comando desconhecido: ${cmd}`);
    commands.help();
}
