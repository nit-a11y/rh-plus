const express = require('express');
const cors = require('cors');
const path = require('path');
const { query } = require('./config/database');

const app = express();
const PORT = 3002;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// API de teste com dados reais
app.get('/api/population/summary', async (req, res) => {
    try {
        console.log('Buscando dados do summary...');
        const result = await query(`
            SELECT 
                COUNT(DISTINCT c.id) as total_units,
                COUNT(e.id) as total_employees,
                COUNT(CASE WHEN e.type != 'Desligado' THEN 1 END) as active_employees,
                COUNT(CASE WHEN e.type = 'Desligado' THEN 1 END) as inactive_employees,
                ROUND(COUNT(e.id) * 1.0 / NULLIF(COUNT(DISTINCT c.id), 0), 2) as avg_employees_per_unit
            FROM companies c
            LEFT JOIN employees e ON e.workplace_id = c.id
            WHERE c.id IN (
                SELECT DISTINCT workplace_id FROM employees WHERE workplace_id IS NOT NULL
            )
        `);
        
        console.log('Resultado do summary:', result.rows[0]);
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Erro no summary:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/population/units', async (req, res) => {
    try {
        console.log('Buscando dados das unidades...');
        const result = await query(`
            SELECT 
                c.id as unit_id,
                c.name as unit_name,
                c.cnpj,
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
            GROUP BY c.id, c.name, c.cnpj
            ORDER BY c.name ASC
        `);
        
        console.log('Unidades encontradas:', result.rows.length);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Erro nas unidades:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/population/trends', (req, res) => {
    try {
        // Dados simulados para trends
        const monthlyEvolution = [];
        const admissionsVsTerminations = [];
        
        for (let i = 11; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            
            monthlyEvolution.push({
                month: date.toISOString(),
                total_employees: 150 + Math.floor(Math.random() * 20),
                active_employees: 100 + Math.floor(Math.random() * 15),
                inactive_employees: 50 + Math.floor(Math.random() * 10)
            });
            
            admissionsVsTerminations.push({
                month: date.toISOString(),
                admissions: Math.floor(Math.random() * 5),
                terminations: Math.floor(Math.random() * 3)
            });
        }
        
        res.json({ 
            success: true, 
            data: {
                monthly_evolution: monthlyEvolution,
                admissions_vs_terminations: admissionsVsTerminations,
                unit_growth: []
            }
        });
    } catch (error) {
        console.error('Erro nos trends:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Rota principal
app.get('/populacao', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/populacao.html'));
});

app.listen(PORT, () => {
    console.log(`\ud83d\ude80 Servidor rodando em http://localhost:${PORT}`);
    console.log(`\ud83d\udcca Módulo População: http://localhost:${PORT}/populacao`);
    console.log('\nTestando APIs...');
    
    // Teste rápido
    setTimeout(async () => {
        try {
            const response = await fetch(`http://localhost:${PORT}/api/population/summary`);
            const data = await response.json();
            console.log('\u2705 API Summary OK:', data.success);
            console.log(`   - Unidades: ${data.data?.total_units || 0}`);
            console.log(`   - Colaboradores: ${data.data?.total_employees || 0}`);
            console.log(`   - Média por unidade: ${data.data?.avg_employees_per_unit || 0}`);
        } catch (error) {
            console.error('\u274c Erro no teste:', error.message);
        }
    }, 1000);
});
