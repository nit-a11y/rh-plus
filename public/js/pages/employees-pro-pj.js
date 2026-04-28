// Funções utilitárias inline
function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

function parseCurrency(value) {
    return parseFloat(value.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function formatarDataHoraBR(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
}

function formatarDataBR(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

function calcularTempoCasa(startDate) {
    const start = new Date(startDate);
    const today = new Date();
    const diffTime = Math.abs(today - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    const days = diffDays % 30;
    
    let result = [];
    if (years > 0) result.push(`${years} ${years === 1 ? 'ano' : 'anos'}`);
    if (months > 0) result.push(`${months} ${months === 1 ? 'mês' : 'meses'}`);
    if (days > 0 && years === 0) result.push(`${days} ${days === 1 ? 'dia' : 'dias'}`);
    
    return result.join(' ') || '0 dias';
}

// Estado global para dados PJ
let currentPJData = {};
let pjContracts = [];
let pjAttachments = [];
let pjTemplates = [];

// Inicializar módulo PJ
function initPJModule() {
    setupPJEventListeners();
    loadPJTemplates();
    renderPJContracts(); // Inicializar lista de contratos
}

// Configurar event listeners
function setupPJEventListeners() {
    // Toggle tipo de contratação
    document.addEventListener('change', (e) => {
        if (e.target.name === 'contracting_type') {
            togglePJFields(e.target.value);
        }
    });
    
    // Validação de CNPJ
    document.addEventListener('input', (e) => {
        if (e.target.id === 'pj-cnpj') {
            formatCNPJInput(e.target);
        }
    });
}

// Toggle campos PJ/CLT
function togglePJFields(type) {
    const pjFields = document.querySelectorAll('.pj-field');
    const cltFields = document.querySelectorAll('.clt-field');
    
    if (type === 'PJ') {
        pjFields.forEach(field => field.style.display = 'block');
        cltFields.forEach(field => field.style.display = 'none');
    } else {
        pjFields.forEach(field => field.style.display = 'none');
        cltFields.forEach(field => field.style.display = 'block');
    }
}

// Formatador de CNPJ
function formatCNPJInput(input) {
    let value = input.value.replace(/[^\d]/g, '');
    
    if (value.length <= 14) {
        value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2}).*/, '$1.$2.$3/$4-$5');
        input.value = value;
    }
}

// Validar CNPJ
function validateCNPJ(cnpj) {
    cnpj = cnpj.replace(/[^\d]/g, '');
    
    if (cnpj.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cnpj)) return false;
    
    // Algoritmo de validação
    let length = cnpj.length - 2;
    let numbers = cnpj.substring(0, length);
    const digits = cnpj.substring(length);
    let sum = 0;
    let pos = length - 7;
    
    for (let i = length; i >= 1; i--) {
        sum += numbers.charAt(length - i) * pos--;
        if (pos < 2) pos = 9;
    }
    
    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;
    
    length = length + 1;
    numbers = cnpj.substring(0, length);
    sum = 0;
    pos = length - 7;
    
    for (let i = length; i >= 1; i--) {
        sum += numbers.charAt(length - i) * pos--;
        if (pos < 2) pos = 9;
    }
    
    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    
    return result === parseInt(digits.charAt(1));
}

// Carregar templates de contratos
async function loadPJTemplates() {
    try {
        const res = await fetch('/api/pj/templates');
        pjTemplates = await res.json();
    } catch (error) {
        console.error('Erro ao carregar templates PJ:', error);
    }
}

// Salvar dados PJ
function savePJData() {
    const form = document.getElementById('pj-form');
    if (!form) return;
    
    const formData = new FormData(form);
    const data = {};
    
    // Coletar dados do formulário
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    // Validar campos obrigatórios
    if (!data.company_name || !data.cnpj) {
        alert('Preencha os campos obrigatórios');
        return;
    }
    
    // Validar CNPJ
    if (!validateCNPJ(data.cnpj)) {
        alert('CNPJ inválido');
        return;
    }
    
    // Salvar dados
    currentPJData = data;
    console.log('Dados PJ salvos:', currentPJData);
    
    // Aqui você implementaria o envio para a API
    alert('Dados PJ salvos com sucesso!');
}

// Carregar dados PJ
function loadPJData(employeeId) {
    // Aqui você implementaria o carregamento da API
    fetch(`/api/employees-pj/${employeeId}`)
        .then(response => response.json())
        .then(data => {
            currentPJData = data;
            
            // Preencher formulário
            const form = document.getElementById('pj-form');
            if (form) {
                Object.keys(data).forEach(key => {
                    const input = form.querySelector(`[name="${key}"]`);
                    if (input) {
                        input.value = data[key];
                    }
                });
            }
        })
        .catch(error => {
            console.error('Erro ao carregar dados PJ:', error);
        });
}

// Adicionar contrato PJ
function addPJContract() {
    const contractData = {
        id: Date.now().toString(),
        start_date: '',
        end_date: '',
        value: '',
        description: ''
    };
    
    pjContracts.push(contractData);
    renderPJContracts();
}

// Remover contrato PJ
function removePJContract(contractId) {
    pjContracts = pjContracts.filter(c => c.id !== contractId);
    renderPJContracts();
}

// Renderizar contratos PJ
function renderPJContracts() {
    const container = document.getElementById('pj-contracts-list');
    if (!container) return;
    
    container.innerHTML = pjContracts.map(contract => `
        <div class="pj-contract-item border rounded-lg p-4 mb-3">
            <div class="flex justify-between items-start">
                <div>
                    <p class="font-semibold">Contrato PJ</p>
                    <p class="text-sm text-gray-600">Início: ${contract.start_date || 'Não definido'}</p>
                    <p class="text-sm text-gray-600">Fim: ${contract.end_date || 'Não definido'}</p>
                    <p class="text-sm text-gray-600">Valor: ${formatCurrency(contract.value || 0)}</p>
                </div>
                <button onclick="removePJContract('${contract.id}')" class="text-red-500 hover:text-red-700">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
}

// Carregar templates de contratos avançado (DESATIVADO - Agora integrado ao editor)
// Esta função foi mantida para compatibilidade, mas o modal PJ agora está integrado ao editor
window.openAdvancedVinculoModal = async (employeeId) => {
    console.log('⚠️ Modal avançado desativado - use a seção PJ integrada ao editor');
    alert('A gestão PJ/CLT agora está integrada diretamente no editor na aba "Vínculo".\n\nUse o botão "🔄 Alterar Tipo (CLT/PJ)" para alternar entre os tipos.');
};

// Obter cor do status
function getStatusColor(status) {
    switch (status) {
        case 'ACTIVE': return 'bg-green-100 text-green-800';
        case 'EXPIRED': return 'bg-red-100 text-red-800';
        case 'TERMINATED': return 'bg-gray-100 text-gray-800';
        default: return 'bg-yellow-100 text-yellow-800';
    }
}

// Salvar vínculo avançado
window.saveAdvancedVinculo = async () => {
    const contractingType = document.querySelector('input[name="contracting_type"]:checked')?.value || 'CLT';
    const employeeId = currentPJData.employeeId;
    
    try {
        // Atualizar tipo de contratação
        await fetch(`/api/pj/employees/${employeeId}/contracting-type`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contracting_type: contractingType })
        });
        
        if (contractingType === 'PJ') {
            // Salvar documentação PJ
            const pjData = {
                cnpj: document.getElementById('pj-cnpj').value,
                company_name: document.getElementById('pj-company-name').value,
                company_address: document.getElementById('pj-company-address').value,
                company_phone: document.getElementById('pj-company-phone').value,
                company_email: document.getElementById('pj-company-email').value,
                responsible_name: document.getElementById('pj-responsible-name').value
            };
            
            console.log('📝 Enviando dados PJ:', pjData);
            
            const pjRes = await fetch(`/api/pj/documentation/${employeeId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pjData)
            });
            
            if (!pjRes.ok) {
                const errorData = await pjRes.json();
                console.error('❌ Erro na documentação PJ:', errorData);
                throw new Error(`Erro na documentação PJ: ${errorData.error || pjRes.statusText}`);
            }
            
            const pjResult = await pjRes.json();
            console.log('✅ Documentação PJ salva:', pjResult);
        } else {
            // Salvar vínculo CLT
            const employerId = document.getElementById('clt-employer').value;
            const workplaceId = document.getElementById('clt-workplace').value;
            
            if (employerId && workplaceId) {
                await fetch(`/api/transfers/employee/${employeeId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to_employer_id: employerId,
                        to_workplace_id: workplaceId,
                        reason: 'Atualização de vínculo CLT',
                        changed_by: 'Admin'
                    })
                });
            }
        }
        
        alert('Vínculo atualizado com sucesso!');
        window.closeProModal();
        
        // Recarregar dados se necessário
        if (typeof window.loadEditorData === 'function') {
            window.loadEditorData(employeeId);
        }
        
    } catch (error) {
        console.error('Erro ao salvar vínculo:', error);
        alert('Erro ao salvar vínculo: ' + error.message);
    }
};

// Adicionar contrato PJ
window.addPJContract = () => {
    const modal = document.getElementById('pro-modal-container');
    const content = document.getElementById('pro-modal-content');
    
    content.innerHTML = `
        <div class="bg-green-600 p-8 text-white">
            <h3 class="text-xl font-black uppercase italic">Adicionar Contrato PJ</h3>
        </div>
        <div class="p-10 space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="pro-label">Número do Contrato</label>
                    <input type="text" id="contract-number" class="pro-input" placeholder="Opcional">
                </div>
                <div>
                    <label class="pro-label">Valor Mensal *</label>
                    <input type="number" id="monthly-value" class="pro-input" placeholder="0.00" step="0.01" required>
                </div>
                <div>
                    <label class="pro-label">Data Início *</label>
                    <input type="date" id="start-date" class="pro-input" required>
                </div>
                <div>
                    <label class="pro-label">Data Fim *</label>
                    <input type="date" id="end-date" class="pro-input" required>
                </div>
                <div>
                    <label class="pro-label">Forma de Pagamento</label>
                    <select id="payment-method" class="pro-input">
                        <option value="">Selecione...</option>
                        <option value="Transferência Bancária">Transferência Bancária</option>
                        <option value="PIX">PIX</option>
                        <option value="Dinheiro">Dinheiro</option>
                        <option value="Cheque">Cheque</option>
                    </select>
                </div>
                <div>
                    <label class="pro-label">Dia de Pagamento</label>
                    <input type="number" id="payment-day" class="pro-input" min="1" max="31" placeholder="10">
                </div>
            </div>
            
            <div>
                <label class="pro-label">Descrição</label>
                <textarea id="contract-description" class="pro-input" rows="3" 
                          placeholder="Descrição do contrato..."></textarea>
            </div>
            
            <div class="flex items-center gap-4">
                <label class="flex items-center">
                    <input type="checkbox" id="auto-renew" class="mr-2">
                    <span>Renovação Automática</span>
                </label>
                <div>
                    <label class="text-sm text-gray-600">Avisar (dias):</label>
                    <input type="number" id="renewal-days" class="pro-input text-sm" min="1" max="90" value="30" style="width: 80px;">
                </div>
            </div>
            
            <div class="flex justify-end gap-4 pt-4 border-t">
                <button onclick="window.closeProModal()" 
                        class="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300">
                    Cancelar
                </button>
                <button onclick="window.savePJContract()" 
                        class="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700">
                    💾 Salvar Contrato
                </button>
            </div>
        </div>
    `;
};

// Salvar contrato PJ
window.savePJContract = async () => {
    const employeeId = currentPJData.employeeId;
    
    const contractData = {
        contract_number: document.getElementById('contract-number').value,
        start_date: document.getElementById('start-date').value,
        end_date: document.getElementById('end-date').value,
        monthly_value: parseFloat(document.getElementById('monthly-value').value),
        payment_method: document.getElementById('payment-method').value,
        payment_day: parseInt(document.getElementById('payment-day').value),
        description: document.getElementById('contract-description').value,
        auto_renew: document.getElementById('auto-renew').checked,
        renewal_notice_days: parseInt(document.getElementById('renewal-days').value)
    };
    
    try {
        const res = await fetch(`/api/pj/contracts/${employeeId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contractData)
        });
        
        const result = await res.json();
        
        if (result.success) {
            alert('Contrato PJ adicionado com sucesso!');
            window.openAdvancedVinculoModal(employeeId); // Reabrir modal principal
        } else {
            alert('Erro ao adicionar contrato: ' + (result.error || 'Erro desconhecido'));
        }
    } catch (error) {
        console.error('Erro ao salvar contrato:', error);
        alert('Erro ao salvar contrato: ' + error.message);
    }
};

// Upload de anexo PJ
window.uploadPJAttachment = () => {
    // Criar input de arquivo
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
    input.multiple = true;
    
    input.onchange = async (e) => {
        const files = Array.from(e.target.files);
        
        for (const file of files) {
            // Aqui você implementaria o upload real do arquivo
            // Por enquanto, apenas simulamos
            console.log('Upload simulado:', file.name);
            
            // Você pode implementar o upload real usando FormData
            const formData = new FormData();
            formData.append('file', file);
            formData.append('employeeId', currentPJData.employeeId);
            
            // fetch('/api/pj/upload', { method: 'POST', body: formData })
        }
        
        alert('Arquivos enviados com sucesso!');
        window.openAdvancedVinculoModal(currentPJData.employeeId);
    };
    
    input.click();
};

// Download de anexo PJ
window.downloadPJAttachment = (attachmentId) => {
    const attachment = pjAttachments.find(a => a.id === attachmentId);
    if (attachment) {
        // Simular download
        console.log('Download simulado:', attachment.file_name);
        alert(`Download de ${attachment.file_name} simulado`);
    }
};

// Gerar contrato PJ
window.generatePJContract = (templateId = 'default_pj') => {
    const template = pjTemplates.find(t => t.id === templateId);
    if (!template) {
        alert('Template não encontrado');
        return;
    }
    
    // Aqui você implementaria a geração real do PDF
    console.log('Gerando contrato com template:', template.name);
    alert(`Contrato "${template.name}" gerado com sucesso!`);
};

// Exportar funções para uso global
window.initPJModule = initPJModule;
window.togglePJFields = togglePJFields;
window.savePJData = savePJData;
window.loadPJData = loadPJData;
window.addPJContract = addPJContract;
window.removePJContract = removePJContract;
window.uploadPJAttachment = uploadPJAttachment;
window.downloadPJAttachment = downloadPJAttachment;
window.generatePJContract = generatePJContract;

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    initPJModule();
});
