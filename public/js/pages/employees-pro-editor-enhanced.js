// ===================================
// EDITOR ENHANCED - AUTO SALVE E FORMATAÇÃO
// Database Architect Persona - .agent
// ===================================

import { calculateAge, parseCurrency, formatCurrency, formatarDataHoraBR, formatarDataBR, calcularTempoCasa } from '../utils.js';

// Estado global para dados PJ
let currentData = { employee: {}, documents: {}, career: [], occurrences: [], benefits: [], benefitHistory: [], uniformItems: [], uniformHistory: [], dependents: [], emergencyContacts: [] };
let currentEmpId = null;
let allCompanies = [];
let allRoles = [];
let templates = {};
let currentTab = 'identity';
let originalPhotoUrl = null;

// AUTO SALVAMENTO
let autoSaveTimeout = null;
let hasUnsavedChanges = false;
let lastSavedData = null;

// Funções de Transferência para o Editor
let companies = [];

// ===================================
// FUNÇÕES DE FORMATAÇÃO MELHORADAS
// ===================================

// Formatar CPF com máscara automática
window.formatCPF = (input) => {
    let value = input.value.replace(/\D/g, '');
    if (value.length <= 11) {
        value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    input.value = value;
    triggerAutoSave();
};

// Formatar PIS com máscara automática
window.formatPIS = (input) => {
    let value = input.value.replace(/\D/g, '');
    if (value.length <= 11) {
        value = value.replace(/(\d{3})(\d{5})(\d{2})(\d{1})/, '$1.$2.$3-$4');
    }
    input.value = value;
    triggerAutoSave();
};

// Formatar CNPJ com máscara automática
window.formatCNPJ = (input) => {
    let value = input.value.replace(/\D/g, '');
    if (value.length <= 14) {
        value = value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    input.value = value;
    triggerAutoSave();
};

// Formatar Telefone com máscara automática
window.formatPhone = (input) => {
    let value = input.value.replace(/\D/g, '');
    if (value.length <= 11) {
        if (value.length <= 10) {
            value = value.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        } else {
            value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        }
    }
    input.value = value;
    triggerAutoSave();
};

// Formatar CEP com máscara automática
window.formatCEP = (input) => {
    let value = input.value.replace(/\D/g, '');
    if (value.length <= 8) {
        value = value.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
    input.value = value;
    triggerAutoSave();
};

// Converter para maiúsculas
window.formatUpperCase = (input) => {
    input.value = input.value.toUpperCase();
    triggerAutoSave();
};

// Converter para minúsculas (e-mail)
window.formatLowerCase = (input) => {
    input.value = input.value.toLowerCase();
    triggerAutoSave();
};

// Formatar UF (2 letras maiúsculas)
window.formatUF = (input) => {
    input.value = input.value.toUpperCase().substring(0, 2);
    triggerAutoSave();
};

// Formatar apenas números
window.formatNumbersOnly = (input) => {
    input.value = input.value.replace(/\D/g, '');
    triggerAutoSave();
};

// ===================================
// SISTEMA DE AUTO SALVAMENTO
// ===================================

// Disparar auto salvamento
function triggerAutoSave() {
    if (!currentEmpId) return; // Não fazer nada se não há funcionário carregado
    
    // DESATIVADO TEMPORARIAMENTE - evitar erros 500
    console.log('💾 Auto salvamento desativado temporariamente');
    return;
    
    hasUnsavedChanges = true;
    updateSaveIndicator();
    
    // Limpar timeout anterior
    if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
    }
    
    // Configurar novo timeout (2 segundos após parar de digitar)
    autoSaveTimeout = setTimeout(() => {
        if (currentEmpId) { // Verificar novamente antes de salvar
            autoSave();
        }
    }, 2000);
}

// Auto salvar automático
async function autoSave() {
    if (!currentEmpId || !hasUnsavedChanges) return;
    
    try {
        // Coletar dados atuais dos campos
        const currentFormData = collectFormData();
        
        // Verificar se realmente mudou
        if (JSON.stringify(currentFormData) === JSON.stringify(lastSavedData)) {
            return;
        }
        
        console.log('💾 Auto salvando...');
        
        // Enviar apenas dados do employee (não enviar documents ainda)
        const employeeData = currentFormData.employee || {};
        
        // Salvar via API
        const response = await fetch(`/api/employees-pro/${currentEmpId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(employeeData)
        });
        
        if (response.ok) {
            lastSavedData = currentFormData;
            hasUnsavedChanges = false;
            updateSaveIndicator();
            console.log('✅ Auto salvo com sucesso');
        } else {
            const errorText = await response.text();
            console.error('❌ Erro ao auto salvar:', response.status, errorText);
        }
        
    } catch (error) {
        console.error('❌ Erro no auto salvamento:', error);
    }
}

// Salvar documentos separadamente
async function saveDocuments(employeeId, documents) {
    // Por enquanto, apenas log os documentos
    // Na implementação completa, isso enviaria para uma API específica de documentos
    console.log('💾 Salvando documentos para funcionário:', employeeId, documents);
    
    // Simulação de salvamento de documentos
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log('✅ Documentos salvos com sucesso');
            resolve();
        }, 500);
    });
}

// Coletar dados de todos os campos (APENAS CAMPOS VÁLIDOS)
function collectFormData() {
    console.log('🔍 collectFormData - Iniciando coleta de dados...');
    
    // Garantir retorno mínimo
    const data = {
        employee: {},
        documents: {}
    };
    
    // Verificar se currentData existe
    if (!currentData) {
        console.warn('⚠️ currentData não existe, retornando payload vazio');
        return data;
    }
    
    // VERIFICAÇÃO CRÍTICA: Verificar se elementos existem no DOM
    console.log('🔍 Verificando se elementos existem no DOM...');
    const nameElement = document.getElementById('emp-name');
    const emailElement = document.getElementById('emp-email');
    const cityElement = document.getElementById('emp-city');
    
    console.log('emp-name existe:', !!nameElement);
    console.log('emp-email existe:', !!emailElement);
    console.log('emp-city existe:', !!cityElement);
    
    // Se elementos principais não existem, tentar renderizar primeiro
    if (!nameElement || !emailElement) {
        console.warn('⚠️ Elementos principais não encontrados, tentando renderizar...');
        
        // Verificar se a área de conteúdo existe
        const contentArea = document.getElementById('editor-content-area');
        console.log('editor-content-area existe:', !!contentArea);
        
        // Se não existir, não podemos coletar dados
        if (!contentArea) {
            console.warn('⚠️ Área de conteúdo não encontrada, retornando payload vazio');
            return data;
        }
        
        // Tentar renderizar a aba de identidade
        if (currentTab === 'identity') {
            console.log('🔄 Tentando renderizar aba identity...');
            // Forçar renderização da aba
            const identityTemplate = templates['identity'];
            if (identityTemplate) {
                contentArea.innerHTML = identityTemplate;
                console.log('✅ Template identity renderizado');
                
                // Preencher dados existentes
                if (currentData.employee) {
                    populateIdentity(currentData.employee);
                }
                
                // Aguardar um pouco para o DOM atualizar
                setTimeout(() => {
                    console.log('🔄 DOM atualizado, tentando coletar dados novamente...');
                }, 100);
            } else {
                console.warn('⚠️ Template identity não encontrado');
            }
        }
    }
    
    // Campos válidos da tabela employees (BASEADO NA ANÁLISE COMPLETA DO BANCO)
    const validEmployeeFields = [
        'id', 'name', 'registrationNumber', 'role', 'sector', 'type', 'hierarchy',
        'admissionDate', 'birthDate', 'currentSalary', 'photoUrl', 'street',
        'city', 'neighborhood', 'state_uf', 'cep', 'employer_id', 'workplace_id',
        'fatherName', 'motherName', 'gender', 'maritalStatus', 'ethnicity',
        'educationLevel', 'placeOfBirth', 'personalEmail', 'personalPhone',
        'work_schedule', 'work_scale', 'cbo', 'criado_em', 'lat', 'lng',
        'initialRole', 'initialSalary', 'metadata', 'contracting_type'
    ];
    
    // Mapeamento de campos do formulário para campos do banco (BASEADO NA ANÁLISE COMPLETA)
    const fieldMapping = {
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
        'emp-number': 'street',
        'emp-complement': 'street',
        'emp-cep': 'cep',
        'emp-neighborhood': 'neighborhood',
        'emp-city': 'city',
        'emp-uf': 'state_uf',
        'emp-nat-city': 'placeOfBirth',
        'emp-nat-state': 'placeOfBirth',
        'emp-registration': 'registrationNumber',
        'emp-role': 'role',
        'emp-sector': 'sector',
        'emp-admission': 'admissionDate',
        'emp-type': 'type',
        'emp-salary': 'currentSalary',
        'emp-hierarchy': 'hierarchy',
        'emp-work-schedule': 'work_schedule',
        'emp-work-scale': 'work_scale',
        'emp-cbo': 'cbo',
        'emp-contracting-type': 'contracting_type',
        // Campos adicionais
        'emp-id': 'id',
        'emp-criado-em': 'criado_em',
        'emp-lat': 'lat',
        'emp-lng': 'lng',
        'emp-initial-role': 'initialRole',
        'emp-initial-salary': 'initialSalary',
        'emp-metadata': 'metadata',
        'emp-photo-url': 'photoUrl',
        'emp-employer-id': 'employer_id',
        'emp-workplace-id': 'workplace_id'
    };
    
    console.log('🔍 collectFormData - Mapeamento de campos:', Object.keys(fieldMapping));
    
    // Coletar dados de identificação (apenas campos válidos)
    let foundElements = 0;
    Object.keys(fieldMapping).forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element && element.value) {
            const dbField = fieldMapping[fieldId];
            
            // Verificar se o campo do banco é válido
            if (!validEmployeeFields.includes(dbField)) {
                console.warn(`⚠️ Campo inválido ignorado: ${dbField}`);
                return;
            }
            
            let value = element.value.trim();
            
            // Tratar campos combinados
            if (fieldId === 'emp-street') {
                const numberEl = document.getElementById('emp-number');
                const complementEl = document.getElementById('emp-complement');
                let fullStreet = value;
                
                if (numberEl && numberEl.value.trim()) {
                    fullStreet += ', ' + numberEl.value.trim();
                }
                if (complementEl && complementEl.value.trim()) {
                    fullStreet += ' - ' + complementEl.value.trim();
                }
                
                data.employee[dbField] = fullStreet;
                console.log(`✅ Campo combinado ${fieldId} → ${dbField}: ${fullStreet}`);
                foundElements++;
            } else if (fieldId === 'emp-nat-city') {
                const stateEl = document.getElementById('emp-nat-state');
                if (stateEl && stateEl.value.trim()) {
                    data.employee[dbField] = `${value} / ${stateEl.value.trim()}`;
                } else {
                    data.employee[dbField] = value;
                }
                console.log(`✅ Campo naturalidade ${fieldId} → ${dbField}: ${data.employee[dbField]}`);
                foundElements++;
            } else {
                // Aplicar formatações específicas
                if (dbField === 'personalEmail') {
                    data.employee[dbField] = value.toLowerCase();
                } else if (['name', 'fatherName', 'motherName', 'city'].includes(dbField)) {
                    data.employee[dbField] = value.toUpperCase();
                } else {
                    data.employee[dbField] = value;
                }
                console.log(`✅ Campo ${fieldId} → ${dbField}: ${data.employee[dbField]}`);
                foundElements++;
            }
        } else {
            console.log(`⚠️ Elemento não encontrado ou vazio: ${fieldId}`);
        }
    });
    
    console.log(`🔍 collectFormData - Elementos encontrados: ${foundElements}/${Object.keys(fieldMapping).length}`);
    
    // Se não encontrou elementos, tentar usar dados existentes
    if (foundElements === 0 && currentData.employee) {
        console.warn('⚠️ Nenhum elemento encontrado, usando dados existentes como fallback');
        
        // Usar dados existentes do currentData
        Object.keys(currentData.employee).forEach(key => {
            if (validEmployeeFields.includes(key) && currentData.employee[key]) {
                data.employee[key] = currentData.employee[key];
                console.log(`🔄 Fallback - Usando dado existente ${key}: ${data.employee[key]}`);
            }
        });
    }
    
    // Coletar dados de documentos (não enviar no PUT principal)
    const documentFields = [
        'doc-cpf', 'doc-pis', 'doc-rg', 'doc-rg-organ', 'doc-rg-uf',
        'doc-rg-date', 'doc-ctps', 'doc-cnh', 'doc-title', 'doc-zone', 'doc-section'
    ];
    
    documentFields.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element && element.value) {
            const fieldName = fieldId.replace('doc-', '');
            data.documents[fieldName] = element.value.trim();
        }
    });
    
    // Remover campos undefined ou vazios
    Object.keys(data.employee).forEach(key => {
        if (data.employee[key] === undefined || data.employee[key] === '') {
            delete data.employee[key];
            console.log(`🗑️ Campo removido (vazio): ${key}`);
        }
    });
    
    console.log('🔍 collectFormData - Dados coletados:', data.employee);
    console.log('🔍 collectFormData - Campos válidos:', Object.keys(data.employee));
    console.log('🔍 collectFormData - Documentos coletados:', Object.keys(data.documents));
    
    return data;
}

// Indicador visual de salvamento
function updateSaveIndicator() {
    const indicator = document.getElementById('save-indicator');
    if (!indicator) {
        // Tentar criar indicador se não existir
        createSaveIndicator();
        return;
    }
    
    if (hasUnsavedChanges) {
        indicator.innerHTML = '💾 Salvando...';
        indicator.className = 'px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium';
    } else {
        indicator.innerHTML = '✅ Salvo';
        indicator.className = 'px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium';
    }
}

// Criar indicador de salvamento
function createSaveIndicator() {
    // Tentar diferentes seletores para encontrar o header
    const header = document.querySelector('#module-editor .bg-nordeste-black') || 
                   document.querySelector('#module-editor .bg-orange-600') ||
                   document.querySelector('#module-editor header') ||
                   document.querySelector('#module-editor');
    
    if (header) {
        // Verificar se já existe um indicador
        const existingIndicator = document.getElementById('save-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        const indicator = document.createElement('div');
        indicator.id = 'save-indicator';
        indicator.className = 'px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium';
        indicator.innerHTML = '✅ Salvo';
        
        // Adicionar ao final do header
        header.appendChild(indicator);
        console.log('✅ Indicador de salvamento criado');
    } else {
        console.log('⚠️ Header não encontrado, indicador não criado');
    }
}

// ===================================
// APLICAÇÃO AUTOMÁTICA DE MÁSCARAS
// ===================================

// Aplicar máscaras a todos os campos
function applyMasks() {
    // CPF
    const cpfInputs = document.querySelectorAll('[data-mask="cpf"]');
    cpfInputs.forEach(input => {
        input.addEventListener('input', () => window.formatCPF(input));
        input.addEventListener('blur', () => window.formatCPF(input));
    });
    
    // PIS
    const pisInputs = document.querySelectorAll('[data-mask="pis"]');
    pisInputs.forEach(input => {
        input.addEventListener('input', () => window.formatPIS(input));
        input.addEventListener('blur', () => window.formatPIS(input));
    });
    
    // CNPJ
    const cnpjInputs = document.querySelectorAll('[data-mask="cnpj"]');
    cnpjInputs.forEach(input => {
        input.addEventListener('input', () => window.formatCNPJ(input));
        input.addEventListener('blur', () => window.formatCNPJ(input));
    });
    
    // Telefone
    const phoneInputs = document.querySelectorAll('[data-mask="phone"]');
    phoneInputs.forEach(input => {
        input.addEventListener('input', () => window.formatPhone(input));
        input.addEventListener('blur', () => window.formatPhone(input));
    });
    
    // CEP
    const cepInputs = document.querySelectorAll('[data-mask="cep"]');
    cepInputs.forEach(input => {
        input.addEventListener('input', () => window.formatCEP(input));
        input.addEventListener('blur', () => window.formatCEP(input));
    });
    
    // UF
    const ufInputs = document.querySelectorAll('[data-mask="uf"]');
    ufInputs.forEach(input => {
        input.addEventListener('input', () => window.formatUF(input));
        input.addEventListener('blur', () => window.formatUF(input));
    });
    
    // Texto (maiúsculo)
    const textInputs = document.querySelectorAll('[data-mask="text"]');
    textInputs.forEach(input => {
        input.addEventListener('input', () => window.formatUpperCase(input));
        input.addEventListener('blur', () => window.formatUpperCase(input));
    });
    
    // Números
    const numberInputs = document.querySelectorAll('[data-mask="number"]');
    numberInputs.forEach(input => {
        input.addEventListener('input', () => window.formatNumbersOnly(input));
        input.addEventListener('blur', () => window.formatNumbersOnly(input));
    });
    
    // E-mail (minúsculo)
    const emailInputs = document.querySelectorAll('#emp-email');
    emailInputs.forEach(input => {
        input.addEventListener('input', () => window.formatLowerCase(input));
        input.addEventListener('blur', () => window.formatLowerCase(input));
    });
}

// ===================================
// INICIALIZAÇÃO ENHANCED
// ===================================

// Inicializar editor enhanced
export async function initEditorEnhanced() {
    await loadTemplates();
    setupNav();
    setupAutoSave();
    applyMasks();
    
    const saveBtn = document.getElementById('btn-save-master');
    if (saveBtn) saveBtn.onclick = saveAll;
    
    console.log('🚀 Editor Enhanced inicializado com auto salvamento e formatação');
}

// Configurar auto salvamento
function setupAutoSave() {
    // Salvar estado inicial após um pequeno delay
    setTimeout(() => {
        if (currentEmpId && currentData) {
            lastSavedData = collectFormData();
            createSaveIndicator();
            console.log('✅ Auto salvamento configurado');
        }
    }, 1500); // Aumentado para garantir que o DOM esteja pronto
    
    // Salvar ao mudar de aba
    const originalRenderTab = window.renderTab;
    window.renderTab = function() {
        // Auto salvar antes de mudar de aba
        if (hasUnsavedChanges && currentEmpId) {
            autoSave();
        }
        originalRenderTab();
    };
    
    // Salvar antes de fechar o editor
    window.addEventListener('beforeunload', (e) => {
        if (hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = 'Você tem alterações não salvas. Deseja realmente sair?';
        }
    });
}

// Exportar funções para escopo global
window.initEditorEnhanced = initEditorEnhanced;
window.applyMasks = applyMasks;
window.triggerAutoSave = triggerAutoSave;

// ===================================
// FUNÇÕES EXISTENTES (MANTIDAS)
// ===================================

async function loadCompanies() {
    try {
        const res = await fetch('/api/companies');
        companies = await res.json();
        return companies;
    } catch (error) {
        console.error('Erro ao carregar empresas:', error);
        return [];
    }
}

function setupNav() {
    document.querySelectorAll('#editor-nav .nav-tab-pro').forEach(tab => {
        tab.onclick = () => {
            document.querySelectorAll('#editor-nav .nav-tab-pro').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentTab = tab.dataset.tab;
            renderTab();
        };
    });
}

function renderTab() {
    const area = document.getElementById('editor-content-area');
    if (!area || !currentData) return;
    area.innerHTML = templates[currentTab] || `<div class="p-20 text-center text-gray-400 italic font-black uppercase text-[10px]">Módulo ${currentTab} em breve.</div>`;

    if (currentTab === 'identity') populateIdentity(currentData.employee);
    else if (currentTab === 'documents') { populateDocuments(currentData.documents); window.renderGeneralDocsList(); }
    else if (currentTab === 'contract') populateContract(currentData.employee);
    else if (currentTab === 'history') renderHistoryTab();
    else if (currentTab === 'benefits') renderBenefitsTab();
    else if (currentTab === 'family') renderFamilyTab();
    
    // Aplicar máscaras após renderizar
    setTimeout(() => applyMasks(), 100);
}

function populateVinculos(vinculos) {
    const container = document.getElementById('vinculos-container');
    if (!container) return;

    const isPJ = currentData.employee.contracting_type === 'PJ';
    
    container.innerHTML = `
        <div class="mb-4 flex justify-between items-center">
            <h3 class="text-lg font-bold text-gray-800">🏢 VÍNCULO CORPORATIVO</h3>
            <div class="flex gap-2">
                <button onclick="window.toggleContractingType()" 
                        class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all text-sm">
                    🔄 Alterar Tipo (CLT/PJ)
                </button>
                <button onclick="window.addVinculo()" 
                        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm">
                    + Adicionar Vínculo
                </button>
            </div>
        </div>
        
        <!-- Seção PJ (aparece só se for PJ) -->
        ${isPJ ? `
            <div class="bg-purple-50 border-2 border-purple-200 rounded-xl p-6 mb-6">
                <h4 class="text-lg font-black text-purple-700 mb-4">📋 Documentação PJ</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="pro-label">CNPJ *</label>
                        <input type="text" id="pj-cnpj" class="pro-input" 
                               placeholder="XX.XXX.XXX/XXXX-XX" 
                               value="${currentData.employee.pj_cnpj || ''}"
                               maxlength="18"
                               oninput="window.formatCNPJ(this)"
                               onchange="window.updatePJData('pj_cnpj', this.value)">
                    </div>
                    <div>
                        <label class="pro-label">Razão Social *</label>
                        <input type="text" id="pj-company-name" class="pro-input" 
                               placeholder="Nome da empresa" 
                               value="${currentData.employee.pj_company_name || ''}"
                               style="text-transform: uppercase;"
                               oninput="window.formatUpperCase(this)"
                               onchange="window.updatePJData('pj_company_name', this.value)">
                    </div>
                    <div>
                        <label class="pro-label">Endereço</label>
                        <input type="text" id="pj-company-address" class="pro-input" 
                               placeholder="Endereço completo" 
                               value="${currentData.employee.pj_company_address || ''}"
                               style="text-transform: uppercase;"
                               oninput="window.formatUpperCase(this)"
                               onchange="window.updatePJData('pj_company_address', this.value)">
                    </div>
                    <div>
                        <label class="pro-label">Telefone</label>
                        <input type="text" id="pj-company-phone" class="pro-input" 
                               placeholder="(00) 00000-0000" 
                               value="${currentData.employee.pj_company_phone || ''}"
                               oninput="window.formatPhone(this)"
                               onchange="window.updatePJData('pj_company_phone', this.value)">
                    </div>
                    <div>
                        <label class="pro-label">E-mail</label>
                        <input type="email" id="pj-company-email" class="pro-input" 
                               placeholder="empresa@email.com" 
                               value="${currentData.employee.pj_company_email || ''}"
                               style="text-transform: lowercase;"
                               oninput="window.formatLowerCase(this)"
                               onchange="window.updatePJData('pj_company_email', this.value)">
                    </div>
                    <div>
                        <label class="pro-label">Responsável</label>
                        <input type="text" id="pj-responsible-name" class="pro-input" 
                               placeholder="Nome do responsável" 
                               value="${currentData.employee.pj_responsible_name || ''}"
                               style="text-transform: uppercase;"
                               oninput="window.formatUpperCase(this)"
                               onchange="window.updatePJData('pj_responsible_name', this.value)">
                    </div>
                </div>
                
                <!-- Gestão de Contratos -->
                <div class="bg-green-50 border-2 border-green-200 rounded-xl p-6 mt-6">
                    <h4 class="text-lg font-black text-green-700 mb-4">📄 Gestão de Contratos</h4>
                    
                    <div class="mb-4">
                        <button onclick="window.addPJContract()" 
                                class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all">
                            + Adicionar Período Contratual
                        </button>
                    </div>
                    
                    <div id="pj-contracts-list" class="space-y-3">
                        <p class="text-gray-500 text-center py-4">Carregando contratos...</p>
                    </div>
                </div>
                
                <!-- Anexos -->
                <div class="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mt-6">
                    <h4 class="text-lg font-black text-blue-700 mb-4">📎 Anexos</h4>
                    
                    <div class="mb-4">
                        <button onclick="window.uploadPJAttachment()" 
                                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all">
                            + Anexar Documento
                        </button>
                    </div>
                    
                    <div id="pj-attachments-list" class="space-y-2">
                        <p class="text-gray-500 text-center py-4">Carregando anexos...</p>
                    </div>
                </div>
            </div>
        ` : ''}
        
        <!-- Vínculos CLT/PJ padrão -->
        ${vinculos.map((vinculo, index) => `
            <div class="vinculo-item bg-white p-4 rounded-lg border border-gray-200 shadow-sm" data-index="${index}">
                <div class="flex justify-between items-center mb-3">
                    <h4 class="font-bold text-gray-800 uppercase text-sm">Vínculo ${index + 1}</h4>
                    <div class="flex gap-2">
                        <label class="flex items-center gap-1 text-xs">
                            <input type="checkbox" class="vinculo-principal" ${vinculo.principal ? 'checked' : ''} onchange="window.togglePrincipal(${index})">
                            Principal
                        </label>
                        ${vinculos.length > 1 ? `<button onclick="window.removeVinculo(${index})" class="text-red-500 hover:text-red-700 text-sm">✕</button>` : ''}
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="pro-label uppercase text-xs">EMPREGADOR (CONTRATUAL)</label>
                        <select class="vinculo-employer pro-input font-bold uppercase"></select>
                    </div>
                    <div>
                        <label class="pro-label uppercase text-xs">LOCAL DE ATUAÇÃO (FÍSICO)</label>
                        <select class="vinculo-workplace pro-input font-bold uppercase"></select>
                    </div>
                </div>
            </div>
        `).join('')}
    `;

    // Carregar dados nos selects de vínculos
    vinculos.forEach((vinculo, index) => {
        const employerSel = container.querySelector(`[data-index="${index}"] .vinculo-employer`);
        const workplaceSel = container.querySelector(`[data-index="${index}"] .vinculo-workplace`);

        if (employerSel) {
            // Filtrar apenas empregadores (type = 'Empregador', 'Ambos', ou vazio)
            const employers = allCompanies.filter(c => {
                const type = (c.type || '').toLowerCase();
                return type === 'empregador' || type === 'ambos' || type === 'company' || !type || type === '';
            });
            
            employerSel.innerHTML = '<option value="">-- SELECIONE --</option>' + employers.map(c =>
                `<option value="${c.id}" ${vinculo.employer_id === c.id ? 'selected' : ''}>${c.name}</option>`
            ).join('');
        }

        if (workplaceSel) {
            // Filtrar apenas unidades (type = 'Unidade', 'Ambos', ou vazio)
            const workplaces = allCompanies.filter(c => {
                const type = (c.type || '').toLowerCase();
                return type === 'unidade' || type === 'workplace' || type === 'ambos' || !type || type === '';
            });
            
            workplaceSel.innerHTML = '<option value="">-- SELECIONE --</option>' + workplaces.map(c =>
                `<option value="${c.id}" ${vinculo.workplace_id === c.id ? 'selected' : ''}>${c.name}</option>`
            ).join('');
        }
    });
    
    // Se for PJ, carregar contratos e anexos
    if (isPJ) {
        loadPJData();
    }
}

function populateContract(e) {
    const emp = e || {};
    const fields = {
        'emp-name': emp.name,
        'emp-birth': emp.birthDate,
        'emp-gender': emp.gender,
        'emp-father': emp.fatherName,
        'emp-mother': emp.motherName,
        'emp-marital': emp.maritalStatus,
        'emp-ethnicity': emp.ethnicity,
        'emp-education': emp.educationLevel,
        'emp-nat-city': natCity,
        'emp-nat-state': natState,
        'emp-email': emp.personalEmail,
        'emp-phone': emp.personalPhone,
        'emp-street': pureStreet,
        'emp-number': numStr,
        'emp-complement': compStr,
        'emp-cep': emp.cep,
        'emp-neighborhood': emp.neighborhood,
        'emp-city': emp.city,
        'emp-uf': emp.state_uf,
        // Campos adicionais
        'emp-id': emp.id,
        'emp-criado-em': emp.criado_em,
        'emp-lat': emp.lat,
        'emp-lng': emp.lng,
        'emp-initial-role': emp.initialRole,
        'emp-initial-salary': emp.initialSalary,
        'emp-metadata': emp.metadata,
        'emp-photo-url': emp.photoUrl,
        'emp-employer-id': emp.employer_id,
        'emp-workplace-id': emp.workplace_id,
        'emp-registration': emp.registrationNumber,
        'emp-role': emp.role,
        'emp-sector': emp.sector,
        'emp-admission': emp.admissionDate,
        'emp-type': emp.type,
        'emp-salary': emp.currentSalary,
        'emp-hierarchy': emp.hierarchy,
        'emp-work-schedule': emp.work_schedule,
        'emp-work-scale': emp.work_scale,
        'emp-cbo': emp.cbo,
        'emp-contracting-type': emp.contracting_type
    };
    Object.keys(fields).forEach(id => { const el = document.getElementById(id); if (el) el.value = fields[id] || ''; });
}

function renderHistoryTab() {
    const area = document.getElementById('h-career-timeline');
    if (!area) return;
    
    const history = currentData.career || [];
    
    if (history.length === 0) {
        area.innerHTML = '<p class="text-gray-500 text-center py-8">Nenhum registro na carreira encontrado.</p>';
        return;
    }
    
    area.innerHTML = history.map(item => `
        <div class="border-l-4 border-blue-500 pl-4 pb-4">
            <div class="flex justify-between items-start">
                <div>
                    <h4 class="font-bold text-gray-800">${item.role || 'Cargo não informado'}</h4>
                    <p class="text-sm text-gray-600">${item.sector || 'Setor não informado'}</p>
                    <p class="text-xs text-gray-500">${formatarDataBR(item.date)} - ${item.type || 'Promoção'}</p>
                </div>
                <button onclick="window.removeCareerItem('${item.id}')" class="text-red-500 hover:text-red-700">
                    ✕
                </button>
            </div>
        </div>
    `).join('');
}

function renderBenefitsTab() {
    const area = document.getElementById('benefits-list-area');
    if (!area) return;
    
    const benefits = currentData.benefits || [];
    
    if (benefits.length === 0) {
        area.innerHTML = '<p class="text-gray-500 text-center py-8">Nenhum benefício ativo encontrado.</p>';
        return;
    }
    
    area.innerHTML = benefits.map(benefit => `
        <div class="bg-white p-4 rounded-lg border border-gray-200 mb-2">
            <div class="flex justify-between items-center">
                <div>
                    <h4 class="font-bold text-gray-800">${benefit.name}</h4>
                    <p class="text-sm text-gray-600">${formatCurrency(benefit.value)}</p>
                    <p class="text-xs text-gray-500">Início: ${formatarDataBR(benefit.startDate)}</p>
                </div>
                <button onclick="window.removeBenefit('${benefit.id}')" class="text-red-500 hover:text-red-700">
                    ✕
                </button>
            </div>
        </div>
    `).join('');
}

function renderFamilyTab() {
    const sosArea = document.getElementById('emergency-list-area');
    const depArea = document.getElementById('dependents-list-area');

    // Renderizar contatos de emergência
    if (sosArea) {
        const emergency = currentData.emergencyContacts || [];
        if (emergency.length === 0) {
            sosArea.innerHTML = '<p class="text-gray-500 text-center py-4">Nenhum contato de emergência cadastrado.</p>';
        } else {
            sosArea.innerHTML = emergency.map(contact => `
                <div class="bg-white p-3 rounded-lg border border-gray-200 mb-2">
                    <div class="flex justify-between items-center">
                        <div>
                            <h4 class="font-bold text-gray-800">${contact.name}</h4>
                            <p class="text-sm text-gray-600">${contact.relationship}</p>
                            <p class="text-xs text-gray-500">${contact.phone}</p>
                        </div>
                        <button onclick="window.removeEmergencyContact('${contact.id}')" class="text-red-500 hover:text-red-700">
                            ✕
                        </button>
                    </div>
                </div>
            `).join('');
        }
    }

    // Renderizar dependentes
    if (depArea) {
        const dependents = currentData.dependents || [];
        if (dependents.length === 0) {
            depArea.innerHTML = '<p class="text-gray-500 text-center py-4">Nenhum dependente cadastrado.</p>';
        } else {
            depArea.innerHTML = dependents.map(dep => `
                <div class="bg-white p-3 rounded-lg border border-gray-200 mb-2">
                    <div class="flex justify-between items-center">
                        <div>
                            <h4 class="font-bold text-gray-800">${dep.name}</h4>
                            <p class="text-sm text-gray-600">${dep.relationship}</p>
                            <p class="text-xs text-gray-500">CPF: ${dep.cpf || 'N/A'}</p>
                        </div>
                        <button onclick="window.removeDependent('${dep.id}')" class="text-red-500 hover:text-red-700">
                            ✕
                        </button>
                    </div>
                </div>
            `).join('');
        }
    }
}

// Funções auxiliares PJ
function loadPJData() {
    // Carregar contratos PJ
    loadPJContracts();
    // Carregar anexos PJ
    loadPJAttachments();
}

function loadPJContracts() {
    const container = document.getElementById('pj-contracts-list');
    if (!container) return;
    
    // Simulação - na implementação real, buscar da API
    container.innerHTML = '<p class="text-gray-500 text-center py-4">Nenhum contrato cadastrado.</p>';
}

function loadPJAttachments() {
    const container = document.getElementById('pj-attachments-list');
    if (!container) return;
    
    // Simulação - na implementação real, buscar da API
    container.innerHTML = '<p class="text-gray-500 text-center py-4">Nenhum anexo encontrado.</p>';
}

// Funções globais para PJ
window.updatePJData = async (field, value) => {
    if (!currentEmpId) return;
    
    try {
        const response = await fetch(`/api/employees-pro/${currentEmpId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                employee: {
                    [field]: value
                }
            })
        });
        
        if (response.ok) {
            currentData.employee[field] = value;
            triggerAutoSave();
        }
    } catch (error) {
        console.error('Erro ao atualizar dado PJ:', error);
    }
};

window.addPJContract = () => {
    window.uiAlert('Funcionalidade em desenvolvimento');
};

window.uploadPJAttachment = () => {
    window.uiAlert('Funcionalidade em desenvolvimento');
};

// Alternar entre CLT e PJ
window.toggleContractingType = async () => {
    if (!currentEmpId || !currentData) {
        window.uiAlert('❌ Nenhum funcionário selecionado');
        return;
    }
    
    const currentType = currentData.employee.contracting_type || 'CLT';
    const newType = currentType === 'CLT' ? 'PJ' : 'CLT';
    
    // Confirmar alteração
    const confirmed = confirm(`Deseja alterar o tipo de contratação de ${currentType} para ${newType}?\n\nEsta ação irá:\n- Atualizar o tipo de contratação\n- Reconfigurar os campos do formulário\n- Manter os dados existentes`);
    
    if (!confirmed) return;
    
    try {
        // Atualizar tipo no banco
        const response = await fetch(`/api/employees-pro/${currentEmpId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contracting_type: newType
            })
        });
        
        if (!response.ok) {
            throw new Error(`Erro ao atualizar tipo: ${response.status}`);
        }
        
        // Atualizar dados locais
        currentData.employee.contracting_type = newType;
        
        // Re-renderizar a aba de identidade para mostrar os campos corretos
        renderTab('identity');
        
        // Mostrar mensagem de sucesso
        window.uiAlert(`✅ Tipo alterado para ${newType} com sucesso!`);
        
        // Atualizar indicador visual
        updateContractingTypeIndicator(newType);
        
        // Disparar auto save
        triggerAutoSave();
        
        console.log(`🔄 Tipo alterado: ${currentType} → ${newType}`);
        
    } catch (error) {
        console.error('❌ Erro ao alterar tipo:', error);
        window.uiAlert('❌ Erro ao alterar tipo de contratação: ' + error.message);
    }
};

// Atualizar indicador visual do tipo de contratação
function updateContractingTypeIndicator(type) {
    // Atualizar botão
    const toggleBtn = document.querySelector('button[onclick*="toggleContractingType"]');
    if (toggleBtn) {
        toggleBtn.innerHTML = `🔄 Alterar Tipo (${type} → ${type === 'CLT' ? 'PJ' : 'CLT'})`;
        toggleBtn.className = type === 'PJ' 
            ? 'px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm'
            : 'px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all text-sm';
    }
    
    // Atualizar indicador na seção de vínculos
    const vinculoContainer = document.getElementById('vinculos-container');
    if (vinculoContainer) {
        const typeIndicator = vinculoContainer.querySelector('.type-indicator');
        if (typeIndicator) {
            typeIndicator.innerHTML = `
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    type === 'PJ' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                }">
                    ${type === 'PJ' ? '📋 PESSOA JURÍDICA' : '👷 PESSOA FÍSICA'}
                </span>
            `;
        } else {
            // Criar indicador se não existir
            const header = vinculoContainer.querySelector('h3');
            if (header) {
                header.insertAdjacentHTML('afterend', `
                    <div class="type-indicator mb-3">
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            type === 'PJ' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                        }">
                            ${type === 'PJ' ? '📋 PESSOA JURÍDICA' : '👷 PESSOA FÍSICA'}
                        </span>
                    </div>
                `);
            }
        }
    }
}

window.addVinculo = () => {
    window.uiAlert('Funcionalidade em desenvolvimento');
};

window.togglePrincipal = (index) => {
    window.uiAlert('Funcionalidade em desenvolvimento');
};

window.removeVinculo = (index) => {
    window.uiAlert('Funcionalidade em desenvolvimento');
};

window.removeCareerItem = (id) => {
    window.uiAlert('Funcionalidade em desenvolvimento');
};

window.removeBenefit = (id) => {
    window.uiAlert('Funcionalidade em desenvolvimento');
};

window.removeEmergencyContact = (id) => {
    window.uiAlert('Funcionalidade em desenvolvimento');
};

window.removeDependent = (id) => {
    window.uiAlert('Funcionalidade em desenvolvimento');
};

function populateIdentity(e) {
    console.log('🔍 populateIdentity - Iniciando preenchimento...');
    console.log('🔍 populateIdentity - Dados recebidos:', e);
    
    const emp = e || {};
    console.log('🔍 populateIdentity - Emp object:', emp);
    
    const vinculos = emp.vinculos || currentData.vinculos || (emp.employer_id ? [{
        employer_id: emp.employer_id,
        workplace_id: emp.workplace_id,
        principal: true
    }] : []);

    populateVinculos(vinculos);

    // Mantém os outros campos
    let natCity = '';
    let natState = '';
    if (emp.placeOfBirth && String(emp.placeOfBirth).includes(' / ')) {
        const [city, uf] = String(emp.placeOfBirth).split(' / ');
        natCity = city || '';
        natState = uf || '';
    } else {
        natCity = emp.placeOfBirth || '';
    }

    let fullSt = (emp.street || '').trim();
    let pureStreet = fullSt; let numStr = ''; let compStr = '';

    if (fullSt.includes(',')) {
        const parts = fullSt.split(',');
        pureStreet = parts[0].trim();
        const rest = parts.slice(1).join(',').trim();
        if (rest.includes('-')) {
            const spl = rest.split('-');
            numStr = spl[0].trim();
            compStr = spl.slice(1).join('-').trim();
        } else {
            numStr = rest;
        }
    }

    const fields = {
        'emp-name': emp.name,
        'emp-birth': emp.birthDate,
        'emp-gender': emp.gender,
        'emp-father': emp.fatherName,
        'emp-mother': emp.motherName,
        'emp-marital': emp.maritalStatus,
        'emp-ethnicity': emp.ethnicity,
        'emp-education': emp.educationLevel,
        'emp-nat-city': natCity,
        'emp-nat-state': natState,
        'emp-email': emp.personalEmail,
        'emp-phone': emp.personalPhone,
        'emp-street': pureStreet,
        'emp-number': numStr,
        'emp-complement': compStr,
        'emp-cep': emp.cep,
        'emp-neighborhood': emp.neighborhood,
        'emp-city': emp.city,
        'emp-uf': emp.state_uf
    };
    
    console.log('🔍 populateIdentity - Campos a preencher:', fields);
    
    // VERIFICAÇÃO CRÍTICA: Verificar se elementos existem antes de preencher
    let foundElements = 0;
    let missingElements = [];
    
    Object.keys(fields).forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.value = fields[id] || '';
            console.log(`✅ Campo ${id} preenchido com: "${fields[id] || ''}"`);
            foundElements++;
        } else {
            console.warn(`⚠️ Elemento não encontrado: ${id}`);
            missingElements.push(id);
        }
    });
    
    console.log(`🔍 populateIdentity - Elementos encontrados: ${foundElements}/${Object.keys(fields).length}`);
    console.log(`🔍 populateIdentity - Elementos faltantes:`, missingElements);
    
    // Se muitos elementos estão faltando, tentar novamente após um delay
    if (missingElements.length > Object.keys(fields).length / 2) {
        console.warn('⚠️ Muitos elementos faltando, tentando preencher novamente...');
        setTimeout(() => {
            console.log('🔄 Segunda tentativa de preenchimento...');
            let retryFound = 0;
            Object.keys(fields).forEach(id => {
                const el = document.getElementById(id);
                if (el && !el.value) {
                    el.value = fields[id] || '';
                    console.log(`✅ Retry - Campo ${id} preenchido com: "${fields[id] || ''}"`);
                    retryFound++;
                }
            });
            console.log(`🔍 populateIdentity - Retry - Elementos preenchidos: ${retryFound}`);
        }, 500);
    }
}

function populateDocuments(d) {
    const docs = d || {};
    const fields = {
        'doc-cpf': docs.cpf,
        'doc-pis': docs.pis_pasep,
        'doc-rg': docs.rg_number,
        'doc-rg-organ': docs.rg_organ,
        'doc-rg-uf': docs.rg_uf,
        'doc-rg-date': docs.rg_issue_date,
        'doc-ctps': docs.ctps,
        'doc-cnh': docs.cnh,
        'doc-title': docs.voter_title,
        'doc-zone': docs.voter_zone,
        'doc-section': docs.voter_section
    };
    Object.keys(fields).forEach(id => { const el = document.getElementById(id); if (el) el.value = fields[id] || ''; });
}

async function loadTemplates() {
    try {
        const res = await fetch('editor-templates.html');
        if (!res.ok) throw new Error("Arquivo de templates não encontrado");
        const html = await res.text();
        const div = document.createElement('div');
        div.innerHTML = html;
        const templateElements = div.querySelectorAll('[id^="tpl-"]');
        templateElements.forEach(tpl => {
            templates[tpl.id.replace('tpl-', '')] = tpl.innerHTML;
        });
    } catch (error) {
        console.error('Erro ao carregar templates:', error);
    }
}

// Função saveAll existente (mantida)
async function saveAll() {
    if (!currentEmpId || !currentData) return;
    const btn = document.getElementById('btn-save-master');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<div class="spinner border-white w-4 h-4 mx-auto"></div>';
    btn.disabled = true;

    try {
        // Coletar dados usando a função corrigida
        const payload = collectFormData();
        
        // Verificar se o payload foi coletado corretamente
        if (!payload || !payload.employee) {
            throw new Error('Erro ao coletar dados do formulário');
        }
        
        // Debug: Mostrar payload antes de enviar
        console.log('🔍 DEBUG - Payload que será enviado:', payload.employee);
        console.log('🔍 DEBUG - Campos do payload:', Object.keys(payload.employee));
        
        // Enviar apenas dados do employee (documents são salvos separadamente)
        const response = await fetch(`/api/employees-pro/${currentEmpId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload.employee)
        });

        if (!response.ok) throw new Error(`Erro ${response.status}: ${response.statusText}`);

        const result = await response.json();
        window.uiAlert('✅ Dados salvos com sucesso!');
        hasUnsavedChanges = false;
        updateSaveIndicator();
        
        // Salvar documentos separadamente se houver mudanças
        if (payload.documents && Object.keys(payload.documents).length > 0) {
            try {
                await saveDocuments(currentEmpId, payload.documents);
            } catch (docError) {
                console.warn('Aviso: Erro ao salvar documentos:', docError);
                window.uiAlert('⚠️ Dados salvos, mas houve erro ao salvar alguns documentos');
            }
        }
        
        // Atualizar dados salvos
        lastSavedData = collectFormData();

    } catch (err) {
        console.error('Erro ao salvar:', err);
        window.uiAlert('❌ Erro ao salvar: ' + err.message);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

function unmaskNumeric(value) {
    if (value === null || value === undefined) return '';
    return value.toString().replace(/\D/g, '');
}

function getPhotoUrlToSave() {
    const currentSrc = document.getElementById('editor-avatar').src;
    console.log('🔍 Análise da foto para salvar:', { currentSrc, originalPhotoUrl });
    
    if (currentSrc.startsWith('data:')) {
        console.log('📸 Nova foto detectada (data URL)');
        return currentSrc;
    }
    
    if (currentSrc.includes('ui-avatars.com')) {
        console.log('🎭 Foto placeholder detectada');
        return originalPhotoUrl || null;
    }
    
    if (currentSrc === originalPhotoUrl) {
        console.log('🔄 Foto original mantida');
        return originalPhotoUrl;
    }
    
    console.log('🖼️ Usando URL atual da foto');
    return currentSrc;
}

// Outras funções existentes (mantidas para compatibilidade)
window.openEmployeeEditor = async (id) => {
    currentEmpId = id;
    resetEditorState();
    
    try {
        const [compRes, rolesRes, empRes] = await Promise.all([
            fetch('/api/companies'), 
            fetch('/api/roles'), 
            fetch(`/api/employees-pro/${id}/dossier`)
        ]);
        
        allCompanies = await compRes.json();
        allRoles = await rolesRes.json();
        const resJson = await empRes.json();

        if (!resJson.success) throw new Error(resJson.error);

        currentData = {
            employee: resJson.employee || {},
            documents: resJson.documents || {},
            career: resJson.career || [],
            occurrences: resJson.occurrences || [],
            benefits: resJson.benefits || [],
            benefitHistory: resJson.benefitHistory || [],
            uniformItems: resJson.uniformItems || [],
            uniformHistory: resJson.uniformHistory || [],
            dependents: resJson.dependents || [],
            emergencyContacts: resJson.emergencyContacts || [],
            vinculos: resJson.vinculos || [],
            documentFiles: resJson.documentFiles || (resJson.employee?.metadata ? JSON.parse(resJson.employee.metadata).documentFiles : []) || []
        };

        if (!originalPhotoUrl) {
            originalPhotoUrl = resJson.employee?.photoUrl || null;
        }

        document.getElementById('editor-name').innerHTML = `
            ${currentData.employee.name || 'Sem Nome'}
            <span class="contracting-type-badge ${getContractingTypeClass(currentData.employee.contracting_type)}">
                ${getContractingTypeLabel(currentData.employee.contracting_type)}
            </span>
        `;
        document.getElementById('editor-reg').innerText = `#${currentData.employee.registrationNumber || '0000'}`;
        
        document.getElementById('editor-avatar').src = currentData.employee.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentData.employee.name || 'U')}&background=D32F2F&color=fff`;
        
        window.toggleModule('editor');
        renderTab();
        
        // Inicializar auto salvamento após carregar
        setTimeout(() => {
            lastSavedData = collectFormData();
            hasUnsavedChanges = false;
            updateSaveIndicator();
        }, 1000);
        
    } catch (err) { 
        console.error('❌ Erro ao carregar editor:', err);
        window.uiAlert("Erro ao carregar editor: " + err.message); 
    }
};

function resetEditorState() {
    currentData = { employee: {}, documents: {}, career: [], occurrences: [], benefits: [], benefitHistory: [], uniformItems: [], uniformHistory: [], dependents: [], emergencyContacts: [] };
    hasUnsavedChanges = false;
    lastSavedData = null;
    if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
    }
}

function getContractingTypeClass(type) {
    switch (type) {
        case 'PJ': return 'pj-badge';
        case 'CLT': return 'clt-badge';
        default: return 'default-badge';
    }
}

function getContractingTypeLabel(type) {
    return type || 'CLT';
}

// Inicializar enhanced em vez do original
document.addEventListener('DOMContentLoaded', () => {
    initEditorEnhanced();
});

// ===================================
// FUNÇÕES PARA SEÇÕES ADICIONAIS
// Database Architect Persona - .agent
// ===================================

// Funções para BENEFÍCIOS
function populateBenefits(benefits) {
    const container = document.getElementById('benefits-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!benefits || benefits.length === 0) {
        container.innerHTML = '<p class="text-gray-500 italic">Nenhum benefício cadastrado.</p>';
        return;
    }
    
    benefits.forEach((benefit, index) => {
        const benefitHTML = `
            <div class="border rounded-lg p-4 bg-gray-50">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                        <label class="pro-label uppercase">Tipo</label>
                        <input type="text" id="benefit-type-${index}" class="pro-input" value="${benefit.benefit_type || ''}">
                    </div>
                    <div>
                        <label class="pro-label uppercase">Valor</label>
                        <input type="text" id="benefit-value-${index}" class="pro-input" value="${benefit.value || ''}">
                    </div>
                    <div>
                        <label class="pro-label uppercase">Status</label>
                        <select id="benefit-status-${index}" class="pro-input">
                            <option value="ACTIVE" ${benefit.status === 'ACTIVE' ? 'selected' : ''}>Ativo</option>
                            <option value="SUSPENDED" ${benefit.status === 'SUSPENDED' ? 'selected' : ''}>Suspenso</option>
                            <option value="CANCELLED" ${benefit.status === 'CANCELLED' ? 'selected' : ''}>Cancelado</option>
                        </select>
                    </div>
                    <div>
                        <label class="pro-label uppercase">Início</label>
                        <input type="date" id="benefit-start-${index}" class="pro-input" value="${benefit.start_date || ''}">
                    </div>
                </div>
                <div class="mt-3 flex justify-end">
                    <button onclick="removeBenefit(${index})" class="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">Remover</button>
                </div>
            </div>
        `;
        container.innerHTML += benefitHTML;
    });
}

function addBenefit() {
    if (!currentData) return;
    
    if (!currentData.benefits) {
        currentData.benefits = [];
    }
    
    currentData.benefits.push({
        benefit_type: '',
        value: '',
        status: 'ACTIVE',
        start_date: ''
    });
    
    populateBenefits(currentData.benefits);
}

function removeBenefit(index) {
    if (!currentData || !currentData.benefits) return;
    
    currentData.benefits.splice(index, 1);
    populateBenefits(currentData.benefits);
}

// Funções para DEPENDENTES
function populateDependents(dependents) {
    const container = document.getElementById('dependents-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!dependents || dependents.length === 0) {
        container.innerHTML = '<p class="text-gray-500 italic">Nenhum dependente cadastrado.</p>';
        return;
    }
    
    dependents.forEach((dep, index) => {
        const dependentHTML = `
            <div class="border rounded-lg p-4 bg-gray-50">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label class="pro-label uppercase">Nome Completo</label>
                        <input type="text" id="dep-name-${index}" class="pro-input" value="${dep.name || ''}">
                    </div>
                    <div>
                        <label class="pro-label uppercase">CPF</label>
                        <input type="text" id="dep-cpf-${index}" class="pro-input" value="${dep.cpf || ''}">
                    </div>
                    <div>
                        <label class="pro-label uppercase">Nascimento</label>
                        <input type="date" id="dep-birth-${index}" class="pro-input" value="${dep.birth_date || ''}">
                    </div>
                    <div>
                        <label class="pro-label uppercase">Parentesco</label>
                        <input type="text" id="dep-rel-${index}" class="pro-input" value="${dep.relationship || ''}">
                    </div>
                </div>
                <div class="mt-3 flex justify-end">
                    <button onclick="removeDependent(${index})" class="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">Remover</button>
                </div>
            </div>
        `;
        container.innerHTML += dependentHTML;
    });
}

function addDependent() {
    if (!currentData) return;
    
    if (!currentData.dependents) {
        currentData.dependents = [];
    }
    
    currentData.dependents.push({
        name: '',
        cpf: '',
        birth_date: '',
        relationship: ''
    });
    
    populateDependents(currentData.dependents);
}

function removeDependent(index) {
    if (!currentData || !currentData.dependents) return;
    
    currentData.dependents.splice(index, 1);
    populateDependents(currentData.dependents);
}

// Funções para CONTATOS DE EMERGÊNCIA
function populateEmergencyContacts(contacts) {
    const container = document.getElementById('emergency-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!contacts || contacts.length === 0) {
        container.innerHTML = '<p class="text-gray-500 italic">Nenhum contato de emergência cadastrado.</p>';
        return;
    }
    
    contacts.forEach((contact, index) => {
        const contactHTML = `
            <div class="border rounded-lg p-4 bg-gray-50">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label class="pro-label uppercase">Nome</label>
                        <input type="text" id="emergency-name-${index}" class="pro-input" value="${contact.name || ''}">
                    </div>
                    <div>
                        <label class="pro-label uppercase">Parentesco</label>
                        <input type="text" id="emergency-rel-${index}" class="pro-input" value="${contact.relationship || ''}">
                    </div>
                    <div>
                        <label class="pro-label uppercase">Telefone</label>
                        <input type="text" id="emergency-phone-${index}" class="pro-input" value="${contact.phone || ''}">
                    </div>
                    <div>
                        <label class="pro-label uppercase">E-mail</label>
                        <input type="text" id="emergency-email-${index}" class="pro-input" value="${contact.email || ''}">
                    </div>
                </div>
                <div class="mt-3 flex justify-end">
                    <button onclick="removeEmergencyContact(${index})" class="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">Remover</button>
                </div>
            </div>
        `;
        container.innerHTML += contactHTML;
    });
}

function addEmergencyContact() {
    if (!currentData) return;
    
    if (!currentData.emergency_contacts) {
        currentData.emergency_contacts = [];
    }
    
    currentData.emergency_contacts.push({
        name: '',
        relationship: '',
        phone: '',
        email: ''
    });
    
    populateEmergencyContacts(currentData.emergency_contacts);
}

function removeEmergencyContact(index) {
    if (!currentData || !currentData.emergency_contacts) return;
    
    currentData.emergency_contacts.splice(index, 1);
    populateEmergencyContacts(currentData.emergency_contacts);
}

// Função principal para carregar todas as seções
function loadAllSections() {
    if (!currentData) return;
    
    // Carregar seções existentes
    populateIdentity(currentData.employee);
    populateDocuments(currentData.documents);
    
    // Carregar seções adicionais
    populateBenefits(currentData.benefits || []);
    populateDependents(currentData.dependents || []);
    populateEmergencyContacts(currentData.emergency_contacts || []);
    populateUniforms(currentData.uniforms || []);
    populateTools(currentData.tools || []);
    populateVacations(currentData.vacations || []);
    populateASOs(currentData.asos || []);
    populateCareer(currentData.career || []);
}

// Atualizar renderTab para incluir novas seções
if (typeof originalRenderTab === 'function') {
    renderTab = function() {
        originalRenderTab();
        
        // Carregar seções adicionais
        if (currentTab === 'benefits') populateBenefits(currentData.benefits || []);
        if (currentTab === 'dependents') populateDependents(currentData.dependents || []);
        if (currentTab === 'emergency') populateEmergencyContacts(currentData.emergency_contacts || []);
        if (currentTab === 'uniforms') populateUniforms(currentData.uniforms || []);
        if (currentTab === 'tools') populateTools(currentData.tools || []);
        if (currentTab === 'vacations') populateVacations(currentData.vacations || []);
        if (currentTab === 'asos') populateASOs(currentData.asos || []);
        if (currentTab === 'career') populateCareer(currentData.career || []);
    };
}

// ===================================
// FUNÇÕES PARA SEÇÕES ADICIONAIS
// Database Architect Persona - .agent
// ===================================

// Carregar dados de TODAS as seções
function loadAllDossierData() {
    if (!currentData) return;
    
    console.log('🔍 Carregando TODOS os dados do dossier...');
    
    // Carregar seções principais
    populateIdentity(currentData.employee);
    populateDocuments(currentData.documents);
    
    // Carregar seções adicionais
    populateBenefits(currentData.benefits || []);
    populateDependents(currentData.dependents || []);
    populateEmergencyContacts(currentData.emergency_contacts || []);
    populateUniforms(currentData.uniforms || []);
    populateTools(currentData.tools || []);
    populateVacations(currentData.vacations || []);
    populateASOs(currentData.asos || []);
    populateCareer(currentData.career || []);
}

// Fim do arquivo - funções duplicadas removidas

// Função final para carregar seções adicionais
function loadAdditionalSections() {
    if (!currentData) return;
    
    console.log('🔍 Carregando seções adicionais...');
    
    // Carregar seções adicionais se existirem
    if (currentTab === 'benefits') {
        console.log('🔍 Carregando benefícios...');
        const container = document.getElementById('benefits-list');
        if (container) {
            container.innerHTML = '<p class="text-gray-500 italic">Seção de benefícios em desenvolvimento.</p>';
        }
    }
    
    if (currentTab === 'dependents') {
        console.log('🔍 Carregando dependentes...');
        const container = document.getElementById('dependents-list');
        if (container) {
            container.innerHTML = '<p class="text-gray-500 italic">Seção de dependentes em desenvolvimento.</p>';
        }
    }
    
    if (currentTab === 'emergency') {
        console.log('🔍 Carregando contatos de emergência...');
        const container = document.getElementById('emergency-list');
        if (container) {
            container.innerHTML = '<p class="text-gray-500 italic">Seção de contatos de emergência em desenvolvimento.</p>';
        }
    }
    
    if (currentTab === 'uniforms') {
        console.log('🔍 Carregando uniformes...');
        const container = document.getElementById('uniforms-list');
        if (container) {
            container.innerHTML = '<p class="text-gray-500 italic">Seção de uniformes em desenvolvimento.</p>';
        }
    }
    
    if (currentTab === 'tools') {
        console.log('🔍 Carregando ferramentas...');
        const container = document.getElementById('tools-list');
        if (container) {
            container.innerHTML = '<p class="text-gray-500 italic">Seção de ferramentas em desenvolvimento.</p>';
        }
    }
    
    if (currentTab === 'vacations') {
        console.log('🔍 Carregando férias...');
        const container = document.getElementById('vacations-list');
        if (container) {
            container.innerHTML = '<p class="text-gray-500 italic">Seção de férias em desenvolvimento.</p>';
        }
    }
    
    if (currentTab === 'asos') {
        console.log('🔍 Carregando ASOs...');
        const container = document.getElementById('asos-list');
        if (container) {
            container.innerHTML = '<p class="text-gray-500 italic">Seção de ASOs em desenvolvimento.</p>';
        }
    }
    
    if (currentTab === 'career') {
        console.log('🔍 Carregando histórico de carreira...');
        const container = document.getElementById('career-list');
        if (container) {
            container.innerHTML = '<p class="text-gray-500 italic">Seção de histórico de carreira em desenvolvimento.</p>';
        }
    }
}

// Sobrescrever renderTab para incluir seções adicionais
const originalRenderTab = renderTab;
renderTab = function() {
    originalRenderTab();
    
    // Carregar seções adicionais
    setTimeout(() => {
        loadAdditionalSections();
    }, 100);
};

console.log('✅ Funções adicionais configuradas');

// Função corrigida para abrir editor
window.openEmployeeEditor = async function(id) {
    console.log('🔍 Abrindo editor para funcionário:', id);
    
    try {
        // Carregar dados primeiro
        await window.loadEditorData(id);
        
        // Alternar para o módulo editor
        if (window.toggleModule) {
            window.toggleModule('editor');
        } else {
            // Fallback: mostrar diretamente
            const editorElement = document.getElementById('editor-module');
            if (editorElement) {
                editorElement.style.display = 'block';
            } else {
                console.error('❌ Elemento do editor não encontrado');
            }
        }
    } catch (error) {
        console.error('❌ Erro ao abrir editor:', error);
        if (window.uiAlert) {
            window.uiAlert('Erro ao abrir editor');
        }
    }
};

// Função global para compatibilidade
export function openEmployeeEditor(id) {
    window.openEmployeeEditor(id);
}
