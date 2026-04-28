/**
 * Módulo de Recrutamento e Seleção
 * Gestão de vagas e candidatos
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const crypto = require('crypto');

const generateId = () => crypto.randomBytes(4).toString('hex');

// === ROTAS DE PIPELINE (ETAPAS DO PROCESSO) ===

// Listar todas as etapas do pipeline
router.get('/pipeline/stages', async (req, res) => {
    try {
        const result = await query(`SELECT * FROM recruitment_pipeline_stages ORDER BY order_index ASC`);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Listar resultados de uma etapa específica
router.get('/pipeline/stages/:id/outcomes', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(`SELECT * FROM recruitment_stage_outcomes WHERE stage_id = $1 ORDER BY outcome ASC`, [id]);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Listar todos os resultados possíveis
router.get('/pipeline/outcomes', async (req, res) => {
    try {
        const result = await query(`
            SELECT o.*, s.name as stage_name, s.order_index 
            FROM recruitment_stage_outcomes o
            JOIN recruitment_pipeline_stages s ON o.stage_id = s.id
            ORDER BY s.order_index, o.outcome
        `);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// === ROTAS DE VAGAS ===

// ROTA: Listar todas as vagas (com filtros opcionais)
router.get('/jobs', async (req, res) => {
    try {
        const { status, unit, search } = req.query;
        
        let sql = `SELECT * FROM recruitment_jobs WHERE 1=1`;
        const params = [];
        let paramIndex = 0;
        
        if (status) {
            paramIndex++;
            sql += ` AND status = $${paramIndex}`;
            params.push(status);
        }
        
        if (unit) {
            paramIndex++;
            sql += ` AND unit = $${paramIndex}`;
            params.push(unit);
        }
        
        if (search) {
            paramIndex++;
            sql += ` AND (job_title ILIKE $${paramIndex} OR sector ILIKE $${paramIndex} OR observation ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
        }
        
        sql += ` ORDER BY created_at DESC`;
        
        const result = await query(sql, params);
        
        // Calcular dias em aberto para vagas não concluídas
        const today = new Date();
        const jobs = result.rows.map(job => {
            if (!job.closing_date && job.opening_date) {
                const openDate = new Date(job.opening_date.split('/').reverse().join('-'));
                const diffTime = Math.abs(today - openDate);
                job.days_open = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }
            return job;
        });
        
        res.json({ success: true, data: jobs });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ROTA: Obter uma vaga específica
router.get('/jobs/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(`SELECT * FROM recruitment_jobs WHERE id = $1`, [id]);
        if (!result.rows[0]) return res.status(404).json({ error: 'Vaga não encontrada' });
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ROTA: Criar nova vaga
router.post('/jobs', async (req, res) => {
    try {
        const { unit, job_title, sector, opening_date, closing_date, admission_date, status, observation, created_by } = req.body;
        
        if (!unit || !job_title) {
            return res.status(400).json({ error: 'Unidade e título da vaga são obrigatórios' });
        }
        
        const id = generateId();
        
        // Calcular dias em aberto
        let daysOpen = 0;
        if (opening_date && !closing_date) {
            const openDate = new Date(opening_date.split('/').reverse().join('-'));
            const today = new Date();
            const diffTime = Math.abs(today - openDate);
            daysOpen = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
        
        await query(`
            INSERT INTO recruitment_jobs (id, unit, job_title, sector, opening_date, closing_date, admission_date, days_open, status, observation, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [id, unit, job_title, sector, opening_date, closing_date, admission_date, daysOpen, status || 'Em Aberto', observation, created_by || '']);
        
        res.json({ success: true, id, message: 'Vaga criada com sucesso' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ROTA: Atualizar vaga
router.put('/jobs/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { unit, job_title, sector, opening_date, closing_date, admission_date, status, observation } = req.body;
        
        const updates = [];
        const params = [];
        let paramIndex = 0;
        
        if (unit !== undefined) { paramIndex++; updates.push(`unit = $${paramIndex}`); params.push(unit); }
        if (job_title !== undefined) { paramIndex++; updates.push(`job_title = $${paramIndex}`); params.push(job_title); }
        if (sector !== undefined) { paramIndex++; updates.push(`sector = $${paramIndex}`); params.push(sector); }
        if (opening_date !== undefined) { paramIndex++; updates.push(`opening_date = $${paramIndex}`); params.push(opening_date); }
        if (closing_date !== undefined) { paramIndex++; updates.push(`closing_date = $${paramIndex}`); params.push(closing_date); }
        if (admission_date !== undefined) { paramIndex++; updates.push(`admission_date = $${paramIndex}`); params.push(admission_date); }
        if (status !== undefined) { paramIndex++; updates.push(`status = $${paramIndex}`); params.push(status); }
        if (observation !== undefined) { paramIndex++; updates.push(`observation = $${paramIndex}`); params.push(observation); }
        
        // Recalcular dias em aberto se necessário
        if ((closing_date === null || closing_date === '') && updates.length > 0) {
            const rowResult = await query(`SELECT opening_date FROM recruitment_jobs WHERE id = $1`, [id]);
            const row = rowResult.rows[0];
            if (row && row.opening_date) {
                const openDate = new Date(row.opening_date.split('/').reverse().join('-'));
                const today = new Date();
                const diffTime = Math.abs(today - openDate);
                const daysOpen = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                paramIndex++;
                updates.push(`days_open = $${paramIndex}`);
                params.push(daysOpen);
            }
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'Nenhum campo para atualizar' });
        }
        
        paramIndex++;
        params.push(id);
        
        await query(`UPDATE recruitment_jobs SET ${updates.join(', ')} WHERE id = $${paramIndex}`, params);
        res.json({ success: true, message: 'Vaga atualizada com sucesso' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ROTA: Deletar vaga
router.delete('/jobs/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await query(`DELETE FROM recruitment_jobs WHERE id = $1`, [id]);
        res.json({ success: true, message: 'Vaga removida com sucesso' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ROTA: Resumo das vagas
router.get('/jobs/summary', async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                status,
                COUNT(*) as count
            FROM recruitment_jobs
            GROUP BY status
        `);
        
        const summary = {
            total: 0,
            by_status: {}
        };
        
        result.rows.forEach(row => {
            summary.total += parseInt(row.count);
            summary.by_status[row.status] = parseInt(row.count);
        });
        
        res.json({ success: true, data: summary });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// === ROTAS DE CANDIDATOS ===

// ROTA: Listar todos os candidatos (com filtros opcionais)
router.get('/candidates', async (req, res) => {
    try {
        const { job_id, stage_id, unit, search, outcome } = req.query;
        
        let sql = `
            SELECT c.*, j.job_title as job_title, s.name as stage_name, s.color as stage_color, s.order_index
            FROM recruitment_candidates c
            LEFT JOIN recruitment_jobs j ON c.job_id = j.id
            LEFT JOIN recruitment_pipeline_stages s ON c.current_stage_id = s.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 0;
        
        if (job_id) {
            paramIndex++;
            sql += ` AND c.job_id = $${paramIndex}`;
            params.push(job_id);
        }
        
        if (stage_id) {
            paramIndex++;
            sql += ` AND c.current_stage_id = $${paramIndex}`;
            params.push(stage_id);
        }
        
        if (outcome) {
            paramIndex++;
            sql += ` AND c.stage_outcome = $${paramIndex}`;
            params.push(outcome);
        }
        
        if (unit) {
            paramIndex++;
            sql += ` AND c.unit = $${paramIndex}`;
            params.push(unit);
        }
        
        if (search) {
            paramIndex++;
            sql += ` AND (c.name ILIKE $${paramIndex} OR c.cpf ILIKE $${paramIndex} OR c.position ILIKE $${paramIndex} OR c.observations ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
        }
        
        sql += ` ORDER BY s.order_index ASC, c.updated_at DESC`;
        
        const result = await query(sql, params);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ROTA: Obter um candidato específico
router.get('/candidates/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(`
            SELECT c.*, j.job_title as job_title 
            FROM recruitment_candidates c
            LEFT JOIN recruitment_jobs j ON c.job_id = j.id
            WHERE c.id = $1
        `, [id]);
        if (!result.rows[0]) return res.status(404).json({ error: 'Candidato não encontrado' });
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ROTA: Criar novo candidato
router.post('/candidates', async (req, res) => {
    try {
        const { unit, requester, name, cpf, phone, birth_date, position, current_stage_id, stage_outcome, observations, job_id, created_by } = req.body;
        
        if (!unit || !name) {
            return res.status(400).json({ error: 'Unidade e nome são obrigatórios' });
        }
        
        const id = generateId();
        const now = new Date().toISOString();
        
        // Busca a primeira etapa do pipeline se não informada
        let stageId = current_stage_id;
        if (!stageId) {
            const stageResult = await query(`SELECT id FROM recruitment_pipeline_stages ORDER BY order_index ASC LIMIT 1`);
            if (stageResult.rows[0]) stageId = stageResult.rows[0].id;
        }
        
        await query(`
            INSERT INTO recruitment_candidates (id, unit, requester, name, cpf, phone, birth_date, position, current_stage_id, stage_outcome, observations, job_id, created_by, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        `, [id, unit, requester, name, cpf, phone, birth_date, position, stageId, stage_outcome || '', observations, job_id, created_by || '', now, now]);
        
        // Registrar no histórico
        if (stageId) {
            await query(`
                INSERT INTO recruitment_candidate_history (id, candidate_id, to_stage_id, notes, moved_at)
                VALUES ($1, $2, $3, $4, $5)
            `, [generateId(), id, stageId, 'Candidato cadastrado', now]);
        }
        
        res.json({ success: true, id, message: 'Candidato criado com sucesso' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ROTA: Atualizar candidato
router.put('/candidates/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { unit, requester, name, cpf, phone, birth_date, position, stage, observations, job_id } = req.body;
        
        const updates = [];
        const params = [];
        let paramIndex = 0;
        
        if (unit !== undefined) { paramIndex++; updates.push(`unit = $${paramIndex}`); params.push(unit); }
        if (requester !== undefined) { paramIndex++; updates.push(`requester = $${paramIndex}`); params.push(requester); }
        if (name !== undefined) { paramIndex++; updates.push(`name = $${paramIndex}`); params.push(name); }
        if (cpf !== undefined) { paramIndex++; updates.push(`cpf = $${paramIndex}`); params.push(cpf); }
        if (phone !== undefined) { paramIndex++; updates.push(`phone = $${paramIndex}`); params.push(phone); }
        if (birth_date !== undefined) { paramIndex++; updates.push(`birth_date = $${paramIndex}`); params.push(birth_date); }
        if (position !== undefined) { paramIndex++; updates.push(`position = $${paramIndex}`); params.push(position); }
        if (stage !== undefined) { paramIndex++; updates.push(`stage = $${paramIndex}`); params.push(stage); }
        if (observations !== undefined) { paramIndex++; updates.push(`observations = $${paramIndex}`); params.push(observations); }
        if (job_id !== undefined) { paramIndex++; updates.push(`job_id = $${paramIndex}`); params.push(job_id); }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'Nenhum campo para atualizar' });
        }
        
        paramIndex++;
        params.push(id);
        
        await query(`UPDATE recruitment_candidates SET ${updates.join(', ')} WHERE id = $${paramIndex}`, params);
        res.json({ success: true, message: 'Candidato atualizado com sucesso' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ROTA: Deletar candidato
router.delete('/candidates/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await query(`DELETE FROM recruitment_candidates WHERE id = $1`, [id]);
        res.json({ success: true, message: 'Candidato removido com sucesso' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ROTA: Resumo dos candidatos
router.get('/candidates/summary', async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                stage,
                COUNT(*) as count
            FROM recruitment_candidates
            GROUP BY stage
        `);
        
        const summary = {
            total: 0,
            by_stage: {}
        };
        
        result.rows.forEach(row => {
            summary.total += parseInt(row.count);
            summary.by_stage[row.stage] = parseInt(row.count);
        });
        
        res.json({ success: true, data: summary });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ROTA: Importar em lote (candidatos)
router.post('/candidates/bulk', async (req, res) => {
    try {
        const { candidates, job_id } = req.body;
        
        if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
            return res.status(400).json({ error: 'Lista de candidatos é obrigatória' });
        }
        
        const created = [];
        const errors = [];
        const now = new Date().toISOString();
        
        // Busca primeira etapa do pipeline
        const stageResult = await query(`SELECT id FROM recruitment_pipeline_stages ORDER BY order_index ASC LIMIT 1`);
        const defaultStageId = stageResult.rows[0] ? stageResult.rows[0].id : null;
        
        // Inserir candidatos em sequência
        for (let index = 0; index < candidates.length; index++) {
            const cand = candidates[index];
            const { unit, requester, name, cpf, phone, birth_date, position, current_stage_id, stage_outcome, observations } = cand;
            
            if (!unit || !name) {
                errors.push({ index, error: 'Unidade e nome são obrigatórios' });
                continue;
            }
            
            const id = generateId();
            const stageId = current_stage_id || defaultStageId;
            
            try {
                await query(`
                    INSERT INTO recruitment_candidates (id, unit, requester, name, cpf, phone, birth_date, position, current_stage_id, stage_outcome, observations, job_id, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                `, [id, unit, requester, name, cpf, phone, birth_date, position, stageId, stage_outcome || '', observations, job_id, now, now]);
                
                created.push(id);
                
                // Registrar histórico
                if (stageId) {
                    await query(`INSERT INTO recruitment_candidate_history (id, candidate_id, to_stage_id, notes, moved_at) VALUES ($1, $2, $3, $4, $5)`,
                        [generateId(), id, stageId, 'Importado em lote', now]);
                }
            } catch (err) {
                errors.push({ index, error: err.message });
            }
        }
        
        res.json({ 
            success: true, 
            created: created.length, 
            errors: errors.length,
            error_details: errors
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// === ROTAS DE MOVIMENTAÇÃO NO PIPELINE ===

// ROTA: Mover candidato para próxima etapa
router.post('/candidates/:id/move', async (req, res) => {
    try {
        const { id } = req.params;
        const { to_stage_id, outcome, notes, moved_by } = req.body;
        
        if (!to_stage_id) {
            return res.status(400).json({ error: 'Etapa de destino é obrigatória' });
        }
        
        const now = new Date().toISOString();
        
        // Buscar etapa atual
        const rowResult = await query(`SELECT current_stage_id FROM recruitment_candidates WHERE id = $1`, [id]);
        if (!rowResult.rows[0]) return res.status(404).json({ error: 'Candidato não encontrado' });
        
        const fromStageId = rowResult.rows[0].current_stage_id;
        
        // Atualizar candidato
        await query(`
            UPDATE recruitment_candidates 
            SET current_stage_id = $1, stage_outcome = $2, updated_at = $3
            WHERE id = $4
        `, [to_stage_id, outcome || '', now, id]);
        
        // Registrar no histórico
        await query(`
            INSERT INTO recruitment_candidate_history (id, candidate_id, from_stage_id, to_stage_id, outcome, notes, moved_by, moved_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [generateId(), id, fromStageId, to_stage_id, outcome || '', notes || '', moved_by || '', now]);
        
        res.json({ success: true, message: 'Candidato movimentado com sucesso' });
    } catch (err) {
        console.error('Erro ao movimentar candidato:', err);
        res.status(500).json({ error: err.message });
    }
});

// ROTA: Obter histórico de movimentação de um candidato
router.get('/candidates/:id/history', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(`
            SELECT h.*, 
                fs.name as from_stage_name, 
                ts.name as to_stage_name,
                ts.color as to_stage_color
            FROM recruitment_candidate_history h
            LEFT JOIN recruitment_pipeline_stages fs ON h.from_stage_id = fs.id
            LEFT JOIN recruitment_pipeline_stages ts ON h.to_stage_id = ts.id
            WHERE h.candidate_id = $1
            ORDER BY h.moved_at DESC
        `, [id]);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// === ROTAS DE TALENT POOL (BANCO DE TALENTOS) ===

// Listar todos os talentos
router.get('/talent-pool', async (req, res) => {
    try {
        const { search, is_available, desired_position } = req.query;
        
        let sql = `SELECT * FROM talent_pool WHERE 1=1`;
        const params = [];
        let paramIndex = 0;
        
        if (is_available !== undefined) {
            paramIndex++;
            sql += ` AND is_available = $${paramIndex}`;
            params.push(is_available);
        }
        
        if (desired_position) {
            paramIndex++;
            sql += ` AND desired_position ILIKE $${paramIndex}`;
            params.push(`%${desired_position}%`);
        }
        
        if (search) {
            paramIndex++;
            sql += ` AND (name ILIKE $${paramIndex} OR skills ILIKE $${paramIndex} OR experience ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
        }
        
        sql += ` ORDER BY is_available DESC, created_at DESC`;
        
        const result = await query(sql, params);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Adicionar talento ao banco
router.post('/talent-pool', async (req, res) => {
    try {
        const { name, cpf, phone, email, birth_date, city, state, skills, experience, desired_position, salary_expectation, notes } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Nome é obrigatório' });
        }
        
        const id = generateId();
        const now = new Date().toISOString();
        
        await query(`
            INSERT INTO talent_pool (id, name, cpf, phone, email, birth_date, city, state, skills, experience, desired_position, salary_expectation, notes, is_available, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 1, $14, $15)
        `, [id, name, cpf, phone, email, birth_date, city, state, skills, experience, desired_position, salary_expectation, notes, now, now]);
        
        res.json({ success: true, id, message: 'Talento adicionado ao banco' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Arquivar candidato no talent pool
router.post('/candidates/:id/archive', async (req, res) => {
    try {
        const { id } = req.params;
        const { reason, notes } = req.body;
        
        const now = new Date().toISOString();
        
        // Buscar dados do candidato
        const candidateResult = await query(`SELECT * FROM recruitment_candidates WHERE id = $1`, [id]);
        const candidate = candidateResult.rows[0];
        if (!candidate) return res.status(404).json({ error: 'Candidato não encontrado' });
        
        const talentId = generateId();
        
        // Adicionar ao talent pool
        await query(`
            INSERT INTO talent_pool (id, name, cpf, phone, birth_date, desired_position, last_stage, last_outcome, notes, is_available, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1, $10, $11)
        `, [talentId, candidate.name, candidate.cpf, candidate.phone, candidate.birth_date, candidate.position, '', reason || '', notes || '', now, now]);
        
        // Remover da tabela de candidatos ativos
        await query(`DELETE FROM recruitment_candidates WHERE id = $1`, [id]);
        
        res.json({ success: true, talent_id: talentId, message: 'Candidato arquivado no banco de talentos' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// === ROTAS DE CONTRATAÇÃO ===

// Listar contratações
router.get('/hires', async (req, res) => {
    try {
        const { job_id, status } = req.query;
        
        let sql = `
            SELECT h.*, j.job_title, j.unit, c.name as candidate_name
            FROM recruitment_hires h
            LEFT JOIN recruitment_jobs j ON h.job_id = j.id
            LEFT JOIN recruitment_candidates c ON h.candidate_id = c.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 0;
        
        if (job_id) {
            paramIndex++;
            sql += ` AND h.job_id = $${paramIndex}`;
            params.push(job_id);
        }
        
        if (status) {
            paramIndex++;
            sql += ` AND h.status = $${paramIndex}`;
            params.push(status);
        }
        
        sql += ` ORDER BY h.created_at DESC`;
        
        const result = await query(sql, params);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Criar nova contratação
router.post('/hires', async (req, res) => {
    try {
        const { job_id, candidate_id, talent_pool_id, admission_date, initial_salary, contract_type, notes, created_by } = req.body;
        
        if (!job_id) {
            return res.status(400).json({ error: 'Vaga é obrigatória' });
        }
        
        const id = generateId();
        const now = new Date().toISOString();
        
        await query(`
            INSERT INTO recruitment_hires (id, job_id, candidate_id, talent_pool_id, hired_date, admission_date, initial_salary, contract_type, status, notes, created_by, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pendente', $9, $10, $11)
        `, [id, job_id, candidate_id, talent_pool_id, now, admission_date, initial_salary, contract_type, notes, created_by || '', now]);
        
        res.json({ success: true, id, message: 'Contratação registrada com sucesso' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
