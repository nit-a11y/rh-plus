/**
 * Funções de segurança para sanitização de dados do dossier
 */

// Função principal de escape HTML
export function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Função para sanitizar objetos recursivamente
export function sanitizeForHtml(value) {
    if (Array.isArray(value)) return value.map(sanitizeForHtml);
    if (value && typeof value === 'object') {
        const out = {};
        Object.keys(value).forEach((k) => { out[k] = sanitizeForHtml(value[k]); });
        return out;
    }
    if (typeof value === 'string') return escapeHtml(value);
    return value;
}

// Função adicional para sanitizar atributos HTML
export function sanitizeAttribute(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

// Função para criar elementos HTML de forma segura
export function safeCreateElement(tag, attributes = {}, textContent = '') {
    const element = document.createElement(tag);
    
    // Definir atributos de forma segura
    Object.keys(attributes).forEach(key => {
        if (key === 'className') {
            element.className = sanitizeAttribute(attributes[key]);
        } else if (key.startsWith('data-')) {
            element.setAttribute(key, sanitizeAttribute(attributes[key]));
        } else {
            element.setAttribute(key, sanitizeAttribute(attributes[key]));
        }
    });
    
    // Adicionar texto de forma segura
    if (textContent) {
        element.textContent = textContent;
    }
    
    return element;
}
