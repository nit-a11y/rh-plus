let chartInstances = {};
let employeesCache = [];
let asoSearchTimer = null;
let asoFetchController = null;

const panelTitles = { aso: 'HISTÓRICO GERAL DE EXAMES', dossie: 'BUSCA POR COLABORADORES', abs: 'HISTÓRICO GERAL DE ATESTADOS' };
const asoCrudState = { page: 1, totalPages: 1, pageSize: 10, mode: 'create' };
const dossieState = { selectedEmployeeId: '', summaryRows: [], docsByEvent: {} };

async function init() {
    if (typeof Auth !== 'undefined') Auth.check();
    await loadEmployeesCache();
    populateFilters();
    populateAbsEmployees();
    populateAsoEmployees();
    populateDossieFilters();
    bindAsoEvents();
    bindDossieEvents();
    switchPanel('dossie');
}

async function loadEmployeesCache() {
    if (employeesCache.length) return employeesCache;
    try {
        const res = await fetch('/api/employees');
        const data = await res.json();
        employeesCache = Array.isArray(data) ? data : [];
    } catch (e) {
        console.error(e);
        employeesCache = [];
    }
    return employeesCache;
}

function populateFilters() {
    const select = document.getElementById('bi-filter-sector');
    if (!select) return;
    const sectors = [...new Set(employeesCache.map((e) => e.sector).filter(Boolean))].sort();
    select.innerHTML = '<option value="all">Todos os Setores</option>';
    sectors.forEach((sector) => {
        select.innerHTML += `<option value="${sector}">${sector}</option>`;
    });
}

function populateAbsEmployees() {
    const sel = document.getElementById('abs-emp-id');
    if (!sel) return;
    sel.innerHTML = employeesCache.map((e) => `<option value="${e.id}">${(e.name || '').toUpperCase()}</option>`).join('');
}

function populateAsoEmployees() {
    const sel = document.getElementById('aso-form-employee');
    if (!sel) return;
    sel.innerHTML = employeesCache.map((e) => `<option value="${e.id}">${e.name || 'Sem nome'} - ${e.registrationNumber || '-'}</option>`).join('');
}

function populateDossieFilters() {
    const sel = document.getElementById('dossie-filter-sector');
    if (!sel) return;
    const sectors = [...new Set(employeesCache.map((e) => e.sector).filter(Boolean))].sort();
    sel.innerHTML = '<option value="all">Todos os Setores</option>';
    sectors.forEach((sector) => {
        sel.innerHTML += `<option value="${sector}">${sector}</option>`;
    });
}

function bindAsoEvents() {
    const search = document.getElementById('aso-search');
    if (search) {
        search.addEventListener('input', () => {
            clearTimeout(asoSearchTimer);
            asoSearchTimer = setTimeout(() => {
                asoCrudState.page = 1;
                loadAsoData();
            }, 300);
        });
    }

    ['aso-filter-quick', 'aso-filter-type', 'aso-sort'].forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('change', () => {
            asoCrudState.page = 1;
            loadAsoData();
        });
    });

    document.getElementById('aso-refresh-btn')?.addEventListener('click', () => loadAsoData());
    document.getElementById('aso-new-btn')?.addEventListener('click', () => openAsoRecordModal('create'));

    document.getElementById('aso-prev-page')?.addEventListener('click', () => {
        if (asoCrudState.page <= 1) return;
        asoCrudState.page -= 1;
        loadAsoData();
    });

    document.getElementById('aso-next-page')?.addEventListener('click', () => {
        if (asoCrudState.page >= asoCrudState.totalPages) return;
        asoCrudState.page += 1;
        loadAsoData();
    });

    document.getElementById('aso-modal-close')?.addEventListener('click', closeAsoRecordModal);
    document.getElementById('aso-form-cancel')?.addEventListener('click', closeAsoRecordModal);
    document.getElementById('modal-aso-record')?.addEventListener('click', (event) => {
        if (event.target.id === 'modal-aso-record') closeAsoRecordModal();
    });
    document.getElementById('aso-record-form')?.addEventListener('submit', submitAsoRecordForm);
}

function bindDossieEvents() {
    document.getElementById('dossie-search')?.addEventListener('input', () => renderDossieEmployeeCards());
    document.getElementById('dossie-filter-sector')?.addEventListener('change', () => renderDossieEmployeeCards());
    document.getElementById('dossie-filter-status')?.addEventListener('change', () => renderDossieEmployeeCards());
    document.getElementById('dossie-refresh-btn')?.addEventListener('click', () => loadDossieEmployeeSummary());
    document.getElementById('dossie-back-btn')?.addEventListener('click', closeDossieDetail);
    document.getElementById('dossie-new-aso-btn')?.addEventListener('click', () => openDossieEventModal('aso'));
    document.getElementById('dossie-new-cert-btn')?.addEventListener('click', () => openDossieEventModal('cert'));
    document.getElementById('dossie-event-close')?.addEventListener('click', closeDossieEventModal);
    document.getElementById('dossie-event-cancel')?.addEventListener('click', closeDossieEventModal);
    document.getElementById('modal-dossie-event')?.addEventListener('click', (event) => {
        if (event.target.id === 'modal-dossie-event') closeDossieEventModal();
    });
    document.getElementById('dossie-event-form')?.addEventListener('submit', submitDossieEventForm);
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('pt-BR');
}

function badgeClass(status) {
    if (status === 'vencido') return 'bg-red-100 text-red-700';
    if (status === 'alerta') return 'bg-amber-100 text-amber-700';
    if (status === 'pendente') return 'bg-slate-100 text-slate-700';
    return 'bg-emerald-100 text-emerald-700';
}

function mapRecordStatus(item) {
    const today = new Date();
    const expiry = item?.expiry_date ? new Date(`${item.expiry_date}T00:00:00`) : null;
    if (!expiry || Number.isNaN(expiry.getTime())) return { key: 'pendente', label: 'Pendente' };
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { key: 'vencido', label: 'Vencido' };
    if (diffDays <= 45) return { key: 'alerta', label: 'Alerta 45d' };
    return { key: 'emdia', label: 'Em Dia' };
}

function inferPeriodicityMonths(examDate, expiryDate) {
    if (!examDate || !expiryDate) return '12';
    const start = new Date(`${examDate}T00:00:00`);
    const end = new Date(`${expiryDate}T00:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '12';
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    if (months <= 6) return '6';
    if (months >= 24) return '24';
    return '12';
}

function renderAsoKpis(data) {
    const el = document.getElementById('aso-kpi-strip');
    if (!el) return;
    const cards = [
        { label: 'Vencidos', value: (data.vencidos || []).length, css: 'border-red-200 text-red-700' },
        { label: 'Alerta 45d', value: (data.alerta || []).length, css: 'border-amber-200 text-amber-700' },
        { label: 'Pendentes', value: (data.pendentes || []).length, css: 'border-slate-200 text-slate-700' },
        { label: 'Em Dia', value: (data.em_dia || []).length, css: 'border-emerald-200 text-emerald-700' }
    ];
    el.innerHTML = cards
        .map((c) => `<div class="bg-white border ${c.css} rounded-2xl px-4 py-3"><p class="text-[9px] font-black uppercase text-gray-400">${c.label}</p><p class="text-2xl font-black ${c.css.split(' ')[1]}">${c.value}</p></div>`)
        .join('');
}

window.switchPanel = (panelId) => {
    document.querySelectorAll('.vac-nav-btn').forEach((i) => i.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
    document.getElementById(`nav-${panelId}`)?.classList.add('active');
    document.getElementById(`panel-${panelId}`)?.classList.add('active');
    const title = document.getElementById('panel-title');
    if (title) title.innerText = panelTitles[panelId] || 'SST';
    if (panelId === 'dash') loadBiData();
    if (panelId === 'aso') loadAsoData();
    if (panelId === 'dossie') loadDossieEmployeeSummary();
    if (panelId === 'abs') loadAbsData();
};

window.loadBiData = async () => {
    try {
        const sector = document.getElementById('bi-filter-sector')?.value || 'all';
        const res = await fetch(`/api/sst/bi-data?sector=${encodeURIComponent(sector)}`);
        const data = await res.json();
        renderBi(data);
    } catch (e) {
        console.error(e);
    }
};

function renderBi(data) {
    document.getElementById('bi-kpi-regular').innerText = data.kpis.regulares || 0;
    document.getElementById('bi-kpi-alerta').innerText = data.kpis.alerta_45 || 0;
    document.getElementById('bi-kpi-vencido').innerText = data.kpis.vencidos || 0;
    document.getElementById('bi-kpi-afastados').innerText = data.kpis.afastados_hoje || 0;
    const total = data.kpis.total_colab || 1;
    const compliance = Math.round(((data.kpis.regulares || 0) / total) * 100);
    document.getElementById('bi-kpi-compliance').innerText = `${compliance}%`;
    createChart('chart-sector-compliance', 'bar', data.complianceChart, { indexAxis: 'y', scales: { x: { stacked: true }, y: { stacked: true } } });
    createChart('chart-exam-types', 'doughnut', {
        labels: data.examTypesChart.labels,
        datasets: [{ data: data.examTypesChart.data, backgroundColor: ['#D32F2F', '#1e293b', '#F59E0B', '#10B981', '#3B82F6'] }]
    }, { cutout: '65%' });
}

function createChart(id, type, data, options) {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    if (chartInstances[id]) chartInstances[id].destroy();
    const ctx = canvas.getContext('2d');
    chartInstances[id] = new Chart(ctx, { type, data, options: { ...options, responsive: true, maintainAspectRatio: false } });
}

window.loadAsoData = async () => {
    try {
        if (asoFetchController) asoFetchController.abort();
        asoFetchController = new AbortController();

        const search = document.getElementById('aso-search')?.value || '';
        const quickFilter = document.getElementById('aso-filter-quick')?.value || 'all';
        const examType = document.getElementById('aso-filter-type')?.value || 'all';
        const sort = document.getElementById('aso-sort')?.value || 'exam_date_desc';

        const [summaryRes, recordsRes] = await Promise.all([
            fetch(`/api/aso/summary?search=${encodeURIComponent(search)}`, { signal: asoFetchController.signal }),
            fetch(`/api/aso/records?search=${encodeURIComponent(search)}&quickFilter=${encodeURIComponent(quickFilter)}&examType=${encodeURIComponent(examType)}&sort=${encodeURIComponent(sort)}&page=${asoCrudState.page}&pageSize=${asoCrudState.pageSize}`, { signal: asoFetchController.signal })
        ]);

        const summaryData = await summaryRes.json();
        renderAsoKpis(summaryData);

        const recordsData = await recordsRes.json();
        asoCrudState.totalPages = recordsData.totalPages || 1;
        renderAsoList(recordsData.records || []);
        updateAsoPagination();
    } catch (e) {
        if (e.name !== 'AbortError') console.error(e);
    }
};

function renderAsoList(records) {
    const container = document.getElementById('aso-list-body');
    if (!container) return;

    if (!records.length) {
        container.innerHTML = '<tr><td colspan="6" class="text-center !py-10 text-gray-400 uppercase text-[10px] font-black">Nenhum registro encontrado.</td></tr>';
        return;
    }

    container.innerHTML = records.map((item) => {
        const status = mapRecordStatus(item);
        return `
            <tr>
                <td>
                    <p class="font-black text-[11px] uppercase">${item.employee_name || 'Sem nome'}</p>
                    <p class="text-[10px] text-gray-400 font-bold">#${item.registration_number || '-'} • ${item.sector || '-'}</p>
                </td>
                <td class="uppercase">${item.exam_type || '-'}</td>
                <td>${formatDate(item.exam_date)}</td>
                <td>${formatDate(item.expiry_date)}</td>
                <td><span class="px-3 py-1 rounded-full text-[9px] font-black uppercase ${badgeClass(status.key)}">${status.label}</span></td>
                <td class="text-right">
                    <div class="inline-flex gap-1">
                        <button type="button" onclick="openAsoRecordModal('view','${item.id}')" class="btn-icon bg-slate-100 text-slate-700">Ver</button>
                        <button type="button" onclick="openAsoRecordModal('edit','${item.id}')" class="btn-icon bg-amber-100 text-amber-700">Editar</button>
                        <button type="button" onclick="deleteAsoRecord('${item.id}')" class="btn-icon bg-red-100 text-red-700">Excluir</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function updateAsoPagination() {
    const info = document.getElementById('aso-page-info');
    const prevBtn = document.getElementById('aso-prev-page');
    const nextBtn = document.getElementById('aso-next-page');
    if (info) info.innerText = `Pagina ${asoCrudState.page} de ${asoCrudState.totalPages}`;
    if (prevBtn) prevBtn.disabled = asoCrudState.page <= 1;
    if (nextBtn) nextBtn.disabled = asoCrudState.page >= asoCrudState.totalPages;
}

window.openAsoRecordModal = async (mode, recordId = '') => {
    asoCrudState.mode = mode;

    const modal = document.getElementById('modal-aso-record');
    const title = document.getElementById('aso-modal-title');
    const submitBtn = document.getElementById('aso-form-submit');
    const viewExtra = document.getElementById('aso-view-extra');
    const form = document.getElementById('aso-record-form');

    form.reset();
    document.getElementById('aso-record-id').value = '';
    document.getElementById('aso-form-date').value = new Date().toISOString().split('T')[0];
    viewExtra.classList.add('hidden');
    viewExtra.innerHTML = '';
    submitBtn.classList.remove('hidden');

    if (mode === 'create') {
        title.innerText = 'Novo Registro';
        submitBtn.innerText = 'Salvar Registro';
        setFormReadOnly(false);
        modal.classList.add('open');
        return;
    }

    const res = await fetch(`/api/aso/record/${recordId}`);
    if (!res.ok) return;
    const data = await res.json();

    document.getElementById('aso-record-id').value = data.id || '';
    document.getElementById('aso-form-employee').value = data.employee_id || '';
    document.getElementById('aso-form-type').value = data.exam_type || 'PERIODICO';
    document.getElementById('aso-form-date').value = data.exam_date || '';
    document.getElementById('aso-form-periodicity').value = inferPeriodicityMonths(data.exam_date, data.expiry_date);
    document.getElementById('aso-form-result').value = data.result || 'Apto';
    document.getElementById('aso-form-observation').value = data.observation || '';

    if (mode === 'view') {
        title.innerText = 'Visualizacao de Registro';
        submitBtn.classList.add('hidden');
        setFormReadOnly(true);
        viewExtra.classList.remove('hidden');
        viewExtra.innerHTML = `
            <p class="text-[10px] font-black uppercase text-gray-500">Categoria: <span class="text-gray-700">${data.exam_type || '-'}</span></p>
            <p class="text-[10px] font-black uppercase text-gray-500">Validade: <span class="text-gray-700">${formatDate(data.expiry_date)}</span></p>
            <p class="text-[10px] font-black uppercase text-gray-500">Colaborador: <span class="text-gray-700">${data.employee_name || '-'}</span></p>
        `;
    } else {
        title.innerText = 'Editar Registro';
        submitBtn.innerText = 'Salvar Alteracoes';
        setFormReadOnly(false);
    }

    modal.classList.add('open');
};

function setFormReadOnly(readOnly) {
    ['aso-form-employee', 'aso-form-type', 'aso-form-date', 'aso-form-periodicity', 'aso-form-result', 'aso-form-observation']
        .forEach((id) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.disabled = readOnly;
        });
}

function closeAsoRecordModal() {
    document.getElementById('modal-aso-record')?.classList.remove('open');
    document.getElementById('aso-form-submit')?.classList.remove('hidden');
}

async function submitAsoRecordForm(event) {
    event.preventDefault();
    if (asoCrudState.mode === 'view') return;

    const recordId = document.getElementById('aso-record-id').value;
    const payload = {
        employee_id: document.getElementById('aso-form-employee').value,
        exam_type: document.getElementById('aso-form-type').value,
        exam_date: document.getElementById('aso-form-date').value,
        periodicity: document.getElementById('aso-form-periodicity').value,
        result: document.getElementById('aso-form-result').value,
        observation: document.getElementById('aso-form-observation').value,
        responsible: Auth.getUser()?.name || 'Sistema'
    };

    const method = recordId ? 'PUT' : 'POST';
    const url = recordId ? `/api/aso/record/${recordId}` : '/api/aso';

    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) return;

    closeAsoRecordModal();
    await Promise.all([loadAsoData(), loadBiData()]);
}

window.deleteAsoRecord = async (id) => {
    const ok = confirm('Deseja excluir este registro?');
    if (!ok) return;

    const res = await fetch(`/api/aso/record/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responsible: Auth.getUser()?.name || 'Sistema' })
    });
    if (!res.ok) return;

    await Promise.all([loadAsoData(), loadBiData()]);
};

async function loadDossieEmployeeSummary() {
    try {
        const res = await fetch('/api/aso/summary');
        const data = await res.json();
        dossieState.summaryRows = [
            ...(data.vencidos || []),
            ...(data.alerta || []),
            ...(data.pendentes || []),
            ...(data.em_dia || [])
        ];
        renderDossieEmployeeCards();
    } catch (e) {
        console.error(e);
    }
}

function renderDossieEmployeeCards() {
    const grid = document.getElementById('dossie-employee-grid');
    if (!grid) return;

    const search = (document.getElementById('dossie-search')?.value || '').toLowerCase().trim();
    const sector = document.getElementById('dossie-filter-sector')?.value || 'all';
    const status = document.getElementById('dossie-filter-status')?.value || 'all';

    const rows = dossieState.summaryRows.filter((r) => {
        const txt = `${r.emp_name || ''} ${r.sector || ''}`.toLowerCase();
        const okSearch = !search || txt.includes(search);
        const okSector = sector === 'all' || (r.sector || '') === sector;
        const okStatus = status === 'all' || (r.status_key || '') === status;
        return okSearch && okSector && okStatus;
    });

    if (!rows.length) {
        grid.innerHTML = '<div class="col-span-full bg-white rounded-2xl border border-gray-200 p-8 text-center text-[10px] uppercase font-black text-gray-400">Nenhum colaborador encontrado.</div>';
        return;
    }

    grid.innerHTML = rows.map((r) => {
        const photo = r.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.emp_name || 'Sem nome')}&background=121212&color=fff`;
        const badgeColor = r.status_key === 'vencido' ? 'red-500' : (r.status_key === 'alerta' ? 'amber-500' : (r.status_key === 'emdia' ? 'green-500' : 'gray-400'));
        return `
            <div class="bg-white border-t-4 border-${badgeColor} rounded-2xl shadow-sm hover:shadow-md transition-all p-5 animate-fade-in relative group flex flex-col justify-between">
                <div>
                    <div class="flex justify-between items-start mb-4">
                        <div class="flex items-center gap-3">
                            <img src="${photo}" class="w-10 h-10 rounded-xl object-cover border border-gray-100">
                            <div class="min-w-0">
                                <h4 class="font-black text-gray-800 uppercase text-xs truncate w-32" title="${r.emp_name || '-'}">${r.emp_name || '-'}</h4>
                                <p class="text-[9px] text-gray-400 font-bold uppercase tracking-widest">${r.role || '-'} • ${r.sector || '-'}</p>
                            </div>
                        </div>
                        <span class="px-2 py-1 rounded-lg text-[8px] font-black uppercase bg-${badgeColor} text-white">${r.status_label || 'Pendente'}</span>
                    </div>

                    <div class="bg-gray-50 p-3 rounded-xl border border-gray-100 mb-4 space-y-1">
                        <div class="flex justify-between items-center">
                            <span class="text-[8px] font-bold text-gray-400 uppercase">Último Vencimento</span>
                            <span class="text-[9px] font-black text-gray-700">${formatDate(r.expiry_date)}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-[8px] font-bold text-gray-400 uppercase">Último Exame</span>
                            <span class="text-[9px] font-bold text-gray-500">${formatDate(r.exam_date)}</span>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-2 mt-auto">
                    <button onclick="window.fastOpenModal('aso', '${r.emp_id}')" class="bg-nordeste-black text-white py-2 rounded-xl text-[9px] font-black uppercase hover:bg-gray-800 transition-colors">+ ASO</button>
                    <button onclick="window.fastOpenModal('cert', '${r.emp_id}')" class="bg-blue-600 text-white py-2 rounded-xl text-[9px] font-black uppercase hover:bg-blue-700 transition-colors">+ Atestado</button>
                    <button onclick="openDossieDetail('${r.emp_id}')" class="col-span-2 border border-gray-200 text-gray-600 py-2 rounded-xl text-[9px] font-black uppercase hover:border-gray-300 transition-colors">📄 Ver Histórico Médico</button>
                </div>
            </div>
        `;
    }).join('');
}

window.fastOpenModal = (kind, emp_id) => {
    dossieState.selectedEmployeeId = emp_id;
    openDossieEventModal(kind, null);
};

window.openDossieDetail = async (employeeId) => {
    dossieState.selectedEmployeeId = employeeId;
    document.getElementById('dossie-employee-view')?.classList.add('hidden');
    document.getElementById('dossie-detail-view')?.classList.remove('hidden');

    try {
        const [dossierRes, timelineRes, docsRes] = await Promise.all([
            fetch(`/api/employees-pro/${employeeId}/dossier`),
            fetch(`/api/sst/timeline/${employeeId}?period=all`),
            fetch(`/api/sst/event-documents/by-employee/${employeeId}`)
        ]);
        const dossier = await dossierRes.json();
        const timeline = await timelineRes.json();
        const docs = await docsRes.json();

        const employee = dossier?.employee || {};
        dossieState.docsByEvent = {};
        (docs || []).forEach((d) => {
            const key = `${d.source_table}:${d.source_id}`;
            if (!dossieState.docsByEvent[key]) dossieState.docsByEvent[key] = [];
            dossieState.docsByEvent[key].push(d);
        });

        renderDossieHeader(employee, dossier);
        renderDossieTimeline(timeline || []);
    } catch (e) {
        console.error(e);
    }
};

function renderDossieHeader(employee, dossier) {
    const asoRows = Array.isArray(dossier?.aso) ? dossier.aso : [];
    const certRows = Array.isArray(dossier?.absenteismo) ? dossier.absenteismo : [];
    const lastAso = asoRows[0] || null;
    const now = new Date();
    const last12m = new Date();
    last12m.setMonth(last12m.getMonth() - 12);
    const cert12m = certRows.filter((c) => new Date(`${c.start_date}T00:00:00`) >= last12m);
    const days12m = cert12m.reduce((acc, c) => acc + (parseInt(c.days_count, 10) || 0), 0);

    document.getElementById('dossie-emp-name').innerText = employee.name || 'Sem nome';
    document.getElementById('dossie-emp-meta').innerText = `${employee.role || '-'} • ${employee.sector || '-'} • Admissão ${formatDate(employee.admissionDate)}`;

    const status = mapRecordStatus(lastAso || {});
    document.getElementById('dossie-kpis').innerHTML = `
        <div class="bg-white border border-gray-200 rounded-2xl p-4"><p class="text-[9px] uppercase font-black text-gray-400">Último ASO</p><p class="text-lg font-black text-gray-800">${formatDate(lastAso?.exam_date)}</p></div>
        <div class="bg-white border border-gray-200 rounded-2xl p-4"><p class="text-[9px] uppercase font-black text-gray-400">Próximo Vencimento</p><p class="text-lg font-black text-gray-800">${formatDate(lastAso?.expiry_date)}</p></div>
        <div class="bg-white border border-gray-200 rounded-2xl p-4"><p class="text-[9px] uppercase font-black text-gray-400">Atestados 12M</p><p class="text-lg font-black text-gray-800">${cert12m.length}</p></div>
        <div class="bg-white border border-gray-200 rounded-2xl p-4"><p class="text-[9px] uppercase font-black text-gray-400">Dias Afastados 12M</p><p class="text-lg font-black text-gray-800">${days12m}</p><span class="px-2 py-1 rounded-full text-[9px] font-black uppercase ${badgeClass(status.key)}">${status.label}</span></div>
    `;
}

function timelineColor(eventType, statusText) {
    const type = String(eventType || '').toUpperCase();
    const status = String(statusText || '').toUpperCase();
    if (type.includes('ATESTADO')) return '#3B82F6';
    if (type.includes('ASO_VENCIMENTO') && status.includes('VENCIDO')) return '#EF4444';
    if (type.includes('ASO_VENCIMENTO')) return '#F59E0B';
    if (type.includes('ASO')) return '#10B981';
    return '#64748B';
}

function renderDossieTimeline(events) {
    const box = document.getElementById('dossie-timeline');
    if (!box) return;
    if (!events.length) {
        box.innerHTML = '<div class="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center text-[10px] uppercase font-black text-gray-400">Sem eventos no período.</div>';
        return;
    }

    box.innerHTML = events.map((evt) => {
        const color = timelineColor(evt.event_type, evt.status);
        const key = `${evt.source_table}:${evt.source_id}`;
        const docs = dossieState.docsByEvent[key] || [];
        const docsHtml = docs.map((d) => `<a href="${d.file_url}" target="_blank" class="text-[10px] font-black text-blue-600 underline">${d.file_name}</a>`).join(' • ');
        const canEdit = evt.source_table === 'aso_records' || evt.source_table === 'sst_certificates';
        return `
            <div class="relative bg-white border border-gray-200 rounded-2xl p-4">
                <span class="timeline-dot" style="background:${color};"></span>
                <div class="flex flex-wrap justify-between items-start gap-2">
                    <div>
                        <p class="text-[11px] font-black uppercase text-gray-800">${evt.title || '-'}</p>
                        <p class="text-[10px] font-bold uppercase text-gray-400">${evt.event_type || '-'} • ${evt.status || '-'}</p>
                    </div>
                    <p class="text-[10px] font-black uppercase text-gray-500">${formatDate(evt.event_date)}</p>
                </div>
                <div class="mt-2 text-[10px] text-gray-600 font-bold">${docs.length ? `Documentos: ${docsHtml}` : 'Sem documentos anexados.'}</div>
                <div class="mt-3 flex gap-2">
                    <button class="px-3 py-1 rounded-lg border border-gray-200 text-[9px] font-black uppercase text-gray-600" onclick="openUploadForEvent('${evt.source_table}','${evt.source_id}')">Anexar</button>
                    ${canEdit ? `<button class="px-3 py-1 rounded-lg bg-amber-100 text-amber-700 text-[9px] font-black uppercase" onclick="editDossieEvent('${evt.source_table}','${evt.source_id}')">Editar</button>` : ''}
                    ${canEdit ? `<button class="px-3 py-1 rounded-lg bg-red-100 text-red-700 text-[9px] font-black uppercase" onclick="deleteDossieEvent('${evt.source_table}','${evt.source_id}')">Excluir</button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function closeDossieDetail() {
    dossieState.selectedEmployeeId = '';
    document.getElementById('dossie-detail-view')?.classList.add('hidden');
    document.getElementById('dossie-employee-view')?.classList.remove('hidden');
}

function openDossieEventModal(kind, data = null) {
    document.getElementById('dossie-event-form')?.reset();
    document.getElementById('dossie-event-kind').value = kind;
    document.getElementById('dossie-event-id').value = data?.id || '';
    document.getElementById('dossie-event-title').innerText = data ? 'Editar Histórico' : (kind === 'aso' ? 'Registrar ASO' : 'Registrar Atestado');
    
    if(dossieState.selectedEmployeeId && dossieState.summaryRows) {
        const emp = dossieState.summaryRows.find(e => e.emp_id === dossieState.selectedEmployeeId);
        if(emp) {
            const avatar = document.getElementById('dossie-modal-avatar');
            const info = document.getElementById('dossie-modal-info');
            if(avatar) avatar.src = emp.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.emp_name || 'Usuário')}&background=D32F2F&color=fff`;
            if(info) info.innerText = `${emp.role || 'Colaborador'} • ${emp.sector || 'N/A'} • ${emp.emp_name || ''}`;
        }
    }

    document.getElementById('dossie-event-start').value = data?.start || new Date().toISOString().split('T')[0];
    document.getElementById('dossie-event-end').value = data?.end || '';
    document.getElementById('dossie-event-type').value = data?.type || (kind === 'aso' ? 'PERIODICO' : 'DOENCA');
    document.getElementById('dossie-event-result').value = data?.result || '';
    document.getElementById('modal-dossie-event')?.classList.add('open');
}

function closeDossieEventModal() {
    document.getElementById('modal-dossie-event')?.classList.remove('open');
}

window.openUploadForEvent = async (sourceTable, sourceId) => {
    const picker = document.createElement('input');
    picker.type = 'file';
    picker.accept = '.pdf,.jpg,.jpeg,.png';
    picker.onchange = async () => {
        const file = picker.files?.[0];
        if (!file || !dossieState.selectedEmployeeId) return;
        await uploadDocumentForEvent(file, sourceTable, sourceId, dossieState.selectedEmployeeId);
        await window.openDossieDetail(dossieState.selectedEmployeeId);
    };
    picker.click();
};

window.editDossieEvent = async (sourceTable, sourceId) => {
    if (sourceTable === 'aso_records') {
        const res = await fetch(`/api/aso/record/${sourceId}`);
        if (!res.ok) return;
        const row = await res.json();
        openDossieEventModal('aso', { id: row.id, start: row.exam_date, end: row.expiry_date, type: row.exam_type, result: row.result });
        return;
    }
    if (sourceTable === 'sst_certificates') {
        const dossierRes = await fetch(`/api/employees-pro/${dossieState.selectedEmployeeId}/dossier`);
        const dossier = await dossierRes.json();
        const row = (dossier?.absenteismo || []).find((x) => x.id === sourceId);
        if (!row) return;
        openDossieEventModal('cert', { id: row.id, start: row.start_date, end: row.end_date, type: row.type || 'DOENCA', result: row.cid || '' });
    }
};

window.deleteDossieEvent = async (sourceTable, sourceId) => {
    if (!confirm('Confirma a exclusão deste evento?')) return;
    if (sourceTable === 'aso_records') {
        await fetch(`/api/aso/record/${sourceId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ responsible: Auth.getUser()?.name || 'Sistema' })
        });
    } else if (sourceTable === 'sst_certificates') {
        await fetch(`/api/sst/certificates/${sourceId}`, { method: 'DELETE' });
    }
    if (dossieState.selectedEmployeeId) await window.openDossieDetail(dossieState.selectedEmployeeId);
    await Promise.all([loadAsoData(), loadAbsData(), loadBiData()]);
};

async function submitDossieEventForm(event) {
    event.preventDefault();
    if (!dossieState.selectedEmployeeId) return;

    const kind = document.getElementById('dossie-event-kind').value;
    const id = document.getElementById('dossie-event-id').value;
    const start = document.getElementById('dossie-event-start').value;
    const end = document.getElementById('dossie-event-end').value;
    const type = document.getElementById('dossie-event-type').value;
    const result = document.getElementById('dossie-event-result').value;
    const file = document.getElementById('dossie-event-file').files?.[0];

    let sourceTable = '';
    let sourceId = id;

    if (kind === 'aso') {
        const payload = {
            employee_id: dossieState.selectedEmployeeId,
            exam_type: type || 'PERIODICO',
            exam_date: start,
            periodicity: '12',
            result: result || 'Apto',
            responsible: Auth.getUser()?.name || 'Sistema'
        };
        const res = await fetch(id ? `/api/aso/record/${id}` : '/api/aso', {
            method: id ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) return;
        const data = await res.json();
        sourceTable = 'aso_records';
        sourceId = id || data.id;
    } else {
        const payload = {
            employee_id: dossieState.selectedEmployeeId,
            start_date: start,
            end_date: end || start,
            cid: result || '',
            type: type || 'DOENCA'
        };
        const res = await fetch(id ? `/api/sst/certificates/${id}` : '/api/sst/certificates', {
            method: id ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) return;
        const data = await res.json();
        sourceTable = 'sst_certificates';
        sourceId = id || data.id;
    }

    if (file && sourceId) {
        await uploadDocumentForEvent(file, sourceTable, sourceId, dossieState.selectedEmployeeId);
    }

    closeDossieEventModal();
    await window.openDossieDetail(dossieState.selectedEmployeeId);
    await Promise.all([loadAsoData(), loadAbsData(), loadBiData()]);
}

async function uploadDocumentForEvent(file, sourceTable, sourceId, employeeId) {
    const toBase64 = (f) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(f);
    });

    const dataBase64 = await toBase64(file);
    await fetch('/api/sst/event-documents/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            source_table: sourceTable,
            source_id: sourceId,
            employee_id: employeeId,
            file_name: file.name,
            mime_type: file.type,
            data_base64: dataBase64
        })
    });
}

window.openAbsModal = () => document.getElementById('modal-abs').classList.remove('hidden');
window.closeAbsModal = () => document.getElementById('modal-abs').classList.add('hidden');

async function loadAbsData() {
    try {
        const res = await fetch('/api/sst/certificates');
        const data = await res.json();
        const tbody = document.getElementById('table-abs-body');
        tbody.innerHTML = (data || []).map((c) => `
            <tr class="border-b">
                <td class="font-black text-[10px] uppercase py-4">${c.emp_name}</td>
                <td>${formatDate(c.start_date)}</td>
                <td>${formatDate(c.end_date)}</td>
                <td class="text-center font-black text-nordeste-red">${c.days_count}d</td>
                <td class="font-mono text-[10px] text-gray-400">${c.cid || '-'}</td>
            </tr>
        `).join('');
    } catch (e) {
        console.error(e);
    }
}

document.getElementById('abs-form').onsubmit = async (e) => {
    e.preventDefault();
    const startDate = document.getElementById('abs-start').value;
    const endDate = document.getElementById('abs-end').value;
    if (startDate && endDate && endDate < startDate) {
        alert('A data final nao pode ser anterior a data inicial.');
        return;
    }

    const payload = {
        employee_id: document.getElementById('abs-emp-id').value,
        start_date: startDate,
        end_date: endDate,
        cid: document.getElementById('abs-cid').value,
        type: 'DOENCA'
    };

    await fetch('/api/sst/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    closeAbsModal();
    await Promise.all([loadAbsData(), loadBiData(), loadAsoData()]);
};

init();
