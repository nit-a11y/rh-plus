const express = require('express');
const { query } = require('./config/database');
const populationHistoricoRoutes = require('./routes/population-historico');

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

// Usar rotas de histórico temporal
app.use('/api/population-historico', populationHistoricoRoutes);

// API Overtime - mesma lógica do módulo original
app.get('/api/overtime', async (req, res) => {
    try {
        const { month, year, unit, employee_id, search } = req.query;
        
        let sql = `
            SELECT 
                o.id,
                o.employee_id,
                o.mes,
                o.unidade,
                o.nome,
                o.extra,
                o.valor,
                o.created_at,
                o.created_by,
                e.name as employee_name,
                e."registrationNumber",
                e.role,
                e.sector
            FROM overtime_records o
            JOIN employees e ON o.employee_id = e.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 0;
        
        if (month) {
            paramIndex++;
            sql += ` AND o.mes = $${paramIndex}`;
            params.push(month);
        }
        
        if (year) {
            paramIndex++;
            sql += ` AND o.mes ILIKE $${paramIndex}`;
            params.push(`%${year}%`);
        }
        
        if (unit) {
            paramIndex++;
            sql += ` AND o.unidade = $${paramIndex}`;
            params.push(unit);
        }
        
        if (employee_id) {
            paramIndex++;
            sql += ` AND o.employee_id = $${paramIndex}`;
            params.push(employee_id);
        }
        
        if (search) {
            paramIndex++;
            sql += ` AND (e.name ILIKE $${paramIndex} OR e."registrationNumber" ILIKE $${paramIndex} OR o.nome ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
        }
        
        sql += ` ORDER BY o.mes DESC, e.name ASC`;
        
        const result = await query(sql, params);
        
        // Calcular contagem de colaboradores ativos
        let employeesCount = 0;
        if (result.rows.length > 0) {
            employeesCount = await countAllActiveEmployees();
        }
        
        res.json({ 
            success: true, 
            data: result.rows || [],
            employees_count: employeesCount
        });
    } catch (err) {
        console.error('Erro em /api/overtime:', err);
        res.status(500).json({ error: err.message });
    }
});

// Contar colaboradores ativos
async function countAllActiveEmployees() {
    try {
        const result = await query(`
            SELECT COUNT(*) as count
            FROM employees 
            WHERE type != 'Desligado' OR type IS NULL
        `);
        
        return parseInt(result.rows[0]?.count || 0);
    } catch (error) {
        console.error('Erro ao contar colaboradores ativos:', error);
        return 0;
    }
}

const PORT = 3005;
app.listen(PORT, () => {
    console.log(`Servidor de teste rodando em http://localhost:${PORT}`);
    console.log('APIs disponíveis:');
    console.log(`- http://localhost:${PORT}/test`);
    console.log(`- http://localhost:${PORT}/api/overtime`);
});
