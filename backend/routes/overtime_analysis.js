/**
 * APIs OTIMIZADAS PARA ANÁLISE DE HORA EXTRA
 * Baseadas na estrutura real da tabela overtime_records (953 registros)
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

/**
 * GET /api/overtime/evolution
 * Retorna dados de evolução de horas extras por mês
 */
router.get('/evolution', async (req, res) => {
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

/**
 * GET /api/overtime/units
 * Retorna lista de unidades com horas extras
 */
router.get('/units', async (req, res) => {
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

/**
 * GET /api/overtime/dashboard
 * Retorna dados consolidados para o dashboard
 */
router.get('/dashboard', async (req, res) => {
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

        // Distribuição por unidade
        const distribuicao = await query(`
            SELECT 
                unidade,
                COUNT(*) as registros,
                SUM(CAST(REPLACE(valor, ',', '.') AS REAL)) as valor_total,
                COUNT(DISTINCT employee_id) as colaboradores
            FROM overtime_records 
            WHERE unidade IS NOT NULL AND unidade != ''
            AND valor IS NOT NULL AND valor != ''
            GROUP BY unidade
            ORDER BY valor_total DESC
        `);

        res.json({
            success: true,
            data: {
                geral: geral.rows[0] || {},
                top_colaboradores: topColaboradores.rows,
                distribuicao_por_unidade: distribuicao.rows
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

/**
 * GET /api/overtime/summary
 * Retorna resumo geral para cards
 */
router.get('/summary', async (req, res) => {
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

/**
 * GET /api/overtime/colaboradores
 * Retorna lista de colaboradores com filtros
 */
router.get('/colaboradores', async (req, res) => {
    try {
        const { unidade, mes, limit = 50 } = req.query;
        
        let whereClause = 'WHERE nome IS NOT NULL AND nome != \'\' AND valor IS NOT NULL AND valor != \'\'';
        const params = [];
        
        if (unidade) {
            whereClause += ' AND unidade = ?';
            params.push(unidade);
        }
        
        if (mes) {
            whereClause += ' AND mes = ?';
            params.push(mes);
        }
        
        const colaboradores = await query(`
            SELECT 
                id,
                employee_id,
                nome,
                unidade,
                mes,
                extra,
                CAST(REPLACE(valor, ',', '.') AS REAL) as valor,
                created_at,
                created_by
            FROM overtime_records 
            ${whereClause}
            ORDER BY CAST(REPLACE(valor, ',', '.') AS REAL) DESC
            LIMIT ?
        `, [...params, parseInt(limit)]);

        res.json({
            success: true,
            data: colaboradores.rows
        });
    } catch (error) {
        console.error('Erro em /colaboradores:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao buscar colaboradores'
        });
    }
});

module.exports = router;
