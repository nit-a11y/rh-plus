
// ===================================
// SERVIÇO DE DADOS - EMPLOYEES-PRO
// System Architect Persona - .agent
// ===================================

import { ModuleConfig } from '../config.js';

class DataService {
    constructor() {
        this.cache = new Map();
        this.listeners = new Map();
    }

    // Cache de dados
    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    getCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        // Cache válido por 5 minutos
        if (Date.now() - cached.timestamp > 300000) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }

    // Validar dados do funcionário
    validateEmployee(data) {
        const errors = [];
        const required = ['name', 'personalEmail', 'city', 'state_uf'];
        
        required.forEach(field => {
            if (!data[field] || data[field].trim() === '') {
                errors.push(`O campo ${field} é obrigatório`);
            }
        });

        // Validar email
        if (data.personalEmail && !this.isValidEmail(data.personalEmail)) {
            errors.push('Email inválido');
        }

        // Validar CEP
        if (data.cep && !this.isValidCEP(data.cep)) {
            errors.push('CEP inválido');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Validar email
    isValidEmail(email) {
        const regex = /^[^s@]+@[^s@]+.[^s@]+$/;
        return regex.test(email);
    }

    // Validar CEP
    isValidCEP(cep) {
        const regex = /^d{5}-?d{3}$/;
        return regex.test(cep.replace(/D/g, ''));
    }

    // Formatar dados para salvamento
    formatForSave(data) {
        const formatted = { ...data };
        
        // Remover campos inválidos
        Object.keys(formatted).forEach(key => {
            if (!ModuleConfig.validFields.includes(key)) {
                delete formatted[key];
            }
        });

        // Limpar strings
        Object.keys(formatted).forEach(key => {
            if (typeof formatted[key] === 'string') {
                formatted[key] = formatted[key].trim();
            }
        });

        return formatted;
    }

    // Event listeners
    subscribe(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    unsubscribe(event, callback) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.forEach(callback => callback(data));
        }
    }
}

export const dataService = new DataService();
export default dataService;
