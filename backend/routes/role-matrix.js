/**
 * Módulo Matriz de Cargos & CBO
 * Gestão visual de cargos com informações essenciais
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const crypto = require('crypto');

const generateId = () => crypto.randomBytes(4).toString('hex');

// GET - Listar todos os cargos com informações enriquecidas
router.get('/', async (req, res) => {
    try {
        const sql = `
            SELECT 
                r.*,
                COUNT(e.id) FILTER (WHERE e.type != 'Desligado') as employee_count,
                COUNT(rj.id) FILTER (WHERE rj.status = 'Em Aberto') as vacancy_count,
                km.id as kit_id,
                COUNT(DISTINCT ti.id) FILTER (WHERE ti.status != 'REMOVIDO') as asset_count
            FROM roles_master r
            LEFT JOIN employees e ON e.role = r.name
            LEFT JOIN recruitment_jobs rj ON rj.job_title = r.name
            LEFT JOIN kits_master km ON km.role_id = r.id
            LEFT JOIN tool_items ti ON ti.type LIKE '%' || r.name || '%' AND ti.status = 'Em uso'
            GROUP BY r.id, r.name, r.cbo, r.sector, r.directorate, r.category, km.id
            ORDER BY r.category, r.name
        `;
        
        const result = await query(sql);
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao listar cargos:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET - Obter cargo específico com detalhes
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const sql = `
            SELECT 
                r.*,
                COUNT(e.id) FILTER (WHERE e.type != 'Desligado') as employee_count,
                COUNT(rj.id) FILTER (WHERE rj.status = 'Em Aberto') as vacancy_count,
                km.id as kit_id,
                km.kit_name,
                COUNT(DISTINCT ti.id) FILTER (WHERE ti.status != 'REMOVIDO') as asset_count
            FROM roles_master r
            LEFT JOIN employees e ON e.role = r.name
            LEFT JOIN recruitment_jobs rj ON rj.job_title = r.name
            LEFT JOIN kits_master km ON km.role_id = r.id
            LEFT JOIN tool_items ti ON ti.type LIKE '%' || r.name || '%' AND ti.status = 'Em uso'
            WHERE r.id = $1
            GROUP BY r.id, r.name, r.cbo, r.sector, r.directorate, r.category, km.id, km.kit_name
        `;
        
        const result = await query(sql, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cargo não encontrado' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao obter cargo:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST - Criar novo cargo
router.post('/', async (req, res) => {
    try {
        const { category, cbo, name, sector, directorate } = req.body;
        
        // Validações básicas
        if (!category || !cbo || !name) {
            return res.status(400).json({ error: 'Categoria, CBO e nome são obrigatórios' });
        }
        
        // Normalizar dados
        const normalizedCategory = category.toString().toUpperCase().trim();
        const normalizedCbo = cbo.toString().trim();
        const normalizedName = name.toString().toUpperCase().trim();
        const normalizedSector = sector ? sector.toString().toUpperCase().trim() : '';
        const normalizedDirectorate = directorate ? directorate.toString().toUpperCase().trim() : '';
        
        // Verificar duplicidade
        const existing = await query('SELECT id FROM roles_master WHERE name = $1', [normalizedName]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Cargo já existe' });
        }
        
        const id = generateId();
        
        await query(`
            INSERT INTO roles_master (id, name, cbo, sector, directorate, category) 
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [id, normalizedName, normalizedCbo, normalizedSector, normalizedDirectorate, normalizedCategory]);
        
        res.json({ success: true, id, message: 'Cargo criado com sucesso' });
    } catch (err) {
        console.error('Erro ao criar cargo:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT - Atualizar cargo
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { category, cbo, name, sector, directorate } = req.body;
        
        // Normalizar dados
        const normalizedCategory = category ? category.toString().toUpperCase().trim() : '';
        const normalizedCbo = cbo ? cbo.toString().trim() : '';
        const normalizedName = name ? name.toString().toUpperCase().trim() : '';
        const normalizedSector = sector ? sector.toString().toUpperCase().trim() : '';
        const normalizedDirectorate = directorate ? directorate.toString().toUpperCase().trim() : '';
        
        // Verificar se cargo existe
        const existing = await query('SELECT name FROM roles_master WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Cargo não encontrado' });
        }
        
        // Se o nome está sendo alterado, verificar duplicidade
        if (normalizedName && normalizedName !== existing.rows[0].name) {
            const duplicate = await query('SELECT id FROM roles_master WHERE name = $1 AND id != $2', [normalizedName, id]);
            if (duplicate.rows.length > 0) {
                return res.status(400).json({ error: 'Já existe outro cargo com este nome' });
            }
        }
        
        const result = await query(`
            UPDATE roles_master 
            SET name = COALESCE(NULLIF($1, ''), name),
                cbo = COALESCE(NULLIF($2, ''), cbo),
                sector = COALESCE(NULLIF($3, ''), sector),
                directorate = COALESCE(NULLIF($4, ''), directorate),
                category = COALESCE(NULLIF($5, ''), category)
            WHERE id = $6
        `, [normalizedName, normalizedCbo, normalizedSector, normalizedDirectorate, normalizedCategory, id]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Cargo não encontrado' });
        }
        
        res.json({ success: true, message: 'Cargo atualizado com sucesso' });
    } catch (err) {
        console.error('Erro ao atualizar cargo:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE - Remover cargo
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar se cargo existe
        const role = await query('SELECT name FROM roles_master WHERE id = $1', [id]);
        if (role.rows.length === 0) {
            return res.status(404).json({ error: 'Cargo não encontrado' });
        }
        
        // Verificar se há colaboradores ativos
        const employees = await query(`
            SELECT COUNT(*) as count 
            FROM employees 
            WHERE role = $1 AND type != 'Desligado'
        `, [role.rows[0].name]);
        
        if (parseInt(employees.rows[0].count) > 0) {
            return res.status(400).json({ 
                error: 'Não é possível remover cargo com colaboradores ativos',
                employeeCount: parseInt(employees.rows[0].count)
            });
        }
        
        // Verificar se há vagas em aberto
        const vacancies = await query(`
            SELECT COUNT(*) as count 
            FROM recruitment_jobs 
            WHERE job_title = $1 AND status = 'Em Aberto'
        `, [role.rows[0].name]);
        
        if (parseInt(vacancies.rows[0].count) > 0) {
            return res.status(400).json({ 
                error: 'Não é possível remover cargo com vagas em aberto',
                vacancyCount: parseInt(vacancies.rows[0].count)
            });
        }
        
        await query('DELETE FROM roles_master WHERE id = $1', [id]);
        res.json({ success: true, message: 'Cargo removido com sucesso' });
    } catch (err) {
        console.error('Erro ao remover cargo:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET - Estatísticas gerais da matriz
router.get('/stats/overview', async (req, res) => {
    try {
        const sql = `
            SELECT 
                COUNT(*) as total_roles,
                COUNT(*) FILTER (WHERE category = 'OP') as op_count,
                COUNT(*) FILTER (WHERE category = 'ADM') as adm_count,
                COUNT(DISTINCT sector) as total_sectors,
                COUNT(DISTINCT directorate) as total_directorates
            FROM roles_master
        `;
        
        const result = await query(sql);
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao obter estatísticas:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET - Listar setores disponíveis
router.get('/sectors/available', async (req, res) => {
    try {
        const sql = `
            SELECT DISTINCT sector, COUNT(*) as role_count
            FROM roles_master 
            WHERE sector IS NOT NULL AND sector != ''
            GROUP BY sector
            ORDER BY sector
        `;
        
        const result = await query(sql);
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao listar setores:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET - Listar diretores disponíveis
router.get('/directors/available', async (req, res) => {
    try {
        const sql = `
            SELECT DISTINCT director, COUNT(*) as role_count
            FROM roles_master 
            WHERE director IS NOT NULL AND director != ''
            GROUP BY director
            ORDER BY director
        `;
        
        const result = await query(sql);
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao listar diretores:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET - Listar colaboradores de um cargo específico
router.get('/:roleName/employees', async (req, res) => {
    try {
        const { roleName } = req.params;
        
        const sql = `
            SELECT 
                e.id,
                e.name,
                e."registrationNumber",
                e.sector,
                e."currentSalary",
                e."admissionDate",
                e.type,
                e."photoUrl",
                c.name as employer_name,
                w.name as workplace_name
            FROM employees e
            LEFT JOIN companies c ON e.employer_id = c.id
            LEFT JOIN companies w ON e.workplace_id = w.id
            WHERE e.role = $1 AND e.type != 'Desligado'
            ORDER BY e.name ASC
        `;
        
        const result = await query(sql, [roleName]);
        
        // Adicionar informações adicionais
        const employees = result.rows.map(emp => ({
            ...emp,
            admissionDateFormatted: emp.admissionDate ? new Date(emp.admissionDate).toLocaleDateString('pt-BR') : null,
            salaryFormatted: emp.currentSalary ? parseFloat(emp.currentSalary).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : null,
            photoUrl: emp.photoUrl || null
        }));
        
        res.json({
            roleName,
            employeeCount: employees.length,
            employees
        });
    } catch (err) {
        console.error('Erro ao listar colaboradores do cargo:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET - Listar kits disponíveis para vinculação
router.get('/kits/available', async (req, res) => {
    try {
        const sql = `
            SELECT 
                km.id,
                km.kit_name,
                km.role_id,
                r.name as role_name
            FROM kits_master km
            LEFT JOIN roles_master r ON km.role_id = r.id
            ORDER BY km.kit_name
        `;
        
        const result = await query(sql);
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao listar kits:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET - Listar ativos disponíveis por tipo
router.get('/assets/available', async (req, res) => {
    try {
        const sql = `
            SELECT 
                type,
                COUNT(*) as count,
                COUNT(*) FILTER (WHERE status = 'Disponível') as available_count
            FROM tool_items
            GROUP BY type
            ORDER BY type
        `;
        
        const result = await query(sql);
        res.json(result.rows);
    } catch (err) {
        console.error('Erro ao listar ativos:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST - Vincular kit a cargo
router.post('/:roleId/kit/:kitId', async (req, res) => {
    try {
        const { roleId, kitId } = req.params;
        
        // Verificar se cargo existe
        const roleExists = await query('SELECT id FROM roles_master WHERE id = $1', [roleId]);
        if (roleExists.rows.length === 0) {
            return res.status(404).json({ error: 'Cargo não encontrado' });
        }
        
        // Verificar se kit existe
        const kitExists = await query('SELECT id FROM kits_master WHERE id = $1', [kitId]);
        if (kitExists.rows.length === 0) {
            return res.status(404).json({ error: 'Kit não encontrado' });
        }
        
        // Atualizar vinculo
        await query('UPDATE kits_master SET role_id = $1 WHERE id = $2', [roleId, kitId]);
        
        res.json({ success: true, message: 'Kit vinculado ao cargo com sucesso' });
    } catch (err) {
        console.error('Erro ao vincular kit:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE - Desvincular kit de cargo
router.delete('/:roleId/kit/:kitId', async (req, res) => {
    try {
        const { roleId, kitId } = req.params;
        
        // Remover vinculo
        await query('UPDATE kits_master SET role_id = NULL WHERE id = $1 AND role_id = $2', [kitId, roleId]);
        
        res.json({ success: true, message: 'Kit desvinculado do cargo com sucesso' });
    } catch (err) {
        console.error('Erro ao desvincular kit:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
