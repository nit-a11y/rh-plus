/**
 * 📡 Módulo de API para Análise de Hora Extra
 * Responsável por todas as comunicações com o backend
 * Segue o princípio de Single Responsibility
 */

class AnaliseHoraExtraAPI {
    constructor() {
        this.baseURL = '/api/analysis';
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
    }

    /**
     * Gera chave de cache baseada nos parâmetros
     * @param {string} endpoint - Endpoint da API
     * @param {string} params - Parâmetros da requisição
     * @returns {string} - Chave do cache
     */
    getCacheKey(endpoint, params = '') {
        return `${endpoint}:${params}`;
    }

    /**
     * Verifica se o cache é válido
     * @param {Object} cacheEntry - Entrada do cache
     * @returns {boolean} - Se o cache é válido
     */
    isCacheValid(cacheEntry) {
        return Date.now() - cacheEntry.timestamp < this.cacheTimeout;
    }

    /**
     * Requisição HTTP genérica com tratamento de erro
     * @param {string} url - URL da requisição
     * @param {Object} options - Opções da requisição
     * @returns {Promise<Object>} - Resposta da API
     */
    async request(url, options = {}) {
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Erro na resposta da API');
            }

            return data;
        } catch (error) {
            console.error(`Erro na requisição para ${url}:`, error);
            throw new Error(`Falha ao carregar dados: ${error.message}`);
        }
    }

    /**
     * Requisição com cache
     * @param {string} endpoint - Endpoint da API
     * @param {string} params - Parâmetros da requisição
     * @returns {Promise<Object>} - Dados da API ou cache
     */
    async requestWithCache(endpoint, params = '') {
        const cacheKey = this.getCacheKey(endpoint, params);
        const cachedData = this.cache.get(cacheKey);

        if (cachedData && this.isCacheValid(cachedData)) {
            return cachedData.data;
        }

        const url = `${this.baseURL}/${endpoint}${params ? '?' + params : ''}`;
        const data = await this.request(url);

        this.cache.set(cacheKey, {
            data,
            timestamp: Date.now()
        });

        return data;
    }

    /**
     * Limpa o cache
     * @param {string} pattern - Padrão para limpar cache específico
     */
    clearCache(pattern = null) {
        if (pattern) {
            for (const key of this.cache.keys()) {
                if (key.includes(pattern)) {
                    this.cache.delete(key);
                }
            }
        } else {
            this.cache.clear();
        }
    }

    // 📊 Métodos específicos da API

    /**
     * Carrega dados do dashboard
     * @param {Object} filters - Filtros aplicados
     * @returns {Promise<Object>} - Dados do dashboard
     */
    async getDashboard(filters = {}) {
        const params = this.buildParams(filters);
        return this.requestWithCache('dashboard', params);
    }

    /**
     * Carrega dados de evolução mensal
     * @param {Object} filters - Filtros aplicados
     * @returns {Promise<Object>} - Dados de evolução
     */
    async getEvolution(filters = {}) {
        const params = this.buildParams(filters);
        return this.requestWithCache('evolution', params);
    }

    /**
     * Carrega dados por setor
     * @param {Object} filters - Filtros aplicados
     * @returns {Promise<Object>} - Dados por setor
     */
    async getBySector(filters = {}) {
        const params = this.buildParams(filters);
        return this.requestWithCache('by-sector', params);
    }

    /**
     * Carrega comparação de horas vs colaboradores
     * @param {Object} filters - Filtros aplicados
     * @returns {Promise<Object>} - Dados de comparação
     */
    async getHoursVsEmployees(filters = {}) {
        const params = this.buildParams(filters);
        return this.requestWithCache('hours-vs-employees', params);
    }

    /**
     * Carrega lista de unidades disponíveis
     * @returns {Promise<Object>} - Lista de unidades
     */
    async getUnits() {
        return this.requestWithCache('units');
    }

    /**
     * Constrói string de parâmetros para URL
     * @param {Object} filters - Objeto de filtros
     * @returns {string} - String de parâmetros
     */
    buildParams(filters) {
        const params = [];
        
        if (filters.year) {
            params.push(`year=${encodeURIComponent(filters.year)}`);
        }
        if (filters.month) {
            params.push(`month=${encodeURIComponent(filters.month)}`);
        }
        if (filters.unit) {
            params.push(`unit=${encodeURIComponent(filters.unit)}`);
        }
        
        return params.join('&');
    }
}

// Exporta instância única (Singleton)
const analiseAPI = new AnaliseHoraExtraAPI();

// Exporta para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AnaliseHoraExtraAPI, analiseAPI };
} else {
    window.AnaliseHoraExtraAPI = AnaliseHoraExtraAPI;
    window.analiseAPI = analiseAPI;
}
