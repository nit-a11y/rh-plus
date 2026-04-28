#!/usr/bin/env node
/**
 * 🌱 SEED USERS - Popula usuários iniciais no sistema
 * Para ambiente de desenvolvimento/teste
 */

const { query } = require('../backend/config/database');
const crypto = require('crypto');

const generateId = () => crypto.randomBytes(4).toString('hex');

const USUARIOS = [
    { nome: "CAIQUE CUSTODIO", role: "DEV" },
    { nome: "ERIKA BETHANIA RIZZA MACHADO", role: "GESTOR" },
    { nome: "TAIS CORDEIRO NOBRE", role: "USER" },
    { nome: "ANA FABRICIA PEREIRA DA SILVA", role: "USER" },
    { nome: "NATHANAEL OLIVEIRA SOEIRO", role: "USER" }
];

const SENHA_PADRAO = "123456";

async function seedUsers() {
    console.log('🌱 Iniciando seed de usuários...\n');
    
    try {
        // Verificar se tabela existe
        const tableCheck = await query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'users'
            )
        `);
        
        if (!tableCheck.rows[0].exists) {
            console.log('❌ Tabela users não existe. Crie as tabelas primeiro.');
            console.log('   Execute: npm run db:migrate');
            process.exit(1);
        }
        
        let criados = 0;
        let atualizados = 0;
        
        for (const user of USUARIOS) {
            const id = generateId();
            const username = user.nome.split(' ')[0].toLowerCase();
            const photoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nome)}&background=D32F2F&color=fff&size=256`;
            
            // Verificar se usuário existe
            const existing = await query(
                'SELECT id FROM users WHERE username = $1',
                [username]
            );
            
            if (existing.rows.length > 0) {
                // Atualizar
                await query(
                    'UPDATE users SET role = $1, name = $2 WHERE id = $3',
                    [user.role, user.nome, existing.rows[0].id]
                );
                console.log(`🔄 Atualizado: ${user.nome} -> ${user.role}`);
                atualizados++;
            } else {
                // Criar novo
                await query(
                    `INSERT INTO users (id, name, username, password, "photoUrl", role, permissions) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [id, user.nome, username, SENHA_PADRAO, photoUrl, user.role, '{}']
                );
                console.log(`✅ Criado: ${user.nome} -> ${user.role}`);
                criados++;
            }
        }
        
        console.log(`\n📊 Resumo: ${criados} criados, ${atualizados} atualizados`);
        console.log('✅ Seed concluído!\n');
        
    } catch (err) {
        console.error('❌ Erro:', err.message);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    seedUsers();
}

module.exports = { seedUsers };
