/**
 * Módulo de Hora Extra
 * Registro simples de horas extras por colaborador/mês
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const crypto = require('crypto');

const generateId = () => crypto.randomBytes(4).toString('hex');

// ROTA: Listar todos os registros de hora extra (com filtros opcionais)
router.get('/', async (req, res) => {
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
        
        // Calcular contagem de colaboradores ativos no período
        let employeesCount = 0;
        if (result.rows.length > 0) {
            // Extrair período dos filtros
            const filterMonth = month;
            const filterYear = year;
            
            if (filterMonth || filterYear || unit) {
                // Calcular contagem baseada nos filtros
                employeesCount = await countActiveEmployees(filterMonth, filterYear, unit);
            } else {
                // Contar todos os colaboradores ativos
                employeesCount = await countAllActiveEmployees();
            }
        }
        
        res.json({ 
            success: true, 
            data: result.rows || [],
            employees_count: employeesCount
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ROTA: Obter resumo por mês (para dashboard)
router.get('/summary', async (req, res) => {
    try {
        const { year } = req.query;
        
        let sql = `
            SELECT 
                mes as month_year,
                COUNT(*) as total_records,
                SUM(valor) as total_value,
                SUM(
                    CASE 
                        WHEN extra LIKE '%:%' THEN 
                            CAST(SUBSTRING(extra, 1, POSITION(':' IN extra) - 1) AS NUMERIC) * 60 +
                            CAST(SUBSTRING(extra, POSITION(':' IN extra) + 1) AS NUMERIC)
                        ELSE 0 
                    END
                ) as total_minutes
            FROM overtime_records
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 0;
        
        if (year) {
            paramIndex++;
            sql += ` AND mes ILIKE $${paramIndex}`;
            params.push(`%${year}%`);
        }
        
        sql += ` GROUP BY mes ORDER BY mes DESC`;
        
        const result = await query(sql, params);
        
        // Converter minutos totais para formato hora:minuto
        const formatted = (result.rows || []).map(r => {
            const hours = Math.floor((r.total_minutes || 0) / 60);
            const mins = Math.round((r.total_minutes || 0) % 60);
            return {
                ...r,
                total_time_formatted: `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`,
                total_value_formatted: (r.total_value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            };
        });
        
        res.json({ success: true, data: formatted });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ROTA: Obter um registro específico
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(`
            SELECT 
                o.*,
                e.name as employee_name,
                e."registrationNumber",
                e.role,
                e.sector,
                wp.name as workplace_name
            FROM overtime_records o
            JOIN employees e ON o.employee_id = e.id
            LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = 1
            LEFT JOIN companies wp ON ev.workplace_id = wp.id
            WHERE o.id = $1
        `, [id]);
        if (!result.rows[0]) return res.status(404).json({ error: 'Registro não encontrado' });
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ROTA: Criar novo registro de hora extra
router.post('/', async (req, res) => {
    try {
        const { employee_id, month_year, overtime_time, overtime_value, created_by } = req.body;
        
        // DEBUG: Verificar o que chegou
        console.log('DEBUG - Valor recebido:', {
            raw: overtime_value,
            type: typeof overtime_value,
            json: JSON.stringify(overtime_value)
        });
        
        // Validações
        if (!employee_id) {
            return res.status(400).json({ error: 'Colaborador é obrigatório' });
        }
        if (!month_year) {
            return res.status(400).json({ error: 'Mês/Ano é obrigatório' });
        }
        
        const id = generateId();
        
        // Normalizar valor - suporta número ou string formatada
        let value = 0;
        if (overtime_value !== undefined && overtime_value !== null) {
            const strValue = overtime_value.toString().trim();
            
            // Se tem vírgula, assume formato brasileiro (100,73)
            if (strValue.includes(',')) {
                const cleanValue = strValue
                    .replace(/R\$\s*/gi, '')
                    .replace(/\./g, '')      // Remove pontos de milhar
                    .replace(',', '.');       // Troca vírgula por ponto decimal
                value = parseFloat(cleanValue) || 0;
            } 
            // Se tem ponto e é número decimal (100.73)
            else if (strValue.includes('.')) {
                value = parseFloat(strValue) || 0;
            }
            // Se é número inteiro sem separadores
            else {
                value = parseFloat(strValue) || 0;
            }
        }
        
        console.log('DEBUG - Valor processado:', value);
        
        // Normalizar tempo
        let time = overtime_time || '';
        if (time) {
            // Garantir formato HH:MM
            time = time.toString().trim();
        }
        
        // Buscar informações do colaborador para preenchimento automático
        const empInfo = await query(`
            SELECT 
                e.name,
                wp.name as workplace_name
            FROM employees e
            LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = 1
            LEFT JOIN companies wp ON ev.workplace_id = wp.id
            WHERE e.id = $1
        `, [employee_id]);
        
        const employeeName = empInfo.rows[0]?.name || '';
        const workplaceName = empInfo.rows[0]?.workplace_name || '';
        
        await query(`
            INSERT INTO overtime_records (id, employee_id, mes, unidade, nome, extra, valor, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
            id, 
            employee_id, 
            month_year.toUpperCase().trim(),
            workplaceName,               // unidade
            employeeName,               // nome
            time,                      // extra
            value,                     // valor
            created_by || ''
        ]);
        
        res.json({ success: true, id, message: 'Registro criado com sucesso' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ROTA: Atualizar registro
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { extra, valor, unidade, nome } = req.body;
        
        const updates = [];
        const params = [];
        let paramIndex = 0;
        
        if (unidade !== undefined) {
            paramIndex++;
            updates.push(`unidade = $${paramIndex}`);
            params.push(unidade.toString().trim());
        }
        
        if (nome !== undefined) {
            paramIndex++;
            updates.push(`nome = $${paramIndex}`);
            params.push(nome.toString().trim());
        }
        
        if (extra !== undefined) {
            paramIndex++;
            updates.push(`extra = $${paramIndex}`);
            params.push(extra.toString().trim());
        }
        
        if (valor !== undefined && valor !== null) {
            // Normalizar valor - suporta número ou string formatada
            let value = 0;
            const strValue = valor.toString().trim();
            
            // Se tem vírgula, assume formato brasileiro (100,73)
            if (strValue.includes(',')) {
                const cleanValue = strValue
                    .replace(/R\$\s*/gi, '')
                    .replace(/\./g, '')      // Remove pontos de milhar
                    .replace(',', '.');       // Troca vírgula por ponto decimal
                value = parseFloat(cleanValue) || 0;
            } 
            // Se tem ponto e é número decimal (100.73)
            else if (strValue.includes('.')) {
                value = parseFloat(strValue) || 0;
            }
            // Se é número inteiro sem separadores
            else {
                value = parseFloat(strValue) || 0;
            }
            
            paramIndex++;
            updates.push(`valor = $${paramIndex}`);
            params.push(value);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'Nenhum campo para atualizar' });
        }
        
        paramIndex++;
        params.push(id);
        
        const result = await query(`UPDATE overtime_records SET ${updates.join(', ')} WHERE id = $${paramIndex}`, params);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Registro não encontrado' });
        res.json({ success: true, changes: result.rowCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ROTA: Excluir registro
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(`DELETE FROM overtime_records WHERE id = $1`, [id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Registro não encontrado' });
        res.json({ success: true, message: 'Registro excluído' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ROTA: Importar em lote (bulk)
router.post('/bulk', async (req, res) => {
    try {
        const { records, month_year } = req.body;
        
        if (!records || !Array.isArray(records) || records.length === 0) {
            return res.status(400).json({ error: 'Lista de registros é obrigatória' });
        }
        
        const created = [];
        const errors = [];
        
        await query('BEGIN');
        
        for (let index = 0; index < records.length; index++) {
            const rec = records[index];
            const { employee_id, overtime_time, overtime_value } = rec;
            
            if (!employee_id) {
                errors.push({ index, error: 'Colaborador não informado' });
                continue;
            }
            
            const id = generateId();
            
            // Normalizar valor - suporta número ou string formatada
            let value = 0;
            if (overtime_value !== undefined && overtime_value !== null) {
                const strValue = overtime_value.toString().trim();
                
                // Se tem vírgula, assume formato brasileiro (100,73)
                if (strValue.includes(',')) {
                    const cleanValue = strValue
                        .replace(/R\$\s*/gi, '')
                        .replace(/\./g, '')      // Remove pontos de milhar
                        .replace(',', '.');       // Troca vírgula por ponto decimal
                    value = parseFloat(cleanValue) || 0;
                } 
                // Se tem ponto e é número decimal (100.73)
                else if (strValue.includes('.')) {
                    value = parseFloat(strValue) || 0;
                }
                // Se é número inteiro sem separadores
                else {
                    value = parseFloat(strValue) || 0;
                }
            }
            
            try {
                // Buscar informações do colaborador para preenchimento automático
                const empInfo = await query(`
                    SELECT 
                        e.name,
                        wp.name as workplace_name
                    FROM employees e
                    LEFT JOIN employee_vinculos ev ON e.id = ev.employee_id AND ev.principal = 1
                    LEFT JOIN companies wp ON ev.workplace_id = wp.id
                    WHERE e.id = $1
                `, [employee_id]);
                
                const employeeName = empInfo.rows[0]?.name || '';
                const workplaceName = empInfo.rows[0]?.workplace_name || '';
                
                await query(`
                    INSERT INTO overtime_records (id, employee_id, mes, unidade, nome, extra, valor)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                `, [
                    id, 
                    employee_id, 
                    month_year.toUpperCase().trim(),
                    workplaceName,               // unidade
                    employeeName,               // nome
                    overtime_time || '',        // extra
                    value                      // valor
                ]);
                created.push(id);
            } catch (err) {
                errors.push({ index, error: err.message });
            }
        }
        
        await query('COMMIT');
        res.json({ 
            success: true, 
            created: created.length, 
            errors: errors.length,
            error_details: errors
        });
    } catch (err) {
        await query('ROLLBACK');
        res.status(500).json({ error: err.message });
    }
});

/**
 * Contar todos os colaboradores ativos
 */
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

const { countActiveEmployees } = require('./overtime-fixed');

module.exports = router;
module.exports.countActiveEmployees = countActiveEmployees;
