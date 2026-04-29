const express = require('express');
const cors = require('cors');
const path = require('path');

// Importar rotas de população
const populationRoutes = require('./routes/population');

const app = express();
const PORT = 3001;

// Middlewares básicos
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Rotas
app.use('/api/population', populationRoutes);

// Rota de teste
app.get('/test', (req, res) => {
    res.json({ success: true, message: 'Servidor funcionando!' });
});

// Rota principal
app.get('/populacao', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/populacao.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log(`Acesse o módulo: http://localhost:${PORT}/populacao`);
});

// Testar APIs após iniciar
setTimeout(async () => {
    try {
        console.log('\nTestando APIs...');
        
        const tests = [
            { name: 'Summary', url: 'http://localhost:3001/api/population/summary' },
            { name: 'Units', url: 'http://localhost:3001/api/population/units' },
            { name: 'Trends', url: 'http://localhost:3001/api/population/trends' }
        ];
        
        for (const test of tests) {
            try {
                const response = await fetch(test.url);
                const data = await response.json();
                console.log(`\u2705 ${test.name}: ${response.status} - ${data.success ? 'OK' : 'ERROR'}`);
                if (data.data && Array.isArray(data.data)) {
                    console.log(`   Registros: ${data.data.length}`);
                }
            } catch (error) {
                console.log(`\u274c ${test.name}: ${error.message}`);
            }
        }
        
    } catch (error) {
        console.error('Erro nos testes:', error);
    }
}, 2000);
