/**
 * 🎯 API: Acompanhamento 90 Dias - Onboarding
 * Rotas para gerenciar o cronograma de acompanhamento de novos colaboradores
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// Cronograma GERAL (8 etapas)
const DEFAULT_STEPS = [
    {
        momento: 'Dia 1',
        nome_encontro: 'Onboarding\nBoas-Vindas Oficial',
        responsavel: 'Gente & Gestão (1 pessoa)',
        pauta_sugerida: 'Tour pela empresa\nApresentação da equipe e espaços\nEntrega de materiais\nCultura e valores da empresa',
        como_fazer: 'Presencial — integração formal\nDuração: 1h (max)',
        status: 'Pendente'
    },
    {
        momento: 'Dia 2',
        nome_encontro: 'Café com Gente & Gestão\nPrimeiras Impressões',
        responsavel: 'Gente & Gestão',
        pauta_sugerida: 'Como foi o primeiro dia?\nAlguma surpresa boa ou ruim?\nJá conheceu o time?',
        como_fazer: 'Copa — sem sala formal\nDuração: 10min',
        status: 'Pendente'
    },
    {
        momento: 'Dia 10',
        nome_encontro: 'Check-point 15 Dias\nConversa com o Colaborador',
        responsavel: 'Gente & Gestão (2 pessoas)',
        pauta_sugerida: 'Já se sente parte do time?\nA rotina está sendo como esperava?\nComo é sua relação com o gestor?\nAlgo que te incomoda ou preocupa?',
        como_fazer: 'Sala de reunião',
        status: 'Pendente'
    },
    {
        momento: 'Dia 10',
        nome_encontro: 'Check-point 15 Dias\nConversa com o Gestor',
        responsavel: 'Gestor G&G + Gestor',
        pauta_sugerida: 'Como o colaborador está se saindo?\nJá entendeu suas responsabilidades?\nAlgum ponto de atenção?\nPrecisa de apoio técnico ou de integração?',
        como_fazer: 'Não necessita de um momento formal',
        status: 'Pendente'
    },
    {
        momento: 'Dia 15',
        nome_encontro: 'Alinhamento',
        responsavel: 'Gestor + Colaborador',
        pauta_sugerida: 'Alinhamento do primeiro período.\nIdentificação de ajustes na rotina ou atividades (se necessário)\nFortalecimento do vínculo entre gestor e colaborador.',
        como_fazer: 'Não requer um momento formal, porém deve ser realizado individualmente.',
        status: 'Pendente'
    },
    {
        momento: 'Dia 45',
        nome_encontro: 'Avaliação de 45 Dias',
        responsavel: 'Gente & Gestão + Gestor (1 pessoa)',
        pauta_sugerida: 'Formulário de avaliação\nFeedback do gestor ao colaborador\nFeedback do colaborador',
        como_fazer: 'Sala de reunião\nUsar formulário padrão\nDuração: 15 - 30 min',
        status: 'Pendente'
    },
    {
        momento: 'Dia 60',
        nome_encontro: 'Check-point 60 Dias\nConversa de Meio Caminho',
        responsavel: 'Gente & Gestão (2 pessoas)',
        pauta_sugerida: 'Relacionamento com o time\nCrescimento\nExpectativas x Realidade\nAtividades',
        como_fazer: 'Sala de reunião',
        status: 'Pendente'
    },
    {
        momento: 'Dia 90',
        nome_encontro: 'Avaliação de 90 Dias',
        responsavel: 'Gente & Gestão + Gestor (1 pessoa)',
        pauta_sugerida: 'Avaliação completa\nFeedback final\nEfetivação\nAdesão de benefícios',
        como_fazer: 'Sala de reunião',
        status: 'Pendente'
    }
];

// Cronograma SERVIÇOS DIVERSOS (6 etapas) - para cargos do setor de serviços diversos
const SERVICOS_DIVERSOS_STEPS = [
    {
        momento: 'Dia 1',
        nome_encontro: 'Onboarding\nBoas-Vindas Oficial',
        responsavel: 'Gente & Gestão (1 pessoa)',
        pauta_sugerida: 'Tour pela empresa\nApresentação da equipe e espaços\nEntrega de materiais\nCultura e valores da empresa',
        como_fazer: 'Presencial — integração formal\nDuração: 1h (max)',
        status: 'Pendente'
    },
    {
        momento: 'Dia 2',
        nome_encontro: 'Café com Gente & Gestão\nPrimeiras Impressões',
        responsavel: 'Gente & Gestão',
        pauta_sugerida: 'Como foi o primeiro dia?\nAlguma surpresa boa ou ruim?\nJá conheceu o time?',
        como_fazer: 'Copa — sem sala formal\nDuração: 10min',
        status: 'Pendente'
    },
    {
        momento: 'Dia 10',
        nome_encontro: 'Check-point 15 Dias\nConversa com o Colaborador',
        responsavel: 'Gente & Gestão (2 pessoas)',
        pauta_sugerida: 'Já se sente parte do time?\nA rotina está sendo como esperava?\nComo é sua relação com o gestor?\nAlgo que te incomoda ou preocupa?',
        como_fazer: 'Sala de reunião',
        status: 'Pendente'
    },
    {
        momento: 'Dia 14',
        nome_encontro: 'Avaliação de 45 Dias',
        responsavel: 'Gente & Gestão + Gestor (1 pessoa)',
        pauta_sugerida: 'Formulário de avaliação\nFeedback do gestor ao colaborador\nFeedback do colaborador',
        como_fazer: 'Sala de reunião\nUsar formulário padrão\nDuração: 15 - 30 min',
        status: 'Pendente'
    },
    {
        momento: 'Dia 30',
        nome_encontro: 'Check-point 60 Dias\nConversa de Meio Caminho',
        responsavel: 'Gente & Gestão (2 pessoas)',
        pauta_sugerida: 'Relacionamento com o time\nCrescimento\nExpectativas x Realidade\nAtividades',
        como_fazer: 'Sala de reunião',
        status: 'Pendente'
    },
    {
        momento: 'Dia 60',
        nome_encontro: 'Avaliação de 90 Dias',
        responsavel: 'Gente & Gestão + Gestor (1 pessoa)',
        pauta_sugerida: 'Avaliação completa\nFeedback final\nEfetivação\nAdesão de benefícios',
        como_fazer: 'Sala de reunião',
        status: 'Pendente'
    }
];

// Helper para detectar se é Serviços Diversos
function isServicosDiversos(employee) {
    if (!employee) return false;
    const role = (employee.role || '').toLowerCase();
    const sector = (employee.sector || '').toLowerCase();
    return role.includes('serviço') || role.includes('servicos') || 
           sector.includes('serviço') || sector.includes('servicos') ||
           role.includes('diversos') || sector.includes('diversos');
}

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

// Obter etapas do onboarding de um colaborador
router.get('/onboarding/:employeeId', async (req, res) => {
    try {
        const { employeeId } = req.params;
        
        // Buscar etapas salvas no banco
        const result = await query(
            `SELECT * FROM onboarding_steps WHERE employee_id = $1 ORDER BY ordem, id`,
            [employeeId]
        );
        
        if (result.rows.length > 0) {
            return res.json({ steps: result.rows });
        }
        
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
            const dayMatch = step.momento.match(/Dia (\d+)/);
            const days = dayMatch ? parseInt(dayMatch[1]) - 1 : 0;
            
            let dataPrevista = null;
            if (admissionDate) {
                const date = new Date(admissionDate);
                date.setDate(date.getDate() + days);
                dataPrevista = date.toISOString().split('T')[0];
            }
            
            return {
                ...step,
                employee_id: employeeId,
                data_prevista: dataPrevista,
                data_realizada: null,
                anotacao: '',
                ordem: index
            };
        });
        
        res.json({ steps });
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
        
        if (!Array.isArray(steps)) {
            return res.status(400).json({ error: 'Dados inválidos: steps deve ser um array' });
        }
        
        // Deletar etapas existentes
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
                    step.pauta_sugerida,
                    step.como_fazer,
                    step.status || 'Pendente',
                    step.data_prevista || null,
                    step.data_realizada || null,
                    step.anotacao || '',
                    i
                ]
            );
        }
        
        res.json({ success: true, message: 'Onboarding salvo com sucesso' });
    } catch (err) {
        console.error('Erro ao salvar onboarding:', err);
        res.status(500).json({ error: err.message });
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
