/**
 * SERVIDOR DE TESTE DAS APIs OVERTIME
 * Para verificar se as rotas estão funcionando corretamente
 */

const express = require('express');
const { query } = require('./config/database');

const app = express();
app.use(express.json());

// Middleware de CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// API de Summary
app.get('/api/overtime/summary', async (req, res) => {
    try {
        const summary = await query(`
            SELECT 
                COUNT(*) as total_registros,
                COUNT(DISTINCT employee_id) as colaboradores,
                COUNT(DISTINCT unidade) as unidades,
                SUM(CAST(REPLACE(valor, ',', '.') AS REAL)) as valor_total,
                ROUND(AVG(CAST(REPLACE(valor, ',', '.') AS REAL)), 2) as valor_medio
            FROM overtime_records 
            WHERE valor IS NOT NULL AND valor != ''
        `);

        res.json({
            success: true,
            data: summary.rows[0] || {
                total_registros: 0,
                colaboradores: 0,
                unidades: 0,
                valor_total: 0,
                valor_medio: 0
            }
        });
    } catch (error) {
        console.error('Erro em /summary:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar resumo'
        });
    }
});

// API de Evolution
app.get('/api/overtime/evolution', async (req, res) => {
    try {
        const evolution = await query(`
            SELECT 
                mes,
                COUNT(*) as total_registros,
                COUNT(DISTINCT employee_id) as colaboradores,
                SUM(CAST(REPLACE(valor, ',', '.') AS REAL)) as valor_total,
                ROUND(AVG(CAST(REPLACE(valor, ',', '.') AS REAL)), 2) as valor_medio,
                unidade
            FROM overtime_records 
            WHERE valor IS NOT NULL AND valor != ''
            GROUP BY mes, unidade
            ORDER BY mes DESC, unidade
        `);

        res.json({
            success: true,
            data: evolution.rows
        });
    } catch (error) {
        console.error('Erro em /evolution:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar dados de evolução'
        });
    }
});

// API de Units
app.get('/api/overtime/units', async (req, res) => {
    try {
        const units = await query(`
            SELECT 
                DISTINCT unidade,
                COUNT(*) as total_registros,
                COUNT(DISTINCT employee_id) as colaboradores,
                SUM(CAST(REPLACE(valor, ',', '.') AS REAL)) as valor_total
            FROM overtime_records 
            WHERE unidade IS NOT NULL AND unidade != ''
            GROUP BY unidade
            ORDER BY unidade
        `);

        res.json({
            success: true,
            data: units.rows
        });
    } catch (error) {
        console.error('Erro em /units:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar unidades'
        });
    }
});

// API de Dashboard
app.get('/api/overtime/dashboard', async (req, res) => {
    try {
        // Dados gerais
        const geral = await query(`
            SELECT 
                COUNT(*) as total_registros,
                COUNT(DISTINCT employee_id) as colaboradores,
                COUNT(DISTINCT unidade) as unidades,
                SUM(CAST(REPLACE(valor, ',', '.') AS REAL)) as valor_total,
                ROUND(AVG(CAST(REPLACE(valor, ',', '.') AS REAL)), 2) as valor_medio,
                MAX(CAST(REPLACE(valor, ',', '.') AS REAL)) as maior_valor,
                MIN(CAST(REPLACE(valor, ',', '.') AS REAL)) as menor_valor
            FROM overtime_records 
            WHERE valor IS NOT NULL AND valor != ''
        `);

        // Top colaboradores
        const topColaboradores = await query(`
            SELECT 
                nome,
                COUNT(*) as registros,
                SUM(CAST(REPLACE(valor, ',', '.') AS REAL)) as valor_total,
                ROUND(AVG(CAST(REPLACE(valor, ',', '.') AS REAL)), 2) as valor_medio
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
            error: 'Erro ao buscar dados do dashboard'
        });
    }
});

// Rota de teste
app.get('/test', (req, res) => {
    res.json({ message: 'APIs de overtime funcionando!' });
});

const PORT = 3003;
app.listen(PORT, () => {
    console.log(`Servidor de teste rodando em http://localhost:${PORT}`);
    console.log('Teste as APIs:');
    console.log(`- http://localhost:${PORT}/test`);
    console.log(`- http://localhost:${PORT}/api/overtime/summary`);
    console.log(`- http://localhost:${PORT}/api/overtime/evolution`);
    console.log(`- http://localhost:${PORT}/api/overtime/units`);
    console.log(`- http://localhost:${PORT}/api/overtime/dashboard`);
});

module.exports = app;
