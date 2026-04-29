/**
 * 🎛️ Módulo de Filtros para Análise de Hora Extra
 * Responsável por gerenciar todos os filtros e suas interações
 * Segue o princípio de Single Responsibility
 */

class AnaliseHoraExtraFilters {
    constructor() {
        this.filters = {
            year: '',
            month: '',
            unit: ''
        };
        this.filterElements = {};
        this.callbacks = new Set();
        this.months = [
            'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
            'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
        ];
    }

    /**
     * Inicializa os filtros
     */
    async initialize() {
        this.cacheElements();
        this.attachEventListeners();
        await this.loadFilterOptions();
    }

    /**
     * Cache dos elementos DOM
     */
    cacheElements() {
        this.filterElements = {
            year: document.getElementById('filter-year'),
            month: document.getElementById('filter-month'),
            unit: document.getElementById('filter-unit'),
            clearBtn: document.querySelector('[onclick*="clearFilters"]')
        };

        // Valida se todos os elementos existem
        for (const [key, element] of Object.entries(this.filterElements)) {
            if (!element && key !== 'clearBtn') {
                console.warn(`Elemento de filtro não encontrado: ${key}`);
            }
        }
    }

    /**
     * Anexa event listeners
     */
    attachEventListeners() {
        // Filtro de ano
        if (this.filterElements.year) {
            this.filterElements.year.addEventListener('change', () => {
                this.updateFilter('year', this.filterElements.year.value);
            });
        }

        // Filtro de mês
        if (this.filterElements.month) {
            this.filterElements.month.addEventListener('change', () => {
                this.updateFilter('month', this.filterElements.month.value);
            });
        }

        // Filtro de unidade
        if (this.filterElements.unit) {
            this.filterElements.unit.addEventListener('change', () => {
                this.updateFilter('unit', this.filterElements.unit.value);
            });
        }

        // Botão de limpar
        if (this.filterElements.clearBtn) {
            this.filterElements.clearBtn.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }

        // Atalhos de teclado
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'r') {
                e.preventDefault();
                this.clearAllFilters();
            }
        });
    }

    /**
     * Carrega opções para os filtros
     */
    async loadFilterOptions() {
        try {
            // Carrega anos disponíveis
            await this.loadYearOptions();
            
            // Carrega meses
            this.loadMonthOptions();
            
            // Carrega unidades
            await this.loadUnitOptions();
            
        } catch (error) {
            console.error('Erro ao carregar opções de filtro:', error);
            this.showError('Falha ao carregar opções de filtro');
        }
    }

    /**
     * Carrega opções de ano
     */
    async loadYearOptions() {
        if (!this.filterElements.year) return;

        try {
            const response = await window.analiseAPI.getEvolution();
            
            if (!response || !response.data || response.data.length === 0) {
                console.warn('API não retornou dados para anos, usando fallback');
                this.loadYearFallback();
                return;
            }
            
            const years = [...new Set(response.data.map(item => item.ano_num))].sort((a, b) => b - a);
            
            this.filterElements.year.innerHTML = '<option value="">Todos</option>';
            years.forEach(year => {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                this.filterElements.year.appendChild(option);
            });
            
            console.log(`✅ Anos carregados: ${years.length} anos encontrados`);
        } catch (error) {
            console.error('Erro ao carregar anos:', error);
            console.log('🔄 Usando fallback para anos...');
            this.loadYearFallback();
        }
    }

    /**
     * Fallback para anos quando API falha
     */
    loadYearFallback() {
        const currentYear = new Date().getFullYear();
        const years = [currentYear, currentYear - 1, currentYear - 2];
        
        this.filterElements.year.innerHTML = '<option value="">Todos</option>';
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            this.filterElements.year.appendChild(option);
        });
    }

    /**
     * Carrega opções de mês
     */
    loadMonthOptions() {
        if (!this.filterElements.month) return;

        this.filterElements.month.innerHTML = '<option value="">Todos</option>';
        this.months.forEach((month, index) => {
            const option = document.createElement('option');
            option.value = month;
            option.textContent = month;
            this.filterElements.month.appendChild(option);
        });
    }

    /**
     * Carrega opções de unidade
     */
    async loadUnitOptions() {
        if (!this.filterElements.unit) return;

        try {
            const response = await window.analiseAPI.getUnits();
            
            if (!response || !response.data || response.data.length === 0) {
                console.warn('API não retornou dados para unidades, usando fallback');
                this.loadUnitFallback();
                return;
            }
            
            const units = response.data || [];
            
            this.filterElements.unit.innerHTML = '<option value="">Todas</option>';
            units.forEach(unit => {
                const option = document.createElement('option');
                option.value = unit;
                option.textContent = unit;
                this.filterElements.unit.appendChild(option);
            });
            
            console.log(`✅ Unidades carregadas: ${units.length} unidades encontradas`);
        } catch (error) {
            console.error('Erro ao carregar unidades:', error);
            console.log('🔄 Usando fallback para unidades...');
            this.loadUnitFallback();
        }
    }

    /**
     * Fallback para unidades quando API falha
     */
    loadUnitFallback() {
        const units = [
            'Matriz', 'Filial 1', 'Filial 2', 'Filial 3', 
            'Departamento TI', 'Departamento RH', 'Departamento Financeiro'
        ];
        
        this.filterElements.unit.innerHTML = '<option value="">Todas</option>';
        units.forEach(unit => {
            const option = document.createElement('option');
            option.value = unit;
            option.textContent = unit;
            this.filterElements.unit.appendChild(option);
        });
    }

    /**
     * Atualiza um filtro específico
     */
    updateFilter(filterType, value) {
        this.filters[filterType] = value;
        this.notifyCallbacks();
    }

    /**
     * Limpa todos os filtros
     */
    clearAllFilters() {
        this.filters = {
            year: '',
            month: '',
            unit: ''
        };

        // Reseta os elementos DOM
        if (this.filterElements.year) this.filterElements.year.value = '';
        if (this.filterElements.month) this.filterElements.month.value = '';
        if (this.filterElements.unit) this.filterElements.unit.value = '';

        this.notifyCallbacks();
        this.showSuccess('Filtros limpos com sucesso');
    }

    /**
     * Retorna os filtros atuais
     */
    getFilters() {
        return { ...this.filters };
    }

    /**
     * Retorna os filtros como parâmetros URL
     */
    getFilterParams() {
        const params = [];
        
        if (this.filters.year) {
            params.push(`year=${encodeURIComponent(this.filters.year)}`);
        }
        if (this.filters.month) {
            params.push(`month=${encodeURIComponent(this.filters.month)}`);
        }
        if (this.filters.unit) {
            params.push(`unit=${encodeURIComponent(this.filters.unit)}`);
        }
        
        return params.join('&');
    }

    /**
     * Verifica se há filtros ativos
     */
    hasActiveFilters() {
        return Object.values(this.filters).some(value => value !== '');
    }

    /**
     * Adiciona callback para mudanças nos filtros
     */
    onFilterChange(callback) {
        this.callbacks.add(callback);
    }

    /**
     * Remove callback
     */
    removeCallback(callback) {
        this.callbacks.delete(callback);
    }

    /**
     * Notifica todos os callbacks
     */
    notifyCallbacks() {
        for (const callback of this.callbacks) {
            try {
                callback(this.getFilters());
            } catch (error) {
                console.error('Erro em callback de filtro:', error);
            }
        }
    }

    /**
     * Mostra mensagem de erro
     */
    showError(message) {
        this.showMessage(message, 'error');
    }

    /**
     * Mostra mensagem de sucesso
     */
    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    /**
     * Mostra mensagem genérica
     */
    showMessage(message, type = 'info') {
        // Cria elemento de mensagem
        const messageEl = document.createElement('div');
        messageEl.className = `message-toast message-${type} fade-in`;
        messageEl.textContent = message;
        
        // Estilos inline para o toast
        Object.assign(messageEl.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '14px',
            zIndex: '9999',
            maxWidth: '300px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        });

        // Cor baseada no tipo
        const colors = {
            error: { bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5' },
            success: { bg: '#D1FAE5', color: '#065F46', border: '#10B981' },
            info: { bg: '#DBEAFE', color: '#1E40AF', border: '#3B82F6' }
        };

        const color = colors[type] || colors.info;
        messageEl.style.backgroundColor = color.bg;
        messageEl.style.color = color.color;
        messageEl.style.border = `1px solid ${color.border}`;

        document.body.appendChild(messageEl);

        // Remove após 3 segundos
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 3000);
    }

    /**
     * Destrói o gerenciador de filtros
     */
    destroy() {
        this.callbacks.clear();
        this.filterElements = {};
        this.filters = {
            year: '',
            month: '',
            unit: ''
        };
    }
}

// Exporta instância única (Singleton)
const filterManager = new AnaliseHoraExtraFilters();

// Exporta para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AnaliseHoraExtraFilters, filterManager };
} else {
    window.AnaliseHoraExtraFilters = AnaliseHoraExtraFilters;
    window.filterManager = filterManager;
}
