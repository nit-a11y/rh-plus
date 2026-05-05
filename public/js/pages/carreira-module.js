
import { formatCurrency, formatarDataBR, formatarDataHoraBR, parseCurrency, formatCurrencyInput } from '../utils.js';

function formatSalaryValue(salary) {
    if (!salary || typeof salary !== 'string') return salary || '-';
    if (salary.includes('R$')) return salary;
    const num = parseFloat(salary);
    if (isNaN(num)) return salary;
    // Se já tem casas decimais, formatar diretamente
    if (salary.includes('.')) {
        return formatCurrency(num);
    }
    // Tratar os dois últimos dígitos como centavos (ex: 190634 → 1906.34)
    const salaryAsNumber = num / 100;
    return formatCurrency(salaryAsNumber);
}

let employees = [];
let selectedId = null;
let currentEmployeeData = null;
let filterStatus = 'active';
let rolesMatrix = [];
let fullHistory = [];

document.addEventListener('DOMContentLoaded', () => {
    if (typeof Auth === 'object' && Auth !== null) {
        const user = Auth.check();
        if (!user) return;
    }
    loadAllEmployees();
    loadRoles();
    
    const urlParams = new URLSearchParams(window.location.search);
    const empId = urlParams.get('emp');
    if (empId) {
        setTimeout(() => {
            window.openEmployeeById(empId);
        }, 500);
    }
});

async function loadAllEmployees() {
    showLoadingState(true);
    try {
        const res = await fetch('/api/employees');
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        
        employees = await res.json();
        renderSidebar();
        showSuccessMessage(`${employees.length} colaboradores carregados`);
        
        // Só atualiza a view se employees foi carregado com sucesso
        if (selectedId && employees.length > 0) {
            const emp = employees.find(e => e.id === selectedId);
            if (emp) {
                currentEmployeeData = emp;
                updateEmployeeView(emp);
            }
        }
    } catch (e) { 
        console.error(e);
        showErrorMessage('Falha ao carregar colaboradores: ' + e.message);
    } finally {
        showLoadingState(false);
    }
}

function updateEmployeeView(emp) {
    const selectionView = document.getElementById('selection-view');
    if (!selectionView) return;
    
    selectionView.innerHTML = `
        <div class="max-w-6xl mx-auto w-full">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div class="space-y-6">
                    <div class="bg-white rounded-2xl p-6 border-2 border-nordeste-red shadow-xl flex flex-col items-center">
                        <img id="view-photo" src="${emp.photoUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(emp.name)}" 
                             class="w-28 h-28 rounded-2xl object-cover border-4 border-white shadow-lg mb-4"
                             alt="Foto do colaborador"
                             onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}'">
                        <h2 id="view-name" class="text-lg font-bold text-gray-800 uppercase text-center leading-tight">${emp.name}</h2>
                        <span id="view-reg" class="bg-gray-100 px-3 py-1 rounded-lg text-xs font-mono text-gray-500 mt-2">#${emp.registrationNumber || '0000'}</span>
                        <div class="w-full mt-6 pt-6 border-t border-gray-100 space-y-4">
                            <div>
                                <p class="text-xs font-medium text-gray-500 uppercase">Posição Atual</p>
                                <p id="view-role" class="text-sm font-medium text-nordeste-red uppercase leading-tight">${emp.role} (CBO: ${emp.cbo || '---'})</p>
                            </div>
                            <div>
                                <p class="text-xs font-medium text-gray-500 uppercase">Salário Atual</p>
                                <p id="view-salary" class="text-xl font-bold text-gray-800 tabular-nums">${formatSalaryValue(emp.currentSalary)}</p>
                            </div>
                        </div>
                    </div>
                    <div class="bg-nordeste-black rounded-2xl p-6 text-white relative overflow-hidden">
                        <div class="absolute top-[-10px] right-[-10px] text-6xl opacity-10">
                            <svg class="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                        </div>
                        <p class="text-xs font-medium text-nordeste-red uppercase tracking-widest mb-1">Evolução na Nordeste</p>
                        <h3 id="view-variation" class="text-4xl font-bold">+0.0%</h3>
                        <p class="text-xs text-gray-400 font-medium mt-2">Aumento acumulado total</p>
                    </div>
                </div>
                <div class="lg:col-span-2 space-y-6">
                    <div class="flex flex-wrap gap-3" role="group" aria-label="Ações">
                        <button onclick="window.openPromotionModal()" class="flex-1 bg-nordeste-black text-white px-6 py-4 rounded-xl font-semibold shadow-md hover:scale-[1.02] transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-nordeste-black focus:ring-offset-2">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
                            Promoção / Cargo
                        </button>
                        <button onclick="window.openBonusModal()" class="flex-1 bg-amber-500 text-white px-6 py-4 rounded-xl font-semibold shadow-md hover:scale-[1.02] transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            Bonificação
                        </button>
                        <button onclick="window.openOccurrenceModal()" class="flex-1 bg-nordeste-red text-white px-6 py-4 rounded-xl font-semibold shadow-md hover:scale-[1.02] transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-nordeste-red focus:ring-offset-2">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                            Ocorrência
                        </button>
                    </div>
                    <div id="career-timeline" class="space-y-6 relative pl-10 border-l-2 border-gray-200 ml-5 timeline-scroll overflow-y-auto max-h-[60vh]"></div>
                </div>
            </div>
        </div>
    `;
}

async function refreshCurrentEmployee() {
    if (!selectedId) return;
    try {
        const res = await fetch('/api/employees');
        employees = await res.json();
        const emp = employees.find(e => e.id === selectedId);
        if (emp) {
            currentEmployeeData = emp;
            updateEmployeeView(emp);
            renderSidebar();
        }
    } catch (e) { console.error(e); }
    if (currentEmployeeData) {
        await loadCareerTimeline(selectedId);
    }
}

async function loadRoles() {
    try {
        const res = await fetch('/api/roles');
        rolesMatrix = await res.json();
    } catch (e) { }
}

window.setFilterStatus = (status) => {
    filterStatus = status;
    document.getElementById('tab-active').className = `tab-btn ${status === 'active' ? 'active' : 'inactive'}`;
    document.getElementById('tab-inactive').className = `tab-btn ${status === 'inactive' ? 'active' : 'inactive'}`;
    renderSidebar();
};

function renderSidebar() {
    const container = document.getElementById('employees-list');
    if (!container) return;
    const search = document.getElementById('emp-search')?.value.toLowerCase() || '';

    const filtered = (employees || []).filter(e => {
        const matchesSearch = (e.name || '').toLowerCase().includes(search) || (e.registrationNumber || '').includes(search);
        const matchesStatus = filterStatus === 'active' ? e.type !== 'Desligado' : e.type === 'Desligado';
        return matchesSearch && matchesStatus;
    });

    // Atualizar contadores nos tabs
    updateFilterCounters();

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state p-8 text-center">
                <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                </div>
                <p class="text-sm font-medium text-gray-600">Nenhum colaborador encontrado</p>
                <p class="text-xs text-gray-400 mt-1">
                    ${search ? 'Tente outra busca' : 'Nenhum colaborador neste status'}
                </p>
            </div>
        `;
        return;
    }

container.innerHTML = filtered.map(e => {
        const highlightedName = highlightSearch(e.name, search);
        const highlightedReg = highlightSearch(e.registrationNumber, search);
        
        return `
            <div class="emp-item ${selectedId === e.id ? 'active' : ''} animate-slide p-4" 
                 onclick="window.selectEmployee('${e.id}')"
                 role="option"
                 aria-selected="${selectedId === e.id}"
                 data-tooltip="${e.type === 'Desligado' ? 'Desligado em ' + (e.terminationDate || 'N/A') : 'Clique para detalhes'}">
                <img src="${e.photoUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(e.name)}" 
                     class="w-10 h-10 rounded-lg object-cover border-2 border-white shadow-sm" 
                     alt=""
                     onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(e.name)}'">
                <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium text-gray-800 uppercase truncate">${highlightedName}</p>
                    <p class="text-xs text-gray-500 font-medium uppercase tracking-wider leading-none">${e.role}</p>
                    <p class="text-xs text-gray-400 font-mono">${highlightedReg}</p>
                </div>
                ${e.type === 'Desligado' ? '<span class="text-xs bg-red-100 text-red-600 font-medium px-2 py-1 rounded-full uppercase">Sair</span>' : ''}
            </div>
        `;
    }).join('');
}

// Funções de feedback visual
function showLoadingState(show) {
    const container = document.getElementById('employees-list');
    if (!container) return;
    
    if (show) {
        container.innerHTML = `
            <div class="p-4">
                <div class="skeleton h-12 rounded-lg mb-3"></div>
                <div class="skeleton h-12 rounded-lg mb-3"></div>
                <div class="skeleton h-12 rounded-lg mb-3"></div>
                <div class="skeleton h-12 rounded-lg"></div>
            </div>
        `;
    }
}

function showSuccessMessage(message) {
    showToast(message, 'success');
}

function showErrorMessage(message) {
    showToast(message, 'error');
}

function showToast(message, type = 'info') {
    if (window.showToast) {
        window.showToast(message, type);
        return;
    }
    
    const container = document.getElementById('toast-container') || document.createElement('div');
    if (!container.id) {
        container.id = 'toast-container';
        container.style.cssText = 'position:fixed;bottom:1.5rem;right:1.5rem;z-index:200;display:flex;flex-direction:column;gap:0.75rem';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    const colors = { success: '#10B981', error: '#EF4444', info: '#3B82F6' };
    toast.style.cssText = `padding:1rem 1.5rem;border-radius:0.75rem;font-size:0.875rem;font-weight:600;box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);animation:toast-in 0.3s ease;display:flex;align-items:center;gap:0.75rem;background:${colors[type]};color:white`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `<span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span> ${message}`;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'toast-in 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function highlightSearch(text, search) {
    if (!search) return text;
    const regex = new RegExp(`(${search})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
}

function updateFilterCounters() {
    const activeCount = employees?.filter(e => e.type !== 'Desligado').length || 0;
    const inactiveCount = employees?.filter(e => e.type === 'Desligado').length || 0;
    
    const activeTab = document.getElementById('tab-active');
    const inactiveTab = document.getElementById('tab-inactive');
    
    if (activeTab) {
        activeTab.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>Ativos<span class="badge-count">${activeCount}</span>`;
    }
    if (inactiveTab) {
        inactiveTab.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>Desligados<span class="badge-count">${inactiveCount}</span>`;
    }
}

window.filterList = () => renderSidebar();

// Função para editar item da carreira
window.editCareerItem = (id) => {
    const item = fullHistory.find(h => h.id === id);
    if (!item) {
        showErrorMessage('Registro não encontrado');
        return;
    }

    const modal = document.getElementById('pro-modal-container');
    const content = document.getElementById('pro-modal-content');

    // Formatar data para datetime-local
    const dateValue = item.date ? new Date(item.date).toISOString().slice(0, 16) : '';

content.innerHTML = `
        <div class="bg-nordeste-black p-6 text-white rounded-t-2xl">
            <h3 class="text-lg font-bold uppercase">Editar Registro de Carreira</h3>
        </div>
        <form id="edit-career-form" class="p-6 space-y-5">
            <input type="hidden" id="edit-id" value="${id}">
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="pro-label">Tipo de Movimentação *</label>
                    <select id="edit-move-type" class="pro-input uppercase" required>
                        <option value="PROMOÇÃO" ${item.move_type === 'PROMOÇÃO' ? 'selected' : ''}>PROMOÇÃO</option>
                        <option value="REAJUSTE SALARIAL" ${item.move_type === 'REAJUSTE SALARIAL' ? 'selected' : ''}>REAJUSTE SALARIAL</option>
                        <option value="ADMISSÃO" ${item.move_type === 'ADMISSÃO' ? 'selected' : ''}>ADMISSÃO</option>
                        <option value="DESLIGAMENTO" ${item.move_type === 'DESLIGAMENTO' ? 'selected' : ''}>DESLIGAMENTO</option>
                        <option value="BONIFICAÇÃO" ${item.move_type === 'BONIFICAÇÃO' ? 'selected' : ''}>BONIFICAÇÃO</option>
                        <option value="OCORRÊNCIA" ${item.move_type === 'OCORRÊNCIA' ? 'selected' : ''}>OCORRÊNCIA</option>
                    </select>
                </div>
                <div>
                    <label class="pro-label">Data</label>
                    <input type="datetime-local" id="edit-date" class="pro-input" value="${dateValue}">
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="pro-label">Cargo/Função</label>
                    <input type="text" id="edit-role" class="pro-input" value="${item.role || ''}">
                </div>
                <div>
                    <label class="pro-label">Setor</label>
                    <input type="text" id="edit-sector" class="pro-input" value="${item.salary || ''}">
                </div>
            </div>
            
            <div>
                <label class="pro-label">Valor</label>
                <input type="text" id="edit-salary" class="pro-input font-bold text-nordeste-red" value="${item.salary || ''}">
            </div>
            
            <div>
                <label class="pro-label">Responsável</label>
                <input type="text" id="edit-responsible" class="pro-input" value="${item.responsible || ''}">
            </div>
            
            <div>
                <label class="pro-label">Observação</label>
                <textarea id="edit-observation" class="pro-input h-24">${item.observation || ''}</textarea>
            </div>
            
            <div class="flex gap-3">
                <button type="button" onclick="window.deleteCareerItem('${id}')" class="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-medium text-sm uppercase border border-red-200 hover:bg-red-100">Excluir</button>
                <button type="button" onclick="window.closeProModal()" class="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium text-sm uppercase hover:bg-gray-200">Cancelar</button>
                <button type="submit" class="flex-1 py-3 bg-nordeste-red text-white rounded-xl font-medium text-sm uppercase shadow-md hover:bg-red-700">Salvar</button>
            </div>
        </form>
    `;

    // Event listener do formulário
    document.getElementById('edit-career-form').onsubmit = async (e) => {
        e.preventDefault();
        
        const formData = {
            role: document.getElementById('edit-role').value,
            sector: document.getElementById('edit-sector').value,
            salary: document.getElementById('edit-salary').value,
            move_type: document.getElementById('edit-move-type').value,
            date: document.getElementById('edit-date').value,
            responsible: document.getElementById('edit-responsible').value,
            observation: document.getElementById('edit-observation').value,
            cbo: document.getElementById('edit-cbo').value
        };

        try {
            const res = await fetch(`/api/career/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                showSuccessMessage('Registro atualizado com sucesso!');
                window.closeProModal();
                refreshCurrentEmployee();
            } else {
                const error = await res.json();
                showErrorMessage(error.error || 'Erro ao atualizar registro');
            }
        } catch (e) {
            console.error('Erro ao editar registro:', e);
            showErrorMessage('Falha de comunicação com o servidor');
        }
    };

    modal.classList.remove('hidden');
};

window.filterTimeline = (filterType) => {
    const allBtn = document.querySelector('[data-filter="all"]');
    const careerBtn = document.querySelector('[data-filter="career"]');
    const bonusBtn = document.querySelector('[data-filter="bonus"]');
    
    // Resetar estilos
    [allBtn, careerBtn, bonusBtn].forEach(btn => {
        btn.classList.remove('bg-nordeste-red', 'text-white', 'border-nordeste-red');
        btn.classList.add('bg-white', 'text-gray-600', 'border-gray-200');
    });
    
    // Ativar botão selecionado
    const activeBtn = document.querySelector(`[data-filter="${filterType}"]`);
    activeBtn.classList.remove('bg-white', 'text-gray-600', 'border-gray-200');
    activeBtn.classList.add('bg-nordeste-red', 'text-white', 'border-nordeste-red');
    
    // Filtrar e renderizar
    let filteredHistory = fullHistory;
    if (filterType === 'career') {
        filteredHistory = fullHistory.filter(h => h.type_group === 'CARREIRA');
    } else if (filterType === 'bonus') {
        filteredHistory = fullHistory.filter(h => h.type_group === 'BONUS');
    }
    
    renderTimelineItems(filteredHistory);
};

function renderTimelineItems(history) {
    const container = document.getElementById('career-timeline');
    const itemsContainer = container.querySelector('.timeline-items') || document.createElement('div');
    itemsContainer.className = 'timeline-items space-y-6';
    
    if (!container.querySelector('.timeline-items')) {
        container.appendChild(itemsContainer);
    }
    
    itemsContainer.innerHTML = history.map((item, index) => {
        const date = formatarDataBR(item.date);
        const moveType = item.move_type || '';
        const isPromotion = moveType.toLowerCase().includes('promoção') || moveType.toLowerCase().includes('promocao');
        const isBonus = item.type_group === 'BONUS';
        const isTermination = moveType.toLowerCase().includes('desligamento');
        
        let badgeClass = 'bg-admissao';
        if (isPromotion) badgeClass = 'bg-promocao';
        else if (isBonus) badgeClass = 'bg-reajuste';
        else if (isTermination) badgeClass = 'bg-desligamento';
        else if (moveType.toLowerCase().includes('reajuste')) badgeClass = 'bg-reajuste';
        
        return `
            <div class="career-item animate-fade" style="animation-delay: ${index * 0.1}s">
                <div class="timeline-dot ${badgeClass.replace('bg-', 'border-')}"></div>
                <div class="career-card bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer" onclick="window.editCareerItem('${item.id}')">
                    <div class="flex justify-between items-start mb-3">
                        <div class="flex items-center gap-2">
                            <span class="move-badge ${badgeClass} px-3 py-1 rounded-full text-xs font-medium uppercase">${moveType}</span>
                            <span class="text-xs text-gray-400">${date}</span>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="event.stopPropagation(); window.editCareerItem('${item.id}')" class="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition-all" aria-label="Editar">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                            </button>
                            <button onclick="event.stopPropagation(); window.deleteCareerItem('${item.id}')" class="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-all" aria-label="Excluir">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            </button>
                        </div>
                    </div>
                    
                    <div class="space-y-2">
                        ${item.role ? `<p class="text-sm font-medium text-gray-800">${item.role}</p>` : ''}
                        ${item.sector ? `<p class="text-xs text-gray-500">${item.sector}</p>` : ''}
                        ${item.salary && item.salary !== '-' ? `
                            <div class="flex items-center gap-2">
                                <p class="text-base font-bold text-nordeste-red">${formatSalaryValue(item.salary)}</p>
                                ${isPromotion ? '<span class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">↑ Aumento</span>' : ''}
                            </div>
                        ` : ''}
                        ${item.observation ? `<p class="text-xs text-gray-600 italic">${item.observation}</p>` : ''}
                        ${item.responsible ? `<p class="text-xs text-gray-400">Responsável: ${item.responsible}</p>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

window.openEmployeeById = async (id) => {
    const exists = employees.find(e => e.id === id);
    if (exists) {
        window.selectEmployee(id);
    } else {
        await loadAllEmployees();
        setTimeout(() => {
            window.selectEmployee(id);
        }, 300);
    }
};

window.selectEmployee = async (id) => {
    // Feedback visual de seleção
    const allItems = document.querySelectorAll('.emp-item');
    allItems.forEach(item => item.classList.remove('active'));
    
    selectedId = id;
    const emp = employees.find(e => e.id === id);
    if (emp) {
        currentEmployeeData = emp;
        
        // Mostrar loading na área principal
        const selectionView = document.getElementById('selection-view');
        const welcomeMsg = document.getElementById('welcome-msg');
        
        welcomeMsg.classList.add('hidden');
        selectionView.classList.remove('hidden');
        
// Loading state na view do funcionário - restaurar HTML original
        selectionView.innerHTML = `
            <div class="max-w-6xl mx-auto w-full">
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div class="space-y-6">
                        <div class="bg-white rounded-2xl p-6 border-2 border-nordeste-red shadow-xl flex flex-col items-center">
                            <div class="w-28 h-28 rounded-2xl bg-gray-200 animate-pulse mb-4"></div>
                            <div class="h-6 w-32 rounded bg-gray-200 animate-pulse mb-2"></div>
                            <div class="h-4 w-20 rounded bg-gray-200 animate-pulse"></div>
                            <div class="w-full mt-6 pt-6 border-t border-gray-100 space-y-4">
                                <div class="h-4 w-24 rounded bg-gray-200 animate-pulse"></div>
                                <div class="h-6 w-28 rounded bg-gray-200 animate-pulse"></div>
                            </div>
                        </div>
                        <div class="bg-nordeste-black rounded-2xl p-6 text-white relative overflow-hidden">
                            <div class="h-8 w-20 rounded bg-gray-600 animate-pulse mb-2"></div>
                            <div class="h-12 w-16 rounded bg-gray-600 animate-pulse"></div>
                            <div class="h-4 w-32 rounded bg-gray-600 animate-pulse mt-2"></div>
                        </div>
                    </div>
                    <div class="lg:col-span-2 space-y-6">
                        <div class="flex flex-wrap gap-3">
                            <div class="h-12 w-32 rounded-xl bg-gray-200 animate-pulse"></div>
                            <div class="h-12 w-24 rounded-xl bg-gray-200 animate-pulse"></div>
                            <div class="h-12 w-28 rounded-xl bg-gray-200 animate-pulse"></div>
                        </div>
                        <div class="space-y-6">
                            <div class="h-20 rounded-xl bg-gray-200 animate-pulse"></div>
                            <div class="h-20 rounded-xl bg-gray-200 animate-pulse"></div>
                            <div class="h-20 rounded-xl bg-gray-200 animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        updateEmployeeView(emp);
        await loadCareerTimeline(id);
        
        showSuccessMessage(`${emp.name} selecionado`);
    }
    renderSidebar();
};

async function loadCareerTimeline(id) {
    try {
        // Mostrar loading na timeline
        showTimelineLoadingState(true);
        
        const res = await fetch(`/api/career/${id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        
        const careerData = await res.json();

        fullHistory = careerData.map(c => {
            // Classificação inteligente do tipo de registro
            const isBonus = c.move_type.toLowerCase().includes('bonificação') ||
                c.move_type.toLowerCase().includes('mérito') ||
                c.move_type.toLowerCase().includes('bônus') ||
                c.move_type.toLowerCase().includes('bonus');
            return {
                ...c,
                type_group: isBonus ? 'BONUS' : 'CARREIRA',
                source_table: 'career'
            };
        }).sort((a, b) => new Date(b.date) - new Date(a.date));

        renderTimeline(fullHistory);
        
        if (careerData.length > 0) {
            showSuccessMessage(`${careerData.length} registros de carreira carregados`);
        }
        
    } catch (e) { 
        console.error('Erro ao carregar timeline de carreira:', e);
        showErrorMessage('Falha ao carregar histórico: ' + e.message);
        fullHistory = [];
        renderTimeline([]);
    } finally {
        showTimelineLoadingState(false);
    }
}

function showTimelineLoadingState(show) {
    const container = document.getElementById('career-timeline');
    if (!container) return;
    
    if (show) {
        container.innerHTML = `
            <div class="space-y-4">
                <div class="flex justify-between items-center mb-4">
                    <h4 class="text-[9px] font-black text-gray-400 uppercase tracking-widest italic">Timeline do Colaborador</h4>
                </div>
                <div class="space-y-6">
                    <div class="skeleton h-20 rounded-xl"></div>
                    <div class="skeleton h-20 rounded-xl"></div>
                    <div class="skeleton h-20 rounded-xl"></div>
                </div>
            </div>
        `;
    }
}

function renderTimeline(history) {
    const container = document.getElementById('career-timeline');
    if (!container) return;

    const careerCount = history.filter(h => h.type_group === 'CARREIRA').length;
    const bonusCount = history.filter(h => h.type_group === 'BONUS').length;

    container.innerHTML = `
        <div class="flex justify-between items-center mb-6 flex-wrap gap-3">
            <div class="flex items-center gap-4">
                <h4 class="text-sm font-medium text-gray-500 uppercase tracking-wider">Timeline do Colaborador</h4>
                <div class="flex gap-2">
                    <span class="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                        ${careerCount} Carreira
                    </span>
                    <span class="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-medium">
                        ${bonusCount} Bônus
                    </span>
                </div>
            </div>
            <div class="flex gap-2">
                <button onclick="window.filterTimeline('all')" class="timeline-filter-btn text-xs px-3 py-2 rounded-lg border border-gray-200 transition-all hover:border-nordeste-red hover:text-nordeste-red" data-filter="all">
                    Todos
                </button>
                <button onclick="window.filterTimeline('career')" class="timeline-filter-btn text-xs px-3 py-2 rounded-lg border border-gray-200 transition-all hover:border-nordeste-red hover:text-nordeste-red" data-filter="career">
                    Carreira
                </button>
                <button onclick="window.filterTimeline('bonus')" class="timeline-filter-btn text-xs px-3 py-2 rounded-lg border border-gray-200 transition-all hover:border-nordeste-red hover:text-nordeste-red" data-filter="bonus">
                    Bônus
                </button>
                <button onclick="window.viewFullHistory()" class="text-xs font-medium text-nordeste-red uppercase bg-red-50 px-3 py-2 rounded-lg border border-red-100 hover:bg-red-100 transition-all flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    Auditoria
                </button>
            </div>
        </div>
    `;

    if (history.length === 0) {
        container.innerHTML += `
            <div class="empty-state bg-gray-50 rounded-xl p-8 text-center">
                <div class="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>
                <p class="text-sm font-medium text-gray-600">Sem registros de carreira</p>
                <p class="text-xs text-gray-400 mt-1">Este colaborador ainda não possui histórico de movimentações</p>
            </div>
        `;
        return;
    }

    // Remover duplicados baseados em data e tipo
    const uniqueHistory = history.filter((item, index, self) => 
        index === self.findIndex((t) => 
            t.date === item.date && 
            t.move_type === item.move_type && 
            t.salary === item.salary
        )
    );

    // Cálculo de Variação (Exclui Bônus e Ocorrências)
    const salaryEvents = uniqueHistory
        .filter(h => h.type_group === 'CARREIRA' && h.salary && h.salary !== '-')
        .sort((a, b) => new Date(a.date) - new Date(b.date)); // Ordenar do mais antigo para o mais novo

    if (salaryEvents.length > 0) {
        const firstSal = parseCurrency(salaryEvents[0].salary); // Primeiro salário histórico (mais antigo)
        const lastHistoricalSal = parseCurrency(salaryEvents[salaryEvents.length - 1].salary); // Último salário histórico

        let variation = 0;
        if (firstSal > 0 && lastHistoricalSal > 0) {
            // Usar apenas o último salário do histórico para cálculo consistente
            variation = ((lastHistoricalSal - firstSal) / firstSal * 100).toFixed(1);
            
            // Limitar variação a valores razoáveis (máximo 1000%)
            if (variation > 1000) variation = 999.9;
        }
        
        const variationEl = document.getElementById('view-variation');
        if (variationEl) {
            variationEl.innerText = `${variation > 0 ? '+' : ''}${variation}%`;
        }
    } else {
        const variationEl = document.getElementById('view-variation');
        if (variationEl) {
            variationEl.innerText = `0.0%`;
        }
    }

    // Renderizar timeline com dados únicos e ordenados
    renderTimelineItems(uniqueHistory);
}

window.deleteHistoryItem = async (id, table) => {
    if (!confirm("⚠️ ATENÇÃO: Deseja excluir permanentemente este registro do histórico?\nEsta ação não altera os dados atuais do colaborador, apenas remove o registro da timeline.")) return;

    try {
        const endpoint = table === 'career' ? `/api/career/${id}` : `/api/occurrences/${id}`;
        const res = await fetch(endpoint, { method: 'DELETE' });
        if (res.ok) {
            refreshCurrentEmployee();
        } else {
            alert("Erro ao excluir registro.");
        }
    } catch (e) {
        alert("Falha de comunicação.");
    }
};

window.editCareerItem = (id, table) => {
    const item = fullHistory.find(h => h.id === id);
    if (!item) return;

    const modal = document.getElementById('pro-modal-container');
    const content = document.getElementById('pro-modal-content');

    const isOccurrence = table === 'occurrences';
    const dateValue = item.date.replace(' ', 'T').substring(0, 19);

    content.innerHTML = `
        <div class="bg-nordeste-black p-8 text-white"><h3 class="text-xl font-black uppercase italic">Corrigir Histórico de Carreira</h3></div>
        <form id="edit-history-form" class="p-10 space-y-6">
            <div class="grid grid-cols-2 gap-4">
                <div><label class="pro-label">Tipo de Evento</label><input id="e-type" class="pro-input uppercase" value="${item.move_type}" ${isOccurrence ? 'readonly' : ''}></div>
                <div><label class="pro-label">Data e Hora (Manual)</label><input type="datetime-local" id="e-date" class="pro-input font-bold" value="${dateValue}"></div>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div><label class="pro-label">Cargo</label><input id="e-role" class="pro-input uppercase" value="${item.role}" ${isOccurrence ? 'readonly' : ''}></div>
                <div><label class="pro-label">Setor</label><input id="e-sector" class="pro-input uppercase" value="${item.sector}" ${isOccurrence ? 'readonly' : ''}></div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div><label class="pro-label">Valor / Salário</label><input id="e-salary" class="pro-input font-black text-nordeste-red" value="${item.salary}" ${isOccurrence ? 'readonly' : ''}></div>
                <div><label class="pro-label">CBO</label><input id="e-cbo" class="pro-input font-mono" value="${item.cbo || ''}" ${isOccurrence ? 'readonly' : ''}></div>
            </div>

            <div><label class="pro-label">Observação / Justificativa</label><textarea id="e-obs" class="pro-input h-24 uppercase">${item.observation || ''}</textarea></div>

            <div class="flex gap-4">
                <button type="button" onclick="window.closeProModal()" class="flex-1 py-4 font-black uppercase text-gray-400">Cancelar</button>
                <button type="submit" class="flex-[3] bg-nordeste-black text-white py-4 rounded-2xl font-black uppercase shadow-xl">Salvar Alterações</button>
            </div>
        </form>
    `;

    document.getElementById('edit-history-form').onsubmit = async (e) => {
        e.preventDefault();

        const payload = isOccurrence ? {
            type: item.move_type,
            date: document.getElementById('e-date').value.replace('T', ' '),
            reason: item.sector,
            responsible: item.responsible,
            observation: document.getElementById('e-obs').value
        } : {
            move_type: document.getElementById('e-type').value,
            date: document.getElementById('e-date').value.replace('T', ' '),
            role: document.getElementById('e-role').value,
            sector: document.getElementById('e-sector').value,
            salary: document.getElementById('e-salary').value,
            cbo: document.getElementById('e-cbo').value,
            observation: document.getElementById('e-obs').value,
            responsible: Auth.getUser()?.name || 'Administrador'
        };

        const endpoint = table === 'career' ? `/api/career/${id}` : `/api/occurrences/${id}`;

        try {
            const res = await fetch(endpoint, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                window.closeProModal();
                await loadAllEmployees();
                if (selectedId) window.selectEmployee(selectedId);
            } else {
                alert("Erro ao salvar alterações.");
            }
        } catch (e) {
            alert("Falha de conexão.");
        }
    };

    modal.classList.remove('hidden');
};

// LOG DE AUDITORIA (HISTÓRICO COMPLETO EM TABELA)
window.viewFullHistory = () => {
    const modal = document.getElementById('pro-modal-container');
    const content = document.getElementById('pro-modal-content');
    content.className = "bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-hidden animate-pop";
    content.innerHTML = `
        <div class="bg-nordeste-black p-8 text-white flex justify-between items-center">
            <div>
                <h3 class="text-xl font-black uppercase italic">Log de Auditoria de Carreira</h3>
                <p class="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Registros chronológicos e invariáveis</p>
            </div>
            <button onclick="window.closeProModal()" class="text-white/20">✕</button>
        </div>
        <div class="p-8 overflow-x-auto max-h-[60vh] custom-scroll">
            <table class="w-full text-left border-collapse text-[10px]">
                <thead>
                    <tr class="text-gray-400 uppercase font-black border-b border-gray-100">
                        <th class="p-4">Data/Hora</th>
                        <th class="p-4">Evento</th>
                        <th class="p-4">Cargo / Setor</th>
                        <th class="p-4">Valor</th>
                        <th class="p-4">Responsável</th>
                        <th class="p-4 text-center">Ações</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                    ${fullHistory.map(h => `
                        <tr>
                            <td class="p-4 font-mono text-gray-400">${formatarDataHoraBR(h.date)}</td>
                            <td class="p-4"><span class="font-black uppercase italic ${h.type_group === 'CARREIRA' ? 'text-blue-600' : h.type_group === 'BONUS' ? 'text-emerald-600' : 'text-amber-600'}">${h.move_type}</span></td>
                            <td class="p-4 font-bold uppercase">${h.role} <br> <span class="text-[8px] text-gray-300 font-medium">${h.sector}</span></td>
                            <td class="p-4 font-black text-gray-800">${formatSalaryValue(h.salary)}</td>
                            <td class="p-4 text-nordeste-red font-black uppercase italic">${h.responsible || '---'}</td>
                            <td class="p-4 text-center">
                                <div class="flex justify-center gap-1">
                                    <button onclick="window.editCareerItem('${h.id}', '${h.source_table}')" class="p-1 hover:bg-gray-100 rounded-md transition-all" title="Editar">✏️</button>
                                    <button onclick="window.deleteHistoryItem('${h.id}', '${h.source_table}')" class="p-1 hover:bg-red-50 rounded-md transition-all" title="Excluir">🗑️</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div class="p-8 bg-gray-50 border-t flex justify-end">
            <button onclick="window.closeProModal()" class="bg-nordeste-black text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase">Fechar Auditoria</button>
        </div>
    `;
    modal.classList.remove('hidden');
};

// REAJUSTE COLETIVO (FUNCIONAL)
window.openBulkAdjustment = () => {
    if (!employees || employees.length === 0) {
        alert('Carregue os dados dos colaboradores primeiro.');
        return;
    }
    const modal = document.getElementById('pro-modal-container');
    const content = document.getElementById('pro-modal-content');
    content.innerHTML = `
        <div class="bg-green-600 p-8 text-white"><h3 class="text-xl font-black uppercase italic">Reajuste Salarial Coletivo</h3></div>
        <form id="bulk-form" class="p-10 space-y-6">
            <div>
                <label class="pro-label">Percentual de Aumento (%)</label>
                <input type="number" id="b-percent" step="0.01" class="pro-input font-black text-3xl text-center text-green-700" placeholder="0.00" required>
            </div>
            <div>
                <label class="pro-label">Observação / Justificativa</label>
                <textarea id="b-obs" class="pro-input h-20" placeholder="Ex: Dissídio Coletivo 2026..." required></textarea>
            </div>
            <div class="p-4 bg-amber-50 rounded-xl border border-amber-200 flex gap-3">
                <span class="text-xl">⚠️</span>
                <p class="text-[9px] text-amber-700 font-bold uppercase leading-tight">Atenção: Esta ação atualizará o salário de TODOS os colaboradores ativos e gerará um registro no histórico individual de cada um.</p>
            </div>
            <button type="submit" class="w-full bg-nordeste-black text-white py-4 rounded-2xl font-black uppercase shadow-xl">Aplicar Aumento Geral</button>
            <button type="button" onclick="window.closeProModal()" class="w-full text-gray-400 font-black text-[10px] mt-2 uppercase">Cancelar</button>
        </form>
    `;
    document.getElementById('bulk-form').onsubmit = async (e) => {
        e.preventDefault();
        const percent = document.getElementById('b-percent').value;
        const obs = document.getElementById('b-obs').value;
        const responsible = Auth.getUser()?.name || 'Administrador';

        if (!confirm(`Confirma a aplicação de reajuste de ${percent}% para toda a base?`)) return;

        const res = await fetch('/api/career/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ percentage: percent, observation: obs, responsible })
        });

        if (res.ok) {
            alert("🎯 REAJUSTE COLETIVO APLICADO COM SUCESSO!");
            window.closeProModal();
            await loadAllEmployees();
            if (selectedId) window.selectEmployee(selectedId);
        } else {
            alert("Erro ao processar reajuste.");
        }
    };
    modal.classList.remove('hidden');
};

// OUTRAS MODAIS MANTIDAS COM PRECISÃO DE DATA
window.openPromotionModal = () => {
    if (!currentEmployeeData) {
        alert('Selecione um colaborador primeiro.');
        return;
    }
    const modal = document.getElementById('pro-modal-container');
    const content = document.getElementById('pro-modal-content');
    content.innerHTML = `
        <div class="bg-nordeste-black p-8 text-white"><h3 class="text-xl font-black uppercase italic">Nova Movimentação Profissional</h3></div>
        <form id="promo-form" class="p-10 space-y-6">
            <div><label class="pro-label">Tipo de Evento</label><select id="m-type" class="pro-input font-bold"><option>Promoção</option><option>Reajuste Salarial</option><option>Acordo Individual</option><option>Desligamento</option></select></div>
            <div><label class="pro-label">Novo Cargo</label><select id="m-role-select" class="pro-input font-bold"><option value="">-- MANTER ATUAL --</option>${rolesMatrix.map(r => `<option value="${r.id}">${r.name}</option>`).join('')}</select></div>
            <div class="grid grid-cols-2 gap-4">
                <div><label class="pro-label">Setor</label><input id="m-sector" class="pro-input bg-gray-50" readonly value="${currentEmployeeData.sector}"></div>
                <div><label class="pro-label">Novo Salário</label><input id="m-salary" class="pro-input font-black text-green-700" oninput="window.formatCurrencyInput(event)" value="${currentEmployeeData.currentSalary}"></div>
            </div>
            <div><label class="pro-label">CBO (Auto)</label><input id="m-cbo" class="pro-input bg-gray-50 font-mono" readonly value="${currentEmployeeData.cbo}"></div>
            <div><label class="pro-label">Observação</label><textarea id="m-obs" class="pro-input h-20" placeholder="Justificativa..."></textarea></div>
            <button type="submit" class="w-full bg-nordeste-red text-white py-4 rounded-2xl font-black uppercase shadow-xl">Confirmar Alteração</button>
            <button type="button" onclick="window.closeProModal()" class="w-full text-gray-400 font-black text-[10px] mt-2 uppercase">Cancelar</button>
        </form>
    `;
    document.getElementById('m-role-select').addEventListener('change', (e) => {
        const r = rolesMatrix.find(x => x.id === e.target.value);
        if (r) { document.getElementById('m-sector').value = r.sector; document.getElementById('m-cbo').value = r.cbo; }
    });
    document.getElementById('promo-form').onsubmit = async (e) => {
        e.preventDefault();
        const now = new Date();
        const preciseDate = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0');
        const roleData = rolesMatrix.find(r => r.id === document.getElementById('m-role-select').value);
        const payload = {
            employeeId: selectedId, move_type: document.getElementById('m-type').value,
            role: roleData ? roleData.name : currentEmployeeData.role,
            sector: document.getElementById('m-sector').value, cbo: document.getElementById('m-cbo').value,
            salary: document.getElementById('m-salary').value, date: preciseDate,
            observation: document.getElementById('m-obs').value, responsible: Auth.getUser()?.name || 'Sistema'
        };
        const res = await fetch('/api/career', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (res.ok) { window.closeProModal(); refreshCurrentEmployee(); }
    };
    modal.classList.remove('hidden');
};

window.openBonusModal = () => {
    if (!currentEmployeeData) {
        alert('Selecione um colaborador primeiro.');
        return;
    }
    const modal = document.getElementById('pro-modal-container');
    const content = document.getElementById('pro-modal-content');
    content.innerHTML = `
        <div class="bg-amber-500 p-8 text-white"><h3 class="text-xl font-black uppercase italic">Registrar Bonificação / Mérito</h3></div>
        <form id="bonus-form" class="p-10 space-y-6">
            <div><label class="pro-label">Valor do Bônus (Pagamento Único)</label><input id="b-salary" class="pro-input font-black text-amber-700" oninput="window.formatCurrencyInput(event)"></div>
            <div><label class="pro-label">Motivo do Reconhecimento</label><input id="b-reason" class="pro-input" placeholder="Ex: Meta batida, Destaque do mês"></div>
            <div><label class="pro-label">Descrição Detalhada</label><textarea id="b-obs" class="pro-input h-20"></textarea></div>
            <div class="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <p class="text-[9px] font-bold text-amber-700 uppercase">Nota: Este valor será registrado apenas como histórico e não alterará o salário base do colaborador.</p>
            </div>
            <button type="submit" class="w-full bg-nordeste-black text-white py-4 rounded-2xl font-black uppercase shadow-xl">Gravar no Prontuário</button>
            <button type="button" onclick="window.closeProModal()" class="w-full text-gray-400 font-black text-[10px] mt-2 uppercase">Cancelar</button>
        </form>
    `;
    document.getElementById('bonus-form').onsubmit = async (e) => {
        e.preventDefault();
        const now = new Date();
        const preciseDate = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0');

        // Mantemos os dados atuais de cargo/setor para consistência do registro
        const payload = {
            employeeId: selectedId, move_type: 'Bonificação / Mérito',
            role: currentEmployeeData.role, sector: currentEmployeeData.sector, cbo: currentEmployeeData.cbo,
            salary: document.getElementById('b-salary').value, date: preciseDate,
            observation: document.getElementById('b-reason').value + ': ' + document.getElementById('b-obs').value,
            responsible: Auth.getUser()?.name || 'Sistema'
        };
        const res = await fetch('/api/career', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (res.ok) { window.closeProModal(); refreshCurrentEmployee(); }
    };
    modal.classList.remove('hidden');
};

window.openOccurrenceModal = () => {
    if (!currentEmployeeData) {
        alert('Selecione um colaborador primeiro.');
        return;
    }
    const modal = document.getElementById('pro-modal-container');
    const content = document.getElementById('pro-modal-content');
    content.innerHTML = `
        <div class="bg-nordeste-red p-8 text-white"><h3 class="text-xl font-black uppercase italic">Registrar Ocorrência Disciplinar</h3></div>
        <form id="occ-form" class="p-10 space-y-6">
            <div><label class="pro-label">Tipo de Medida</label><select id="o-type" class="pro-input font-bold"><option>Advertência Verbal</option><option>Advertência Escrita</option><option>Suspensão</option><option>Justa Causa (Desligamento)</option></select></div>
            <div><label class="pro-label">Motivo Principal</label><input id="o-reason" class="pro-input" placeholder="Ex: Atraso recorrente, Indisciplina..."></div>
            <div><label class="pro-label">Detalhamento</label><textarea id="o-obs" class="pro-input h-20"></textarea></div>
            <button type="submit" class="w-full bg-nordeste-black text-white py-4 rounded-2xl font-black uppercase shadow-xl">Gravar Ocorrência</button>
            <button type="button" onclick="window.closeProModal()" class="w-full text-gray-400 font-black text-[10px] mt-2 uppercase">Cancelar</button>
        </form>
    `;
    document.getElementById('occ-form').onsubmit = async (e) => {
        e.preventDefault();
        const now = new Date();
        const preciseDate = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0');
        const payload = {
            employeeId: selectedId, type: document.getElementById('o-type').value,
            date: preciseDate, reason: document.getElementById('o-reason').value,
            observation: document.getElementById('o-obs').value, responsible: Auth.getUser()?.name || 'Sistema'
        };
        const res = await fetch('/api/occurrences', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (res.ok) { window.closeProModal(); refreshCurrentEmployee(); }
    };
    modal.classList.remove('hidden');
};

window.formatCurrencyInput = formatCurrencyInput;
window.closeProModal = () => document.getElementById('pro-modal-container').classList.add('hidden');
