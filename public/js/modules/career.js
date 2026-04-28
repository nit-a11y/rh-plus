
import { state, getRefresher } from '../state.js';
import { formatCurrency, parseCurrency } from '../utils.js';

let rolesMatrix = [];

export async function renderCareerTab(emp) {
    const container = document.getElementById('career-timeline');
    if (!container) return;

    container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <h3 class="text-lg font-black text-gray-800 uppercase italic">Trajetória Profissional</h3>
            <button onclick="window.modules.career.openCareerModal()" class="btn bg-nordeste-black text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase shadow-lg hover:scale-105 transition-all">+ Nova Movimentação</button>
        </div>
        <div class="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm animate-fade-in">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 border-b border-gray-50 pb-8">
                <div>
                    <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Cargo Atual</p>
                    <h2 class="text-sm font-black text-gray-800 uppercase mt-1 italic">${emp?.role || '---'}</h2>
                    <p class="text-xs font-mono font-bold text-amber-600 mt-1">CBO: ${emp?.cbo || '-'}</p>
                </div>
                <div class="text-right">
                    <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Remuneração</p>
                    <h3 class="text-3xl font-black text-nordeste-red mt-1">${emp?.currentSalary || 'R$ 0,00'}</h3>
                </div>
            </div>

            <div class="table-container border-0 shadow-none">
                <table class="styled-table w-full">
                    <thead>
                        <tr class="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b">
                            <th class="pb-3">Data</th>
                            <th class="pb-3">Evento</th>
                            <th class="pb-3">Função / Setor</th>
                            <th class="pb-3 text-right">Salário</th>
                        </tr>
                    </thead>
                    <tbody id="career-history-rows">
                        <tr><td colspan="4" class="text-center py-10"><div class="spinner w-6 h-6 mx-auto"></div></td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    if (emp?.id) await loadCareerHistory(emp.id);
}

async function loadCareerHistory(id) {
    try {
        const res = await fetch(`/api/employees-pro/${id}/dossier`);
        const data = await res.json();
        const rows = document.getElementById('career-history-rows');
        if (!rows) return;

        const list = (data && Array.isArray(data.career)) ? data.career : [];

        if (list.length === 0) {
            rows.innerHTML = `<tr><td colspan="4" class="text-center py-12 text-gray-300 italic uppercase text-[10px] font-black opacity-50">Sem registros.</td></tr>`;
            return;
        }

        rows.innerHTML = list.map(h => `
            <tr class="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                <td class="font-mono text-gray-400 font-bold text-[10px] py-5">${h.date ? new Date(h.date).toLocaleDateString('pt-BR') : '-'}</td>
                <td><span class="px-2 py-1 bg-gray-100 rounded text-[8px] font-black text-gray-600 uppercase">${h.move_type || 'Ajuste'}</span></td>
                <td class="py-5"><div class="flex flex-col"><span class="text-[11px] font-black text-gray-800 uppercase italic">${h.role || '-'}</span><span class="text-[8px] font-bold text-gray-400 uppercase">${h.sector || '-'}</span></div></td>
                <td class="text-right font-black text-nordeste-red font-mono text-sm">${h.salary || '0,00'}</td>
            </tr>
        `).join('');
    } catch (e) {
        console.error("Erro carreira:", e);
    }
}

export const openCareerModal = async () => {
    try {
        const res = await fetch('/api/roles');
        rolesMatrix = await res.json();
        const select = document.getElementById('car-role-select');
        if (select) {
            select.innerHTML = '<option value="">-- SELECIONE O CARGO --</option>' + 
                rolesMatrix.map(r => `<option value="${r.id}">${r.name.toUpperCase()} (${r.category})</option>`).join('');
        }
        document.getElementById('modal-new-career')?.classList.remove('hidden-custom');
    } catch(e) { alert("Erro ao carregar matriz."); }
};

export const closeCareerModal = () => document.getElementById('modal-new-career')?.classList.add('hidden-custom');

export const handleRoleMatrixChange = (roleId) => {
    const role = rolesMatrix.find(r => r.id === roleId);
    if (role) {
        const sectorInput = document.getElementById('car-sector');
        const cboInput = document.getElementById('car-cbo');
        const kitSwap = document.getElementById('car-kit-swap');
        
        if (sectorInput) sectorInput.value = role.sector;
        if (cboInput) cboInput.value = role.cbo;
        
        // Sugestão inteligente de troca de kit baseada na área do novo cargo
        if (kitSwap && role.category) {
            kitSwap.value = role.category;
        }
    }
};

export const submitCareer = async (e) => {
    e.preventDefault();
    if (!state.selectedEmployee) return;

    const { loadData, renderApp } = getRefresher();
    const selectedRoleId = document.getElementById('car-role-select').value;
    const roleData = rolesMatrix.find(r => r.id === selectedRoleId);

    // Captura tamanhos do estado do colaborador selecionado ou assume padrão
    const emp = state.selectedEmployee;

    const payload = {
        employeeId: emp.id,
        move_type: document.getElementById('car-type').value,
        role: roleData ? roleData.name : emp.role,
        sector: document.getElementById('car-sector').value,
        cbo: document.getElementById('car-cbo').value,
        salary: document.getElementById('car-salary').value,
        date: document.getElementById('car-date').value,
        observation: document.getElementById('car-obs').value,
        kit_swap: document.getElementById('car-kit-swap').value,
        responsible: state.user ? state.user.name : 'Admin RH',
        sizes: {
            shirt: emp.shirtSize || 'M',
            pants: emp.pantsSize || '40',
            shoe: emp.shoeSize || '40'
        }
    };

    const res = await fetch('/api/career', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
    });

    if (res.ok) {
        alert('MOVIMENTAÇÃO E ATUALIZAÇÃO DE FARDAMENTO CONCLUÍDAS!');
        await loadData();
        state.selectedEmployee = state.employees.find(e => e.id === emp.id);
        renderApp();
        closeCareerModal();
    } else {
        alert('Erro ao processar movimentação.');
    }
};
