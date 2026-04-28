
import { state } from '../state.js';

let charts = {};
let mapInstance = null; // Variável para guardar instância do Leaflet

// Estado local do Filtro
const filterState = {
    periodType: 'year', // month, trimester, semester, year, all, custom
    startDate: '',
    endDate: '',
    sector: 'all',
    searchName: ''
};

// Configuração de períodos
const getPeriodDates = (type) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    let start = new Date();
    let end = new Date();

    switch(type) {
        case 'month':
            start = new Date(currentYear, currentMonth, 1);
            end = new Date(currentYear, currentMonth + 1, 0);
            break;
        case 'trimester':
            start = new Date(currentYear, currentMonth - 3, 1);
            break;
        case 'semester':
            start = new Date(currentYear, currentMonth - 6, 1);
            break;
        case 'year':
            start = new Date(currentYear, 0, 1);
            end = new Date(currentYear, 11, 31);
            break;
        case 'all':
            start = new Date(2020, 0, 1); // Inicio hipotético
            break;
        case 'custom':
            return null; // Retorna null para indicar que usa os inputs manuais
    }
    return { 
        start: start.toISOString().split('T')[0], 
        end: end.toISOString().split('T')[0] 
    };
};

// Inicialização
function initFilters() {
    const range = getPeriodDates('year'); // Default
    filterState.startDate = range.start;
    filterState.endDate = range.end;
}

// Ponto de entrada
export function renderReportsView() {
    const container = document.getElementById('view-reports');
    if (!container) return;
    
    // Inicializa datas se vazio
    if (!filterState.startDate) initFilters();

    container.innerHTML = `
        <div class="flex flex-col space-y-6 animate-fade-in pb-10">
            
            <!-- PAINEL DE CONTROLE (FILTROS) -->
            <div class="bg-white rounded-xl shadow-md border border-gray-200 p-5 sticky top-0 z-20">
                <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4 border-b border-gray-100 pb-4">
                    <div>
                        <h2 class="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <svg class="w-6 h-6 text-nordeste-red" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                            Inteligência de RH
                        </h2>
                        <p class="text-xs text-gray-500">Demografia, Finanças e Estratégia</p>
                    </div>
                    
                    <div class="flex flex-wrap gap-2">
                        <input type="text" id="rep-search" placeholder="Buscar Colaborador..." 
                            class="input-field w-40 text-sm py-1.5"
                            value="${filterState.searchName}" 
                            onchange="window.modules.reports.updateFilterState('searchName', this.value)">
                        
                        <select id="rep-sector" onchange="window.modules.reports.updateFilterState('sector', this.value)" 
                            class="input-field w-40 text-sm py-1.5">
                            <option value="all">🏢 Todos os Setores</option>
                        </select>

                        <button onclick="window.modules.reports.applyFilters()" class="btn bg-nordeste-black text-white hover:bg-gray-800 py-1.5 px-4 text-sm shadow-lg">
                            Atualizar
                        </button>
                    </div>
                </div>

                <!-- LINHA DE TEMPO (SELETORES) -->
                <div class="flex flex-col md:flex-row gap-4 items-center bg-gray-50 p-3 rounded-lg">
                    <div class="flex bg-white rounded-lg border border-gray-200 p-1 shadow-sm overflow-x-auto max-w-full">
                        ${['Mês', 'Trimestre', 'Semestre', 'Ano', 'Tudo', 'Custom'].map(l => {
                            const val = l === 'Mês' ? 'month' : l === 'Trimestre' ? 'trimester' : l === 'Semestre' ? 'semester' : l === 'Ano' ? 'year' : l === 'Tudo' ? 'all' : 'custom';
                            const active = filterState.periodType === val ? 'bg-nordeste-red text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50';
                            return `<button onclick="window.modules.reports.setPeriod('${val}')" class="px-3 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap ${active}">${l}</button>`;
                        }).join('')}
                    </div>
                    
                    <div class="flex items-center gap-2 ${filterState.periodType !== 'custom' ? 'opacity-50 pointer-events-none' : ''}">
                        <input type="date" id="rep-start" value="${filterState.startDate}" class="input-field text-xs py-1.5 w-auto" onchange="window.modules.reports.updateCustomDate()">
                        <span class="text-gray-400 text-xs">até</span>
                        <input type="date" id="rep-end" value="${filterState.endDate}" class="input-field text-xs py-1.5 w-auto" onchange="window.modules.reports.updateCustomDate()">
                    </div>
                </div>
            </div>

            <!-- 1. BLOCO: SNAPSHOT ATUAL (DEMOGRAFIA & FINANCEIRO) -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <!-- KPI 1: Headcount -->
                <div class="card p-5 border-l-4 border-blue-600 bg-white shadow-sm">
                    <p class="text-xs font-bold text-gray-400 uppercase">Colaboradores</p>
                    <h3 class="text-3xl font-black text-gray-800" id="kpi-headcount">-</h3>
                    <span class="text-xs text-blue-600 font-medium">Ativos no momento</span>
                </div>
                <!-- KPI 2: Idade Média -->
                <div class="card p-5 border-l-4 border-purple-500 bg-white shadow-sm">
                    <p class="text-xs font-bold text-gray-400 uppercase">Média de Idade</p>
                    <div class="flex items-baseline gap-1">
                        <h3 class="text-3xl font-black text-gray-800" id="kpi-age">-</h3>
                        <span class="text-sm text-gray-500">anos</span>
                    </div>
                </div>
                <!-- KPI 3: Folha Total -->
                <div class="card p-5 border-l-4 border-green-600 bg-white shadow-sm">
                    <p class="text-xs font-bold text-gray-400 uppercase">Custo Mensal (Folha)</p>
                    <h3 class="text-2xl font-black text-green-700 truncate" id="kpi-payroll">-</h3>
                </div>
                <!-- KPI 4: Média Salarial -->
                <div class="card p-5 border-l-4 border-yellow-500 bg-white shadow-sm">
                    <p class="text-xs font-bold text-gray-400 uppercase">Média Salarial</p>
                    <h3 class="text-2xl font-black text-gray-800 truncate" id="kpi-avg-sal">-</h3>
                </div>
            </div>

            <!-- GRÁFICOS LINHA 1: PERFIL -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="card p-6">
                    <h4 class="font-bold text-gray-800 mb-4 flex items-center gap-2">🎂 Distribuição Etária</h4>
                    <div class="h-64 chart-container"><canvas id="chart-age-dist"></canvas></div>
                </div>
                <div class="card p-6">
                    <h4 class="font-bold text-gray-800 mb-4 flex items-center gap-2">💰 Custo por Setor</h4>
                    <div class="h-64 chart-container"><canvas id="chart-sector-cost"></canvas></div>
                </div>
            </div>

            <!-- NOVO: MAPA DE DENSIDADE -->
            <div class="card p-6 border-2 border-blue-50">
                <div class="flex justify-between items-center mb-4">
                    <h4 class="font-bold text-gray-800 flex items-center gap-2">
                        <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        Distribuição Geográfica (Endereços)
                    </h4>
                    <span class="text-xs text-gray-500 italic">Baseado nos endereços cadastrados</span>
                </div>
                <div id="map-density" class="w-full h-96 rounded-lg z-10 border border-gray-300"></div>
            </div>

            <!-- 2. BLOCO: ANALYTICS (MOVIMENTAÇÃO NO PERÍODO) -->
            <div class="border-t border-gray-300 pt-6 mt-6">
                <h3 class="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                    Análise de Movimentação (Período Selecionado)
                </h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div class="card bg-green-50 border border-green-100 p-4 flex justify-between items-center">
                        <div><p class="text-green-800 font-bold text-sm">PROMOÇÕES</p><p class="text-xs text-green-600">Crescimento Interno</p></div>
                        <span class="text-3xl font-black text-green-700" id="kpi-promo-period">-</span>
                    </div>
                    <div class="card bg-red-50 border border-red-100 p-4 flex justify-between items-center">
                        <div><p class="text-red-800 font-bold text-sm">DESLIGAMENTOS</p><p class="text-xs text-red-600">Turnover Absoluto</p></div>
                        <span class="text-3xl font-black text-red-700" id="kpi-term-period">-</span>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="card p-6 col-span-1 lg:col-span-2">
                        <div class="flex justify-between items-center mb-4">
                            <h4 class="font-bold text-gray-800">📈 Curva de Crescimento Salarial (Geral)</h4>
                            <span class="text-xs bg-gray-100 px-2 py-1 rounded">Evolução Mensal</span>
                        </div>
                        <div class="h-64 chart-container"><canvas id="chart-salary-curve"></canvas></div>
                    </div>
                    
                    <div class="card p-6">
                        <h4 class="font-bold text-gray-800 mb-4">📊 Promoções vs. Desligamentos</h4>
                        <div class="h-64 chart-container"><canvas id="chart-movements"></canvas></div>
                    </div>

                    <div class="card p-6">
                        <h4 class="font-bold text-gray-800 mb-4" id="salary-chart-title">👔 Curva de Crescimento Salarial (Setor)</h4>
                        <div class="h-64 chart-container"><canvas id="chart-hierarchy"></canvas></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    populateSectorFilter();
    applyFilters();
    
    // Iniciar Mapa (com pequeno delay para o DOM estar pronto)
    setTimeout(renderMap, 100);
}

function populateSectorFilter() {
    const select = document.getElementById('rep-sector');
    if (!select) return;
    const sectors = [...new Set(state.employees.map(e => e.sector))].sort();
    select.innerHTML = '<option value="all">🏢 Todos os Setores</option>';
    sectors.forEach(sector => {
        const option = document.createElement('option');
        option.value = sector;
        option.textContent = sector;
        if (filterState.sector === sector) option.selected = true;
        select.appendChild(option);
    });
}

// --- Funções de Controle de Estado ---

export function updateFilterState(key, value) {
    filterState[key] = value;
    if(key === 'sector') {
        applyFilters();
        renderMap(); // Atualizar mapa também ao filtrar setor
    }
}

export function setPeriod(type) {
    filterState.periodType = type;
    if (type !== 'custom') {
        const dates = getPeriodDates(type);
        filterState.startDate = dates.start;
        filterState.endDate = dates.end;
        document.getElementById('rep-start').value = dates.start;
        document.getElementById('rep-end').value = dates.end;
        applyFilters();
    }
    renderReportsView();
}

export function updateCustomDate() {
    filterState.periodType = 'custom';
    filterState.startDate = document.getElementById('rep-start').value;
    filterState.endDate = document.getElementById('rep-end').value;
    document.querySelectorAll('button').forEach(b => {
        if(b.textContent === 'Custom') b.classList.add('bg-nordeste-red', 'text-white');
        else if (['Mês', 'Ano', 'Trimestre', 'Semestre', 'Tudo'].includes(b.textContent)) b.classList.remove('bg-nordeste-red', 'text-white');
    });
}

// --- MAPA LEAFLET ---
function renderMap() {
    const mapEl = document.getElementById('map-density');
    if (!mapEl) return;

    // Destruir mapa anterior se existir para evitar erro "Map container is already initialized"
    if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
    }

    // Inicializar mapa (Centrado em Recife por padrão)
    mapInstance = L.map('map-density').setView([-8.0476, -34.8770], 11);

    // Adicionar camada de tiles (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapInstance);

    // Filtrar dados para o mapa
    const filteredEmployees = state.employees.filter(emp => {
        const matchesSector = filterState.sector === 'all' || emp.sector === filterState.sector;
        const isActive = emp.type !== 'Desligado';
        // Verificar se tem lat/lng
        const hasCoords = emp.lat && emp.lng;
        return matchesSector && isActive && hasCoords;
    });

    // Ícone personalizado (pin vermelho)
    const redIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #D32F2F; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
    });

    const markers = [];

    filteredEmployees.forEach(emp => {
        const marker = L.marker([emp.lat, emp.lng], { icon: redIcon }).addTo(mapInstance);
        
        // Popup com info do funcionário
        const popupContent = `
            <div style="text-align: center;">
                <img src="${emp.photoUrl}" style="width: 40px; height: 40px; border-radius: 50%; margin: 0 auto 5px; object-fit: cover;">
                <strong style="display: block; color: #333; font-size: 14px;">${emp.name}</strong>
                <span style="font-size: 11px; color: #666;">${emp.role}</span><br>
                <span style="font-size: 10px; color: #888;">${emp.neighborhood || 'Bairro N/A'}</span>
            </div>
        `;
        marker.bindPopup(popupContent);
        markers.push(marker);
    });

    // Ajustar zoom para caber todos os pontos
    if (markers.length > 0) {
        const group = new L.featureGroup(markers);
        mapInstance.fitBounds(group.getBounds().pad(0.1));
    }
}

// --- Lógica Principal de Dados ---

export async function applyFilters() {
    ['kpi-headcount', 'kpi-age', 'kpi-payroll', 'kpi-avg-sal', 'kpi-promo-period', 'kpi-term-period'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.innerHTML = '<span class="text-gray-300 animate-pulse">...</span>';
    });

    try {
        const queryBasic = `?sector=${encodeURIComponent(filterState.sector)}&name=${encodeURIComponent(filterState.searchName)}`;
        const queryAnalytics = `?startDate=${filterState.startDate}&endDate=${filterState.endDate}&sector=${encodeURIComponent(filterState.sector)}&name=${encodeURIComponent(filterState.searchName)}`;
        
        const [statsRes, chartRes, analyticsRes] = await Promise.all([
            fetch(`/api/stats${queryBasic}`),
            fetch(`/api/charts${queryBasic}`), 
            fetch(`/api/analytics${queryAnalytics}`)
        ]);

        const stats = await statsRes.json();
        const chartsData = await chartRes.json();
        const analytics = await analyticsRes.json();

        updateKPIs(stats, analytics);
        renderAllCharts(chartsData, analytics.charts);

    } catch (e) {
        console.error("Erro ao aplicar filtros:", e);
    }
}

function updateKPIs(stats, analytics) {
    const fmtMoney = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    animateValue(document.getElementById('kpi-headcount'), stats.activeEmployees);
    animateValue(document.getElementById('kpi-age'), stats.avgAge, false); 
    document.getElementById('kpi-payroll').innerText = fmtMoney(stats.totalPayroll);
    document.getElementById('kpi-avg-sal').innerText = fmtMoney(stats.avgSalary);

    animateValue(document.getElementById('kpi-promo-period'), analytics.summary.promotions);
    animateValue(document.getElementById('kpi-term-period'), analytics.summary.terminations);
}

function renderAllCharts(demogData, analyticsData) {
    const commonOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } };
    
    // 1. Age Distribution (Bar)
    createChart('chart-age-dist', 'bar', {
        labels: demogData.ageDistribution.map(d => d.label),
        datasets: [{
            label: 'Colaboradores',
            data: demogData.ageDistribution.map(d => d.value),
            backgroundColor: '#8B5CF6',
            borderRadius: 4
        }]
    }, commonOpts);

    // 2. Sector Cost (Pie)
    createChart('chart-sector-cost', 'doughnut', {
        labels: demogData.sectorCosts.map(d => d.label),
        datasets: [{
            data: demogData.sectorCosts.map(d => d.value),
            backgroundColor: ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1'],
            borderWidth: 0
        }]
    }, { ...commonOpts, cutout: '60%' });

    // 3. CURVA DE CRESCIMENTO SALARIAL (SETOR) - Alterado
    // Processa cores para as linhas
    const lineColors = ['#D32F2F', '#1976D2', '#388E3C', '#FBC02D', '#7B1FA2', '#E64A19', '#5D4037'];
    
    // Aplica cores aos datasets retornados do backend
    const sectorDatasets = analyticsData.sectorGrowth.map((dataset, i) => ({
        ...dataset,
        borderColor: lineColors[i % lineColors.length],
        backgroundColor: lineColors[i % lineColors.length],
        fill: false,
        tension: 0.3,
        spanGaps: true // Permite linhas contínuas mesmo com dados nulos (meses sem movimento)
    }));

    createChart('chart-hierarchy', 'line', {
        labels: analyticsData.labels, // Eixo X: Meses
        datasets: sectorDatasets
    }, { 
        ...commonOpts, 
        scales: { 
            y: { 
                beginAtZero: false, 
                title: { display: true, text: 'Salário Médio (R$)' } 
            } 
        } 
    });

    // 4. Salary Curve (Geral)
    createChart('chart-salary-curve', 'line', {
        labels: analyticsData.labels,
        datasets: [{
            label: 'Média Geral',
            data: analyticsData.salaryCurve,
            borderColor: '#D32F2F',
            backgroundColor: 'rgba(211, 47, 47, 0.1)',
            fill: true,
            tension: 0.4
        }]
    }, commonOpts);

    // 5. Movements (Bar Grouped)
    createChart('chart-movements', 'bar', {
        labels: analyticsData.labels,
        datasets: [
            {
                label: 'Promoções',
                data: analyticsData.promotions,
                backgroundColor: '#10B981',
                borderRadius: 2
            },
            {
                label: 'Desligamentos',
                data: analyticsData.terminations,
                backgroundColor: '#EF4444',
                borderRadius: 2
            }
        ]
    }, { ...commonOpts, scales: { x: { stacked: false }, y: { beginAtZero: true } } });
}

// Helper Genérico Chart.js
function createChart(id, type, data, options) {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    
    // Destruir anterior se existir na lista global
    if (charts[id]) {
        charts[id].destroy();
        delete charts[id];
    }

    // Criar novo gráfico
    try {
        charts[id] = new Chart(canvas.getContext('2d'), { type, data, options });
    } catch (e) {
        console.error(`Erro ao criar gráfico ${id}:`, e);
    }
}

function animateValue(obj, end, isInt = true) {
    if(!obj) return;
    const duration = 500;
    const start = 0;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const val = progress * end;
        obj.innerHTML = isInt ? Math.floor(val) : val.toFixed(1);
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}
