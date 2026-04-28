import { state, setState, setRefresher } from './state.js';
import { GoalsModule } from './modules/goals.js';
import { DateFixer } from './date-fixer.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = Auth.check();
    if (!user) return;

    setState('user', user);
    setRefresher({ renderApp, loadData });

    // Header Info
    const elName = document.getElementById('user-name-display');
    const elRole = document.getElementById('user-role-display');
    const elAvatar = document.getElementById('user-avatar-display');

    if (elName) elName.innerText = user.name || 'Usuário';
    if (elRole) {
        let roleLabel = 'Operador';
        if (user.role === 'DEV') roleLabel = 'Desenvolvedor Master';
        else if (user.role === 'GESTOR') roleLabel = 'Gestor Administrativo';
        elRole.innerText = roleLabel;
    }
    if (elAvatar) {
        elAvatar.src = user.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=D32F2F&color=fff`;
    }

    // 1. RENDERIZAR A SIDEBAR IMEDIATAMENTE (Prioridade UX)
    renderSidebar(user);
    applyDashboardPermissions(user);

    await loadData();
    renderApp();
});

function renderSidebar(user) {
    const nav = document.getElementById('sidebar-nav');
    if (!nav) return;

    // LISTA MASTER DE MÓDULOS (SVG Inline para garantir ícones)
    const items = [
        { id: 'dashboard', label: 'Dashboard', icon: '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>', url: '/dashboard.html', public: true },
        { id: 'employees-pro', label: 'Mestre Colaboradores', icon: '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>', url: '/employees-pro.html' },
        { id: 'uniforms', label: 'Fardamento', icon: '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M20.38 3.46 16 2 13 3h-2L7 2 2.62 3.46a2 2 0 0 0-1.09 1.19l-1.2 6A2 2 0 0 0 3.61 12.91l.82 4.16A2 2 0 0 0 6.42 19l1.09 5.55A2 2 0 0 0 9.5 26h5a2 2 0 0 0 1.99-1.45l1.09-5.55a2 2 0 0 0 1.99-1.93l.82-4.16a2 2 0 0 0 3.28-2.26l-1.2-6a2 2 0 0 0-1.09-1.19z"/></svg>', url: '/uniforms-module.html' },
        { id: 'career', label: 'Plano de Carreira', icon: '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>', url: '/carreira.html' },
        { id: 'overtime', label: 'Hora Extra', icon: '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>', url: '/hora-extra.html' },
        { id: 'recruitment', label: 'Recrutamento', icon: '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>', url: '/recrutamento.html' },
        { id: 'talent-pool', label: 'Banco de Talentos', icon: '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>', url: '/talent-pool.html' },
        { id: 'vacation', label: 'Férias & Ausências', icon: '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>', url: '/vacation-unified.html' },
        { id: 'aso', label: 'Saúde (ASO/SST)', icon: '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>', url: '/aso.html' },
        { id: 'onboarding', label: 'Onboarding 90 Dias', icon: '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>', url: '/onboarding-90dias.html' },
        { id: 'tools', label: 'Gestão de Ativos', icon: '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>', url: '/tools-module.html' },
        { id: 'acessos', label: 'Gestão de Acessos', icon: '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>', url: '/acessos.html', restricted: ['DEV', 'GESTOR'] }
    ];

    nav.innerHTML = items.map(item => {
        let visible = false;

        // Lógica de Permissão
        if (user.role === 'DEV') visible = true;
        else if (item.public) visible = true;
        else if (item.restricted) visible = item.restricted.includes(user.role);
        else if (user.role === 'GESTOR') visible = true;
        else visible = user.permissions && user.permissions[item.id] === true;

        if (!visible) return '';

        // Check Ativo
        const currentPath = window.location.pathname;
        let isActive = currentPath.endsWith(item.url);
        // Dashboard é a home
        if (item.id === 'dashboard' && (currentPath === '/' || currentPath === '/dashboard.html')) isActive = true;

        // Renderiza com a classe .nav-item-theme
        return `
            <a href="${item.url}" class="nav-item-theme ${isActive ? 'active' : ''}">
                <span class="flex-shrink-0 w-5 h-5">${item.icon}</span>
                <span>${item.label}</span>
            </a>
        `;
    }).join('');
}

function applyDashboardPermissions(user) {
    if (user.role === 'DEV' || user.role === 'GESTOR') return;

    const modules = ['employees-pro', 'uniforms', 'career', 'overtime', 'recruitment', 'vacation', 'aso', 'tools'];

    modules.forEach(modId => {
        const hasAccess = user.permissions && user.permissions[modId] === true;
        const card = document.getElementById(`card-${modId}`);
        if (card) {
            card.style.display = hasAccess ? 'block' : 'none';
        }
    });
}

export async function loadData() {
    try {
        const response = await fetch('/api/employees');
        const data = await response.json();
        setState('employees', Array.isArray(data) ? data : []);
    } catch (e) { }
}

export function renderApp() {
    const user = state.user;
    if (!user) return;

    if (window.location.pathname.includes('dashboard.html') || window.location.pathname === '/') {
        renderDashboardStats();
        renderLuckBox();
    }
}

function renderDashboardStats() {
    const statsGrid = document.getElementById('quick-stats-grid');
    if (!statsGrid) return;

    const activeCount = state.employees ? state.employees.filter(e => e.type !== 'Desligado').length : 0;

    statsGrid.innerHTML = `
        <div class="card p-6 border-l-4 border-nordeste-red shadow-sm flex items-center justify-between">
            <div>
                <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Colaboradores Ativos</p>
                <h3 class="text-3xl font-black text-gray-800 mt-1 leading-none">${activeCount}</h3>
            </div>
            <div class="p-3 bg-red-50 rounded-2xl text-nordeste-red">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
            </div>
        </div>
    `;
}

// Renderizar Decisão 90 Dias (Box de avaliação final)
function renderLuckBox() {
    const container = document.getElementById('lucky-cards-grid');
    if (!container) return;
    
    if (!state.employees || state.employees.length === 0) return;
    
    // Filtrar colaboradores no dia 90-92 (período de decisão final - janela curta)
    // Apenas ativos no período exato para não poluir o dashboard
    const today = new Date();
    const newEmployees = state.employees.filter(emp => {
        // Para colaboradores com data de admissão
        if (emp.admissionDate) {
            const admission = new Date(emp.admissionDate);
            const diffTime = today - admission;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            // Apenas no período 90-92 dias (encerra no dia 92)
            const isInPeriod = diffDays >= 90 && diffDays <= 92;
            
            // Incluir também se foi desligado muito recente (apenas 1-2 dias)
            const isRecentlyTerminated = emp.type === 'Desligado' && 
                                       emp.terminationDate && 
                                       diffDays <= 93; // margem máx de 3 dias
            
            return isInPeriod || isRecentlyTerminated;
        }
        
        // Para colaboradores SEM data de admissão mas desligados (muito recente)
        if (emp.type === 'Desligado' && emp.terminationDate) {
            const termination = new Date(emp.terminationDate);
            const diffTime = today - termination;
            const daysSinceTermination = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            // Apenas nos últimos 2 dias (some rápido)
            return daysSinceTermination <= 2;
        }
        
        return false;
    });
    
    if (newEmployees.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center text-white/80 font-bold text-sm">Nenhum colaborador aguardando decisão no momento</div>';
        return;
    }
    
    container.innerHTML = newEmployees.map(emp => {
        // Calcular dias (usando admissão ou desligamento)
        let diffDays = 0;
        let dateLabel = 'dias';
        
        if (emp.admissionDate) {
            const admission = new Date(emp.admissionDate);
            const diffTime = today - admission;
            diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            dateLabel = 'dias';
        } else if (emp.terminationDate) {
            const termination = new Date(emp.terminationDate);
            const diffTime = today - termination;
            diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            dateLabel = 'após saída';
        }
        
        // Verificar status do onboarding
        let status = 'pending';
        let statusText = 'Em análise';
        
        if (emp.type === 'Efetivado') {
            status = 'approved';
            statusText = 'Aprovado';
        } else if (emp.type === 'Desligado') {
            status = 'rejected';
            statusText = 'Reprovado';
        }
        
        return `
            <div class="lucky-card mystery" 
                 onclick="window.revealLuckyCard('${emp.id}', this)"
                 data-employee-id="${emp.id}">
                <div class="lucky-card-content">
                    <img src="${emp.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=D32F2F&color=fff`}" 
                         class="lucky-card-avatar" alt="${emp.name}">
                    <div class="lucky-card-name">${emp.name.split(' ')[0]}</div>
                    <div class="lucky-card-days">${diffDays} ${dateLabel}</div>
                    <div class="lucky-card-result ${status}">${statusText}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Revelar card da Luck Box com animação explosiva
window.revealLuckyCard = (employeeId, cardElement) => {
    if (cardElement.classList.contains('revealed')) return;
    
    const emp = state.employees.find(e => e.id === employeeId);
    if (!emp) return;
    
    // Determinar resultado baseado no status atual
    let status = 'approved';
    let statusText = 'Aprovado';
    let animationClass = 'celebrating';
    
    if (emp.type === 'Desligado') {
        status = 'rejected';
        statusText = 'Reprovado';
        animationClass = 'terminated'; // Animação especial para desligados
    } else if (emp.type === 'Efetivado') {
        status = 'approved';
        statusText = 'Aprovado';
        animationClass = 'celebrating';
    }
    
    // Criar explosão de partículas
    createExplosion(cardElement, emp.type === 'Desligado');
    
    // Adicionar animação de abertura da lock box
    cardElement.classList.add('unlocking');
    
    // Após a animação de abertura, revelar o conteúdo
    setTimeout(() => {
        cardElement.classList.remove('unlocking', 'mystery');
        cardElement.classList.add('revealed', animationClass);
        
        // Atualizar conteúdo
        const resultBadge = cardElement.querySelector('.lucky-card-result');
        if (resultBadge) {
            resultBadge.className = `lucky-card-result ${status}`;
            resultBadge.textContent = statusText;
        }
        
        // Criar confetti extra apenas para aprovações (não para desligados)
        if (emp.type === 'Efetivado') {
            createMassiveConfetti();
        }
        
        // Remover animação após completar
        setTimeout(() => {
            cardElement.classList.remove(animationClass);
        }, 2000);
    }, 1000);
};

// Criar explosão de partículas tipo lock box
function createExplosion(cardElement, isTerminated = false) {
    const rect = cardElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Cores diferentes para desligados (cores escuras/sóbrias)
    const colors = isTerminated 
        ? ['#666666', '#444444', '#333333', '#555555', '#777777', '#222222', '#888888']
        : ['#FFD700', '#FF69B4', '#00CED1', '#FF6347', '#32CD32', '#FF1493', '#00BFFF'];
    const particleCount = 25;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'explosion-particle';
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        particle.style.left = centerX + 'px';
        particle.style.top = centerY + 'px';
        
        // Direção aleatória para explosão
        const angle = (Math.PI * 2 * i) / particleCount;
        const velocity = 100 + Math.random() * 150;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;
        
        particle.style.setProperty('--tx', tx + 'px');
        particle.style.setProperty('--ty', ty + 'px');
        particle.style.animation = 'explosion 0.8s ease-out forwards';
        
        document.body.appendChild(particle);
        
        setTimeout(() => {
            particle.remove();
        }, 800);
    }
}

// Criar confetti massivo para celebração
function createMassiveConfetti() {
    const colors = ['#FFD700', '#FF69B4', '#00CED1', '#FF6347', '#32CD32', '#FF1493', '#00BFFF', '#FFD700'];
    const confettiCount = 60;
    
    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * window.innerWidth + 'px';
            confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
            confetti.style.animationDelay = Math.random() * 0.5 + 's';
            confetti.style.width = (Math.random() * 8 + 4) + 'px';
            confetti.style.height = (Math.random() * 8 + 4) + 'px';
            
            document.body.appendChild(confetti);
            
            setTimeout(() => {
                confetti.remove();
            }, 5000);
        }, i * 30);
    }
}

// Criar efeito de confetti (versão antiga mantida)
function createConfetti() {
    const colors = ['#FFD700', '#FF69B4', '#00CED1', '#FF6347', '#32CD32'];
    const confettiCount = 30;
    
    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * window.innerWidth + 'px';
            confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
            confetti.style.animationDelay = Math.random() * 0.5 + 's';
            
            document.body.appendChild(confetti);
            
            setTimeout(() => {
                confetti.remove();
            }, 4000);
        }, i * 50);
    }
}
