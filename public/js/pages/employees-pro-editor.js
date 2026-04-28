
import { calculateAge, formatCurrencyInput, parseCurrency, formatCurrency } from '../utils.js';

let currentEmpId = null;
let currentData = { employee: {}, documents: {}, career: [], occurrences: [], benefits: [], benefitHistory: [], uniformItems: [], uniformHistory: [], dependents: [], emergencyContacts: [] };
let currentTab = 'identity';
let allCompanies = [];
let allRoles = [];
let templates = {};

// Funções de Transferência para o Editor
let companies = [];

window.openModuleFromEditor = (module) => {
    if (!currentEmpId) {
        alert('Selecione um colaborador primeiro.');
        return;
    }
    
    const empId = currentEmpId;
    const routes = {
        carreira: '/carreira.html',
        vacation: '/vacation-unified.html',
       aso: '/aso.html',
        uniforms: '/uniforms-module.html',
        tools: '/tools-module.html'
    };
    
    window.location.href = `${routes[module]}?emp=${empId}`;
};

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

window.openTransferModalFromEditor = async () => {
    if (!currentEmpId) {
        alert('Selecione um colaborador primeiro.');
        return;
    }
    
    // Buscar dados do colaborador atual do editor
    const employee = currentData.employee || {};
    
    // Se não tiver dados, buscar da API
    let empData = employee;
    if (!empData.name) {
        try {
            const empRes = await fetch(`/api/employees/${currentEmpId}`);
            empData = await empRes.json();
        } catch (error) {
            console.error('Erro ao buscar dados do colaborador:', error);
            alert('Erro ao carregar dados do colaborador.');
            return;
        }
    }
    
    // Carregar empresas com tratamento de erro
    let companies = [];
    try {
        console.log('Buscando empresas da API...');
        const companiesRes = await fetch('/api/companies');
        if (!companiesRes.ok) {
            throw new Error(`HTTP ${companiesRes.status}: ${companiesRes.statusText}`);
        }
        companies = await companiesRes.json();
        console.log('Empresas carregadas:', companies.length, companies);
        
        // Debug dos tipos
        const types = [...new Set(companies.map(c => c.type))];
        console.log('Tipos de empresas encontrados:', types);
        
    } catch (error) {
        console.error('Erro ao carregar empresas:', error);
        alert('Erro ao carregar lista de empresas: ' + error.message);
        return;
    }
    
    // Separar empresas e unidades - usando os tipos corretos do sistema
    const employers = companies.filter(c => {
        const type = (c.type || '').toLowerCase();
        return type === 'empregador' || type === 'ambos';
    });
    const workplaces = companies.filter(c => {
        const type = (c.type || '').toLowerCase();
        return type === 'unidade' || type === 'ambos';
    });
    
    console.log('Empresas encontradas:', employers.length, 'de', companies.length);
    console.log('Unidades encontradas:', workplaces.length, 'de', companies.length);
    
    // Se não encontrar nada, mostrar tudo
    const allEmployers = employers.length > 0 ? employers : companies;
    const allWorkplaces = workplaces.length > 0 ? workplaces : companies;
    
    // Criar modal usando o container existente
    const modal = document.getElementById('pro-modal-container');
    const content = document.getElementById('pro-modal-content');
    
    content.innerHTML = `
        <div class="bg-orange-500 p-6 text-white">
            <h3 class="text-xl font-black uppercase italic">Transferência de Empregador/Unidade</h3>
        </div>
        <div class="p-8 space-y-6">
            <div class="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <p class="text-sm font-bold text-blue-600">Colaborador:</p>
                <p class="text-lg font-black text-gray-800">${empData.name || 'Carregando...'}</p>
                <p class="text-sm text-gray-600">Matrícula: ${empData.registrationNumber || 'Carregando...'}</p>
                <p class="text-sm text-gray-600">Atual: ${empData.employer_name || 'N/A'} / ${empData.workplace_name || 'N/A'}</p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">Novo Empregador</label>
                    <select id="new-employer" class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500">
                        <option value="">Manter atual</option>
                        ${allEmployers.map(e => 
                            `<option value="${e.id}" ${e.id === empData.employer_id ? 'selected' : ''}>${e.name}</option>`
                        ).join('')}
                    </select>
                    <p class="text-xs text-gray-500 mt-1">${allEmployers.length} empresa(s) disponível(is)</p>
                </div>
                
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">Nova Unidade</label>
                    <select id="new-workplace" class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500">
                        <option value="">Manter atual</option>
                        ${allWorkplaces.map(w => 
                            `<option value="${w.id}" ${w.id === empData.workplace_id ? 'selected' : ''}>${w.name}</option>`
                        ).join('')}
                    </select>
                    <p class="text-xs text-gray-500 mt-1">${allWorkplaces.length} unidade(s) disponível(is)</p>
                </div>
            </div>
            
            <div>
                <label class="block text-sm font-bold text-gray-700 mb-2">Motivo da Transferência</label>
                <textarea id="transfer-reason" class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500" rows="3" 
                    placeholder="Descreva o motivo da transferência..."></textarea>
            </div>
            
            <div>
                <label class="block text-sm font-bold text-gray-700 mb-2">Responsável pela Transferência</label>
                <input type="text" id="transfer-responsible" class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500" 
                    placeholder="Nome do responsável..." value="Admin">
            </div>
            
            <div class="flex justify-end gap-4 pt-4">
                <button onclick="window.closeProModal()" 
                    class="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-all">
                    Cancelar
                </button>
                <button onclick="window.executeTransferFromEditor()" 
                    class="px-6 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-all">
                    Confirmar Transferência
                </button>
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
};

window.executeTransferFromEditor = async () => {
    const newEmployer = document.getElementById('new-employer').value;
    const newWorkplace = document.getElementById('new-workplace').value;
    const reason = document.getElementById('transfer-reason').value;
    const responsible = document.getElementById('transfer-responsible').value;
    
    if (!newEmployer && !newWorkplace) {
        alert('Selecione pelo menos um novo empregador ou unidade');
        return;
    }
    
    if (!reason.trim()) {
        alert('Informe o motivo da transferência');
        return;
    }
    
    try {
        const res = await fetch(`/api/transfers/employee/${currentEmpId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to_employer_id: newEmployer || null,
                to_workplace_id: newWorkplace || null,
                reason,
                changed_by: responsible
            })
        });
        
        const data = await res.json();
        
        if (data.success) {
            alert(`Transferência registrada com sucesso!\n\n${data.transfer.employee_name}\nDe: ${data.transfer.from_employer || 'N/A'} / ${data.transfer.from_workplace || 'N/A'}\nPara: ${data.transfer.to_employer || 'N/A'} / ${data.transfer.to_workplace || 'N/A'}`);
            window.closeProModal();
            
            // Recarregar dados do colaborador no editor usando a função correta
            if (typeof window.loadEditorData === 'function') {
                window.loadEditorData(currentEmpId);
            } else if (typeof window.openEmployeeEditor === 'function') {
                window.openEmployeeEditor(currentEmpId);
            } else {
                console.log('Funções disponíveis:', Object.keys(window).filter(k => k.includes('load') || k.includes('edit')));
                // Recarregar a página como fallback
                setTimeout(() => location.reload(), 1000);
            }
        } else {
            alert('Erro ao registrar transferência: ' + (data.error || 'Erro desconhecido'));
        }
    } catch (error) {
        console.error('Erro na transferência:', error);
        alert('Erro ao registrar transferência. Verifique o console.');
    }
};

window.viewTransferHistoryFromEditor = async () => {
    if (!currentEmpId) {
        alert('Selecione um colaborador primeiro.');
        return;
    }
    
    try {
        const res = await fetch(`/api/transfers/employee/${currentEmpId}/history`);
        const history = await res.json();
        
        const modal = document.getElementById('pro-modal-container');
        const content = document.getElementById('pro-modal-content');
        
        // Buscar nome do colaborador para exibição
        const employee = currentData.employee || {};
        const empName = employee.name || 'Colaborador';
        
        content.innerHTML = `
            <div class="bg-blue-600 p-6 text-white">
                <h3 class="text-xl font-black uppercase italic">Histórico de Transferências</h3>
                <p class="text-sm mt-2 opacity-90">${empName}</p>
            </div>
            <div class="p-8">
                ${history.length === 0 ? 
                    '<div class="text-center py-8"><p class="text-gray-500 mb-4">Nenhuma transferência registrada</p><p class="text-sm text-gray-400">Este colaborador ainda não possui histórico de transferências.</p></div>' :
                    `<div class="space-y-4">
                        ${history.map(t => `
                            <div class="border rounded-lg p-4 hover:shadow-md transition-all bg-gray-50">
                                <div class="flex justify-between items-start mb-2">
                                    <div>
                                        <p class="font-bold text-gray-800">${t.changed_at ? new Date(t.changed_at).toLocaleString('pt-BR') : 'Data não disponível'}</p>
                                        <p class="text-sm text-gray-600">Responsável: ${t.changed_by || 'Não informado'}</p>
                                    </div>
                                    <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                                        TRANSFERÊNCIA
                                    </span>
                                </div>
                                <div class="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p class="font-semibold text-gray-700">De:</p>
                                        <p class="text-gray-600">${t.from_employer_name || 'N/A'} / ${t.from_workplace_name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p class="font-semibold text-gray-700">Para:</p>
                                        <p class="text-gray-600">${t.to_employer_name || 'N/A'} / ${t.to_workplace_name || 'N/A'}</p>
                                    </div>
                                </div>
                                ${t.observation ? `<p class="mt-3 text-sm text-gray-600 italic bg-blue-50 p-2 rounded">📝 Motivo: ${t.observation}</p>` : '<p class="mt-3 text-sm text-gray-400 italic">Sem motivo informado</p>'}
                            </div>
                        `).join('')}
                    </div>`
                }
                
                <div class="flex justify-between items-center mt-6 pt-4 border-t">
                    <p class="text-xs text-gray-500">Total: ${history.length} transferência(ões)</p>
                    <button onclick="window.closeProModal()" 
                        class="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-all">
                        Fechar
                    </button>
                </div>
            </div>
        `;
        
        modal.classList.remove('hidden');
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        alert('Erro ao carregar histórico de transferências. Tente novamente.');
    }
};

// Expõe para o escopo global (window)
window.formatCurrencyInput = formatCurrencyInput;

/**
 * Máscara inteligente para Naturalidade (Cidade/UF)
 * Ex: "fortalezace" -> "FORTALEZA / CE"
 */
window.formatPlaceOfBirth = (event) => {
    let input = event.target;
    let value = input.value.toUpperCase().replace(/[^A-Z]/g, ""); // Remove tudo que não é letra
    
    if (value.length > 2) {
        let city = value.substring(0, value.length - 2);
        let uf = value.substring(value.length - 2);
        input.value = `${city} / ${uf}`;
    } else {
        input.value = value;
    }
};

export async function initEditor() {
    await loadTemplates();
    setupNav();
    const saveBtn = document.getElementById('btn-save-master');
    if (saveBtn) saveBtn.onclick = saveAll;
}

async function loadTemplates() {
    try {
        const res = await fetch('editor-templates.html');
        if (!res.ok) throw new Error("Arquivo de templates não encontrado");
        const html = await res.text();
        const div = document.createElement('div');
        div.innerHTML = html;
        ['tpl-identity', 'tpl-documents', 'tpl-contract', 'tpl-history', 'tpl-benefits', 'tpl-family'].forEach(id => {
            const el = div.querySelector(`#${id}`);
            if (el) templates[id.replace('tpl-', '')] = el.innerHTML;
        });
    } catch (e) { console.error("Erro ao carregar templates do editor:", e); }
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

window.loadEditorData = async (id) => {
    if (!id) return;
    currentEmpId = id;
    try {
        const [compRes, rolesRes, empRes] = await Promise.all([
            fetch('/api/companies'), fetch('/api/roles'), fetch(`/api/employees-pro/${id}/dossier`)
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

        document.getElementById('editor-name').innerText = currentData.employee.name || 'Sem Nome';
        document.getElementById('editor-reg').innerText = `#${currentData.employee.registrationNumber || '0000'}`;
        document.getElementById('editor-avatar').src = currentData.employee.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentData.employee.name || 'U')}&background=D32F2F&color=fff`;
        
        renderTab();
    } catch (err) { window.uiAlert("Erro ao carregar editor: " + err.message); }
};

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
}

function populateVinculos(vinculos) {
    const container = document.getElementById('vinculos-container');
    if (!container) return;

    container.innerHTML = vinculos.map((vinculo, index) => `
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
    `).join('');

    vinculos.forEach((vinculo, index) => {
        const employerSel = container.querySelector(`[data-index="${index}"] .vinculo-employer`);
        const workplaceSel = container.querySelector(`[data-index="${index}"] .vinculo-workplace`);

        if (employerSel) {
            employerSel.innerHTML = '<option value="">-- SELECIONE --</option>' + allCompanies.filter(c => c.type !== 'Unidade').map(c =>
                `<option value="${c.id}" ${vinculo.employer_id === c.id ? 'selected' : ''}>${c.name}</option>`
            ).join('');
        }

        if (workplaceSel) {
            workplaceSel.innerHTML = '<option value="">-- SELECIONE --</option>' + allCompanies.filter(c => c.type !== 'Empregador').map(c =>
                `<option value="${c.id}" ${vinculo.workplace_id === c.id ? 'selected' : ''}>${c.name}</option>`
            ).join('');
        }
    });
}

function populateIdentity(e) {
    const emp = e || {};
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
    Object.keys(fields).forEach(id => { const el = document.getElementById(id); if (el) el.value = fields[id] || ''; });
}

function unmaskNumeric(value) {
    if (value === null || value === undefined) return '';
    return value.toString().replace(/\D/g, '');
}

function formatCPF(value) {
    const digits = unmaskNumeric(value);
    if (digits.length === 11) return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    return value || '';
}

function formatPIS(value) {
    const digits = unmaskNumeric(value);
    if (digits.length === 11) return digits.replace(/(\d{3})(\d{5})(\d{2})(\d{1})/, '$1.$2.$3-$4');
    return value || '';
}

function populateDocuments(d) {
    const docs = d || {};
    const fields = {
        'doc-cpf': formatCPF(docs.cpf),
        'doc-pis': formatPIS(docs.pis_pasep),
        'doc-rg': docs.rg_number,
        'doc-rg-organ': docs.rg_organ,
        'doc-rg-uf': docs.rg_uf,
        'doc-rg-date': docs.rg_date,
        'doc-ctps': docs.ctps_number,
        'doc-cnh': docs.cnh_number,
        'doc-title': docs.voter_title,
        'doc-zone': docs.voter_zone,
        'doc-section': docs.voter_section
    };
    Object.keys(fields).forEach(id => { const el = document.getElementById(id); if (el) el.value = fields[id] || ''; });
}

window.renderGeneralDocsList = () => {
    const list = document.getElementById('emp-documents-list');
    if (!list) return;
    const files = currentData.documentFiles || [];
    list.innerHTML = files.map((f, i) => `
        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center group">
            <div class="flex items-center gap-3 overflow-hidden">
                <span class="text-2xl">${String(f.type||'').includes('pdf') ? '📕' : (String(f.type||'').includes('image') ? '🖼️' : '📄')}</span>
                <div class="min-w-0">
                    <p class="text-[10px] font-black text-gray-800 uppercase truncate" title="${f.name}">${f.name}</p>
                    <p class="text-[8px] font-bold text-gray-400 uppercase mt-0.5">${(f.size/1024).toFixed(1)} KB</p>
                </div>
            </div>
            <div class="flex gap-2">
                <a href="${f.dataUrl}" download="${f.name}" class="text-blue-500 hover:text-blue-700 font-bold text-[10px] uppercase">Baixar</a>
                <button onclick="window.removeGeneralDoc(${i})" class="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">✕</button>
            </div>
        </div>
    `).join('') || '<p class="text-gray-400 text-[10px] font-bold uppercase col-span-2 text-center py-4">Nenhum anexo encontrado neste prontuário.</p>';
};

window.handleGeneralDocUpload = (event) => {
    const file = event.target.files[0];
    if(!file) return;
    if(file.size > 10 * 1024 * 1024) return window.uiAlert("O arquivo excede o limite máximo de 10MB estabelecido pelo RH+.");
    
    const reader = new FileReader();
    reader.onload = (e) => {
        if(!currentData.documentFiles) currentData.documentFiles = [];
        currentData.documentFiles.push({
            name: file.name,
            type: file.type,
            size: file.size,
            dataUrl: e.target.result
        });
        window.renderGeneralDocsList();
        event.target.value = ''; // Reset do input caso o usuário suba mesmo file
    };
    reader.readAsDataURL(file);
};

window.removeGeneralDoc = (index) => {
    if(!window.uiConfirm("Deseja deletar este arquivo anexo da base permanentemente quando Salvar a tela?")) return;
    currentData.documentFiles.splice(index, 1);
    window.renderGeneralDocsList();
};

function populateContract(e) {
    const emp = e || {};
    const roleSel = document.getElementById('emp-role-select');
    if (roleSel) {
        roleSel.innerHTML = '<option value="">-- CARGOS --</option>' + allRoles.map(r => `<option value="${r.id}" ${emp.role === r.name ? 'selected' : ''}>${r.name.toUpperCase()}</option>`).join('');
        roleSel.onchange = (ev) => { const role = allRoles.find(r => r.id === ev.target.value); if (role) { document.getElementById('emp-cbo').value = role.cbo; document.getElementById('emp-sector').value = role.sector; } };
    }
    const map = { 'emp-reg-num': emp.registrationNumber, 'emp-adm': emp.admissionDate, 'emp-hier': emp.hierarchy || 'Colaborador', 'emp-salary': emp.currentSalary, 'emp-cbo': emp.cbo, 'emp-sector': emp.sector, 'emp-type': emp.type || 'OP', 'emp-scale': emp.work_scale || '5x2', 'emp-schedule': emp.work_schedule, 'emp-initial-role': emp.initialRole, 'emp-initial-salary': emp.initialSalary };
    Object.keys(map).forEach(id => { const el = document.getElementById(id); if (el) el.value = map[id] || ''; });
}

function renderBenefitsTab() {
    const area = document.getElementById('benefits-list-area');
    if (!area) return;
    
    let html = currentData.benefits.map(b => {
        let statusColor = 'text-green-600';
        if(b.status === 'Suspenso') statusColor = 'text-red-600';
        if(b.status === 'Pausado') statusColor = 'text-amber-500';

        return `
            <div class="bg-gray-50 p-5 rounded-2xl border border-gray-100 flex flex-col group shadow-sm">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <p class="text-[8px] font-black ${statusColor} uppercase tracking-widest">${b.status}</p>
                        <h4 class="font-black text-gray-800 text-xs uppercase">${b.benefit_name}</h4>
                        <p class="text-[10px] font-mono font-bold text-gray-400 mt-1">${formatCurrency(b.value)}</p>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="window.updateBenefitStatus('${b.id}', 'Concedido')" class="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors" title="Conceder">✓</button>
                        <button onclick="window.updateBenefitStatus('${b.id}', 'Suspenso')" class="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors" title="Suspender">✕</button>
                        <button onclick="window.updateBenefitStatus('${b.id}', 'Pausado')" class="p-1.5 bg-amber-50 text-amber-500 rounded-lg hover:bg-amber-100 transition-colors" title="Pausar">⏸</button>
                        <button onclick="window.removeSubItem('employee_benefits', '${b.id}')" class="p-1.5 text-gray-300 hover:text-red-500 transition-colors">🗑</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    area.innerHTML = html || '<p class="col-span-full text-center py-10 text-gray-300 italic font-black uppercase text-[10px]">Nenhum benefício ativo.</p>';
}

window.updateBenefitStatus = async (bid, newStatus) => {
    const user = Auth.getUser();
    const res = await fetch(`/api/employees-pro/benefits/${bid}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStatus, responsible: user.name })
    });
    if(res.ok) window.loadEditorData(currentEmpId);
};

function renderFamilyTab() {
    const sosArea = document.getElementById('emergency-list-area');
    const depArea = document.getElementById('dependents-list-area');

    if (sosArea) {
        sosArea.innerHTML = currentData.emergencyContacts.map(c => `
            <div class="bg-white p-5 rounded-2xl border border-gray-100 flex justify-between items-center group shadow-sm">
                <div>
                    <p class="text-[8px] font-black text-blue-600 uppercase">${c.relationship}</p>
                    <h4 class="font-black text-gray-800 text-xs uppercase">${c.name}</h4>
                    <p class="text-[10px] font-bold text-gray-400 mt-1">${c.phone}</p>
                </div>
                <button onclick="window.removeSubItem('employee_emergency_contacts', '${c.id}')" class="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">✕</button>
            </div>
        `).join('') || '<p class="col-span-full text-center py-10 text-gray-300 italic">Nenhum contato SOS.</p>';
    }

    if (depArea) {
        depArea.innerHTML = currentData.dependents.map(d => `
            <div class="bg-white p-5 rounded-2xl border border-gray-100 flex justify-between items-center group shadow-sm">
                <div>
                    <p class="text-[8px] font-black text-purple-600 uppercase">${d.relationship}</p>
                    <h4 class="font-black text-gray-800 text-xs uppercase">${d.name}</h4>
                    <p class="text-[10px] font-mono text-gray-400 mt-1">CPF: ${d.cpf || 'N/A'} • Nasc: ${new Date(d.birth_date).toLocaleDateString('pt-BR')}</p>
                </div>
                <button onclick="window.removeSubItem('employee_dependents', '${d.id}')" class="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">✕</button>
            </div>
        `).join('') || '<p class="col-span-full text-center py-10 text-gray-300 italic">Nenhum dependente vinculado.</p>';
    }
}

function renderHistoryTab() {
    const area = document.getElementById('h-career-timeline');
    if (!area) return;

    const combined = [
        ...currentData.career.map(c => ({ date: c.date, type: 'CARREIRA', title: c.move_type, desc: c.role, icon: '💼' })),
        ...currentData.uniformHistory.map(u => ({ date: u.data_hora, type: 'FARDAMENTO', title: u.tipo_movimentacao, desc: `${u.type} (${u.status_peca})`, icon: '🎽' })),
        ...currentData.occurrences.map(o => ({ date: o.date, type: 'CONDUTA', title: o.type, desc: o.reason, icon: '⚖️' }))
    ].sort((a,b) => new Date(b.date) - new Date(a.date));

    area.innerHTML = `
        <div class="space-y-4">
            ${combined.map(item => `
                <div class="relative animate-fade-in pl-8 border-l border-gray-100 ml-4">
                    <div class="absolute -left-[17px] top-0 w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-xs shadow-sm">${item.icon}</div>
                    <div class="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:border-nordeste-red transition-colors">
                        <div class="flex justify-between items-start mb-2">
                            <span class="text-[8px] font-black text-gray-400 uppercase tracking-widest">${item.type} • ${new Date(item.date).toLocaleString('pt-BR')}</span>
                        </div>
                        <h4 class="font-black text-gray-800 uppercase text-xs">${item.title}</h4>
                        <p class="text-[10px] text-gray-500 mt-1 uppercase italic">${item.desc}</p>
                    </div>
                </div>
            `).join('') || '<p class="text-center py-10 text-gray-300 italic uppercase font-black text-[10px]">Sem registros de prontuário.</p>'}
        </div>
    `;
}

// MODAIS
window.openAddBenefitModal = () => {
    const modal = document.getElementById('pro-modal-container');
    document.getElementById('pro-modal-content').innerHTML = `
        <div class="bg-orange-500 p-8 text-white"><h3 class="text-xl font-black uppercase italic">Conceder Benefício</h3></div>
        <div class="p-10 space-y-5">
            <div><label class="pro-label">Tipo de Benefício</label><input id="b-name" class="pro-input" placeholder="Ex: Vale Refeição"></div>
            <div><label class="pro-label">Valor Mensal</label><input id="b-val" class="pro-input" oninput="window.formatCurrencyInput(event)" placeholder="R$ 0,00"></div>
            <div><label class="pro-label">Data Início</label><input type="date" id="b-start" class="pro-input" value="${new Date().toISOString().split('T')[0]}"></div>
            <button onclick="window.saveSubItem('benefits')" class="w-full bg-nordeste-black text-white py-4 rounded-2xl font-black uppercase shadow-xl">Ativar Benefício</button>
        </div>
    `;
    modal.classList.remove('hidden');
};

window.openAddEmergencyModal = () => {
    const modal = document.getElementById('pro-modal-container');
    document.getElementById('pro-modal-content').innerHTML = `
        <div class="bg-blue-600 p-8 text-white"><h3 class="text-xl font-black uppercase italic">Novo Contato SOS</h3></div>
        <div class="p-10 space-y-5">
            <div><label class="pro-label">Nome do Contato</label><input id="s-name" class="pro-input"></div>
            <div><label class="pro-label">Parentesco</label><input id="s-rel" class="pro-input" placeholder="Ex: Esposa, Mãe, Irmão"></div>
            <div><label class="pro-label">Telefone / WhatsApp</label><input id="s-phone" class="pro-input" placeholder="(00) 00000-0000"></div>
            <button onclick="window.saveSubItem('emergency')" class="w-full bg-nordeste-black text-white py-4 rounded-2xl font-black uppercase shadow-xl">Gravar SOS</button>
        </div>
    `;
    modal.classList.remove('hidden');
};

window.openAddDependentModal = () => {
    const modal = document.getElementById('pro-modal-container');
    document.getElementById('pro-modal-content').innerHTML = `
        <div class="bg-purple-600 p-8 text-white"><h3 class="text-xl font-black uppercase italic">Novo Dependente Legal</h3></div>
        <div class="p-10 space-y-5">
            <div><label class="pro-label">Nome Completo</label><input id="d-name" class="pro-input"></div>
            <div><label class="pro-label">CPF</label><input id="d-cpf" class="pro-input" placeholder="000.000.000-00"></div>
            <div><label class="pro-label">Data de Nascimento</label><input type="date" id="d-birth" class="pro-input"></div>
            <div><label class="pro-label">Parentesco</label><select id="d-rel" class="pro-input"><option>Filho(a)</option><option>Cônjuge</option><option>Enteado(a)</option><option>Outros</option></select></div>
            <button onclick="window.saveSubItem('dependents')" class="w-full bg-nordeste-black text-white py-4 rounded-2xl font-black uppercase shadow-xl">Gravar Dependente</button>
        </div>
    `;
    modal.classList.remove('hidden');
};

window.saveSubItem = async (type) => {
    const user = Auth.getUser();
    let payload = { responsible: user.name };
    let endpoint = `/api/employees-pro/${currentEmpId}/${type}`;
    
    if(type==='benefits') payload = { ...payload, benefit_name: document.getElementById('b-name').value, value: document.getElementById('b-val').value, start_date: document.getElementById('b-start').value, status: 'Concedido' };
    else if(type==='emergency') payload = { ...payload, name: document.getElementById('s-name').value, relationship: document.getElementById('s-rel').value, phone: document.getElementById('s-phone').value };
    else if(type==='dependents') payload = { ...payload, name: document.getElementById('d-name').value, cpf: document.getElementById('d-cpf').value, birth_date: document.getElementById('d-birth').value, relationship: document.getElementById('d-rel').value };
    
    try {
        const res = await fetch(endpoint, { 
            method: 'POST', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify(payload) 
        });

        if (res.ok) {
            window.closeProModal();
            window.loadEditorData(currentEmpId);
        } else {
            window.uiAlert("Erro ao salvar sub-item.");
        }
    } catch(e) {
        window.uiAlert("Falha de conexão com o servidor.");
    }
};

window.removeSubItem = async (table, id) => {
    if(!window.uiConfirm("Deseja remover este registro permanentemente?")) return;
    try {
        const res = await fetch(`/api/employees-pro/sub-item/${table}/${id}`, { method: 'DELETE' });
        if (res.ok) window.loadEditorData(currentEmpId);
    } catch(e) { window.uiAlert("Erro ao remover item."); }
};

async function saveAll() {
    if (!currentEmpId || !currentData) return;
    const btn = document.getElementById('btn-save-master');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<div class="spinner border-white w-4 h-4 mx-auto"></div>';
    btn.disabled = true;

    try {
        const getVal = (id, fallback) => { const el = document.getElementById(id); return el ? el.value : (fallback || ''); };
        const empOrig = currentData.employee || {};
        const docsOrig = currentData.documents || {};
        
        const natCity = (getVal('emp-nat-city', '').trim() || '').toUpperCase();
        const natState = (getVal('emp-nat-state', '').trim() || '').toUpperCase();
        const placeOfBirth = natCity && natState ? `${natCity} / ${natState}` : (natCity || getVal('emp-naturality', empOrig.placeOfBirth));

        let finalStreet = getVal('emp-street', '').trim();
        const numPart = getVal('emp-number', '').trim();
        const compPart = getVal('emp-complement', '').trim();
        if(numPart) finalStreet += ", " + numPart;
        if(compPart) finalStreet += " - " + compPart;
        if(!finalStreet) finalStreet = empOrig.street || '';

        const vinculosData = getVinculosData();
        const principalVinculo = vinculosData.find(v => v.principal) || vinculosData[0] || {};

        const payload = {
            emp: {
                name: getVal('emp-name', empOrig.name), 
                birthDate: getVal('emp-birth', empOrig.birthDate), 
                gender: getVal('emp-gender', empOrig.gender), 
                fatherName: getVal('emp-father', empOrig.fatherName), 
                motherName: getVal('emp-mother', empOrig.motherName), 
                maritalStatus: getVal('emp-marital', empOrig.maritalStatus), 
                ethnicity: getVal('emp-ethnicity', empOrig.ethnicity), 
                educationLevel: getVal('emp-education', empOrig.educationLevel),
                placeOfBirth,
                personalEmail: getVal('emp-email', empOrig.personalEmail), 
                personalPhone: getVal('emp-phone', empOrig.personalPhone), 
                street: finalStreet, 
                cep: getVal('emp-cep', empOrig.cep), 
                neighborhood: getVal('emp-neighborhood', empOrig.neighborhood), 
                city: getVal('emp-city', empOrig.city), 
                state_uf: getVal('emp-uf', empOrig.state_uf), 
                admissionDate: getVal('emp-adm', empOrig.admissionDate), 
                hierarchy: getVal('emp-hier', empOrig.hierarchy), 
                role: document.getElementById('emp-role-select')?.options[document.getElementById('emp-role-select').selectedIndex]?.text || empOrig.role, 
                sector: getVal('emp-sector', empOrig.sector), 
                currentSalary: getVal('emp-salary', empOrig.currentSalary), 
                initialRole: getVal('emp-initial-role', empOrig.initialRole),
                initialSalary: getVal('emp-initial-salary', empOrig.initialSalary),
                cbo: getVal('emp-cbo', empOrig.cbo), 
                work_scale: getVal('emp-scale', empOrig.work_scale), 
                work_schedule: getVal('emp-schedule', empOrig.work_schedule), 
                employer_id: principalVinculo.employer_id || empOrig.employer_id,
                workplace_id: principalVinculo.workplace_id || empOrig.workplace_id,
                vinculos: vinculosData,
                type: getVal('emp-type', empOrig.type), 
                photoUrl: document.getElementById('editor-avatar').src
            },
            docs: {
                cpf: unmaskNumeric(getVal('doc-cpf', docsOrig.cpf)),
                pis_pasep: unmaskNumeric(getVal('doc-pis', docsOrig.pis_pasep)),
                rg_number: getVal('doc-rg', docsOrig.rg_number),
                rg_organ: getVal('doc-rg-organ', docsOrig.rg_organ),
                rg_date: getVal('doc-rg-date', docsOrig.rg_date),
                rg_uf: getVal('doc-rg-uf', docsOrig.rg_uf),
                ctps_number: getVal('doc-ctps', docsOrig.ctps_number),
                voter_title: getVal('doc-title', docsOrig.voter_title),
                voter_zone: getVal('doc-zone', docsOrig.voter_zone),
                voter_section: getVal('doc-section', docsOrig.voter_section),
                cnh_number: getVal('doc-cnh', docsOrig.cnh_number),
                documentFiles: currentData.documentFiles || [] // Injetado direto no parser Base da Rota Existente
            }
        };

        const res = await fetch(`/api/employees-pro/${currentEmpId}/metadata`, { 
            method: 'PUT', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(payload) 
        });

        // Envia de forma blindada em rota secundária
        if(currentData.documentFiles) {
            await fetch(`/api/employees-pro/${currentEmpId}/documentFiles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documentFiles: currentData.documentFiles })
            });
        }

        if (res.ok) { 
            window.uiAlert("🎯 PRONTUÁRIO ATUALIZADO!"); 
            await window.loadEditorData(currentEmpId); 
        } else {
            const err = await res.json();
            window.uiAlert("Erro ao salvar: " + (err.error || 'Erro desconhecido'));
        }
    } catch (e) { 
        console.error(e);
        window.uiAlert("Falha de conexão ao salvar."); 
    } finally { 
        btn.innerHTML = originalText; 
        btn.disabled = false; 
    }
}

window.previewEditorImage = (input) => {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => { document.getElementById('editor-avatar').src = e.target.result; };
        reader.readAsDataURL(input.files[0]);
    }
};

window.addVinculo = () => {
    const container = document.getElementById('vinculos-container');
    if (!container) return;
    
    const vinculos = Array.from(container.querySelectorAll('.vinculo-item')).map(item => {
        const index = parseInt(item.dataset.index);
        const employer = item.querySelector('.vinculo-employer').value;
        const workplace = item.querySelector('.vinculo-workplace').value;
        const principal = item.querySelector('.vinculo-principal').checked;
        return { employer_id: employer, workplace_id: workplace, principal };
    });
    
    vinculos.push({ employer_id: '', workplace_id: '', principal: false });
    
    // Re-render
    populateVinculos(vinculos);
};

window.removeVinculo = (index) => {
    const container = document.getElementById('vinculos-container');
    if (!container) return;
    
    const vinculos = Array.from(container.querySelectorAll('.vinculo-item')).map(item => {
        const idx = parseInt(item.dataset.index);
        const employer = item.querySelector('.vinculo-employer').value;
        const workplace = item.querySelector('.vinculo-workplace').value;
        const principal = item.querySelector('.vinculo-principal').checked;
        return { employer_id: employer, workplace_id: workplace, principal };
    });
    
    vinculos.splice(index, 1);
    
    // Garante que pelo menos um é principal
    if (vinculos.length > 0 && !vinculos.some(v => v.principal)) {
        vinculos[0].principal = true;
    }
    
    populateVinculos(vinculos);
};

window.togglePrincipal = (index) => {
    const container = document.getElementById('vinculos-container');
    if (!container) return;
    
    const checkboxes = container.querySelectorAll('.vinculo-principal');
    checkboxes.forEach((cb, i) => {
        cb.checked = (i === index);
    });
};

function getVinculosData() {
    const container = document.getElementById('vinculos-container');
    if (!container) return [];

    const raw = Array.from(container.querySelectorAll('.vinculo-item')).map(item => {
        const employer = (item.querySelector('.vinculo-employer').value || '').trim();
        const workplace = (item.querySelector('.vinculo-workplace').value || '').trim();
        const principal = item.querySelector('.vinculo-principal').checked;
        return { employer_id: employer, workplace_id: workplace, principal };
    }).filter(v => v.employer_id || v.workplace_id);

    // Se não houver vínculo válido, preserva o anterior (para evitar deleção acidental)
    if (raw.length === 0 && Array.isArray(currentData.vinculos) && currentData.vinculos.length > 0) {
        return currentData.vinculos.map(v => ({
            employer_id: v.employer_id || '',
            workplace_id: v.workplace_id || '',
            principal: !!v.principal
        }));
    }

    // Garantir apenas um principal
    const firstPrincipalIdx = raw.findIndex(v => v.principal);
    if (firstPrincipalIdx === -1 && raw.length > 0) raw[0].principal = true;
    if (firstPrincipalIdx > -1) {
        raw.forEach((v, idx) => { v.principal = (idx === firstPrincipalIdx); });
    }

    return raw;
}
