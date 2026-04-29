/**
 * MÓDULO DE ANÁLISE DE HORA EXTRA
 * Baseado na estrutura e APIs do módulo hora-extra.html existente
 */

// Mapeamento de meses para ordenação cronológica
const MONTH_ORDER = {
    'JANEIRO': 1, 'FEVEREIRO': 2, 'MARÇO': 3, 'ABRIL': 4,
    'MAIO': 5, 'JUNHO': 6, 'JULHO': 7, 'AGOSTO': 8,
    'SETEMBRO': 9, 'OUTUBRO': 10, 'NOVEMBRO': 11, 'DEZEMBRO': 12
};

// Variáveis globais
let allOvertime = [];
let filteredData = [];
let summaryData = [];

// Função de ordenação cronológica para strings "MÊS ANO"
function sortMonthYear(a, b) {
    // Extrair mês e ano
    const [monthA, yearA] = a.split(' ');
    const [monthB, yearB] = b.split(' ');
    
    // Ordenar por ano, depois por mês
    if (yearA !== yearB) {
        return yearB.localeCompare(yearA); // Ano descendente (mais recente primeiro)
    }
    
    // Mesmo ano, ordenar por mês usando mapeamento
    const monthOrderA = MONTH_ORDER[monthA] || 0;
    const monthOrderB = MONTH_ORDER[monthB] || 0;
    return monthOrderB - monthOrderA; // Mês descendente (mais recente primeiro)
}

// Função de ordenação para mês apenas (sem ano)
function sortMonthOnly(a, b) {
    const monthOrderA = MONTH_ORDER[a] || 0;
    const monthOrderB = MONTH_ORDER[b] || 0;
    return monthOrderB - monthOrderA; // Meses recentes primeiro
}

// Funções de máscara e formatação
function formatCurrency(value) {
    if (value === undefined || value === null || isNaN(value)) return 'R$ 0,00';
    
    const numValue = parseFloat(value);
    if (numValue === 0) return 'R$ 0,00';
    
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(numValue);
}

function formatTime(totalMinutes) {
    if (totalMinutes === 0) return '00:00';
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function formatNumber(value) {
    if (value === undefined || value === null || isNaN(value)) return '0';
    
    return new Intl.NumberFormat('pt-BR').format(value);
}

function formatTimeDisplay(timeStr) {
    if (!timeStr || timeStr === '--:--') return '--:--';
    
    // Se já está no formato HH:MM, retorna como está
    if (timeStr.includes(':')) {
        const [hours, minutes] = timeStr.split(':');
        const h = parseInt(hours) || 0;
        const m = parseInt(minutes) || 0;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }
    
    return timeStr;
}

// Máscara robusta para normalizar dados de MÊS + ANO
function normalizeMonthYear(monthYearStr) {
    if (!monthYearStr) return { month: '', year: '', normalized: '', sortKey: '' };
    
    // Limpar e normalizar a string
    const cleaned = monthYearStr.toString().trim().toUpperCase();
    
    // Padrões possíveis:
    // "JANEIRO 2025", "JANEIRO 25", "JAN 2025", "JAN 25", "2025 JANEIRO", etc.
    
    let month = '';
    let year = '';
    
    // Mapeamento de abreviações e variações
    const monthMap = {
        'JANEIRO': 'JANEIRO', 'JAN': 'JANEIRO', 'JAN.': 'JANEIRO',
        'FEVEREIRO': 'FEVEREIRO', 'FEV': 'FEVEREIRO', 'FEV.': 'FEVEREIRO',
        'MARÇO': 'MARÇO', 'MARCO': 'MARÇO', 'MAR': 'MARÇO', 'MAR.': 'MARÇO',
        'ABRIL': 'ABRIL', 'ABR': 'ABRIL', 'ABR.': 'ABRIL',
        'MAIO': 'MAIO', 'MAI': 'MAIO', 'MAI.': 'MAIO',
        'JUNHO': 'JUNHO', 'JUN': 'JUNHO', 'JUN.': 'JUNHO',
        'JULHO': 'JULHO', 'JUL': 'JULHO', 'JUL.': 'JULHO',
        'AGOSTO': 'AGOSTO', 'AGO': 'AGOSTO', 'AGO.': 'AGOSTO',
        'SETEMBRO': 'SETEMBRO', 'SET': 'SETEMBRO', 'SET.': 'SETEMBRO',
        'OUTUBRO': 'OUTUBRO', 'OUT': 'OUTUBRO', 'OUT.': 'OUTUBRO',
        'NOVEMBRO': 'NOVEMBRO', 'NOV': 'NOVEMBRO', 'NOV.': 'NOVEMBRO',
        'DEZEMBRO': 'DEZEMBRO', 'DEZ': 'DEZEMBRO', 'DEZ.': 'DEZEMBRO'
    };
    
    const parts = cleaned.split(/\s+/);
    
    for (const part of parts) {
        // Verificar se é um mês
        if (monthMap[part]) {
            month = monthMap[part];
        }
        // Verificar se é um ano (4 dígitos ou 2 dígitos)
        else if (/^\d{2,4}$/.test(part)) {
            if (part.length === 2) {
                // Converter 2 dígitos para 4 (assumir século 2000)
                const yearNum = parseInt(part);
                year = (yearNum >= 50 ? 1900 + yearNum : 2000 + yearNum).toString();
            } else {
                year = part;
            }
        }
    }
    
    // Se não encontrou mês ou ano, tentar outros padrões
    if (!month || !year) {
        // Tentar encontrar mês no início ou fim
        for (const [abbr, full] of Object.entries(monthMap)) {
            if (cleaned.includes(abbr) || cleaned.includes(full)) {
                month = full;
                break;
            }
        }
        
        // Tentar extrair ano com regex
        const yearMatch = cleaned.match(/\b(19|20)\d{2}\b|\b\d{2}\b/);
        if (yearMatch) {
            const foundYear = yearMatch[0];
            if (foundYear.length === 2) {
                const yearNum = parseInt(foundYear);
                year = (yearNum >= 50 ? 1900 + yearNum : 2000 + yearNum).toString();
            } else {
                year = foundYear;
            }
        }
    }
    
    // Criar versão normalizada
    const normalized = month && year ? `${month} ${year}` : cleaned;
    
    // Criar chave de ordenação (YYYY-MM)
    const sortKey = month && year ? `${year}-${MONTH_ORDER[month] || 0}` : cleaned;
    
    return { month, year, normalized, sortKey };
}

// Função melhorada para extrair mês dos dados
function extractMonthFromRecord(record) {
    const monthStr = record.mes || record.MES || record.month_year || '';
    if (!monthStr) return '';
    
    const normalized = normalizeMonthYear(monthStr);
    return normalized.month;
}

// Função melhorada para extrair ano dos dados
function extractYearFromRecord(record) {
    const monthStr = record.mes || record.MES || record.month_year || '';
    if (!monthStr) return '';
    
    const normalized = normalizeMonthYear(monthStr);
    return normalized.year;
}

// Função melhorada para extrair mês/ano normalizado dos dados
function extractMonthYearFromRecord(record) {
    const monthStr = record.mes || record.MES || record.month_year || '';
    if (!monthStr) return '';
    
    return normalizeMonthYear(monthStr).normalized;
}

// Inicializar
document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
});

// Carregar dados usando as APIs existentes
async function loadData() {
    try {
        showLoading(true);
        
        // Carregar dados usando a API do servidor real
        const res = await fetch('/api/overtime');
        const data = await res.json();
        
        if (data.success) {
            allOvertime = data.data || [];
            filteredData = [...allOvertime];
            
            // Popular filtros
            populateFilters();
            
            // Atualizar dashboard
            await updateDashboard();
            
            hideLoading();
        } else {
            throw new Error(data.error || 'Erro ao carregar dados');
        }
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showError(error.message);
    }
}

// Popular filtros baseado nos dados reais
function populateFilters() {
    // Extrair meses puros (sem ano) usando a máscara robusta
    const months = [...new Set(allOvertime.map(r => {
        const month = extractMonthFromRecord(r);
        return month || null;
    }).filter(Boolean))].sort(sortMonthOnly);
    
    // Extrair anos puros usando a máscara robusta
    const years = [...new Set(allOvertime.map(r => {
        const year = extractYearFromRecord(r);
        return year || null;
    }).filter(Boolean))].sort().reverse();
    
    // Extrair unidades
    const units = [...new Set(allOvertime.map(r => r.unidade || r.UNIDADE || '').filter(Boolean))].sort();
    
    // Popular filtro de mês
    const monthSelect = document.getElementById('filter-month');
    if (monthSelect) {
        monthSelect.innerHTML = '<option value="">Todos os meses</option>';
        months.forEach(m => {
            const option = document.createElement('option');
            option.value = m;
            option.textContent = m;
            monthSelect.appendChild(option);
        });
    }
    
    // Popular filtro de ano
    const yearSelect = document.getElementById('filter-year');
    if (yearSelect) {
        yearSelect.innerHTML = '<option value="">Todos os anos</option>';
        years.forEach(y => {
            const option = document.createElement('option');
            option.value = y;
            option.textContent = y;
            yearSelect.appendChild(option);
        });
    }
    
    // Popular filtro de unidade
    const unitSelect = document.getElementById('filter-unit');
    if (unitSelect) {
        unitSelect.innerHTML = '<option value="">Todas as unidades</option>';
        units.forEach(u => {
            const option = document.createElement('option');
            option.value = u;
            option.textContent = u;
            unitSelect.appendChild(option);
        });
    }
}

// Atualizar dashboard com dados filtrados
async function updateDashboard() {
    await updateSummaryCards();
    updateCharts();
    updateUnitsTable();
    updateEmployeesTable();
    updateDetailedTable();
}

// Atualizar cards de resumo
async function updateSummaryCards() {
    const totalRecords = filteredData.length;
    const totalEmployees = new Set(filteredData.map(r => r.employee_id)).size;
    const totalUnits = new Set(filteredData.map(r => r.unidade || r.UNIDADE).filter(Boolean)).size;
    
    // Calcular total de horas e valor
    let totalMinutes = 0;
    let totalValue = 0;
    
    filteredData.forEach(r => {
        // Calcular horas
        const timeStr = r.extra || r.EXTRA || r.overtime_time;
        if (timeStr?.includes(':')) {
            const [h, m] = timeStr.split(':').map(Number);
            totalMinutes += (h * 60) + m;
        }
        
        // Calcular valor
        totalValue += r.valor || r.VALOR || r.overtime_value || 0;
    });
    
    const formattedTime = formatTime(totalMinutes);
    const formattedValue = formatCurrency(totalValue);
    
    // Calcular horas esperadas e porcentagem de extras
    await calculateExpectedHoursAndPercentage(totalMinutes);
    
    // Atualizar cards
    document.getElementById('total-records').textContent = formatNumber(totalRecords);
    document.getElementById('total-hours').textContent = formattedTime;
    document.getElementById('total-value').textContent = formattedValue;
    document.getElementById('overtime-employees-count').textContent = formatNumber(totalEmployees);
    document.getElementById('overtime-units-count').textContent = formatNumber(totalUnits);
}

// Função para calcular horas esperadas e porcentagem de extras equivalentes
async function calculateExpectedHoursAndPercentage(totalExtraMinutes) {
    try {
        // Verificar se há filtros de mês/ano aplicados
        const monthFilter = document.getElementById('filter-month').value;
        const yearFilter = document.getElementById('filter-year').value;
        
        let response;
        let data;
        
        if (monthFilter && yearFilter) {
            // Se há filtro de mês/ano, usar API de histórico para obter dados daquele período
            const monthNumber = MONTH_ORDER[monthFilter.toUpperCase()] || 1;
            const startDate = `${yearFilter}-${monthNumber.toString().padStart(2, '0')}-01`;
            
            // Calcular último dia do mês corretamente
            const lastDayOfMonth = new Date(parseInt(yearFilter), monthNumber, 0).getDate();
            const endDate = `${yearFilter}-${monthNumber.toString().padStart(2, '0')}-${lastDayOfMonth}`;
            
            console.log(`Buscando dados históricos para o período: ${startDate} a ${endDate}`);
            
            response = await fetch(`/api/population/history?start_date=${startDate}&end_date=${endDate}`);
            data = await response.json();
            
            if (!data.success || !data.data) {
                console.log('Não há dados históricos para o período, usando dados atuais');
                // Fallback para dados atuais
                response = await fetch('/api/population/units');
                data = await response.json();
            }
        } else {
            // Se não há filtro de mês/ano, usar dados atuais
            response = await fetch('/api/population/units');
            data = await response.json();
        }
        
        if (data.success && data.data) {
            const unitsData = data.data;
            
            // Mapear colaboradores ativos por unidade
            const activeEmployeesByUnit = {};
            
            // Verificar se são dados de histórico (têm record_date) ou dados atuais
            const isHistoricalData = unitsData.length > 0 && unitsData[0].record_date;
            
            if (isHistoricalData) {
                // Dados históricos: pegar o registro mais recente de cada unidade no período
                const latestRecordsByUnit = {};
                unitsData.forEach(record => {
                    const unitName = record.unit_name || '';
                    if (unitName) {
                        // Se ainda não tiver registro para esta unidade, ou se este for mais recente
                        if (!latestRecordsByUnit[unitName] || 
                            new Date(record.record_date) > new Date(latestRecordsByUnit[unitName].record_date)) {
                            latestRecordsByUnit[unitName] = record;
                        }
                    }
                });
                
                // Mapear colaboradores ativos usando os registros mais recentes
                Object.values(latestRecordsByUnit).forEach(record => {
                    const unitName = record.unit_name || '';
                    if (unitName) {
                        activeEmployeesByUnit[unitName] = parseInt(record.active_employees) || 0;
                    }
                });
                
                console.log('Dados históricos processados:', activeEmployeesByUnit);
            } else {
                // Dados atuais: usar lógica original
                unitsData.forEach(unit => {
                    const unitName = unit.unit_name || unit.name || '';
                    if (unitName) {
                        // Converter para número, pois a API retorna como string
                        activeEmployeesByUnit[unitName] = parseInt(unit.active_employees) || 0;
                    }
                });
                
                console.log('Dados atuais processados:', activeEmployeesByUnit);
            }
            
            // Calcular horas esperadas totais (colaboradores_ativos x 220 horas)
            let totalExpectedHours = 0;
            let totalActiveEmployees = 0;
            
            // Para cada unidade nos dados de horas extras, buscar colaboradores ativos correspondentes
            const uniqueUnits = [...new Set(filteredData.map(r => r.unidade || r.UNIDADE).filter(Boolean))];
            
            uniqueUnits.forEach(unitName => {
                // Tentar encontrar correspondência exata ou aproximada
                let activeEmployees = activeEmployeesByUnit[unitName] || 0;
                
                // Se não encontrar exata, tentar correspondência aproximada
                if (activeEmployees === 0) {
                    const normalizedUnitName = unitName.toUpperCase().trim();
                    const matchingKey = Object.keys(activeEmployeesByUnit).find(key => 
                        key.toUpperCase().trim() === normalizedUnitName ||
                        key.toUpperCase().trim().includes(normalizedUnitName) ||
                        normalizedUnitName.includes(key.toUpperCase().trim())
                    );
                    if (matchingKey) {
                        activeEmployees = activeEmployeesByUnit[matchingKey];
                    }
                }
                
                totalActiveEmployees += activeEmployees;
                totalExpectedHours += activeEmployees * 220; // 220 horas por colaborador ativo
            });
            
            // Converter horas esperadas para minutos
            const expectedMinutes = totalExpectedHours * 60;
            
            // Calcular porcentagem de extras equivalentes
            let extraPercentage = 0;
            if (expectedMinutes > 0) {
                extraPercentage = (totalExtraMinutes / expectedMinutes) * 100;
            }
            
            // Atualizar cards
            document.getElementById('active-employees-total').textContent = formatNumber(totalActiveEmployees);
            document.getElementById('expected-hours-total').textContent = formatTime(expectedMinutes);
            document.getElementById('overtime-percentage-expected').textContent = extraPercentage.toFixed(2) + '%';
            
            // Adicionar indicadores visuais baseados na porcentagem
            const percentageCard = document.getElementById('overtime-percentage-expected').parentElement.parentElement;
            if (extraPercentage > 100) {
                percentageCard.style.borderColor = '#DC2626'; // Vermelho para excesso
            } else if (extraPercentage > 80) {
                percentageCard.style.borderColor = '#F59E0B'; // Laranja para atenção
            } else {
                percentageCard.style.borderColor = '#10B981'; // Verde para normal
            }
            
        } else {
            // Se não conseguir buscar dados, mostrar valores zerados
            document.getElementById('active-employees-total').textContent = '--';
            document.getElementById('expected-hours-total').textContent = '--:--';
            document.getElementById('overtime-percentage-expected').textContent = '--%';
        }
    } catch (error) {
        console.error('Erro ao calcular horas esperadas:', error);
        // Em caso de erro, mostrar valores padrão
        document.getElementById('active-employees-total').textContent = '--';
        document.getElementById('expected-hours-total').textContent = '--:--';
        document.getElementById('overtime-percentage-expected').textContent = '--%';
    }
}

// Atualizar gráficos
function updateCharts() {
    updateEvolutionChart();
    updateUnitsChart();
}

// Gráfico de evolução mensal
function updateEvolutionChart() {
    const ctx = document.getElementById('evolution-chart');
    if (!ctx || !filteredData.length) return;
    
    // Agrupar dados por mês usando a máscara robusta
    const monthlyData = {};
    filteredData.forEach(r => {
        const normalizedMonthYear = extractMonthYearFromRecord(r);
        if (normalizedMonthYear) {
            if (!monthlyData[normalizedMonthYear]) {
                monthlyData[normalizedMonthYear] = {
                    totalValue: 0,
                    totalMinutes: 0,
                    records: 0
                };
            }
            
            monthlyData[normalizedMonthYear].totalValue += r.valor || r.VALOR || r.overtime_value || 0;
            monthlyData[normalizedMonthYear].records += 1;
            
            const timeStr = r.extra || r.EXTRA || r.overtime_time;
            if (timeStr?.includes(':')) {
                const [h, m] = timeStr.split(':').map(Number);
                monthlyData[normalizedMonthYear].totalMinutes += (h * 60) + m;
            }
        }
    });
    
    // Ordenar meses cronologicamente (mais antigo para mais recente no gráfico)
    const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
        // Inverter a ordenação para o gráfico (mais antigo primeiro)
        const normalizedA = normalizeMonthYear(a);
        const normalizedB = normalizeMonthYear(b);
        
        if (normalizedA.year !== normalizedB.year) {
            return normalizedA.year.localeCompare(normalizedB.year); // Ano crescente
        }
        
        // Mesmo ano, ordenar por mês crescente
        const monthOrderA = MONTH_ORDER[normalizedA.month] || 0;
        const monthOrderB = MONTH_ORDER[normalizedB.month] || 0;
        return monthOrderA - monthOrderB; // Mês crescente
    });
    
    // Preparar dados para o gráfico
    const labels = sortedMonths;
    const values = sortedMonths.map(month => monthlyData[month].totalValue);
    
    // Destruir gráfico anterior se existir
    if (window.evolutionChart) {
        window.evolutionChart.destroy();
    }
    
    // Criar novo gráfico
    window.evolutionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Valor Total',
                data: values,
                borderColor: '#D32F2F',
                backgroundColor: 'rgba(211, 47, 47, 0.1)',
                borderWidth: 2,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Valor: ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

// Gráfico de distribuição por unidade
function updateUnitsChart() {
    const ctx = document.getElementById('units-chart');
    if (!ctx || !filteredData.length) return;
    
    // Agrupar dados por unidade
    const unitsData = {};
    filteredData.forEach(r => {
        const unit = r.unidade || r.UNIDADE || 'Sem Unidade';
        if (!unitsData[unit]) {
            unitsData[unit] = {
                totalValue: 0,
                records: 0
            };
        }
        
        unitsData[unit].totalValue += r.valor || r.VALOR || r.overtime_value || 0;
        unitsData[unit].records += 1;
    });
    
    // Preparar dados para o gráfico
    const labels = Object.keys(unitsData);
    const values = labels.map(unit => unitsData[unit].totalValue);
    
    // Destruir gráfico anterior se existir
    if (window.unitsChart) {
        window.unitsChart.destroy();
    }
    
    // Criar novo gráfico
    window.unitsChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    '#D32F2F',
                    '#1976D2',
                    '#388E3C',
                    '#F57C00',
                    '#7B1FA2',
                    '#0097A7',
                    '#689F38',
                    '#F06292'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return context.label + ': ' + formatCurrency(context.parsed) + ' (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });
}

// Atualizar tabela de unidades
function updateUnitsTable() {
    const tbody = document.getElementById('units-table');
    if (!tbody) return;
    
    // Agrupar dados por unidade
    const unitsData = {};
    filteredData.forEach(r => {
        const unit = r.unidade || r.UNIDADE || 'Sem Unidade';
        if (!unitsData[unit]) {
            unitsData[unit] = {
                records: 0,
                employees: new Set(),
                totalMinutes: 0,
                totalValue: 0
            };
        }
        
        unitsData[unit].records += 1;
        unitsData[unit].employees.add(r.employee_id);
        unitsData[unit].totalValue += r.valor || r.VALOR || r.overtime_value || 0;
        
        const timeStr = r.extra || r.EXTRA || r.overtime_time;
        if (timeStr?.includes(':')) {
            const [h, m] = timeStr.split(':').map(Number);
            unitsData[unit].totalMinutes += (h * 60) + m;
        }
    });
    
    // Ordenar por valor total
    const sortedUnits = Object.entries(unitsData)
        .sort((a, b) => b[1].totalValue - a[1].totalValue);
    
    // Gerar HTML
    tbody.innerHTML = sortedUnits.map(([unit, data]) => {
        const formattedTime = formatTime(data.totalMinutes);
        const formattedValue = formatCurrency(data.totalValue);
        
        return `
            <tr>
                <td><strong>${unit}</strong></td>
                <td>${formatNumber(data.records)}</td>
                <td>${formatNumber(data.employees.size)}</td>
                <td><span class="time-badge">${formattedTime}</span></td>
                <td><span class="value-badge">${formattedValue}</span></td>
            </tr>
        `;
    }).join('');
}

// Atualizar tabela de colaboradores
function updateEmployeesTable() {
    const tbody = document.getElementById('employees-table');
    if (!tbody) return;
    
    // Agrupar dados por colaborador
    const employeesData = {};
    filteredData.forEach(r => {
        const empId = r.employee_id;
        if (!employeesData[empId]) {
            employeesData[empId] = {
                name: r.nome || r.NOME || r.employee_name || 'Sem Nome',
                registrationNumber: r.registrationNumber || 'Sem Matrícula',
                records: 0,
                totalMinutes: 0,
                totalValue: 0
            };
        }
        
        employeesData[empId].records += 1;
        employeesData[empId].totalValue += r.valor || r.VALOR || r.overtime_value || 0;
        
        const timeStr = r.extra || r.EXTRA || r.overtime_time;
        if (timeStr?.includes(':')) {
            const [h, m] = timeStr.split(':').map(Number);
            employeesData[empId].totalMinutes += (h * 60) + m;
        }
    });
    
    // Ordenar por valor total (top 10)
    const sortedEmployees = Object.entries(employeesData)
        .sort((a, b) => b[1].totalValue - a[1].totalValue)
        .slice(0, 10);
    
    // Gerar HTML
    tbody.innerHTML = sortedEmployees.map(([empId, data], index) => {
        const formattedTime = formatTime(data.totalMinutes);
        const formattedValue = formatCurrency(data.totalValue);
        
        return `
            <tr>
                <td><strong>${data.name}</strong></td>
                <td>${data.registrationNumber}</td>
                <td>${formatNumber(data.records)}</td>
                <td><span class="time-badge">${formattedTime}</span></td>
                <td><span class="value-badge">${formattedValue}</span></td>
            </tr>
        `;
    }).join('');
}

// Atualizar tabela detalhada
function updateDetailedTable() {
    const tbody = document.getElementById('detailed-table');
    if (!tbody) return;
    
    if (filteredData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-gray-400">Nenhum registro encontrado</td></tr>';
        return;
    }
    
    // Ordenar por mês cronologicamente (mais recente primeiro)
    const sortedData = [...filteredData].sort((a, b) => {
        const monthA = a.mes || a.MES || a.month_year || '';
        const monthB = b.mes || b.MES || b.month_year || '';
        return sortMonthYear(monthA, monthB);
    });
    
    // Gerar HTML
    tbody.innerHTML = sortedData.map(r => {
        const timeStr = formatTimeDisplay(r.extra || r.EXTRA || r.overtime_time || '--:--');
        const valueNum = r.valor || r.VALOR || r.overtime_value || 0;
        const formattedValue = valueNum > 0 ? formatCurrency(valueNum) : '--';
        
        return `
            <tr>
                <td><strong>${extractMonthYearFromRecord(r) || '-'}</strong></td>
                <td>${r.unidade || r.UNIDADE || '-'}</td>
                <td>${r.nome || r.NOME || r.employee_name || '-'}</td>
                <td>${r.registrationNumber || '-'}</td>
                <td>${r.role || '-'}</td>
                <td><span class="time-badge">${timeStr}</span></td>
                <td><span class="value-badge">${formattedValue}</span></td>
            </tr>
        `;
    }).join('');
}

// Aplicar filtros com máscara robusta
async function applyFilters() {
    const month = document.getElementById('filter-month').value;
    const year = document.getElementById('filter-year').value;
    const unit = document.getElementById('filter-unit').value;
    
    // Sincronizar filtro com seção histórica
    if (window.syncUnitFilter && typeof window.syncUnitFilter === 'function') {
        window.syncUnitFilter(unit);
    }
    
    // Também aplicar filtro na tabela de histórico diretamente
    if (window.filterHistoryTable && typeof window.filterHistoryTable === 'function') {
        window.filterHistoryTable(unit);
    }
    
    console.log('Aplicando filtros:', { month, year, unit });
    console.log('Total de dados originais:', allOvertime.length);
    
    // Filtrar dados usando a máscara robusta
    filteredData = allOvertime.filter(r => {
        let match = true;
        
        if (month) {
            const recordMonth = extractMonthFromRecord(r);
            match = match && recordMonth === month;
        }
        
        if (year) {
            const recordYear = extractYearFromRecord(r);
            match = match && recordYear === year;
        }
        
        if (unit) {
            const unitStr = r.unidade || r.UNIDADE || '';
            match = match && unitStr === unit;
        }
        
        return match;
    });
    
    console.log('Total de dados filtrados:', filteredData.length);
    await updateDashboard();
}

// Limpar filtros
async function clearFilters() {
    document.getElementById('filter-month').value = '';
    document.getElementById('filter-year').value = '';
    document.getElementById('filter-unit').value = '';
    
    filteredData = [...allOvertime];
    await updateDashboard();
}

// Atualizar dados (recarregar)
async function refreshData() {
    await loadData();
}

// Exportar dados
function exportData() {
    let csv = 'Mês/Ano,Unidade,Nome,Matrícula,Cargo,Extra,Valor\n';
    
    filteredData.forEach(r => {
        const month = r.mes || r.MES || r.month_year || '';
        const unit = r.unidade || r.UNIDADE || '';
        const name = r.nome || r.NOME || r.employee_name || '';
        const registrationNumber = r.registrationNumber || '';
        const role = r.role || '';
        const extra = r.extra || r.EXTRA || r.overtime_time || '';
        const valueNum = r.valor || r.VALOR || r.overtime_value || 0;
        const value = valueNum > 0 ? valueNum.toFixed(2) : '';
        
        csv += `"${month}","${unit}","${name}","${registrationNumber}","${role}","${extra}","${value}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'analise_hora_extra.csv';
    link.click();
}

// Funções de UI
function showLoading(show = true) {
    const loading = document.getElementById('loading');
    const dashboard = document.getElementById('dashboard');
    const error = document.getElementById('error');
    
    if (show) {
        loading.classList.remove('hidden');
        dashboard.classList.add('hidden');
        error.classList.add('hidden');
    } else {
        loading.classList.add('hidden');
    }
}

function hideLoading() {
    const loading = document.getElementById('loading');
    const dashboard = document.getElementById('dashboard');
    const error = document.getElementById('error');
    
    loading.classList.add('hidden');
    error.classList.add('hidden');
    dashboard.classList.remove('hidden');
}

function showError(message) {
    const loading = document.getElementById('loading');
    const dashboard = document.getElementById('dashboard');
    const error = document.getElementById('error');
    const errorMessage = document.getElementById('error-message');
    
    loading.classList.add('hidden');
    dashboard.classList.add('hidden');
    error.classList.remove('hidden');
    errorMessage.textContent = message;
}

// Exportar funções para uso global
window.loadData = loadData;
window.applyFilters = applyFilters;
window.clearFilters = clearFilters;
window.refreshData = refreshData;
window.exportData = exportData;
