// Estado Global Compartilhado
export const state = {
    employees: [],
    currentView: 'dashboard',
    selectedEmployee: null,
    sidebarCollapsed: false,
    user: null, // Usuário logado
    currentTab: 'uniforms'
};

export function setState(key, value) {
    state[key] = value;
}

export function getState() {
    return state;
}

// Mecanismo para quebrar dependência circular entre main.js e modules/*.js
let appRefresher = {
    renderApp: () => console.warn('renderApp not initialized'),
    loadData: async () => console.warn('loadData not initialized')
};

export function setRefresher(refs) {
    appRefresher = refs;
}

export function getRefresher() {
    return appRefresher;
}