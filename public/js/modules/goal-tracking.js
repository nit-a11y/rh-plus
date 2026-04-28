import { state } from '../state.js';
import { DateFixer } from '../date-fixer.js';

export const GoalTrackingModule = {
    cache: new Map(),
    abortController: null,

    async init() {
        const user = Auth.check();
        if (!user || (user.role !== 'DEV' && user.role !== 'GESTOR')) {
            window.location.href = '/dashboard.html';
            return;
        }
        await Promise.all([
            this.loadSummary(),
            this.loadUserPerformance()
        ]);
    },

    async loadUserPerformance() {
        const grid = document.getElementById('team-performance-grid');
        if (!grid) return;

        try {
            const res = await fetch('/api/analytics/users/performance');
            const users = await res.json();

            if (!users || users.length === 0) {
                grid.innerHTML = '<div class="col-span-full text-center py-10 text-gray-400 font-bold uppercase text-[9px]">Nenhum dado de desempenho encontrado.</div>';
                return;
            }

            grid.innerHTML = users.map(u => {
                const hours = (u.total_time_seconds / 3600).toFixed(2);
                const avg = u.total_actions > 0 ? (u.total_time_seconds / u.total_actions / 60).toFixed(2) : '0';
                const photo = u.photo || 'https://via.placeholder.com/150';

                return `
                    <div class="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 group">
                        <div class="flex items-center gap-6 mb-8">
                            <img src="${photo}" class="w-16 h-16 rounded-2xl object-cover border-2 border-nordeste-red shadow-lg group-hover:scale-105 transition-transform" onerror="this.src='https://via.placeholder.com/150'">
                            <div>
                                <h4 class="text-sm font-black text-gray-800 uppercase italic leading-tight">${this.escapeHtml(u.name)}</h4>
                                <span class="badge-status bg-red-50 text-nordeste-red mt-1 inline-block">${u.role}</span>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div class="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                <p class="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Ações</p>
                                <div class="flex items-center justify-between">
                                    <span class="text-lg font-black text-gray-800">${u.total_actions}</span>
                                    <span class="text-xl">📊</span>
                                </div>
                            </div>
                            <div class="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                <p class="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Investido</p>
                                <div class="flex items-center justify-between">
                                    <span class="text-lg font-black text-gray-800">${hours}h</span>
                                    <span class="text-xl">⏱</span>
                                </div>
                            </div>
                        </div>

                        <div class="mt-6 pt-6 border-t border-gray-50 flex justify-between items-center text-[9px] font-black uppercase">
                            <span class="text-gray-400">Tempo Médio / Pedido:</span>
                            <span class="text-nordeste-red">${avg} min</span>
                        </div>
                    </div>
                `;
            }).join('');

        } catch (e) {
            grid.innerHTML = '<div class="col-span-full text-nordeste-red font-black text-center py-10">Erro ao carregar desempenho.</div>';
        }
    },

    async loadSummary() {
        const grid = document.getElementById('goals-summary-grid');
        if (!grid) return;

        // Abort previous request if any
        if (this.abortController) this.abortController.abort();
        this.abortController = new AbortController();

        try {
            const res = await fetch('/api/analytics/goals/summary', {
                signal: this.abortController.signal
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const goals = await res.json();

            if (!goals || goals.length === 0) {
                grid.innerHTML = '<div class="col-span-full text-center py-20 text-gray-400 font-bold uppercase text-[10px]">Nenhuma meta ativa no momento.</div>';
                return;
            }

            // Use DocumentFragment for better performance
            const fragment = document.createDocumentFragment();

            goals.forEach(g => {
                const percent = g.total_demands > 0 ? Math.round((g.completed_demands / g.total_demands) * 100) : 0;
                const card = this.createGoalCard(g, percent);
                fragment.appendChild(card);
            });

            grid.innerHTML = '';
            grid.appendChild(fragment);

        } catch (e) {
            if (e.name !== 'AbortError') {
                grid.innerHTML = '<div class="col-span-full text-nordeste-red font-black text-center py-20">Erro ao carregar dados analíticos.</div>';
            }
        }
    },

    createGoalCard(g, percent) {
        const div = document.createElement('div');
        div.className = 'goal-card p-8 cursor-pointer';
        div.onclick = () => this.showDetails(g.id, g.title);

        const formattedDate = DateFixer.formatarDataParaExibicao(g.target_date);

        div.innerHTML = `
            <div class="flex justify-between items-start mb-6">
                <span class="badge-status status-planejado">${percent}% Concluído</span>
                <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Prazo: ${formattedDate}</span>
            </div>
            <h4 class="text-lg font-black text-gray-800 uppercase italic mb-4 leading-tight">${this.escapeHtml(g.title)}</h4>
            <div class="mt-auto">
                <div class="flex justify-between text-[9px] font-black uppercase mb-2">
                    <span class="text-gray-400">${g.completed_demands} / ${g.total_demands} Itens</span>
                </div>
                <div class="progress-track">
                    <div class="progress-fill" style="width: ${percent}%"></div>
                </div>
            </div>
        `;

        return div;
    },

    async showDetails(goalId, title) {
        const gridEl = document.getElementById('goals-summary-grid');
        const detailsEl = document.getElementById('details-section');

        if (!gridEl || !detailsEl) return;

        gridEl.classList.add('hidden');
        detailsEl.classList.remove('hidden');

        const titleEl = document.getElementById('detail-title');
        if (titleEl) titleEl.innerText = this.escapeHtml(title);

        const tableBody = document.getElementById('details-table-body');
        if (!tableBody) return;

        tableBody.innerHTML = '<tr><td colspan="4" class="text-center py-10 text-gray-400 font-bold">Carregando métricas individuais...</td></tr>';

        try {
            // Check cache first
            if (this.cache.has(goalId)) {
                const details = this.cache.get(goalId);
                this.renderDetails(details);
                return;
            }

            const res = await fetch(`/api/analytics/goals/${goalId}/details`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const details = await res.json();

            // Cache the result
            this.cache.set(goalId, details);

            this.renderDetails(details);

        } catch (e) {
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-nordeste-red font-bold">Erro ao carregar detalhes.</td></tr>';
        }
    },

    renderDetails(details) {
        const tableBody = document.getElementById('details-table-body');
        if (!tableBody) return;

        // Use DocumentFragment for better performance
        const fragment = document.createDocumentFragment();

        details.forEach(d => {
            const row = document.createElement('tr');
            row.className = 'border-b border-gray-50 hover:bg-gray-50 transition-colors';

            const time = d.total_time_seconds ? (d.total_time_seconds / 60).toFixed(1) + ' min' : '--';
            const statusClass = d.status === 'Concluída' ? 'status-concluido' : 'status-em-progresso';
            const completedAt = d.completed_at ? DateFixer.formatarDataParaExibicao(d.completed_at) : '--';

            row.innerHTML = `
                <td class="py-4 text-gray-800 uppercase font-bold">${this.escapeHtml(d.employee_name)}</td>
                <td class="py-4 text-center"><span class="badge-status ${statusClass}">${d.status}</span></td>
                <td class="py-4 text-center font-mono text-gray-600">${time}</td>
                <td class="py-4 text-right text-gray-400">${completedAt}</td>
            `;

            fragment.appendChild(row);
        });

        tableBody.innerHTML = '';
        tableBody.appendChild(fragment);

        this.calculateAnalytics(details);
    },

    calculateAnalytics(details) {
        const completed = details.filter(d => d.status === 'Concluída');
        const avgEl = document.getElementById('avg-time');
        const predictionEl = document.getElementById('prediction-date');

        if (!avgEl || !predictionEl) return;

        if (completed.length === 0) {
            avgEl.innerText = '--';
            predictionEl.innerText = 'Processando...';
            return;
        }

        const totalSeconds = completed.reduce((acc, curr) => acc + (curr.total_time_seconds || 0), 0);
        const avg = (totalSeconds / completed.length / 60).toFixed(1);
        avgEl.innerText = avg + ' min';

        const remaining = details.length - completed.length;
        if (remaining === 0) {
            predictionEl.innerText = '✓ Concluída';
            predictionEl.classList.add('text-green-400');
            return;
        }

        // Simple projection
        const avgSeconds = totalSeconds / completed.length;
        const estimatedMinutesRemaining = (remaining * avgSeconds / 60).toFixed(0);
        predictionEl.innerText = `${estimatedMinutesRemaining} min`;
    },

    hideDetails() {
        const gridEl = document.getElementById('goals-summary-grid');
        const detailsEl = document.getElementById('details-section');

        if (gridEl && detailsEl) {
            detailsEl.classList.add('hidden');
            gridEl.classList.remove('hidden');
        }
    },

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
};

document.addEventListener('DOMContentLoaded', () => GoalTrackingModule.init());
window.GoalTrackingModule = GoalTrackingModule;
