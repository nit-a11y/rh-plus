
import { state, getRefresher } from '../state.js';
import { calculateAge, formatCurrencyInput } from '../utils.js';

// --- Estado Local do Módulo ---
let currentDossierData = null;
let dossierCharts = {}; 
let currentFilter = {
    term: '',
    sector: 'all',
    status: 'active' 
};

// --- Ponto de Entrada: Renderizar Tela Principal ---
export function renderDossierView() {
    const container = document.getElementById('view-dossier');
    if (!container) return;

    if (!container.querySelector('.dossier-toolbar')) {
        container.innerHTML = `
            <div class="dossier-view-container animate-fade-in">
                <div class="dossier-toolbar sticky top-0 z-20">
                    <div class="search-wrapper">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                        <input type="text" id="dossier-search" 
                            oninput="window.modules.dossier.updateFilter('term', this.value)" 
                            placeholder="Buscar por Nome, Matrícula ou Cargo..." 
                            class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-gray-500 outline-none text-sm shadow-sm">
                    </div>
                    <div class="flex gap-2 flex-wrap">
                        <div class="filter-select-wrapper">
                            <span class="text-xs font-bold text-gray-500 uppercase">Setor:</span>
                            <select id="dossier-filter-sector" onchange="window.modules.dossier.updateFilter('sector', this.value)" class="bg-transparent border-none text-sm font-medium text-gray-700 outline-none cursor-pointer">
                                <option value="all">Todos</option>
                            </select>
                        </div>
                        <div class="flex bg-gray-100 rounded-lg p-1 border border-gray-200">
                            <button onclick="window.modules.dossier.updateFilter('status', 'active')" id="btn-status-active" class="px-3 py-1 text-xs font-bold rounded shadow-sm bg-white text-gray-800 transition-all">Ativos</button>
                            <button onclick="window.modules.dossier.updateFilter('status', 'inactive')" id="btn-status-inactive" class="px-3 py-1 text-xs font-bold rounded text-gray-500 hover:text-gray-700 transition-all">Inativos</button>
                            <button onclick="window.modules.dossier.updateFilter('status', 'all')" id="btn-status-all" class="px-3 py-1 text-xs font-bold rounded text-gray-500 hover:text-gray-700 transition-all">Todos</button>
                        </div>
                    </div>
                    <div class="text-xs text-gray-400 font-mono self-center">
                        <span id="dossier-count">0</span> Arquivos Encontrados
                    </div>
                </div>
                <div id="dossier-grid" class="dossier-grid"></div>
            </div>
        `;
        populateSectorFilter();
    }
    renderGrid();
}

function populateSectorFilter() {
    const select = document.getElementById('dossier-filter-sector');
    if (!select) return;
    const sectors = [...new Set(state.employees.map(e => e.sector))].sort();
    select.innerHTML = '<option value="all">Todos</option>';
    sectors.forEach(sec => {
        const opt = document.createElement('option');
        opt.value = sec;
        opt.textContent = sec;
        select.appendChild(opt);
    });
}

export function updateFilter(key, value) {
    currentFilter[key] = value;
    if (key === 'status') {
        ['active', 'inactive', 'all'].forEach(s => {
            const btn = document.getElementById(`btn-status-${s}`);
            if (value === s) {
                btn.className = "px-3 py-1 text-xs font-bold rounded shadow-sm bg-white text-gray-800 transition-all";
            } else {
                btn.className = "px-3 py-1 text-xs font-bold rounded text-gray-500 hover:text-gray-700 transition-all";
            }
        });
    }
    renderGrid();
}

function renderGrid() {
    const grid = document.getElementById('dossier-grid');
    const countEl = document.getElementById('dossier-count');
    if (!grid) return;

    grid.innerHTML = '';
    const filtered = state.employees.filter(emp => {
        const term = currentFilter.term.toLowerCase();
        const matchText = emp.name.toLowerCase().includes(term) || 
                          emp.registrationNumber.toLowerCase().includes(term) ||
                          emp.role.toLowerCase().includes(term);
        const matchSector = currentFilter.sector === 'all' || emp.sector === currentFilter.sector;
        let matchStatus = true;
        const isInactive = emp.type === 'Desligado';
        if (currentFilter.status === 'active') matchStatus = !isInactive;
        if (currentFilter.status === 'inactive') matchStatus = isInactive;
        return matchText && matchSector && matchStatus;
    });

    if (countEl) countEl.innerText = filtered.length;

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="col-span-full py-12 text-center text-gray-400 italic">Nenhum arquivo encontrado.</div>`;
        return;
    }

    filtered.forEach(emp => {
        const isInactive = emp.type === 'Desligado';
        const card = document.createElement('div');
        card.className = `employee-card group ${isInactive ? 'opacity-75 grayscale' : ''}`;
        card.innerHTML = `
            <div class="card-header-bg">
                <div class="card-status-badge ${isInactive ? 'card-status-inactive text-red-600' : 'card-status-active text-green-600'}">
                    ${isInactive ? 'ARQUIVADO' : 'ATIVO'}
                </div>
            </div>
            <div class="card-avatar-container">
                <img src="${emp.photoUrl}" alt="${emp.name}" class="card-avatar">
            </div>
            <div class="p-4 text-center flex-grow flex flex-col">
                <h3 class="font-bold text-gray-800 text-lg leading-tight mb-1 truncate">${emp.name}</h3>
                <p class="text-xs text-gray-500 font-mono mb-2">${emp.registrationNumber}</p>
                <div class="mt-auto pt-2 space-y-1">
                    <p class="text-sm text-gray-700 font-medium truncate">${emp.role}</p>
                    <p class="text-xs text-gray-500 uppercase tracking-wide truncate">${emp.sector}</p>
                </div>
                <div class="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-2">
                    <button onclick="window.modules.dossier.openDossierDetail('${emp.id}')" class="px-3 py-2 bg-gray-50 text-xs font-bold rounded border">Ver Ficha</button>
                    <button onclick="window.modules.dossier.quickDownloadPDF('${emp.id}')" class="px-3 py-2 bg-red-50 text-red-700 text-xs font-bold rounded border">PDF</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

export async function openDossierDetail(empId) {
    const overlay = document.getElementById('dossier-detail-overlay');
    const content = document.getElementById('dossier-paper-content');
    document.body.style.overflow = 'hidden';
    overlay.classList.remove('hidden-custom');
    content.innerHTML = `<div class="flex items-center justify-center h-screen text-gray-500">Carregando arquivo...</div>`;
    try {
        const res = await fetch(`/api/dossier/${empId}`);
        currentDossierData = await res.json();
        
        // Buscar info de empresas vinculadas (para a ficha detalhada)
        const compRes = await fetch('/api/companies');
        const companies = await compRes.json();
        
        const employer = companies.find(c => c.id === currentDossierData.employer_id);
        const workplace = companies.find(c => c.id === currentDossierData.workplace_id);
        
        currentDossierData.employer_info = employer;
        currentDossierData.workplace_info = workplace;

        renderPaperContent(currentDossierData);
    } catch (e) {
        console.error(e);
        content.innerHTML = `<div class="text-center text-red-600 py-20 font-bold">Erro ao carregar dados.</div>`;
    }
}

export function closeDetail() {
    document.getElementById('dossier-detail-overlay').classList.add('hidden-custom');
    document.body.style.overflow = '';
    currentDossierData = null;
    Object.values(dossierCharts).forEach(c => c.destroy());
    dossierCharts = {};
}

function renderPaperContent(data) {
    const container = document.getElementById('dossier-paper-content');
    const admDate = new Date(data.admissionDate).toLocaleDateString('pt-BR');
    const isTerminated = data.type === 'Desligado';
    const age = calculateAge(data.birthDate);

    const html = `
        <div class="paper-file">
            <div class="flex justify-between mb-4 border-b-2 border-gray-200 pb-2 gap-2 print:hidden relative z-50">
                <div class="flex justify-start gap-2">
                    <button onclick="window.modules.dossier.switchDossierPage(1)" id="dos-btn-p1" class="px-4 py-1.5 text-xs font-bold uppercase rounded bg-gray-800 text-white">I. Ficha Cadastral</button>
                    <button onclick="window.modules.dossier.switchDossierPage(2)" id="dos-btn-p2" class="px-4 py-1.5 text-xs font-bold uppercase rounded bg-gray-200 text-gray-500">II. Análise Gráfica</button>
                </div>
            </div>

            <div class="stamp-confidential">CONFIDENCIAL</div>
            
            <div class="doc-header">
                <div><h1 class="doc-title">Ficha de Registro</h1><p class="text-sm uppercase font-bold text-gray-500">Nordeste Locações • Departamento Pessoal</p></div>
                <div class="doc-photo-frame"><img src="${data.photoUrl}" alt="Foto"></div>
            </div>

            <!-- VINCULOS EMPREGATICIOS (NOVO) -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 border-2 border-dashed border-gray-200">
                <div>
                    <span class="block text-[8px] font-black text-blue-600 uppercase">Empregador Legal (Contratual)</span>
                    <p class="text-xs font-black text-gray-800">${data.employer_info ? data.employer_info.name : 'N/A'}</p>
                    <p class="text-[9px] font-mono text-gray-500">${data.employer_info ? 'CNPJ: ' + data.employer_info.cnpj : ''}</p>
                </div>
                <div>
                    <span class="block text-[8px] font-black text-gray-400 uppercase">Unidade de Atuação (Física)</span>
                    <p class="text-xs font-black text-gray-800">${data.workplace_info ? data.workplace_info.name : 'N/A'}</p>
                    <p class="text-[9px] font-mono text-gray-500">${data.workplace_info ? 'CNPJ: ' + data.workplace_info.cnpj : ''}</p>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mb-6">
                <div class="doc-field"><span class="doc-label">Nome Completo:</span> <span class="doc-value">${data.name.toUpperCase()}</span></div>
                <div class="doc-field"><span class="doc-label">Matrícula:</span> <span class="doc-value font-mono">${data.registrationNumber}</span></div>
                <div class="doc-field"><span class="doc-label">Cargo Atual:</span> <span class="doc-value">${data.role}</span></div>
                <div class="doc-field"><span class="doc-label">Setor:</span> <span class="doc-value">${data.sector}</span></div>
                <div class="doc-field"><span class="doc-label">Admissão:</span> <span class="doc-value">${admDate}</span></div>
                <div class="doc-field"><span class="doc-label">Situação:</span> <span class="doc-value ${isTerminated ? 'text-red-700' : 'text-green-700'}">${isTerminated ? 'DESLIGADO' : 'ATIVO'}</span></div>
                <div class="doc-field"><span class="doc-label">Idade:</span> <span class="doc-value">${age} anos</span></div>
            </div>
            
            <div id="dossier-page-1" class="animate-fade-in">
                <div class="doc-section-title">I. Histórico Profissional</div>
                <table class="doc-table mb-6">
                    <thead><tr><th width="15%">Data</th><th width="20%">Movimento</th><th width="35%">Cargo</th><th width="30%">Salário</th></tr></thead>
                    <tbody>${data.career.map(c => `<tr><td>${new Date(c.date).toLocaleDateString('pt-BR')}</td><td><strong>${c.move_type}</strong></td><td>${c.role}</td><td>${c.salary}</td></tr>`).join('')}</tbody>
                </table>
                <div class="doc-section-title" style="background:#b71c1c;">II. Registro Disciplinar</div>
                <table class="doc-table mb-6">
                    <thead><tr><th width="15%">Data</th><th width="25%">Tipo</th><th width="45%">Motivo</th><th width="15%">Status</th></tr></thead>
                    <tbody>${data.occurrences.length > 0 ? data.occurrences.map(o => `<tr><td>${new Date(o.date).toLocaleDateString('pt-BR')}</td><td class="${o.type.includes('Justa') ? 'text-red-700' : ''}">${o.type}</td><td>${o.reason}</td><td>${o.status}</td></tr>`).join('') : '<tr><td colspan="4" class="text-center italic py-4 text-green-600">FICHA LIMPA</td></tr>'}</tbody>
                </table>
            </div>

            <div id="dossier-page-2" class="hidden-custom animate-fade-in">
                <div class="doc-section-title" style="background:#43a047;">IV. Análise de Evolução</div>
                <div class="mb-8">
                    <h4 class="font-bold text-gray-700 mb-4 border-b border-gray-300 pb-1">1. Curva de Crescimento Salarial</h4>
                    <div class="h-64 relative w-full border border-gray-200 bg-white p-2"><canvas id="dossier-chart-salary"></canvas></div>
                </div>
            </div>

            <div class="mt-12 pt-4 border-t border-gray-400 flex justify-between text-xs text-gray-500 uppercase font-bold">
                <span>Gerado em: ${new Date().toLocaleString('pt-BR')}</span>
                <span>Sistema Nordeste RH+</span>
            </div>
        </div>
    `;
    container.innerHTML = html;
}

export function switchDossierPage(pageNum) {
    const p1 = document.getElementById('dossier-page-1');
    const p2 = document.getElementById('dossier-page-2');
    const btn1 = document.getElementById('dos-btn-p1');
    const btn2 = document.getElementById('dos-btn-p2');
    if (pageNum === 1) {
        p1.classList.remove('hidden-custom'); p2.classList.add('hidden-custom');
        btn1.className = "px-4 py-1.5 text-xs font-bold uppercase rounded bg-gray-800 text-white";
        btn2.className = "px-4 py-1.5 text-xs font-bold uppercase rounded bg-gray-200 text-gray-500";
    } else {
        p1.classList.add('hidden-custom'); p2.classList.remove('hidden-custom');
        btn2.className = "px-4 py-1.5 text-xs font-bold uppercase rounded bg-gray-800 text-white";
        btn1.className = "px-4 py-1.5 text-xs font-bold uppercase rounded bg-gray-200 text-gray-500";
        renderOnScreenCharts();
    }
}

function renderOnScreenCharts() {
    if (!currentDossierData || dossierCharts['salary']) return;
    const salaryHistory = [...currentDossierData.career].sort((a,b) => new Date(a.date) - new Date(b.date));
    const labelsSalary = salaryHistory.map(c => { const d = new Date(c.date); return `${d.getMonth()+1}/${d.getFullYear()}`; });
    const valuesSalary = salaryHistory.map(c => {
        let clean = c.salary.replace(/[^\d,-]/g, '').replace(',', '.');
        return parseFloat(clean) || 0;
    });
    const ctxSalary = document.getElementById('dossier-chart-salary');
    if (ctxSalary) {
        dossierCharts['salary'] = new Chart(ctxSalary, {
            type: 'line',
            data: {
                labels: labelsSalary,
                datasets: [{ label: 'Salário (R$)', data: valuesSalary, borderColor: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.1)', fill: true, tension: 0.3 }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
}

async function loadBase64Image(url) {
    return new Promise((resolve) => {
        const img = new Image(); img.setAttribute('crossOrigin', 'anonymous');
        img.onload = () => {
            const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
            const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0);
            try { resolve(canvas.toDataURL('image/png')); } catch (e) { resolve(null); }
        };
        img.onerror = () => resolve(null); img.src = url;
    });
}

export async function quickDownloadPDF(empId) {
    try {
        const res = await fetch(`/api/dossier/${empId}`);
        currentDossierData = await res.json();
        // Buscar info de empresas vinculado
        const compRes = await fetch('/api/companies');
        const companies = await compRes.json();
        currentDossierData.employer_info = companies.find(c => c.id === currentDossierData.employer_id);
        currentDossierData.workplace_info = companies.find(c => c.id === currentDossierData.workplace_id);
        await downloadFullDossierPDF();
    } catch(e) { alert('Erro ao baixar PDF.'); }
}

export async function downloadFullDossierPDF() {
    if (!currentDossierData) return;
    const data = currentDossierData;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(18); doc.setTextColor(183, 28, 28); doc.setFont("helvetica", "bold");
    doc.text("FICHA DE REGISTRO DO COLABORADOR", 14, 20);
    
    doc.setFontSize(10); doc.setTextColor(33); doc.setFont("helvetica", "normal");
    doc.text(`NOME: ${data.name.toUpperCase()}`, 14, 35);
    doc.text(`MATRÍCULA: ${data.registrationNumber}`, 14, 42);
    doc.text(`EMPREGADOR: ${data.employer_info ? data.employer_info.name : 'N/A'}`, 14, 49);
    doc.text(`LOCAL: ${data.workplace_info ? data.workplace_info.name : 'N/A'}`, 14, 56);

    doc.autoTable({
        startY: 65,
        head: [['Data', 'Movimento', 'Cargo', 'Salário']],
        body: data.career.map(c => [new Date(c.date).toLocaleDateString('pt-BR'), c.move_type, c.role, c.salary]),
        theme: 'striped'
    });

    doc.save(`Ficha_${data.registrationNumber}.pdf`);
}
