
let employees = [];
let stats = {};
let sectorsData = {};
let currentSector = null;

document.addEventListener('DOMContentLoaded', init);

async function init() {
    await loadData();
    renderAnalysis();
}

async function loadData() {
    try {
        const res = await fetch('/api/vacations/summary');
        const data = await res.json();
        employees = data.employees;
        stats = data.stats;
        sectorsData = {};
        employees.forEach(e => {
            if(!sectorsData[e.sector]) sectorsData[e.sector] = { name: e.sector, total: 0, risk: 0, janela: 0, apto: 0, carencia: 0, list: [] };
            const s = sectorsData[e.sector];
            s.total++; s.list.push(e);
            if (e.legalStatus === 'Risco Crítico') s.risk++;
            else if (e.legalStatus === 'Janela Obrigatória') s.janela++;
            else if (e.legalStatus === 'Apto para Gozo') s.apto++;
            else if (e.legalStatus === 'Em Carência') s.carencia++;
        });
    } catch (e) { console.error(e); }
}

function renderAnalysis() {
    document.getElementById('kpi-apto').innerText = stats.apto;
    document.getElementById('kpi-risco').innerText = stats.risk;
    document.getElementById('kpi-janela').innerText = stats.janela;
    document.getElementById('kpi-carencia').innerText = stats.carencia;
    renderSectors();
}

window.renderSectors = () => {
    const grid = document.getElementById('sectors-grid');
    const search = document.getElementById('sector-search').value.toLowerCase();
    if (!grid) return;
    grid.innerHTML = '';
    Object.values(sectorsData).filter(s => s.name.toLowerCase().includes(search)).forEach(s => {
        const riskLevel = s.risk > 0 ? 'high-risk' : s.janela > 0 ? 'warning-risk' : 'low-risk';
        const card = document.createElement('div');
        card.className = `sector-card ${riskLevel} animate-fade-in`;
        card.onclick = () => openAnalysisModal(s.name);
        card.innerHTML = `
            <h3 class="sector-name">${s.name}</h3>
            <div class="flex-1">
                <div class="sector-stat-row"><span class="sector-stat-label">Total Ativos</span><span class="sector-stat-value">${s.total}</span></div>
                <div class="sector-stat-row"><span class="sector-stat-label text-red-500 font-black">Risco Crítico</span><span class="sector-stat-value text-red-600">${s.risk}</span></div>
                <div class="sector-stat-row"><span class="sector-stat-label text-green-500 font-black">Aptos (Fora de Carência)</span><span class="sector-stat-value text-green-600">${s.apto}</span></div>
            </div>
            <button class="btn-define">Analisar Fracionamento & Períodos</button>
        `;
        grid.appendChild(card);
    });
};

window.openAnalysisModal = (sectorName) => {
    currentSector = sectorsData[sectorName];
    document.getElementById('modal-sector-tag').innerText = sectorName;
    const list = document.getElementById('sector-employees-list');
    list.innerHTML = currentSector.list.map(e => {
        const m = e.cltMetrics;
        const isBlocked = e.legalStatus === 'Em Carência';
        return `
            <div class="emp-analysis-card flex flex-col gap-3 !p-5 ${isBlocked ? 'opacity-40' : ''}">
                <div class="flex items-center gap-4">
                    <img src="${e.photoUrl || 'https://ui-avatars.com/api/?name='+e.name}" class="emp-analysis-avatar">
                    <div class="min-w-0 flex-1">
                        <div class="flex justify-between items-center"><p class="text-[10px] font-black text-gray-800 uppercase truncate">${e.name}</p></div>
                        <p class="text-[8px] font-bold text-nordeste-red uppercase tracking-tighter">${e.legalStatus}</p>
                    </div>
                </div>
                <div class="pt-3 border-t border-gray-100">
                    <label class="pro-label !text-[7px]">Pretensões do Liderado (Alinhado com Gestor)</label>
                    <select class="pro-input !py-1 !text-[9px] font-black text-blue-600">
                        <option>GOZO INTEGRAL (30 DIAS)</option>
                        <option>FRACIONADO (2 PERÍODOS)</option>
                        <option>FRACIONADO (3 PERÍODOS)</option>
                        <option>ABONO + INTEGRAL (20 DIAS)</option>
                        <option>ABONO + FRACIONADO</option>
                    </select>
                </div>
            </div>
        `;
    }).join('');
    document.getElementById('periods-container').innerHTML = '';
    document.getElementById('f-obs').value = '';
    addPeriodField();
    document.getElementById('analysis-overlay').classList.remove('hidden');
};

window.closeAnalysisModal = () => document.getElementById('analysis-overlay').classList.add('hidden');

window.addPeriodField = () => {
    const container = document.getElementById('periods-container');
    const div = document.createElement('div');
    div.className = 'period-block animate-fade-in';
    div.innerHTML = `
        <button type="button" onclick="this.parentElement.remove()" class="btn-remove-period">✕</button>
        <div class="grid grid-cols-2 gap-4">
            <div><label class="pro-label">Início Disponível</label><input type="date" class="pro-input f-p-start"></div>
            <div><label class="pro-label">Fim Disponível</label><input type="date" class="pro-input f-p-end"></div>
        </div>
        <div class="mt-3"><label class="pro-label">Pessoas por Janela</label><input type="number" class="pro-input f-p-max" value="1"></div>
    `;
    container.appendChild(div);
};

window.downloadAnalysisPDF = async () => {
    if (!currentSector) return;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFillColor(18, 18, 18); doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(18); doc.setFont("helvetica", "bold");
    doc.text("NORDESTE LOCAÇÕES - RH+", 15, 18);
    doc.setFontSize(10); doc.text("ALINHAMENTO DE FRACIONAMENTO E JANELAS SETORIAIS", 15, 28);
    doc.setTextColor(0); doc.setFontSize(14); doc.text(`SETOR: ${currentSector.name.toUpperCase()}`, 15, 55);
    doc.autoTable({
        startY: 65,
        head: [['COLABORADOR', 'SITUAÇÃO', 'LIMITE LEGAL', 'OPÇÃO DE GOZO']],
        body: currentSector.list.map(e => [e.name.toUpperCase(), e.legalStatus, new Date(e.cltMetrics.limitDate).toLocaleDateString('pt-BR'), 'FRACIONAMENTO PERMITIDO']),
        theme: 'striped', headStyles: { fillColor: [51, 51, 51] }, styles: { fontSize: 7 }
    });
    doc.save(`Analise_Aptos_${currentSector.name}.pdf`);
};

window.submitPeriods = () => { alert('ALINHAMENTO SINCRONIZADO!'); closeAnalysisModal(); };
