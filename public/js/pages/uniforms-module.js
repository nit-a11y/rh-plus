/**
 * UNIFORMS MODULE - Gerente de Fardamento
 * Padrão Career: Timeline editável com botão Registrar Fardamento
 */

import { formatarDataHoraBR, formatarDataBR } from '../utils.js';

// Estado
let employees = [];
let selectedId = null;
let currentEmployeeData = null;
let currentItems = [];
let currentHistory = [];
let filterStatus = 'active';

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    if (typeof Auth !== 'undefined') {
        const user = Auth.check();
        if (!user) return;
    }
    loadAllEmployees();
    
    // Data padrão nos modais
    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    
    const dateInput = document.getElementById('reg-date');
    const nextInput = document.getElementById('reg-next-exchange');
    const actionDate = document.getElementById('action-date');
    
    if (dateInput) dateInput.value = today;
    if (nextInput) nextInput.value = nextYear.toISOString().split('T')[0];
    if (actionDate) actionDate.value = today;
    
    // Parâmetro URL
    const urlParams = new URLSearchParams(window.location.search);
    const empId = urlParams.get('emp');
    if (empId) {
        setTimeout(() => window.selectEmployee(empId), 500);
    }
});

// Carregar colaboradores
async function loadAllEmployees() {
    try {
        const res = await fetch('/api/employees');
        if (!res.ok) throw new Error('Erro na rede');
        employees = await res.json();
        renderSidebar();
    } catch (e) {
        console.error('Erro ao carregar lista:', e);
    }
}

// Filtros
window.setFilterStatus = (status) => {
    filterStatus = status;
    document.getElementById('tab-active').className = `tab-btn ${status === 'active' ? 'active' : 'inactive'}`;
    document.getElementById('tab-inactive').className = `tab-btn ${status === 'inactive' ? 'active' : 'inactive'}`;
    renderSidebar();
};

// Sidebar
function renderSidebar() {
    const container = document.getElementById('employees-list');
    if (!container) return;
    
    const search = document.getElementById('emp-search')?.value.toLowerCase() || '';
    
    const filtered = (employees || []).filter(e => {
        const matchesSearch = e.name.toLowerCase().includes(search) || e.registrationNumber.includes(search);
        const matchesStatus = filterStatus === 'active' ? e.type !== 'Desligado' : e.type === 'Desligado';
        return matchesSearch && matchesStatus;
    });

    container.innerHTML = filtered.map(e => `
        <div class="emp-item ${selectedId === e.id ? 'active' : ''}" onclick="window.selectEmployee('${e.id}')">
            <img src="${e.photoUrl || 'https://ui-avatars.com/api/?name='+encodeURIComponent(e.name)}" class="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-sm">
            <div class="min-w-0 flex-1">
                <p class="text-[10px] font-black text-gray-800 uppercase truncate">${e.name}</p>
                <p class="text-[8px] text-gray-400 font-bold uppercase tracking-widest">${e.role || 'Sem Cargo'}</p>
            </div>
            ${e.type === 'Desligado' ? '<span class="text-[7px] bg-red-100 text-red-600 font-black px-2 py-0.5 rounded-full uppercase">Sair</span>' : ''}
        </div>
    `).join('') || `<p class="p-8 text-center text-gray-300 text-[9px] font-black uppercase tracking-widest">${filterStatus === 'active' ? 'Nenhum Ativo' : 'Pasta Vazia'}</p>`;
}

window.filterList = () => renderSidebar();

// Selecionar colaborador
window.selectEmployee = async (id) => {
    if (!id) return;
    selectedId = id;
    renderSidebar();
    
    document.getElementById('welcome-msg').classList.add('hidden-pro');
    document.getElementById('dashboard-view').classList.remove('hidden-pro');
    
    const emp = employees.find(e => e.id === id);
    if (!emp) return;
    currentEmployeeData = emp;
    
    // Atualizar perfil
    document.getElementById('view-photo').src = emp.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}`;
    document.getElementById('view-name').innerText = emp.name;
    document.getElementById('view-reg').innerText = `#${emp.registrationNumber}`;
    document.getElementById('view-role').innerText = emp.role || 'Sem cargo';
    document.getElementById('view-sector').innerText = emp.sector || 'Sem setor';
    
    await loadDetails(id);
};

let availableTypes = [];

// Carregar dados
async function loadDetails(id) {
    try {
        const res = await fetch(`/api/uniforms/employee/${id}`);
        const data = await res.json();
        currentItems = data.items || [];
        currentHistory = data.history || [];
        
        await loadAvailableTypes(id);
        updateStats();
        renderTimeline(currentHistory);
        renderInventory(currentItems);
    } catch (e) {
        console.error('Erro ao carregar dados:', e);
    }
}

async function loadAvailableTypes(empId) {
    try {
        const res = await fetch(`/api/uniforms/available-types/${empId}`);
        const data = await res.json();
        availableTypes = data.types || [];
        populatePieceFields();
    } catch (e) {
        console.error('Erro ao carregar tipos:', e);
        availableTypes = [];
    }
}

function populatePieceFields() {
    const pieceTypeSelect = document.getElementById('reg-piece-type');
    const colorSelect = document.getElementById('reg-color');
    const sizeSelect = document.getElementById('reg-size');
    
    // Preenche dropdown de peças com itens do inventário atual
    if (pieceTypeSelect && pieceTypeSelect.tagName === 'SELECT') {
        if (availableTypes.length > 0) {
            // Cria options com peças do inventário (Tipo - Cor - Tamanho)
            pieceTypeSelect.innerHTML = '<option value="">Selecione...</option>' + 
                availableTypes.map(t => {
                    const label = `${t.type}${t.color ? ' - ' + t.color : ''}${t.size ? ' - Tam ' + t.size : ''}`;
                    // Armazena id, type, color, size nos data attributes
                    return `<option value="${t.id}" data-type="${t.type}" data-color="${t.color || ''}" data-size="${t.size || ''}">${label}</option>`;
                }).join('');
            
            // Listener para auto-preencher cor e tamanho quando selecionar peça
            pieceTypeSelect.onchange = function() {
                const selectedOption = this.options[this.selectedIndex];
                if (selectedOption && selectedOption.value) {
                    const color = selectedOption.dataset.color;
                    const size = selectedOption.dataset.size;
                    if (colorSelect) colorSelect.value = color || '';
                    if (sizeSelect) sizeSelect.value = size || '';
                }
            };
        } else {
            pieceTypeSelect.innerHTML = '<option value="">Nenhum item no inventário</option>';
        }
    }
    
    // Limpa selects de cor e tamanho (são preenchidos automaticamente via onchange)
    if (colorSelect && colorSelect.tagName === 'SELECT') {
        colorSelect.innerHTML = '<option value="">Selecione uma peça acima</option>';
    }
    
    if (sizeSelect && sizeSelect.tagName === 'SELECT') {
        sizeSelect.innerHTML = '<option value="">Selecione uma peça acima</option>';
    }
}

// Atualizar estatísticas
function updateStats() {
    const total = currentItems.length;
    const ok = currentItems.filter(i => i.status !== 'Vencida').length;
    const pending = currentItems.filter(i => i.status === 'Vencida').length;
    const history = currentHistory.length;
    
    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-ok').innerText = ok;
    document.getElementById('stat-pending').innerText = pending;
    document.getElementById('stat-history').innerText = history;
}

// Renderizar Timeline - Estilo Career
function renderTimeline(history) {
    const tbody = document.getElementById('timeline-rows');
    if (!tbody) return;
    
    if (!history || history.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-12 text-gray-400">
                    <p class="text-sm font-bold uppercase">Nenhum registro no histórico</p>
                    <p class="text-xs text-gray-400 mt-2">Clique em "Registrar Fardamento" para adicionar</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = history.map((h, index) => {
        const tipo = (h.tipo_movimentacao || '').toUpperCase();
        let badgeClass = 'badge-neutral';
        let tipoLabel = tipo;
        
        if (tipo.includes('RECEBIMENTO')) {
            badgeClass = 'badge-success';
            tipoLabel = 'Entrega';
        } else if (tipo.includes('TROCA')) {
            badgeClass = 'badge-info';
            tipoLabel = 'Troca';
        } else if (tipo.includes('DEVOLUCAO') || tipo.includes('DEVOLUÇÃO')) {
            badgeClass = 'badge-danger';
            tipoLabel = 'Devolução';
        }
        
        // Status da peça
        let statusBadge = '';
        if (h.status_peca) {
            if (h.status_peca === 'NOVO') statusBadge = '<span class="badge badge-success">Novo</span>';
            else if (h.status_peca === 'INATIVO') statusBadge = '<span class="badge badge-neutral">Inativo</span>';
            else statusBadge = `<span class="badge badge-neutral">${h.status_peca}</span>`;
        }
        
        // DEBUG: Log dos dados do histórico
        console.log('History item:', { id: h.id, item_id: h.item_id, type: h.type });
        
        // Garante que tem ID válido
        const historyId = (h.id || h.item_id || '').toString().trim();
        console.log('historyId result:', historyId);
        
        const editButton = historyId && historyId !== 'null' && historyId !== 'undefined'
            ? `<button onclick="if(!'${historyId}' || '${historyId}' === 'null') { alert('ID inválido'); return; } window.editHistory('${historyId}')" class="text-gray-400 hover:text-nordeste-red transition" title="Editar">
                   <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                   </svg>
               </button>`
            : '<span class="text-gray-300 text-xs" title="ID não disponível">-</span>';
        
        return `
            <tr class="animate-fade" style="animation-delay: ${index * 0.05}s">
                <td class="font-mono text-gray-600 text-xs">${formatarDataBR(h.data_hora)}</td>
                <td><span class="badge ${badgeClass}">${tipoLabel}</span></td>
                <td class="font-bold text-gray-800 uppercase text-xs">${h.type || 'Item'}</td>
                <td class="text-xs text-gray-600">
                    ${h.color ? `<span class="text-gray-400">Cor:</span> ${h.color}` : ''}
                    ${h.color && h.observacao ? '<br>' : ''}
                    ${h.observacao || '-'}
                </td>
                <td>${statusBadge}</td>
                <td class="text-xs text-gray-500 font-medium">${h.responsavel || 'Sistema'}</td>
                <td>${editButton}</td>
            </tr>
        `;
    }).join('');
}

// Renderizar Inventário (Cards)
function renderInventory(items) {
    const grid = document.getElementById('inventory-grid');
    if (!grid) return;
    
    if (!items || items.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full py-8 text-center text-gray-400">
                <p class="text-sm font-bold uppercase">Nenhum item em posse</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = items.map(item => {
        const isExpired = item.status === 'Vencida';
        const statusClass = isExpired ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100';
        const statusText = isExpired ? 'text-red-600' : 'text-green-600';
        const statusLabel = isExpired ? 'Vencido' : 'Em dia';
        
        return `
            <div class="p-4 rounded-xl border ${statusClass}">
                <div class="flex justify-between items-start mb-3">
                    <h4 class="font-bold text-gray-800 uppercase text-sm">${item.type}</h4>
                    <span class="text-xs font-bold ${statusText}">${statusLabel}</span>
                </div>
                <p class="text-xs text-gray-500 mb-2">${item.color || '-'} • Tam ${item.size || '-'}</p>
                <div class="text-xs text-gray-400 space-y-1">
                    <p>Entrega: ${formatarDataBR(item.dateGiven)}</p>
                    <p>Próx. troca: ${formatarDataBR(item.nextExchangeDate)}</p>
                </div>
                <div class="flex gap-2 mt-3">
                    <button onclick="window.openActionModal('TROCA', '${item.id}')" class="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition">Trocar</button>
                    <button onclick="window.openActionModal('DEVOLUCAO', '${item.id}')" class="flex-1 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition">Devolver</button>
                </div>
            </div>
        `;
    }).join('');
}

// MODAIS

// Abrir modal de registro
window.openRegisterModal = () => {
    document.getElementById('modal-register').classList.add('active');
    document.body.style.overflow = 'hidden';
};

// Mudar tipo no modal
window.onTypeChange = () => {
    const type = document.getElementById('reg-type').value;
    const nextField = document.getElementById('field-next-exchange');
    
    if (type === 'RECEBIMENTO') {
        nextField.classList.remove('hidden-pro');
    } else {
        nextField.classList.add('hidden-pro');
    }
};

// Abrir modal de ação (troca/devolução)
window.openActionModal = (type, itemId) => {
    const item = currentItems.find(i => i.id === itemId);
    if (!item) return;
    
    document.getElementById('action-type').value = type;
    document.getElementById('action-item-id').value = itemId;
    document.getElementById('action-item-name').innerText = `${item.type} - ${item.color} (Tam: ${item.size})`;
    
    const title = type === 'TROCA' ? 'Registrar Troca' : 'Registrar Devolução';
    document.getElementById('action-title').innerText = title;
    
    // Preencher motivos
    const reasonSelect = document.getElementById('action-reason');
    const reasons = type === 'TROCA' 
        ? ['Desgaste Natural', 'Avaria', 'Extravio', 'Alteração de Tamanho', 'Outro']
        : ['Rescisão', 'Substituição Coletiva', 'Item Danificado', 'Fim de Uso', 'Outro'];
    
    reasonSelect.innerHTML = '<option value="">Selecione...</option>' + 
        reasons.map(r => `<option value="${r}">${r}</option>`).join('');
    
    document.getElementById('modal-action').classList.add('active');
    document.body.style.overflow = 'hidden';
};

// Abrir modal de documentos
window.openDocumentsModal = () => {
    document.getElementById('modal-documents').classList.add('active');
    document.body.style.overflow = 'hidden';
};

// Fechar modais
window.closeModals = () => {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    document.body.style.overflow = '';
    
    // Resetar forms
    document.getElementById('form-register')?.reset();
    document.getElementById('form-action')?.reset();
    document.getElementById('form-edit-history')?.reset();
    
    // Resetar variável de edição
    currentEditHistoryId = null;
    
    // Resetar data padrão
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('reg-date');
    const actionDate = document.getElementById('action-date');
    if (dateInput) dateInput.value = today;
    if (actionDate) actionDate.value = today;
};

// SUBMITS

// Registrar fardamento (apenas histórico)
window.submitRegister = async (e) => {
    e.preventDefault();
    
    const movType = document.getElementById('reg-type').value;
    const date = document.getElementById('reg-date').value;
    const pieceSelect = document.getElementById('reg-piece-type');
    const selectedOption = pieceSelect.options[pieceSelect.selectedIndex];
    const obs = document.getElementById('reg-obs').value;
    
    const responsible = typeof Auth !== 'undefined' ? Auth.getUser()?.name : 'Admin';
    
    if (!selectedOption || !selectedOption.value) {
        alert('Selecione a Peça');
        return;
    }
    
    // Obtém dados do dataset da option selecionada
    const pieceType = selectedOption.dataset.type;
    const color = selectedOption.dataset.color || document.getElementById('reg-color').value;
    
    const historyPayload = {
        employeeId: selectedId,
        type: pieceType,
        color,
        tipo_movimentacao: movType,
        observacao: obs,
        data_hora: date + 'T00:00:00',
        responsible
    };
    
    try {
        const res = await fetch('/api/uniforms/register-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(historyPayload)
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao registrar');
    } catch (err) {
        alert('Erro: ' + err.message);
        return;
    }
    
    closeModals();
    await loadDetails(selectedId);
};

// Ação em item existente (troca/devolução)
window.submitAction = async (e) => {
    e.preventDefault();
    
    const itemId = document.getElementById('action-item-id').value;
    const type = document.getElementById('action-type').value;
    const date = document.getElementById('action-date').value;
    const reason = document.getElementById('action-reason').value;
    const obs = document.getElementById('action-obs').value;
    const responsible = typeof Auth !== 'undefined' ? Auth.getUser()?.name : 'Admin';
    
    const today = new Date().toISOString().split('T')[0];
    const cycle = currentEmployeeData?.type === 'ADM' ? 12 : 6;
    const next = new Date();
    next.setMonth(next.getMonth() + cycle);
    
    const payload = {
        itemId,
        date: today,
        nextExchangeDate: type === 'TROCA' ? next.toISOString().split('T')[0] : null,
        status: type === 'TROCA' ? 'Em dia' : 'Devolvido',
        reason,
        observation: obs,
        responsible
    };
    
    const endpoint = type === 'TROCA' ? '/api/uniforms/exchange' : '/api/uniforms/return';
    
    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!res.ok) throw new Error('Erro ao processar');
        
        closeModals();
        await loadDetails(selectedId);
    } catch (err) {
        alert('Erro: ' + err.message);
    }
};

// Variável para armazenar ID do histórico sendo editado
let currentEditHistoryId = null;

// Abrir modal de edição de histórico
window.editHistory = async (historyId) => {
    console.log('=== EDIT HISTORY ===');
    console.log('historyId recebido:', historyId, 'tipo:', typeof historyId);
    
    if (!historyId || historyId === 'null' || historyId === 'undefined') {
        alert('ID do registro inválido: ' + historyId);
        return;
    }
    
    currentEditHistoryId = historyId;
    
    try {
        // Busca dados do histórico
        const url = `/api/uniforms/history/${encodeURIComponent(historyId)}`;
        console.log('Fazendo GET para:', url);
        
        const res = await fetch(url);
        console.log('Resposta status:', res.status);
        
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            console.error('Erro na resposta:', errorData);
            throw new Error(errorData.error || `Erro ${res.status}`);
        }
        
        const history = await res.json();
        console.log('Dados recebidos:', history);
        
        if (!history || (!history.id && !history.item_id)) {
            throw new Error('Registro não encontrado ou sem ID');
        }
        
        // Preenche o modal - usa id ou item_id conforme disponível
        const recordId = history.id || history.item_id;
        document.getElementById('edit-history-id').value = recordId;
        document.getElementById('edit-tipo-movimentacao').value = history.tipo_movimentacao || 'RECEBIMENTO';
        document.getElementById('edit-type').value = history.type || '';
        document.getElementById('edit-color').value = history.color || '';
        document.getElementById('edit-status-peca').value = history.status_peca || 'REGISTRO';
        document.getElementById('edit-observacao').value = history.observacao || '';
        document.getElementById('edit-responsavel').value = history.responsavel || 'Sistema';
        
        // Converte data para datetime-local
        if (history.data_hora) {
            const date = new Date(history.data_hora);
            const formatted = date.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
            document.getElementById('edit-data-hora').value = formatted;
        }
        
        // Abre modal
        document.getElementById('modal-edit-history').classList.add('active');
        document.body.style.overflow = 'hidden';
        
    } catch (err) {
        console.error('Erro ao abrir edição:', err);
        alert('Erro ao carregar registro: ' + err.message);
        currentEditHistoryId = null;
    }
};

// Salvar edição de histórico
window.submitEditHistory = async (e) => {
    e.preventDefault();
    
    if (!currentEditHistoryId) return;
    
    const historyId = document.getElementById('edit-history-id').value;
    const tipoMovimentacao = document.getElementById('edit-tipo-movimentacao').value;
    const type = document.getElementById('edit-type').value;
    const color = document.getElementById('edit-color').value;
    const statusPeca = document.getElementById('edit-status-peca').value;
    const observacao = document.getElementById('edit-observacao').value;
    const dataHora = document.getElementById('edit-data-hora').value;
    const responsavel = document.getElementById('edit-responsavel').value;
    
    if (!type || !dataHora) {
        alert('Preencha os campos obrigatórios');
        return;
    }
    
    const payload = {
        type,
        color,
        tipo_movimentacao: tipoMovimentacao,
        observacao,
        data_hora: dataHora + ':00', // Adiciona segundos
        responsavel
    };
    
    try {
        const res = await fetch(`/api/uniforms/history/${historyId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Erro ao atualizar');
        }
        
        closeModals();
        await loadDetails(selectedId);
        
    } catch (err) {
        console.error('Erro ao salvar:', err);
        alert('Erro ao salvar: ' + err.message);
    }
};

// Excluir histórico
window.deleteHistory = async () => {
    if (!currentEditHistoryId) return;
    
    if (!confirm('Tem certeza que deseja excluir este registro permanentemente?')) {
        return;
    }
    
    try {
        const res = await fetch(`/api/uniforms/history/${currentEditHistoryId}`, {
            method: 'DELETE'
        });
        
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Erro ao excluir');
        }
        
        closeModals();
        await loadDetails(selectedId);
        
    } catch (err) {
        console.error('Erro ao excluir:', err);
        alert('Erro ao excluir: ' + err.message);
    }
};

// Gerar documentos
window.generateNITDocument = (type) => {
    if (!currentEmployeeData) return alert('Selecione um colaborador primeiro.');
    if (currentItems.length === 0 && type !== 'DEVOLUCAO') return alert('Nenhum item para documento.');
    
    // Implementação básica de PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const titles = {
        'ENTREGA': 'TERMO DE RESPONSABILIDADE',
        'TROCA': 'TERMO DE TROCA',
        'DEVOLUCAO': 'TERMO DE DEVOLUÇÃO'
    };
    
    doc.setFontSize(16);
    doc.text(titles[type], 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Colaborador: ${currentEmployeeData.name}`, 20, 40);
    doc.text(`Matrícula: ${currentEmployeeData.registrationNumber}`, 20, 50);
    
    let y = 70;
    doc.setFontSize(10);
    doc.text('Itens:', 20, y);
    y += 10;
    
    currentItems.forEach((item, i) => {
        doc.text(`${i + 1}. ${item.type} - ${item.color} (Tam: ${item.size})`, 25, y);
        y += 8;
    });
    
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, y + 20);
    
    doc.save(`termo-${type.toLowerCase()}-${currentEmployeeData.registrationNumber}.pdf`);
};

// Fechar modal ao clicar fora
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        closeModals();
    }
});
