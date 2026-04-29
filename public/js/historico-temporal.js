/**
 * MÓDULO DE HISTÓRICO TEMPORAL - VERSÃO COMPLETA
 * Baseado no populacao.js mas sem gráficos complexos
 * Fonte de dados: APIs /api/population-historico/*
 */

// Variáveis globais do módulo
let currentData = {
    summary: null,
    units: null,
    history: null,
    trends: null
};

// Cache para mapeamento de unidades
let unitMapping = {};

// Função para normalizar nomes de unidades
function normalizeUnitName(name) {
    if (!name) return '';
    
    return name
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remover acentos
        .replace(/[^\w\s]/g, '') // Remover caracteres especiais
        .replace(/\s+/g, ' ') // Normalizar espaços
        .trim();
}

// Função para criar mapeamento entre unidades das duas bases
function createUnitMapping() {
    const populationUnits = currentData.units || [];
    const overtimeUnits = window.allOvertime ? [...new Set(window.allOvertime.map(r => r.unidade || r.UNIDADE).filter(Boolean))] : [];
    
    unitMapping = {};
    
    populationUnits.forEach(popUnit => {
        const normalizedPopName = normalizeUnitName(popUnit.unit_name || popUnit.name);
        
        // Procurar correspondência na base de horas extras
        const matchingOvertimeUnit = overtimeUnits.find(overtimeUnit => {
            const normalizedOvertimeName = normalizeUnitName(overtimeUnit);
            return normalizedPopName === normalizedOvertimeName;
        });
        
        if (matchingOvertimeUnit) {
            unitMapping[normalizedPopName] = matchingOvertimeUnit;
            unitMapping[matchingOvertimeUnit] = normalizedPopName;
        }
    });
    
    console.log('Mapeamento de unidades criado:', unitMapping);
}

// Função para sincronizar filtro de unidade entre seções
function syncUnitFilter(unitName) {
    // Sincronizar filtro da seção principal com a histórica
    const historyUnitFilter = document.getElementById('unit-search');
    if (historyUnitFilter) {
        historyUnitFilter.value = unitName;
        filterHistoryTable(unitName);
        filterUnitsTable(unitName);
    }
}

// Função para formatar CNPJ
function formatCNPJ(cnpj) {
    if (!cnpj) return '-';
    
    // Remove caracteres não numéricos
    const cleanCnpj = cnpj.replace(/\D/g, '');
    
    // Formata CNPJ: XX.XXX.XXX/XXXX-XX
    if (cleanCnpj.length === 14) {
        return cleanCnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    
    return cnpj;
}

// Função para filtrar tabela de unidades por nome
function filterUnitsTable(unitName) {
    const tbody = document.getElementById('units-table-body');
    const loading = document.getElementById('units-loading');
    
    if (!tbody || !currentData.units) return;
    
    if (!unitName) {
        // Mostrar todas as unidades
        updateHistoricoUnitsTable();
        return;
    }
    
    // Filtrar por unidade usando mapeamento
    const normalizedFilterName = normalizeUnitName(unitName);
    const filteredUnits = currentData.units.filter(unit => {
        const normalizedUnitName = normalizeUnitName(unit.unit_name || unit.name);
        return normalizedUnitName.includes(normalizedFilterName);
    });
    
    if (loading) loading.style.display = 'none';
    
    tbody.innerHTML = filteredUnits.map(unit => `
        <tr class="hover:bg-gray-50 transition-colors">
            <td class="p-4">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 bg-nordeste-red rounded-lg flex items-center justify-center">
                        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-width="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                    </div>
                    <div>
                        <p class="text-sm font-black text-gray-800 uppercase">${unit.unit_name || unit.name || '-'}</p>
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
        </tr>
    `).join('');
}

// Função para filtrar tabela de histórico por unidade
function filterHistoryTable(unitName) {
    const tbody = document.getElementById('history-table-body');
    if (!tbody || !currentData.history) return;
    
    if (!unitName) {
        // Mostrar todos os registros
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
                    <span class="text-sm font-black text-gray-800">${record.total_employees || 0}</span>
                </td>
            </tr>
        `).join('');
        return;
    }
    
    // Filtrar por unidade usando a mesma lógica de filterUnits
    const searchTerm = unitName.toLowerCase().trim();
    const rows = document.querySelectorAll('#history-table-body tr');
    
    rows.forEach(row => {
        const unitNameCell = row.querySelector('td:nth-child(2)'); // Data, Unidade, Total
        const unitNameText = unitNameCell?.textContent.toLowerCase() || '';
        
        if (unitNameText.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Variável para controle de inicialização
let historicoInitialized = false;

// Inicialização controlada
function initHistoricoTemporal() {
    if (historicoInitialized) return;
    
    try {
        // Pequeno delay para garantir que os elementos DOM estejam disponíveis
        setTimeout(async () => {
            await loadAllData();
            setupEventListeners();
            updateLastUpdateTime();
            historicoInitialized = true;
            console.log('Módulo de histórico temporal inicializado');
        }, 100);
    } catch (error) {
        console.error('Erro ao inicializar módulo:', error);
    }
}

// Carregar todos os dados iniciais
async function loadAllData() {
    try {
        console.log('Iniciando carregamento de dados do histórico...');
        
        // Carregar em paralelo para melhor performance
        const [summaryRes, unitsRes] = await Promise.all([
            fetch('/api/population/summary'),
            fetch('/api/population/units')
        ]);

        console.log('Status das respostas:', {
            summary: summaryRes.ok,
            units: unitsRes.ok
        });

        if (!summaryRes.ok || !unitsRes.ok) {
            throw new Error('Erro ao buscar dados da API');
        }

        const [summaryData, unitsData] = await Promise.all([
            summaryRes.json(),
            unitsRes.json()
        ]);

        console.log('Dados recebidos:', {
            summary: summaryData,
            unitsCount: unitsData.data?.length || 0
        });

        currentData.summary = summaryData.data;
        currentData.units = unitsData.data;

        console.log('Dados atuais:', currentData);

        // Criar mapeamento de unidades entre as duas bases
        createUnitMapping();

        // Atualizar UI
        updateHistoricoSummaryCards();
        updateHistoricoUnitsTable();

    } catch (error) {
        console.error('Erro em loadAllData:', error);
        throw error;
    }
}

// Atualizar cards de resumo do histórico
function updateHistoricoSummaryCards() {
    const summary = currentData.summary;
    
    console.log('Atualizando cards de resumo. Summary:', summary);
    
    // Verificar se temos dados antes de tentar atualizar
    if (!summary) {
        console.log('Dados de resumo não disponíveis ainda');
        return;
    }
    
    // Remover estados de loading
    const loadingElements = ['historico-total-units-loading', 'historico-total-employees-loading', 'historico-avg-employees-loading', 'historico-growth-rate-loading'];
    loadingElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.style.display = 'none';
    });

    // Atualizar valores com segurança
    const totalUnits = summary.total_units || 0;
    const totalEmployees = summary.total_employees || 0;
    
    console.log('Valores calculados:', {
        totalUnits,
        totalEmployees,
        activeEmployees: summary.active_employees
    });
    
    const totalUnitsElement = document.getElementById('historico-total-units');
    const totalEmployeesElement = document.getElementById('historico-total-employees');
    const avgEmployeesElement = document.getElementById('historico-avg-employees');
    const growthRateElement = document.getElementById('historico-growth-rate');
    
    console.log('Elementos encontrados:', {
        totalUnitsElement: !!totalUnitsElement,
        totalEmployeesElement: !!totalEmployeesElement,
        avgEmployeesElement: !!avgEmployeesElement,
        growthRateElement: !!growthRateElement
    });
    
    if (totalUnitsElement) {
        totalUnitsElement.textContent = totalUnits;
        console.log('Atualizado total-units para:', totalUnits);
    }
    if (totalEmployeesElement) {
        totalEmployeesElement.textContent = totalEmployees;
        console.log('Atualizado total-employees para:', totalEmployees);
    }
    
    // Calcular média por unidade
    const avgEmployees = totalUnits > 0 ? (totalEmployees / totalUnits).toFixed(1) : 0;
    if (avgEmployeesElement) {
        avgEmployeesElement.textContent = avgEmployees;
        console.log('Atualizado avg-employees para:', avgEmployees);
    }
    
    // Calcular média de ativos por unidade
    const avgActive = totalUnits > 0 ? (summary.active_employees / totalUnits).toFixed(1) : 0;
    if (growthRateElement) {
        growthRateElement.textContent = avgActive;
        console.log('Atualizado growth-rate para:', avgActive);
    }
}

// Atualizar tabela de unidades do histórico
function updateHistoricoUnitsTable() {
    const tbody = document.getElementById('units-table-body');
    const loading = document.getElementById('units-loading');
    
    // Verificar se estamos na aba correta antes de tentar atualizar
    if (!tbody || document.getElementById('historico-temporal-section').classList.contains('hidden')) {
        return;
    }
    
    if (!currentData.units || !currentData.units.length) {
        if (loading) {
            loading.innerHTML = `
                <div class="p-8 text-center text-gray-400">
                    <svg class="w-8 h-8 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-width="2.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p class="text-xs font-black uppercase">Nenhuma unidade encontrada</p>
                </div>
            `;
        }
        return;
    }

    if (loading) loading.style.display = 'none';
    
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
                        <p class="text-sm font-black text-gray-800 uppercase">${unit.unit_name || unit.name || '-'}</p>
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
        </tr>
    `).join('');
}

// Carregar histórico temporal
async function loadHistory() {
    const startMonth = document.getElementById('history-start-month').value;
    const startYear = document.getElementById('history-start-year').value;
    const endMonth = document.getElementById('history-end-month').value;
    const endYear = document.getElementById('history-end-year').value;
    const unitFilter = document.getElementById('history-unit-filter').value;
    
    const startDate = `${startYear}-${startMonth}-01`;
    const endDate = `${endYear}-${endMonth}-01`;
    
    const tbody = document.getElementById('history-table-body');
    const loading = document.getElementById('history-loading');
    
    if (loading) {
        loading.style.display = 'block';
        loading.innerHTML = `
            <svg class="w-8 h-8 mx-auto mb-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <p class="text-xs font-black uppercase">Carregando dados históricos...</p>
        `;
    }
    
    try {
        const response = await fetch(`/api/population/history?start_date=${startDate}&end_date=${endDate}`);
        
        if (!response.ok) {
            throw new Error('Erro ao carregar dados históricos');
        }
        
        const data = await response.json();
        
        if (data.success && data.data && data.data.length > 0) {
            currentData.history = data.data;
            if (loading) loading.style.display = 'none';
            
            tbody.innerHTML = data.data.map(record => `
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
                        <span class="text-sm font-black text-gray-800">${record.total_employees || 0}</span>
                    </td>
                </tr>
            `).join('');
        } else {
            if (loading) {
                loading.innerHTML = `
                    <svg class="w-8 h-8 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-width="2.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p class="text-xs font-black uppercase">Nenhum dado encontrado para o período selecionado</p>
                `;
            }
        }
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        if (loading) {
            loading.innerHTML = `
                <svg class="w-8 h-8 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-width="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="text-xs font-black uppercase text-red-600">Erro ao carregar dados. Tente novamente.</p>
            `;
        }
    }
}

// Funções utilitárias
function formatCNPJ(cnpj) {
    if (!cnpj) return '--';
    const cnpjStr = cnpj.toString().padStart(14, '0');
    return cnpjStr.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

function getGrowthClass(growth) {
    if (!growth) return 'text-gray-600';
    const numGrowth = parseFloat(growth);
    if (numGrowth > 0) return 'text-green-600';
    if (numGrowth < 0) return 'text-red-600';
    return 'text-gray-600';
}

function formatGrowth(growth) {
    if (!growth) return '0%';
    const numGrowth = parseFloat(growth);
    return numGrowth > 0 ? `+${numGrowth.toFixed(1)}%` : `${numGrowth.toFixed(1)}%`;
}

function updateLastUpdateTime() {
    const now = new Date();
    const formatted = now.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    const element = document.getElementById('last-update-time');
    if (element) element.textContent = formatted;
}

// Configurar event listeners
function setupEventListeners() {
    const searchInput = document.getElementById('unit-search');
    if (searchInput) {
        searchInput.addEventListener('input', filterUnits);
    }
}

// Filtrar unidades
function filterUnits() {
    const searchTerm = document.getElementById('unit-search').value.toLowerCase();
    const rows = document.querySelectorAll('#units-table-body tr');
    
    rows.forEach(row => {
        const unitName = row.querySelector('td:first-child p:first-child')?.textContent.toLowerCase() || '';
        const unitType = row.querySelector('td:first-child p:last-child')?.textContent.toLowerCase() || '';
        
        if (unitName.includes(searchTerm) || unitType.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Exportar funções para uso global
window.initHistoricoTemporal = initHistoricoTemporal;
window.loadHistory = loadHistory;
window.filterUnits = filterUnits;
window.filterHistoryTable = filterHistoryTable;
