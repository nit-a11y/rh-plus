// PROTOCOLO BIG BROTHER - CENTRAL DE INTELIGÊNCIA UNIFICADA
class BigBrotherCommand {
    constructor() {
        this.currentUser = Auth.check();
        this.currentTab = 'dashboard';
        this.data = {
            performance: [],
            liveFeed: [],
            goals: [],
            audit: []
        };
        this.init();
    }

    async init() {
        if (!this.currentUser || (this.currentUser.role !== 'DEV' && this.currentUser.role !== 'GESTOR')) {
            window.location.href = '/dashboard.html';
            return;
        }

        document.getElementById('header-user-name').innerText = this.currentUser.name;
        document.getElementById('header-user-role').innerText = this.currentUser.role;

        await this.loadStats();
        await this.loadPerformance();
        await this.loadLiveFeed();

        // Form listener
        const goalForm = document.getElementById('form-create-goal');
        if (goalForm) {
            goalForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createGoal(e.target);
            });
        }

        // Auto-refresh loops
        setInterval(() => this.loadLiveFeed(), 10000); // 10s para feed vivo
        setInterval(() => this.loadPerformance(), 60000); // 60s para stats
    }

    async switchTab(tab) {
        this.currentTab = tab;
        const tabs = ['dashboard', 'goals', 'audit'];
        tabs.forEach(t => {
            const el = document.getElementById(`section-${t}`);
            const tabBtn = document.getElementById(`tab-${t}`);
            if (el) el.classList.toggle('hidden', t !== tab);
            if (tabBtn) tabBtn.classList.toggle('active', t === tab);
        });

        if (tab === 'goals') await this.loadGoals();
        if (tab === 'audit') await this.loadAudit();
    }

    async loadStats() {
        try {
            const res = await fetch('/api/analytics/users/performance');
            const data = await res.json();

            const totalActions = data.reduce((acc, curr) => acc + (curr.total_actions || 0), 0);
            const totalSeconds = data.reduce((acc, curr) => acc + (curr.total_time_seconds || 0), 0);
            const avgResponse = totalActions > 0 ? (totalSeconds / totalActions / 60).toFixed(1) : 0;

            document.getElementById('stat-daily-actions').innerText = totalActions;
            document.getElementById('stat-avg-response').innerText = avgResponse + ' min';

            const goalsRes = await fetch('/api/analytics/goals/summary');
            const goalsData = await goalsRes.json();
            const completedGoals = goalsData.filter(g => g.completed_demands >= g.total_demands && g.total_demands > 0).length;
            document.getElementById('stat-goals-done').innerText = completedGoals;
        } catch (e) { console.error('Stats error:', e); }
    }

    async loadPerformance() {
        const container = document.getElementById('ranking-body');
        if (!container) return;

        try {
            const res = await fetch('/api/analytics/users/performance');
            const users = await res.json();

            container.innerHTML = users.map(u => {
                const hours = (u.total_time_seconds / 3600).toFixed(1);
                const efficiency = u.total_actions > 20 ? 'Alta Excelência' : (u.total_actions > 5 ? 'Produtivo' : 'Visualização');
                const color = u.total_actions > 20 ? 'text-emerald-500' : (u.total_actions > 5 ? 'text-blue-500' : 'text-gray-400');

                return `
                    <tr class="border-b border-gray-50 hover:bg-white hover:shadow-xl transition-all group cursor-pointer" onclick="window.viewDossier('${u.id}')">
                        <td class="py-6">
                            <div class="flex items-center gap-4">
                                <div class="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center font-black text-nordeste-red border-2 border-white shadow-sm group-hover:scale-110 transition-transform">
                                    ${u.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <p class="text-sm font-black text-gray-800 uppercase italic leading-tight">${u.name}</p>
                                    <p class="text-[8px] text-nordeste-red font-black uppercase tracking-widest">${u.role}</p>
                                </div>
                            </div>
                        </td>
                        <td class="py-6"><span class="text-[9px] font-black uppercase text-gray-400">Inteligência / Auditoria</span></td>
                        <td class="py-6 text-center text-lg font-black italic text-gray-800">${u.total_actions}</td>
                        <td class="py-6 text-center"><span class="text-[10px] font-black uppercase ${color}">${efficiency}</span></td>
                        <td class="py-6 text-right">
                            <button class="bg-nordeste-red text-white px-6 py-2 rounded-xl font-black text-[9px] uppercase shadow-lg transform hover:-translate-y-1 transition-all">Ver Ficha</button>
                        </td>
                    </tr>
                `;
            }).join('');
        } catch (e) { container.innerHTML = 'Error loading performance.'; }
    }

    async loadLiveFeed() {
        const container = document.getElementById('live-feed-body');
        if (!container) return;

        try {
            const res = await fetch('/api/analytics/users/live-actions');
            const history = await res.json();

            container.innerHTML = history.map(item => `
                <div class="action-card p-4 rounded-2xl border bg-gray-50/50">
                    <div class="flex justify-between items-start mb-2">
                        <span class="text-[9px] font-black text-gray-800 uppercase italic">${item.user_name}</span>
                        <span class="text-[8px] text-nordeste-red font-black uppercase">${this.timeAgo(item.created_at)}</span>
                    </div>
                    <p class="text-[10px] font-bold text-gray-600 leading-tight">${item.action_description}</p>
                    <div class="mt-2 flex gap-2">
                        <span class="text-[7px] bg-red-100 text-nordeste-red px-2 py-0.5 rounded font-black uppercase italic">${item.action_type}</span>
                        <span class="text-[7px] text-gray-400 font-bold uppercase">${item.target_type || 'SYSTEM'}</span>
                    </div>
                </div>
            `).join('');
        } catch (e) { console.error('Live feed error:', e); }
    }

    async loadGoals() {
        const grid = document.getElementById('goals-grid');
        if (!grid) return;

        try {
            const res = await fetch('/api/analytics/goals/summary');
            const goals = await res.json();

            grid.innerHTML = goals.map(g => {
                const percent = g.total_demands > 0 ? Math.round((g.completed_demands / g.total_demands) * 100) : 0;
                const moduleLabel = g.module ? g.module.toUpperCase() : 'GERAL';

                return `
                    <div class="glass-panel p-10 rounded-[2.5rem] cursor-pointer group hover:bg-nordeste-red/5 transition-all">
                        <div class="flex justify-between items-start mb-8">
                            <span class="text-[10px] font-black bg-nordeste-red text-white px-3 py-1 rounded-lg uppercase tracking-widest">${moduleLabel}</span>
                            <span class="text-2xl filter grayscale opacity-20 group-hover:grayscale-0 group-hover:opacity-100 transition-all">🎯</span>
                        </div>
                        <h4 class="text-xl font-black text-gray-800 uppercase italic leading-tight mb-8">${g.title}</h4>
                        <div class="space-y-4">
                            <div class="flex justify-between items-end">
                                <span class="text-2xl font-black italic text-gray-800">${percent}%</span>
                                <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">${g.completed_demands} / ${g.total_demands} AUDITADOS</span>
                            </div>
                            <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div class="h-full bg-nordeste-red transition-all duration-1000 shadow-[0_0_10px_rgba(211,47,47,0.4)]" style="width: ${percent}%"></div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (e) { console.error('Goals error:', e); }
    }

    async createGoal(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        data.created_by = this.currentUser.name;
        data.target_company_id = 'all'; // Default to all for big brother coverage

        try {
            const res = await fetch('/api/goals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (result.success) {
                alert('Mestra Estratégica Criada! As demandas serão auto-geradas e monitoradas.');
                this.closeModals();
                this.loadGoals();
                this.loadStats();
            } else {
                alert('Erro ao criar meta: ' + result.error);
            }
        } catch (e) { alert('Erro de conexão ao criar meta.'); }
    }

    async loadAudit() {
        const container = document.getElementById('audit-results');
        if (!container) return;

        try {
            // Busca os últimos 50 eventos gerais para auditoria
            const res = await fetch('/api/analytics/users/live-actions?limit=100');
            const data = await res.json();

            container.innerHTML = data.map(item => `
                <div class="p-6 bg-white border border-gray-100 rounded-3xl flex items-center justify-between group hover:shadow-lg transition-all">
                    <div class="flex items-center gap-6">
                        <div class="w-12 h-12 rounded-2xl bg-nordeste-black text-white flex items-center justify-center font-black text-lg">
                            ${(item.user_name || '?').substring(0, 1)}
                        </div>
                        <div>
                            <p class="text-sm font-black text-gray-800 uppercase italic mb-1">${item.user_name}</p>
                            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">${item.action_description}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-12">
                        <div class="text-right">
                            <p class="text-[10px] font-black text-nordeste-red uppercase tracking-widest">${item.action_type}</p>
                            <p class="text-[9px] font-bold text-gray-400">${new Date(item.created_at).toLocaleString()}</p>
                        </div>
                        <span class="bg-gray-50 text-gray-400 text-[8px] font-black px-3 py-1 rounded-lg uppercase">${item.target_type || 'SISTEMA'}</span>
                    </div>
                </div>
            `).join('');
        } catch (e) { console.error('Audit load error:', e); }
    }

    timeAgo(dateString) {
        const now = new Date();
        const then = new Date(dateString);
        const diff = Math.floor((now - then) / 1000);
        if (diff < 60) return 'Agora';
        if (diff < 3600) return `${Math.floor(diff / 60)}m`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
        return `${Math.floor(diff / 86400)}d`;
    }

    closeModals() {
        document.getElementById('modal-goal').classList.add('hidden');
    }
}

// Inicialização
const command = new BigBrotherCommand();

window.switchTab = (t) => command.switchTab(t);
window.openCreateGoalModal = () => document.getElementById('modal-goal').classList.remove('hidden');
window.closeModals = () => command.closeModals();
window.viewDossier = (userId) => {
    // Reutiliza a lógica anterior de visualizar histórico se necessário, ou foca na auditoria
    // Por enquanto, apenas abre a aba de auditoria filtrada (em desenvolvimento)
    command.switchTab('audit');
};
