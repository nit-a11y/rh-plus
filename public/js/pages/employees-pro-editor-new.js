
// ===================================
// EDITOR DE COLABORADORES - VERSÃO 2.0
// Frontend Architect Persona - .agent
// ===================================

console.log('🚀 Editor v2.0 - Inicializando...');

// Estado global do editor
const EditorState = {
    currentEmployee: null,
    currentTab: 'identity',
    isDirty: false,
    templates: {},
    autoSaveTimer: null,
    originalData: null
};

// Configurações
const EditorConfig = {
    autoSaveDelay: 3000,
    apiEndpoints: {
        employee: '/api/employees-pro',
        documents: '/api/employee-documents',
        benefits: '/api/employee-benefits'
    }
};

// Inicialização principal
async function initEditor() {
    console.log('🔧 Inicializando Editor v2.0...');
    
    try {
        await loadTemplates();
        setupEventListeners();
        setupAutoSave();
        checkUrlParams();
        
        console.log('✅ Editor v2.0 inicializado com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao inicializar editor:', error);
        showError('Erro ao inicializar editor. Por favor, recarregue a página.');
    }
}

// Carregar templates
async function loadTemplates() {
    console.log('📝 Carregando templates...');
    
    try {
        const response = await fetch('editor-templates.html');
        if (!response.ok) throw new Error('Erro ao carregar templates');
        
        const html = await response.text();
        const div = document.createElement('div');
        div.innerHTML = html;
        
        const templateElements = div.querySelectorAll('[id^="tpl-"]');
        templateElements.forEach(tpl => {
            EditorState.templates[tpl.id.replace('tpl-', '')] = tpl.innerHTML;
        });
        
        console.log('✅ Templates carregados:', Object.keys(EditorState.templates).length);
    } catch (error) {
        console.error('❌ Erro ao carregar templates:', error);
        throw error;
    }
}

// Configurar event listeners
function setupEventListeners() {
    console.log('🎧 Configurando event listeners...');
    
    // Navegação entre abas
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.target.dataset.tab;
            if (tab) switchTab(tab);
        });
    });
    
    // Botões de salvamento
    const saveBtn = document.getElementById('save-employee-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveEmployee);
    }
    
    // Detectar mudanças nos campos
    document.addEventListener('input', handleFieldChange);
    document.addEventListener('change', handleFieldChange);
    
    console.log('✅ Event listeners configurados');
}

// Configurar auto salvamento
function setupAutoSave() {
    console.log('⏰ Configurando auto salvamento...');
    
    // Limpar timer anterior
    if (EditorState.autoSaveTimer) {
        clearTimeout(EditorState.autoSaveTimer);
    }
    
    // Configurar novo timer
    EditorState.autoSaveTimer = setTimeout(() => {
        if (EditorState.isDirty && EditorState.currentEmployee) {
            autoSave();
        }
    }, EditorConfig.autoSaveDelay);
}

// Verificar parâmetros da URL
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const employeeId = urlParams.get('editor_id');
    
    if (employeeId) {
        console.log('👤 ID do funcionário encontrado:', employeeId);
        loadEmployee(employeeId);
    }
}

// Carregar dados do funcionário
async function loadEmployee(employeeId) {
    console.log('📥 Carregando funcionário:', employeeId);
    
    try {
        showLoading(true);
        
        const response = await fetch(`${EditorConfig.apiEndpoints.employee}/${employeeId}`);
        if (!response.ok) throw new Error('Funcionário não encontrado');
        
        const data = await response.json();
        EditorState.currentEmployee = data;
        EditorState.originalData = JSON.parse(JSON.stringify(data));
        
        renderEmployee();
        showLoading(false);
        
        console.log('✅ Funcionário carregado:', data.name);
    } catch (error) {
        console.error('❌ Erro ao carregar funcionário:', error);
        showError('Erro ao carregar funcionário. Por favor, tente novamente.');
        showLoading(false);
    }
}

// Renderizar dados do funcionário
function renderEmployee() {
    console.log('🎨 Renderizando funcionário...');
    
    const employee = EditorState.currentEmployee;
    if (!employee) return;
    
    // Renderizar aba atual
    renderTab(EditorState.currentTab);
    
    // Atualizar título
    updatePageTitle(employee.name);
    
    // Resetar estado dirty
    EditorState.isDirty = false;
    updateSaveIndicator();
    
    console.log('✅ Funcionário renderizado');
}

// Renderizar aba específica
function renderTab(tabName) {
    console.log('📑 Renderizando aba:', tabName);
    
    const container = document.getElementById('editor-content-area');
    if (!container) return;
    
    const template = EditorState.templates[tabName];
    if (!template) {
        container.innerHTML = `
            <div class="text-center p-8 text-gray-500">
                <i class="fas fa-tools text-4xl mb-4"></i>
                <p class="text-lg font-semibold">Seção em desenvolvimento</p>
                <p class="text-sm">A seção "${tabName}" ainda está sendo implementada.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = template;
    
    // Preencher dados da aba
    populateTabData(tabName);
    
    // Atualizar aba ativa
    updateActiveTab(tabName);
    
    console.log('✅ Aba renderizada:', tabName);
}

// Preencher dados da aba
function populateTabData(tabName) {
    const employee = EditorState.currentEmployee;
    if (!employee) return;
    
    switch (tabName) {
        case 'identity':
            populateIdentity(employee);
            break;
        case 'documents':
            populateDocuments(employee);
            break;
        case 'contract':
            populateContract(employee);
            break;
        default:
            console.log('🔍 Sem dados para preencher na aba:', tabName);
    }
}

// Preencher aba de identidade
function populateIdentity(employee) {
    console.log('👤 Preenchendo identidade...');
    
    const fields = {
        'emp-name': employee.name || '',
        'emp-birth': employee.birthDate || '',
        'emp-gender': employee.gender || '',
        'emp-father': employee.fatherName || '',
        'emp-mother': employee.motherName || '',
        'emp-marital': employee.maritalStatus || '',
        'emp-ethnicity': employee.ethnicity || '',
        'emp-education': employee.educationLevel || '',
        'emp-email': employee.personalEmail || '',
        'emp-phone': employee.personalPhone || '',
        'emp-street': employee.street || '',
        'emp-cep': employee.cep || '',
        'emp-neighborhood': employee.neighborhood || '',
        'emp-city': employee.city || '',
        'emp-uf': employee.state_uf || '',
        'emp-registration': employee.registrationNumber || '',
        'emp-role': employee.role || '',
        'emp-sector': employee.sector || '',
        'emp-admission': employee.admissionDate || '',
        'emp-salary': employee.currentSalary || '',
        'emp-hierarchy': employee.hierarchy || '',
        'emp-work-scale': employee.work_scale || '',
        'emp-cbo': employee.cbo || '',
        'emp-contracting-type': employee.contracting_type || ''
    };
    
    // Preencher campos
    Object.entries(fields).forEach(([fieldId, value]) => {
        const element = document.getElementById(fieldId);
        if (element) {
            element.value = value;
        }
    });
    
    // Preencher naturalidade
    if (employee.placeOfBirth) {
        const [city, state] = employee.placeOfBirth.split(' / ');
        const cityElement = document.getElementById('emp-nat-city');
        const stateElement = document.getElementById('emp-nat-state');
        
        if (cityElement) cityElement.value = city || '';
        if (stateElement) stateElement.value = state || '';
    }
    
    console.log('✅ Identidade preenchida');
}

// Preencher aba de documentos
function populateDocuments(employee) {
    console.log('📄 Preenchendo documentos...');
    
    // Aqui viria a lógica para preencher documentos
    // Por enquanto, mostra placeholder
    const container = document.getElementById('documents-list');
    if (container) {
        container.innerHTML = '<p class="text-gray-500">Seção de documentos em desenvolvimento.</p>';
    }
}

// Preencher aba de contrato
function populateContract(employee) {
    console.log('📋 Preenchendo contrato...');
    
    const fields = {
        'emp-initial-role': employee.initialRole || '',
        'emp-initial-salary': employee.initialSalary || '',
        'emp-work-schedule': employee.work_schedule || ''
    };
    
    Object.entries(fields).forEach(([fieldId, value]) => {
        const element = document.getElementById(fieldId);
        if (element) {
            element.value = value;
        }
    });
    
    console.log('✅ Contrato preenchido');
}

// Mudar de aba
function switchTab(tabName) {
    console.log('🔄 Mudando para aba:', tabName);
    
    if (EditorState.currentTab === tabName) return;
    
    // Salvar dados atuais se necessário
    if (EditorState.isDirty) {
        if (!confirm('Você tem alterações não salvas. Deseja salvar antes de mudar de aba?')) {
            return;
        }
        saveEmployee();
    }
    
    EditorState.currentTab = tabName;
    renderTab(tabName);
}

// Salvar funcionário
async function saveEmployee() {
    console.log('💾 Salvando funcionário...');
    
    if (!EditorState.currentEmployee) {
        showError('Nenhum funcionário selecionado');
        return;
    }
    
    try {
        showLoading(true);
        
        const formData = collectFormData();
        
        const response = await fetch(`${EditorConfig.apiEndpoints.employee}/${EditorState.currentEmployee.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            throw new Error('Erro ao salvar funcionário');
        }
        
        const updatedData = await response.json();
        EditorState.currentEmployee = updatedData;
        EditorState.originalData = JSON.parse(JSON.stringify(updatedData));
        
        EditorState.isDirty = false;
        updateSaveIndicator();
        
        showSuccess('Funcionário salvo com sucesso!');
        showLoading(false);
        
        console.log('✅ Funcionário salvo');
    } catch (error) {
        console.error('❌ Erro ao salvar funcionário:', error);
        showError('Erro ao salvar funcionário. Por favor, tente novamente.');
        showLoading(false);
    }
}

// Auto salvar
async function autoSave() {
    console.log('⏰ Auto salvando...');
    
    if (!EditorState.currentEmployee || !EditorState.isDirty) return;
    
    try {
        const formData = collectFormData();
        
        const response = await fetch(`${EditorConfig.apiEndpoints.employee}/${EditorState.currentEmployee.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            const updatedData = await response.json();
            EditorState.currentEmployee = updatedData;
            EditorState.originalData = JSON.parse(JSON.stringify(updatedData));
            EditorState.isDirty = false;
            updateSaveIndicator();
            
            console.log('✅ Auto salvo');
        }
    } catch (error) {
        console.error('❌ Erro no auto salvamento:', error);
    }
}

// Coletar dados do formulário
function collectFormData() {
    const formData = {};
    
    // Coletar todos os inputs do formulário
    const inputs = document.querySelectorAll('#editor-content-area input, #editor-content-area select, #editor-content-area textarea');
    
    inputs.forEach(input => {
        if (input.id && input.value) {
            // Mapear IDs para campos do banco
            const fieldName = mapFieldToDatabase(input.id);
            if (fieldName) {
                formData[fieldName] = input.value.trim();
            }
        }
    });
    
    console.log('📊 Dados coletados:', Object.keys(formData).length, 'campos');
    return formData;
}

// Mapear campo do formulário para campo do banco
function mapFieldToDatabase(fieldId) {
    const fieldMap = {
        'emp-name': 'name',
        'emp-birth': 'birthDate',
        'emp-gender': 'gender',
        'emp-father': 'fatherName',
        'emp-mother': 'motherName',
        'emp-marital': 'maritalStatus',
        'emp-ethnicity': 'ethnicity',
        'emp-education': 'educationLevel',
        'emp-email': 'personalEmail',
        'emp-phone': 'personalPhone',
        'emp-street': 'street',
        'emp-cep': 'cep',
        'emp-neighborhood': 'neighborhood',
        'emp-city': 'city',
        'emp-uf': 'state_uf',
        'emp-registration': 'registrationNumber',
        'emp-role': 'role',
        'emp-sector': 'sector',
        'emp-admission': 'admissionDate',
        'emp-salary': 'currentSalary',
        'emp-hierarchy': 'hierarchy',
        'emp-work-scale': 'work_scale',
        'emp-work-schedule': 'work_schedule',
        'emp-cbo': 'cbo',
        'emp-contracting-type': 'contracting_type',
        'emp-initial-role': 'initialRole',
        'emp-initial-salary': 'initialSalary'
    };
    
    return fieldMap[fieldId] || null;
}

// Lidar com mudanças nos campos
function handleFieldChange(event) {
    if (!EditorState.currentEmployee) return;
    
    EditorState.isDirty = true;
    updateSaveIndicator();
    
    // Configurar auto salvamento
    setupAutoSave();
}

// Atualizar indicador de salvamento
function updateSaveIndicator() {
    const indicator = document.getElementById('save-indicator');
    if (!indicator) return;
    
    if (EditorState.isDirty) {
        indicator.innerHTML = '<i class="fas fa-circle text-yellow-500"></i> Não salvo';
        indicator.className = 'text-yellow-600 text-sm font-medium';
    } else {
        indicator.innerHTML = '<i class="fas fa-check-circle text-green-500"></i> Salvo';
        indicator.className = 'text-green-600 text-sm font-medium';
    }
}

// Atualizar aba ativa
function updateActiveTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-blue-600', 'text-white');
        btn.classList.add('bg-gray-100', 'text-gray-700');
    });
    
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeBtn) {
        activeBtn.classList.remove('bg-gray-100', 'text-gray-700');
        activeBtn.classList.add('active', 'bg-blue-600', 'text-white');
    }
}

// Atualizar título da página
function updatePageTitle(employeeName) {
    document.title = `Editando: ${employeeName} | Nordeste RH+`;
}

// Mostrar/ocultar loading
function showLoading(show) {
    const loading = document.getElementById('loading-overlay');
    if (loading) {
        loading.style.display = show ? 'flex' : 'none';
    }
}

// Mostrar mensagem de sucesso
function showSuccess(message) {
    // Implementar toast de sucesso
    console.log('✅', message);
    if (window.uiAlert) {
        window.uiAlert(message);
    }
}

// Mostrar mensagem de erro
function showError(message) {
    // Implementar toast de erro
    console.error('❌', message);
    if (window.uiAlert) {
        window.uiAlert(message);
    }
}

// Funções globais
window.EditorV2 = {
    initEditor,
    loadEmployee,
    saveEmployee,
    switchTab,
    currentEmployee: () => EditorState.currentEmployee,
    isDirty: () => EditorState.isDirty
};

// Exportar para compatibilidade
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initEditor, loadEmployee, saveEmployee };
}

console.log('✅ Editor v2.0 carregado');
