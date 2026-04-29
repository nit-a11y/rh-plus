/**
 * MÓDULO DE HISTÓRICO POPULACIONAL - CÓPIA INDEPENDENTE
 * Cópia exata da funcionalidade para uso em outros módulos
 */

// Variáveis globais para o módulo de histórico
let historicoData = {
    history: []
};

// Carregar histórico populacional
async function loadHistoricoPopulacional() {
    const startMonth = document.getElementById('historico-start-month')?.value;
    const startYear = document.getElementById('historico-start-year')?.value;
    const endMonth = document.getElementById('historico-end-month')?.value;
    const endYear = document.getElementById('historico-end-year')?.value;
    
    // Se os seletores não existirem, usa valores padrão
    const today = new Date();
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, 1);
    
    const startDate = startMonth && startYear ? `${startYear}-${startMonth}-01` : 
                     `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}-01`;
    const endDate = endMonth && endYear ? `${endYear}-${endMonth}-01` : 
                   `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
    
    const loading = document.getElementById('historico-loading');
    const tbody = document.getElementById('historico-table-body');
    
    if (!loading || !tbody) {
        console.error('Elementos do histórico não encontrados');
        return;
    }
    
    try {
        loading.style.display = 'block';
        tbody.innerHTML = '';
        
        const response = await fetch(`/api/population/history?start_date=${startDate}&end_date=${endDate}`);
        
        if (!response.ok) {
            throw new Error('Erro ao carregar histórico');
        }
        
        const data = await response.json();
        historicoData.history = data.data;
        
        if (!historicoData.history.length) {
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
        
        tbody.innerHTML = historicoData.history.map(record => `
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

// Preencher seletores de anos para histórico
function populateHistoricoYearSelectors() {
    const currentYear = new Date().getFullYear();
    const startYear = 2017; // Ano mais antigo dos dados
    
    const selectors = [
        document.getElementById('historico-start-year'),
        document.getElementById('historico-end-year')
    ];
    
    selectors.forEach(selector => {
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

// Inicializar módulo de histórico
function initializeHistoricoPopulacional() {
    // Preencher anos
    populateHistoricoYearSelectors();
    
    // Definir valores padrão (últimos 6 meses)
    const today = new Date();
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, 1);
    
    const startMonthSelect = document.getElementById('historico-start-month');
    const startYearSelect = document.getElementById('historico-start-year');
    const endMonthSelect = document.getElementById('historico-end-month');
    const endYearSelect = document.getElementById('historico-end-year');
    
    if (startMonthSelect) startMonthSelect.value = String(sixMonthsAgo.getMonth() + 1).padStart(2, '0');
    if (startYearSelect) startYearSelect.value = sixMonthsAgo.getFullYear();
    if (endMonthSelect) endMonthSelect.value = String(today.getMonth() + 1).padStart(2, '0');
    if (endYearSelect) endYearSelect.value = today.getFullYear();
    
    // Carregar dados iniciais
    loadHistoricoPopulacional();
}

// Exportar funções para uso global
window.historicoPopulacional = {
    loadHistoricoPopulacional,
    initializeHistoricoPopulacional
};
