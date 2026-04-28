/**
 * 🗄️ CONFIGURAÇÃO PROFISSIONAL DE BANCO DE DADOS
 * Suporte a múltiplos ambientes: dev | test | prod
 */

const { Pool } = require('pg');
require('dotenv').config();

// Detectar ambiente atual
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Configurações por ambiente
 */
const configs = {
    development: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'rh',
        user: process.env.DB_USER || 'rhplus_user',
        password: process.env.DB_PASSWORD || '12Nordeste34+',
    },
    test: {
        host: process.env.TEST_DB_HOST || process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.TEST_DB_PORT || process.env.DB_PORT || '5432'),
        database: process.env.TEST_DB_NAME || 'rh_test',
        user: process.env.TEST_DB_USER || process.env.DB_USER || 'rhplus_user',
        password: process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD || '12Nordeste34+',
    },
    production: {
        host: process.env.PROD_DB_HOST || process.env.DB_HOST,
        port: parseInt(process.env.PROD_DB_PORT || process.env.DB_PORT || '5432'),
        database: process.env.PROD_DB_NAME || process.env.DB_NAME || 'rh',
        user: process.env.PROD_DB_USER || process.env.DB_USER,
        password: process.env.PROD_DB_PASSWORD || process.env.DB_PASSWORD,
    }
};

// Usar DATABASE_URL se disponível (prioridade máxima)
function getConnectionConfig() {
    if (process.env.DATABASE_URL) {
        return { connectionString: process.env.DATABASE_URL };
    }
    return configs[NODE_ENV] || configs.development;
}

/**
 * Pool de conexões global
 */
let poolInstance = null;

function getPool() {
    if (!poolInstance) {
        const config = getConnectionConfig();
        
        poolInstance = new Pool({
            ...config,
            max: NODE_ENV === 'production' ? 20 : 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
        });

        poolInstance.on('connect', () => {
            console.log(`✅ [${NODE_ENV}] Conectado ao PostgreSQL: ${config.database || 'via URL'}`);
        });

        poolInstance.on('error', (err) => {
            console.error(`❌ [${NODE_ENV}] Erro no pool PostgreSQL:`, err.message);
        });
    }
    return poolInstance;
}

/**
 * Interface de banco compatível com SQLite (para facilitar migração)
 */
const db = {
    run(sql, params, callback) {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }
        getPool().query(sql, params, (err, result) => {
            if (err) callback(err);
            else callback(null, { lastID: result?.rows[0]?.id, changes: result?.rowCount });
        });
    },

    all(sql, params, callback) {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }
        getPool().query(sql, params, (err, result) => {
            if (err) callback(err);
            else callback(null, result?.rows || []);
        });
    },

    get(sql, params, callback) {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }
        getPool().query(sql, params, (err, result) => {
            if (err) callback(err);
            else callback(null, result?.rows[0] || null);
        });
    }
};

/**
 * Query assíncrona com logs
 */
async function query(text, params) {
    const start = Date.now();
    try {
        const result = await getPool().query(text, params);
        const duration = Date.now() - start;
        if (NODE_ENV === 'development') {
            console.log(`📝 Query (${duration}ms): ${text.substring(0, 50)}... | Rows: ${result.rowCount}`);
        }
        return result;
    } catch (error) {
        console.error('❌ Erro na query:', { text: text.substring(0, 100), error: error.message });
        throw error;
    }
}

/**
 * Transações
 */
async function transaction(callback) {
    const client = await getPool().connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Verificar conexão
 */
async function checkConnection() {
    try {
        const result = await query('SELECT NOW() as now, version() as version');
        return {
            connected: true,
            timestamp: result.rows[0].now,
            version: result.rows[0].version,
            environment: NODE_ENV
        };
    } catch (error) {
        return {
            connected: false,
            error: error.message,
            environment: NODE_ENV
        };
    }
}

/**
 * Trocar banco de dados dinamicamente (útil para testes)
 */
function switchDatabase(newConfig) {
    if (poolInstance) {
        poolInstance.end();
        poolInstance = null;
    }
    Object.assign(configs[NODE_ENV], newConfig);
    return getPool();
}

module.exports = {
    db,
    query,
    transaction,
    getPool,
    checkConnection,
    switchDatabase,
    NODE_ENV,
    configs
};
