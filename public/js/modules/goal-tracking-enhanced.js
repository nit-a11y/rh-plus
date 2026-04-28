import { state } from '../state.js';
import { DateFixer } from '../date-fixer.js';

export const GoalTrackingModule = {
    cache: new Map(),
    abortController: null,
    toastContainer: null,
    currentFilters: {
        status: 'all',
        dateRange: 'all',
        search: ''
    },

    async init() {
        const user = Auth.check();
        if (!user || (user.role !== 'DEV' && user.role !== 'GESTOR')) {
            window.location.href = '/dashboard.html';
            return;
        }

        this.initToastContainer();
        this.initFilters();
        this.initSearch();
        
        await Promise.all([
            this.loadSummary(),
            this.loadUserPerformance()
        ]);
    },

    // Sistema de Notificações Toast
    initToastContainer() {
        if (this.toastContainer) return;
        
        this.toastContainer = document.createElement('div');
        this.toastContainer.className = 'toast-container';
        document.body.appendChild(this.toastContainer);
    },

    showToast(message, type = 'info', duration = 3000) {
        if (!this.toastContainer) this.initToastContainer();

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <span class="toast-message">${message}</span>
            <span class="toast-close" onclick="this.parentElement.remove()">✕</span>
        `;

        this.toastContainer.appendChild(toast);

        // Auto remove
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    // Skeleton Loaders
    showSkeletonCards(count = 4) {
        const grid = document.getElementById('goals-summary-grid');
        if (!grid) return;

        const skeletons = Array(count).fill('').map(() => `
            <div class="skeleton-card"></div>
        `).join('');

        grid.innerHTML = skeletons;
    },

    showSkeletonTable() {
        const tableBody = document.getElementById('details-table-body');
        if (!tableBody) return;

        const skeletons = Array(5).fill('').map(() => `
            <tr>
                <td class="py-4"><div class="skeleton-text"></div></td>
                <td class="py-4 text-center"><div class="skeleton-text small"></div></td>
                <td class="py-4 text-center"><div class="skeleton-text small"></div></td>
                <td class="py-4 text-right"><div class="skeleton-text small"></div></td>
            </tr>
        `).join('');

        tableBody.innerHTML = skeletons;
    },

    // Filtros
    initFilters() {
        const statusFilter = document.getElementById('filter-status');
        const dateFilter = document.getElementById('filter-date');

        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.currentFilters.status = e.target.value;
                this.applyFilters();
            });
        }

        if (dateFilter) {
            dateFilter.addEventListener('change', (e) => {
                this.currentFilters.dateRange = e.target.value;
                this.applyFilters();
            });
        }
    },

    // Busca
    initSearch() {
        const searchInput = document.getElementById('search-input');
        if (!searchInput) return;

        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.currentFilters.search = e.target.value.toLowerCase();
                this.applyFilters();
            }, 300);
        });
    },

    // Aplicar filtros
    applyFilters() {
        const cards = document.querySelectorAll('.goal-card');
        
        cards.forEach(card => {
            const title = card.querySelector('h4')?.textContent.toLowerCase() || '';
            const status = card.querySelector('.badge-status')?.textContent.toLowerCase() || '';
            
            const matchesSearch = !this.currentFilters.search || 
                title.includes(this.currentFilters.search);
            
            const matchesStatus = this.currentFilters.status === 'all' || 
                status.includes(this.currentFilters.status.toLowerCase());

            card.style.display = matchesSearch && matchesStatus ? 'block' : 'none';
        });

        this.showToast(`Filtros aplicados: ${this.getFilterDescription()}`, 'info');
    },

    getFilterDescription() {
        const filters = [];
        if (this.currentFilters.status !== 'all') filters.push(`Status: ${this.currentFilters.status}`);
        if (this.currentFilters.search) filters.push(`Busca: "${this.currentFilters.search}"`);
        if (this.currentFilters.dateRange !== 'all') filters.push(`Período: ${this.currentFilters.dateRange}`);
        return filters.length > 0 ? filters.join(', ') : 'Todos';
    },

    async loadUserPerformance() {
        const grid = document.getElementById('team-performance-grid');
        if (!grid) return;

        // Show skeleton
        grid.innerHTML = Array(3).fill('').map(() => `
            <div class="skeleton-card" style="height: 250px;"></div>
        `).join('');

        try {
            const res = await fetch('/api/analytics/users/performance');
            const users = await res.json();

            if (!users || users.length === 0) {
                grid.innerHTML = '<div class="col-span-full text-center py-10 text-gray-400 font-bold uppercase text-[9px]">Nenhum dado de desempenho encontrado.</div>';
                return;
            }

            // Render with animation
            const fragment = document.createDocumentFragment();
            users.forEach((user, index) => {
                const card = this.createPerformanceCard(user);
                setTimeout(() => {
                    fragment.appendChild(card);
                }, index * 100);
            });

            setTimeout(() => {
                grid.innerHTML = '';
                grid.appendChild(fragment);
            }, 100);

        } catch (e) {
            grid.innerHTML = '<div class="col-span-full text-nordeste-red font-black text-center py-10">Erro ao carregar desempenho.</div>';
            this.showToast('Erro ao carregar desempenho da equipe', 'error');
        }
    },

    createPerformanceCard(user) {
        const div = document.createElement('div');
        div.className = 'bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 group animate-fade-in';
        
        const hours = (user.total_time_seconds / 3600).toFixed(2);
        const avg = user.total_actions > 0 ? (user.total_time_seconds / user.total_actions / 60).toFixed(2) : '0';
        const photo = user.photo || 'https://via.placeholder.com/150';

        div.innerHTML = `
            <div class="flex items-center gap-6 mb-8">
                <img src="${photo}" class="w-16 h-16 rounded-2xl object-cover border-2 border-nordeste-red shadow-lg group-hover:scale-105 transition-transform" onerror="this.src='https://via.placeholder.com/150'">
                <div>
                    <h4 class="text-sm font-black text-gray-800 uppercase italic leading-tight">${this.escapeHtml(user.name)}</h4>
                    <span class="badge-status bg-red-50 text-nordeste-red mt-1 inline-block">${user.role}</span>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div class="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <p class="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Ações</p>
                    <div class="flex items-center justify-between">
                        <span class="text-lg font-black text-gray-800">${user.total_actions}</span>
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
        `;

        return div;
    },

    async loadSummary() {
        const grid = document.getElementById('goals-summary-grid');
        if (!grid) return;

        // Show skeleton loaders
        this.showSkeletonCards(4);

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

            // Apply filters and render
            const filteredGoals = this.filterGoals(goals);
            this.renderGoals(filteredGoals);

            this.showToast(`${filteredGoals.length} metas carregadas`, 'success');

        } catch (e) {
            if (e.name !== 'AbortError') {
                grid.innerHTML = '<div class="col-span-full text-nordeste-red font-black text-center py-20">Erro ao carregar dados analíticos.</div>';
                this.showToast('Erro ao carregar metas', 'error');
            }
        }
    },

    filterGoals(goals) {
        return goals.filter(goal => {
            const matchesSearch = !this.currentFilters.search || 
                goal.title.toLowerCase().includes(this.currentFilters.search);
            
            return matchesSearch;
        });
    },

    renderGoals(goals) {
        const grid = document.getElementById('goals-summary-grid');
        if (!grid) return;

        // Use DocumentFragment for better performance
        const fragment = document.createDocumentFragment();

        goals.forEach((g, index) => {
            const percent = g.total_demands > 0 ? Math.round((g.completed_demands / g.total_demands) * 100) : 0;
            const card = this.createGoalCard(g, percent);
            
            // Stagger animation
            setTimeout(() => {
                fragment.appendChild(card);
            }, index * 100);
        });

        // Clear and append
        setTimeout(() => {
            grid.innerHTML = '';
            grid.appendChild(fragment);
        }, 100);
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

        // Show skeleton table
        this.showSkeletonTable();

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
            this.showToast('Detalhes carregados com sucesso', 'success');

        } catch (e) {
            const tableBody = document.getElementById('details-table-body');
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-nordeste-red font-bold">Erro ao carregar detalhes.</td></tr>';
            }
            this.showToast('Erro ao carregar detalhes', 'error');
        }
    },

    renderDetails(details) {
        const tableBody = document.getElementById('details-table-body');
        if (!tableBody) return;

        // Use DocumentFragment for better performance
        const fragment = document.createDocumentFragment();

        details.forEach((d, index) => {
            const row = document.createElement('tr');
            row.className = 'border-b border-gray-50 hover:bg-gray-50 transition-colors animate-fade-in';
            
            // Stagger animation
            setTimeout(() => {
                fragment.appendChild(row);
            }, index * 50);

            const time = d.total_time_seconds ? (d.total_time_seconds / 60).toFixed(1) + ' min' : '--';
            const statusClass = d.status === 'Concluída' ? 'status-concluido' : 'status-em-progresso';
            const completedAt = d.completed_at ? DateFixer.formatarDataParaExibicao(d.completed_at) : '--';

            row.innerHTML = `
                <td class="py-4 text-gray-800 uppercase font-bold">${this.escapeHtml(d.employee_name)}</td>
                <td class="py-4 text-center"><span class="badge-status ${statusClass}">${d.status}</span></td>
                <td class="py-4 text-center font-mono text-gray-600">${time}</td>
                <td class="py-4 text-right text-gray-400">${completedAt}</td>
            `;
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

    // Export functions
    async exportToCSV() {
        try {
            this.showToast('Preparando exportação CSV...', 'info');
            
            const response = await fetch('/api/analytics/goals/summary');
            const goals = await response.json();
            
            const csv = this.convertToCSV(goals);
            this.downloadFile(csv, 'goals-summary.csv', 'text/csv');
            
            this.showToast('CSV exportado com sucesso!', 'success');
        } catch (error) {
            this.showToast('Erro ao exportar CSV', 'error');
        }
    },

    async exportToPDF() {
        try {
            this.showToast('Preparando exportação PDF...', 'info');
            
            // Implementação básica - poderia usar uma biblioteca como jsPDF
            window.print();
            
            this.showToast('PDF exportado com sucesso!', 'success');
        } catch (error) {
            this.showToast('Erro ao exportar PDF', 'error');
        }
    },

    convertToCSV(data) {
        const headers = ['Título', 'Total Demandas', 'Concluídas', 'Data Limite'];
        const csvContent = [
            headers.join(','),
            ...data.map(row => [
                `"${row.title}"`,
                row.total_demands,
                row.completed_demands,
                row.target_date
            ].join(','))
        ].join('\n');
        
        return csvContent;
    },

    downloadFile(content, filename, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    },

    // User history
    async loadUserHistory(userId) {
        try {
            const response = await fetch(`/api/history/user/${userId}`);
            const data = await response.json();
            
            if (data.success) {
                this.renderUserHistory(data.history);
                this.showToast('Histórico carregado', 'success');
            }
        } catch (error) {
            this.showToast('Erro ao carregar histórico', 'error');
        }
    },

    renderUserHistory(history) {
        // Implementar renderização do histórico
        console.log('User history:', history);
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

// Auto-inicialização
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => GoalTrackingModule.init(), 100);
});

window.GoalTrackingModule = GoalTrackingModule;
