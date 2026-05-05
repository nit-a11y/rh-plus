/**
 * 🎯 CONFIG: Templates de Onboarding - Fonte Única da Verdade
 * Elimina duplicação entre frontend e backend
 */

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

// Cronograma SERVIÇOS DIVERSOS (6 etapas)
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

// Helper para detectar se é Serviços Diversos - MELHORADO
function isServicosDiversos(employee) {
    if (!employee) return false;
    
    const role = (employee.role || '').toLowerCase().trim();
    const sector = (employee.sector || '').toLowerCase().trim();
    
    // Mapeamento explícito de cargos/setores Serviços Diversos
    const SERVICOS_DIVERSOS_KEYWORDS = [
        'serviços diversos', 'servicos diversos',
        'serviço', 'servico', 'serviços', 'servicos',
        'auxiliar de serviços', 'auxiliar de servicos',
        'serviços gerais', 'servicos gerais',
        'auxiliar geral', 'auxiliar de limpeza',
        'copeira', 'copa', 'auxiliar de copa',
        'vigia', 'segurança', 'portaria',
        'motorista', 'chefe de veículo',
        'diversos', 'geral'
    ];
    
    // Verificar keywords exatas ou parciais
    for (const keyword of SERVICOS_DIVERSOS_KEYWORDS) {
        if (role.includes(keyword) || sector.includes(keyword)) {
            console.log(`🔍 Detecção Serviços Diversos: "${employee.role}" / "${employee.sector}" -> keyword: "${keyword}"`);
            return true;
        }
    }
    
    // Verificação por padrão regex para variações
    const servicosPattern = /servi[çc]os?\s*(diversos|gerais)?/i;
    const auxiliarPattern = /auxiliar\s+(de\s+)?(servi[çc]os?|copa|geral|limpeza)/i;
    
    if (servicosPattern.test(role) || servicosPattern.test(sector) ||
        auxiliarPattern.test(role) || auxiliarPattern.test(sector)) {
        console.log(`🔍 Detecção Serviços Diversos (regex): "${employee.role}" / "${employee.sector}"`);
        return true;
    }
    
    return false;
}

// Helper para calcular data prevista com validação
function calculateDateFromDay(momento, admissionDate) {
    if (!admissionDate) return '';
    
    const admission = new Date(admissionDate);
    const dayMatch = momento.match(/Dia (\d+)/);
    if (!dayMatch) return '';
    
    const days = parseInt(dayMatch[1]) - 1;
    const result = new Date(admission);
    result.setDate(result.getDate() + days);
    
    // Validação: não permitir datas anteriores à admissão
    if (result < admission && days > 0) {
        console.warn(`⚠️ Data calculada (${result.toISOString().split('T')[0]}) é anterior à admissão (${admission.toISOString().split('T')[0]})`);
        return admission.toISOString().split('T')[0];
    }
    
    return result.toISOString().split('T')[0];
}

module.exports = {
    DEFAULT_STEPS,
    SERVICOS_DIVERSOS_STEPS,
    isServicosDiversos,
    calculateDateFromDay
};
