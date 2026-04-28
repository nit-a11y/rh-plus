
export async function initRoles() {
    renderRoles();
}

async function renderRoles() {
    const grid = document.getElementById('roles-grid');
    if (!grid) return;

    try {
        const res = await fetch('/api/roles');
        const roles = await res.json();

        grid.innerHTML = '';
        if (roles.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full py-20 text-center text-gray-300 font-black uppercase italic opacity-50">
                    <p class="text-4xl mb-4">👔</p>
                    <p>Nenhuma função cadastrada na matriz.</p>
                </div>
            `;
            return;
        }

        roles.forEach(r => {
            const card = document.createElement('div');
            card.className = 'bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:border-amber-400 transition-all group';
            card.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <div class="flex gap-2">
                        <span class="px-3 py-1 bg-nordeste-red text-white text-[8px] font-black uppercase rounded-lg shadow-sm">${r.category || 'OP'}</span>
                        <span class="px-3 py-1 bg-amber-50 text-amber-600 text-[8px] font-black uppercase rounded-lg border border-amber-100">CBO: ${r.cbo}</span>
                    </div>
                    <button onclick="window.deleteRole('${r.id}')" class="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">✕</button>
                </div>
                <h3 class="font-black text-gray-800 uppercase text-sm mb-1 leading-tight">${r.name}</h3>
                <p class="text-[10px] text-amber-600 font-bold uppercase italic">${r.sector}</p>
                
                <div class="mt-6 pt-4 border-t border-gray-50">
                    <p class="text-[8px] text-gray-400 font-bold uppercase mb-1">Diretoria / Gestão:</p>
                    <p class="text-[10px] text-gray-600 font-black uppercase">${r.directorate}</p>
                </div>
            `;
            grid.appendChild(card);
        });
    } catch (e) {
        console.error(e);
    }
}

window.openNewRoleModal = () => {
    const modal = document.getElementById('pro-modal-container');
    const content = document.getElementById('pro-modal-content');
    content.innerHTML = `
        <div class="bg-amber-600 p-8 text-white"><h3 class="text-xl font-black uppercase italic">Nova Definição de Cargo</h3></div>
        <div class="p-10 space-y-6">
            <div><label class="pro-label">Título do Cargo</label><input id="r-name" class="pro-input font-bold" placeholder="Ex: Comprador"></div>
            
            <div class="grid grid-cols-2 gap-4">
                <div><label class="pro-label">CBO (Classificação)</label><input id="r-cbo" class="pro-input font-mono" placeholder="5141-21"></div>
                <div>
                    <label class="pro-label">Área / Perfil Fardamento</label>
                    <select id="r-category" class="pro-input font-black text-nordeste-red">
                        <option value="OP">OPERACIONAL</option>
                        <option value="ADM">ADMINISTRATIVO</option>
                        <option value="ASD">ASD (SERVIÇOS GERAIS)</option>
                    </select>
                </div>
            </div>

            <div><label class="pro-label">Setor / Departamento</label><input id="r-sector" class="pro-input" placeholder="Ex: Compras"></div>
            <div><label class="pro-label">Diretoria Vinculada</label><input id="r-directorate" class="pro-input" placeholder="Ex: Rafael"></div>
            <div class="flex gap-4 pt-6"><button onclick="window.closeProModal()" class="flex-1 py-4 text-[10px] font-black uppercase text-gray-400">Cancelar</button><button onclick="window.saveNewRole()" class="flex-[2] bg-amber-700 text-white py-4 rounded-2xl font-black text-[10px] uppercase shadow-xl">Adicionar à Matriz</button></div>
        </div>
    `;
    modal.classList.remove('hidden');
};

window.saveNewRole = async () => {
    const payload = {
        name: document.getElementById('r-name').value,
        cbo: document.getElementById('r-cbo').value,
        category: document.getElementById('r-category').value,
        sector: document.getElementById('r-sector').value,
        directorate: document.getElementById('r-directorate').value
    };
    if (!payload.name || !payload.cbo) return window.uiAlert('Nome e CBO são obrigatórios');

    await fetch('/api/roles', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) });
    window.closeProModal();
    renderRoles();
};

window.deleteRole = async (id) => {
    if (!window.uiConfirm('Deseja remover este cargo da matriz organizacional?')) return;
    await fetch(`/api/roles/${id}`, { method: 'DELETE' });
    renderRoles();
};
