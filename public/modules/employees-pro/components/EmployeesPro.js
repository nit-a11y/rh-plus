
// ===================================
// COMPONENTE PRINCIPAL - EMPLOYEES-PRO
// System Architect Persona - .agent
// ===================================

import { ModuleConfig } from '../config.js';
import { apiService } from '../services/api.js';
import { dataService } from '../services/data.js';
import { FilterComponent } from './Filter.js';
import { ListComponent } from './List.js';
import { EditorComponent } from './Editor.js';
import { DossierComponent } from './Dossier.js';

class EmployeesPro {
    constructor() {
        this.name = ModuleConfig.name;
        this.version = ModuleConfig.version;
        this.currentView = 'list';
        this.currentEmployee = null;
        this.isInitialized = false;
        
        this.components = {
            filter: new FilterComponent(),
            list: new ListComponent(),
            editor: new EditorComponent(),
            dossier: new DossierComponent()
        };
    }

    // Inicialização
    async init() {
        console.log(`🚀 Inicializando ${this.name} v${this.version}...`);
        
        try {
            await this.setupComponents();
            this.setupEventListeners();
            this.setupRouting();
            this.showView('list');
            
            this.isInitialized = true;
            console.log('✅ Módulo inicializado com sucesso!');
            
            // Emitir evento de inicialização
            dataService.emit('module:initialized', { module: this.name });
        } catch (error) {
            console.error('❌ Erro ao inicializar módulo:', error);
            this.showError('Erro ao inicializar módulo. Por favor, recarregue a página.');
        }
    }

    // Configurar componentes
    async setupComponents() {
        console.log('🔧 Configurando componentes...');
        
        // Inicializar cada componente
        for (const [name, component] of Object.entries(this.components)) {
            if (component.init) {
                await component.init();
                console.log(`✅ Componente ${name} inicializado`);
            }
        }
    }

    // Configurar event listeners
    setupEventListeners() {
        console.log('🎧 Configurando event listeners...');
        
        // Navegação
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-view]')) {
                e.preventDefault();
                const view = e.target.dataset.view;
                this.showView(view);
            }
        });

        // Eventos dos componentes
        dataService.subscribe('employee:edit', (employee) => {
            this.currentEmployee = employee;
            this.showView('editor');
        });

        dataService.subscribe('employee:view', (employee) => {
            this.currentEmployee = employee;
            this.showView('dossier');
        });

        dataService.subscribe('view:change', (view) => {
            this.showView(view);
        });
    }

    // Configurar routing
    setupRouting() {
        console.log('🛣️ Configurando routing...');
        
        // Verificar URL atual
        const path = window.location.pathname;
        const params = new URLSearchParams(window.location.search);
        
        if (params.has('editor_id')) {
            const employeeId = params.get('editor_id');
            this.loadAndEditEmployee(employeeId);
        } else if (params.has('dossier_id')) {
            const employeeId = params.get('dossier_id');
            this.loadAndViewDossier(employeeId);
        }
    }

    // Mostrar view específica
    async showView(viewName) {
        console.log(`📑 Mostrando view: ${viewName}`);
        
        if (this.currentView === viewName) return;
        
        // Esconder todas as views
        this.hideAllViews();
        
        // Mostrar view solicitada
        const viewElement = document.getElementById(`${viewName}-view`);
        if (viewElement) {
            viewElement.style.display = 'block';
            
            // Atualizar navegação
            this.updateNavigation(viewName);
            
            // Inicializar componente se necessário
            const component = this.components[viewName];
            if (component && component.show) {
                await component.show();
            }
            
            this.currentView = viewName;
            
            // Emitir evento
            dataService.emit('view:changed', { view: viewName });
        } else {
            console.error(`❌ View não encontrada: ${viewName}`);
        }
    }

    // Esconder todas as views
    hideAllViews() {
        const views = ['list', 'editor', 'dossier'];
        views.forEach(view => {
            const element = document.getElementById(`${view}-view`);
            if (element) {
                element.style.display = 'none';
            }
        });
    }

    // Atualizar navegação
    updateNavigation(activeView) {
        document.querySelectorAll('[data-view]').forEach(btn => {
            btn.classList.remove('active', 'bg-blue-600', 'text-white');
            btn.classList.add('bg-gray-100', 'text-gray-700');
        });
        
        const activeBtn = document.querySelector(`[data-view="${activeView}"]`);
        if (activeBtn) {
            activeBtn.classList.remove('bg-gray-100', 'text-gray-700');
            activeBtn.classList.add('active', 'bg-blue-600', 'text-white');
        }
    }

    // Carregar e editar funcionário
    async loadAndEditEmployee(employeeId) {
        try {
            const employee = await apiService.getEmployee(employeeId);
            this.currentEmployee = employee;
            this.showView('editor');
        } catch (error) {
            console.error('❌ Erro ao carregar funcionário:', error);
            this.showError('Erro ao carregar funcionário.');
        }
    }

    // Carregar e visualizar dossier
    async loadAndViewDossier(employeeId) {
        try {
            const employee = await apiService.getEmployee(employeeId);
            this.currentEmployee = employee;
            this.showView('dossier');
        } catch (error) {
            console.error('❌ Erro ao carregar dossier:', error);
            this.showError('Erro ao carregar dossier.');
        }
    }

    // Mostrar mensagem de erro
    showError(message) {
        // Implementar toast de erro
        if (window.uiAlert) {
            window.uiAlert(message);
        } else {
            console.error(message);
        }
    }

    // Mostrar mensagem de sucesso
    showSuccess(message) {
        // Implementar toast de sucesso
        if (window.uiAlert) {
            window.uiAlert(message);
        } else {
            console.log('✅', message);
        }
    }

    // Getters
    get currentEmployeeData() {
        return this.currentEmployee;
    }

    get isReady() {
        return this.isInitialized;
    }
}

// Criar instância global
const employeesPro = new EmployeesPro();

// Exportar
export default employeesPro;
export { EmployeesPro };
