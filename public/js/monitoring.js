// Sistema de Monitoramento Avançado - Frontend
class MonitoringSystem {
    constructor() {
        this.rules = [];
        this.events = [];
        this.stats = {};
        this.init();
    }

    async init() {
        await this.loadMonitoringRules();
        await this.loadEvents();
        await this.loadStats();
    }

    // Carrega regras de monitoramento
    async loadMonitoringRules() {
        try {
            const response = await fetch('/api/monitoring/rules');
            const data = await response.json();
            
            if (data.success) {
                this.rules = data.rules;
                this.renderRules();
                this.updateStats();
            }
        } catch (error) {
            console.error('Erro ao carregar regras:', error);
            this.showToast('Erro ao carregar regras de monitoramento', 'error');
        }
    }

    // Carrega eventos recentes
    async loadEvents() {
        try {
            const moduleFilter = document.getElementById('module-filter')?.value;
            const params = new URLSearchParams();
            
            if (moduleFilter) params.append('module', moduleFilter);
            params.append('limit', '20');

            const response = await fetch(`/api/monitoring/events?${params}`);
            const data = await response.json();
            
            if (data.success) {
                this.events = data.events;
                this.renderEvents();
            }
        } catch (error) {
            console.error('Erro ao carregar eventos:', error);
            this.showToast('Erro ao carregar eventos', 'error');
        }
    }

    // Carrega estatísticas
    async loadStats() {
        try {
            const response = await fetch('/api/monitoring/stats');
            const data = await response.json();
            
            if (data.success) {
                this.stats = data.stats;
                this.updateStats();
            }
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    }

    // Renderiza regras
    renderRules() {
        const container = document.getElementById('rules-container');
        if (!container) return;

        if (this.rules.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <div class="text-6xl mb-4 opacity-20">📊</div>
                    <h4 class="text-lg font-bold text-gray-600 mb-2">Nenhuma regra configurada</h4>
                    <p class="text-sm text-gray-400">Clique em "Nova Regra" para começar</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.rules.map(rule => `
            <div class="monitoring-card">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h4 class="font-bold text-gray-800 mb-1">${this.escapeHtml(rule.name)}</h4>
                        <p class="text-sm text-gray-600">${this.escapeHtml(rule.description || 'Sem descrição')}</p>
                    </div>
                    <div class="flex gap-2">
                        <span class="status-badge ${rule.is_active ? 'status-active' : 'status-inactive'}">
                            ${rule.is_active ? 'Ativa' : 'Inativa'}
                        </span>
                        <span class="priority-badge priority-${this.getPriorityClass(rule.priority)}">
                            Prioridade ${rule.priority}
                        </span>
                    </div>
                </div>

                <div class="flex gap-2 mb-4">
                    <span class="module-badge">${rule.module}</span>
                    <span class="text-xs text-gray-500 font-mono">${rule.action_pattern}</span>
                </div>

                <div class="flex justify-between items-center">
                    <div class="text-xs text-gray-400">
                        Criado: ${this.formatDate(rule.created_at)}
                    </div>
                    <div class="flex gap-2">
                        <button onclick="editRule('${rule.id}')" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            ✏️ Editar
                        </button>
                        <button onclick="toggleRule('${rule.id}')" class="text-yellow-600 hover:text-yellow-800 text-sm font-medium">
                            ${rule.is_active ? '⏸️ Pausar' : '▶️ Ativar'}
                        </button>
                        <button onclick="deleteRule('${rule.id}')" class="text-red-600 hover:text-red-800 text-sm font-medium">
                            🗑️ Excluir
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Renderiza eventos
    renderEvents() {
        const container = document.getElementById('events-container');
        if (!container) return;

        if (this.events.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <div class="text-6xl mb-4 opacity-20">📝</div>
                    <h4 class="text-lg font-bold text-gray-600 mb-2">Nenhum evento registrado</h4>
                    <p class="text-sm text-gray-400">Os eventos aparecerão aqui quando ocorrerem</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.events.map(event => `
            <div class="event-item">
                <div class="bg-white rounded-lg border border-gray-200 p-4">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <h5 class="font-bold text-gray-800">${this.escapeHtml(event.event_description)}</h5>
                            <p class="text-sm text-gray-600">Tipo: ${event.event_type}</p>
                        </div>
                        <div class="text-right">
                            <span class="module-badge">${event.module}</span>
                            <div class="text-xs text-gray-400 mt-1">
                                ${this.formatDateTime(event.created_at)}
                            </div>
                        </div>
                    </div>

                    <div class="flex gap-2 text-xs text-gray-500">
                        <span>👤 ${event.user_name}</span>
                        <span>🎯 ${event.rule_name}</span>
                        ${event.target_id ? `<span>📋 ID: ${event.target_id}</span>` : ''}
                    </div>

                    ${event.event_data ? `
                        <div class="mt-2 pt-2 border-t border-gray-100">
                            <details class="text-xs">
                                <summary class="cursor-pointer text-blue-600 hover:text-blue-800">Ver detalhes</summary>
                                <pre class="mt-2 bg-gray-50 p-2 rounded text-xs overflow-x-auto">${JSON.stringify(JSON.parse(event.event_data), null, 2)}</pre>
                            </details>
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    // Atualiza estatísticas
    updateStats() {
        document.getElementById('total-rules').textContent = this.rules.filter(r => r.is_active).length;
        document.getElementById('total-events').textContent = this.events.length;
        
        const uniqueModules = [...new Set(this.rules.map(r => r.module))];
        document.getElementById('active-modules').textContent = uniqueModules.length;
        
        const successRate = this.events.length > 0 ? 
            Math.round((this.events.filter(e => e.event_type !== 'error').length / this.events.length) * 100) : 0;
        document.getElementById('success-rate').textContent = successRate + '%';
    }

    // Abre modal para adicionar regra
    openAddRuleModal() {
        const modal = document.getElementById('modal-container');
        const content = document.getElementById('modal-content');
        
        content.innerHTML = `
            <div class="bg-nordeste-black p-6 text-white">
                <h3 class="text-xl font-bold">Nova Regra de Monitoramento</h3>
            </div>
            <div class="p-6">
                <form id="rule-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nome da Regra *</label>
                        <input type="text" name="name" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-nordeste-red">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                        <textarea name="description" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-nordeste-red"></textarea>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Módulo *</label>
                        <select name="module" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-nordeste-red">
                            <option value="">Selecione...</option>
                            <option value="vacation">Férias</option>
                            <option value="career">Carreira</option>
                            <option value="employees">Colaboradores</option>
                            <option value="aso">ASO</option>
                            <option value="sst">SST</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Padrão de Ação *</label>
                        <input type="text" name="action_pattern" required placeholder="ex: vacation_schedule" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-nordeste-red">
                        <p class="text-xs text-gray-500 mt-1">Use o padrão: modulo_acao (ex: vacation_schedule)</p>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de Alvo</label>
                        <select name="target_type" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-nordeste-red">
                            <option value="">Selecione...</option>
                            <option value="employee">Funcionário</option>
                            <option value="vacation_record">Registro de Férias</option>
                            <option value="goal">Meta</option>
                            <option value="demand">Demanda</option>
                            <option value="system">Sistema</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                        <select name="priority" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-nordeste-red">
                            <option value="1">Alta</option>
                            <option value="2">Média</option>
                            <option value="3">Baixa</option>
                        </select>
                    </div>

                    <div class="flex gap-3 pt-4">
                        <button type="submit" class="flex-1 bg-nordeste-red text-white py-2 rounded-lg font-medium hover:bg-nordeste-darkRed transition-all">
                            Criar Regra
                        </button>
                        <button type="button" onclick="closeModal()" class="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-300 transition-all">
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        `;

        modal.classList.remove('hidden');
        
        // Adiciona evento de submit
        document.getElementById('rule-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveRule(e.target);
        });
    }

    // Salva nova regra
    async saveRule(form) {
        const formData = new FormData(form);
        const ruleData = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/monitoring/rules', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(ruleData)
            });

            const result = await response.json();

            if (result.success) {
                this.showToast('Regra criada com sucesso!', 'success');
                closeModal();
                await this.loadMonitoringRules();
            } else {
                this.showToast('Erro ao criar regra: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Erro ao salvar regra:', error);
            this.showToast('Erro ao salvar regra', 'error');
        }
    }

    // Métodos auxiliares
    getPriorityClass(priority) {
        const classes = {
            1: 'high',
            2: 'medium',
            3: 'low'
        };
        return classes[priority] || 'medium';
    }

    formatDate(dateString) {
        if (!dateString) return '--';
        return new Date(dateString).toLocaleDateString('pt-BR');
    }

    formatDateTime(dateString) {
        if (!dateString) return '--';
        return new Date(dateString).toLocaleString('pt-BR');
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    showToast(message, type = 'info') {
        // Implementação simples de toast
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white font-medium z-50 ${
            type === 'success' ? 'bg-green-500' : 
            type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        }`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Funções globais
const monitoringSystem = new MonitoringSystem();

window.loadMonitoringRules = () => monitoringSystem.loadMonitoringRules();
window.loadEvents = () => monitoringSystem.loadEvents();
window.openAddRuleModal = () => monitoringSystem.openAddRuleModal();
window.closeModal = () => {
    document.getElementById('modal-container').classList.add('hidden');
};

// Placeholder functions para futura implementação
window.editRule = (id) => {
    monitoringSystem.showToast('Funcionalidade de edição em desenvolvimento', 'info');
};

window.toggleRule = async (id) => {
    monitoringSystem.showToast('Funcionalidade de ativação/desativação em desenvolvimento', 'info');
};

window.deleteRule = async (id) => {
    if (confirm('Tem certeza que deseja excluir esta regra?')) {
        monitoringSystem.showToast('Funcionalidade de exclusão em desenvolvimento', 'info');
    }
};

// Auto-refresh a cada 30 segundos
setInterval(() => {
    monitoringSystem.loadEvents();
}, 30000);
