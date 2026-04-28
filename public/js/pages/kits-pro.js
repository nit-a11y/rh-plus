
let rolesCache = [];

document.addEventListener('DOMContentLoaded', () => {
    initKits();
});

export async function initKits() {
    renderKits();
}

async function renderKits() {
    const grid = document.getElementById('kits-grid');
    if (!grid) return;

    try {
        const res = await fetch('/api/kits');
        const kits = await res.json();

        grid.innerHTML = '';
        if (kits.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full py-20 text-center text-gray-300 font-black uppercase italic opacity-50">
                    <p class="text-4xl mb-4">🎽</p>
                    <p>Nenhum enxoval configurado.</p>
                </div>
            `;
            return;
        }

        kits.forEach(k => {
            const card = document.createElement('div');
            card.className = 'bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:border-nordeste-red transition-all group relative animate-fade';
            card.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <span class="px-3 py-1 bg-gray-100 text-gray-500 text-[8px] font-black uppercase rounded-lg">KIT ESTRATÉGICO</span>
                    <button onclick="window.deleteKit('${k.id}')" class="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">✕</button>
                </div>
                <h3 class="font-black text-gray-800 uppercase text-lg mb-1 leading-tight">${k.kit_name}</h3>
                <p class="text-[10px] text-nordeste-red font-bold uppercase italic mb-6">CARGO: ${k.role_name}</p>
                
                <button onclick="window.viewKitDetails('${k.id}')" class="w-full bg-nordeste-black text-white py-3 rounded-xl font-black text-[9px] uppercase shadow-lg">Ver Composição do Kit</button>
            `;
            grid.appendChild(card);
        });
    } catch (e) { console.error(e); }
}

window.openNewKitModal = async () => {
    const res = await fetch('/api/roles');
    rolesCache = await res.json();
    const modal = document.getElementById('pro-modal-container');
    const content = document.getElementById('pro-modal-content');
    
    content.parentElement.classList.remove('p-4');
    content.className = "bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-hidden animate-pop border border-white/20";

    content.innerHTML = `
        <div class="bg-nordeste-black p-8 text-white flex justify-between items-center">
            <div>
                <h3 class="text-xl font-black uppercase italic tracking-tight">Novo Configurador de Enxoval</h3>
                <p class="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Defina os itens que o colaborador receberá no primeiro dia</p>
            </div>
            <button onclick="window.closeProModal()" class="text-white/30 hover:text-white">✕</button>
        </div>
        
        <div class="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scroll">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="pro-label">Vincular ao Cargo</label>
                    <select id="k-role" class="pro-input font-bold" onchange="window.handleRoleKitAutomation(this.value)" required>
                        <option value="">-- SELECIONE --</option>
                        ${rolesCache.map(r => `<option value="${r.id}">${r.name} (${r.category})</option>`).join('')}
                    </select>
                </div>
                <div><label class="pro-label">Nome do Kit</label><input id="k-name" class="pro-input font-bold" placeholder="Ex: Kit Operacional Completo"></div>
            </div>

            <div class="border-t pt-8">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <h4 class="text-xs font-black text-gray-400 uppercase italic">Peças e Itens do Kit</h4>
                        <p id="automation-msg" class="text-[8px] text-nordeste-red font-bold uppercase mt-1"></p>
                    </div>
                    <button onclick="window.addKitItemField()" class="text-[9px] font-black uppercase bg-gray-100 px-4 py-2 rounded-xl hover:bg-gray-200">+ Adicionar Item</button>
                </div>
                <div id="kit-items-list" class="space-y-3"></div>
            </div>
        </div>

        <div class="p-8 bg-gray-50 border-t flex gap-4">
            <button onclick="window.closeProModal()" class="flex-1 py-4 text-xs font-black uppercase text-gray-400">Cancelar</button>
            <button onclick="window.saveNewKit()" class="flex-[2] bg-nordeste-red text-white py-4 rounded-2xl font-black text-xs uppercase shadow-xl">Salvar Kit Organizacional</button>
        </div>
    `;
    modal.classList.remove('hidden');
};

window.handleRoleKitAutomation = (roleId) => {
    const role = rolesCache.find(r => r.id === roleId);
    const list = document.getElementById('kit-items-list');
    const msg = document.getElementById('automation-msg');
    const kitNameInput = document.getElementById('k-name');
    
    list.innerHTML = '';
    if(!role) { msg.innerText = ''; return; }

    kitNameInput.value = `Kit Padrão ${role.category} - ${role.name}`;
    msg.innerText = `🤖 AUTO-SUGESTÃO APLICADA PARA ÁREA: ${role.category}`;

    const defaults = {
        'ASD': [
            { cat: 'Farda', type: 'Camisa Valores', color: 'Cinza' },
            { cat: 'Farda', type: 'Camisa Valores', color: 'Preta' },
            { cat: 'Farda', type: 'Calça ASD', color: 'Cinza' }
        ],
        'OP': [
            { cat: 'Farda', type: 'Camisa Valores', color: 'Vermelha' },
            { cat: 'Farda', type: 'Camisa Valores', color: 'Cinza' },
            { cat: 'Farda', type: 'Camisa Polo', color: 'Preta' },
            { cat: 'Farda', type: 'Calça Jeans', color: 'Jeans' }
        ],
        'ADM': [
            { cat: 'Farda', type: 'Camisa Valores', color: 'Vermelha' },
            { cat: 'Farda', type: 'Camisa Valores', color: 'Cinza' },
            { cat: 'Farda', type: 'Camisa Polo', color: 'Azul' }
        ]
    };

    const items = defaults[role.category] || [];
    items.forEach(i => window.addKitItemField(i.cat, i.type, i.color));
};

window.addKitItemField = (cat = 'Farda', type = '', color = '') => {
    const container = document.getElementById('kit-items-list');
    const div = document.createElement('div');
    div.className = 'grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm animate-fade relative group';
    div.innerHTML = `
        <div><label class="pro-label">Categoria</label><select class="ki-cat pro-input text-[10px]"><option ${cat === 'Farda' ? 'selected' : ''}>Farda</option><option ${cat === 'EPI' ? 'selected' : ''}>EPI</option><option ${cat === 'Ferramenta' ? 'selected' : ''}>Ferramenta</option><option ${cat === 'Acessório' ? 'selected' : ''}>Acessório</option></select></div>
        <div class="md:col-span-2"><label class="pro-label">Item / Descrição</label><input class="ki-type pro-input text-[10px]" placeholder="Ex: Camisa Valores" value="${type}"></div>
        <div><label class="pro-label">Cor/Modelo</label><input class="ki-color pro-input text-[10px]" placeholder="Vermelha" value="${color}"></div>
        <input type="hidden" class="ki-qty" value="1">
        <button onclick="this.parentElement.remove()" class="absolute -right-2 -top-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
    `;
    container.appendChild(div);
};

window.saveNewKit = async () => {
    const role_id = document.getElementById('k-role').value;
    const kit_name = document.getElementById('k-name').value;
    const itemElements = document.querySelectorAll('#kit-items-list > div');
    
    const items = Array.from(itemElements).map(el => ({
        category: el.querySelector('.ki-cat').value,
        type: el.querySelector('.ki-type').value,
        color: el.querySelector('.ki-color').value,
        quantity: 1
    }));

    if(!role_id || !kit_name || items.length === 0) return window.uiAlert('Preencha os dados do kit.');

    await fetch('/api/kits', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ role_id, kit_name, items })
    });

    window.closeProModal();
    renderKits();
};

window.viewKitDetails = async (id) => {
    const res = await fetch(`/api/kits/${id}`);
    const kit = await res.json();
    const modal = document.getElementById('pro-modal-container');
    const content = document.getElementById('pro-modal-content');
    
    content.className = "bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-pop";
    content.innerHTML = `
        <div class="bg-nordeste-black p-8 text-white flex justify-between items-center">
            <h3 class="text-xl font-black uppercase italic">${kit.kit_name}</h3>
            <button onclick="window.closeProModal()" class="text-white/20">✕</button>
        </div>
        <div class="p-8 space-y-3">
            ${kit.items.map(i => `
                <div class="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                    <div>
                        <p class="text-[7px] font-black text-gray-400 uppercase">${i.item_category}</p>
                        <p class="text-[11px] font-black text-gray-800 uppercase italic">${i.item_type}</p>
                    </div>
                    <span class="text-[9px] font-bold text-gray-400 uppercase">${i.color}</span>
                </div>
            `).join('')}
        </div>
    `;
    modal.classList.remove('hidden');
};

window.deleteKit = async (id) => {
    if(!window.uiConfirm('Remover este kit?')) return;
    await fetch(`/api/kits/${id}`, { method: 'DELETE' });
    renderKits();
};

