// Módulo de Transferências de Empregador/Unidade

let currentEmployeeId = null;
let companies = [];
let currentEmployee = null;

// Carregar empresas/unidades
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

// Abrir modal de transferência
window.openTransferModal = async (employeeId) => {
    currentEmployeeId = employeeId;
    
    // Buscar dados do colaborador
    const empRes = await fetch(`/api/employees/${employeeId}`);
    currentEmployee = await empRes.json();
    
    // Carregar empresas
    await loadCompanies();
    
    const modal = document.getElementById('pro-modal-container');
    const content = document.getElementById('pro-modal-content');
    
    // Separar empresas e unidades
    const employers = companies.filter(c => c.type === 'company' || !c.type);
    const workplaces = companies.filter(c => c.type === 'unit' || c.type === 'workplace');
    
    const today = new Date().toISOString().split('T')[0];
    
    content.innerHTML = `
        <div class="bg-orange-600 p-8 text-white">
            <h3 class="text-xl font-black uppercase italic">Transferência</h3>
            <p class="text-xs font-medium mt-1">Transfere colaborador para novo vínculo</p>
        </div>
        <div class="p-10 space-y-6">
            <div class="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
                <p class="text-sm font-bold text-blue-600">Colaborador:</p>
                <p class="text-lg font-black text-gray-800">${currentEmployee.name}</p>
                <p class="text-sm text-gray-600">Matrícula: ${currentEmployee.registrationNumber}</p>
                <p class="text-sm text-gray-600">Atual: ${currentEmployee.employer_name || 'N/A'} / ${currentEmployee.workplace_name || 'N/A'}</p>
                <p class="text-sm text-gray-600">Cargo: ${currentEmployee.role || 'N/A'}</p>
                <p class="text-sm text-gray-600">Salário: ${currentEmployee.currentSalary || 'N/A'}</p>
            </div>
            
            <div class="border-t border-gray-200 pt-4">
                <p class="text-sm font-bold text-orange-600 mb-3">NOVA TRANSFERÊNCIA</p>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="pro-label">Nova Data de Admissão *</label>
                    <input type="date" id="new-admission-date" class="pro-input" value="${today}">
                </div>
                <div>
                    <label class="pro-label">Novo Empregador</label>
                    <select id="new-employer" class="pro-input">
                        <option value="">-- Selecione --</option>
                        ${employers.map(e => 
                            `<option value="${e.id}" ${e.id === currentEmployee.employer_id ? 'selected' : ''}>${e.name}</option>`
                        ).join('')}
                    </select>
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="pro-label">Nova Unidade</label>
                    <select id="new-workplace" class="pro-input">
                        <option value="">-- Selecione --</option>
                        ${workplaces.map(w => 
                            `<option value="${w.id}" ${w.id === currentEmployee.workplace_id ? 'selected' : ''}>${w.name}</option>`
                        ).join('')}
                    </select>
                </div>
                <div>
                    <label class="pro-label">Novo Cargo/Função</label>
                    <input type="text" id="new-role" class="pro-input" placeholder="Ex: ANALISTA" value="${currentEmployee.role || ''}">
                </div>
            </div>
            
            <div>
                <label class="pro-label">Novo Salário</label>
                <input type="text" id="new-salary" class="pro-input font-bold text-green-700" placeholder="R$ 0,00" value="${currentEmployee.currentSalary || ''}">
            </div>
            
            <div>
                <label class="pro-label">Motivo / Observação</label>
                <textarea id="transfer-reason" class="pro-input" rows="2" 
                    placeholder="Descreva o motivo da transferência..."></textarea>
            </div>
            
            <div class="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <p class="text-xs font-bold text-amber-700">ATENÇÃO:</p>
                <p class="text-xs text-amber-600">O vínculo atual será ENCERRADO e um novo vínculo será CRIADO com os dados informados acima.</p>
            </div>
            
            <div class="flex justify-end gap-4 pt-4">
                <button onclick="window.closeProModal()" 
                    class="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-all">
                    Cancelar
                </button>
                <button onclick="window.executeReativacao()" 
                    class="px-6 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-all">
                    Confirmar Transferência
                </button>
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden-pro');
};

// Executar transferência
window.executeReativacao = async () => {
    const newAdmissionDate = document.getElementById('new-admission-date').value;
    const newEmployer = document.getElementById('new-employer').value;
    const newWorkplace = document.getElementById('new-workplace').value;
    const newRole = document.getElementById('new-role').value;
    const newSalary = document.getElementById('new-salary').value;
    const reason = document.getElementById('transfer-reason').value;
    
    if (!newAdmissionDate) {
        alert('Informe a nova data de admissão');
        return;
    }
    
    if (!newEmployer && !newWorkplace && !newRole && !newSalary) {
        alert('Informe pelo menos uma mudança');
        return;
    }
    
    if (!confirm('Confirmar transferência? O vínculo atual será encerrado e um novo será criado.')) {
        return;
    }
    
    try {
        const res = await fetch(`/api/transfers/employee/${currentEmployeeId}/reativar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to_employer_id: newEmployer || null,
                to_workplace_id: newWorkplace || null,
                new_role: newRole || null,
                new_salary: newSalary || null,
                new_admission_date: newAdmissionDate,
                reason: reason,
                changed_by: 'Sistema'
            })
        });
        
        const data = await res.json();
        
        if (res.ok && data.success) {
            alert('Transferência realizada com sucesso!');
            window.closeProModal();
            // Recarregar dados do colaborador
            if (window.loadEmployeeData) {
                window.loadEmployeeData(currentEmployeeId);
            }
        } else {
            alert('Erro: ' + (data.error || 'Erro desconhecido'));
        }
    } catch (error) {
        console.error('Erro ao executar transferência:', error);
        alert('Erro de comunicação: ' + error.message);
    }
};
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
        const res = await fetch(`/api/transfers/employee/${currentEmployeeId}`, {
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
            
            // Recarregar dados se estiver na página de colaborador
            if (typeof window.selectEmployee === 'function') {
                window.selectEmployee(currentEmployeeId);
            }
        } else {
            alert('Erro ao registrar transferência: ' + (data.error || 'Erro desconhecido'));
        }
    } catch (error) {
        console.error('Erro na transferência:', error);
        alert('Erro ao registrar transferência. Verifique o console.');
    }
};

// Ver histórico de transferências
window.viewTransferHistory = async (employeeId) => {
    try {
        const res = await fetch(`/api/transfers/employee/${employeeId}/history`);
        const history = await res.json();
        
        const modal = document.getElementById('pro-modal-container');
        const content = document.getElementById('pro-modal-content');
        
        content.innerHTML = `
            <div class="bg-blue-600 p-8 text-white">
                <h3 class="text-xl font-black uppercase italic">Histórico de Transferências</h3>
            </div>
            <div class="p-10">
                ${history.length === 0 ? 
                    '<p class="text-center text-gray-500 py-8">Nenhuma transferência registrada</p>' :
                    `<div class="space-y-4">
                        ${history.map(t => `
                            <div class="border rounded-lg p-4 hover:shadow-md transition-all">
                                <div class="flex justify-between items-start mb-2">
                                    <div>
                                        <p class="font-bold text-gray-800">${formatDate(t.changed_at)}</p>
                                        <p class="text-sm text-gray-600">Responsável: ${t.changed_by}</p>
                                    </div>
                                    <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                                        TRANSFERÊNCIA
                                    </span>
                                </div>
                                <div class="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p class="font-semibold text-gray-700">De:</p>
                                        <p>${t.from_employer_name || 'N/A'} / ${t.from_workplace_name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p class="font-semibold text-gray-700">Para:</p>
                                        <p>${t.to_employer_name || 'N/A'} / ${t.to_workplace_name || 'N/A'}</p>
                                    </div>
                                </div>
                                ${t.observation ? `<p class="mt-3 text-sm text-gray-600 italic">Motivo: ${t.observation}</p>` : ''}
                            </div>
                        `).join('')}
                    </div>`
                }
                
                <div class="flex justify-end mt-6">
                    <button onclick="window.closeProModal()" 
                        class="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-all">
                        Fechar
                    </button>
                </div>
            </div>
        `;
        
        modal.classList.remove('hidden-pro');
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        alert('Erro ao carregar histórico de transferências');
    }
};

// Formatar data
function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Adicionar botões de transferência à página de colaboradores (se existir)
document.addEventListener('DOMContentLoaded', () => {
    // Verificar se estamos na página de colaboradores
    const employeeActions = document.querySelector('.employee-actions');
    if (employeeActions) {
        // Adicionar botão de transferência
        const transferBtn = document.createElement('button');
        transferBtn.className = 'btn-action bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-all';
        transferBtn.innerHTML = '🔄 Transferir';
        transferBtn.onclick = () => {
            const employeeId = employeeActions.dataset.employeeId;
            if (employeeId) window.openTransferModal(employeeId);
        };
        employeeActions.appendChild(transferBtn);
    }
});
