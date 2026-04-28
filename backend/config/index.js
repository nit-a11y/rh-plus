/**
 * ⚙️ CONFIGURAÇÃO CENTRAL DO SISTEMA RH+
 * Todas as configurações em um único lugar
 */

require('dotenv').config();

const NODE_ENV = process.env.NODE_ENV || 'development';

const config = {
    // Ambiente
    env: NODE_ENV,
    isDev: NODE_ENV === 'development',
    isTest: NODE_ENV === 'test',
    isProd: NODE_ENV === 'production',

    // Servidor
    server: {
        port: parseInt(process.env.PORT || '3001'),
        host: process.env.HOST || '0.0.0.0',
    },

    // Banco de Dados
    database: {
        // Construir URL de conexão baseado no ambiente
        get url() {
            if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
            
            const env = NODE_ENV;
            const prefix = env === 'production' ? 'PROD_' : env === 'test' ? 'TEST_' : '';
            
            const host = process.env[`${prefix}DB_HOST`] || process.env.DB_HOST || 'localhost';
            const port = process.env[`${prefix}DB_PORT`] || process.env.DB_PORT || '5432';
            const name = process.env[`${prefix}DB_NAME`] || process.env.DB_NAME || 'rh';
            const user = process.env[`${prefix}DB_USER`] || process.env.DB_USER || 'rhplus_user';
            const pass = process.env[`${prefix}DB_PASSWORD`] || process.env.DB_PASSWORD || '12Nordeste34+';
            
            return `postgresql://${user}:${pass}@${host}:${port}/${name}`;
        },
        poolSize: NODE_ENV === 'production' ? 20 : 10,
    },

    // Segurança
    security: {
        jwtSecret: process.env.JWT_SECRET || 'sua-chave-secreta-desenvolvimento',
        sessionSecret: process.env.SESSION_SECRET || 'sessao-dev',
        bcryptRounds: NODE_ENV === 'production' ? 12 : 10,
    },

    // Logs
    logs: {
        level: process.env.LOG_LEVEL || (NODE_ENV === 'production' ? 'warn' : 'debug'),
        enabled: true,
    },

    // Email (opcional)
    email: {
        enabled: !!(process.env.SMTP_HOST && process.env.SMTP_USER),
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },

    // Recursos específicos por ambiente
    features: {
        // Em dev: mais logs, seed data, hot reload
        // Em prod: cache, compressão, rate limiting
        seedData: NODE_ENV === 'development',
        detailedErrors: NODE_ENV !== 'production',
        queryLogging: NODE_ENV === 'development',
    },

    // Caminhos
    paths: {
        public: '../public',
        uploads: '../uploads',
        logs: '../logs',
    },
};

// Validação de configuração crítica
function validate() {
    const errors = [];
    
    if (!config.security.jwtSecret || config.security.jwtSecret.length < 20) {
        if (config.isProd) {
            errors.push('JWT_SECRET deve ter pelo menos 20 caracteres em produção');
        }
    }
    
    if (config.isProd && config.security.jwtSecret.includes('desenvolvimento')) {
        errors.push('JWT_SECRET está usando valor padrão de desenvolvimento em produção!');
    }
    
    if (errors.length > 0) {
        console.error('❌ Erros de configuração:');
        errors.forEach(e => console.error(`   - ${e}`));
        if (config.isProd) {
            process.exit(1);
        }
    }
    
    return errors.length === 0;
}

// Exibir configuração atual (sem senhas)
function print() {
    const safeConfig = {
        env: config.env,
        server: config.server,
        database: {
            url: config.database.url.replace(/:[^:@]+@/, ':***@'),
            poolSize: config.database.poolSize,
        },
        features: config.features,
    };
    
    console.log('\n⚙️  Configuração RH+:');
    console.log(JSON.stringify(safeConfig, null, 2));
    console.log('');
}

module.exports = {
    ...config,
    validate,
    print,
};
