const express = require('express');
const { query } = require('./config/database');

const app = express();
app.use(express.json());

// CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Rota de teste
app.get('/test', (req, res) => {
    res.json({ message: 'Servidor funcionando!' });
});

// API Summary
app.get('/api/overtime/summary', async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                COUNT(*) as total_registros,
                COUNT(DISTINCT employee_id) as colaboradores,
                COUNT(DISTINCT unidade) as unidades,
                COALESCE(SUM(CAST(REPLACE(valor, ',', '.') AS REAL)), 0) as valor_total,
                COALESCE(ROUND(AVG(CAST(REPLACE(valor, ',', '.') AS REAL)), 2), 0) as valor_medio
            FROM overtime_records 
            WHERE valor IS NOT NULL AND valor != ''
        `);

        const data = result.rows[0] || {
            total_registros: 0,
            colaboradores: 0,
            unidades: 0,
            valor_total: 0,
            valor_medio: 0
        };

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Erro em /summary:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// API Evolution
app.get('/api/overtime/evolution', async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                mes,
                COUNT(*) as total_registros,
                COUNT(DISTINCT employee_id) as colaboradores,
                COALESCE(SUM(CAST(REPLACE(valor, ',', '.') AS REAL)), 0) as valor_total,
                COALESCE(ROUND(AVG(CAST(REPLACE(valor, ',', '.') AS REAL)), 2), 0) as valor_medio,
                unidade
            FROM overtime_records 
            WHERE valor IS NOT NULL AND valor != ''
            GROUP BY mes, unidade
            ORDER BY mes DESC, unidade
        `);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Erro em /evolution:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// API Units
app.get('/api/overtime/units', async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                DISTINCT unidade,
                COUNT(*) as total_registros,
                COUNT(DISTINCT employee_id) as colaboradores,
                COALESCE(SUM(CAST(REPLACE(valor, ',', '.') AS REAL)), 0) as valor_total
            FROM overtime_records 
            WHERE unidade IS NOT NULL AND unidade != ''
            GROUP BY unidade
            ORDER BY unidade
        `);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Erro em /units:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// API Dashboard
app.get('/api/overtime/dashboard', async (req, res) => {
    try {
        // Dados gerais
        const geral = await query(`
            SELECT 
                COUNT(*) as total_registros,
                COUNT(DISTINCT employee_id) as colaboradores,
                COUNT(DISTINCT unidade) as unidades,
                COALESCE(SUM(CAST(REPLACE(valor, ',', '.') AS REAL)), 0) as valor_total,
                COALESCE(ROUND(AVG(CAST(REPLACE(valor, ',', '.') AS REAL)), 2), 0) as valor_medio,
                COALESCE(MAX(CAST(REPLACE(valor, ',', '.') AS REAL)), 0) as maior_valor,
                COALESCE(MIN(CAST(REPLACE(valor, ',', '.') AS REAL)), 0) as menor_valor
            FROM overtime_records 
            WHERE valor IS NOT NULL AND valor != ''
        `);

        // Top colaboradores
        const topColaboradores = await query(`
            SELECT 
                nome,
                COUNT(*) as registros,
                COALESCE(SUM(CAST(REPLACE(valor, ',', '.') AS REAL)), 0) as valor_total,
                COALESCE(ROUND(AVG(CAST(REPLACE(valor, ',', '.') AS REAL)), 2), 0) as valor_medio
            FROM overtime_records 
            WHERE nome IS NOT NULL AND nome != '' 
            AND valor IS NOT NULL AND valor != ''
            GROUP BY nome
            ORDER BY valor_total DESC
            LIMIT 10
        `);

        res.json({
            success: true,
            data: {
                geral: geral.rows[0] || {},
                top_colaboradores: topColaboradores.rows
            }
        });
    } catch (error) {
        console.error('Erro em /dashboard:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Iniciar servidor
const PORT = 3004;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log('APIs disponíveis:');
    console.log(`- http://localhost:${PORT}/test`);
    console.log(`- http://localhost:${PORT}/api/overtime/summary`);
});
