/**
 * 🚀 Migration: Criar tabela onboarding_steps
 * Execute: node backend/migrations/setup_onboarding.js
 */

const { query } = require('../config/database');

const SQL = `
CREATE TABLE IF NOT EXISTS onboarding_steps (
    id SERIAL PRIMARY KEY,
    employee_id TEXT NOT NULL,
    momento TEXT NOT NULL,
    nome_encontro TEXT NOT NULL,
    responsavel TEXT,
    pauta_sugerida TEXT,
    como_fazer TEXT,
    status TEXT DEFAULT 'Pendente',
    data_prevista DATE,
    data_realizada DATE,
    anotacao TEXT,
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_employee ON onboarding_steps(employee_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_status ON onboarding_steps(status);
`;

async function setup() {
    console.log('🎯 Criando tabela onboarding_steps...');
    try {
        await query(SQL);
        console.log('✅ Tabela onboarding_steps criada/verificada com sucesso!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Erro:', err.message);
        process.exit(1);
    }
}

setup();
