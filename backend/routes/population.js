/**
 * ROTAS: CONTROLE POPULACIONAL
 * Módulo independente para gestão de população por unidade
 * Fonte de dados: employees + companies (mesma estrutura do employees-pro)
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const crypto = require('crypto');

const generateId = () => crypto.randomBytes(4).toString('hex');

// Helper functions
const dbAll = async (sql, params = []) => {
    const result = await query(sql, params);
    return result.rows || [];
};

const dbGet = async (sql, params = []) => {
    const result = await query(sql, params);
    return result.rows[0] || null;
};

/**
 * GET /api/population/summary
 * Resumo geral: total de unidades, colaboradores, médias
 */
router.get('/summary', async (req, res) => {
    try {
        // Query simples e direta
        const currentData = await query(`
            SELECT 
                COUNT(DISTINCT c.id) as total_units,
                COUNT(e.id) as total_employees,
                COUNT(CASE WHEN e.type != 'Desligado' THEN 1 END) as active_employees,
                COUNT(CASE WHEN e.type = 'Desligado' THEN 1 END) as inactive_employees,
                0 as avg_employees_per_unit,
                'N/A' as largest_unit_name,
                'N/A' as smallest_unit_name
            FROM companies c
            LEFT JOIN employees e ON e.workplace_id = c.id
            WHERE c.id IN (
                SELECT DISTINCT workplace_id FROM employees WHERE workplace_id IS NOT NULL
            )
        `);

        res.json({
            success: true,
            data: currentData.rows[0] || {
                total_units: 0,
                total_employees: 0,
                active_employees: 0,
                inactive_employees: 0,
                avg_employees_per_unit: 0,
                largest_unit_name: 'N/A',
                smallest_unit_name: 'N/A'
            }
        });
    } catch (error) {
        console.error('Erro em /summary:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/population/units
 * Lista detalhada de unidades com contagens atuais
 */
router.get('/units', async (req, res) => {
    try {
        const units = await query(`
            SELECT 
                c.id as unit_id,
                c.name as unit_name,
                c.cnpj,
                c.address,
                c.type,
                COUNT(e.id) as total_employees,
                COUNT(CASE WHEN e.type != 'Desligado' THEN 1 END) as active_employees,
                COUNT(CASE WHEN e.type = 'Desligado' THEN 1 END) as inactive_employees,
                ROUND(
                    (COUNT(CASE WHEN e.type != 'Desligado' THEN 1 END) * 100.0 / NULLIF(COUNT(e.id), 0)), 
                    2
                ) as active_percentage,
                0 as growth_month_over_month
            FROM companies c
            LEFT JOIN employees e ON e.workplace_id = c.id
            WHERE c.id IN (
                SELECT DISTINCT workplace_id FROM employees WHERE workplace_id IS NOT NULL
            )
            GROUP BY c.id, c.name, c.cnpj, c.address, c.type
            ORDER BY c.name ASC
        `);

        res.json({
            success: true,
            data: units.rows
        });
    } catch (error) {
        console.error('Erro em /units:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/population/history
 * Histórico temporal por unidade
 */
router.get('/history', async (req, res) => {
    try {
        const { start_date, end_date, unit_id } = req.query;
        
        let whereClause = 'WHERE 1=1';
        const params = [];
        
        if (start_date) {
            whereClause += ` AND record_date >= $${params.length + 1}`;
            params.push(start_date);
        }
        
        if (end_date) {
            whereClause += ` AND record_date <= $${params.length + 1}`;
            params.push(end_date);
        }
        
        if (unit_id) {
            whereClause += ` AND unit_id = $${params.length + 1}`;
            params.push(unit_id);
        }
        
        const history = await query(`
            SELECT 
                record_date,
                unit_id,
                unit_name,
                total_employees,
                active_employees,
                inactive_employees,
                admissions_count,
                terminations_count,
                recorded_at
            FROM population_history
            ${whereClause}
            ORDER BY record_date DESC, unit_name ASC
        `, params);

        res.json({
            success: true,
            data: history.rows
        });
    } catch (error) {
        console.error('Erro em /history:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/population/trends
 * Tendências e projeções
 */
router.get('/trends', async (req, res) => {
    try {
        const { period = '12' } = req.query; // meses para análise
        
        // Dados simulados para trends (enquanto não há histórico real)
        const monthlyEvolution = [];
        const admissionsVsTerminations = [];
        const unitGrowth = [];
        
        // Gerar dados simulados para os últimos meses
        const months = parseInt(period) || 12;
        for (let i = months - 1; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthStr = date.toISOString();
            
            monthlyEvolution.push({
                month: monthStr,
                total_employees: 150 + Math.floor(Math.random() * 20),
                active_employees: 100 + Math.floor(Math.random() * 15),
                inactive_employees: 50 + Math.floor(Math.random() * 10),
                total_admissions: Math.floor(Math.random() * 5),
                total_terminations: Math.floor(Math.random() * 3)
            });
            
            admissionsVsTerminations.push({
                month: monthStr,
                admissions: Math.floor(Math.random() * 5),
                terminations: Math.floor(Math.random() * 3),
                net_change: Math.floor(Math.random() * 3)
            });
        }

        res.json({
            success: true,
            data: {
                monthly_evolution: monthlyEvolution,
                admissions_vs_terminations: admissionsVsTerminations,
                unit_growth: unitGrowth
            }
        });
    } catch (error) {
        console.error('Erro em /trends:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/population/refresh
 * Atualizar dados históricos (botão "Atualizar Dados")
 */
router.post('/refresh', async (req, res) => {
    try {
        console.log('Atualizando dados populacionais...');
        
        const today = new Date().toISOString().split('T')[0];
        
        // Buscar todas as unidades com colaboradores
        const units = await query(`
            SELECT DISTINCT 
                c.id as unit_id,
                c.name as unit_name
            FROM companies c
            WHERE c.id IN (
                SELECT DISTINCT workplace_id 
                FROM employees 
                WHERE workplace_id IS NOT NULL
            )
            ORDER BY c.name
        `);
        
        let updatedCount = 0;
        
        for (const unit of units.rows) {
            // Calcular dados atuais para esta unidade
            const stats = await query(`
                SELECT 
                    COUNT(*) as total_employees,
                    COUNT(CASE WHEN type != 'Desligado' THEN 1 END) as active_employees,
                    COUNT(CASE WHEN type = 'Desligado' THEN 1 END) as inactive_employees,
                    COUNT(CASE WHEN "admissionDate" <= $1 AND "admissionDate" IS NOT NULL THEN 1 END) as admissions_count,
                    COUNT(CASE WHEN "terminationDate" <= $1 AND "terminationDate" IS NOT NULL THEN 1 END) as terminations_count
                FROM employees 
                WHERE workplace_id = $2
                AND (
                    ("admissionDate" <= $1) OR ("admissionDate" IS NULL)
                )
            `, [today, unit.unit_id]);
            
            const stat = stats.rows[0];
            
            // Inserir ou atualizar registro
            await query(`
                INSERT INTO population_history 
                (id, record_date, unit_id, unit_name, total_employees, active_employees, inactive_employees, admissions_count, terminations_count)
                VALUES 
                ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (unit_id, record_date) 
                DO UPDATE SET
                    unit_name = EXCLUDED.unit_name,
                    total_employees = EXCLUDED.total_employees,
                    active_employees = EXCLUDED.active_employees,
                    inactive_employees = EXCLUDED.inactive_employees,
                    admissions_count = EXCLUDED.admissions_count,
                    terminations_count = EXCLUDED.terminations_count,
                    recorded_at = CURRENT_TIMESTAMP
            `, [
                generateId(),
                today,
                unit.unit_id,
                unit.unit_name,
                stat.total_employees,
                stat.active_employees,
                stat.inactive_employees,
                stat.admissions_count,
                stat.terminations_count
            ]);
            
            updatedCount++;
        }
        
        console.log(`Dados atualizados para ${updatedCount} unidades`);
        
        res.json({
            success: true,
            message: `Dados atualizados com sucesso para ${updatedCount} unidades`,
            updated_units: updatedCount,
            date: today
        });
    } catch (error) {
        console.error('Erro ao atualizar dados:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
