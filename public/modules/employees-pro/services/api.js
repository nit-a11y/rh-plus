
// ===================================
// SERVIÇO DE API - EMPLOYEES-PRO
// System Architect Persona - .agent
// ===================================

import { ModuleConfig } from '../config.js';

class ApiService {
    constructor() {
        this.baseURL = ModuleConfig.api.base;
        this.endpoints = ModuleConfig.api;
    }

    // Requisição genérica
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

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // GET - Buscar todos os funcionários
    async getEmployees(params = {}) {
        const url = new URL(this.endpoints.employees, window.location.origin);
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
        
        return this.request(url);
    }

    // GET - Buscar funcionário por ID
    async getEmployee(id) {
        return this.request(`${this.endpoints.employees}/${id}`);
    }

    // POST - Criar funcionário
    async createEmployee(data) {
        return this.request(this.endpoints.employees, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // PUT - Atualizar funcionário
    async updateEmployee(id, data) {
        return this.request(`${this.endpoints.employees}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // DELETE - Excluir funcionário
    async deleteEmployee(id) {
        return this.request(`${this.endpoints.employees}/${id}`, {
            method: 'DELETE'
        });
    }

    // GET - Buscar empresas
    async getCompanies() {
        return this.request(this.endpoints.companies);
    }

    // GET - Buscar cargos
    async getRoles() {
        return this.request(this.endpoints.roles);
    }

    // POST - Upload de arquivo
    async uploadFile(file, type = 'photo') {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);

        return this.request(`${this.endpoints.employees}/upload`, {
            method: 'POST',
            body: formData,
            headers: {} // Deixar o navegador definir o Content-Type
        });
    }
}

export const apiService = new ApiService();
export default apiService;
