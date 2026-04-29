/**
 * 📊 Módulo Principal do Dashboard para Análise de Hora Extra
 * Responsável por gerenciar toda a lógica do dashboard
 * Segue o princípio de Single Responsibility
 */

class AnaliseHoraExtraDashboard {
    constructor() {
        this.currentTab = 'dashboard';
        this.isLoading = false;
        this.elements = {};
        this.retryAttempts = 0;
        this.maxRetries = 3;
    }

    /**
     * Inicializa o dashboard
     */
    async initialize() {
        try {
            this.cacheElements();
            this.attachEventListeners();
            this.setupAccessibility();
            
            // Carrega dados iniciais
            await this.loadCurrentTab();
            
            console.log('Dashboard inicializado com sucesso');
        } catch (error) {
            console.error('Erro ao inicializar dashboard:', error);
            this.showError('Falha ao inicializar o dashboard');
        }
    }

    /**
     * Cache dos elementos DOM
     */
    cacheElements() {
        this.elements = {
            // Abas
            tabButtons: document.querySelectorAll('.tab-button'),
            tabContents: document.querySelectorAll('.tab-content'),
            
            // Dashboard
            totalRecords: document.getElementById('total-records'),
            totalHours: document.getElementById('total-hours'),
            totalValue: document.getElementById('total-value'),
            avgHours: document.getElementById('avg-hours'),
            avgValue: document.getElementById('avg-value'),
            busiestMonth: document.getElementById('busiest-month'),
            highestValueMonth: document.getElementById('highest-value-month'),
            
            // Comparação
            comparisonTotalUnits: document.getElementById('comparison-total-units'),
            comparisonTotalEmployees: document.getElementById('comparison-total-employees'),
            comparisonTableBody: document.getElementById('comparison-table-body'),
            
            // Loading states
            loadingSpinners: document.querySelectorAll('.loading-spinner')
        };
    }

    /**
     * Anexa event listeners
     */
    attachEventListeners() {
        // Event listeners das abas
        this.elements.tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = e.target.id.replace('tab-', '');
                this.switchTab(tabName);
            });
        });

        // Listener para mudanças nos filtros
        if (window.filterManager) {
            window.filterManager.onFilterChange((filters) => {
                this.loadCurrentTab();
            });
        }

        // Listener para redimensionamento
        window.addEventListener('resize', () => {
            if (window.chartManager) {
                window.chartManager.resizeAllCharts();
            }
        });

        // Atalhos de teclado
        document.addEventListener('keydown', (e) => {
            if (e.altKey) {
                switch(e.key) {
                    case '1':
                        e.preventDefault();
                        this.switchTab('dashboard');
                        break;
                    case '2':
                        e.preventDefault();
                        this.switchTab('comparison');
                        break;
                }
            }
        });
    }

    /**
     * Configura acessibilidade
     */
    setupAccessibility() {
        // Adiciona ARIA labels nas abas
        this.elements.tabButtons.forEach((button, index) => {
            button.setAttribute('role', 'tab');
            button.setAttribute('aria-selected', button.classList.contains('active'));
            button.setAttribute('aria-controls', `${button.id.replace('tab-', '')}-content`);
            button.setAttribute('tabindex', button.classList.contains('active') ? '0' : '-1');
        });

        // Adiciona ARIA attributes nos conteúdos
        this.elements.tabContents.forEach((content) => {
            content.setAttribute('role', 'tabpanel');
            content.setAttribute('aria-labelledby', `tab-${content.id.replace('-content', '')}`);
        });

        // Adiciona caption nas tabelas
        const tables = document.querySelectorAll('table');
        tables.forEach(table => {
            if (!table.querySelector('caption')) {
                const caption = document.createElement('caption');
                caption.className = 'sr-only';
                caption.textContent = 'Tabela de dados de análise de hora extra';
                table.insertBefore(caption, table.firstChild);
            }
        });
    }

    /**
     * Alterna entre abas
     * @param {string} tabName - Nome da aba
     */
    async switchTab(tabName) {
        if (this.isLoading || tabName === this.currentTab) return;

        try {
            this.setLoading(true);
            
            // Esconde todas as abas
            this.elements.tabContents.forEach(content => {
                content.classList.add('hidden');
                content.setAttribute('aria-hidden', 'true');
            });
            
            // Remove classe ativa de todos os botões
            this.elements.tabButtons.forEach(button => {
                button.classList.remove('active');
                button.setAttribute('aria-selected', 'false');
                button.setAttribute('tabindex', '-1');
            });
            
            // Mostra aba selecionada e ativa botão
            const targetContent = document.getElementById(`${tabName}-content`);
            const targetButton = document.getElementById(`tab-${tabName}`);
            
            if (targetContent && targetButton) {
                targetContent.classList.remove('hidden');
                targetContent.setAttribute('aria-hidden', 'false');
                targetButton.classList.add('active');
                targetButton.setAttribute('aria-selected', 'true');
                targetButton.setAttribute('tabindex', '0');
                targetButton.focus();
            }
            
            this.currentTab = tabName;
            
            // Carrega dados específicos da aba
            await this.loadCurrentTab();
            
        } catch (error) {
            console.error(`Erro ao mudar para aba ${tabName}:`, error);
            this.showError(`Falha ao carregar aba ${tabName}`);
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Carrega dados da aba atual
     */
    async loadCurrentTab() {
        if (this.isLoading) return;

        try {
            this.setLoading(true);
            this.retryAttempts = 0;

            switch(this.currentTab) {
                case 'dashboard':
                    await this.loadDashboard();
                    break;
                case 'comparison':
                    await this.loadComparison();
                    break;
                default:
                    console.warn(`Aba desconhecida: ${this.currentTab}`);
            }
        } catch (error) {
            console.error(`Erro ao carregar aba ${this.currentTab}:`, error);
            
            // Tenta novamente se for erro de rede
            if (this.retryAttempts < this.maxRetries && this.isNetworkError(error)) {
                this.retryAttempts++;
                console.log(`Tentando novamente (${this.retryAttempts}/${this.maxRetries})...`);
                setTimeout(() => this.loadCurrentTab(), 1000 * this.retryAttempts);
            } else {
                this.showError('Falha ao carregar dados. Tente novamente.');
            }
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Carrega dados do dashboard
     */
    async loadDashboard() {
        const filters = window.filterManager?.getFilters() || {};
        
        try {
            const response = await window.analiseAPI.getDashboard(filters);
            const data = response.data;
            
            // Atualiza métricas principais
            this.updateMetric(this.elements.totalRecords, data.total_records, 'number');
            this.updateMetric(this.elements.totalHours, data.total_hours, 'hours');
            this.updateMetric(this.elements.totalValue, data.total_value, 'currency');
            
            // Atualiza métricas calculadas
            this.updateMetric(this.elements.avgHours, data.media_horas, 'hours');
            this.updateMetric(this.elements.avgValue, data.media_valor, 'currency');
            
            // Atualiza métricas de período
            this.updateMetric(this.elements.busiestMonth, data.mes_mais_registros, 'text');
            this.updateMetric(this.elements.highestValueMonth, data.mes_maior_valor, 'text');
            
            // Carrega gráficos
            await this.loadEvolutionChart();
            await this.loadSectorChart();
            
        } catch (error) {
            console.error('Erro ao carregar dashboard:', error);
            throw error;
        }
    }

    /**
     * Carrega gráfico de evolução
     */
    async loadEvolutionChart() {
        const filters = window.filterManager?.getFilters() || {};
        
        try {
            const response = await window.analiseAPI.getEvolution(filters);
            window.chartManager.createEvolutionChart('evolution-chart', response.data);
        } catch (error) {
            console.error('Erro ao carregar gráfico de evolução:', error);
            this.showChartError('evolution-chart');
        }
    }

    /**
     * Carrega gráfico de setores
     */
    async loadSectorChart() {
        const filters = window.filterManager?.getFilters() || {};
        
        try {
            const response = await window.analiseAPI.getBySector(filters);
            window.chartManager.createSectorChart('sector-chart', response.data);
        } catch (error) {
            console.error('Erro ao carregar gráfico de setores:', error);
            this.showChartError('sector-chart');
        }
    }

    
    
    /**
     * Atualiza métrica na UI
     * @param {Element} element - Elemento DOM
     * @param {*} value - Valor a ser exibido
     * @param {string} type - Tipo de formatação
     */
    updateMetric(element, value, type = 'text') {
        if (!element) return;

        let formattedValue = value;
        
        switch(type) {
            case 'number':
                formattedValue = value ? value.toLocaleString('pt-BR') : '-';
                break;
            case 'currency':
                formattedValue = this.formatCurrency(value);
                break;
            case 'hours':
                formattedValue = value ? `${value}h` : '-';
                break;
            case 'text':
                formattedValue = value || '-';
                break;
        }
        
        element.textContent = formattedValue;
        element.classList.add('fade-in');
    }

    /**
     * Formata valor para moeda
     * @param {number} value - Valor
     * @returns {string} - Valor formatado
     */
    formatCurrency(value) {
        if (value === undefined || value === null || isNaN(value)) {
            return 'R$ 0,00';
        }
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    /**
     * Escapa HTML para prevenir XSS
     * @param {string} text - Texto a escapar
     * @returns {string} - Texto escapado
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Mostra estado de erro para gráfico
     * @param {string} chartId - ID do gráfico
     */
    showChartError(chartId) {
        const container = document.getElementById(chartId)?.parentElement;
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <p>❌ Falha ao carregar gráfico</p>
                    <button onclick="window.dashboard.loadCurrentTab()" class="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                        Tentar novamente
                    </button>
                </div>
            `;
        }
    }

    /**
     * Mostra estado de erro para tabela
     * @param {Element} tbody - Elemento tbody
     */
    showTableError(tbody) {
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-8">
                        <div class="error-state">
                            <p>❌ Falha ao carregar dados</p>
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    /**
     * Mostra estado vazio
     * @param {Element} element - Elemento
     * @param {string} message - Mensagem
     */
    showEmptyState(element, message) {
        if (element) {
            element.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-8">
                        <div class="empty-state">
                            <p>📭 ${message}</p>
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    /**
     * Define estado de loading
     * @param {boolean} loading - Estado de loading
     */
    setLoading(loading) {
        this.isLoading = loading;
        
        // Mostra/esconde spinners
        this.elements.loadingSpinners.forEach(spinner => {
            spinner.style.display = loading ? 'block' : 'none';
        });
        
        // Desabilita botões durante loading
        this.elements.tabButtons.forEach(button => {
            button.disabled = loading;
        });
    }

    /**
     * Verifica se é erro de rede
     * @param {Error} error - Erro
     * @returns {boolean} - Se é erro de rede
     */
    isNetworkError(error) {
        return error.message.includes('Failed to fetch') || 
               error.message.includes('NetworkError') ||
               error.message.includes('ERR_NETWORK');
    }

    /**
     * Mostra mensagem de erro
     * @param {string} message - Mensagem de erro
     */
    showError(message) {
        if (window.filterManager) {
            window.filterManager.showError(message);
        } else {
            console.error(message);
            alert(message); // Fallback
        }
    }

    /**
     * Destrói o dashboard
     */
    destroy() {
        // Remove event listeners
        this.elements.tabButtons?.forEach(button => {
            button.replaceWith(button.cloneNode(true));
        });
        
        // Destrói gráficos
        if (window.chartManager) {
            window.chartManager.destroyAllCharts();
        }
        
        // Limpa cache
        this.elements = {};
        this.currentTab = 'dashboard';
        this.isLoading = false;
    }
}

// Exporta instância única (Singleton)
const dashboard = new AnaliseHoraExtraDashboard();

// Exporta para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AnaliseHoraExtraDashboard, dashboard };
} else {
    window.AnaliseHoraExtraDashboard = AnaliseHoraExtraDashboard;
    window.dashboard = dashboard;
}
