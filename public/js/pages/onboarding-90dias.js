/**
 * 🎯 MÓDULO: Acompanhamento 90 Dias
 * Jornada de experiência do colaborador — do primeiro dia até os 90 dias
 */

// Estado global
let employees = [];
let selectedEmployeeId = null;
let filterStatus = 'active';
let onboardingSteps = [];
let currentCronogramaType = 'geral'; // 'geral' ou 'servicos_diversos'
let templatesCache = null; // Cache para templates da API
let loadingState = 'initializing'; // 'initializing', 'loading', 'ready', 'error'
let showAllEmployees = false; // Toggle para mostrar todos ou apenas onboarding
let onboardingMetadata = null; // Metadata da API

// Cache de performance
const performanceCache = {
    onboardingEmployees: { data: null, timestamp: 0, ttl: 300000 }, // 5 minutos
    allEmployees: { data: null, timestamp: 0, ttl: 300000 }, // 5 minutos
    experienceStatus: new Map() // employeeId -> { status, timestamp }
};


// Helper para gerenciar loading states
function setLoadingState(state, message = '') {
    loadingState = state;
    const overlay = document.getElementById('loading-overlay');
    
    switch (state) {
        case 'initializing':
            if (overlay) {
                overlay.style.display = 'flex';
                overlay.querySelector('p').textContent = 'Inicializando módulo...';
                overlay.querySelector('p:last-child').textContent = 'Preparando acompanhamento de 90 dias';
            }
            break;
            
        case 'loading':
            if (overlay) {
                overlay.style.display = 'flex';
                overlay.querySelector('p').textContent = message || 'Carregando dados...';
                overlay.querySelector('p:last-child').textContent = 'Buscando informações dos colaboradores';
            }
            break;
            
        case 'ready':
            if (overlay) {
                overlay.style.opacity = '0';
                setTimeout(() => {
                    overlay.style.display = 'none';
                    overlay.style.opacity = '1';
                }, 300);
            }
            break;
            
        case 'error':
            if (overlay) {
                overlay.style.display = 'flex';
                overlay.querySelector('p').textContent = 'Erro ao carregar';
                overlay.querySelector('p:last-child').textContent = message || 'Tente recarregar a página';
            }
            break;
    }
}

// Helper para renderizar skeleton loading
function renderSkeletonLoading(count = 8) {
    const container = document.getElementById('employee-list');
    if (!container) return;
    
    const skeletons = Array.from({ length: count }, (_, i) => `
        <div class="skeleton-item">
            <div class="skeleton skeleton-avatar"></div>
            <div class="flex-1">
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text small"></div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = skeletons;
}

// Helper para verificar cache de performance
function isPerformanceCacheValid(cacheEntry) {
    return cacheEntry.data && (Date.now() - cacheEntry.timestamp) < cacheEntry.ttl;
}
function showToast(message, type = 'success') {
    // Criar elemento toast se não existir
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            pointer-events: none;
        `;
        document.body.appendChild(toastContainer);
    }
    
    const toast = document.createElement('div');
    const bgColor = type === 'error' ? '#DC2626' : '#059669';
    const textColor = 'white';
    
    toast.style.cssText = `
        background: ${bgColor};
        color: ${textColor};
        padding: 12px 20px;
        border-radius: 8px;
        margin-bottom: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-size: 14px;
        font-weight: 600;
        max-width: 300px;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        pointer-events: auto;
    `;
    
    toast.textContent = message;
    
    // CORREÇÃO: Adicionar toast diretamente (sem appendChild duplicado)
    toastContainer.appendChild(toast);
    
    // Animar entrada
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    // Remover após 3 segundos
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Helper para gerenciar estado de loading em botões
function setButtonLoading(button, isLoading) {
    if (!button) return;
    
    if (isLoading) {
        // Salvar conteúdo original
        button.dataset.originalText = button.textContent;
        button.disabled = true;
        button.style.opacity = '0.7';
        button.style.cursor = 'not-allowed';
        
        // Adicionar spinner
        const spinner = document.createElement('span');
        spinner.style.cssText = `
            display: inline-block;
            width: 14px;
            height: 14px;
            border: 2px solid transparent;
            border-top: 2px solid currentColor;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-right: 8px;
        `;
        
        // Adicionar keyframe de animação se não existir
        if (!document.querySelector('#spinner-keyframe')) {
            const style = document.createElement('style');
            style.id = 'spinner-keyframe';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
        
        button.insertBefore(spinner, button.firstChild);
        button.textContent = ' Processando...';
    } else {
        // Restaurar estado original
        button.disabled = false;
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
        
        // Remover spinner
        const spinner = button.querySelector('span[style*="animation: spin"]');
        if (spinner) {
            spinner.remove();
        }
        
        // Restaurar texto original
        if (button.dataset.originalText) {
            button.textContent = button.dataset.originalText;
            delete button.dataset.originalText;
        }
    }
}

// Carregar templates da API (cache)
async function loadTemplates() {
    if (templatesCache && templatesCache.DEFAULT_STEPS && templatesCache.SERVICOS_DIVERSOS_STEPS) {
        return templatesCache;
    }
    
    try {
        const res = await fetch('/api/templates');
        if (!res.ok) throw new Error('Erro ao carregar templates');
        const data = await res.json();
        
        // DEBUG: Log detalhado do que foi recebido
        console.log('🔍 Resposta da API /templates:', {
            tipo: typeof data,
            keys: Object.keys(data),
            hasDefault: !!data.DEFAULT_STEPS,
            hasServicos: !!data.SERVICOS_DIVERSOS_STEPS,
            defaultType: typeof data.DEFAULT_STEPS,
            servicosType: typeof data.SERVICOS_DIVERSOS_STEPS,
            defaultLength: Array.isArray(data.DEFAULT_STEPS) ? data.DEFAULT_STEPS.length : 'N/A',
            servicosLength: Array.isArray(data.SERVICOS_DIVERSOS_STEPS) ? data.SERVICOS_DIVERSOS_STEPS.length : 'N/A'
        });
        
        // Validar estrutura dos templates
        if (!data.DEFAULT_STEPS || !data.SERVICOS_DIVERSOS_STEPS) {
            console.error('❌ Estrutura inválida detectada:', {
                data: data,
                DEFAULT_STEPS: data.DEFAULT_STEPS,
                SERVICOS_DIVERSOS_STEPS: data.SERVICOS_DIVERSOS_STEPS
            });
            throw new Error('Estrutura de templates inválida');
        }
        
        templatesCache = data;
        console.log('✅ Templates carregados:', Object.keys(templatesCache));
        return templatesCache;
    } catch (err) {
        console.error('❌ Erro ao carregar templates:', err);
        // Fallback: templates básicos hardcoded
        const fallbackTemplates = {
            DEFAULT_STEPS: [
                { momento: 'Dia 1', nome_encontro: 'Onboarding', responsavel: 'Gente & Gestão', pauta_sugerida: 'Boas-vindas', como_fazer: 'Presencial', status: 'Pendente' },
                { momento: 'Dia 90', nome_encontro: 'Avaliação Final', responsavel: 'Gestor', pauta_sugerida: 'Avaliação', como_fazer: 'Reunião', status: 'Pendente' }
            ],
            SERVICOS_DIVERSOS_STEPS: [
                { momento: 'Dia 1', nome_encontro: 'Onboarding', responsavel: 'Gente & Gestão', pauta_sugerida: 'Boas-vindas', como_fazer: 'Presencial', status: 'Pendente' },
                { momento: 'Dia 60', nome_encontro: 'Avaliação Final', responsavel: 'Gestor', pauta_sugerida: 'Avaliação', como_fazer: 'Reunião', status: 'Pendente' }
            ]
        };
        
        templatesCache = fallbackTemplates;
        return fallbackTemplates;
    }
}

// Detectar se é cronograma de Serviços Diversos - MELHORADO
function isServicosDiversos(emp) {
    if (!emp) return false;
    
    const cargo = (emp.role || '').toLowerCase().trim();
    const setor = (emp.sector || '').toLowerCase().trim();
    
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
        if (cargo.includes(keyword) || setor.includes(keyword)) {
            console.log(`🔍 Frontend: Detecção Serviços Diversos: "${emp.role}" / "${emp.sector}" -> keyword: "${keyword}"`);
            return true;
        }
    }
    
    // Verificação por padrão regex para variações
    const servicosPattern = /servi[çc]os?\s*(diversos|gerais)?/i;
    const auxiliarPattern = /auxiliar\s+(de\s+)?(servi[çc]os?|copa|geral|limpeza)/i;
    
    if (servicosPattern.test(cargo) || servicosPattern.test(setor) ||
        auxiliarPattern.test(cargo) || auxiliarPattern.test(setor)) {
        console.log(`🔍 Frontend: Detecção Serviços Diversos (regex): "${emp.role}" / "${emp.sector}"`);
        return true;
    }
    
    return false;
}

// Inicialização otimizada com carregamento paralelo
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎯 Módulo Acompanhamento 90 Dias inicializado');
    
    try {
        setLoadingState('initializing');
        
        // Renderizar skeleton imediatamente
        renderSkeletonLoading(8);
        
        // Carregar templates e funcionários em paralelo
        const [templatesResult, employeesResult] = await Promise.allSettled([
            loadTemplates(),
            loadEmployeesOptimized()
        ]);
        
        // Verificar resultados
        if (templatesResult.status === 'rejected') {
            console.error('❌ Erro ao carregar templates:', templatesResult.reason);
        }
        
        if (employeesResult.status === 'rejected') {
            throw new Error('Falha ao carregar colaboradores');
        }
        
        console.log('✅ Dados carregados:', employees.length, 'colaboradores');
        
        // Renderizar interface
        setLoadingState('loading', 'Renderizando interface...');
        renderSidebarOptimized();
        
        // Finalizar
        setLoadingState('ready');
        
    } catch (err) {
        console.error('❌ Erro na inicialização:', err);
        setLoadingState('error', err.message);
        showToast('❌ Erro ao carregar módulo: ' + err.message, 'error');
    }
});

// Verificar status do período de experiência
function getExperienceStatus(admissionDate) {
    if (!admissionDate) return { type: null, days: 0 };
    const admission = new Date(admissionDate);
    const today = new Date();
    const diffTime = today - admission;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 90) {
        return { type: 'approved', days: diffDays }; // Verde - Aprovado
    } else if (diffDays >= 0) {
        return { type: 'probation', days: diffDays }; // Amarelo - Em experiência
    }
    return { type: null, days: 0 };
}

// Carregar colaboradores com cache e performance otimizada
async function loadEmployeesOptimized() {
    const cacheKey = showAllEmployees ? 'allEmployees' : 'onboardingEmployees';
    
    // Verificar cache primeiro
    if (isPerformanceCacheValid(performanceCache[cacheKey])) {
        console.log(`📋 Usando cache de colaboradores (${showAllEmployees ? 'TODOS' : 'onboarding'})`);
        const cached = performanceCache[cacheKey];
        employees = cached.data.employees;
        onboardingMetadata = cached.data.metadata;
        return employees;
    }
    
    try {
        setLoadingState('loading', `Carregando ${showAllEmployees ? 'todos' : 'colaboradores em onboarding'}...`);
        
        const url = `/api/employees-onboarding${showAllEmployees ? '?includeAll=true' : ''}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Erro ao carregar colaboradores');
        const data = await res.json();
        
        // Extrair dados e metadata
        employees = data.employees || [];
        onboardingMetadata = data.metadata || {};
        
        // Pré-calcular status de experiência para todos os funcionários
        employees.forEach(emp => {
            const status = getExperienceStatus(emp.admissionDate);
            performanceCache.experienceStatus.set(emp.id, {
                ...status,
                timestamp: Date.now()
            });
        });
        
        // Salvar no cache
        performanceCache[cacheKey] = {
            data: { employees, metadata: onboardingMetadata },
            timestamp: Date.now()
        };
        
        console.log(`✅ Colaboradores carregados (${showAllEmployees ? 'TODOS' : 'onboarding'}):`, employees.length);
        if (onboardingMetadata.filter) {
            console.log(`📊 Filtro aplicado: ${onboardingMetadata.filter}, corte: ${onboardingMetadata.cutoffDate}`);
        }
        
        return employees;
    } catch (err) {
        console.error('❌ Erro ao carregar colaboradores:', err);
        employees = [];
        onboardingMetadata = null;
        throw err;
    }
}

// Toggle para mostrar todos ou apenas onboarding
window.toggleEmployeeFilter = async () => {
    showAllEmployees = !showAllEmployees;
    
    // Atualizar UI do botão
    const btn = document.getElementById('toggle-employees-btn');
    if (btn) {
        btn.textContent = showAllEmployees ? '👥 Onboarding' : '👥 Todos';
        btn.title = showAllEmployees ? 'Mostrar apenas colaboradores em onboarding (até 93 dias)' : 'Mostrar todos os colaboradores';
        btn.className = showAllEmployees 
            ? 'text-[9px] bg-orange-100 text-orange-600 px-2 py-1 rounded-lg font-black'
            : 'text-[9px] bg-green-100 text-green-600 px-2 py-1 rounded-lg font-black';
    }
    
    try {
        setLoadingState('loading', showAllEmployees ? 'Carregando todos colaboradores...' : 'Filtrando onboarding...');
        await loadEmployeesOptimized();
        renderSidebarOptimized();
        setLoadingState('ready');
        
        showToast(showAllEmployees ? '👥 Mostrando todos os colaboradores' : '🎯 Foco em onboarding (até 93 dias)', 'success');
    } catch (err) {
        setLoadingState('error', err.message);
        showToast('❌ Erro ao alterar filtro: ' + err.message, 'error');
    }
};

// Verificar status do período de experiência com cache
function getExperienceStatusOptimized(employeeId) {
    const cached = performanceCache.experienceStatus.get(employeeId);
    if (cached && (Date.now() - cached.timestamp) < 60000) { // 1 minuto
        return { type: cached.type, days: cached.days };
    }
    
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return { type: null, days: 0 };
    
    const status = getExperienceStatus(emp.admissionDate);
    performanceCache.experienceStatus.set(employeeId, {
        ...status,
        timestamp: Date.now()
    });
    
    return status;
}

// Carregar colaboradores
async function loadEmployees() {
    try {
        const res = await fetch('/api/employees');
        if (!res.ok) throw new Error('Erro ao carregar colaboradores');
        const data = await res.json();
        console.log('📊 Resposta da API:', data);
        // A API pode retornar direto um array ou { employees: [...] }
        employees = Array.isArray(data) ? data : (data.employees || data.data || []);
        console.log('✅ Colaboradores carregados:', employees.length);
    } catch (err) {
        console.error('❌ Erro ao carregar:', err);
        employees = [];
    }
}

// Renderizar sidebar otimizada com virtualização
window.renderSidebarOptimized = () => {
    const container = document.getElementById('employee-list');
    const search = document.getElementById('onboarding-search')?.value.toLowerCase() || '';
    
    console.log('📋 Renderizando sidebar otimizada, container:', container, 'employees:', employees.length);
    
    if (!container) {
        console.error('❌ Container employee-list não encontrado!');
        return;
    }
    
    // Filtragem otimizada
    const filtered = employees.filter(e => {
        const matchesSearch = e.name.toLowerCase().includes(search) || e.registrationNumber?.includes(search);
        const matchesStatus = filterStatus === 'active' ? e.type !== 'Desligado' : e.type === 'Desligado';
        return matchesSearch && matchesStatus;
    });

    // Renderização em lote para melhor performance
    const batchSize = 20;
    let html = '';
    
    for (let i = 0; i < filtered.length; i += batchSize) {
        const batch = filtered.slice(i, i + batchSize);
        html += batch.map(e => {
            const status = getExperienceStatusOptimized(e.id);
            
            // Definir selo
            let badge = '';
            if (status.type === 'approved') {
                badge = `<div title="Aprovado - ${status.days} dias" class="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                </div>`;
            } else if (status.type === 'probation') {
                badge = `<div title="Em período de experiência - ${status.days} dias" class="absolute -bottom-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    <span class="text-[7px] font-black text-white">${status.days}</span>
                </div>`;
            }
            
            return `
            <div class="emp-item ${selectedEmployeeId === e.id ? 'active' : ''}" onclick="window.selectEmployee('${e.id}')">
                <div class="relative">
                    <img src="${e.photoUrl || 'https://ui-avatars.com/api/?name='+encodeURIComponent(e.name)}" class="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-sm" loading="lazy">
                    ${badge}
                </div>
                <div class="min-w-0 flex-1">
                    <p class="text-[10px] font-black text-gray-800 uppercase truncate">${e.name}</p>
                    <p class="text-[8px] text-gray-400 font-bold uppercase tracking-widest">${e.role || 'Sem Cargo'}</p>
                </div>
                ${e.type === 'Desligado' ? '<span class="text-[7px] bg-red-100 text-red-600 font-black px-2 py-0.5 rounded-full uppercase">Saiu</span>' : ''}
            </div>
            `;
        }).join('');
    }
    
    container.innerHTML = html || `<p class="p-8 text-center text-gray-300 text-[9px] font-black uppercase tracking-widest">${filterStatus === 'active' ? 'Nenhum Ativo' : 'Pasta Vazia'}</p>`;
};

// Selecionar colaborador
window.selectEmployee = async (id) => {
    selectedEmployeeId = id;
    renderSidebarOptimized();
    
    const emp = employees.find(e => e.id === id);
    if (!emp) return;
    
    // Mostrar view
    document.getElementById('welcome-msg').classList.add('hidden');
    document.getElementById('onboarding-view').classList.remove('hidden');
    
    // Preencher header - usar IDs corretos do HTML
    const photoEl = document.getElementById('view-photo');
    const nameEl = document.getElementById('view-name');
    const roleEl = document.getElementById('view-role');
    const admissionEl = document.getElementById('view-admission');
    
    if (photoEl) photoEl.src = emp.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}`;
    if (nameEl) nameEl.textContent = emp.name;
    if (roleEl) roleEl.textContent = emp.role || 'Sem Cargo';
    if (admissionEl) admissionEl.textContent = formatDateBR(emp.admissionDate) || '--';
    
    // Mostrar loading no cronograma
    const timelineContainer = document.getElementById('timeline-steps');
    if (timelineContainer) {
        timelineContainer.innerHTML = `
            <div class="text-center py-12">
                <div class="loading-spinner mx-auto mb-4"></div>
                <p class="text-gray-400 text-sm">Carregando cronograma...</p>
            </div>
        `;
    }
    
    try {
        // Determinar tipo de cronograma
        let cronogramaTipo = 'geral';
        
        // Verificar se há configuração salva para este cargo
        try {
            const configRes = await fetch(`/api/onboarding/cargo-config/${encodeURIComponent(emp.role || '')}`);
            if (configRes.ok) {
                const config = await configRes.json();
                cronogramaTipo = config.cronograma_tipo || 'geral';
            }
        } catch (e) {
            // Se não achou configuração, detecta automaticamente
            cronogramaTipo = isServicosDiversos(emp) ? 'servicos_diversos' : 'geral';
        }
        
        currentCronogramaType = cronogramaTipo;
        const templates = await loadTemplates();
        const stepsTemplate = cronogramaTipo === 'servicos_diversos' ? templates.SERVICOS_DIVERSOS_STEPS : templates.DEFAULT_STEPS;
        
        console.log(`📋 Usando cronograma: ${cronogramaTipo.toUpperCase()} para ${emp?.name || id}`);
        
        // Buscar etapas salvas ou usar padrão
        const res = await fetch(`/api/onboarding/${id}`);
        if (res.ok) {
            const data = await res.json();
            onboardingSteps = data.steps || stepsTemplate.map(step => ({
                ...step,
                employee_id: id,
                data_prevista: calculateDateFromDay(step.momento, id),
                data_realizada: '',
                anotacao: ''
            }));
        } else {
            onboardingSteps = stepsTemplate.map(step => ({
                ...step,
                employee_id: id,
                data_prevista: calculateDateFromDay(step.momento, id),
                data_realizada: '',
                anotacao: ''
            }));
        }
        
        renderTimeline();
        updateProgress();
        updateCronogramaIndicator();
        
    } catch (err) {
        console.error('Erro ao carregar onboarding:', err);
        if (timelineContainer) {
            timelineContainer.innerHTML = `
                <div class="text-center py-12">
                    <p class="text-red-400 text-sm">Erro ao carregar cronograma</p>
                    <button onclick="window.selectEmployee('${id}')" class="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg text-sm">Tentar novamente</button>
                </div>
            `;
        }
    }
};

// Carregar etapas do backend
async function loadOnboardingSteps(employeeId) {
    try {
        const res = await fetch(`/api/onboarding/${employeeId}`);
        if (res.ok) {
            const data = await res.json();
            onboardingSteps = data.steps || [];
            
            // Detectar tipo baseado no número de etapas
            currentCronogramaType = onboardingSteps.length === 6 ? 'servicos_diversos' : 'geral';
        } else {
            // Se não encontrou, verificar configuração salva do cargo
            const emp = employees.find(e => e.id === employeeId);
            let cronogramaTipo = 'geral';
            
            // Tentar buscar configuração salva
            try {
                const configRes = await fetch(`/api/onboarding/cargo-config/${encodeURIComponent(emp?.role || '')}`);
                if (configRes.ok) {
                    const config = await configRes.json();
                    cronogramaTipo = config.cronograma_tipo || 'geral';
                }
            } catch (e) {
                // Se não achou configuração, detecta automaticamente
                cronogramaTipo = isServicosDiversos(emp) ? 'servicos_diversos' : 'geral';
            }
            
            currentCronogramaType = cronogramaTipo;
            const templates = await loadTemplates();
            const stepsTemplate = cronogramaTipo === 'servicos_diversos' ? templates.SERVICOS_DIVERSOS_STEPS : templates.DEFAULT_STEPS;
            
            console.log(`📋 Usando cronograma: ${cronogramaTipo.toUpperCase()} para ${emp?.name || employeeId}`);
            
            onboardingSteps = stepsTemplate.map(step => ({
                ...step,
                employee_id: employeeId,
                data_prevista: calculateDateFromDay(step.momento, employeeId),
                data_realizada: '',
                anotacao: ''
            }));
        }
    } catch (err) {
        console.error('Erro ao carregar etapas:', err);
        onboardingSteps = [];
    }
}

// Calcular data prevista baseado no momento (ex: "Dia 1", "Dia 45")
function calculateDateFromDay(momento, employeeId) {
    const emp = employees.find(e => e.id === employeeId);
    if (!emp?.admissionDate) return '';
    
    const admission = new Date(emp.admissionDate);
    const dayMatch = momento.match(/Dia (\d+)/);
    if (!dayMatch) return '';
    
    // CORREÇÃO: Dia 1 = admission date (sem subtração)
    const days = parseInt(dayMatch[1]) - 1; // Mantém lógica original mas com validação
    const result = new Date(admission);
    result.setDate(result.getDate() + days);
    
    // Validação: não permitir datas anteriores à admissão
    if (result < admission && days > 0) {
        console.warn(`⚠️ Data calculada (${result.toISOString().split('T')[0]}) é anterior à admissão (${admission.toISOString().split('T')[0]})`);
        return admission.toISOString().split('T')[0]; // Retorna data da admissão como fallback
    }
    
    // RETORNAR APENAS yyyy-MM-dd (sem timezone)
    return result.toISOString().split('T')[0];
}

// Helper para formatar data do backend para yyyy-MM-dd
function formatDateForInput(dateString) {
    if (!dateString) return '';
    
    // Se já está no formato correto, retorna
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateString;
    }
    
    // Converte de ISO string para yyyy-MM-dd
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
    } catch (err) {
        console.warn('⚠️ Erro ao converter data:', dateString, err);
        return '';
    }
}

// Renderizar timeline
function renderTimeline() {
    const container = document.getElementById('timeline-steps');
    if (!container) return;
    
    container.innerHTML = `
        <div class="timeline-line"></div>
        ${onboardingSteps.map((step, index) => {
            const statusClass = {
                'Pendente': 'status-pendente',
                'Agendado': 'status-agendado',
                'Realizado': 'status-realizado'
            }[step.status] || 'status-pendente';
            
            const statusSelectClass = {
                'Pendente': 'pendente',
                'Agendado': 'agendado',
                'Realizado': 'realizado'
            }[step.status] || 'pendente';
            
            return `
                <div class="step-card" data-index="${index}">
                    <div class="status-dot ${statusClass}"></div>
                    
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <span class="text-[10px] font-black text-nordeste-red uppercase tracking-wider">${step.momento}</span>
                            <h4 class="text-sm font-black text-gray-800 mt-1 whitespace-pre-line">${step.nome_encontro}</h4>
                        </div>
                        <div>
                            <label for="step-status-${index}" class="sr-only">Status da etapa ${step.momento}</label>
                            <select 
                                id="step-status-${index}"
                                name="step-status-${index}"
                                class="status-select ${statusSelectClass}" 
                                onchange="window.updateStepStatus(${index}, this.value)"
                                aria-label="Status da etapa ${step.momento}">
                                <option value="Pendente" ${step.status === 'Pendente' ? 'selected' : ''}>❌ Pendente</option>
                                <option value="Agendado" ${step.status === 'Agendado' ? 'selected' : ''}>⏳ Agendado</option>
                                <option value="Realizado" ${step.status === 'Realizado' ? 'selected' : ''}>✅ Realizado</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4 mb-3 text-xs">
                        <div>
                            <label for="step-prevista-${index}" class="pro-label">📅 Data Prevista</label>
                            <input 
                                type="date" 
                                id="step-prevista-${index}"
                                name="step-prevista-${index}"
                                class="pro-input text-xs" 
                                value="${formatDateForInput(step.data_prevista)}" 
                                onchange="window.updateStepField(${index}, 'data_prevista', this.value)"
                                aria-label="Data prevista para ${step.momento}">
                        </div>
                        <div>
                            <label for="step-realizada-${index}" class="pro-label">✅ Data Realizada</label>
                            <input 
                                type="date" 
                                id="step-realizada-${index}"
                                name="step-realizada-${index}"
                                class="pro-input text-xs" 
                                value="${formatDateForInput(step.data_realizada)}" 
                                onchange="window.updateStepField(${index}, 'data_realizada', this.value)"
                                aria-label="Data realizada para ${step.momento}">
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <label for="step-responsavel-${index}" class="pro-label">👤 Responsável</label>
                        <input 
                            type="text" 
                            id="step-responsavel-${index}"
                            name="step-responsavel-${index}"
                            class="pro-input text-xs" 
                            value="${step.responsavel}" 
                            onchange="window.updateStepField(${index}, 'responsavel', this.value)"
                            placeholder="Nome do responsável"
                            aria-label="Responsável pela etapa ${step.momento}">
                    </div>
                    
                    <div class="grid grid-cols-1 gap-3 mb-3 text-xs">
                        <div class="bg-gray-50 p-3 rounded-lg">
                            <p class="text-[9px] font-black text-gray-400 uppercase mb-1">📝 Pauta Sugerida</p>
                            <p class="text-gray-700 whitespace-pre-line">${step.pauta_sugerida}</p>
                        </div>
                        <div class="bg-blue-50 p-3 rounded-lg">
                            <p class="text-[9px] font-black text-blue-400 uppercase mb-1">💡 Como Fazer</p>
                            <p class="text-blue-700 whitespace-pre-line">${step.como_fazer}</p>
                        </div>
                    </div>
                    
                    <div>
                        <label for="step-anotacao-${index}" class="pro-label">🗒️ Anotações</label>
                        <textarea 
                            id="step-anotacao-${index}"
                            name="step-anotacao-${index}"
                            class="pro-input text-xs h-16" 
                            placeholder="Adicione observações..." 
                            onchange="window.updateStepField(${index}, 'anotacao', this.value)"
                            aria-label="Anotações para ${step.momento}">${step.anotacao || ''}</textarea>
                    </div>
                </div>
            `;
        }).join('')}
    `;
    
    updateProgress();
}

// Atualizar status do step
window.updateStepStatus = (index, newStatus) => {
    onboardingSteps[index].status = newStatus;
    renderTimeline();
};

// Atualizar campo do step
window.updateStepField = (index, field, value) => {
    onboardingSteps[index][field] = value;
    if (field === 'data_realizada' && value) {
        // Se preencheu data realizada, marca como realizado automaticamente
        onboardingSteps[index].status = 'Realizado';
        renderTimeline();
    }
};

// Atualizar barra de progresso
function updateProgress() {
    const total = onboardingSteps.length;
    const realizados = onboardingSteps.filter(s => s.status === 'Realizado').length;
    const percent = total > 0 ? Math.round((realizados / total) * 100) : 0;
    
    document.getElementById('progress-percent').innerText = `${percent}%`;
    document.getElementById('progress-bar').style.width = `${percent}%`;
}

// Salvar dados no backend
window.saveOnboardingData = async () => {
    if (!selectedEmployeeId) return;
    
    const btn = document.querySelector('.btn-save');
    setButtonLoading(btn, true);
    
    try {
        const res = await fetch(`/api/onboarding/${selectedEmployeeId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ steps: onboardingSteps })
        });
        
        if (!res.ok) throw new Error('Erro ao salvar');
        
        showToast('✅ Dados salvos com sucesso!');
        
        // Regenerar notificações automaticamente
        try {
            await fetch('/api/onboarding/generate-notifications', { method: 'POST' });
        } catch (e) {
            console.log('Notificações serão geradas na próxima carga');
        }
        
        await loadOnboardingSteps(selectedEmployeeId);
        renderTimeline();
    } catch (err) {
        console.error('Erro ao salvar:', err);
        showToast('❌ Erro ao salvar: ' + err.message, 'error');
    } finally {
        setButtonLoading(btn, false);
    }
};

// Filtro de status
window.setFilterStatus = (status) => {
    filterStatus = status;
    document.getElementById('tab-active').className = status === 'active' ? 'tab-btn active' : 'tab-btn inactive';
    document.getElementById('tab-inactive').className = status === 'inactive' ? 'tab-btn active' : 'tab-btn inactive';
    renderSidebarOptimized();
};

// Utilitários
function formatDateBR(dateStr) {
    if (!dateStr) return '--';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

// Gerar PDF do cronograma
window.generatePDF = () => {
    if (!selectedEmployeeId || onboardingSteps.length === 0) {
        alert('Selecione um colaborador primeiro!');
        return;
    }
    
    const emp = employees.find(e => e.id === selectedEmployeeId);
    if (!emp) return;
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Configurações
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    
    // Header
    doc.setFillColor(211, 47, 47); // Nordeste Red
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('PROGRAMA DE ACOMPANHAMENTO 90 DIAS', margin, 20);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Nordeste Locações', margin, 30);
    
    // Info do colaborador
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Colaborador: ${emp.name}`, margin, 55);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Cargo: ${emp.role || 'N/A'}`, margin, 62);
    doc.text(`Setor: ${emp.sector || 'N/A'}`, margin, 68);
    doc.text(`Data de Admissão: ${formatDateBR(emp.admissionDate)}`, margin, 74);
    doc.text(`Matrícula: ${emp.registrationNumber || 'N/A'}`, margin, 80);
    
    // Tabela de etapas com pauta sugerida (sem status e data realizada)
    const tableData = onboardingSteps.map(step => [
        step.momento,
        step.nome_encontro.replace(/\n/g, ' '),
        step.pauta_sugerida.replace(/\n/g, ' | '),
        step.responsavel,
        formatDateBR(step.data_prevista)
    ]);
    
    doc.autoTable({
        startY: 90,
        head: [['Momento', 'Encontro', 'Pauta Sugerida', 'Responsavel', 'Data Prevista']],
        body: tableData,
        headStyles: {
            fillColor: [211, 47, 47],
            textColor: 255,
            fontSize: 9,
            fontStyle: 'bold'
        },
        bodyStyles: {
            fontSize: 8
        },
        columnStyles: {
            0: { cellWidth: 20 },
            1: { cellWidth: 45 },
            2: { cellWidth: 75 },
            3: { cellWidth: 35 },
            4: { cellWidth: 25 }
        },
        styles: {
            overflow: 'linebreak',
            cellPadding: 3
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252]
        }
    });
    
    // Footer
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFillColor(211, 47, 47);
    doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} - Nordeste Locações RH+`, margin, pageHeight - 8);
    
    // Download
    const fileName = `Onboarding_90Dias_${emp.name.replace(/\s+/g, '_')}.pdf`;
    doc.save(fileName);
};

// Aprovar colaborador - Usa a API de career para efetivação
window.approveEmployee = async () => {
    if (!selectedEmployeeId) {
        showToast('Selecione um colaborador primeiro!', 'error');
        return;
    }
    
    const emp = employees.find(e => e.id === selectedEmployeeId);
    if (!emp) return;
    
    const btn = event.target.closest('button');
    setButtonLoading(btn, true);
    
    if (!confirm(`Deseja APROVAR o colaborador ${emp.name}?\n\nEsta ação irá:\n\u2022 Efetivar o colaborador\n\u2022 Adicionar selo verde de verificado\n\u2022 Atualizar status para "Efetivado"`)) {
        setButtonLoading(btn, false);
        return;
    }
    
    try {
        // Usar a API de career para efetivação
        const res = await fetch('/api/career', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                employeeId: selectedEmployeeId,
                move_type: 'Efetivação',
                role: emp.role || '',
                sector: emp.sector || 'ADMINISTRATIVO',
                salary: emp.currentSalary || 'R$ 0,00',
                date: new Date().toLocaleString('sv-SE').replace('T', ' '),
                responsible: 'Sistema RH+ (Onboarding)',
                observation: 'EFETIVADO NO PROGRAMA DE PERÍODO DE EXPERIÊNCIA - ' + new Date().toLocaleDateString('pt-BR'),
                cbo: emp.cbo || ''
            })
        });
        
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || 'Erro ao aprovado colaborador');
        }
        
        showToast('✅ Colaborador APROVADO com sucesso!');
        
        // Recarregar para atualizar o selo
        await loadEmployeesOptimized();
        renderSidebarOptimized();
        
    } catch (err) {
        console.error('Erro ao aprovado:', err);
        showToast('❌ Erro ao aprovado: ' + err.message, 'error');
    } finally {
        setButtonLoading(btn, false);
    }
};

// Reprovar colaborador - Usa a mesma lógica do módulo career
window.rejectEmployee = async () => {
    if (!selectedEmployeeId) {
        showToast('Selecione um colaborador primeiro!', 'error');
        return;
    }
    
    const emp = employees.find(e => e.id === selectedEmployeeId);
    if (!emp) return;
    
    const btn = event.target.closest('button');
    setButtonLoading(btn, true);
    
    // Confirmação dupla para evitar toque acidental
    const confirm1 = confirm(`⚠️ ATENÇÃO!\n\nVocê está prestes a REPROVAR e DESLIGAR o colaborador:\n${emp.name}\n\nEsta ação irá:\n• Desligar o colaborador\n• Adicionar observação de reprovação no período de experiência\n• Arquivar dados do colaborador\n\nDeseja continuar?`);
    
    if (!confirm1) {
        setButtonLoading(btn, false);
        return;
    }
    
    const confirm2 = confirm(`Confirmação FINAL:\n\nTem certeza que deseja REPROVAR ${emp.name}?\n\nEsta ação não pode ser desfeita!`);
    
    if (!confirm2) {
        setButtonLoading(btn, false);
        return;
    }
    
    try {
        // Usar a API de career como no módulo career
        const res = await fetch('/api/career', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                employeeId: selectedEmployeeId,
                move_type: 'Desligamento',
                role: emp.role || '',
                sector: emp.sector || 'ADMINISTRATIVO',
                salary: emp.currentSalary || 'R$ 0,00',
                date: new Date().toLocaleString('sv-SE').replace('T', ' '),
                responsible: 'Sistema RH+ (Onboarding)',
                observation: 'REPROVADO NO PROGRAMA DE PERÍODO DE EXPERIÊNCIA - ' + new Date().toLocaleDateString('pt-BR'),
                cbo: emp.cbo || '',
                termination_reason: 'REPROVAÇÃO NO PERÍODO DE EXPERIÊNCIA',
                grrf_value: 0,
                rescisao_value: 0
            })
        });
        
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || 'Erro ao desligar colaborador');
        }

        showToast('✅ Colaborador reprovador e desligado!');
        
        // Recarregar lista
        await loadEmployeesOptimized();
        renderSidebarOptimized();
        
    } catch (err) {
        console.error('Erro ao reprovar:', err);
        showToast('❌ Erro ao reprovar: ' + err.message, 'error');
    } finally {
        setButtonLoading(btn, false);
    }
};

// Atualizar indicador visual do tipo de cronograma
function updateCronogramaIndicator() {
    const badge = document.getElementById('cronograma-badge');
    if (!badge) return;
    
    if (currentCronogramaType === 'servicos_diversos') {
        badge.innerText = 'SERVIÇOS DIVERSOS';
        badge.className = 'text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 font-black uppercase';
    } else {
        badge.innerText = 'GERAL';
        badge.className = 'text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 font-black uppercase';
    }
}

// Alternar tipo de cronograma manualmente
window.toggleCronogramaType = async () => {
    if (!selectedEmployeeId) return;
    
    const emp = employees.find(e => e.id === selectedEmployeeId);
    if (!emp) return;
    
    // Alternar tipo
    currentCronogramaType = currentCronogramaType === 'geral' ? 'servicos_diversos' : 'geral';
    
    console.log(`🔄 Cronograma alterado para: ${currentCronogramaType}`);
    
    try {
        // Recarregar etapas com novo tipo
        const templates = await loadTemplates();
        
        // Validação adicional de segurança
        if (!templates || !templates.DEFAULT_STEPS || !templates.SERVICOS_DIVERSOS_STEPS) {
            throw new Error('Templates não carregados corretamente');
        }
        
        const stepsTemplate = currentCronogramaType === 'servicos_diversos' ? templates.SERVICOS_DIVERSOS_STEPS : templates.DEFAULT_STEPS;
        
        // Validação final antes do map
        if (!Array.isArray(stepsTemplate)) {
            throw new Error('Steps template não é um array');
        }
        
        onboardingSteps = stepsTemplate.map(step => ({
            ...step,
            employee_id: selectedEmployeeId,
            data_prevista: calculateDateFromDay(step.momento, selectedEmployeeId),
            data_realizada: '',
            anotacao: ''
        }));
        
        // Atualizar UI
        updateCronogramaIndicator();
        renderTimeline();
        updateProgress();
        
    } catch (err) {
        console.error('❌ Erro ao alternar cronograma:', err);
        showToast('❌ Erro ao alternar tipo de cronograma: ' + err.message, 'error');
        
        // Reverter para o tipo anterior em caso de erro
        currentCronogramaType = currentCronogramaType === 'geral' ? 'servicos_diversos' : 'geral';
    }
};

// Salvar tipo de cronograma para o cargo (persistir para futuros colaboradores)
window.saveCronogramaType = async () => {
    if (!selectedEmployeeId) {
        showToast('Selecione um colaborador primeiro!', 'error');
        return;
    }
    
    const emp = employees.find(e => e.id === selectedEmployeeId);
    if (!emp || !emp.role) {
        showToast('Colaborador não tem cargo definido!', 'error');
        return;
    }
    
    const btn = event.target.closest('button');
    setButtonLoading(btn, true);
    
    const tipoLabel = currentCronogramaType === 'servicos_diversos' ? 'SERVIÇOS DIVERSOS' : 'GERAL';
    
    if (!confirm(`Deseja salvar o cronograma "${tipoLabel}" para o cargo "${emp.role}"?\n\nTodos os futuros colaboradores com este cargo usarão este cronograma automaticamente.`)) {
        setButtonLoading(btn, false);
        return;
    }
    
    try {
        const res = await fetch('/api/onboarding/cargo-config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cargo: emp.role,
                cronograma_tipo: currentCronogramaType
            })
        });
        
        if (!res.ok) throw new Error('Erro ao salvar configuração');
        
        showToast(`✅ Configuração salva para cargo "${emp.role}"`);
        
    } catch (err) {
        console.error('Erro ao salvar configuração:', err);
        showToast('❌ Erro ao salvar: ' + err.message, 'error');
    } finally {
        setButtonLoading(btn, false);
    }
};
