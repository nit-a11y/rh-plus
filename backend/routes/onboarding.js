/**
 * 🎯 API: Acompanhamento 90 Dias - Onboarding
 * Rotas para gerenciar o cronograma de acompanhamento de novos colaboradores
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { 
    DEFAULT_STEPS, 
    SERVICOS_DIVERSOS_STEPS, 
    isServicosDiversos, 
    calculateDateFromDay 
} = require('../config/onboarding-templates');

// Cache para performance
const cache = {
    employees: { data: null, timestamp: 0, ttl: 300000 }, // 5 minutos
    onboardingSteps: new Map(), // employeeId -> { data, timestamp }
    cargoConfigs: { data: null, timestamp: 0, ttl: 600000 } // 10 minutos
};

// Helper para verificar cache
function isCacheValid(cacheEntry) {
    return cacheEntry.data && (Date.now() - cacheEntry.timestamp) < cacheEntry.ttl;
}

// Helper para limpar cache específico
function clearCache(type, key = null) {
    if (type === 'employees') {
        cache.employees.data = null;
        cache.employees.timestamp = 0;
    } else if (type === 'onboarding' && key) {
        cache.onboardingSteps.delete(key);
    } else if (type === 'cargoConfigs') {
        cache.cargoConfigs.data = null;
        cache.cargoConfigs.timestamp = 0;
    }
}


// API otimizada para colaboradores em período de onboarding (até 93 dias)
router.get('/employees-onboarding', async (req, res) => {
    try {
        const { includeAll = 'false' } = req.query;
        
        // Calcular data de corte (93 dias atrás)
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 93);
        const cutoffDateStr = cutoffDate.toISOString().split('T')[0];
        
        console.log(`🔍 Buscando colaboradores ${includeAll === 'true' ? 'TODOS' : 'até 93 dias'} (desde ${cutoffDateStr})`);
        
        let queryStr, params;
        
        if (includeAll === 'true') {
            // Modo completo: todos os colaboradores ativos
            queryStr = `
                SELECT e.id, e.name, e."admissionDate", e.role, e.sector, e.type, e."photoUrl", e."registrationNumber"
                FROM employees e 
                WHERE e.type != 'Desligado'
                AND e."admissionDate" IS NOT NULL
                ORDER BY e."admissionDate" DESC
            `;
            params = [];
        } else {
            // Modo otimizado: apenas colaboradores até 93 dias
            queryStr = `
                SELECT e.id, e.name, e."admissionDate", e.role, e.sector, e.type, e."photoUrl", e."registrationNumber"
                FROM employees e 
                WHERE e.type != 'Desligado'
                AND e."admissionDate" IS NOT NULL
                AND e."admissionDate" >= $1
                ORDER BY e."admissionDate" DESC
            `;
            params = [cutoffDateStr];
        }
        
        const result = await query(queryStr, params);
        
        // Adicionar metadata para frontend
        const response = {
            employees: result.rows,
            metadata: {
                total: result.rows.length,
                filter: includeAll === 'true' ? 'all' : 'onboarding',
                cutoffDate: cutoffDateStr,
                maxDays: includeAll === 'true' ? null : 93,
                queryTime: Date.now()
            }
        };
        
        console.log(`✅ Encontrados ${result.rows.length} colaboradores`);
        res.json(response);
        
    } catch (err) {
        console.error('Erro ao buscar colaboradores onboarding:', err);
        res.status(500).json({ error: err.message });
    }
});

// API para fornecer templates ao frontend
router.get('/templates', (req, res) => {
    try {
        console.log('🔍 Backend: Templates API chamada');
        console.log('🔍 Backend: DEFAULT_STEPS disponível:', !!DEFAULT_STEPS, typeof DEFAULT_STEPS);
        console.log('🔍 Backend: SERVICOS_DIVERSOS_STEPS disponível:', !!SERVICOS_DIVERSOS_STEPS, typeof SERVICOS_DIVERSOS_STEPS);
        
        const responseData = {
            DEFAULT_STEPS,
            SERVICOS_DIVERSOS_STEPS
        };
        
        console.log('� Backend: Estrutura de resposta:', {
            keys: Object.keys(responseData),
            hasDefault: !!responseData.DEFAULT_STEPS,
            hasServicos: !!responseData.SERVICOS_DIVERSOS_STEPS,
            defaultLength: Array.isArray(responseData.DEFAULT_STEPS) ? responseData.DEFAULT_STEPS.length : 'N/A',
            servicosLength: Array.isArray(responseData.SERVICOS_DIVERSOS_STEPS) ? responseData.SERVICOS_DIVERSOS_STEPS.length : 'N/A'
        });
        
        res.json(responseData);
        console.log('📋 Templates API enviada com sucesso');
    } catch (err) {
        console.error('Erro ao buscar templates:', err);
        res.status(500).json({ error: err.message });
    }
});

// ----------------------------------------------------------
// ROTAS ESPECÍFICAS (DEVEM VIR ANTES DAS ROTAS COM PARÂMETRO)
// ----------------------------------------------------------

// DEBUG: Verificar colaboradores sem onboarding
router.get('/debug-missing-onboarding', async (req, res) => {
    try {
        const today = new Date();
        
        const employeesRes = await query(`
            SELECT e.id, e.name, e."admissionDate", e.role, e.type
            FROM employees e 
            WHERE e.type != 'Desligado'
            AND e."admissionDate" IS NOT NULL
            ORDER BY e."admissionDate" DESC
        `);
        
        const results = [];
        
        for (const emp of employeesRes.rows) {
            const admission = new Date(emp.admissionDate);
            const diffTime = today - admission;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            const stepsRes = await query(`SELECT * FROM onboarding_steps WHERE employee_id = $1`, [emp.id]);
            const hasOnboarding = stepsRes.rows.some(s => s.data_prevista);
            
            results.push({
                id: emp.id,
                name: emp.name,
                role: emp.role,
                admissionDate: emp.admissionDate,
                dias: diffDays,
                temOnboarding: hasOnboarding,
                precisaNotificacao: !hasOnboarding && diffDays >= 1 && diffDays <= 90
            });
        }
        
        const pending = results.filter(r => r.precisaNotificacao);
        
        res.json({ total: results.length, pending: pending.length, pendingList: pending });
    } catch (err) {
        console.error('Erro no debug:', err);
        res.status(500).json({ error: err.message });
    }
});

// Gerar notificações de onboarding pendentes
router.post('/generate-notifications', async (req, res) => {
    try {
        const today = new Date();
        
        const employeesRes = await query(`
            SELECT e.id, e.name, e."admissionDate", e.role, e."photoUrl"
            FROM employees e 
            WHERE e.type != 'Desligado'
            AND e."admissionDate" IS NOT NULL
        `);
        
        let notificationsCreated = 0;
        
        for (const emp of employeesRes.rows) {
            const stepsRes = await query(`SELECT * FROM onboarding_steps WHERE employee_id = $1`, [emp.id]);
            const hasRealSteps = stepsRes.rows.some(s => s.data_prevista);
            
            // Verificar se NÃO tem cronograma iniciado
            if (!hasRealSteps) {
                const admission = new Date(emp.admissionDate);
                const diffDays = Math.ceil((today - admission) / (1000 * 60 * 60 * 24));
                
                if (diffDays >= 1 && diffDays <= 90) {
                    const existingRes = await query(`
                        SELECT id FROM notifications 
                        WHERE employee_id = $1 AND type = 'onboarding-sem-inicio' AND readed = FALSE
                    `, [emp.id]);
                    
                    if (existingRes.rows.length === 0) {
                        let priority = 'low';
                        let title = `📋 ${emp.name} - Onboarding pendente`;
                        
                        if (diffDays <= 7) {
                            priority = 'high';
                            title = `🚨 URGENTE: ${emp.name} sem início do onboarding`;
                        } else if (diffDays <= 30) {
                            priority = 'medium';
                            title = `⚡ ${emp.name} - Cronograma não iniciado`;
                        }
                        
                        await query(`
                            INSERT INTO notifications (employee_id, employee_name, step_momento, step_nome, type, title, message, priority)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                        `, [emp.id, emp.name, `${diffDays} dias`, 'Cronograma não iniciado', 'onboarding-sem-inicio', title, `${emp.name} - ${emp.role}. Admitido há ${diffDays} dias.`, priority]);
                        notificationsCreated++;
                    }
                }
                continue;
            }
            
            // Verificar etapas pendentes (lógica existente)
            for (const step of stepsRes.rows) {
                if (step.status === 'Realizado' || !step.data_prevista) continue;
                
                const diffDays = Math.ceil((new Date(step.data_prevista) - today) / (1000 * 60 * 60 * 24));
                
                let priority = null, title = null, typeSuffix = '';
                
                if (diffDays < -1) {
                    priority = 'high'; typeSuffix = 'atrasada';
                    title = `⚠️ Etapa ATRASADA: ${step.nome_encontro}`;
                } else if (diffDays === 0) {
                    priority = 'medium'; typeSuffix = 'hoje';
                    title = `📅 Etapa HOJE: ${step.nome_encontro}`;
                } else if (diffDays === 1) {
                    priority = 'medium'; typeSuffix = '1_dia';
                    title = `⏰ Etapa AMANHÃ: ${step.nome_encontro}`;
                } else if (diffDays === 2) {
                    priority = 'low'; typeSuffix = '2_dias';
                    title = `📆 Etapa em 2 dias: ${step.nome_encontro}`;
                } else if (diffDays === 3) {
                    priority = 'low'; typeSuffix = '3_dias';
                    title = `📆 Etapa em 3 dias: ${step.nome_encontro}`;
                } else if (diffDays > 3 && diffDays <= 7) {
                    priority = 'low'; typeSuffix = 'proximos';
                    title = `📆 Etapa em ${diffDays} dias: ${step.nome_encontro}`;
                }
                
                if (priority) {
                    const existingRes = await query(`
                        SELECT id FROM notifications 
                        WHERE employee_id = $1 AND step_momento = $2 AND type LIKE $3 AND readed = FALSE
                    `, [emp.id, step.momento, `onboarding-${typeSuffix}%`]);
                    
                    if (existingRes.rows.length === 0) {
                        await query(`
                            INSERT INTO notifications (employee_id, employee_name, step_momento, step_nome, type, title, message, priority)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                        `, [emp.id, emp.name, step.momento, step.nome_encontro, `onboarding-${typeSuffix}`, title, `${emp.name} - ${step.momento}`, priority]);
                        notificationsCreated++;
                    }
                }
            }
        }
        
        res.json({ success: true, notificationsCreated });
    } catch (err) {
        console.error('Erro ao gerar notificações:', err);
        res.status(500).json({ error: err.message });
    }
});

// Obter etapas do onboarding de um colaborador - COM CACHE
router.get('/onboarding/:employeeId', async (req, res) => {
    try {
        const { employeeId } = req.params;
        
        // Verificar cache primeiro
        const cached = cache.onboardingSteps.get(employeeId);
        if (cached && isCacheValid(cached)) {
            console.log(`📋 Cache HIT para onboarding: ${employeeId}`);
            return res.json(cached.data);
        }
        
        console.log(`📋 Cache MISS para onboarding: ${employeeId}`);
        
        // Buscar etapas salvas no banco
        const result = await query(
            `SELECT * FROM onboarding_steps WHERE employee_id = $1 ORDER BY ordem, id`,
            [employeeId]
        );
        
        let responseData;
        
        if (result.rows.length > 0) {
            responseData = { steps: result.rows };
        } else {
            // Se não tem etapas salvas, retorna as padrão
            // Buscar dados do colaborador
            const empResult = await query(
                `SELECT "admissionDate", role, sector FROM employees WHERE id = $1`,
                [employeeId]
            );
            
            const emp = empResult.rows[0];
            const admissionDate = emp?.admissionDate;
            
            // Escolher cronograma correto
            const isServDiv = isServicosDiversos(emp);
            const stepsTemplate = isServDiv ? SERVICOS_DIVERSOS_STEPS : DEFAULT_STEPS;
            console.log(`📋 Backend: Usando cronograma ${isServDiv ? 'SERVIÇOS DIVERSOS' : 'GERAL'} para ${employeeId}`);
            
            const steps = stepsTemplate.map((step, index) => {
                let dataPrevista = calculateDateFromDay(step.momento, admissionDate);
                
                return {
                    ...step,
                    employee_id: employeeId,
                    data_prevista: dataPrevista,
                    data_realizada: null,
                    anotacao: '',
                    ordem: index
                };
            });
            
            responseData = { steps };
        }
        
        // Salvar no cache
        cache.onboardingSteps.set(employeeId, {
            data: responseData,
            timestamp: Date.now()
        });
        
        res.json(responseData);
    } catch (err) {
        console.error('Erro ao buscar onboarding:', err);
        res.status(500).json({ error: err.message });
    }
});

// Salvar/atualizar etapas do onboarding
router.put('/onboarding/:employeeId', async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { steps } = req.body;
        
        // Validação robusta
        if (!Array.isArray(steps)) {
            return res.status(400).json({ error: 'Dados inválidos: steps deve ser um array' });
        }
        
        if (steps.length === 0) {
            return res.status(400).json({ error: 'Dados inválidos: steps não pode estar vazio' });
        }
        
        // Validar estrutura de cada step
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            if (!step.momento || !step.nome_encontro || !step.responsavel) {
                return res.status(400).json({ 
                    error: `Step inválido no índice ${i}: momento, nome_encontro e responsavel são obrigatórios` 
                });
            }
            
            // Validar status
            const validStatus = ['Pendente', 'Agendado', 'Realizado'];
            if (step.status && !validStatus.includes(step.status)) {
                return res.status(400).json({ 
                    error: `Status inválido no índice ${i}: deve ser Pendente, Agendado ou Realizado` 
                });
            }
        }
        
        // Usar abordagem mais simples: DELETE + INSERT em sequência
        // PostgreSQL é rápido para operações simples e não precisa de transação manual
        await query(`DELETE FROM onboarding_steps WHERE employee_id = $1`, [employeeId]);
        
        // Inserir novas etapas
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            await query(
                `INSERT INTO onboarding_steps (
                    employee_id, momento, nome_encontro, responsavel, 
                    pauta_sugerida, como_fazer, status, data_prevista, 
                    data_realizada, anotacao, ordem, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
                [
                    employeeId,
                    step.momento,
                    step.nome_encontro,
                    step.responsavel,
                    step.pauta_sugerida || '',
                    step.como_fazer || '',
                    step.status || 'Pendente',
                    step.data_prevista || null,
                    step.data_realizada || null,
                    step.anotacao || '',
                    i
                ]
            );
        }
        
        // Limpar cache do colaborador específico
        clearCache('onboarding', employeeId);
        
        console.log(`✅ Onboarding salvo: ${steps.length} etapas para colaborador ${employeeId}`);
        res.json({ success: true, message: 'Onboarding salvo com sucesso', stepsCount: steps.length });
        
    } catch (err) {
        console.error('❌ Erro ao salvar onboarding:', err);
        
        // Log estruturado para debugging
        const errorInfo = {
            timestamp: new Date().toISOString(),
            employeeId: req.params.employeeId,
            stepsCount: req.body?.steps?.length || 0,
            error: err.message,
            stack: err.stack
        };
        
        if (process.env.NODE_ENV === 'development') {
            console.error('🔍 Debug info:', JSON.stringify(errorInfo, null, 2));
        }
        
        res.status(500).json({ 
            error: 'Erro ao salvar onboarding: ' + err.message,
            details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
            timestamp: errorInfo.timestamp
        });
    }
});

// Resetar etapas para padrão
router.post('/onboarding/:employeeId/reset', async (req, res) => {
    try {
        const { employeeId } = req.params;
        
        // Deletar etapas existentes
        await query(`DELETE FROM onboarding_steps WHERE employee_id = $1`, [employeeId]);
        
        // Buscar dados do colaborador
        const empResult = await query(
            `SELECT "admissionDate", role, sector FROM employees WHERE id = $1`,
            [employeeId]
        );
        const emp = empResult.rows[0];
        const admissionDate = emp?.admissionDate;
        
        // Escolher cronograma correto
        const isServDiv = isServicosDiversos(emp);
        const stepsTemplate = isServDiv ? SERVICOS_DIVERSOS_STEPS : DEFAULT_STEPS;
        
        // Inserir etapas padrão
        for (let i = 0; i < stepsTemplate.length; i++) {
            const step = stepsTemplate[i];
            const dayMatch = step.momento.match(/Dia (\d+)/);
            const days = dayMatch ? parseInt(dayMatch[1]) - 1 : 0;
            
            let dataPrevista = null;
            if (admissionDate) {
                const date = new Date(admissionDate);
                date.setDate(date.getDate() + days);
                dataPrevista = date.toISOString().split('T')[0];
            }
            
            await query(
                `INSERT INTO onboarding_steps (
                    employee_id, momento, nome_encontro, responsavel, 
                    pauta_sugerida, como_fazer, status, data_prevista, 
                    data_realizada, anotacao, ordem, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
                [
                    employeeId,
                    step.momento,
                    step.nome_encontro,
                    step.responsavel,
                    step.pauta_sugerida,
                    step.como_fazer,
                    'Pendente',
                    dataPrevista,
                    null,
                    '',
                    i
                ]
            );
        }
        
        res.json({ success: true, message: 'Onboarding resetado para padrão' });
    } catch (err) {
        console.error('Erro ao resetar onboarding:', err);
        res.status(500).json({ error: err.message });
    }
});

// Salvar configuração de cronograma para um cargo
router.post('/onboarding/cargo-config', async (req, res) => {
    try {
        const { cargo, cronograma_tipo } = req.body;
        
        if (!cargo || !cronograma_tipo) {
            return res.status(400).json({ error: 'Cargo e cronograma_tipo são obrigatórios' });
        }
        
        // Criar tabela se não existir
        await query(`
            CREATE TABLE IF NOT EXISTS onboarding_cargo_config (
                id SERIAL PRIMARY KEY,
                cargo TEXT UNIQUE NOT NULL,
                cronograma_tipo TEXT NOT NULL DEFAULT 'geral',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);
        
        // Inserir ou atualizar configuração
        await query(
            `INSERT INTO onboarding_cargo_config (cargo, cronograma_tipo, updated_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (cargo) 
             DO UPDATE SET cronograma_tipo = $2, updated_at = NOW()`,
            [cargo, cronograma_tipo]
        );
        
        res.json({ success: true, message: `Configuração salva: ${cargo} → ${cronograma_tipo}` });
    } catch (err) {
        console.error('Erro ao salvar configuração:', err);
        res.status(500).json({ error: err.message });
    }
});

// Buscar configuração de cronograma para um cargo
router.get('/onboarding/cargo-config/:cargo', async (req, res) => {
    try {
        const { cargo } = req.params;
        
        const result = await query(
            `SELECT cronograma_tipo FROM onboarding_cargo_config WHERE cargo = $1`,
            [cargo]
        );
        
        if (result.rows.length > 0) {
            res.json({ cargo, cronograma_tipo: result.rows[0].cronograma_tipo });
        } else {
            res.json({ cargo, cronograma_tipo: 'geral' }); // Padrão
        }
    } catch (err) {
        console.error('Erro ao buscar configuração:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
