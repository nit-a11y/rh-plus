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
        const { month, employee_id, search } = req.query;
        
        let sql = `
            SELECT 
                o.id,
                o.employee_id,
                o.month_year,
                o.overtime_time,
                o.overtime_value,
                o.created_at,
                o.created_by,
                e.name as employee_name,
                e.registrationNumber,
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
            sql += ` AND o.month_year = $${paramIndex}`;
            params.push(month);
        }
        
        if (employee_id) {
            paramIndex++;
            sql += ` AND o.employee_id = $${paramIndex}`;
            params.push(employee_id);
        }
        
        if (search) {
            paramIndex++;
            sql += ` AND (e.name ILIKE $${paramIndex} OR e.registrationNumber ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
        }
        
        sql += ` ORDER BY o.month_year DESC, e.name ASC`;
        
        const result = await query(sql, params);
        res.json({ success: true, data: result.rows || [] });
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
                month_year,
                COUNT(*) as total_records,
                SUM(overtime_value) as total_value,
                SUM(
                    CASE 
                        WHEN overtime_time LIKE '%:%' THEN 
                            CAST(SUBSTRING(overtime_time, 1, POSITION(':' IN overtime_time) - 1) AS NUMERIC) * 60 +
                            CAST(SUBSTRING(overtime_time, POSITION(':' IN overtime_time) + 1) AS NUMERIC)
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
            sql += ` AND month_year ILIKE $${paramIndex}`;
            params.push(`%${year}%`);
        }
        
        sql += ` GROUP BY month_year ORDER BY month_year DESC`;
        
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
                e.registrationNumber,
                e.role,
                e.sector
            FROM overtime_records o
            JOIN employees e ON o.employee_id = e.id
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
        
        await query(`
            INSERT INTO overtime_records (id, employee_id, month_year, overtime_time, overtime_value, created_by)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [id, employee_id, month_year.toUpperCase().trim(), time, value, created_by || '']);
        
        res.json({ success: true, id, message: 'Registro criado com sucesso' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ROTA: Atualizar registro
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { overtime_time, overtime_value } = req.body;
        
        const updates = [];
        const params = [];
        let paramIndex = 0;
        
        if (overtime_time !== undefined) {
            paramIndex++;
            updates.push(`overtime_time = $${paramIndex}`);
            params.push(overtime_time.toString().trim());
        }
        
        if (overtime_value !== undefined && overtime_value !== null) {
            // Normalizar valor - suporta número ou string formatada
            let value = 0;
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
            
            paramIndex++;
            updates.push(`overtime_value = $${paramIndex}`);
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
                await query(`
                    INSERT INTO overtime_records (id, employee_id, month_year, overtime_time, overtime_value)
                    VALUES ($1, $2, $3, $4, $5)
                `, [id, employee_id, month_year.toUpperCase().trim(), overtime_time || '', value]);
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

module.exports = router;
