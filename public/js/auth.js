
const Auth = {
    MODULE_ROUTES: {
        'dashboard': ['/', '/dashboard.html'],
        'employees-pro': ['/colaboradores-pro', '/employees-pro.html'],
        'uniforms': ['/fardamento', '/uniforms-module.html'],
        'career': ['/carreira', '/carreira.html'],
        'vacation': ['/vacation.html'],
        'aso': ['/aso.html'],
        'acessos': ['/acessos.html']
    },

    check: function() {
        const userStr = localStorage.getItem('nordeste_user');
        const path = window.location.pathname;
        const isLoginPage = path.includes('login.html');
        
        if (!userStr && !isLoginPage) {
            window.location.href = '/login.html';
            return null;
        }
        
        if (userStr) {
            const user = JSON.parse(userStr);
            
            // PROTEÇÃO CONTRA SESSÃO ANTIGA:
            if (!user.role) {
                this.logout();
                return null;
            }

            if (isLoginPage) {
                window.location.href = '/dashboard.html';
                return user;
            }

            this.validatePathPermission(user, path);
            return user;
        }

        return null;
    },

    validatePathPermission: function(user, path) {
        if (user.role === 'DEV') return; 

        // Se for rota raiz/dashboard/perfil, permite
        if (path === '/' || path.includes('dashboard.html') || path.includes('perfil')) return;

        for (const [module, routes] of Object.entries(this.MODULE_ROUTES)) {
            if (routes.some(r => path.endsWith(r))) {
                if (module === 'acessos' && user.role !== 'GESTOR' && user.role !== 'DEV') {
                    window.location.href = '/dashboard.html';
                    return;
                }
                
                // Se for USER, verifica permissão explícita
                if (user.role === 'USER') {
                    if (!user.permissions || user.permissions[module] !== true) {
                        alert('Acesso não autorizado a este módulo.');
                        window.location.href = '/dashboard.html';
                    }
                }
            }
        }
    },

    login: async function(username, password) {
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (data.success) {
                localStorage.setItem('nordeste_user', JSON.stringify(data.user));
                return { success: true };
            }
            return { success: false, message: data.error };
        } catch (e) {
            return { success: false, message: 'Erro de conexão' };
        }
    },

    logout: async function() {
        const user = this.getUser();
        if (user?.sessionId) {
            try {
                await fetch('/api/logout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId: user.sessionId, userId: user.id })
                });
            } catch (e) {}
        }
        localStorage.removeItem('nordeste_user');
        window.location.href = '/login.html';
    },

    getUser: function() {
        const u = localStorage.getItem('nordeste_user');
        return u ? JSON.parse(u) : null;
    },

    updateSession: function(user) {
        localStorage.setItem('nordeste_user', JSON.stringify(user));
    },

    getAuthHeader: function() {
        const user = this.getUser();
        return user?.sessionId ? { 'x-session-id': user.sessionId } : {};
    },

    fetch: async function(url, options = {}) {
        const headers = {
            ...options.headers,
            ...this.getAuthHeader()
        };
        return fetch(url, { ...options, headers });
    }
};

// Auto-patch fetch para incluir session em todas as requisições
const originalFetch = window.fetch;
window.fetch = async function(url, options = {}) {
    const authHeader = Auth.getAuthHeader();
    if (Object.keys(authHeader).length > 0 && !url.includes('/login') && !url.includes('/auth')) {
        const headers = {
            ...options?.headers,
            ...authHeader
        };
        return originalFetch(url, { ...options, headers });
    }
    return originalFetch(url, options);
};

// Auto-init apenas se houver form de login
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button');
            const originalText = btn.textContent;
            btn.textContent = 'Autenticando...';
            btn.disabled = true;

            const res = await Auth.login(document.getElementById('username').value, document.getElementById('password').value);
            if (res.success) window.location.href = '/dashboard.html';
            else {
                document.getElementById('error-message').textContent = res.message;
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });
    }
});
