
// ===================================
// COMPONENTE DE LISTA - EMPLOYEES-PRO
// System Architect Persona - .agent
// ===================================

import { apiService } from '../services/api.js';
import { dataService } from '../services/data.js';

class ListComponent {
    constructor() {
        this.employees = [];
        this.filteredEmployees = [];
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.isLoading = false;
    }

    async init() {
        console.log('📋 Inicializando componente de lista...');
        this.setupEventListeners();
        await this.loadEmployees();
    }

    async show() {
        console.log('👁️ Mostrando lista de funcionários...');
        await this.render();
    }

    setupEventListeners() {
        // Busca
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(this.handleSearch, 500));
        }

        // Filtros
        const filterSelects = document.querySelectorAll('.filter-select');
        filterSelects.forEach(select => {
            select.addEventListener('change', this.handleFilter.bind(this));
        });

        // Paginação
        document.addEventListener('click', (e) => {
            if (e.target.matches('.pagination-btn')) {
                const page = parseInt(e.target.dataset.page);
                this.goToPage(page);
            }
        });
    }

    async loadEmployees() {
        console.log('📥 Carregando funcionários...');
        this.isLoading = true;
        
        try {
            this.showLoading(true);
            
            // Verificar cache
            const cached = dataService.getCache('employees');
            if (cached) {
                this.employees = cached;
                this.filteredEmployees = cached;
                await this.render();
                return;
            }

            // Buscar da API
            const data = await apiService.getEmployees();
            this.employees = data.employees || data;
            this.filteredEmployees = this.employees;
            
            // Salvar no cache
            dataService.setCache('employees', this.employees);
            
            await this.render();
        } catch (error) {
            console.error('❌ Erro ao carregar funcionários:', error);
            this.showError('Erro ao carregar funcionários.');
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
    }

    async render() {
        const container = document.getElementById('employees-list');
        if (!container) return;

        const html = `
            ${this.renderHeader()}
            ${this.renderFilters()}
            ${this.renderTable()}
            ${this.renderPagination()}
        `;

        container.innerHTML = html;
    }

    renderHeader() {
        return `
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900">Colaboradores</h2>
                    <p class="text-gray-600">Gerenciamento de funcionários</p>
                </div>
                <div class="flex space-x-3">
                    <button onclick="window.location.href='employees-pro.html?action=new'" 
                            class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        <i class="fas fa-plus mr-2"></i> Novo Funcionário
                    </button>
                    <button onclick="exportData()" 
                            class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                        <i class="fas fa-download mr-2"></i> Exportar
                    </button>
                </div>
            </div>
        `;
    }

    renderFilters() {
        return `
            <div class="bg-white p-4 rounded-lg shadow-sm mb-6">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Busca</label>
                        <input type="text" id="search-input" 
                               placeholder="Nome, CPF ou matrícula..." 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select class="filter-select w-full px-3 py-2 border border-gray-300 rounded-lg">
                            <option value="">Todos</option>
                            <option value="ATIVO">Ativo</option>
                            <option value="DESLIGADO">Desligado</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Setor</label>
                        <select class="filter-select w-full px-3 py-2 border border-gray-300 rounded-lg">
                            <option value="">Todos</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                        <select class="filter-select w-full px-3 py-2 border border-gray-300 rounded-lg">
                            <option value="">Todas</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
    }

    renderTable() {
        if (this.isLoading) {
            return '<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-4xl text-blue-600"></i></div>';
        }

        if (this.filteredEmployees.length === 0) {
            return `
                <div class="text-center py-8">
                    <i class="fas fa-users text-6xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500">Nenhum funcionário encontrado</p>
                </div>
            `;
        }

        const paginatedEmployees = this.getPaginatedEmployees();
        
        return `
            <div class="bg-white rounded-lg shadow-sm overflow-hidden">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Funcionário</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dados</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${paginatedEmployees.map(emp => this.renderEmployeeRow(emp)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderEmployeeRow(employee) {
        const statusColor = employee.type === 'DESLIGADO' ? 'red' : 'green';
        const statusText = employee.type === 'DESLIGADO' ? 'Desligado' : 'Ativo';
        
        return `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                            <img class="h-10 w-10 rounded-full" src="${employee.photoUrl || '/assets/default-avatar.png'}" alt="">
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${employee.name}</div>
                            <div class="text-sm text-gray-500">${employee.registrationNumber}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${employee.role}</div>
                    <div class="text-sm text-gray-500">${employee.sector}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-${statusColor}-100 text-${statusColor}-800">
                        ${statusText}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="editEmployee('${employee.id}')" class="text-blue-600 hover:text-blue-900 mr-3">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button onclick="viewDossier('${employee.id}')" class="text-green-600 hover:text-green-900">
                        <i class="fas fa-file-alt"></i> Dossier
                    </button>
                </td>
            </tr>
        `;
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredEmployees.length / this.itemsPerPage);
        if (totalPages <= 1) return '';

        return `
            <div class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div class="flex-1 flex justify-between sm:hidden">
                    <button class="pagination-btn relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50" data-page="${this.currentPage - 1}">
                        Anterior
                    </button>
                    <button class="pagination-btn ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50" data-page="${this.currentPage + 1}">
                        Próximo
                    </button>
                </div>
                <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                        <p class="text-sm text-gray-700">
                            Mostrando <span class="font-medium">${(this.currentPage - 1) * this.itemsPerPage + 1}</span> a 
                            <span class="font-medium">${Math.min(this.currentPage * this.itemsPerPage, this.filteredEmployees.length)}</span> de 
                            <span class="font-medium">${this.filteredEmployees.length}</span> resultados
                        </p>
                    </div>
                    <div>
                        <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                            ${this.renderPaginationButtons(totalPages)}
                        </nav>
                    </div>
                </div>
            </div>
        `;
    }

    renderPaginationButtons(totalPages) {
        let buttons = '';
        
        // Botão anterior
        buttons += `
            <button class="pagination-btn relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50" 
                    data-page="${this.currentPage - 1}" ${this.currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        // Números das páginas
        for (let i = 1; i <= totalPages; i++) {
            const isActive = i === this.currentPage;
            buttons += `
                <button class="pagination-btn relative inline-flex items-center px-4 py-2 border text-sm font-medium 
                         ${isActive ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}" 
                    data-page="${i}">
                    ${i}
                </button>
            `;
        }

        // Botão próximo
        buttons += `
            <button class="pagination-btn relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50" 
                    data-page="${this.currentPage + 1}" ${this.currentPage === totalPages ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        return buttons;
    }

    getPaginatedEmployees() {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        return this.filteredEmployees.slice(start, end);
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.filteredEmployees.length / this.itemsPerPage);
        if (page < 1 || page > totalPages) return;
        
        this.currentPage = page;
        this.render();
    }

    handleSearch = (event) => {
        const searchTerm = event.target.value.toLowerCase();
        
        if (searchTerm === '') {
            this.filteredEmployees = this.employees;
        } else {
            this.filteredEmployees = this.employees.filter(emp => 
                emp.name.toLowerCase().includes(searchTerm) ||
                emp.registrationNumber.toLowerCase().includes(searchTerm) ||
                (emp.personalEmail && emp.personalEmail.toLowerCase().includes(searchTerm))
            );
        }
        
        this.currentPage = 1;
        this.render();
    }

    handleFilter = () => {
        // Implementar lógica de filtros
        console.log('🔍 Aplicando filtros...');
    }

    showLoading(show) {
        const loading = document.getElementById('loading-overlay');
        if (loading) {
            loading.style.display = show ? 'flex' : 'none';
        }
    }

    showError(message) {
        if (window.uiAlert) {
            window.uiAlert(message);
        }
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Funções globais para compatibilidade
window.editEmployee = (id) => {
    dataService.emit('employee:edit', { id });
};

window.viewDossier = (id) => {
    dataService.emit('employee:view', { id });
};

window.exportData = () => {
    console.log('📊 Exportando dados...');
    // Implementar exportação
};

export { ListComponent };
export default ListComponent;
