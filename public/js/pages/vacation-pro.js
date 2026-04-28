import { DateFixer } from '../date-fixer.js';

let vacationData = { employees: [], stats: {}, allVacations: [] };
let selectedMassSector = null;

document.addEventListener('DOMContentLoaded', () => {
    init();
});

async function init() {
    await loadDataFromServer();
    populateRetroSelect();
    // Se houver listeners específicos que não sejam onclick no HTML, adicione aqui
}

window.refreshData = async () => {
    await loadDataFromServer();
}

async function loadDataFromServer() {
    try {
        const res = await fetch(`/api/vacations/summary?t=${Date.now()}`);
        if (!res.ok) throw new Error("Erro na rede");
        vacationData = await res.json();

        updateDashboardKPIs();
        populateFilters();
        renderCards();
        renderMassPlanningSectors();
    } catch (e) { console.error("Erro ao carregar dados:", e); }
}

function updateDashboardKPIs() {
    const s = vacationData.stats;
    // Main KPIs
    const elRiskNow = document.getElementById('stat-risk-now');
    const elRiskFut = document.getElementById('stat-risk-future');
    const elPlanned = document.getElementById('stat-planned');
    const elActive = document.getElementById('stat-active-now');
    const elCov = document.getElementById('stat-coverage');
    const elMiniPlan = document.getElementById('mini-planned');
    const elMiniAct = document.getElementById('mini-active');

    if (elRiskNow) elRiskNow.innerText = s.risk_now || 0;
    if (elRiskFut) elRiskFut.innerText = s.risk_future || 0;
    if (elPlanned) elPlanned.innerText = s.planned || 0;
    if (elActive) elActive.innerText = s.active || 0;

    // Coverage logic
    const totalEmp = vacationData.employees.length || 1;
    const coverage = 100 - Math.round((s.active / totalEmp) * 100);
    if (elCov) elCov.innerText = `${coverage}%`;

    // Mini Header Stats
    if (elMiniPlan) elMiniPlan.innerText = s.planned || 0;
    if (elMiniAct) elMiniAct.innerText = s.active || 0;
}

function populateFilters() {
    const sectorSel = document.getElementById('filter-sector');
    if (!sectorSel) return;

    // Salva seleção atual se houver re-render
    const currentVal = sectorSel.value;

    const sectors = [...new Set(vacationData.employees.map(e => e.sector))].sort();

    let html = '<option value="all">🏢 Todos Setores</option>';
    sectors.forEach(sec => {
        html += `<option value="${sec}">${sec}</option>`;
    });
    sectorSel.innerHTML = html;

    // Restaura valor se ainda existir
    if (sectors.includes(currentVal)) sectorSel.value = currentVal;
}

// --- NAVEGAÇÃO ENTRE TELAS ---
window.switchVacView = (viewId) => {
    document.querySelectorAll('.vac-nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('section[id^="view-"]').forEach(s => s.classList.add('hidden'));

    if (viewId === 'dashboard') {
        const nav = document.getElementById('nav-dashboard');
        const view = document.getElementById('view-dashboard');
        if (nav) nav.classList.add('active');
        if (view) view.classList.remove('hidden');
    } else if (viewId === 'mass-planning') {
        const nav = document.getElementById('nav-mass');
        const view = document.getElementById('view-mass-planning');
        if (nav) nav.classList.add('active');
        if (view) view.classList.remove('hidden');
    } else if (viewId === 'retro') {
        const nav = document.getElementById('nav-retro');
        const view = document.getElementById('view-retro');
        if (nav) nav.classList.add('active');
        if (view) view.classList.remove('hidden');
        populateRetroSelect();
    }
};

// --- REGISTRO RETROATIVO ---
function populateRetroSelect() {
    const sel = document.getElementById('retro-emp-select');
    if (!sel || !vacationData.employees) return;

    // Ordenar alfabeticamente
    const list = [...vacationData.employees].sort((a, b) => a.name.localeCompare(b.name));

    sel.innerHTML = '<option value="">SELECIONE UM COLABORADOR...</option>' +
        list.map(e => `<option value="${e.id}">${e.name.toUpperCase()} (${e.reg})</option>`).join('');
}

window.calcRetroReturn = () => {
    const startVal = document.getElementById('retro-start').value;
    const days = parseInt(document.getElementById('retro-days').value) || 0;

    if (startVal && days > 0) {
        const startDate = new Date(startVal + 'T00:00:00');
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + (days - 1));
        document.getElementById('retro-end-preview').value = endDate.toLocaleDateString('pt-BR');
    } else {
        document.getElementById('retro-end-preview').value = '--/--/----';
    }
};

window.submitRetroVacation = async () => {
    const empId = document.getElementById('retro-emp-select').value;
    const start = document.getElementById('retro-start').value;
    const days = document.getElementById('retro-days').value;
    const abono = document.getElementById('retro-abono').value;
    const obs = document.getElementById('retro-obs').value;

    if (!empId || !start || !days) return alert("Preencha colaborador, data de início e dias.");

    // Validação CLT (mesmo retroativo)
    if (parseInt(days) + parseInt(abono) > 30) return alert("A soma de dias gozados + abono não pode exceder 30 dias.");

    const payload = {
        employee_id: empId,
        start_date: start,
        days_taken: parseInt(days),
        abono_days: parseInt(abono),
        observation: obs,
        responsible: (typeof Auth !== 'undefined') ? Auth.getUser()?.name : 'Admin (Retro)'
    };

    if (!confirm("CONFIRMA A REGULARIZAÇÃO?\n\nEste registro será inserido como histórico passado e não poderá ser alterado.")) return;

    try {
        const res = await fetch('/api/vacations/retroactive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert("Registro histórico gravado com sucesso!");
            // Limpa form
            document.getElementById('retro-obs').value = '';
            document.getElementById('retro-start').value = '';
            document.getElementById('retro-end-preview').value = '--/--/----';
            await loadDataFromServer();
        } else {
            const err = await res.json();
            alert("Erro: " + err.error);
        }
    } catch (e) {
        alert("Erro de conexão ao salvar.");
    }
};

// --- RENDERIZAÇÃO DOS CARDS (COM PESQUISA) ---
window.renderCards = () => {
    const grid = document.getElementById('vac-grid');
    if (!grid) return;

    // Debounce simples para busca
    const searchInput = document.getElementById('vac-search');
    if (searchInput && !searchInput.dataset.hasListener) {
        searchInput.dataset.hasListener = "true";
        let timeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => renderCards(), 400);
        });
    }

    // Captura e sanitiza o termo de busca
    const search = searchInput ? searchInput.value.toLowerCase().trim() : '';

    const sectorFilterEl = document.getElementById('filter-sector');
    const sectorFilter = sectorFilterEl ? sectorFilterEl.value : 'all';

    const statusFilterEl = document.getElementById('filter-status');
    const statusFilter = statusFilterEl ? statusFilterEl.value : 'all';

    const filtered = vacationData.employees.filter(e => {
        // Prepara dados para busca segura (evita erro em nulos)
        const name = (e.name || '').toLowerCase();
        const sector = (e.sector || '').toLowerCase();
        const reg = (e.reg || e.registrationNumber || '').toString().toLowerCase();

        // Lógica de Busca
        const matchesSearch = !search ||
            name.includes(search) ||
            reg.includes(search) ||
            sector.includes(search);

        const matchesSector = sectorFilter === 'all' || e.sector === sectorFilter;
        let matchesStatus = statusFilter === 'all' || e.legalStatus === statusFilter;

        // Regra especial para filtro "Com Agendamento"
        if (statusFilter === 'has_schedule') {
            matchesStatus = e.history.some(v => v.status === 'Agendada' || v.status === 'Planejada');
        }

        return matchesSearch && matchesSector && matchesStatus;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="col-span-full py-12 text-center text-gray-400 italic font-bold">Nenhum registro encontrado para "${search}".</div>`;
        return;
    }

    grid.innerHTML = filtered.map(e => {
        const plannedVac = e.history.find(v => v.status === 'Planejada');
        const plannedText = plannedVac ? `Planejado: ${DateFixer.formatarDataParaExibicao(plannedVac.start_date)}` : 'Sem planejamento';
        const limitDateStr = e.cltMetrics && e.cltMetrics.limitDate ? DateFixer.formatarDataParaExibicao(e.cltMetrics.limitDate) : '-';

        return `
        <div class="vac-card border-t-4 border-${getStatusColor(e.colorClass)} animate-fade-in relative group">
            <div class="flex justify-between items-start mb-4">
                <div class="flex items-center gap-3">
                    <img src="${e.photoUrl}" class="w-10 h-10 rounded-xl object-cover border border-gray-100">
                    <div class="min-w-0">
                        <h4 class="font-black text-gray-800 uppercase text-xs truncate w-32" title="${e.name}">${e.name}</h4>
                        <p class="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                            ${e.reg || e.registrationNumber || ''} • ${e.sector}
                        </p>
                    </div>
                </div>
                <div class="vac-status-pill bg-${e.colorClass} text-${e.colorClass}-dark">${e.legalStatus}</div>
            </div>
            
            <div class="bg-gray-50 p-3 rounded-xl border border-gray-100 mb-4 space-y-1">
                <div class="flex justify-between items-center">
                    <span class="text-[8px] font-bold text-gray-400 uppercase">Limite Legal</span>
                    <span class="text-[9px] font-black text-gray-700">${limitDateStr}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-[8px] font-bold text-gray-400 uppercase">Status Futuro</span>
                    <span class="text-[9px] font-bold ${plannedVac ? 'text-amber-600' : 'text-gray-400'}">${plannedText}</span>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-2">
                ${plannedVac ?
                `<button onclick="confirmVacation('${plannedVac.id}')" class="btn-vac-primary bg-green-600">Confirmar</button>
                     <button onclick="cancelVacation('${plannedVac.id}')" class="btn-vac-secondary text-red-500 hover:bg-red-50">Cancelar</button>`
                :
                `<button onclick="openVacModal('${e.id}')" class="btn-vac-primary bg-nordeste-black col-span-2">Agendar / Planejar</button>`
            }
            </div>
        </div>
        `;
    }).join('');
};

function getStatusColor(colorClass) {
    if (colorClass === 'vencido') return 'red-500';
    if (colorClass === 'alerta') return 'amber-500';
    if (colorClass === 'planejada') return 'yellow-400';
    if (colorClass === 'emdia') return 'green-500';
    if (colorClass === 'info') return 'blue-500';
    return 'gray-400';
}

// --- MASS PLANNING LOGIC (ATUALIZADA) ---

function renderMassPlanningSectors() {
    const list = document.getElementById('mass-sector-list');
    if (!list) return;

    const sectors = [...new Set(vacationData.employees.map(e => e.sector))].sort();

    list.innerHTML = sectors.map(sec => {
        const count = vacationData.employees.filter(e => e.sector === sec).length;
        return `
            <div onclick="selectMassSector('${sec}', this)" class="p-3 bg-white rounded-xl border border-gray-100 cursor-pointer hover:border-nordeste-red transition-all flex justify-between items-center group mass-sector-item">
                <span class="text-[10px] font-black text-gray-600 uppercase group-hover:text-nordeste-red">${sec}</span>
                <span class="bg-gray-100 text-gray-500 text-[8px] font-bold px-2 py-1 rounded-lg">${count}</span>
            </div>
        `;
    }).join('');
}

window.selectMassSector = (sector, el) => {
    selectedMassSector = sector;

    // Highlight visual
    document.querySelectorAll('.mass-sector-item').forEach(i => i.classList.remove('border-nordeste-red', 'bg-red-50'));
    if (el) el.classList.add('border-nordeste-red', 'bg-red-50');

    const grid = document.getElementById('mass-employee-grid');
    const emps = vacationData.employees.filter(e => e.sector === sector && e.type !== 'Desligado');

    grid.innerHTML = emps.map(e => {
        const limit = e.cltMetrics && e.cltMetrics.limitDate ? new Date(e.cltMetrics.limitDate).toLocaleDateString('pt-BR') : '-';
        const hasVacation = e.legalStatus === 'Em Gozo' || e.legalStatus === 'Planejada';

        return `
            <div class="flex flex-col p-5 bg-gray-50 border border-gray-200 rounded-2xl transition-all hover:shadow-md ${hasVacation ? 'opacity-60 grayscale' : ''}">
                <!-- Header Card -->
                <div class="flex justify-between items-start mb-4 border-b border-gray-200 pb-3">
                    <div class="flex items-center gap-3">
                        <img src="${e.photoUrl}" class="w-10 h-10 rounded-full border-2 border-white object-cover">
                        <div>
                            <p class="text-xs font-black text-gray-800 uppercase">${e.name}</p>
                            <p class="text-[9px] text-gray-400 font-bold uppercase">Limite: ${limit}</p>
                        </div>
                    </div>
                    <span class="px-2 py-1 rounded-lg text-[8px] font-black uppercase bg-${e.colorClass} text-${e.colorClass}-dark">${e.legalStatus}</span>
                </div>

                <!-- Inputs Grid -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
                    <div>
                        <label class="pro-label">Data Início</label>
                        <input type="date" id="mass-start-${e.id}" class="pro-input bg-white" onchange="window.updateRowPreview('${e.id}')" ${hasVacation ? 'disabled' : ''}>
                    </div>
                    <div>
                        <label class="pro-label">Dias Gozo</label>
                        <input type="number" id="mass-gozo-${e.id}" class="pro-input bg-white" value="30" min="5" max="30" oninput="window.updateRowPreview('${e.id}')" ${hasVacation ? 'disabled' : ''}>
                    </div>
                    <div class="hidden">
                        <label class="pro-label">Vender (Abono)</label>
                        <input type="number" id="mass-abono-${e.id}" value="0">
                    </div>
                    <div class="bg-white p-2 rounded-lg border border-gray-100 text-center">
                        <span class="block text-[8px] font-bold text-gray-400 uppercase">Retorno (Dia Útil)</span>
                        <span id="mass-return-${e.id}" class="block text-xs font-black text-nordeste-red mt-1">--/--</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
};

window.updateRowPreview = (id) => {
    const startVal = document.getElementById(`mass-start-${id}`).value;
    const days = parseInt(document.getElementById(`mass-gozo-${id}`).value) || 0;
    const returnEl = document.getElementById(`mass-return-${id}`);

    if (startVal && days > 0) {
        const result = window.calculateVacationDates(startVal, days);
        if (returnEl) returnEl.innerText = DateFixer.formatarDataParaExibicao(result.returnDate.toISOString().split('T')[0]);
    } else {
        if (returnEl) returnEl.innerText = '--/--';
    }
};

window.calculateVacationDates = (startVal, days) => {
    const startDate = new Date(startVal + 'T00:00:00');
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + (days - 1)); // Fim do período de descanso

    const returnDay = new Date(endDate);
    returnDay.setDate(returnDay.getDate() + 1); // Dia seguinte

    // Lógica simples de dia útil (pula fins de semana)
    while (returnDay.getDay() === 0 || returnDay.getDay() === 6) {
        returnDay.setDate(returnDay.getDate() + 1);
    }
    return { endDate, returnDate: returnDay };
};

window.saveMassChanges = async () => {
    // Coleta todos os inputs de data que foram preenchidos
    const inputs = document.querySelectorAll('input[id^="mass-start-"]');
    const payloads = [];

    inputs.forEach(input => {
        if (!input.value) return; // Pula vazios

        const empId = input.id.replace('mass-start-', '');
        const emp = vacationData.employees.find(e => e.id === empId);

        // Verifica se input de dias existe
        const gozoVal = document.getElementById(`mass-gozo-${empId}`).value;
        const abonoVal = document.getElementById(`mass-abono-${empId}`).value;

        if (emp) {
            payloads.push({
                employee_id: empId,
                start_date: input.value,
                days_taken: parseInt(gozoVal) || 30,
                abono_days: parseInt(abonoVal) || 0,
                salary: emp.currentSalary,
                observation: 'Planejamento em Massa (Painel Setorial)',
                responsible: 'Gestor (Mass Planning)',
                is_planning: true
            });
        }
    });

    if (payloads.length === 0) return alert("Nenhuma data definida para agendamento.");

    if (!confirm(`Confirmar planejamento para ${payloads.length} colaborador(es)?`)) return;

    // Processamento Paralelo (High Performance)
    const promises = payloads.map(p =>
        fetch('/api/vacations/schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(p)
        }).then(r => r.ok).catch(() => false)
    );

    const results = await Promise.all(promises);
    const successCount = results.filter(r => r).length;

    alert(`✓ ${successCount} agendamentos processados em paralelo com sucesso!`);
    await loadDataFromServer();
    // Re-renderiza o setor atual para limpar/atualizar visual
    if (selectedMassSector) {
        // Encontra o elemento visual do setor para manter o highlight
        const el = Array.from(document.querySelectorAll('.mass-sector-item')).find(i => i.innerText.includes(selectedMassSector));
        window.selectMassSector(selectedMassSector, el);
    }
};

// --- SINGLE MODAL ACTIONS ---

window.openVacModal = (id) => {
    const emp = vacationData.employees.find(e => e.id === id);
    if (!emp) return;

    document.getElementById('f-emp-id').value = id;
    document.getElementById('m-name').innerText = emp.name;
    document.getElementById('m-info').innerText = `${emp.reg || ''} • ${emp.sector}`;
    document.getElementById('m-avatar').src = emp.photoUrl;

    // Cálculo Inteligente de Saldo: Considera apenas agendamentos do ciclo atual ou recente
    // Para evitar somar férias de 5 anos atrás, filtramos pelo status e data (últimos 18 meses)
    const eighteenMonthsAgo = new Date();
    eighteenMonthsAgo.setMonth(eighteenMonthsAgo.getMonth() - 18);

    const usedDays = (emp.history || [])
        .filter(v => {
            // Ignora canceladas
            if (v.status === 'Cancelada') return false;
            // Só conta se for agendada, em gozo, concluída recente ou planejada agora
            const isRelevantStatus = ['Agendada', 'Em Gozo', 'Concluída', 'Planejada'].includes(v.status);
            const isRecent = new Date(v.start_date) >= eighteenMonthsAgo;
            return isRelevantStatus && isRecent;
        })
        .reduce((sum, v) => {
            const d = parseInt(v.days_taken) || 0;
            const a = parseInt(v.abono_days) || 0;
            return sum + d + a;
        }, 0);

    const balanceRemaining = Math.max(0, 30 - usedDays);
    const balanceEl = document.getElementById('f-balance-remaining');
    balanceEl.innerText = balanceRemaining;
    balanceEl.dataset.initial = balanceRemaining;
    // Inicia com um período se houver saldo
    const container = document.getElementById('periods-container');
    container.innerHTML = '';

    if (balanceRemaining > 0) {
        addPeriodRow(balanceRemaining);
    } else {
        container.innerHTML = '<p class="text-center py-4 text-xs font-bold text-red-500 uppercase">Colaborador sem saldo para o ciclo atual.</p>';
    }

    document.getElementById('vac-modal').classList.remove('hidden');
};

window.addFractionedPeriod = () => {
    const balanceEl = document.getElementById('f-balance-remaining');
    const initialBalance = parseInt(balanceEl.dataset.initial || 30);

    // Calcula quanto já foi digitado nas linhas atuais
    let typed = 0;
    document.querySelectorAll('.period-row').forEach(row => {
        const days = parseInt(row.querySelector('.f-period-days').value) || 0;
        const abonoCheckbox = row.querySelector('.f-period-abono-check');
        const abonoDays = (abonoCheckbox && abonoCheckbox.checked) ? (parseInt(row.querySelector('.f-period-abono-days').value) || 0) : 0;
        typed += (days + abonoDays);
    });

    const realAvailable = initialBalance - typed;
    if (realAvailable < 5) return alert(`Saldo insuficiente para abrir novo período (Mínimo 5 dias). Você ainda tem ${realAvailable} dias livres.`);

    addPeriodRow(realAvailable);
};

function addPeriodRow(maxAvailable) {
    const container = document.getElementById('periods-container');
    const periodIndex = container.children.length + 1;

    if (periodIndex > 3) return alert("A CLT permite o fracionamento em no máximo 3 períodos.");

    const div = document.createElement('div');
    div.className = "period-row bg-white border border-gray-200 rounded-2xl p-4 space-y-4 animate-fade-in";
    div.innerHTML = `
        <div class="flex justify-between items-center border-b border-gray-100 pb-2 mb-2">
            <span class="text-[9px] font-black text-nordeste-red uppercase italic">Período #${periodIndex}</span>
            <button onclick="this.closest('.period-row').remove(); updateModalBalance();" class="text-gray-300 hover:text-red-500 text-xs">✕</button>
        </div>
        <div class="grid grid-cols-2 gap-3">
            <div>
                <label class="pro-label">Data Início</label>
                <input type="date" class="pro-input f-period-start" onchange="window.calcReturnDate()">
            </div>
            <div>
                <label class="pro-label">Dias de Gozo</label>
                <input type="number" class="pro-input f-period-days" value="${Math.min(maxAvailable, 30)}" min="5" max="30" oninput="window.calcReturnDate()">
            </div>
        </div>
        <div class="hidden">
            <input type="checkbox" class="f-period-abono-check" onchange="window.calcReturnDate()">
            <input type="number" class="f-period-abono-days" value="0">
        </div>
    `;
    container.appendChild(div);
    window.calcReturnDate();
}

window.updateModalBalance = () => {
    const usedDaysOriginal = 30 - parseInt(document.getElementById('f-balance-remaining').dataset.initial || 30);
    // Este cálculo precisa ser mais robusto, mas para este MVP:
    window.calcReturnDate();
};

window.closeVacModal = () => document.getElementById('vac-modal').classList.add('hidden');

// Removido toggleAbonoInput individual pois agora é por linha

window.calcReturnDate = () => {
    const rows = document.querySelectorAll('.period-row');
    const footerPreview = document.getElementById('modal-footer-previews');
    const balanceEl = document.getElementById('f-balance-remaining');

    let totalScheduledInModal = 0;
    let periodSummariesHtml = [];

    rows.forEach((row, idx) => {
        const startVal = row.querySelector('.f-period-start').value;
        const daysGozo = parseInt(row.querySelector('.f-period-days').value) || 0;
        const isAbono = row.querySelector('.f-period-abono-check').checked;
        const abonoDaysInput = row.querySelector('.f-period-abono-days');

        if (isAbono) abonoDaysInput.classList.remove('hidden');
        else abonoDaysInput.classList.add('hidden');

        const abonoDays = isAbono ? parseInt(abonoDaysInput.value) || 0 : 0;
        totalScheduledInModal += (daysGozo + abonoDays);

        if (startVal && daysGozo > 0) {
            const result = window.calculateVacationDates(startVal, daysGozo);
            const startStr = DateFixer.formatarDataParaExibicao(startVal);
            const endStr = DateFixer.formatarDataParaExibicao(result.endDate.toISOString().split('T')[0]);
            const returnStr = DateFixer.formatarDataParaExibicao(result.returnDate.toISOString().split('T')[0]);

            periodSummariesHtml.push(`
                <div class="flex justify-between items-center bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm animate-fade-in">
                    <div class="flex flex-col">
                        <span class="text-[7px] font-black text-nordeste-red uppercase tracking-wider">Período #${idx + 1}</span>
                        <span class="text-[9px] font-black text-gray-700 uppercase">${startStr} a ${endStr}</span>
                    </div>
                    <div class="text-right">
                        <span class="text-[7px] font-black text-gray-400 uppercase block">Retorno</span>
                        <span class="text-[10px] font-black text-nordeste-red uppercase italic">${returnStr}</span>
                    </div>
                </div>
            `);
        }
    });

    if (footerPreview) footerPreview.innerHTML = periodSummariesHtml.join('');

    // Atualiza saldo visualmente (baseado no inicial calculado ao abrir o modal)
    const initialAvailable = parseInt(balanceEl.dataset.initial || 30);
    const newBalance = Math.max(0, initialAvailable - totalScheduledInModal);
    balanceEl.innerText = newBalance;
};

window.submitVacation = async () => {
    const id = document.getElementById('f-emp-id').value;
    const rows = document.querySelectorAll('.period-row');
    const payloads = [];
    let totalModalDays = 0;
    let has14Days = false;

    rows.forEach(row => {
        const start = row.querySelector('.f-period-start').value;
        const daysGozo = parseInt(row.querySelector('.f-period-days').value) || 0;
        const abonoDays = row.querySelector('.f-period-abono-check').checked ? parseInt(row.querySelector('.f-period-abono-days').value) || 0 : 0;

        if (start && daysGozo >= 5) {
            payloads.push({
                employee_id: id,
                start_date: start,
                days_taken: daysGozo,
                abono_days: abonoDays,
                is_planning: true,
                responsible: 'Admin (Fractioned)'
            });
            totalModalDays += (daysGozo + abonoDays);
            if (daysGozo >= 14) has14Days = true;
        }
    });

    if (payloads.length === 0) return alert("Nenhum período válido configurado.");

    // Validação CLT desativada (Modo Dossiê de Registro Simplificado)

    if (!confirm(`Deseja agendar ${payloads.length} período(s) de férias?`)) return;

    // Processamento Paralelo
    const promises = payloads.map(p =>
        fetch('/api/vacations/schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(p)
        }).then(r => r.ok)
    );

    await Promise.all(promises);
    closeVacModal();
    await loadDataFromServer();
};

window.confirmVacation = async (recId) => {
    if (!confirm("Confirmar planejamento e transformar em agendamento oficial?")) return;
    await fetch(`/api/vacations/confirm/${recId}`, { method: 'POST' });
    await loadDataFromServer();
};

window.cancelVacation = async (recId) => {
    if (!confirm("Remover este planejamento?")) return;
    await fetch(`/api/vacations/${recId}`, { method: 'DELETE' });
    await loadDataFromServer();
};
