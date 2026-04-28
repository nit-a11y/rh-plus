import { DateFixer } from '../date-fixer.js';

let vacationData = { employees: [], stats: {}, allVacations: [] };
let selectedEmployeeId = null;
let timelineFilter = 'all';
let filterStatus = 'active';

document.addEventListener('DOMContentLoaded', () => {
    init();
});

async function init() {
    await loadDataFromServer();
    
    const urlParams = new URLSearchParams(window.location.search);
    const empId = urlParams.get('emp');
    if (empId) {
        const exists = vacationData.employees?.find(e => e.id === empId);
        if (exists) {
            window.selectEmployee(empId);
        }
    }
}

window.setFilterStatus = (status) => {
    filterStatus = status;
    document.getElementById('tab-active')?.classList.toggle('active', status === 'active');
    document.getElementById('tab-inactive')?.classList.toggle('active', status === 'inactive');
    renderEmployeeList();
};

async function loadDataFromServer() {
    try {
        const res = await fetch(`/api/vacations/summary?t=${Date.now()}`);
        if (!res.ok) throw new Error("Erro na rede");
        vacationData = await res.json();
        renderEmployeeList();
    } catch (e) {
        console.error("Erro ao carregar dados:", e);
    }
}

window.refreshData = loadDataFromServer;

// === SIDEBAR ===

function renderEmployeeList() {
    const list = document.getElementById('dossier-employee-list');
    if (!list) return;

    const search = document.getElementById('dossier-search')?.value.toLowerCase() || '';
    
    const filtered = (vacationData.employees || []).filter(e => {
        const name = (e.name || '').toLowerCase();
        const reg = (e.reg || e.registrationNumber || '0000').toLowerCase();
        const matchesSearch = !search || name.includes(search) || reg.includes(search);
        const isActive = e.type !== 'Desligado';
        const matchesStatus = filterStatus === 'active' ? isActive : !isActive;
        return matchesSearch && matchesStatus;
    });

    if (filtered.length === 0) {
        list.innerHTML = `<div class="p-8 text-center text-gray-300 text-[9px] font-black uppercase italic">Nenhum colaborador</div>`;
        return;
    }

    list.innerHTML = filtered.map(emp => {
        const empVacations = (vacationData.allVacations || []).filter(v => v.employee_id === emp.id);
        const lastVac = empVacations.find(v => v.status === 'Em Gozo');
        const hasPlanned = empVacations.some(v => v.status === 'Planejada' || v.status === 'Agendada');
        
        let badge = { bg: 'bg-gray-100', color: 'text-gray-500', text: 'Regular' };
        if (lastVac) {
            badge = { bg: 'bg-blue-100', color: 'text-blue-600', text: 'Em Gozo' };
        } else if (hasPlanned) {
            badge = { bg: 'bg-amber-100', color: 'text-amber-600', text: 'Agendado' };
        }

        return `
            <div onclick="selectEmployee('${emp.id}')" class="emp-item ${selectedEmployeeId === emp.id ? 'active' : ''}">
                <img src="${emp.photoUrl}" class="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-sm">
                <div class="min-w-0 flex-1">
                    <p class="text-[10px] font-black text-gray-800 uppercase truncate">${emp.name}</p>
                    <p class="text-[8px] text-gray-400 font-bold uppercase">${emp.reg || emp.registrationNumber || '---'} • ${emp.sector}</p>
                </div>
                <span class="text-[7px] font-black px-2 py-0.5 rounded-full uppercase ${badge.bg} ${badge.color}">${badge.text}</span>
            </div>
        `;
    }).join('');
}

// === SELECT EMPLOYEE ===

window.selectEmployee = (id) => {
    selectedEmployeeId = id;
    const emp = vacationData.employees.find(e => e.id === id);
    if (!emp) return;

    document.getElementById('welcome-msg').classList.add('hidden');
    document.getElementById('selection-view').classList.remove('hidden');

    const empVacations = (vacationData.allVacations || []).filter(v => v.employee_id === emp.id);
    const lastVac = empVacations.sort((a, b) => new Date(b.start_date) - new Date(a.start_date))[0];
    const lastDate = lastVac ? DateFixer.formatarDataParaExibicao(lastVac.return_date) : '--';

    document.getElementById('view-photo').src = emp.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}`;
    document.getElementById('view-name').innerText = emp.name;
    document.getElementById('view-reg').innerText = `#${emp.registrationNumber || emp.reg || '0000'}`;
    document.getElementById('view-sector').innerText = emp.sector || '--';
    document.getElementById('view-admission').innerText = emp.admissionDate ? DateFixer.formatarDataParaExibicao(emp.admissionDate) : '--';
    document.getElementById('view-last-vacation').innerText = lastDate;

    renderStats(emp);
    renderTimeline();
    renderEmployeeList();
};

function renderStats(emp) {
    const empVacations = (vacationData.allVacations || []).filter(v => v.employee_id === emp.id);
    
    const total = empVacations.length;
    const totalDays = empVacations.reduce((sum, v) => sum + (parseInt(v.days_taken) || 0), 0);
    const totalAbonos = empVacations.reduce((sum, v) => sum + (parseInt(v.abono_days) || 0), 0);
    
    const lastVac = empVacations.sort((a, b) => new Date(b.start_date) - new Date(a.start_date))[0];
    const lastDate = lastVac ? DateFixer.formatarDataParaExibicao(lastVac.return_date) : '--';

    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-days').innerText = totalDays;
    document.getElementById('stat-abonos').innerText = totalAbonos;
    document.getElementById('view-last-vacation').innerText = lastDate;

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const recentDays = empVacations
        .filter(v => new Date(v.start_date) >= oneYearAgo)
        .reduce((sum, v) => sum + (parseInt(v.days_taken) || 0) + (parseInt(v.abono_days) || 0), 0);
    document.getElementById('stat-balance').innerText = Math.max(0, 30 - recentDays);
}

// === TIMELINE ===

function renderTimeline() {
    const container = document.getElementById('vacation-timeline');
    if (!container || !selectedEmployeeId) return;

    let vacations = (vacationData.allVacations || []).filter(v => v.employee_id === selectedEmployeeId);

    if (timelineFilter !== 'all') {
        if (timelineFilter === 'retroativa') {
            vacations = vacations.filter(v => v.status.includes('Retroativo') || v.status.includes('Histórico'));
        } else {
            vacations = vacations.filter(v => v.status === timelineFilter);
        }
    }

    vacations.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));

    if (vacations.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <p class="text-xs font-bold uppercase">Nenhum registro para este filtro</p>
            </div>
        `;
        return;
    }

    container.innerHTML = vacations.map(vac => {
        const statusClass = getStatusClass(vac.status);
        const startStr = DateFixer.formatarDataParaExibicao(vac.start_date);
        const endStr = DateFixer.formatarDataParaExibicao(vac.end_date);
        const returnStr = DateFixer.formatarDataParaExibicao(vac.return_date);
        
        const days = parseInt(vac.days_taken) || 0;
        const abono = parseInt(vac.abono_days) || 0;
        const isRetro = vac.status.includes('Retroativo') || vac.status.includes('Histórico');
        
        return `
            <div class="relative animate-fade-in group">
                <div class="absolute -left-[31px] top-4 w-4 h-4 rounded-full border-4 border-white shadow ${statusClass.dot}"></div>
                
                <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all hover:border-nordeste-red/30">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <span class="text-[10px] font-black text-gray-400 uppercase tracking-wider">${startStr} → ${endStr}</span>
                            <p class="text-lg font-black text-gray-800 italic">${days} dias de gozo${abono > 0 ? ` (${abono} abono)` : ''}</p>
                        </div>
                        <div class="flex items-center gap-2">
                            ${isRetro ? '<span class="text-xs">🕰️</span>' : ''}
                            <span class="px-3 py-1 rounded-lg text-[8px] font-black uppercase ${statusClass.badge}">${vac.status}</span>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-3 gap-3 text-xs mb-3">
                        <div class="bg-gray-50 p-2 rounded-lg">
                            <p class="text-[8px] text-gray-400 uppercase">Retorno</p>
                            <p class="font-bold text-gray-700">${returnStr}</p>
                        </div>
                        ${abono > 0 ? `
                        <div class="bg-amber-50 p-2 rounded-lg">
                            <p class="text-[8px] text-amber-500 uppercase">Abono</p>
                            <p class="font-bold text-amber-600">${abono} dias</p>
                        </div>
                        ` : ''}
                        <div class="bg-blue-50 p-2 rounded-lg">
                            <p class="text-[8px] text-blue-400 uppercase">Responsável</p>
                            <p class="font-bold text-gray-600">${vac.responsible || 'Sistema'}</p>
                        </div>
                    </div>
                    
                    ${vac.motivo ? `<p class="text-[10px] text-gray-500 mb-1"><span class="font-black">🎯</span> ${vac.motivo}</p>` : ''}
                    ${vac.substituto ? `<p class="text-[10px] text-gray-500 mb-1"><span class="font-black">👤</span> Substituído: ${vac.substituto}</p>` : ''}
                    ${vac.observation ? `<p class="text-[10px] text-gray-500 mt-2 italic border-t border-gray-100 pt-2">${vac.observation}</p>` : ''}
                    
                    <!-- CRUD Actions -->
                    <div class="flex gap-2 mt-4 pt-3 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="editVacation('${vac.id}')" class="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-[9px] font-black uppercase flex items-center justify-center gap-1">
                            ✏️ Editar
                        </button>
                        <button onclick="toggleVacationStatus('${vac.id}')" class="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-[9px] font-black uppercase flex items-center justify-center gap-1">
                            ${vac.status === 'Planejada' ? '✅ Agendar' : vac.status === 'Agendada' ? '✓ Confirmar' : '🔄 Status'}
                        </button>
                        <button onclick="deleteVacationConfirm('${vac.id}')" class="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[9px] font-black uppercase">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function getStatusClass(status) {
    if (status === 'Concluída') return { dot: 'bg-green-500', badge: 'bg-green-100 text-green-700' };
    if (status === 'Agendada') return { dot: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700' };
    if (status === 'Planejada') return { dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700' };
    if (status.includes('Retroativo') || status.includes('Histórico')) return { dot: 'bg-purple-500', badge: 'bg-purple-100 text-purple-700' };
    return { dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-600' };
}

window.setTimelineFilter = (filter, btn) => {
    timelineFilter = filter;
    document.querySelectorAll('.dossier-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderTimeline();
};

// === MODAL CRUD ===

window.openNewVacationModal = () => {
    if (!selectedEmployeeId) return alert("Selecione um colaborador primeiro.");
    openVacationModal(null);
};

window.openVacationModal = (vac) => {
    const modal = document.getElementById('vacation-modal');
    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');
    const btnDelete = document.getElementById('btn-delete');
    
    if (vac) {
        title.innerText = "Editar Ausência";
        subtitle.innerText = "Atualize os dados do registro";
        btnDelete.classList.remove('hidden');
        
        document.getElementById('vac-id').value = vac.id;
        document.getElementById('vac-start').value = vac.start_date;
        document.getElementById('vac-end').value = vac.end_date || '';
        document.getElementById('vac-days').value = vac.days_taken;
        document.getElementById('vac-type').value = vac.type || 'Férias';
        document.getElementById('vac-abono').value = vac.abono_days || 0;
        document.getElementById('vac-obs').value = vac.observation || '';
        // Preenche data de retorno
        document.getElementById('vac-return-date').value = vac.return_date || '';
    } else {
        title.innerText = "Nova Ausência";
        subtitle.innerText = "Preencha os dados do período";
        btnDelete.classList.add('hidden');
        
        document.getElementById('vac-id').value = '';
        document.getElementById('vac-start').value = '';
        document.getElementById('vac-end').value = '';
        document.getElementById('vac-days').value = '30';
        document.getElementById('vac-type').value = 'Férias';
        document.getElementById('vac-abono').value = '0';
        document.getElementById('vac-obs').value = '';
        document.getElementById('vac-return-date').value = '';
    }
    
    window.calcDaysFromPeriod();
    modal.classList.remove('hidden');
};

window.closeVacationModal = () => {
    document.getElementById('vacation-modal').classList.add('hidden');
};

window.editVacation = (id) => {
    const vac = (vacationData.allVacations || []).find(v => v.id === id);
    if (vac) openVacationModal(vac);
};

// Quando qualquer data do período muda
window.onPeriodChange = () => {
    window.calcDaysFromPeriod();
};

// Calcula dias de gozo baseado nas datas de início e fim
window.calcDaysFromPeriod = () => {
    const startVal = document.getElementById('vac-start').value;
    const endVal = document.getElementById('vac-end').value;
    const returnVal = document.getElementById('vac-return-date').value;
    const daysInput = document.getElementById('vac-days');
    
    // Se tem início e fim, calcula os dias
    if (startVal && endVal) {
        const start = new Date(startVal);
        const end = new Date(endVal);
        const diffTime = end - start;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir o último dia
        
        if (diffDays > 0) {
            daysInput.value = diffDays;
        }
    }
    
    // Se tem início e dias mas não tem fim, calcula o fim
    if (startVal && daysInput.value && !endVal) {
        const start = new Date(startVal);
        const days = parseInt(daysInput.value) || 30;
        const endDate = new Date(start.getTime() + (days - 1) * 24 * 60 * 60 * 1000);
        document.getElementById('vac-end').value = endDate.toISOString().split('T')[0];
    }
    
    // Se tem início e dias mas não tem retorno, calcula o retorno (dia útil após o fim)
    if (startVal && daysInput.value && !returnVal) {
        const result = calculateVacationDates(startVal, parseInt(daysInput.value));
        document.getElementById('vac-return-date').value = result.returnDate.toISOString().split('T')[0];
    }
};

window.submitVacation = async () => {
    const id = document.getElementById('vac-id').value;
    const start = document.getElementById('vac-start').value;
    const end = document.getElementById('vac-end').value;
    const returnDate = document.getElementById('vac-return-date').value;
    const days = parseInt(document.getElementById('vac-days').value);
    const type = document.getElementById('vac-type').value;
    const abono = parseInt(document.getElementById('vac-abono').value) || 0;
    const obs = document.getElementById('vac-obs').value;

    if (!start || !end || !returnDate) return alert("Preencha as 3 datas: início, fim e retorno.");
    if (!days || days < 1) return alert("Dias de gozo inválidos.");

    // Lógica de Retroativo Automático
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(start + 'T00:00:00');
    const isRetroactive = startDate < today;
    
    let status = 'Planejada';
    if (isRetroactive) {
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + days - 1);
        if (endDate < today) {
            status = 'Retroativo';
        }
    }

    // Payload com as 3 datas editáveis
    const payload = {
        employee_id: selectedEmployeeId,
        start_date: start,
        end_date: end,
        return_date: returnDate,
        days_taken: days,
        abono_days: abono,
        observation: obs,
        responsible: 'Admin',
        status: id ? undefined : status
    };

    const url = id ? `/api/vacations/${id}` : '/api/vacations/schedule';
    const method = id ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert(id ? "✓ Registro atualizado!" : (isRetroactive ? "✓ Registro retroativo salvo!" : "✓ Ausência registrada!"));
            closeVacationModal();
            await loadDataFromServer();
            selectEmployee(selectedEmployeeId);
        } else {
            const err = await res.json();
            alert("Erro: " + (err.error || 'Desconhecido'));
        }
    } catch (e) {
        alert("Erro de conexão.");
    }
};

window.deleteVacation = async () => {
    const id = document.getElementById('vac-id').value;
    if (!id) return;
    
    if (!confirm("Tem certeza que deseja EXCLUIR este registro?")) return;
    
    try {
        const res = await fetch(`/api/vacations/${id}`, { method: 'DELETE' });
        if (res.ok) {
            alert("Registro excluído!");
            closeVacationModal();
            await loadDataFromServer();
            selectEmployee(selectedEmployeeId);
        } else {
            alert("Erro ao excluir.");
        }
    } catch (e) {
        alert("Erro de conexão.");
    }
};

window.deleteVacationConfirm = (id) => {
    document.getElementById('vac-id').value = id;
    if (confirm("Excluir este registro de ausência?")) {
        deleteVacation();
    }
};

window.toggleVacationStatus = async (id) => {
    const vac = (vacationData.allVacations || []).find(v => v.id === id);
    if (!vac) return;
    
    let newStatus = vac.status;
    if (vac.status === 'Planejada') newStatus = 'Agendada';
    else if (vac.status === 'Agendada') newStatus = 'Concluída';
    else newStatus = 'Concluída';
    
    try {
        const res = await fetch(`/api/vacations/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (res.ok) {
            await loadDataFromServer();
            selectEmployee(selectedEmployeeId);
        }
    } catch (e) {
        alert("Erro ao atualizar status.");
    }
};

window.calculateVacationDates = (startVal, days) => {
    const startDate = new Date(startVal + 'T00:00:00');
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + (days - 1));

    const returnDay = new Date(endDate);
    returnDay.setDate(returnDay.getDate() + 1);

    while (returnDay.getDay() === 0 || returnDay.getDay() === 6) {
        returnDay.setDate(returnDay.getDate() + 1);
    }
    return { endDate, returnDate: returnDay };
};

window.loadDataFromServer = loadDataFromServer;