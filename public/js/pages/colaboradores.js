
import { formatCurrency } from '../utils.js';
import { DateFixer } from '../date-fixer.js';

let allEmployees = [];
let filteredEmployees = [];

document.addEventListener('DOMContentLoaded', () => {
    Auth.check();
    initPortal();
    startTime();
});

async function initPortal() {
    await loadData();
    renderGrid();
    updateKPIs();
}

async function loadData() {
    try {
        const res = await fetch('/api/employees');
        allEmployees = await res.json();
        filteredEmployees = [...allEmployees];
    } catch (e) {
        console.error("Erro ao carregar dados do portal:", e);
    }
}

function updateKPIs() {
    const total = allEmployees.length;
    const active = allEmployees.filter(e => e.type !== 'Desligado').length;
    const deactivated = allEmployees.filter(e => e.type === 'Desligado').length;

    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-active').innerText = active;
    document.getElementById('stat-turnover').innerText = deactivated;
    document.getElementById('stat-pending').innerText = '0';
}

function renderGrid() {
    const grid = document.getElementById('portal-grid');
    if (!grid) return;

    grid.innerHTML = '';

    if (filteredEmployees.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full py-20 text-center text-gray-400 uppercase font-black italic opacity-50">
                Nenhum colaborador localizado na busca.
            </div>
        `;
        return;
    }

    filteredEmployees.forEach(e => {
        const card = document.createElement('div');
        card.className = 'portal-card animate-fade-in';
        const isInactive = e.type === 'Desligado';

        card.innerHTML = `
            <div class="flex justify-between items-start mb-6">
                <img src="${e.photoUrl || 'https://ui-avatars.com/api/?name=' + e.name}" class="card-avatar">
                <div class="flex items-center gap-2">
                    <span class="text-[8px] font-black text-gray-400 uppercase tracking-widest">${isInactive ? 'Arquivado' : 'Operacional'}</span>
                    <div class="status-glow ${isInactive ? 'bg-red-500' : 'bg-green-500'}"></div>
                </div>
            </div>
            
            <h3 class="font-black text-gray-800 text-sm uppercase italic leading-none mb-1 truncate" title="${e.name}">${e.name}</h3>
            <p class="text-[9px] font-mono text-gray-400 font-bold mb-5 tracking-tighter">#${e.registrationNumber}</p>
            
            <div class="space-y-2 mb-6">
                <div class="flex items-center gap-2">
                    <span class="p-1 bg-gray-50 rounded text-xs">👔</span>
                    <p class="text-[10px] font-black text-gray-600 uppercase truncate">${e.role}</p>
                </div>
                <div class="flex items-center gap-2">
                    <span class="p-1 bg-gray-50 rounded text-xs">📄</span>
                    <p class="text-[9px] font-black text-amber-600 uppercase italic">CBO: ${e.cbo || '---'}</p>
                </div>
                <div class="flex items-center gap-2">
                    <span class="p-1 bg-gray-50 rounded text-xs">🏢</span>
                    <p class="text-[10px] font-bold text-gray-400 uppercase truncate">${e.sector}</p>
                </div>
            </div>

            <div class="mt-auto pt-5 border-t border-gray-100 grid grid-cols-1 gap-3">
                <button onclick="window.openPortalDrawer('${e.id}')" class="bg-nordeste-black hover:bg-black text-white py-3 rounded-xl text-[9px] font-black uppercase transition-all shadow-lg active:scale-95">Abrir Ficha</button>
                <div class="grid grid-cols-2 gap-3">
                    <button onclick="window.openWpp('${e.personalPhone || ''}')" class="bg-[#25D366] hover:bg-[#128C7E] text-white py-3 rounded-xl text-[9px] font-black uppercase transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2">
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.483 8.412-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.308 1.655zm6.24-3.328c1.554.921 3.21 1.403 4.933 1.403 5.403 0 9.8-4.398 9.802-9.8.001-2.618-1.019-5.079-2.872-6.932-1.851-1.852-4.311-2.871-6.93-2.871-5.404 0-9.802 4.398-9.802 9.8 0 1.761.474 3.479 1.373 5.013l-1.03 3.757 3.858-1.012zm11.396-10.421c-.301-.151-1.782-.879-2.057-.979-.275-.1-.475-.151-.675.151-.199.301-.775.979-.95 1.179-.175.2-.351.226-.652.076-.301-.151-1.269-.467-2.418-1.492-.893-.796-1.496-1.78-1.672-2.08-.175-.3-.019-.463.13-.613.135-.134.301-.351.451-.526.15-.176.2-.301.3-.501.1-.2.05-.376-.025-.526-.075-.151-.675-1.628-.925-2.228-.243-.584-.489-.505-.675-.514-.175-.008-.376-.01-.576-.01s-.526.075-.801.376c-.275.301-1.052 1.028-1.052 2.508s1.077 2.908 1.227 3.109c.151.2 2.119 3.235 5.132 4.534.717.309 1.277.493 1.714.633.721.228 1.376.196 1.895.119.578-.085 1.782-.728 2.032-1.43.25-.701.25-1.303.175-1.43-.075-.125-.275-.201-.576-.351z"/></svg>
                        WhatsApp
                    </button>
                    <button onclick="window.openTransferModal('${e.id}')" class="bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl text-[9px] font-black uppercase transition-all shadow-lg active:scale-95 flex items-center justify-center gap-1">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
                        Transferir
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

window.liveSearch = () => {
    const term = document.getElementById('portal-search').value.toLowerCase();
    filteredEmployees = allEmployees.filter(e =>
        e.name.toLowerCase().includes(term) ||
        e.registrationNumber.includes(term) ||
        e.sector.toLowerCase().includes(term)
    );
    renderGrid();
};

window.openPortalDrawer = async (id) => {
    const drw = document.getElementById('portal-drawer');
    const overlay = document.getElementById('portal-drawer-overlay');
    const content = document.getElementById('drw-content');

    drw.classList.add('open');
    drw.style.right = '0';
    overlay.classList.remove('hidden');
    content.innerHTML = '<div class="h-full flex items-center justify-center"><div class="spinner"></div></div>';

    try {
        const res = await fetch(`/api/employees-pro/${id}/dossier`);
        const data = await res.json();
        const e = data.employee;

        document.getElementById('drw-photo').src = e.photoUrl || `https://ui-avatars.com/api/?name=${e.name}`;
        document.getElementById('drw-name').innerText = e.name;
        document.getElementById('drw-reg').innerText = `#${e.registrationNumber}`;

        content.innerHTML = `
            <div class="drw-section">
                <p class="stat-label">Resumo Funcional</p>
                <div class="grid grid-cols-2 gap-4 mt-4">
                    <div class="p-3 bg-gray-50 rounded-xl"><p class="text-[8px] font-black text-gray-400 uppercase">Admissão</p><p class="text-xs font-black text-gray-700">${DateFixer.formatarDataParaExibicao(e.admissionDate)}</p></div>
                    <div class="p-3 bg-gray-50 rounded-xl"><p class="text-[8px] font-black text-gray-400 uppercase">Salário</p><p class="text-xs font-black text-green-700">${e.currentSalary}</p></div>
                </div>
                <div class="mt-3 p-3 border border-amber-100 bg-amber-50 rounded-xl">
                    <p class="text-[8px] font-black text-amber-600 uppercase">Cargo & CBO</p>
                    <p class="text-[10px] font-black text-gray-800 uppercase italic">${e.role} <span class="text-[8px] font-mono">(CBO: ${e.cbo || '---'})</span></p>
                </div>
            </div>

            <div class="drw-section">
                <p class="stat-label">Situação SST & Compliance</p>
                <div class="space-y-3 mt-4">
                    <div class="flex justify-between items-center p-3 border border-gray-100 rounded-xl">
                        <span class="text-[10px] font-bold text-gray-500 uppercase">Status ASO</span>
                        <span class="badge ${data.aso.length > 0 ? 'badge-success' : 'badge-danger'} uppercase !text-[8px]">${data.aso.length > 0 ? 'Regular' : 'Pendente'}</span>
                    </div>
                    <div class="flex justify-between items-center p-3 border border-gray-100 rounded-xl">
                        <span class="text-[10px] font-bold text-gray-500 uppercase">Fardamento</span>
                        <span class="badge badge-success uppercase !text-[8px]">Entregue</span>
                    </div>
                </div>
            </div>

            <div class="drw-section">
                <p class="stat-label">Informações de Contato</p>
                <div class="mt-4 space-y-2">
                    <p class="text-xs text-gray-700 font-bold uppercase"><span class="text-gray-400">Fone:</span> ${e.personalPhone || 'N/A'}</p>
                    <p class="text-xs text-gray-700 font-bold uppercase truncate"><span class="text-gray-400">E-mail:</span> ${e.personalEmail || 'N/A'}</p>
                </div>
            </div>

            <a href="colaboradores-pro" class="w-full btn bg-nordeste-black text-white py-4 rounded-2xl font-black uppercase text-[10px] shadow-xl block text-center">Ir para Prontuário Completo</a>
        `;
    } catch (err) {
        content.innerHTML = '<p class="text-center text-red-500 font-bold">Erro ao carregar prontuário.</p>';
    }
};

window.closePortalDrawer = () => {
    const drw = document.getElementById('portal-drawer');
    const overlay = document.getElementById('portal-drawer-overlay');
    drw.style.right = '-100%';
    overlay.classList.add('hidden');
};

window.openWpp = (phone) => {
    if (!phone) return alert('Telefone não cadastrado.');
    const clean = phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${clean}`, '_blank');
};

// Funções de Transferência
let companies = [];

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

window.openTransferModal = async (employeeId) => {
    // Buscar dados do colaborador
    const empRes = await fetch(`/api/employees/${employeeId}`);
    const employee = await empRes.json();
    
    // Carregar empresas
    await loadCompanies();
    
    // Criar modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div class="bg-orange-500 p-6 text-white rounded-t-2xl">
                <h3 class="text-xl font-black uppercase italic">Transferência de Empregador/Unidade</h3>
            </div>
            <div class="p-8 space-y-6">
                <div class="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <p class="text-sm font-bold text-blue-600">Colaborador:</p>
                    <p class="text-lg font-black text-gray-800">${employee.name}</p>
                    <p class="text-sm text-gray-600">Matrícula: ${employee.registrationNumber}</p>
                    <p class="text-sm text-gray-600">Atual: ${employee.employer_name || 'N/A'} / ${employee.workplace_name || 'N/A'}</p>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-2">Novo Empregador</label>
                        <select id="new-employer" class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500">
                            <option value="">Manter atual</option>
                            ${companies.filter(c => !c.type || c.type === 'company').map(e => 
                                `<option value="${e.id}" ${e.id === employee.employer_id ? 'selected' : ''}>${e.name}</option>`
                            ).join('')}
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-2">Nova Unidade</label>
                        <select id="new-workplace" class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500">
                            <option value="">Manter atual</option>
                            ${companies.filter(c => c.type === 'unit' || c.type === 'workplace').map(w => 
                                `<option value="${w.id}" ${w.id === employee.workplace_id ? 'selected' : ''}>${w.name}</option>`
                            ).join('')}
                        </select>
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
                    <button onclick="this.closest('.fixed').remove()" 
                        class="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-all">
                        Cancelar
                    </button>
                    <button onclick="window.executeTransfer('${employeeId}')" 
                        class="px-6 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-all">
                        Confirmar Transferência
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
};

window.executeTransfer = async (employeeId) => {
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
        const res = await fetch(`/api/transfers/employee/${employeeId}`, {
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
            document.querySelector('.fixed').remove();
            
            // Recarregar dados do portal
            await initPortal();
        } else {
            alert('Erro ao registrar transferência: ' + (data.error || 'Erro desconhecido'));
        }
    } catch (error) {
        console.error('Erro na transferência:', error);
        alert('Erro ao registrar transferência. Verifique o console.');
    }
};

function startTime() {
    setInterval(() => {
        const now = new Date();
        document.getElementById('portal-time').innerText = now.toLocaleTimeString('pt-BR');
    }, 1000);
}
