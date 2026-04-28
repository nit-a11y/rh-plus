
export async function initCompanies() {
    renderCompanies();
}

async function renderCompanies() {
    const grid = document.getElementById('companies-grid');
    if (!grid) return;

    try {
        const res = await fetch('/api/companies');
        const companies = await res.json();

        grid.innerHTML = '';
        if (companies.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full py-20 text-center text-gray-300 font-black uppercase italic opacity-50">
                    <p class="text-4xl mb-4">ðŸ¢</p>
                    <p>Nenhuma empresa cadastrada.</p>
                </div>
            `;
            return;
        }

        companies.forEach(c => {
            const card = document.createElement('div');
            card.className = 'bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:border-blue-400 transition-all group';
            card.innerHTML = `
                <div class="flex justify-between items-start mb-6">
                    <span class="px-3 py-1 bg-blue-50 text-blue-600 text-[8px] font-black uppercase rounded-lg border border-blue-100">${c.type}</span>
                    <button onclick="window.deleteCompany('${c.id}')" class="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">âœ•</button>
                </div>
                <h3 class="font-black text-gray-800 uppercase text-sm mb-2 leading-tight">${c.name}</h3>
                <p class="text-[10px] font-mono text-gray-400 font-bold mb-4 tracking-tighter">CNPJ: ${c.cnpj}</p>
                <div class="pt-4 border-t border-gray-50">
                    <p class="text-[9px] text-gray-400 font-bold uppercase mb-1">LocalizaÃ§Ã£o Principal:</p>
                    <p class="text-[10px] text-gray-600 font-medium">${c.address}</p>
                </div>
            `;
            grid.appendChild(card);
        });
    } catch (e) {
        console.error(e);
    }
}

window.openNewCompanyModal = () => {
    const modal = document.getElementById('pro-modal-container');
    const content = document.getElementById('pro-modal-content');
    content.innerHTML = `
        <div class="bg-nordeste-black p-8 text-white"><h3 class="text-xl font-black uppercase italic">Cadastrar Empresa/Unidade</h3></div>
        <div class="p-10 space-y-6">
            <div><label class="pro-label">Nome da Empresa</label><input id="comp-name" class="pro-input font-bold" placeholder="Ex: AR2 LocaÃ§Ãµes"></div>
            <div><label class="pro-label">CNPJ</label><input id="comp-cnpj" class="pro-input font-mono" placeholder="00.000.000/0000-00"></div>
            <div><label class="pro-label">EndereÃ§o Completo</label><input id="comp-addr" class="pro-input" placeholder="Rua, NÃºmero, Bairro, Cidade"></div>
            <div>
                <label class="pro-label">Tipo de Entidade</label>
                <select id="comp-type" class="pro-input font-bold">
                    <option value="Empregador">Apenas Empregador (Contratual)</option>
                    <option value="Unidade">Apenas Unidade (FÃ­sico)</option>
                    <option value="Ambos" selected>Ambos</option>
                </select>
            </div>
            <div class="flex gap-4 pt-6"><button onclick="window.closeProModal()" class="flex-1 py-4 text-[10px] font-black uppercase text-gray-400">Cancelar</button><button onclick="window.saveNewCompany()" class="flex-[2] bg-blue-700 text-white py-4 rounded-2xl font-black text-[10px] uppercase shadow-xl">Cadastrar</button></div>
        </div>
    `;
    modal.classList.remove('hidden');
};

window.saveNewCompany = async () => {
    const payload = {
        name: document.getElementById('comp-name').value,
        cnpj: document.getElementById('comp-cnpj').value,
        address: document.getElementById('comp-addr').value,
        type: document.getElementById('comp-type').value
    };
    if (!payload.name || !payload.cnpj) return window.uiAlert('Nome e CNPJ sÃ£o obrigatÃ³rios');

    await fetch('/api/companies', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) });
    window.closeProModal();
    renderCompanies();
};

window.deleteCompany = async (id) => {
    if (!window.uiConfirm('Deseja remover esta empresa')) return;
    await fetch(`/api/companies/${id}`, { method: 'DELETE' });
    renderCompanies();
};

