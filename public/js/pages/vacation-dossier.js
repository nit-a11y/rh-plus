import { DateFixer } from '../../date-fixer.js';

let dossierData = { employees: [], vacations: [] };
let currentEmployeeId = null;
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
    loadDataFromServer();
    setupEventListeners();
});

async function loadDataFromServer() {
    try {
        const res = await fetch(`/api/vacations/dossier-data?t=${Date.now()}`);
        if (!res.ok) throw new Error("Erro na rede");
        dossierData = await res.json();
        renderEmployeeList();
    } catch (e) {
        console.error("Erro ao carregar dados:", e);
    }
}

function setupEventListeners() {
    // Busca na sidebar
    const searchInput = document.getElementById('dossier-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderEmployeeList(e.target.value);
        });
    }

    // Filtros de timeline
    document.querySelectorAll('.dossier-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.dossier-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTimeline();
        });
    });
}

function renderEmployeeList(searchTerm = '') {
    const list = document.getElementById('dossier-employee-list');
    if (!list) return;

    let employees = dossierData.employees || [];
    
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        employees = employees.filter(e => 
            e.name.toLowerCase().includes(term) || 
            (e.reg || '').toLowerCase().includes(term) ||
            (e.sector || '').toLowerCase().includes(term)
        );
    }

    if (employees.length === 0) {
        list.innerHTML = `
            <div class="text-center py-8 text-gray-500 text-xs font-bold uppercase">
                Nenhum colaborador encontrado
            </div>
        `;
        return;
    }

    list.innerHTML = employees.map(emp => {
        const empVacations = (dossierData.vacations || []).filter(v => v.employee_id === emp.id);
        const lastVac = empVacations.find(v => v.status === 'Concluída' || v.status === 'Em Gozo');
        const badge = getEmployeeBadge(empVacations);
        
        return `
            <div onclick="selectEmployee('${emp.id}')" 
                 class="dossier-employee-item ${currentEmployeeId === emp.id ? 'active' : ''}"
                 data-emp-id="${emp.id}">
                <div class="flex items-center gap-3">
                    <img src="${emp.photoUrl}" class="emp-avatar">
                    <div class="min-w-0 flex-1">
                        <p class="emp-name truncate">${emp.name}</p>
                        <p class="emp-meta">${emp.reg || '---'} • ${emp.sector}</p>
                        <span class="emp-badge" style="background: ${badge.bg}; color: ${badge.color}">${badge.text}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function getEmployeeBadge(vacations) {
    if (!vacations || vacations.length === 0) {
        return { bg: '#f1f5f9', color: '#64748b', text: 'Sem histórico' };
    }
    
    const hasPlanned = vacations.some(v => v.status === 'Planejada' || v.status === 'Agendada');
    const lastVac = vacations.find(v => v.status === 'Em Gozo');
    
    if (lastVac) {
        return { bg: '#dbeafe', color: '#1e40af', text: 'Em Gozo' };
    } else if (hasPlanned) {
        return { bg: '#fef3c7', color: '#b45309', text: 'Agendado' };
    } else {
        return { bg: '#dcfce7', color: '#15803d', text: 'Regular' };
    }
}

window.selectEmployee = (id) => {
    currentEmployeeId = id;
    const emp = dossierData.employees.find(e => e.id === id);
    if (!emp) return;

    document.getElementById('dossier-empty').classList.add('hidden');
    document.getElementById('dossier-view').classList.remove('hidden');

    document.getElementById('dossier-avatar').src = emp.photoUrl;
    document.getElementById('dossier-name').innerText = emp.name;
    document.getElementById('dossier-meta').innerText = `${emp.reg || '---'} • ${emp.sector} • Admissão: ${DateFixer.formatarDataParaExibicao(emp.admissionDate)}`;

    renderStats(emp);
    renderTimeline();
    
    // Atualiza lista visual
    document.querySelectorAll('.dossier-employee-item').forEach(item => {
        item.classList.toggle('active', item.dataset.empId === id);
    });
};

function renderStats(emp) {
    const empVacations = (dossierData.vacations || []).filter(v => v.employee_id === emp.id);
    
    const total = empVacations.length;
    const totalDays = empVacations.reduce((sum, v) => sum + (parseInt(v.days_taken) || 0), 0);
    const totalAbonos = empVacations.reduce((sum, v) => sum + (parseInt(v.abono_days) || 0), 0);
    
    const lastVac = empVacations.sort((a, b) => new Date(b.start_date) - new Date(a.start_date))[0];
    const lastDate = lastVac ? DateFixer.formatarDataParaExibicao(lastVac.return_date) : '--';

    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-days').innerText = totalDays;
    document.getElementById('stat-abonos').innerText = totalAbonos;
    document.getElementById('stat-last').innerText = lastDate;

    // Gerar narrativa do ciclo anual
    const currentYear = new Date().getFullYear();
    const yearVacations = empVacations.filter(v => v.start_date && v.start_date.startsWith(currentYear.toString()));
    
    if (yearVacations.length > 0) {
        const yearDays = yearVacations.reduce((sum, v) => sum + (parseInt(v.days_taken) || 0), 0);
        const yearAbonos = yearVacations.reduce((sum, v) => sum + (parseInt(v.abono_days) || 0), 0);
        const motivos = [...new Set(yearVacations.map(v => v.motivo).filter(m => m))];
        
        // Adicionar narrativa se ainda não existir
        let narrativeEl = document.getElementById('dossier-narrative');
        if (!narrativeEl) {
            const view = document.getElementById('dossier-view');
            const statsSection = view.querySelector('.dossier-stats');
            narrativeEl = document.createElement('div');
            narrativeEl.id = 'dossier-narrative';
            narrativeEl.className = 'mt-6 bg-gradient-to-r from-nordeste-black to-gray-800 text-white p-5 rounded-2xl';
            statsSection.after(narrativeEl);
        }
        
        const motivoText = motivos.length > 0 ? motivos.join(', ') : 'Férias';
        narrativeEl.innerHTML = `
            <div class="flex items-start gap-4">
                <div class="text-2xl">📖</div>
                <div>
                    <h4 class="text-xs font-black uppercase text-gray-300 mb-1">Narrativa do Ciclo ${currentYear}</h4>
                    <p class="text-sm font-bold leading-relaxed">
                        <span class="text-nordeste-red">${emp.name}</span> registrou 
                        <span class="text-white font-black">${yearVacations.length} período(s)</span> de ausência neste ano, 
                        totalizando <span class="text-white font-black">${yearDays} dias</span> de gozo e 
                        <span class="text-amber-400 font-black">${yearAbonos} dias</span> de abono pecuniário.
                        ${motivoText !== 'Férias' ? `<br><span class="text-gray-400 text-xs">Motivos identificados: ${motivoText}</span>` : ''}
                    </p>
                </div>
            </div>
        `;
    }
}

function renderTimeline() {
    const container = document.getElementById('dossier-timeline');
    if (!container || !currentEmployeeId) return;

    let vacations = (dossierData.vacations || []).filter(v => v.employee_id === currentEmployeeId);
    
    // Aplicar filtro
    if (currentFilter !== 'all') {
        if (currentFilter === 'retroativa') {
            vacations = vacations.filter(v => v.status.includes('Retroativo') || v.status.includes('Histórico'));
        } else {
            vacations = vacations.filter(v => v.status === currentFilter);
        }
    }

    // Ordenar por data (mais recente primeiro)
    vacations.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));

    if (vacations.length === 0) {
        container.innerHTML = `
            <div class="dossier-empty" style="padding: 2rem;">
                <p class="text-xs font-bold">Nenhum registro encontrado para este filtro.</p>
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
        
        return `
            <div class="dossier-timeline-item ${statusClass}">
                <div class="dossier-timeline-header">
                    <div class="dossier-timeline-dates">
                        ${startStr} <span>→</span> ${endStr}
                    </div>
                    <span class="dossier-timeline-badge badge-${statusClass.replace('status-', '')}">${vac.status}</span>
                </div>
                
                <div class="dossier-timeline-details">
                    <div class="dossier-timeline-detail">
                        <strong>Dias Gozo</strong>
                        <span>${days} dias</span>
                    </div>
                    <div class="dossier-timeline-detail">
                        <strong>Abono (Venda)</strong>
                        <span>${abono} dias</span>
                    </div>
                    <div class="dossier-timeline-detail">
                        <strong>Retorno</strong>
                        <span>${returnStr}</span>
                    </div>
                </div>
                
                ${vac.motivo ? `
                <div class="dossier-timeline-obs">
                    <strong>🎯 Objetivo:</strong> ${vac.motivo}
                </div>
                ` : ''}
                
                ${vac.substituto ? `
                <div class="dossier-timeline-obs">
                    <strong>👤 Substituído por:</strong> ${vac.substituto}
                </div>
                ` : ''}
                
                ${vac.observation ? `
                <div class="dossier-timeline-obs">
                    <strong>📝 Observações:</strong> ${vac.observation}
                </div>
                ` : ''}
                
                <div class="dossier-timeline-obs" style="background: #f8fafc;">
                    <strong>📋 Responsável:</strong> ${vac.responsible || 'Sistema'}
                </div>
            </div>
        `;
    }).join('');
}

function getStatusClass(status) {
    if (status === 'Concluída') return 'status-concluida';
    if (status === 'Agendada') return 'status-agendada';
    if (status === 'Planejada') return 'status-planejada';
    if (status.includes('Retroativo') || status.includes('Histórico')) return 'status-retroativa';
    return 'status-concluida';
}

// ========== MODAL FUNCTIONS ==========

window.openDossierModal = () => {
    if (!currentEmployeeId) return alert("Selecione um colaborador primeiro.");
    
    // Reset form
    document.getElementById('new-start').value = '';
    document.getElementById('new-days').value = '30';
    document.getElementById('new-type').value = 'Férias';
    document.getElementById('new-abono').value = '0';
    document.getElementById('new-responsible').value = '';
    document.getElementById('new-motivo').value = '';
    document.getElementById('new-substituto').value = '';
    document.getElementById('new-obs').value = '';
    document.getElementById('new-return-preview').value = '';
    
    document.getElementById('dossier-modal').classList.add('active');
};

window.closeDossierModal = () => {
    document.getElementById('dossier-modal').classList.remove('active');
};

window.calcNewReturn = () => {
    const startVal = document.getElementById('new-start').value;
    const days = parseInt(document.getElementById('new-days').value) || 0;
    
    if (startVal && days > 0) {
        const result = calculateVacationDates(startVal, days);
        document.getElementById('new-return-preview').value = DateFixer.formatarDataParaExibicao(result.returnDate.toISOString().split('T')[0]);
    } else {
        document.getElementById('new-return-preview').value = '';
    }
};

window.submitNewRecord = async () => {
    const start = document.getElementById('new-start').value;
    const days = parseInt(document.getElementById('new-days').value);
    const abono = parseInt(document.getElementById('new-abono').value) || 0;
    const motivo = document.getElementById('new-motivo').value;
    const substituto = document.getElementById('new-substituto').value;
    const obs = document.getElementById('new-obs').value;
    const responsible = document.getElementById('new-responsible').value || 'Admin';

    if (!start || !days) return alert("Preencha data de início e dias.");

    const payload = {
        employee_id: currentEmployeeId,
        start_date: start,
        days_taken: days,
        abono_days: abono,
        motivo: motivo,
        substituto: substituto,
        observation: obs,
        responsible: responsible,
        is_planning: false
    };

    try {
        const res = await fetch('/api/vacations/schedule-rich', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert("✓ Registro salvo com sucesso!");
            closeDossierModal();
            await loadDataFromServer();
            selectEmployee(currentEmployeeId);
        } else {
            const err = await res.json();
            alert("Erro: " + err.error);
        }
    } catch (e) {
        alert("Erro de conexão.");
    }
};

// ========== RETRO MODAL ==========

window.openRetroModal = () => {
    if (!currentEmployeeId) return alert("Selecione um colaborador primeiro.");
    
    document.getElementById('retro-start').value = '';
    document.getElementById('retro-days').value = '30';
    document.getElementById('retro-type').value = 'Férias';
    document.getElementById('retro-abono').value = '0';
    document.getElementById('retro-justificativa').value = '';
    document.getElementById('retro-responsible').value = '';
    document.getElementById('retro-end-preview').value = '';
    
    document.getElementById('retro-modal').classList.add('active');
};

window.closeRetroModal = () => {
    document.getElementById('retro-modal').classList.remove('active');
};

window.calcRetroReturn = () => {
    const startVal = document.getElementById('retro-start').value;
    const days = parseInt(document.getElementById('retro-days').value) || 0;
    
    if (startVal && days > 0) {
        const result = calculateVacationDates(startVal, days);
        document.getElementById('retro-end-preview').value = DateFixer.formatarDataParaExibicao(result.endDate.toISOString().split('T')[0]);
    } else {
        document.getElementById('retro-end-preview').value = '';
    }
};

window.submitRetro = async () => {
    const start = document.getElementById('retro-start').value;
    const days = parseInt(document.getElementById('retro-days').value);
    const abono = parseInt(document.getElementById('retro-abono').value) || 0;
    const justificativa = document.getElementById('retro-justificativa').value;
    const responsible = document.getElementById('retro-responsible').value || 'Admin';

    if (!start || !days) return alert("Preencha data e dias.");
    if (!justificativa) return alert("Informe a justificativa do registro retroativo.");

    const payload = {
        employee_id: currentEmployeeId,
        start_date: start,
        days_taken: days,
        abono_days: abono,
        observation: `[RETROATIVO] ${justificativa}`,
        responsible: responsible
    };

    try {
        const res = await fetch('/api/vacations/retroactive-rich', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert("✓ Registro histórico gravado!");
            closeRetroModal();
            await loadDataFromServer();
            selectEmployee(currentEmployeeId);
        } else {
            const err = await res.json();
            alert("Erro: " + err.error);
        }
    } catch (e) {
        alert("Erro de conexão.");
    }
};

// ========== UTILITIES ==========

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

window.switchVacView = (view) => {
    if (view === 'new-record') {
        if (!currentEmployeeId) {
            alert("Selecione um colaborador na sidebar primeiro.");
            return;
        }
        openDossierModal();
    }
};

window.loadDataFromServer = loadDataFromServer;