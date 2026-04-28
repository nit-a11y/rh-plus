const crypto = require('crypto');

// Gera ID único para registros
const generateId = () => crypto.randomBytes(4).toString('hex');

// Gera UUID v4
const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = crypto.randomBytes(1)[0] % 16;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// Formata data para exibição
const formatDate = (date) => {
    if (!date) return '--';
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR');
};

// Formata data e hora para exibição
const formatDateTime = (date) => {
    if (!date) return '--';
    const d = new Date(date);
    return d.toLocaleString('pt-BR');
};

// Valida CPF
const validateCPF = (cpf) => {
    if (!cpf) return false;
    cpf = cpf.replace(/[^\d]/g, '');
    
    if (cpf.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    let sum = 0;
    let remainder;
    
    // Validação do primeiro dígito
    for (let i = 1; i <= 9; i++) {
        sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(9, 10))) return false;
    
    // Validação do segundo dígito
    sum = 0;
    for (let i = 1; i <= 10; i++) {
        sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(10, 11))) return false;
    
    return true;
};

// Remove caracteres especiais
const sanitizeString = (str) => {
    if (!str) return '';
    return str.replace(/[^\w\s-]/gi, '').trim();
};

// Capitaliza nomes
const capitalizeName = (name) => {
    if (!name) return '';
    return name.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

// Calcula idade
const calculateAge = (birthDate) => {
    if (!birthDate) return 0;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
};

// Valida email
const validateEmail = (email) => {
    if (!email) return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

// Gera slug a partir de string
const generateSlug = (text) => {
    if (!text) return '';
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

// Formata moeda brasileira
const formatCurrency = (value) => {
    if (!value && value !== 0) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

// Calcula diferença em dias entre duas datas
const daysBetween = (date1, date2) => {
    const oneDay = 24 * 60 * 60 * 1000;
    const firstDate = new Date(date1);
    const secondDate = new Date(date2);
    
    return Math.round(Math.abs((firstDate - secondDate) / oneDay));
};

// Verifica se data é válida
const isValidDate = (date) => {
    if (!date) return false;
    const d = new Date(date);
    return d instanceof Date && !isNaN(d);
};

// Formata CEP
const formatCEP = (cep) => {
    if (!cep) return '';
    cep = cep.replace(/[^\d]/g, '');
    if (cep.length !== 8) return cep;
    return cep.substring(0, 5) + '-' + cep.substring(5);
};

// Valida CEP
const validateCEP = (cep) => {
    if (!cep) return false;
    cep = cep.replace(/[^\d]/g, '');
    return cep.length === 8;
};

// Gera código aleatório
const generateCode = (length = 6) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// Remove acentos
const removeAccents = (str) => {
    if (!str) return '';
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

// Limita string a um tamanho máximo
const truncateString = (str, maxLength, suffix = '...') => {
    if (!str) return '';
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - suffix.length) + suffix;
};

// Verifica se objeto está vazio
const isEmpty = (obj) => {
    if (!obj) return true;
    if (Array.isArray(obj)) return obj.length === 0;
    if (typeof obj === 'object') return Object.keys(obj).length === 0;
    return !obj;
};

// Deep clone de objeto
const deepClone = (obj) => {
    if (!obj) return obj;
    return JSON.parse(JSON.stringify(obj));
};

module.exports = {
    generateId,
    generateUUID,
    formatDate,
    formatDateTime,
    validateCPF,
    sanitizeString,
    capitalizeName,
    calculateAge,
    validateEmail,
    generateSlug,
    formatCurrency,
    daysBetween,
    isValidDate,
    formatCEP,
    validateCEP,
    generateCode,
    removeAccents,
    truncateString,
    isEmpty,
    deepClone
};
