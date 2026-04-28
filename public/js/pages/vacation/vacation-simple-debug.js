// Estado Global
let employees = [];
let selectedId = null;
let currentEmployeeData = null;
let vacationHistory = [];
let filterStatus = 'all';
let vacationFilter = 'all';

// Funções de Formatação
function formatarDataBR(date) {
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function formatarDataHoraBR(date) {
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Carrega todos os colaboradores
async function loadAllEmployees() {
    try {
        const res = await fetch('/api/employees');
        if (res.ok) {
            employees = await res.json();
        } else {
            employees = generateSampleEmployees();
        }

        // Carrega histórico de férias de todos os funcionários
        await loadAllVacations();

        renderEmployees();

        if (selectedId) {
            const emp = employees.find(e => e.id === selectedId);
            if (emp) {
                currentEmployeeData = emp;
                updateEmployeeInfo();
            }
        }
    } catch (e) {
        console.error('Erro ao carregar colaboradores:', e);
        employees = generateSampleEmployees();
        renderEmployees();
        showNotification('Erro ao carregar colaboradores', 'error');
    }
}

// Carrega histórico de férias de todos os funcionários
async function loadAllVacations() {
    try {
        const res = await fetch('/api/vacations?limit=1000');
        if (res.ok) {
            const data = await res.json();
            vacationHistory = data.vacations || [];
        } else {
            vacationHistory = [];
        }
    } catch (e) {
        console.error('Erro ao carregar histórico de férias:', e);
        vacationHistory = [];
    }
}

// Filtros
window.setFilterStatus = (status) => {
    filterStatus = status;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-${status}`).classList.add('active');
    renderEmployees();
};

// Novo filtro de período aquisitivo
window.setVacationFilter = (filter) => {
    vacationFilter = filter;
    document.querySelectorAll('.vac-tag').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-${filter}`).classList.add('active');
    renderEmployees();
};

// Verifica se pode tirar férias (12+ meses trabalhados)
function canTakeVacations(employee) {
    const admissionDate = new Date(employee.admissionDate);
    const currentDate = new Date();
    const monthsWorked = Math.floor((currentDate - admissionDate) / (1000 * 60 * 60 * 24 * 30));
    return monthsWorked >= 12;
}

// Verifica se está em período aquisitivo (< 12 meses)
function isInAcquiringPeriod(employee) {
    const admissionDate = new Date(employee.admissionDate);
    const currentDate = new Date();
    const monthsWorked = Math.floor((currentDate - admissionDate) / (1000 * 60 * 60 * 24 * 30));
    return monthsWorked < 12;
}

// Verifica se está de férias atualmente
function isCurrentlyOnVacation(employee) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const employeeVacations = vacationHistory.filter(v => v.employee_id === employee.id);
    return employeeVacations.some(vacation => {
        const startDate = new Date(vacation.start_date);
        const endDate = new Date(vacation.end_date);
        return vacation.status === 'Em Gozo' ||
            (vacation.status === 'Agendado' && today >= startDate && today <= endDate);
    });
}

// Verifica se tem férias vencidas (períodos aquisitivos completos sem gozo)
function hasOverdueVacations(employee) {
    const admissionDate = new Date(employee.admissionDate);
    const currentDate = new Date();
    const totalMonths = Math.floor((currentDate - admissionDate) / (1000 * 60 * 60 * 24 * 30));
    const completedPeriods = Math.floor(totalMonths / 12);

    if (completedPeriods === 0) return false;

    // Calcula férias já gozadas
    const takenDays = vacationHistory
        .filter(v => v.employee_id === employee.id && (v.status === 'Gozado' || v.status === 'Concluída'))
        .reduce((total, v) => total + (v.days_taken || 0), 0);

    const takenPeriods = Math.floor(takenDays / 30);
    const overduePeriods = completedPeriods - takenPeriods;

    return overduePeriods > 0;
}

// Calcula períodos vencidos
function getOverduePeriods(employee) {
    const admissionDate = new Date(employee.admissionDate);
    const currentDate = new Date();
    const totalMonths = Math.floor((currentDate - admissionDate) / (1000 * 60 * 60 * 24 * 30));
    const completedPeriods = Math.floor(totalMonths / 12);

    if (completedPeriods === 0) return 0;

    // Calcula férias já gozadas
    const takenDays = vacationHistory
        .filter(v => v.employee_id === employee.id && (v.status === 'Gozado' || v.status === 'Concluída'))
        .reduce((total, v) => total + (v.days_taken || 0), 0);

    const takenPeriods = Math.floor(takenDays / 30);
    return completedPeriods - takenPeriods;
}

// Classifica o status de férias do funcionário
function getVacationStatus(employee) {
    if (employee.type === 'Desligado') {
        return 'terminated'; // Só pode ter histórico retroativo
    }

    if (isCurrentlyOnVacation(employee)) {
        return 'currently';
    }

    if (hasOverdueVacations(employee)) {
        return 'overdue';
    }

    if (canTakeVacations(employee)) {
        return 'available';
    }

    if (isInAcquiringPeriod(employee)) {
        return 'acquiring';
    }

    return 'unknown';
}

// Calcula meses trabalhados para exibição
function getMonthsWorked(employee) {
    const admissionDate = new Date(employee.admissionDate);
    const currentDate = new Date();
    return Math.floor((currentDate - admissionDate) / (1000 * 60 * 60 * 24 * 30));
}

window.filterList = () => renderEmployees();

// Renderiza Sidebar
function renderEmployees() {
    const container = document.getElementById('employees-list');
    if (!container) return;

    const search = document.getElementById('emp-search')?.value.toLowerCase() || '';

    const filtered = (employees || []).filter(e => {
        // Filtro de status (ativos/desligados)
        const matchesStatus = filterStatus === 'all' ||
            (filterStatus === 'active' && e.type !== 'Desligado') ||
            (filterStatus === 'inactive' && e.type === 'Desligado');

        // Filtro de busca
        const matchesSearch = e.name.toLowerCase().includes(search) || e.registrationNumber.includes(search);

        // Filtro de status de férias
        let matchesVacationFilter = true;
        const vacationStatus = getVacationStatus(e);

        if (vacationFilter === 'available') {
            matchesVacationFilter = vacationStatus === 'available';
        } else if (vacationFilter === 'acquiring') {
            matchesVacationFilter = vacationStatus === 'acquiring';
        } else if (vacationFilter === 'currently') {
            matchesVacationFilter = vacationStatus === 'currently';
        } else if (vacationFilter === 'overdue') {
            matchesVacationFilter = vacationStatus === 'overdue';
        }

        return matchesStatus && matchesSearch && matchesVacationFilter;
    });

    container.innerHTML = filtered.map(emp => {
        const monthsWorked = getMonthsWorked(emp);
        const vacationStatus = getVacationStatus(emp);
        const overduePeriods = getOverduePeriods(emp);

        let badgeClass = '';
        let badgeText = '';
        let itemClass = 'emp-item';
        let periodCount = '';

        // Define indicadores visuais baseados no status
        switch (vacationStatus) {
            case 'currently':
                badgeClass = 'badge-currently';
                badgeText = '🌴';
                itemClass += ' vacation-currently';
                break;
            case 'overdue':
                badgeClass = 'badge-overdue';
                badgeText = '⚠️';
                itemClass += ' vacation-overdue';
                periodCount = `<div class="period-count">${overduePeriods}</div>`;
                break;
            case 'available':
                badgeClass = 'badge-available';
                badgeText = '🏖️';
                itemClass += ' vacation-available';
                break;
            case 'acquiring':
                badgeClass = 'badge-acquiring';
                badgeText = '⏳';
                itemClass += ' vacation-acquiring';
                break;
            case 'terminated':
                badgeClass = 'badge-info';
                badgeText = '📋';
                break;
            default:
                badgeClass = 'badge-info';
                badgeText = `${monthsWorked}m`;
        }

        return `
            <div class="${itemClass} ${selectedId === emp.id ? 'active' : ''}" onclick="window.selectEmployee('${emp.id}')" style="position: relative;">
                <img src="${emp.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}`}" 
                     class="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-md" 
                     alt="${emp.name}">
                <div class="flex-1 min-w-0">
                    <div class="font-black text-gray-800 text-xs leading-tight">${emp.name}</div>
                    <div class="text-[9px] text-gray-400 font-mono">#${emp.registrationNumber}</div>
                    <div class="text-[9px] text-nordeste-red font-bold uppercase mt-1">${emp.role}</div>
                </div>
                <div class="vacation-badge ${badgeClass}">${badgeText}</div>
                ${periodCount}
            </div>
        `;
    }).join('');
}

// Seleciona Colaborador
window.selectEmployee = async (id) => {
    try {
        console.log('👤 Selecionando funcionário ID:', id);
        selectedId = id;
        renderEmployees();

        const emp = employees.find(e => e.id === id);
        if (!emp) {
            console.error('❌ Funcionário não encontrado:', id);
            showNotification('Funcionário não encontrado', 'error');
            return;
        }

        console.log('✅ Funcionário encontrado:', emp.name);
        currentEmployeeData = emp;

        // Aguarda um pouco antes de atualizar a UI
        setTimeout(() => {
            updateEmployeeInfo();
            loadVacationTimeline(id);
        }, 100);
    } catch (error) {
        console.error('💥 Erro ao selecionar funcionário:', error);
        showNotification('Erro ao selecionar funcionário', 'error');
    }
};

// Atualiza informações do colaborador
function updateEmployeeInfo() {
    if (!currentEmployeeData) return;

    const balance = calculateVacationBalance(currentEmployeeData);

    // Verifica se os elementos existem antes de acessar
    const empPhotoEl = document.getElementById('view-photo');
    const empNameEl = document.getElementById('view-name');
    const empRoleEl = document.getElementById('view-role');
    const empRegEl = document.getElementById('view-reg');
    const vacBalanceEl = document.getElementById('view-balance');
    const totalVacationsEl = document.getElementById('view-total-vacations');

    if (empPhotoEl && currentEmployeeData.photoUrl) empPhotoEl.src = currentEmployeeData.photoUrl;
    if (empNameEl) empNameEl.textContent = currentEmployeeData.name;
    if (empRoleEl) empRoleEl.textContent = currentEmployeeData.role;
    if (empRegEl) empRegEl.textContent = '#' + currentEmployeeData.registrationNumber;

    // Atualiza informações de férias
    if (vacBalanceEl) vacBalanceEl.textContent = balance.availableDays + ' dias';

    // Histórico de períodos
    const employeeVacations = vacationHistory.filter(v => v.employee_id === currentEmployeeData.id);
    if (totalVacationsEl) totalVacationsEl.textContent = employeeVacations.length;
}

// Calcula saldo de férias seguindo CLT
function calculateVacationBalance(employee) {
    const admissionDate = new Date(employee.admissionDate);
    const currentDate = new Date();
    const totalMonths = Math.floor((currentDate - admissionDate) / (1000 * 60 * 60 * 24 * 30));
    const completedPeriods = Math.floor(totalMonths / 12);

    if (completedPeriods === 0) return {
        acquiredDays: 0,
        takenDays: 0,
        availableDays: 0,
        note: 'Ainda não completou 12 meses de trabalho'
    };

    // Calcula dias adquiridos (máximo 30 por período)
    const acquiredDays = Math.min(completedPeriods * 30, 30);

    // Calcula dias já gozados
    const takenDays = vacationHistory
        .filter(v => v.employee_id === employee.id && (v.status === 'Gozado' || v.status === 'Concluída'))
        .reduce((total, v) => total + (v.days_taken || 0), 0);

    const availableDays = Math.max(0, acquiredDays - takenDays);

    return {
        acquiredDays,
        takenDays,
        availableDays,
        totalMonths,
        note: completedPeriods === 0 ? 'Ainda não completou 12 meses de trabalho' :
            totalMonths < 12 ? 'Em período aquisitivo inicial' :
                `${completedPeriods} período(s) completos`
    };
}

// Carrega Timeline de Férias
async function loadVacationTimeline(id) {
    try {
        console.log('🔄 Carregando timeline para o funcionário ID:', id);

        // Filtra as férias do funcionário selecionado do histórico já carregado
        const employeeVacations = vacationHistory.filter(v => v.employee_id === id);
        console.log('📋 Férias encontradas no histórico:', employeeVacations.length);

        // Se não tiver histórico específico, tenta carregar da API
        if (employeeVacations.length === 0) {
            console.log('🔍 Buscando férias na API...');
            const res = await fetch(`/api/vacations/employee/${id}`);

            if (res.ok) {
                const data = await res.json();
                console.log('📊 Dados da API:', data);
                // Adiciona ao histórico geral
                vacationHistory = [...vacationHistory, ...(data.vacations || [])];
                console.log('📋 Histórico atualizado:', vacationHistory.length);
            } else {
                console.log('⚠️ API não disponível, usando dados simulados');
                // Se não tiver API, usa dados simulados
                vacationHistory = [...vacationHistory, ...generateSampleVacations(id)];
            }
        }

        console.log('✅ Renderizando timeline...');
        renderVacationTimeline();
    } catch (e) {
        console.error('💥 Erro ao carregar timeline:', e);
        // Usa dados simulados como fallback
        vacationHistory = [...vacationHistory, ...generateSampleVacations(id)];
        renderVacationTimeline();
    }
}

// Renderiza Timeline de Férias
function renderVacationTimeline() {
    const container = document.getElementById('vacation-timeline');
    if (!container) {
        console.error('❌ Container #vacation-timeline não encontrado');
        return;
    }

    // Filtra apenas as férias do funcionário selecionado
    const employeeVacations = vacationHistory.filter(v => v.employee_id === currentEmployeeData?.id);
    console.log('🎯 Renderizando timeline para funcionário:', currentEmployeeData?.id);
    console.log('📊 Férias encontradas:', employeeVacations.length);
    console.log('📋 Container encontrado:', !!container);
    console.log('🎨 Container innerHTML antes:', container.innerHTML.substring(0, 100));

    if (employeeVacations.length === 0) {
        const emptyHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #9ca3af;">
                <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;">🏖️</div>
                <h4 style="font-size: 16px; font-weight: 700; margin-bottom: 8px;">Nenhum registro de férias</h4>
                <p style="font-size: 12px; color: #6b7280;">
                    ${currentEmployeeData?.type === 'Desligado'
                ? 'Funcionário desligado - apenas histórico retroativo disponível'
                : 'Este colaborador ainda não possui registros de férias'
            }
                </p>
            </div>
        `;
        console.log('📝 Definindo HTML vazio:', emptyHTML.substring(0, 100));
        container.innerHTML = emptyHTML;
        console.log('✅ HTML vazio definido. Container innerHTML depois:', container.innerHTML.substring(0, 100));
        return;
    }

    console.log('✅ Renderizando', employeeVacations.length, 'registros');
    const cardsHTML = employeeVacations.map(vacation => {
        const startDate = formatarDataBR(new Date(vacation.start_date));
        const endDate = formatarDataBR(new Date(vacation.end_date));

        let statusClass = 'vacation-planejado';
        if (vacation.status === 'Gozado' || vacation.status === 'Histórico Retroativo') statusClass = 'vacation-gozado';
        else if (vacation.status === 'Em Gozo') statusClass = 'vacation-em-gozo';
        else if (vacation.status === 'Agendado' || vacation.status === 'Planejado') statusClass = 'vacation-planejado';
        else if (vacation.status === 'Vencida') statusClass = 'vacation-vencido';

        return `
            <div class="vacation-item">
                <div class="vacation-dot"></div>
                <div class="vacation-card animate-fade">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <span class="vacation-badge ${statusClass}">${vacation.status}</span>
                            <h5 class="text-sm font-black text-gray-800 mt-3 mb-1">
                                ${startDate} a ${endDate}
                            </h5>
                            <p class="text-[10px] font-bold text-gray-400 uppercase">
                                ${vacation.days_taken} dias ${vacation.abono_days > 0 ? `+ ${vacation.abono_days} abono` : ''}
                            </p>
                        </div>
                        <div class="text-right">
                            <div class="flex gap-1 justify-end">
                                <button onclick="window.editVacation('${vacation.id}')" class="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-nordeste-red">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                                </button>
                                <button onclick="window.deleteVacation('${vacation.id}')" class="p-2 hover:bg-red-50 rounded-lg transition-colors text-gray-400 hover:text-red-600">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                </button>
                            </div>
                            <p class="text-[9px] font-mono text-gray-300 mt-2">
                                ID #${vacation.id.slice(0, 4)}
                            </p>
                        </div>
                    </div>
                    ${vacation.observation ? `
                        <div class="pt-3 border-t border-gray-50">
                            <p class="text-[10px] text-gray-500 italic font-medium leading-relaxed">
                                "${vacation.observation}"
                            </p>
                        </div>
                    ` : ''}
                                class="btn btn-danger" style="padding: 4px 8px; font-size: 10px; height: auto; background: #fee2e2; color: #991b1b; border: 1px solid #fecaca;">
                            🗑️ Excluir
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    console.log('📝 HTML dos cards gerado:', cardsHTML.substring(0, 200));
    container.innerHTML = cardsHTML;
    console.log('✅ HTML definido. Container innerHTML depois:', container.innerHTML.substring(0, 200));
}

// Gera dados de exemplo
function generateSampleVacations(employeeId) {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return [];

    const admissionDate = new Date(employee.admissionDate);
    const currentDate = new Date();
    const monthsWorked = Math.floor((currentDate - admissionDate) / (1000 * 60 * 60 * 24 * 30));

    const sampleVacations = [];

    // Gera férias apenas se já trabalhou mais de 12 meses
    if (monthsWorked >= 12) {
        const startDate1 = new Date(admissionDate);
        startDate1.setMonth(startDate1.getMonth() + 12);
        const endDate1 = new Date(startDate1);
        endDate1.setDate(startDate1.getDate() + 29);

        sampleVacations.push({
            id: 'sample1_' + employeeId,
            employee_id: employeeId,
            start_date: startDate1.toISOString().split('T')[0],
            end_date: endDate1.toISOString().split('T')[0],
            days_taken: 30,
            abono_days: 0,
            status: monthsWorked >= 24 ? 'Gozado' : 'Planejado',
            observation: 'Férias exemplo - período 1',
            created_at: startDate1.toISOString()
        });
    }

    return sampleVacations;
}

// Gera dados de exemplo para funcionários
function generateSampleEmployees() {
    return [
        {
            id: 'emp001',
            name: 'João Silva',
            registrationNumber: '001',
            role: 'Analista de Sistemas',
            sector: 'TI',
            admissionDate: '2022-01-15',
            photoUrl: '',
            type: 'Ativo'
        },
        {
            id: 'emp002',
            name: 'Maria Santos',
            registrationNumber: '002',
            role: 'Auxiliar Administrativo',
            sector: 'RH',
            admissionDate: '2023-03-10',
            photoUrl: '',
            type: 'Ativo'
        },
        {
            id: 'emp003',
            name: 'Pedro Costa',
            registrationNumber: '003',
            role: 'Desenvolvedor',
            sector: 'TI',
            admissionDate: '2021-06-01',
            photoUrl: '',
            type: 'Desligado'
        }
    ];
}

// Modal Functions
window.openVacationModal = () => {
    if (!currentEmployeeData) {
        showNotification('Selecione um colaborador primeiro', 'warning');
        return;
    }

    const modalContent = `
        <div class="vac-modal-header p-8 bg-nordeste-black text-white flex justify-between items-center rounded-t-[32px]">
            <div>
                <h3 class="text-xs font-black uppercase tracking-widest opacity-50 mb-1">Novo Agendamento</h3>
                <h2 class="text-lg font-black uppercase italic">Agendar Férias</h2>
            </div>
            <button onclick="window.closeModal()" class="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors">✕</button>
        </div>
        
        <div class="vac-modal-body p-8 space-y-6">
            <!-- Informações do Colaborador -->
            <div class="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
                <img src="${currentEmployeeData.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentEmployeeData.name)}`}" 
                     class="w-12 h-12 rounded-xl object-cover shadow-sm" 
                     alt="${currentEmployeeData.name}">
                <div>
                    <h4 class="font-bold text-slate-800 leading-none mb-1">${currentEmployeeData.name}</h4>
                    <p class="text-[10px] font-mono text-slate-400">Matrícula #${currentEmployeeData.registrationNumber}</p>
                </div>
            </div>

            <!-- Formulário -->
            <div class="grid grid-cols-2 gap-4">
                <div class="form-group">
                    <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block">Data de Início</label>
                    <input type="date" id="start-date" class="form-input" required>
                </div>

                <div class="form-group">
                    <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block">Dias de Gozo</label>
                    <input type="number" id="days" class="form-input" min="5" max="30" value="30" required>
                </div>
            </div>

            <div class="form-group">
                <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block">Abono Pecuniário</label>
                <select id="abono" class="form-input">
                    <option value="0">Não converter em abono</option>
                    <option value="10">Sim (Vender 10 dias)</option>
                </select>
            </div>

            <div class="form-group">
                <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block">Observações do RH</label>
                <textarea id="observations" class="form-textarea" placeholder="Observações sobre o agendamento..."></textarea>
            </div>
        </div>

        <div class="vac-modal-footer p-8 border-t bg-slate-50/50 flex justify-between items-center rounded-b-[32px]">
            <button onclick="window.closeModal()" class="px-6 py-3 font-bold text-slate-400 text-[11px] uppercase hover:text-slate-600 transition-colors">Cancelar</button>
            <button onclick="window.submitVacation()" class="btn btn-primary">Confirmar Agendamento</button>
        </div>
    `;

    document.getElementById('vac-modal-content').innerHTML = modalContent;
    document.getElementById('vac-modal-container').classList.remove('hidden');
};

window.openRetroModal = () => {
    if (!currentEmployeeData) {
        showNotification('Selecione um colaborador primeiro', 'warning');
        return;
    }

    const modalContent = `
        <div class="vac-modal-header p-8 bg-amber-500 text-white flex justify-between items-center rounded-t-[32px]">
            <div>
                <h3 class="text-xs font-black uppercase tracking-widest opacity-50 mb-1">Histórico</h3>
                <h2 class="text-lg font-black uppercase italic">Registro Retroativo</h2>
            </div>
            <button onclick="window.closeModal()" class="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors">✕</button>
        </div>
        
        <div class="vac-modal-body p-8 space-y-6">
            <!-- Informações do Colaborador -->
            <div class="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
                <img src="${currentEmployeeData.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentEmployeeData.name)}`}" 
                     class="w-12 h-12 rounded-xl object-cover shadow-sm" 
                     alt="${currentEmployeeData.name}">
                <div>
                    <h4 class="font-bold text-slate-800 leading-none mb-1">${currentEmployeeData.name}</h4>
                    <p class="text-[10px] font-mono text-slate-400">Matrícula #${currentEmployeeData.registrationNumber}</p>
                </div>
            </div>

            <div class="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                <span class="text-lg">ℹ️</span>
                <p class="text-[10px] font-medium text-amber-800 leading-relaxed">
                    Este formulário deve ser usado apenas para regularizar períodos de férias que já ocorreram e não foram registrados no sistema.
                </p>
            </div>

            <!-- Formulário -->
            <div class="grid grid-cols-2 gap-4">
                <div class="form-group">
                    <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block">Data de Início *</label>
                    <input type="date" id="retro-start-date" class="form-input" required>
                </div>

                <div class="form-group">
                    <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block">Dias de Gozo *</label>
                    <input type="number" id="retro-days" class="form-input" min="1" max="30" value="30" required>
                </div>
            </div>

            <div class="form-group">
                <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block">Justificativa do Retroativo</label>
                <textarea id="retro-observations" class="form-textarea" placeholder="Motivo do registro retroativo..."></textarea>
            </div>
        </div>

        <div class="vac-modal-footer p-8 border-t bg-slate-50/50 flex justify-between items-center rounded-b-[32px]">
            <button onclick="window.closeModal()" class="px-6 py-3 font-bold text-slate-400 text-[11px] uppercase hover:text-slate-600 transition-colors">Cancelar</button>
            <button onclick="window.submitRetro()" class="btn btn-amber">Gravar Histórico</button>
        </div>
    `;

    document.getElementById('vac-modal-content').innerHTML = modalContent;
    document.getElementById('vac-modal-container').classList.remove('hidden');
};

window.submitVacation = async () => {
    const startDate = document.getElementById('start-date')?.value;
    const days = parseInt(document.getElementById('days')?.value) || 0;
    const abono = parseInt(document.getElementById('abono')?.value) || 0;
    const observations = document.getElementById('observations')?.value;

    if (!startDate || !days) {
        showNotification('Preencha todos os campos obrigatórios', 'error');
        return;
    }

    if (days + abono > 30) {
        showNotification('A soma de dias gozados + abono não pode exceder 30 dias', 'error');
        return;
    }

    try {
        const payload = {
            employee_id: currentEmployeeData.id,
            start_date: startDate,
            days_taken: days,
            abono_days: abono,
            observation: observations,
            status: 'Planejado',
            responsible: (typeof Auth !== 'undefined') ? Auth.getUser()?.name : 'RH'
        };

        const res = await fetch('/api/vacations/schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            showNotification('Férias agendadas com sucesso!', 'success');
            closeModal();
            await loadVacationTimeline(currentEmployeeData.id);
            updateEmployeeInfo();
        } else {
            const error = await res.json();
            showNotification('Erro: ' + error.error, 'error');
        }
    } catch (error) {
        console.error('Erro ao agendar férias:', error);
        showNotification('Erro ao agendar férias', 'error');
    }
};

window.submitRetro = async () => {
    const startDate = document.getElementById('retro-start-date')?.value;
    const days = parseInt(document.getElementById('retro-days')?.value) || 0;
    const observations = document.getElementById('retro-observations')?.value;

    if (!startDate || !days) {
        showNotification('Preencha todos os campos obrigatórios', 'error');
        return;
    }

    if (days > 30) {
        showNotification('Férias retroativas não podem exceder 30 dias', 'error');
        return;
    }

    try {
        const payload = {
            employee_id: currentEmployeeData.id,
            start_date: startDate,
            days_taken: days,
            observation: observations,
            status: 'Gozado',
            responsible: (typeof Auth !== 'undefined') ? Auth.getUser()?.name : 'RH'
        };

        const res = await fetch('/api/vacations/retroactive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            showNotification('Registro histórico gravado com sucesso!', 'success');
            closeModal();
            await loadVacationTimeline(currentEmployeeData.id);
            updateEmployeeInfo();
        } else {
            const error = await res.json();
            showNotification('Erro: ' + error.error, 'error');
        }
    } catch (error) {
        console.error('Erro ao registrar retroativo:', error);
        showNotification('Erro ao registrar retroativo', 'error');
    }
};

window.closeModal = () => {
    document.getElementById('vac-modal-container').classList.add('hidden');
};

// Edit/Delete Functions
window.editVacation = async (id) => {
    try {
        console.log('🔍 Editando férias ID:', id);

        // Carrega dados do registro
        const res = await fetch(`/api/vacations/${id}`);
        console.log('📊 Status da resposta:', res.status);

        if (!res.ok) {
            const errorText = await res.text();
            console.error('❌ Erro na API:', res.status, errorText);
            throw new Error(`Erro ${res.status}: ${errorText}`);
        }

        const data = await res.json();
        console.log('📋 Dados recebidos:', data);

        const vacation = data.vacation;

        if (!vacation) {
            console.error('❌ Registro não encontrado no response');
            showNotification('Registro não encontrado', 'error');
            return;
        }

        console.log('✅ Registro carregado, abrindo modal...');
        // Abre modal de edição
        openEditModal(vacation);
    } catch (error) {
        console.error('💥 Erro completo em editVacation:', error);
        showNotification('Erro ao carregar registro: ' + error.message, 'error');
    }
};

window.deleteVacation = (id) => {
    console.log('🗑️ Solicitando exclusão do ID:', id);

    if (confirm('Deseja realmente excluir este registro de férias?\n\nEsta ação não poderá ser desfeita.')) {
        deleteVacationRecord(id);
    } else {
        console.log('❌ Usuário cancelou a exclusão');
    }
};

async function deleteVacationRecord(id) {
    try {
        console.log('🗑️ Executando exclusão do ID:', id);

        const res = await fetch(`/api/vacations/${id}`, {
            method: 'DELETE'
        });

        console.log('📊 Status da exclusão:', res.status);

        if (res.ok) {
            const data = await res.json();
            console.log('✅ Resposta da exclusão:', data);
            showNotification('Registro excluído com sucesso!', 'success');

            // Recarrega a timeline e atualiza informações
            await loadVacationTimeline(currentEmployeeData.id);
            updateEmployeeInfo();
        } else {
            const errorText = await res.text();
            console.error('❌ Erro na exclusão:', res.status, errorText);
            showNotification('Erro ao excluir registro: ' + errorText, 'error');
        }
    } catch (error) {
        console.error('💥 Erro completo em deleteVacationRecord:', error);
        showNotification('Erro ao excluir registro', 'error');
    }
}

function openEditModal(vacation) {
    const modalContent = `
        <div class="vac-modal-header p-8 bg-nordeste-black text-white flex justify-between items-center rounded-t-[32px]">
            <div>
                <h3 class="text-xs font-black uppercase tracking-widest opacity-50 mb-1">Férias</h3>
                <h2 class="text-lg font-black uppercase italic">Editar Registro</h2>
            </div>
            <button onclick="window.closeModal()" class="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors">✕</button>
        </div>
        
        <div class="vac-modal-body p-8 space-y-6">
            <!-- Informações do Colaborador -->
            <div class="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
                <img src="${currentEmployeeData.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentEmployeeData.name)}`}" 
                     class="w-12 h-12 rounded-xl object-cover shadow-sm" 
                     alt="${currentEmployeeData.name}">
                <div>
                    <h4 class="font-bold text-slate-800 leading-none mb-1">${currentEmployeeData.name}</h4>
                    <p class="text-[10px] font-mono text-slate-400">#${currentEmployeeData.registrationNumber}</p>
                </div>
            </div>

            <!-- Formulário de Edição -->
            <input type="hidden" id="edit-vacation-id" value="${vacation.id}">
            
            <div class="grid grid-cols-2 gap-4">
                <div class="form-group">
                    <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block">Data de Início</label>
                    <input type="date" id="edit-start-date" class="form-input" value="${vacation.start_date}" required>
                </div>

                <div class="form-group">
                    <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block">Dias de Gozo</label>
                    <input type="number" id="edit-days" class="form-input" min="5" max="30" value="${vacation.days_taken}" required>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div class="form-group">
                    <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block">Abono Pecuniário</label>
                    <select id="edit-abono" class="form-input">
                        <option value="0" ${vacation.abono_days === 0 ? 'selected' : ''}>Não</option>
                        <option value="10" ${vacation.abono_days === 10 ? 'selected' : ''}>Sim (10 dias)</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block">Status Atual</label>
                    <select id="edit-status" class="form-input">
                        <option value="Planejado" ${vacation.status === 'Planejado' ? 'selected' : ''}>Planejado</option>
                        <option value="Agendado" ${vacation.status === 'Agendado' ? 'selected' : ''}>Agendado</option>
                        <option value="Em Gozo" ${vacation.status === 'Em Gozo' ? 'selected' : ''}>Em Gozo</option>
                        <option value="Gozado" ${vacation.status === 'Gozado' ? 'selected' : ''}>Gozado</option>
                    </select>
                </div>
            </div>

            <div class="form-group">
                <label class="text-[10px] font-black uppercase text-slate-400 mb-2 block">Observações Internas</label>
                <textarea id="edit-observations" class="form-textarea" placeholder="Observações sobre o agendamento...">${vacation.observation || ''}</textarea>
            </div>
        </div>

        <div class="vac-modal-footer p-8 border-t bg-slate-50/50 flex justify-between items-center rounded-b-[32px]">
            <button onclick="window.closeModal()" class="px-6 py-3 font-bold text-slate-400 text-[11px] uppercase hover:text-slate-600 transition-colors">Cancelar</button>
            <button onclick="window.updateVacation()" class="btn btn-primary">Salvar Alterações</button>
        </div>
    `;

    document.getElementById('vac-modal-content').innerHTML = modalContent;
    document.getElementById('vac-modal-container').classList.remove('hidden');
}

window.updateVacation = async () => {
    const id = document.getElementById('edit-vacation-id')?.value;
    const startDate = document.getElementById('edit-start-date')?.value;
    const days = parseInt(document.getElementById('edit-days')?.value) || 0;
    const abono = parseInt(document.getElementById('edit-abono')?.value) || 0;
    const vacationStatus = document.getElementById('edit-status')?.value;
    const observations = document.getElementById('edit-observations')?.value;

    if (!startDate || !days) {
        showNotification('Preencha todos os campos obrigatórios', 'error');
        return;
    }

    if (days + abono > 30) {
        showNotification('A soma de dias gozados + abono não pode exceder 30 dias', 'error');
        return;
    }

    try {
        const payload = {
            start_date: startDate,
            days_taken: days,
            abono_days: abono,
            status: vacationStatus,
            observation: observations
        };

        const res = await fetch(`/api/vacations/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            showNotification('Registro atualizado com sucesso!', 'success');
            closeModal();
            await loadVacationTimeline(currentEmployeeData.id);
            updateEmployeeInfo();
        } else {
            const error = await res.json();
            showNotification('Erro: ' + error.error, 'error');
        }
    } catch (error) {
        console.error('Erro ao atualizar registro:', error);
        showNotification('Erro ao atualizar registro', 'error');
    }
};

window.viewFullHistory = async () => {
    if (!currentEmployeeData) {
        showNotification('Selecione um colaborador primeiro', 'warning');
        return;
    }

    try {
        // Carrega todos os registros com paginação
        const res = await fetch(`/api/vacations?employee_id=${currentEmployeeData.id}&limit=100`);

        if (res.ok) {
            const data = await res.json();
            const allVacations = data.vacations || [];

            // Abre modal com histórico completo
            openHistoryModal(allVacations);
        } else {
            showNotification('Erro ao carregar histórico completo', 'error');
        }
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        showNotification('Erro ao carregar histórico', 'error');
    }
};

function openHistoryModal(vacations) {
    const modalContent = `
        <div class="vac-modal-header p-8 bg-nordeste-black text-white flex justify-between items-center rounded-t-[32px]">
            <div>
                <h3 class="text-xs font-black uppercase tracking-widest opacity-50 mb-1">Colaborador</h3>
                <h2 class="text-lg font-black uppercase italic">${currentEmployeeData.name}</h2>
            </div>
            <button onclick="window.closeModal()" class="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors">✕</button>
        </div>
        
        <div class="vac-modal-body p-8" style="max-height: 500px; overflow-y: auto;">
            <!-- Informações do Colaborador -->
            <div class="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-8">
                <img src="${currentEmployeeData.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentEmployeeData.name)}`}" 
                     class="w-12 h-12 rounded-xl object-cover shadow-sm" 
                     alt="${currentEmployeeData.name}">
                <div>
                    <h4 class="font-bold text-slate-800 leading-none mb-1">${currentEmployeeData.role}</h4>
                    <p class="text-[10px] font-mono text-slate-400">Matrícula #${currentEmployeeData.registrationNumber}</p>
                </div>
            </div>

            <!-- Lista de Registros -->
            <div class="space-y-4">
                ${vacations.length === 0 ? `
                    <div class="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                        <div class="text-4xl mb-4 opacity-20">📂</div>
                        <h4 class="text-sm font-black text-slate-400 uppercase">Nenhum registro encontrado</h4>
                    </div>
                ` : vacations.map(vacation => {
        const startDate = formatarDataBR(new Date(vacation.start_date));
        const endDate = formatarDataBR(new Date(vacation.end_date));

        let statusClass = 'vacation-planejado';
        if (vacation.status === 'Gozado' || vacation.status === 'Histórico Retroativo') statusClass = 'vacation-gozado';
        else if (vacation.status === 'Em Gozo') statusClass = 'vacation-em-gozo';
        else if (vacation.status === 'Agendado' || vacation.status === 'Planejado') statusClass = 'vacation-planejado';

        return `
                        <div class="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:border-slate-200 transition-all">
                            <div class="flex justify-between items-start mb-4">
                                <div>
                                    <span class="vacation-badge ${statusClass}">${vacation.status}</span>
                                    <h5 class="text-sm font-black text-slate-800 mt-3 mb-1">
                                        ${startDate} a ${endDate}
                                    </h5>
                                    <p class="text-[10px] font-bold text-slate-400 uppercase">
                                        ${vacation.days_taken} dias ${vacation.abono_days > 0 ? `+ ${vacation.abono_days} abono` : ''}
                                    </p>
                                </div>
                                <div class="text-right">
                                    <p class="text-[9px] font-mono text-slate-300">
                                        ID #${vacation.id.slice(0, 4)}
                                    </p>
                                </div>
                            </div>
                            ${vacation.observation ? `
                                <div class="pt-3 border-t border-slate-50">
                                    <p class="text-[10px] text-slate-500 italic font-medium">"${vacation.observation}"</p>
                                </div>
                            ` : ''}
                        </div>
                    `;
    }).join('')}
            </div>
        </div>

        <div class="vac-modal-footer p-8 border-t bg-slate-50/50 flex justify-between items-center rounded-b-[32px]">
            <div>
                <p class="text-[10px] font-black text-slate-400 uppercase">Resumo Geral</p>
                <p class="text-xs font-bold text-slate-800">
                    ${vacations.length} registro${vacations.length !== 1 ? 's' : ''} identificado${vacations.length !== 1 ? 's' : ''}
                </p>
            </div>
            <button onclick="window.closeModal()" class="px-6 py-3 bg-slate-200 text-slate-600 rounded-xl font-bold text-[11px] uppercase hover:bg-slate-300 transition-colors">Fechar</button>
        </div>
    `;

    document.getElementById('vac-modal-content').innerHTML = modalContent;
    document.getElementById('vac-modal-container').classList.remove('hidden');
}

window.openBulkVacation = () => {
    showNotification('Agendamento em massa em desenvolvimento', 'info');
};

// Sistema de Notificações
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 20px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 12px;
        z-index: 1000;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;

    // Cores por tipo
    const colors = {
        success: { bg: '#10b981', text: 'white' },
        error: { bg: '#ef4444', text: 'white' },
        warning: { bg: '#f59e0b', text: 'white' },
        info: { bg: '#3b82f6', text: 'white' }
    };

    const color = colors[type] || colors.info;
    notification.style.backgroundColor = color.bg;
    notification.style.color = color.text;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Animação de entrada
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Remove automaticamente
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Adiciona animações
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    loadAllEmployees();
});
