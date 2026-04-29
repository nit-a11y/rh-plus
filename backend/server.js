/**
 * 🚀 RH+ SERVER - Sistema Profissional de Gestão de RH
 * Node.js + Express + PostgreSQL
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const fs = require('fs');

// Configurações
const config = require('./config');
const { checkConnection } = require('./config/database');

// Validação de configuração
config.validate();

const app = express();
const PORT = config.server.port;
const NODE_ENV = config.env;

// Segurança - Helmet headers (ajustado para permitir recursos do frontend)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'", "https://assets.mixkit.co"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.tailwindcss.com", "https://unpkg.com", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
            scriptSrcAttr: ["'unsafe-inline'"],  // Permite onclick, onchange inline
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "blob:", "https:"],
            mediaSrc: ["'self'", "https://assets.mixkit.co"],
            connectSrc: ["'self'", "http://localhost:*", "https:"],
        },
    },
}));

// Compressão gzip
app.use(compression());

// Rate limiting (proteção contra ataques)
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: NODE_ENV === 'production' ? 100 : 1000, // limite de requests
    message: { success: false, error: 'Muitas requisições. Tente novamente mais tarde.' }
});

// Rate limit específico para APIs de população (mais permissivo)
const populationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: NODE_ENV === 'production' ? 500 : 5000, // limite maior para população
    message: { success: false, error: 'Muitas requisições. Tente novamente mais tarde.' }
});

app.use('/api/', generalLimiter);
app.use('/api/population', populationLimiter);

// CORS
app.use(cors({
    origin: NODE_ENV === 'production' 
        ? ['https://seudominio.com'] 
        : ['http://localhost:3001', 'http://127.0.0.1:3001'],
    credentials: true
}));

// Logs
if (NODE_ENV === 'production') {
    // Em produção, salva em arquivo
    const logStream = fs.createWriteStream(path.join(__dirname, '../logs/access.log'), { flags: 'a' });
    app.use(morgan('combined', { stream: logStream }));
} else {
    // Em dev, mostra no console
    app.use(morgan('dev'));
}

// Body parser
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Arquivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

const authMiddleware = require('./middleware/auth');

app.use('/api', authMiddleware);

const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const employeeProRoutes = require('./routes/employees_pro');
const companyRoutes = require('./routes/companies');
const uniformRoutes = require('./routes/uniforms');
const occurrenceRoutes = require('./routes/occurrences');
const careerRoutes = require('./routes/career');
const asoRoutes = require('./routes/aso');
const sstRoutes = require('./routes/sst');
const vacationRoutes = require('./routes/vacations');
const rolesRoutes = require('./routes/roles');
const kitsRoutes = require('./routes/kits');
const humanCenterRoutes = require('./routes/human_center');
const profileRoutes = require('./routes/profile');
const activityRoutes = require('./routes/activity');
const toolsRoutes = require('./routes/tools');
const transferRoutes = require('./routes/transfers');
const archiveRoutes = require('./routes/archive');
const overtimeRoutes = require('./routes/overtime');
const analysisRoutes = require('./routes/analysis');
const recruitmentRoutes = require('./routes/recruitment');
const onboardingRoutes = require('./routes/onboarding');
const notificationRoutes = require('./routes/notifications');
const headcountRoutes = require('./routes/headcount');
const populationRoutes = require('./routes/population');
const populationHistoricoRoutes = require('./routes/population-historico');
const overtimeAnalysisRoutes = require('./routes/overtime_analysis');
const overtimeSimpleRoutes = require('./routes/overtime_simple');

app.use('/api', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/employees-pro', employeeProRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api', uniformRoutes);
app.use('/api/occurrences', occurrenceRoutes);
app.use('/api/career', careerRoutes);
app.use('/api/aso', asoRoutes);
app.use('/api/sst', sstRoutes);
app.use('/api/vacations', vacationRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/kits', kitsRoutes);
app.use('/api/human-center', humanCenterRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/tools', toolsRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/archive', archiveRoutes);
app.use('/api/overtime', overtimeRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/recruitment', recruitmentRoutes);
app.use('/api', onboardingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/headcount', headcountRoutes);
app.use('/api/population', populationRoutes);
app.use('/api/population-historico', populationHistoricoRoutes);
app.use('/api/overtime', overtimeSimpleRoutes);

// Removido app.use('/api/overtime', overtimeAnalysisRoutes);

app.use('/api', (req, res) => {
    res.status(404).json({ success: false, error: `Rota de API não encontrada: ${req.originalUrl}` });
});

app.get('*', (req, res) => {
    const p = req.path;
    if (p === '/login') res.sendFile(path.join(__dirname, '../public/login.html'));
    else if (p === '/colaboradores-pro') res.sendFile(path.join(__dirname, '../public/employees-pro.html'));
    else if (p === '/fardamento') res.sendFile(path.join(__dirname, '../public/uniforms-module.html'));
    else if (p === '/ferramentas') res.sendFile(path.join(__dirname, '../public/tools-module.html'));
    else if (p === '/carreira') res.sendFile(path.join(__dirname, '../public/carreira.html'));
    else if (p === '/treinamento') res.sendFile(path.join(__dirname, '../public/treinamento.html'));
    else if (p === '/kits') res.sendFile(path.join(__dirname, '../public/kit.html'));
    else if (p === '/colaboradores') res.sendFile(path.join(__dirname, '../public/colaboradores.html'));
    else if (p === '/human-center') res.sendFile(path.join(__dirname, '../public/human-center.html'));
    else if (p === '/perfil') res.sendFile(path.join(__dirname, '../public/perfil.html'));
    else if (p === '/analise-hora-extra') res.sendFile(path.join(__dirname, '../public/analise-hora-extra.html'));
    else if (p === '/aso.html') res.sendFile(path.join(__dirname, '../public/aso.html'));
    else if (p === '/vacation.html') res.sendFile(path.join(__dirname, '../public/vacation-unified.html'));
    else if (p === '/acessos.html') res.sendFile(path.join(__dirname, '../public/acessos.html'));
        else if (p === '/transferencias') res.sendFile(path.join(__dirname, '../public/transfer-management.html'));
    else if (p === '/test-transfer') res.sendFile(path.join(__dirname, '../test-transfer.html'));
    else if (p === '/recrutamento') res.sendFile(path.join(__dirname, '../public/recrutamento.html'));
    else if (p === '/onboarding-90dias' || p === '/onboarding') res.sendFile(path.join(__dirname, '../public/onboarding-90dias.html'));
    else if (p === '/populacao') res.sendFile(path.join(__dirname, '../public/populacao.html'));
    else res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

// Health check endpoint
app.get('/health', async (req, res) => {
    const dbStatus = await checkConnection();
    res.json({
        status: dbStatus.connected ? 'ok' : 'error',
        timestamp: new Date().toISOString(),
        environment: NODE_ENV,
        database: dbStatus.connected ? 'connected' : 'disconnected',
        version: '2.0.0'
    });
});

// Tratamento de erros global
app.use((err, req, res, next) => {
    console.error('❌ ERRO NA API:', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method
    });
    res.status(500).json({
        success: false,
        error: NODE_ENV === 'production' 
            ? 'Erro interno do servidor' 
            : err.message,
        path: req.originalUrl
    });
});

// Inicialização
async function startServer() {
    // Verificar conexão com banco
    const dbStatus = await checkConnection();
    if (!dbStatus.connected) {
        console.error('❌ Não foi possível conectar ao PostgreSQL!');
        console.error('   Erro:', dbStatus.error);
        console.error('   Verifique seu .env e se o PostgreSQL está rodando.');
        process.exit(1);
    }
    
    // Criar pasta de logs se não existir
    const logsDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // Iniciar servidor
    app.listen(PORT, config.server.host, () => {
        console.log('\n' + '='.repeat(60));
        console.log('🚀 RH+ - Sistema Profissional de Gestão de RH');
        console.log('='.repeat(60));
        console.log(`📡 Ambiente: ${NODE_ENV.toUpperCase()}`);
        console.log(`🌐 URL: http://${config.server.host}:${PORT}`);
        console.log(`🗄️  Banco: PostgreSQL (${dbStatus.version.split(' ')[0]})`);
        console.log(`🕐 Iniciado: ${new Date().toLocaleString()}`);
        console.log('='.repeat(60) + '\n');
        
        if (NODE_ENV === 'development') {
            console.log('💡 Dica: Use npm run dev para hot-reload\n');
        }
    });
}

startServer().catch(err => {
    console.error('❌ Erro fatal na inicialização:', err);
    process.exit(1);
});
