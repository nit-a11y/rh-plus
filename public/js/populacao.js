/**
 * MÓDULO DE CONTROLE POPULACIONAL
 * JavaScript independente para gestão de população por unidade
 * Fonte de dados: APIs /api/population/*
 */

// Variáveis globais
let evolutionChart = null;
let movementChart = null;
let currentData = {
    summary: null,
    units: [],
    history: [],
    trends: null
};

// Inicialização do módulo
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadAllData();
        initializeCharts();
        setupEventListeners();
        updateLastUpdateTime();
    } catch (error) {
        console.error('Erro ao inicializar módulo:', error);
        showToast('Erro ao carregar dados iniciais', 'error');
    }
});

// Carregar todos os dados iniciais
async function loadAllData() {
    try {
        // Carregar em paralelo para melhor performance
        const [summaryRes, unitsRes, trendsRes] = await Promise.all([
            fetch('/api/population/summary'),
            fetch('/api/population/units'),
            fetch('/api/population/trends')
        ]);

        if (!summaryRes.ok || !unitsRes.ok || !trendsRes.ok) {
            throw new Error('Erro ao buscar dados da API');
        }

        const [summaryData, unitsData, trendsData] = await Promise.all([
            summaryRes.json(),
            unitsRes.json(),
            trendsRes.json()
        ]);

        currentData.summary = summaryData.data;
        currentData.units = unitsData.data;
        currentData.trends = trendsData.data;

        // Atualizar UI
        updateSummaryCards();
        updateUnitsTable();
        renderCharts();

    } catch (error) {
        console.error('Erro em loadAllData:', error);
        throw error;
    }
}

// Atualizar cards de resumo
function updateSummaryCards() {
    const summary = currentData.summary;
    
    // Remover estados de loading
    document.getElementById('total-units-loading').style.display = 'none';
    document.getElementById('total-employees-loading').style.display = 'none';
    document.getElementById('avg-employees-loading').style.display = 'none';
    document.getElementById('growth-rate-loading').style.display = 'none';

    // Atualizar valores
    const totalUnits = summary.total_units || 0;
    document.getElementById('total-units').textContent = totalUnits;
    document.getElementById('total-employees').textContent = summary.total_employees || 0;
    // Calcular média por unidade: total_colaboradores / total_unidades
    const avgEmployees = totalUnits > 0 ? (summary.total_employees / totalUnits).toFixed(1) : 0;
    document.getElementById('avg-employees').textContent = avgEmployees;
    
    // Calcular taxa de crescimento (simulada por enquanto)
    const growthRate = calculateGrowthRate();
    document.getElementById('growth-rate').textContent = growthRate;
}

// Atualizar tabela de unidades
function updateUnitsTable() {
    const tbody = document.getElementById('units-table-body');
    const loading = document.getElementById('units-loading');
    
    if (!currentData.units.length) {
        loading.innerHTML = `
            <div class="p-8 text-center text-gray-400">
                <svg class="w-8 h-8 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-width="2.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p class="text-xs font-black uppercase">Nenhuma unidade encontrada</p>
            </div>
        `;
        return;
    }

    loading.style.display = 'none';
    
    tbody.innerHTML = currentData.units.map(unit => `
        <tr class="hover:bg-gray-50 transition-colors">
            <td class="p-4">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 bg-nordeste-red rounded-lg flex items-center justify-center">
                        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-width="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                    </div>
                    <div>
                        <p class="text-sm font-black text-gray-800 uppercase">${unit.unit_name}</p>
                        <p class="text-xs text-gray-400">${unit.type || 'UNIDADE'}</p>
                    </div>
                </div>
            </td>
            <td class="p-4 text-center">
                <p class="text-xs font-mono text-gray-600">${formatCNPJ(unit.cnpj)}</p>
            </td>
            <td class="p-4 text-center">
                <span class="text-sm font-black text-gray-800">${unit.total_employees || 0}</span>
            </td>
            <td class="p-4 text-center">
                <span class="text-sm font-black text-green-600">${unit.active_employees || 0}</span>
            </td>
            <td class="p-4 text-center">
                <span class="text-sm font-black text-red-600">${unit.inactive_employees || 0}</span>
            </td>
            <td class="p-4 text-center">
                <div class="flex items-center justify-center">
                    <div class="w-16 bg-gray-200 rounded-full h-2">
                        <div class="bg-green-500 h-2 rounded-full" style="width: ${unit.active_percentage || 0}%"></div>
                    </div>
                    <span class="ml-2 text-xs font-bold text-gray-600">${unit.active_percentage || 0}%</span>
                </div>
            </td>
            <td class="p-4 text-center">
                <span class="text-sm font-bold ${getGrowthClass(unit.growth_month_over_month)}">
                    ${formatGrowth(unit.growth_month_over_month)}
                </span>
            </td>
        </tr>
    `).join('');
}

// Inicializar gráficos
function initializeCharts() {
    // Gráfico de Evolução Temporal
    const evolutionCtx = document.getElementById('evolution-chart').getContext('2d');
    evolutionChart = new Chart(evolutionCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Total de Colaboradores',
                data: [],
                borderColor: '#D32F2F',
                backgroundColor: 'rgba(211, 47, 47, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }, {
                label: 'Colaboradores Ativos',
                data: [],
                borderColor: '#059669',
                backgroundColor: 'rgba(5, 150, 105, 0.1)',
                borderWidth: 2,
                fill: false,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { size: 10, weight: 'bold' },
                        usePointStyle: true
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { font: { size: 10 } }
                },
                x: {
                    ticks: { font: { size: 10 } }
                }
            }
        }
    });

    // Gráfico de Movimentação
    const movementCtx = document.getElementById('movement-chart').getContext('2d');
    movementChart = new Chart(movementCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Admissões',
                data: [],
                backgroundColor: '#059669',
                borderRadius: 4
            }, {
                label: 'Desligamentos',
                data: [],
                backgroundColor: '#DC2626',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { size: 10, weight: 'bold' },
                        usePointStyle: true
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { font: { size: 10 } }
                },
                x: {
                    ticks: { font: { size: 10 } }
                }
            }
        }
    });
}

// Renderizar gráficos com dados
function renderCharts() {
    if (!currentData.trends) return;

    const { monthly_evolution, admissions_vs_terminations } = currentData.trends;

    // Atualizar gráfico de evolução
    if (evolutionChart && monthly_evolution.length) {
        evolutionChart.data.labels = monthly_evolution.map(item => 
            new Date(item.month).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
        );
        evolutionChart.data.datasets[0].data = monthly_evolution.map(item => item.total_employees);
        evolutionChart.data.datasets[1].data = monthly_evolution.map(item => item.active_employees);
        evolutionChart.update();
    }

    // Atualizar gráfico de movimentação
    if (movementChart && admissions_vs_terminations.length) {
        movementChart.data.labels = admissions_vs_terminations.map(item => 
            new Date(item.month).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
        );
        movementChart.data.datasets[0].data = admissions_vs_terminations.map(item => item.admissions);
        movementChart.data.datasets[1].data = admissions_vs_terminations.map(item => item.terminations);
        movementChart.update();
    }
}

// Atualizar gráficos com base no período selecionado
async function updateCharts() {
    const period = document.getElementById('period-filter').value;
    
    try {
        const response = await fetch(`/api/population/trends?period=${period}`);
        
        if (!response.ok) {
            throw new Error('Erro ao atualizar gráficos');
        }
        
        const data = await response.json();
        currentData.trends = data.data;
        renderCharts();
        
    } catch (error) {
        console.error('Erro ao atualizar gráficos:', error);
        showToast('Erro ao atualizar gráficos', 'error');
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Preencher anos nos seletores
    populateYearSelectors();
    
    // Definir valores padrão (últimos 6 meses)
    const today = new Date();
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, 1);
    
    document.getElementById('history-start-month').value = String(sixMonthsAgo.getMonth() + 1).padStart(2, '0');
    document.getElementById('history-start-year').value = sixMonthsAgo.getFullYear();
    
    document.getElementById('history-end-month').value = String(today.getMonth() + 1).padStart(2, '0');
    document.getElementById('history-end-year').value = today.getFullYear();
}

// Preencher seletores de anos
function populateYearSelectors() {
    const currentYear = new Date().getFullYear();
    const startYear = 2017; // Ano mais antigo dos dados
    
    const startSelectors = [document.getElementById('history-start-year'), document.getElementById('history-end-year')];
    
    startSelectors.forEach(selector => {
        if (selector) {
            selector.innerHTML = '';
            for (let year = startYear; year <= currentYear + 1; year++) {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                option.selected = year === currentYear;
                selector.appendChild(option);
            }
        }
    });
}

// Atualizar dados
async function refreshData() {
    const btn = document.getElementById('btn-refresh');
    const originalContent = btn.innerHTML;
    
    try {
        // Mostrar loading
        btn.innerHTML = `
            <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Atualizando...
        `;
        btn.disabled = true;

        // Chamar API de refresh
        const response = await fetch('/api/population/refresh', { method: 'POST' });
        
        if (!response.ok) {
            throw new Error('Erro ao atualizar dados');
        }

        const result = await response.json();
        
        // Recarregar dados
        await loadAllData();
        updateLastUpdateTime();
        
        showToast(`Dados atualizados com sucesso! ${result.updated_units} unidades processadas`, 'success');
        
    } catch (error) {
        console.error('Erro ao atualizar dados:', error);
        showToast('Erro ao atualizar dados. Tente novamente.', 'error');
    } finally {
        // Restaurar botão
        btn.innerHTML = originalContent;
        btn.disabled = false;
    }
}

// Carregar histórico
async function loadHistory() {
    const startMonth = document.getElementById('history-start-month').value;
    const startYear = document.getElementById('history-start-year').value;
    const endMonth = document.getElementById('history-end-month').value;
    const endYear = document.getElementById('history-end-year').value;
    
    // Construir datas no formato YYYY-MM-DD (sempre dia 01)
    const startDate = `${startYear}-${startMonth}-01`;
    const endDate = `${endYear}-${endMonth}-01`;
    
    const loading = document.getElementById('history-loading');
    const tbody = document.getElementById('history-table-body');
    
    try {
        loading.style.display = 'block';
        tbody.innerHTML = '';
        
        const response = await fetch(`/api/population/history?start_date=${startDate}&end_date=${endDate}`);
        
        if (!response.ok) {
            throw new Error('Erro ao carregar histórico');
        }
        
        const data = await response.json();
        currentData.history = data.data;
        
        if (!currentData.history.length) {
            loading.innerHTML = `
                <div class="p-8 text-center text-gray-400">
                    <svg class="w-8 h-8 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-width="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p class="text-xs font-black uppercase">Nenhum registro encontrado no período</p>
                </div>
            `;
            return;
        }
        
        loading.style.display = 'none';
        
        tbody.innerHTML = currentData.history.map(record => `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="p-4">
                    <span class="text-sm font-black text-gray-800">
                        ${new Date(record.record_date).toLocaleDateString('pt-BR')}
                    </span>
                </td>
                <td class="p-4">
                    <span class="text-sm font-bold text-gray-700">${record.unit_name}</span>
                </td>
                <td class="p-4 text-center">
                    <span class="text-sm font-black text-gray-800">${record.total_employees}</span>
                </td>
                <td class="p-4 text-center">
                    <span class="text-sm font-black text-green-600">${record.active_employees}</span>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        loading.innerHTML = `
            <div class="p-8 text-center text-red-400">
                <p class="text-xs font-black uppercase">Erro ao carregar histórico</p>
            </div>
        `;
    }
}

// Atualizar gráficos com base no período selecionado
async function updateCharts() {
    const period = document.getElementById('period-filter').value;
    
    try {
        const response = await fetch(`/api/population/trends?period=${period}`);
        
        if (!response.ok) {
            throw new Error('Erro ao atualizar gráficos');
        }
        
        const data = await response.json();
        currentData.trends = data.data;
        renderCharts();
        
    } catch (error) {
        console.error('Erro ao atualizar gráficos:', error);
        showToast('Erro ao atualizar gráficos', 'error');
    }
}

// Filtrar unidades na tabela
function filterUnits() {
    const searchTerm = document.getElementById('unit-search').value.toLowerCase();
    const rows = document.querySelectorAll('#units-table-body tr');
    
    rows.forEach(row => {
        const unitName = row.querySelector('td:first-child p').textContent.toLowerCase();
        const visible = unitName.includes(searchTerm);
        row.style.display = visible ? '' : 'none';
    });
}

// Exportar para PDF
async function exportPDF() {
    showToast('Funcionalidade de exportação PDF em desenvolvimento', 'warning');
}

// Exportar para Excel
async function exportExcel() {
    showToast('Funcionalidade de exportação Excel em desenvolvimento', 'warning');
}

// Utilitários
function formatCNPJ(cnpj) {
    if (!cnpj) return 'N/A';
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

function formatGrowth(growth) {
    if (!growth || growth === 0) return '0%';
    const sign = growth > 0 ? '+' : '';
    return `${sign}${growth}%`;
}

function getGrowthClass(growth) {
    if (!growth || growth === 0) return 'text-gray-600';
    return growth > 0 ? 'text-green-600' : 'text-red-600';
}

function calculateGrowthRate() {
    // Calcular média de ativos por unidade: total_ativos / total_unidades
    const activeEmployees = currentData.summary?.active_employees || 0;
    const totalUnits = currentData.summary?.total_units || 0;
    
    if (totalUnits === 0) return '0';
    
    const average = (activeEmployees / totalUnits).toFixed(1);
    return average;
}

function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    document.getElementById('last-update').textContent = timeString;
}

// Sistema de notificações (Toast)
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    const icons = {
        success: '<path stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />',
        error: '<path stroke-width="2.5" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />',
        warning: '<path stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />',
        info: '<path stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />'
    };
    
    const colors = {
        success: 'text-green-600',
        error: 'text-red-600',
        warning: 'text-amber-600',
        info: 'text-blue-600'
    };
    
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <svg class="w-5 h-5 ${colors[type]}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            ${icons[type]}
        </svg>
        <p class="text-sm font-medium text-gray-800">${message}</p>
    `;
    
    container.appendChild(toast);
    
    // Auto remover após 5 segundos
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => {
            container.removeChild(toast);
        }, 300);
    }, 5000);
}

// Adicionar animação de saída ao CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        to {
            transform: translateX(120%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
