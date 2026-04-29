/**
 * 📊 MÓDULO DE ANÁLISE DE HORA EXTRA
 * Backend dedicado à análise de dados com consultas SQL otimizadas
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// ROTA: Dashboard principal com métricas gerais (CORRETO - separação EVENTO vs POPULAÇÃO)
router.get('/dashboard', async (req, res) => {
    try {
        const { year, month, unit } = req.query;
        
        // Usar a camada de serviço analítico com separação conceitual correta
        const analyticsService = require('../services/analyticsService');
        const result = await analyticsService.getDashboard(year, month, unit);
        
        console.log('Dashboard Route - Resultado completo do serviço:', result);
        console.log('Dashboard Route - Campos de período:', {
            mes_mais_registros: result.mes_mais_registros,
            mes_maior_valor: result.mes_maior_valor
        });
        
        res.json({
            success: true,
            data: {
                // Métricas diretas de overtime_records
                total_records: result.total_registros,
                total_value: result.total_valor,
                total_hours: result.total_horas,
                total_hours_decimal: result.total_hours_decimal,
                
                // Métricas calculadas
                media_horas: result.media_horas_por_registro,
                media_valor: result.media_valor_por_hora,
                
                // Métricas de período
                mes_mais_registros: result.mes_mais_registros,
                mes_maior_valor: result.mes_maior_valor
            }
        });
    } catch (err) {
        console.error('Erro no dashboard:', err);
        res.status(500).json({ error: err.message });
    }
});

// ROTA: Análise por período (evolução mensal)
router.get('/evolution', async (req, res) => {
    try {
        const { year } = req.query;
        
        let sql = `
            SELECT 
                o.mes,
                EXTRACT(MONTH FROM TO_DATE(SPLIT_PART(o.mes, ' ', 2), 'YYYY-MM-DD')) as mes_num,
                EXTRACT(YEAR FROM TO_DATE(SPLIT_PART(o.mes, ' ', 2), 'YYYY-MM-DD')) as ano_num,
                COUNT(*) as registros,
                COUNT(DISTINCT o.employee_id) as colaboradores,
                COALESCE(SUM(o.valor), 0) as valor_total,
                -- Calcular horas do mês
                COALESCE(SUM(
                    CASE 
                        WHEN o.extra ~ '^[0-9]{1,2}:[0-9]{2}$' THEN
                            CAST(SPLIT_PART(o.extra, ':', 1) AS INTEGER) * 60 +
                            CAST(SPLIT_PART(o.extra, ':', 2) AS INTEGER)
                        ELSE 0
                    END
                ), 0) as minutos_totais
            FROM overtime_records o
            WHERE 1=1
        `;
        
        const params = [];
        if (year) {
            sql += ` AND o.mes ILIKE $1`;
            params.push(`%${year}%`);
        }
        
        sql += ` GROUP BY o.mes ORDER BY ano_num DESC, mes_num DESC`;
        
        const result = await query(sql, params);
        
        // Formatar dados
        const formatted = result.rows.map(row => ({
            mes: row.mes,
            mes_num: parseInt(row.mes_num),
            ano_num: parseInt(row.ano_num),
            registros: parseInt(row.registros),
            colaboradores: parseInt(row.colaboradores),
            valor_total: parseFloat(row.valor_total),
            horas_totais: row.minutos_totais ? Math.floor(row.minutos_totais / 60) : 0,
            minutos_totais: row.minutos_totais % 60 || 0,
            horas_formatadas: row.minutos_totais ? 
                `${Math.floor(row.minutos_totais / 60).toString().padStart(2, '0')}:${(row.minutos_totais % 60).toString().padStart(2, '0')}` 
                : '00:00'
        }));
        
        res.json({ success: true, data: formatted });
    } catch (err) {
        console.error('Erro na evolução:', err);
        res.status(500).json({ error: err.message });
    }
});

// ROTA: Top colaboradores por horas extras
router.get('/top-employees', async (req, res) => {
    try {
        const { year, month, limit = 10 } = req.query;
        
        let sql = `
            SELECT 
                e.id,
                e.name,
                e."registrationNumber",
                e.role,
                e.sector,
                COUNT(*) as total_registros,
                COALESCE(SUM(o.valor), 0) as valor_total,
                -- Calcular horas totais do colaborador
                COALESCE(SUM(
                    CASE 
                        WHEN o.extra ~ '^[0-9]{1,2}:[0-9]{2}$' THEN
                            CAST(SPLIT_PART(o.extra, ':', 1) AS INTEGER) * 60 +
                            CAST(SPLIT_PART(o.extra, ':', 2) AS INTEGER)
                        ELSE 0
                    END
                ), 0) as minutos_totais
            FROM employees e
            JOIN overtime_records o ON e.id = o.employee_id
            WHERE 1=1
        `;
        
        const params = [];
        let paramIndex = 0;
        
        if (year) {
            paramIndex++;
            sql += ` AND o.mes ILIKE $${paramIndex}`;
            params.push(`%${year}%`);
        }
        
        if (month) {
            paramIndex++;
            sql += ` AND o.mes ILIKE $${paramIndex}`;
            params.push(`%${month}%`);
        }
        
        sql += ` GROUP BY e.id, e.name, e."registrationNumber", e.role, e.sector 
                 ORDER BY minutos_totais DESC, valor_total DESC 
                 LIMIT $${paramIndex + 1}`;
        
        params.push(parseInt(limit));
        
        const result = await query(sql, params);
        
        // Formatar dados
        const formatted = result.rows.map(row => ({
            id: row.id,
            name: row.name,
            registrationNumber: row.registrationNumber,
            role: row.role,
            sector: row.sector,
            total_registros: parseInt(row.total_registros),
            valor_total: parseFloat(row.valor_total),
            horas_totais: Math.floor((row.minutos_totais || 0) / 60),
            minutos_totais: (row.minutos_totais || 0) % 60,
            horas_formatadas: row.minutos_totais ? 
                `${Math.floor(row.minutos_totais / 60).toString().padStart(2, '0')}:${(row.minutos_totais % 60).toString().padStart(2, '0')}` 
                : '00:00',
            media_horas: row.total_registros > 0 ? (row.minutos_totais / row.total_registros / 60) : 0
        }));
        
        res.json({ success: true, data: formatted });
    } catch (err) {
        console.error('Erro no top employees:', err);
        res.status(500).json({ error: err.message });
    }
});

// ROTA: Análise por setor/unidade
router.get('/by-sector', async (req, res) => {
    try {
        const { year, month } = req.query;
        
        let sql = `
            SELECT 
                e.sector,
                COUNT(DISTINCT e.id) as colaboradores,
                COUNT(*) as registros,
                COALESCE(SUM(o.valor), 0) as valor_total,
                -- Calcular horas totais por setor
                COALESCE(SUM(
                    CASE 
                        WHEN o.extra ~ '^[0-9]{1,2}:[0-9]{2}$' THEN
                            CAST(SPLIT_PART(o.extra, ':', 1) AS INTEGER) * 60 +
                            CAST(SPLIT_PART(o.extra, ':', 2) AS INTEGER)
                        ELSE 0
                    END
                ), 0) as minutos_totais
            FROM employees e
            JOIN overtime_records o ON e.id = o.employee_id
            WHERE 1=1 AND e.sector IS NOT NULL
        `;
        
        const params = [];
        let paramIndex = 0;
        
        if (year) {
            paramIndex++;
            sql += ` AND o.mes ILIKE $${paramIndex}`;
            params.push(`%${year}%`);
        }
        
        if (month) {
            paramIndex++;
            sql += ` AND o.mes ILIKE $${paramIndex}`;
            params.push(`%${month}%`);
        }
        
        sql += ` GROUP BY e.sector ORDER BY valor_total DESC`;
        
        const result = await query(sql, params);
        
        // Formatar dados
        const formatted = result.rows.map(row => ({
            setor: row.sector,
            colaboradores: parseInt(row.colaboradores),
            registros: parseInt(row.registros),
            valor_total: parseFloat(row.valor_total),
            horas_totais: Math.floor((row.minutos_totais || 0) / 60),
            minutos_totais: (row.minutos_totais || 0) % 60,
            horas_formatadas: row.minutos_totais ? 
                `${Math.floor(row.minutos_totais / 60).toString().padStart(2, '0')}:${(row.minutos_totais % 60).toString().padStart(2, '0')}` 
                : '00:00'
        }));
        
        res.json({ success: true, data: formatted });
    } catch (err) {
        console.error('Erro na análise por setor:', err);
        res.status(500).json({ error: err.message });
    }
});

// ROTA: Análise por unidade (workplace)
router.get('/by-unit', async (req, res) => {
    try {
        const { year, month } = req.query;
        
        let sql = `
            SELECT 
                COALESCE(o.unidade, 'Sem Unidade') as unidade,
                COUNT(DISTINCT o.employee_id) as colaboradores,
                COUNT(*) as registros,
                COALESCE(SUM(o.valor), 0) as valor_total,
                -- Calcular horas totais por unidade
                COALESCE(SUM(
                    CASE 
                        WHEN o.extra ~ '^[0-9]{1,2}:[0-9]{2}$' THEN
                            CAST(SPLIT_PART(o.extra, ':', 1) AS INTEGER) * 60 +
                            CAST(SPLIT_PART(o.extra, ':', 2) AS INTEGER)
                        ELSE 0
                    END
                ), 0) as minutos_totais
            FROM overtime_records o
            WHERE 1=1
        `;
        
        const params = [];
        let paramIndex = 0;
        
        if (year) {
            paramIndex++;
            sql += ` AND o.mes ILIKE $${paramIndex}`;
            params.push(`%${year}%`);
        }
        
        if (month) {
            paramIndex++;
            sql += ` AND o.mes ILIKE $${paramIndex}`;
            params.push(`%${month}%`);
        }
        
        sql += ` GROUP BY o.unidade ORDER BY valor_total DESC`;
        
        const result = await query(sql, params);
        
        // Formatar dados
        const formatted = result.rows.map(row => ({
            unidade: row.unidade,
            colaboradores: parseInt(row.colaboradores),
            registros: parseInt(row.registros),
            valor_total: parseFloat(row.valor_total),
            horas_totais: Math.floor((row.minutos_totais || 0) / 60),
            minutos_totais: (row.minutos_totais || 0) % 60,
            horas_formatadas: row.minutos_totais ? 
                `${Math.floor(row.minutos_totais / 60).toString().padStart(2, '0')}:${(row.minutos_totais % 60).toString().padStart(2, '0')}` 
                : '00:00'
        }));
        
        res.json({ success: true, data: formatted });
    } catch (err) {
        console.error('Erro na análise por unidade:', err);
        res.status(500).json({ error: err.message });
    }
});

// ROTA: Análise detalhada com filtros avançados
router.get('/detailed', async (req, res) => {
    try {
        const { 
            year, 
            month, 
            unit, 
            sector, 
            employee_id,
            page = 1,
            limit = 50 
        } = req.query;
        
        // SQL base com todos os joins necessários
        let sql = `
            SELECT 
                o.id,
                o.mes,
                o.unidade,
                o.nome,
                o.extra,
                o.valor,
                o.created_at,
                e.id as employee_id,
                e.name as employee_name,
                e."registrationNumber",
                e.role,
                e.sector,
                e.type,
                wp.name as workplace_name
            FROM overtime_records o
            JOIN employees e ON o.employee_id = e.id
            LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = '1'
            LEFT JOIN companies wp ON ev.workplace_id = wp.id
            WHERE 1=1
        `;
        
        const params = [];
        let paramIndex = 0;
        
        // Aplicar filtros
        if (year) {
            paramIndex++;
            sql += ` AND o.mes ILIKE $${paramIndex}`;
            params.push(`%${year}%`);
        }
        
        if (month) {
            paramIndex++;
            sql += ` AND o.mes ILIKE $${paramIndex}`;
            params.push(`%${month}%`);
        }
        
        if (unit) {
            paramIndex++;
            sql += ` AND o.unidade = $${paramIndex}`;
            params.push(unit);
        }
        
        if (sector) {
            paramIndex++;
            sql += ` AND e.sector = $${paramIndex}`;
            params.push(sector);
        }
        
        if (employee_id) {
            paramIndex++;
            sql += ` AND o.employee_id = $${paramIndex}`;
            params.push(employee_id);
        }
        
        // Contagem total para paginação
        const countSql = sql.replace('SELECT o.id, o.mes, o.unidade, o.nome, o.extra, o.valor, o.created_at, e.id as employee_id, e.name as employee_name, e."registrationNumber", e.role, e.sector, e.type, wp.name as workplace_name FROM overtime_records o JOIN employees e ON o.employee_id = e.id LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = \'1\' LEFT JOIN companies wp ON ev.workplace_id = wp.id WHERE 1=1', 'SELECT COUNT(*) as total FROM overtime_records o JOIN employees e ON o.employee_id = e.id LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = \'1\' LEFT JOIN companies wp ON ev.workplace_id = wp.id WHERE 1=1');
        
        const countResult = await query(countSql, params);
        const totalRecords = parseInt(countResult.rows[0]?.total || 0);
        
        // Adicionar paginação e ordenação
        const offset = (parseInt(page) - 1) * parseInt(limit);
        sql += ` ORDER BY o.created_at DESC LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}`;
        params.push(parseInt(limit), offset);
        
        const result = await query(sql, params);
        
        // Formatar dados
        const formatted = result.rows.map(row => ({
            id: row.id,
            mes: row.mes,
            unidade: row.unidade,
            nome: row.nome,
            extra: row.extra,
            valor: parseFloat(row.valor),
            created_at: row.created_at,
            employee: {
                id: row.employee_id,
                name: row.employee_name,
                registrationNumber: row.registrationNumber,
                role: row.role,
                sector: row.sector,
                type: row.type,
                workplace_name: row.workplace_name
            }
        }));
        
        res.json({
            success: true,
            data: formatted,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalRecords,
                pages: Math.ceil(totalRecords / parseInt(limit))
            }
        });
    } catch (err) {
        console.error('Erro na análise detalhada:', err);
        res.status(500).json({ error: err.message });
    }
});

// ROTA: Estatísticas gerais para relatórios
router.get('/statistics', async (req, res) => {
    try {
        const { year } = req.query;
        
        // SQL para estatísticas completas
        let sql = `
            SELECT 
                -- Métricas gerais
                COUNT(DISTINCT o.employee_id) as total_colaboradores,
                COUNT(*) as total_registros,
                COALESCE(SUM(o.valor), 0) as valor_total,
                COALESCE(AVG(o.valor), 0) as valor_medio,
                COALESCE(MIN(o.valor), 0) as valor_minimo,
                COALESCE(MAX(o.valor), 0) as valor_maximo,
                
                -- Estatísticas de tempo
                COALESCE(SUM(
                    CASE 
                        WHEN o.extra ~ '^[0-9]{1,2}:[0-9]{2}$' THEN
                            CAST(SPLIT_PART(o.extra, ':', 1) AS INTEGER) * 60 +
                            CAST(SPLIT_PART(o.extra, ':', 2) AS INTEGER)
                        ELSE 0
                    END
                ), 0) as minutos_totais,
                
                -- Top mês em registros
                (SELECT o.mes FROM overtime_records o2 WHERE o2.mes ILIKE $1 GROUP BY o2.mes ORDER BY COUNT(*) DESC LIMIT 1) as mes_mais_registros,
                
                -- Top mês em valor
                (SELECT o.mes FROM overtime_records o3 WHERE o3.mes ILIKE $2 GROUP BY o3.mes ORDER BY SUM(o3.valor) DESC LIMIT 1) as mes_maior_valor,
                
                -- Colaboradores ativos no período
                COUNT(DISTINCT CASE WHEN e.type != 'Desligado' OR e.type IS NULL THEN o.employee_id END) as colaboradores_ativos
                
            FROM overtime_records o
            JOIN employees e ON o.employee_id = e.id
            WHERE 1=1
        `;
        
        const params = [];
        if (year) {
            sql += ` AND o.mes ILIKE $1`;
            params.push(`%${year}%`);
            // Repetir para as subqueries
            sql += ` AND o2.mes ILIKE $2 AND o3.mes ILIKE $2`;
            params.push(`%${year}%`, `%${year}%`);
        }
        
        const result = await query(sql, params);
        const data = result.rows[0] || {};
        
        // Formatar horas
        const total_horas = Math.floor((data.minutos_totais || 0) / 60);
        const total_minutos = (data.minutos_totais || 0) % 60;
        
        res.json({
            success: true,
            data: {
                total_colaboradores: parseInt(data.total_colaboradores || 0),
                total_registros: parseInt(data.total_registros || 0),
                valor_total: parseFloat(data.valor_total || 0),
                valor_medio: parseFloat(data.valor_medio || 0),
                valor_minimo: parseFloat(data.valor_minimo || 0),
                valor_maximo: parseFloat(data.valor_maximo || 0),
                total_horas_formatado: `${total_horas.toString().padStart(2, '0')}:${total_minutos.toString().padStart(2, '0')}`,
                total_horas_decimal: (data.minutos_totais || 0) / 60,
                mes_mais_registros: data.mes_mais_registros,
                mes_maior_valor: data.mes_maior_valor,
                colaboradores_ativos: parseInt(data.colaboradores_ativos || 0)
            }
        });
    } catch (err) {
        console.error('Erro nas estatísticas:', err);
        res.status(500).json({ error: err.message });
    }
});

// ROTA: Análise comparativa Horas vs Colaboradores por Unidade
// Corrigido para usar dados reais do banco (overtime_records → employees → companies)
router.get('/hours-vs-employees', async (req, res) => {
    try {
        const { year, month, unit } = req.query;
        
        // SQL direto como outros endpoints para consistência
        let sql = `
            SELECT 
                COALESCE(o.unidade, 'Sem Unidade') as unidade,
                COUNT(DISTINCT o.employee_id) as colaboradores,
                COUNT(*) as registros,
                COALESCE(SUM(o.valor), 0) as valor_total,
                -- Calcular horas totais por unidade
                COALESCE(SUM(
                    CASE 
                        WHEN o.extra ~ '^[0-9]{1,2}:[0-9]{2}$' THEN
                            CAST(SPLIT_PART(o.extra, ':', 1) AS INTEGER) * 60 +
                            CAST(SPLIT_PART(o.extra, ':', 2) AS INTEGER)
                        ELSE 0
                    END
                ), 0) as minutos_totais
            FROM overtime_records o
            WHERE 1=1
        `;
        
        const params = [];
        let paramIndex = 0;
        
        if (year) {
            paramIndex++;
            sql += ` AND o.mes ILIKE $${paramIndex}`;
            params.push(`%${year}%`);
        }
        
        if (month) {
            paramIndex++;
            sql += ` AND o.mes ILIKE $${paramIndex}`;
            params.push(`%${month}%`);
        }
        
        if (unit) {
            paramIndex++;
            sql += ` AND o.unidade = $${paramIndex}`;
            params.push(unit);
        }
        
        sql += ` GROUP BY o.unidade ORDER BY colaboradores DESC`;
        
        const result = await query(sql, params);
        
        // Formatar dados
        const formatted = result.rows.map(row => ({
            unidade: row.unidade,
            colaboradores: parseInt(row.colaboradores),
            registros: parseInt(row.registros),
            valor_total: parseFloat(row.valor_total),
            horas_totais: Math.floor((row.minutos_totais || 0) / 60),
            minutos_totais: (row.minutos_totais || 0) % 60,
            periodo: `${month || 'Todos'} ${year || 'Todos'}`.trim(),
            horas_formatadas: row.minutos_totais ? 
                `${Math.floor(row.minutos_totais / 60).toString().padStart(2, '0')}:${(row.minutos_totais % 60).toString().padStart(2, '0')}` 
                : '00:00'
        }));
        
        // Calcular metadados
        const meta = {
            total_unidades: formatted.length,
            total_colaboradores: formatted.reduce((sum, item) => sum + item.colaboradores, 0),
            total_registros: formatted.reduce((sum, item) => sum + item.registros, 0),
            total_valor: formatted.reduce((sum, item) => sum + item.valor_total, 0),
            total_horas: formatted.reduce((sum, item) => sum + item.horas_totais, 0),
            period: `${month || 'Todos'} ${year || 'Todos'}`.trim()
        };
        
        console.log('Hours vs Employees - Dados carregados:', {
            unidades: meta.total_unidades,
            colaboradores: meta.total_colaboradores,
            registros: meta.total_registros
        });
        
        res.json({
            success: true,
            data: formatted,
            meta: meta
        });
    } catch (err) {
        console.error('Erro na análise horas vs colaboradores:', err);
        res.status(500).json({ error: err.message });
    }
});

// ROTA: Obter unidades disponíveis (fonte de verdade: Companies)
router.get('/units', async (req, res) => {
    try {
        // SQL direto para obter unidades reais do banco
        const sql = `
            SELECT DISTINCT c.name as unidade
            FROM companies c
            WHERE c.name IS NOT NULL 
            AND c.name != ''
            ORDER BY c.name
        `;
        
        const result = await query(sql);
        const units = result.rows.map(row => row.unidade);
        
        console.log('Units - Unidades reais carregadas:', units.length);
        
        res.json({
            success: true,
            data: units
        });
    } catch (err) {
        console.error('Erro ao obter unidades:', err);
        res.status(500).json({ error: err.message });
    }
});

// ROTA: Obter períodos disponíveis
router.get('/periods', async (req, res) => {
    try {
        const analyticsService = require('../services/analyticsService');
        const periods = await analyticsService.getAvailablePeriods();
        
        res.json({
            success: true,
            data: periods
        });
    } catch (err) {
        console.error('Erro ao obter períodos:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
