/**
 * Gerenciamento de memória para o dossier
 */

let dossierData = null;

// Função para limpar memória e evitar memory leaks
export function clearDossierData() {
    dossierData = null;
    // Forçar garbage collection se disponível
    if (window.gc) window.gc();
    console.log('🧹 Memória do dossier limpa');
}

// Getter para dados do dossier
export function getDossierData() {
    return dossierData;
}

// Expor globalmente para outros módulos
window.getDossierData = getDossierData;

// Setter para dados do dossier
export function setDossierData(data) {
    dossierData = data;
}

// Limpar dados ao fechar módulo ou mudar de página
window.addEventListener('beforeunload', clearDossierData);
window.addEventListener('moduleClosed', clearDossierData);
