/* VACATION SIMPLE - JavaScript Baseado no Módulo Carreira */

// Funções de formatação (substituindo o import do utils.js)
function formatarDataBR(data) {
    if (!data) return '--/--/----';
    const date = new Date(data);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function formatarDataHoraBR(data) {
    if (!data) return '--/--/---- --:--';
    const date = new Date(data);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// Estado Global
let employees = [];
let selectedId = null;
let currentEmployeeData = null;
let filterStatus = 'active';
let vacationFilter = 'all'; // Novo filtro de período aquisitivo
let vacationHistory = [];

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    if (typeof Auth !== 'undefined') {
        const user = Auth.check();
        if (!user) return;
    }
    loadAllEmployees();
});

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
    document.querySelectorAll('.vacation-filter-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-${filter}`).classList.add('active');
    renderEmployees();
};

// Verifica se funcionário pode tirar férias (12+ meses)
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
    selectedId = id;
    renderEmployees();

    const emp = employees.find(e => e.id === id);
    if (!emp) return;
    
    currentEmployeeData = emp;

    document.getElementById('welcome-msg').classList.add('hidden');
    document.getElementById('selection-view').classList.remove('hidden');

    updateEmployeeInfo();
    await loadVacationTimeline(id);
};

// Atualiza informações do colaborador
function updateEmployeeInfo() {
    if (!currentEmployeeData) return;

    document.getElementById('view-photo').src = currentEmployeeData.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentEmployeeData.name)}`;
    document.getElementById('view-name').innerText = currentEmployeeData.name;
    document.getElementById('view-reg').innerText = `#${currentEmployeeData.registrationNumber}`;
    document.getElementById('view-role').innerText = currentEmployeeData.role;
    
    // Calcula saldo de férias (corrigido)
    const balance = calculateVacationBalance(currentEmployeeData);
    
    // Exibe saldo com informações detalhadas
    let balanceText = `${balance.availableDays} dias`;
    if (balance.note) {
        balanceText += ` (${balance.note})`;
    }
    
    document.getElementById('view-balance').innerText = balanceText;
    
    // Atualiza estatísticas
    const totalVacations = vacationHistory.length;
    document.getElementById('view-total-vacations').innerText = totalVacations;
    
    // Adiciona aviso se não tiver histórico (base antiga)
    if (vacationHistory.length === 0 && balance.completedPeriods > 0) {
        setTimeout(() => {
            showNotification(
                '⚠️ Este colaborador não possui histórico no sistema. ' +
                'Os dados podem estar incompletos devido à migração da base antiga. ' +
                'Saldo calculado: ' + balance.availableDays + ' dias.',
                'warning',
                8000
            );
        }, 1000);
    }
}

// Calcula saldo de férias (corrigido para CLT real)
function calculateVacationBalance(employee) {
    const admissionDate = new Date(employee.admissionDate);
    const currentDate = new Date();
    
    // Calcula períodos aquisitivos completos (12 meses cada)
    const totalMonths = Math.floor((currentDate - admissionDate) / (1000 * 60 * 60 * 24 * 30));
    const completedPeriods = Math.floor(totalMonths / 12);
    
    // Cada período aquisitivo dá direito a 30 dias (máximo CLT)
    const acquiredDays = completedPeriods * 30;
    
    // Desconta apenas férias já gozadas (do histórico real)
    const takenDays = vacationHistory
        .filter(v => v.status === 'Gozado' || v.status === 'Concluída')
        .reduce((total, v) => total + (v.days_taken || 0), 0);
    
    // Saldo disponível (não pode ser negativo)
    const availableDays = Math.max(0, acquiredDays - takenDays);
    
    // Limita o saldo a 30 dias por segurança (não acumula indefinidamente)
    const finalBalance = Math.min(availableDays, 30);
    
    return {
        acquiredDays,
        takenDays,
        availableDays: finalBalance,
        completedPeriods,
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

// Gera dados de exemplo
function generateSampleVacations(employeeId) {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return [];
    
    const admissionDate = new Date(employee.admissionDate);
    const currentDate = new Date();
    const monthsWorked = Math.floor((currentDate - admissionDate) / (1000 * 60 * 60 * 24 * 30));
    
    const vacations = [];
    
    // Gera alguns períodos de férias simulados
    if (monthsWorked >= 12) {
        vacations.push({
            id: `vac1_${employeeId}`,
            start_date: '2023-06-01',
            end_date: '2023-06-30',
            days_taken: 30,
            status: 'Gozado',
            observation: 'Férias anuais 2023',
            responsible: 'RH',
            date: '2023-05-15'
        });
    }
    
    if (monthsWorked >= 24) {
        vacations.push({
            id: `vac2_${employeeId}`,
            start_date: '2024-01-15',
            end_date: '2024-02-13',
            days_taken: 30,
            status: 'Gozado',
            observation: 'Férias anuais 2024',
            responsible: 'RH',
            date: '2024-01-10'
        });
    }
    
    // Adiciona um planejado se tiver saldo
    const balance = calculateVacationBalance(employee);
    if (balance.availableDays > 0) {
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 2);
        
        vacations.push({
            id: `vac3_${employeeId}`,
            start_date: futureDate.toISOString().split('T')[0],
            end_date: new Date(futureDate.getTime() + 29 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            days_taken: 30,
            status: 'Planejado',
            observation: 'Férias planejadas',
            responsible: 'RH',
            date: new Date().toISOString().split('T')[0]
        });
    }
    
    return vacations.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Renderiza Timeline
function renderVacationTimeline() {
    const container = document.getElementById('vacation-timeline');
    if (!container) return;

    container.innerHTML = `
        <div class="flex justify-between items-center mb-4">
            <h4 class="text-[9px] font-black text-gray-400 uppercase tracking-widest italic">Timeline de Férias</h4>
            <button onclick="window.viewFullHistory()" 
                    class="text-[8px] font-black text-nordeste-red uppercase bg-red-50 px-3 py-1 rounded-lg border border-red-100 hover:bg-red-100 transition-all">
                📄 Histórico Completo
            </button>
        </div>
    `;

    if (vacationHistory.length === 0) {
        container.innerHTML += '<p class="text-gray-400 text-xs italic">Sem registros de férias.</p>';
        return;
    }

    container.innerHTML += vacationHistory.map((vacation, i) => {
        let dotColor = "border-nordeste-red";
        let cardBg = "bg-white";
        let badgeClass = "vacation-gozado";
        
        if (vacation.status === 'Planejado') {
            dotColor = "border-amber-400";
            cardBg = "bg-amber-50/30";
            badgeClass = "vacation-planejado";
        } else if (vacation.status === 'Em Gozo') {
            dotColor = "border-blue-400";
            cardBg = "bg-blue-50/30";
            badgeClass = "vacation-em-gozo";
        } else if (vacation.status === 'Vencido') {
            dotColor = "border-gray-400";
            badgeClass = "vacation-vencido";
        }

        const startDate = formatarDataBR(new Date(vacation.start_date));
        const endDate = formatarDataBR(new Date(vacation.end_date));

        return `
            <div class="vacation-item animate-fade" style="animation-delay: ${i * 0.05}s">
                <div class="vacation-dot" style="border-color: ${dotColor.replace('border-', '')}"></div>
                <div class="vacation-card ${cardBg} group">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <span class="vacation-badge ${badgeClass}">${vacation.status}</span>
                            <h4 class="vacation-period">${startDate} a ${endDate}</h4>
                            <p class="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                                ${vacation.days_taken} dias de gozo
                            </p>
                        </div>
                        <div class="text-right">
                            <div class="flex justify-end gap-2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onclick="window.editVacation('${vacation.id}')" 
                                        class="p-1.5 bg-gray-50 text-gray-400 hover:text-nordeste-red rounded-lg transition-colors border border-gray-100" 
                                        title="Editar">✏️</button>
                                <button onclick="window.deleteVacation('${vacation.id}')" 
                                        class="p-1.5 bg-gray-50 text-gray-400 hover:text-red-700 rounded-lg transition-colors border border-gray-100" 
                                        title="Excluir">🗑️</button>
                            </div>
                            <div class="vacation-days">${vacation.days_taken} dias</div>
                            <p class="vacation-date">${formatarDataHoraBR(new Date(vacation.date))}</p>
                        </div>
                    </div>
                    ${vacation.observation ? `
                        <div class="vacation-observation">
                            "${vacation.observation}"
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Modal Functions
window.openVacationModal = () => {
    if (!currentEmployeeData) {
        showNotification('Selecione um colaborador primeiro', 'warning');
        return;
    }

    const balance = calculateVacationBalance(currentEmployeeData);
    
    const modalContent = `
        <div class="vac-modal-header">
            <h3 class="vac-modal-title">Agendar Férias</h3>
            <button onclick="window.closeModal()" class="vac-modal-close">✕</button>
        </div>
        
        <div class="vac-modal-body">
            <!-- Informações do Colaborador -->
            <div style="display: flex; align-items: center; gap: 16px; padding: 20px; background: #f9fafb; border-radius: 12px; margin-bottom: 20px;">
                <img src="${currentEmployeeData.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentEmployeeData.name)}`}" 
                     style="width: 48px; height: 48px; border-radius: 12px; object-fit: cover;" 
                     alt="${currentEmployeeData.name}">
                <div>
                    <h4 style="font-weight: 700; color: #111827; margin: 0;">${currentEmployeeData.name}</h4>
                    <p style="font-size: 12px; color: #6b7280; margin: 0;">#${currentEmployeeData.registrationNumber}</p>
                </div>
            </div>

            <!-- Saldo Disponível -->
            <div class="balance-display">
                <div class="balance-label">Saldo Disponível</div>
                <div class="balance-value">
                    <span id="modal-balance">${balance.availableDays}</span>
                    <span class="balance-unit">DIAS</span>
                </div>
            </div>

            <!-- Formulário -->
            <div class="form-group">
                <label class="form-label">Data de Início</label>
                <input type="date" id="vac-start-date" class="form-input" required>
            </div>

            <div class="form-group">
                <label class="form-label">Dias de Gozo</label>
                <input type="number" id="vac-days" class="form-input" min="5" max="30" value="${Math.min(30, balance.availableDays)}" required>
            </div>

            <div class="form-group">
                <label class="form-label">Abono Pecuniário (dias)</label>
                <select id="vac-abono" class="form-input">
                    <option value="0">Não</option>
                    ${balance.availableDays >= 10 ? '<option value="10">Sim (10 dias)</option>' : ''}
                </select>
            </div>

            <div class="form-group">
                <label class="form-label">Observações</label>
                <textarea id="vac-observations" class="form-textarea" placeholder="Observações sobre o agendamento..."></textarea>
            </div>
        </div>

        <div class="vac-modal-footer">
            <div>
                <h4 style="font-size: 12px; font-weight: 700; color: #111827; margin: 0;">Ação</h4>
                <p style="font-size: 10px; color: #6b7280; margin: 0;">Agendar período de férias</p>
            </div>
            <div style="display: flex; gap: 12px;">
                <button onclick="window.closeModal()" class="btn btn-secondary">Cancelar</button>
                <button onclick="window.submitVacation()" class="btn btn-primary">Confirmar</button>
            </div>
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
        <div class="vac-modal-header">
            <h3 class="vac-modal-title">Registrar Retroativo</h3>
            <button onclick="window.closeModal()" class="vac-modal-close">✕</button>
        </div>
        
        <div class="vac-modal-body">
            <!-- Informações do Colaborador -->
            <div style="display: flex; align-items: center; gap: 16px; padding: 20px; background: #fef3c7; border-radius: 12px; margin-bottom: 20px;">
                <img src="${currentEmployeeData.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentEmployeeData.name)}`}" 
                     style="width: 48px; height: 48px; border-radius: 12px; object-fit: cover;" 
                     alt="${currentEmployeeData.name}">
                <div>
                    <h4 style="font-weight: 700; color: #92400e; margin: 0;">${currentEmployeeData.name}</h4>
                    <p style="font-size: 12px; color: #92400e; margin: 0;">#${currentEmployeeData.registrationNumber}</p>
                </div>
            </div>

            <!-- Aviso -->
            <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 12px; border-radius: 8px; margin-bottom: 20px;">
                <p style="font-size: 11px; color: #92400e; margin: 0;">
                    <strong>Atenção:</strong> Este registro será inserido como histórico passado e não poderá ser alterado.
                </p>
            </div>

            <!-- Formulário -->
            <div class="form-group">
                <label class="form-label">Data de Início (Passada)</label>
                <input type="date" id="retro-start-date" class="form-input" required onchange="window.calculateRetroEnd()">
            </div>

            <div class="form-group">
                <label class="form-label">Dias Gozados</label>
                <input type="number" id="retro-days" class="form-input" min="5" max="30" value="30" required onchange="window.calculateRetroEnd()">
            </div>

            <div class="form-group">
                <label class="form-label">Data de Término</label>
                <input type="text" id="retro-end-date" class="form-input" readonly value="--/--/----">
            </div>

            <div class="form-group">
                <label class="form-label">Motivo da Regularização</label>
                <textarea id="retro-observations" class="form-textarea" placeholder="Ex: Migração de planilha antiga; Ajuste de auditoria..."></textarea>
            </div>
        </div>

        <div class="vac-modal-footer">
            <div>
                <h4 style="font-size: 12px; font-weight: 700; color: #111827; margin: 0;">Ação</h4>
                <p style="font-size: 10px; color: #6b7280; margin: 0;">Registrar histórico passado</p>
            </div>
            <div style="display: flex; gap: 12px;">
                <button onclick="window.closeModal()" class="btn btn-secondary">Cancelar</button>
                <button onclick="window.submitRetro()" class="btn btn-warning">Gravar Registro</button>
            </div>
        </div>
    `;

    document.getElementById('vac-modal-content').innerHTML = modalContent;
    document.getElementById('vac-modal-container').classList.remove('hidden');
};

window.calculateRetroEnd = () => {
    const startDate = document.getElementById('retro-start-date')?.value;
    const days = parseInt(document.getElementById('retro-days')?.value) || 0;
    const endDateEl = document.getElementById('retro-end-date');
    
    if (!endDateEl) return;
    
    if (startDate && days > 0) {
        const start = new Date(startDate + 'T00:00:00');
        const end = new Date(start);
        end.setDate(start.getDate() + (days - 1));
        endDateEl.value = formatarDataBR(end);
    } else {
        endDateEl.value = '--/--/----';
    }
};

window.closeModal = () => {
    document.getElementById('vac-modal-container').classList.add('hidden');
};

// Submit Functions
window.submitVacation = async () => {
    if (!currentEmployeeData) return;

    const startDate = document.getElementById('vac-start-date')?.value;
    const days = parseInt(document.getElementById('vac-days')?.value) || 0;
    const abono = parseInt(document.getElementById('vac-abono')?.value) || 0;
    const observations = document.getElementById('vac-observations')?.value;

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
    if (!currentEmployeeData) return;

    const startDate = document.getElementById('retro-start-date')?.value;
    const days = parseInt(document.getElementById('retro-days')?.value) || 0;
    const observations = document.getElementById('retro-observations')?.value;

    if (!startDate || !days) {
        showNotification('Preencha todos os campos obrigatórios', 'error');
        return;
    }

    if (!confirm('CONFIRMA A REGULARIZAÇÃO?\n\nEste registro será inserido como histórico passado e não poderá ser alterado.')) {
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
        <div class="vac-modal-header">
            <h3 class="vac-modal-title">Editar Férias</h3>
            <button onclick="window.closeModal()" class="vac-modal-close">✕</button>
        </div>
        
        <div class="vac-modal-body">
            <!-- Informações do Colaborador -->
            <div style="display: flex; align-items: center; gap: 16px; padding: 20px; background: #f9fafb; border-radius: 12px; margin-bottom: 20px;">
                <img src="${currentEmployeeData.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentEmployeeData.name)}`}" 
                     style="width: 48px; height: 48px; border-radius: 12px; object-fit: cover;" 
                     alt="${currentEmployeeData.name}">
                <div>
                    <h4 style="font-weight: 700; color: #111827; margin: 0;">${currentEmployeeData.name}</h4>
                    <p style="font-size: 12px; color: #6b7280; margin: 0;">#${currentEmployeeData.registrationNumber}</p>
                </div>
            </div>

            <!-- Formulário de Edição -->
            <input type="hidden" id="edit-vacation-id" value="${vacation.id}">
            
            <div class="form-group">
                <label class="form-label">Data de Início</label>
                <input type="date" id="edit-start-date" class="form-input" value="${vacation.start_date}" required>
            </div>

            <div class="form-group">
                <label class="form-label">Dias de Gozo</label>
                <input type="number" id="edit-days" class="form-input" min="5" max="30" value="${vacation.days_taken}" required>
            </div>

            <div class="form-group">
                <label class="form-label">Abono Pecuniário (dias)</label>
                <select id="edit-abono" class="form-input">
                    <option value="0" ${vacation.abono_days === 0 ? 'selected' : ''}>Não</option>
                    <option value="10" ${vacation.abono_days === 10 ? 'selected' : ''}>Sim (10 dias)</option>
                </select>
            </div>

            <div class="form-group">
                <label class="form-label">Status</label>
                <select id="edit-status" class="form-input">
                    <option value="Planejado" ${vacation.status === 'Planejado' ? 'selected' : ''}>Planejado</option>
                    <option value="Agendado" ${vacation.status === 'Agendado' ? 'selected' : ''}>Agendado</option>
                    <option value="Em Gozo" ${vacation.status === 'Em Gozo' ? 'selected' : ''}>Em Gozo</option>
                    <option value="Gozado" ${vacation.status === 'Gozado' ? 'selected' : ''}>Gozado</option>
                </select>
            </div>

            <div class="form-group">
                <label class="form-label">Observações</label>
                <textarea id="edit-observations" class="form-textarea" placeholder="Observações sobre o agendamento...">${vacation.observation || ''}</textarea>
            </div>
        </div>

        <div class="vac-modal-footer">
            <div>
                <h4 style="font-size: 12px; font-weight: 700; color: #111827; margin: 0;">Ação</h4>
                <p style="font-size: 10px; color: #6b7280; margin: 0;">Atualizar registro de férias</p>
            </div>
            <div style="display: flex; gap: 12px;">
                <button onclick="window.closeModal()" class="btn btn-secondary">Cancelar</button>
                <button onclick="window.updateVacation()" class="btn btn-primary">Salvar Alterações</button>
            </div>
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
    const status = document.getElementById('edit-status')?.value;
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
            status: status,
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
        <div class="vac-modal-header">
            <h3 class="vac-modal-title">Histórico Completo de Férias</h3>
            <button onclick="window.closeModal()" class="vac-modal-close">✕</button>
        </div>
        
        <div class="vac-modal-body" style="max-height: 500px; overflow-y: auto;">
            <!-- Informações do Colaborador -->
            <div style="display: flex; align-items: center; gap: 16px; padding: 20px; background: #f9fafb; border-radius: 12px; margin-bottom: 20px;">
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
        };

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
        color: white;
        font-weight: 600;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 400px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    `;
    
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    
    notification.style.background = colors[type] || colors.info;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
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
