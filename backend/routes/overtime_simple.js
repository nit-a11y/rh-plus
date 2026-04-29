/**
 * ROTAS SIMPLES PARA ANÁLISE DE HORA EXTRA
 * Baseadas nos dados reais da tabela overtime_records
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

/**
 * GET /api/overtime/summary
 * Retorna resumo geral dos dados
 */
router.get('/summary', async (req, res) => {
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

/**
 * GET /api/overtime/evolution
 * Retorna dados de evolução por mês e unidade
 */
router.get('/evolution', async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                mes,
                unidade,
                COUNT(*) as total_registros,
                COUNT(DISTINCT employee_id) as colaboradores,
                COALESCE(SUM(CAST(REPLACE(valor, ',', '.') AS REAL)), 0) as valor_total,
                COALESCE(ROUND(AVG(CAST(REPLACE(valor, ',', '.') AS REAL)), 2), 0) as valor_medio
            FROM overtime_records 
            WHERE valor IS NOT NULL AND valor != ''
            AND mes IS NOT NULL AND mes != ''
            AND unidade IS NOT NULL AND unidade != ''
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

/**
 * GET /api/overtime/units
 * Retorna dados por unidade
 */
router.get('/units', async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                unidade,
                COUNT(*) as total_registros,
                COUNT(DISTINCT employee_id) as colaboradores,
                COALESCE(SUM(CAST(REPLACE(valor, ',', '.') AS REAL)), 0) as valor_total,
                COALESCE(ROUND(AVG(CAST(REPLACE(valor, ',', '.') AS REAL)), 2), 0) as valor_medio
            FROM overtime_records 
            WHERE unidade IS NOT NULL AND unidade != ''
            AND valor IS NOT NULL AND valor != ''
            GROUP BY unidade
            ORDER BY valor_total DESC
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

/**
 * GET /api/overtime/top-employees
 * Retorna top colaboradores
 */
router.get('/top-employees', async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                nome,
                COUNT(*) as registros,
                COUNT(DISTINCT mes) as meses,
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
            data: result.rows
        });
    } catch (error) {
        console.error('Erro em /top-employees:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
