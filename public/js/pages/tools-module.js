
const formatarDataBR = (v) => { if (!v) return '-'; const [y, m, d] = v.split('-'); return `${d}/${m}/${y}`; };
const formatarDataHoraBR = (v) => { if (!v) return '-'; try { const d = new Date(v); return d.toLocaleString('pt-BR'); } catch(e) { return '-'; } };

let employees = [];
let selectedId = null;
let currentEmployeeData = null;
let currentItems = [];
let filterStatus = 'active';

document.addEventListener('DOMContentLoaded', () => {
    loadAllEmployees();
    
    const urlParams = new URLSearchParams(window.location.search);
    const empId = urlParams.get('emp');
    if (empId) {
        setTimeout(() => {
            window.selectEmployee(empId);
        }, 500);
    }
});

async function loadAllEmployees() {
    try {
        const res = await fetch('/api/employees');
        employees = await res.json();
        renderSidebar();
    } catch (e) {
        console.error("Erro ao carregar lista:", e);
    }
}

window.setFilterStatus = (status) => {
    filterStatus = status;
    document.getElementById('tab-active').className = `tab-btn ${status === 'active' ? 'active' : 'inactive'}`;
    document.getElementById('tab-inactive').className = `tab-btn ${status === 'inactive' ? 'active' : 'inactive'}`;
    renderSidebar();
};

function renderSidebar() {
    const container = document.getElementById('employees-list');
    if (!container) return;
    const search = document.getElementById('emp-search')?.value.toLowerCase() || '';
    
    const filtered = (employees || []).filter(e => {
        const matchesSearch = e.name.toLowerCase().includes(search) || (e.registrationNumber && e.registrationNumber.includes(search));
        const matchesStatus = filterStatus === 'active' ? e.type !== 'Desligado' : e.type === 'Desligado';
        return matchesSearch && matchesStatus;
    });

    container.innerHTML = filtered.map(e => `
            <div class="emp-item ${selectedId === e.id ? 'active' : ''}" onclick="window.selectEmployee('${e.id}')">
                <img src="${e.photoUrl || 'https://ui-avatars.com/api/?name='+encodeURIComponent(e.name)}" class="w-12 h-12 rounded-[1rem] object-cover border-2 border-white shadow-md shrink-0">
                <div class="min-w-0 flex-1">
                    <p class="text-[11px] font-black text-gray-800 uppercase truncate leading-tight">${e.name}</p>
                    <p class="text-[8px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">${e.role || 'Sem Cargo'}</p>
                </div>
            </div>
        `).join('') || `<p class="p-8 text-center text-gray-300 text-[9px] font-black uppercase tracking-widest leading-relaxed">Nenhum Registro<br>Encontrado</p>`;
}

window.filterList = () => renderSidebar();

window.selectEmployee = async (id) => {
    if (!id) return;
    selectedId = id;
    renderSidebar();
    
    document.getElementById('welcome-msg').classList.add('hidden-pro');
    document.getElementById('selection-view').classList.remove('hidden-pro');
    
    // O emp virá do array básico inicialmente, mas os detalhes extras virão do backend
    const baseEmp = employees.find(e => e.id === id);
    if (!baseEmp) return;
    
    document.getElementById('view-photo').src = baseEmp.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(baseEmp.name)}`;
    document.getElementById('view-name').innerText = baseEmp.name;
    document.getElementById('view-reg').innerText = `#${baseEmp.registrationNumber || '0000'}`;
    document.getElementById('view-sector').innerText = baseEmp.sector || '-';

    await loadDetails(id);
};

async function loadDetails(id) {
    try {
        const res = await fetch(`/api/tools/employee/${id}`);
        const data = await res.json();
        
        currentEmployeeData = data.employee;
        if (currentEmployeeData) {
            document.getElementById('view-employer').innerText = currentEmployeeData.employer_name || 'N/A';
            document.getElementById('view-workplace').innerText = currentEmployeeData.workplace_name || 'N/A';
        }

        currentItems = data.items || [];
        renderItems(currentItems);
        renderHistory(data.history || []);
    } catch (e) {
        console.error(e);
    }
}

function renderItems(items) {
    const grid = document.getElementById('items-grid');
    if (!grid) return;
    
    if (!items || items.length === 0) {
        grid.innerHTML = '<div class="col-span-full py-12 text-center text-gray-300 font-black uppercase text-[10px] border-2 border-dashed border-gray-100 rounded-[2rem]">Nenhum ativo vinculado.</div>';
        return;
    }

    grid.innerHTML = items.map(i => `
        <div class="item-card animate-fade">
            <div class="flex justify-between items-start mb-6">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-300 border border-blue-100 shadow-inner">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    </div>
                    <div>
                        <h4 class="font-black text-gray-800 text-[11px] uppercase italic leading-none">${i.type}</h4>
                        <p class="text-[9px] text-gray-400 font-black uppercase mt-1 tracking-widest">${i.brand} ${i.model}</p>
                    </div>
                </div>
                <div class="flex flex-col items-end gap-1">
                    <span class="status-badge-ok">${i.status.toUpperCase()}</span>
                </div>
            </div>
            
            <div class="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 space-y-2 mb-6 text-[10px]">
                <div class="flex justify-between items-center"><span class="font-black text-gray-400 uppercase text-[8px]">Patrimônio</span><span class="font-bold text-gray-800">${i.patrimonio || 'N/A'}</span></div>
                <div class="flex justify-between items-center"><span class="font-black text-gray-400 uppercase text-[8px]">Serial S/N</span><span class="font-bold text-gray-800">${i.serial_number || 'N/A'}</span></div>
                <div class="flex justify-between items-start pt-2 mt-1 border-t border-blue-200/30">
                    <span class="font-black text-blue-400 uppercase text-[8px]">Acessórios Inc.</span>
                    <span class="font-black text-blue-600 bg-white px-2 py-0.5 rounded border border-blue-100 max-w-[150px] leading-tight text-right">${i.accessories || 'PADRÃO'}</span>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-3 mt-6">
                <button onclick="window.openReturn('${i.id}')" class="btn-action-outline font-black text-red-400 hover:text-red-500 hover:border-red-200 transition-all text-[9px]">Baixa / Devolução</button>
                <button onclick="window.openSwap('${i.id}')" class="btn-action-outline font-black text-blue-400 hover:text-blue-500 hover:border-blue-200 transition-all text-[9px]">Substituir / Troca</button>
                <button onclick="window.generateSwapTermo('${i.id}')" class="btn-action-outline font-black text-red-400 hover:text-red-500 hover:border-red-200 transition-all text-[9px]">Termo de Troca 📋</button>
                <button onclick="window.printTermo('${i.id}')" class="col-span-2 py-3 bg-gray-50 text-gray-500 rounded-xl text-[9px] font-black uppercase hover:bg-gray-100 transition-all border border-gray-100 flex items-center justify-center gap-2 italic">
                    Recibo / Termo PDV 📄
                </button>
            </div>
        </div>
    `).join('');
}

function renderHistory(history) {
    const table = document.getElementById('main-history-table');
    const rows = document.getElementById('history-rows');
    const empty = document.getElementById('history-empty-msg');
    
    if (!history || history.length === 0) {
        table.classList.add('hidden-pro');
        empty.classList.remove('hidden-pro');
        return;
    }

    table.classList.remove('hidden-pro');
    empty.classList.add('hidden-pro');

    rows.innerHTML = history.map(h => `
        <tr>
            <td class="font-mono text-gray-400 text-[10px]">${formatarDataHoraBR(h.data_hora)}</td>
            <td><span class="px-2 py-1 rounded text-[8px] font-black uppercase ${h.action === 'ENTREGA' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}">${h.action}</span></td>
            <td class="uppercase italic text-[10px] font-black">${h.observation || 'Movimentação'}</td>
            <td class="text-gray-400 font-medium italic text-[10px]">${h.status_item || '-'}</td>
            <td class="text-blue-600 uppercase text-[9px] font-black">${h.responsavel || 'Sistema'}</td>
        </tr>
    `).join('');
}

let globalInventoryCache = [];

window.openStandaloneToolModal = async () => {
    const modal = document.getElementById('pro-modal-container');
    const content = document.getElementById('pro-modal-content');
    
    // Pegar ativos atuais para servir de busca (estoque)
    try {
        const res = await fetch('/api/tools/all');
        globalInventoryCache = await res.json();
    } catch (e) { console.error("Erro ao carregar cache para busca:", e); }

    content.innerHTML = `
        <div class="bg-blue-600 p-8 text-white flex justify-between items-center">
            <h3 class="text-xl font-black uppercase italic leading-none">Entrega de Ativo</h3>
            <button onclick="window.closeProModal()" class="text-white/50 hover:text-white">✕</button>
        </div>
        <form id="tool-form" class="p-10 space-y-6">
            <div class="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 space-y-3">
                <label for="t-search-inv" class="pro-label text-blue-500">Buscar Ativo em Estoque (Disponível)</label>
                <div class="relative">
                    <input type="text" id="t-search-inv" class="pro-input pl-10" placeholder="Digite o Patrimônio, Serial ou Modelo..." oninput="window.filterAvailableForNewEntry()">
                    <svg class="w-4 h-4 text-blue-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                </div>
                <div id="t-search-results" class="hidden overflow-y-auto max-h-40 border rounded-xl bg-white shadow-xl space-y-1 p-1"></div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                 <div><label for="t-type" class="pro-label">Categoria</label><select id="t-type" class="pro-input" onchange="window.filterAvailableForNewEntry()"><option>Notebook</option><option>Smartphone</option><option>SIM Card</option><option>Tablet</option><option>Ferramenta Manual</option><option>Outros</option></select></div>
                 <div><label for="t-pat" class="pro-label">Patrimônio</label><input id="t-pat" class="pro-input font-black text-blue-600 uppercase" placeholder="NIT-0000" required></div>
            </div>
            <div class="grid grid-cols-2 gap-4">
                 <div><label for="t-brand" class="pro-label">Marca</label><input id="t-brand" class="pro-input uppercase" placeholder="Dell, Apple..." required></div>
                 <div><label for="t-model" class="pro-label">Modelo/Specs</label><input id="t-model" class="pro-input uppercase" placeholder="Ex: Latitude 3420" required></div>
            </div>
            <div><label for="t-ser" class="pro-label">Série / IMEI</label><input id="t-ser" class="pro-input font-mono uppercase" placeholder="S/N" required></div>
            <div class="space-y-3">
                <label class="pro-label text-blue-600">Acessórios Inclusos (Obrigatório)*</label>
                <div class="flex flex-wrap gap-2" id="acc-chips-container">
                    ${['CARREGADOR', 'MOUSE SEM FIO', 'MOUSE PAD', 'TELA EXTRA', 'CABO HDMI', 'MOCHILA'].map(item => `
                        <label class="cursor-pointer group">
                            <input type="checkbox" name="acc-chip" value="${item}" class="hidden peer">
                            <div class="px-4 py-2 border-2 border-gray-100 rounded-xl text-[9px] font-black uppercase transition-all peer-checked:bg-blue-600 peer-checked:border-blue-600 peer-checked:text-white group-hover:border-blue-200">
                                ${item}
                            </div>
                        </label>
                    `).join('')}
                </div>
            </div>
            <div><label for="t-date" class="pro-label">Data de Entrega</label><input type="date" id="t-date" class="pro-input" value="${new Date().toISOString().split('T')[0]}" required></div>
            
            <input type="hidden" id="t-existing-id">

            <div class="flex gap-4 pt-4 border-t">
                <button type="button" onclick="window.closeProModal()" class="flex-1 text-[10px] font-black uppercase text-gray-400">Voltar</button>
                <button type="submit" class="flex-[3] bg-blue-600 text-white py-4 rounded-2xl font-black uppercase shadow-xl hover:bg-black transition-all italic">Processar Entrega</button>
            </div>
        </form>
    `;

    document.getElementById('tool-form').onsubmit = async (e) => {
        e.preventDefault();
        const existingId = document.getElementById('t-existing-id').value;
        const responsible = (typeof Auth !== 'undefined') ? Auth.getUser()?.name : 'Admin';
        
        // Coletar acessórios dos chips
        const selectedAcc = Array.from(document.querySelectorAll('input[name="acc-chip"]:checked')).map(cb => cb.value);
        if (selectedAcc.length === 0) return alert('Por favor, selecione ao menos um acessório (ex: CARREGADOR).');

        const payload = {
            employeeId: selectedId,
            type: document.getElementById('t-type').value,
            brand: document.getElementById('t-brand').value,
            model: document.getElementById('t-model').value,
            patrimonio: document.getElementById('t-pat').value,
            serial_number: document.getElementById('t-ser').value,
            accessories: selectedAcc.join(', '),
            date_given: document.getElementById('t-date').value,
            responsible
        };

        let res;
        if (existingId) {
            // É um item do estoque, usamos a rota de alocação
            res = await fetch('/api/tools/allocate', { 
                method: 'POST', 
                headers: {'Content-Type': 'application/json'}, 
                body: JSON.stringify({ ...payload, toolId: existingId }) 
            });
        } else {
            // É um item novo
            res = await fetch('/api/tools/item', { 
                method: 'POST', 
                headers: {'Content-Type': 'application/json'}, 
                body: JSON.stringify(payload) 
            });
        }

        if (res.ok) { window.closeProModal(); await window.selectEmployee(selectedId); }
    };
    modal.classList.remove('hidden');
};

window.filterAvailableForNewEntry = () => {
    const search = document.getElementById('t-search-inv').value.toLowerCase();
    const type = document.getElementById('t-type').value.toLowerCase();
    const resultBox = document.getElementById('t-search-results');
    
    if (!search && !type) { resultBox.classList.add('hidden'); return; }

    const filtered = globalInventoryCache.filter(t => 
        !t.employee_id && 
        t.type.toLowerCase() === type &&
        (t.patrimonio.toLowerCase().includes(search) || t.model.toLowerCase().includes(search) || t.serial_number.toLowerCase().includes(search))
    );

    if (filtered.length === 0) {
        resultBox.classList.add('hidden');
        return;
    }

    resultBox.classList.remove('hidden');
    resultBox.innerHTML = filtered.map(t => `
        <div class="p-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center transition-colors border-b last:border-0" 
             onclick="window.selectFromStock('${t.id}')">
            <div>
                <p class="text-[10px] font-black text-blue-700">${t.patrimonio}</p>
                <p class="text-[8px] font-bold text-gray-500 uppercase">${t.brand} ${t.model}</p>
            </div>
            <span class="text-[7px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-black">ESTOQUE</span>
        </div>
    `).join('');
};

window.selectFromStock = (id) => {
    const item = globalInventoryCache.find(i => i.id === id);
    if (!item) return;

    document.getElementById('t-pat').value = item.patrimonio;
    document.getElementById('t-brand').value = item.brand;
    document.getElementById('t-model').value = item.model;
    document.getElementById('t-ser').value = item.serial_number;
    document.getElementById('t-acc').value = item.accessories || '';
    document.getElementById('t-existing-id').value = item.id;
    document.getElementById('t-search-results').classList.add('hidden');
    document.getElementById('t-search-inv').value = item.patrimonio;
    
    // Feedback visual
    document.getElementById('t-search-inv').classList.add('bg-green-50', 'border-green-300');
};

window.openReturn = (toolId) => {
    const modal = document.getElementById('pro-modal-container');
    const content = document.getElementById('pro-modal-content');
    content.innerHTML = `
        <div class="bg-gray-800 p-8 text-white"><h3 class="text-xl font-black uppercase italic">Baixa de Ativo</h3></div>
        <div class="p-10 space-y-6">
            <div><label for="f-reason" class="pro-label">Motivo da Devolução</label><select id="f-reason" class="pro-input font-bold"><option>Desligamento do Colaborador</option><option>Upgrade / Troca de Setor</option><option>Manutenção Técnica</option><option>Obsolescência</option></select></div>
            <div><label for="f-obs" class="pro-label">Estado de Conservação</label><textarea id="f-obs" class="pro-input h-24" placeholder="Descreva o estado físico (Riscos, bateria, carregador devolvido?)"></textarea></div>
            <button onclick="window.submitReturn('${toolId}')" class="w-full bg-red-600 text-white py-4 rounded-2xl font-black uppercase shadow-xl italic">Processar Recebimento</button>
            <button onclick="window.closeProModal()" class="w-full text-gray-400 font-black text-[10px] mt-4 uppercase">Cancelar</button>
        </div>
    `;
    modal.classList.remove('hidden');
};

window.submitReturn = async (toolId) => {
    const payload = {
        toolId,
        reason: document.getElementById('f-reason').value,
        observation: document.getElementById('f-obs').value,
        responsible: (typeof Auth !== 'undefined') ? Auth.getUser()?.name : 'Admin'
    };
    const res = await fetch('/api/tools/return', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) });
    if (res.ok) { 
        if (confirm('Recebimento processado! Deseja imprimir o Termo de Devolução agora?')) {
            window.printTermo(toolId, 'devolucao');
        }
        window.closeProModal(); 
        await window.selectEmployee(selectedId); 
    }
};

window.closeProModal = () => document.getElementById('pro-modal-container').classList.add('hidden');

// --- MOTOR D// --- MOTOR DE IMPRESSÃO NIT (ATRIBUTOS DE TI) ---
window.getTermoPageHTML = (item, emp, type = 'entrega') => {
    const isPhone = item.type === 'Smartphone';
    const isReturn = type === 'DEVOLUCAO' || type === 'devolucao';
    
    // Acessórios formatados
    const accessoriesList = (item.accessories || '').split(', ');
    const accessoriesHTML = accessoriesList.map(a => `(X) ${a}`).join(' ');
    const accessoriesEmptyHTML = accessoriesList.map(a => `( ) ${a}`).join(' ');

    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR').replace(/\//g, '');
    const docCode = `NIT-${dateStr}-${item.id.substring(0,4).toUpperCase()}`;

    return `
        <div class="page overflow-hidden flex flex-col bg-white w-[210mm] h-[297mm] shadow-lg mb-10 mx-auto" style="page-break-after: always;">
            <div class="bg-[#d32f2f] text-white p-4 text-center shadow-sm no-print-bg">
                <h1 class="text-xl font-black uppercase tracking-tight">NIT - Nordeste Locações</h1>
                <p class="text-[11px] font-bold opacity-80 uppercase leading-none mt-1">${emp.employer_name}</p>
            </div>

            <div class="content p-[25px_40px] flex-1 flex flex-col">
                <div class="flex justify-end mb-2 text-right">
                    <div class="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-tight">
                        ${!isReturn ? `Código: <span class="text-gray-700">${docCode}</span><br>` : ''}
                        Emissão: <span class="text-gray-700">${now.toLocaleDateString('pt-BR')}</span>
                    </div>
                </div>

                <h2 class="text-center text-lg font-black text-gray-800 mb-4 uppercase tracking-tight border-b-2 border-gray-100 pb-2">
                    ${isReturn ? 'PROTOCOLO DE DEVOLUÇÃO' : 'TERMO DE RESPONSABILIDADE E COMODATO'}
                </h2>

                ${!isReturn ? `
                <div class="section-title bg-[#f9fafb] p-[6px_12px] border-l-[5px] border-[#d32f2f] font-extrabold uppercase text-[11px] mt-[15px] mb-[8px] flex items-center gap-2">DADOS DA EMPRESA</div>
                <div class="bg-blue-50/20 p-3 rounded-lg space-y-0.5 border border-blue-50/50">
                    <div class="data-row flex mb-1 text-[11px]"><span class="data-label font-extrabold min-w-[130px] text-gray-500">Razão Social:</span><span class="data-value font-bold text-gray-900 uppercase">${emp.employer_name}</span></div>
                    <div class="data-row flex mb-1 text-[11px]"><span class="data-label font-extrabold min-w-[130px] text-gray-500">CNPJ:</span><span class="data-value font-bold text-gray-900 uppercase">43.529.100/0001-12</span></div>
                    <div class="data-row flex mb-1 text-[11px]"><span class="data-label font-extrabold min-w-[130px] text-gray-500">Endereço:</span><span class="data-value font-bold text-gray-900 uppercase">Avenida Antônio Sales, nº 1317, Joaquim Távora, Fortaleza/CE</span></div>
                </div>
                ` : `
                <!-- DADOS DA EMPRESA -->
                <div class="text-center mb-6">
                    <h3 class="font-black text-[12px] uppercase text-gray-800 mb-2">DADOS DA EMPRESA</h3>
                    <p class="text-[11px] font-bold text-gray-700">AR2 Serviços e Soluções Ltda</p>
                    <p class="text-[10px] text-gray-600">CNPJ: 43.529.100/0001-12</p>
                    <p class="text-[9px] text-gray-600">Endereço: Avenida Antônio Sales, nº 1317, sala 604, Joaquim Távora, Fortaleza/CE</p>
                </div>

                <!-- TÍTULO -->
                <h2 class="text-center text-lg font-black text-gray-800 mb-6 uppercase">TERMO DE DEVOLUÇÃO</h2>

                <!-- 1. DADOS DO COLABORADOR -->
                <div class="section-title bg-[#f9fafb] p-[6px_12px] border-l-[5px] border-[#d32f2f] font-extrabold uppercase text-[11px] mt-[15px] mb-[8px] flex items-center gap-2">1. DADOS DO COLABORADOR</div>
                <div class="pl-3 space-y-1 text-[10px]">
                    <p><span class="font-bold">Nome:</span> ${emp.name}</p>
                    <p><span class="font-bold">CPF:</span> ${emp.registrationNumber}</p>
                </div>

                <!-- 2. DADOS DO EQUIPAMENTO -->
                <div class="section-title bg-[#f9fafb] p-[6px_12px] border-l-[5px] border-[#d32f2f] font-extrabold uppercase text-[11px] mt-[15px] mb-[8px] flex items-center gap-2">2. DADOS DO EQUIPAMENTO</div>
                <div class="pl-3 space-y-1 text-[10px]">
                    <p><span class="font-bold">Patrimônio:</span> ${item.patrimonio}</p>
                    <p><span class="font-bold">Equipamento:</span> ${item.type}</p>
                    ${!isPhone ? `
                        <p><span class="font-bold">Processador:</span> ${item.model}</p>
                        <p><span class="font-bold">Memória RAM:</span> ${item.ram}</p>
                        <p><span class="font-bold">Armazenamento:</span> ${item.storage}</p>
                    ` : `
                        <p><span class="font-bold">Marca/Modelo:</span> ${item.brand} ${item.model}</p>
                        <p><span class="font-bold">Memória/Interno:</span> ${item.ram} / ${item.storage}</p>
                        <p><span class="font-bold">Identificador IMEI:</span> ${item.serial_number}</p>
                    `}
                    <p><span class="font-bold">Classificação (Tier):</span> ${item.tier || 'T1'}</p>
                    <p><span class="font-bold">Acessórios vinculados:</span> ${accessoriesEmptyHTML || '( ) Nenhum acessório vinculado'}</p>
                </div>

                <!-- 3. DECLARAÇÃO DE DEVOLUÇÃO DO EQUIPAMENTO -->
                <div class="section-title bg-[#f9fafb] p-[6px_12px] border-l-[5px] border-[#d32f2f] font-extrabold uppercase text-[11px] mt-[15px] mb-[8px] flex items-center gap-2">3. DECLARAÇÃO DE DEVOLUÇÃO DO EQUIPAMENTO</div>
                <div class="px-3 text-justify text-[10px] leading-relaxed">
                    <p class="mb-3">Declaro, para os devidos fins, que nesta data realizo a devolução à empresa <span class="font-bold">AR2 Serviços e Soluções Ltda</span>, inscrita no CNPJ nº <span class="font-bold">43.529.100/0001-12</span>, do equipamento corporativo acima descrito, anteriormente cedido para utilização no desempenho de atividades profissionais.</p>
                    <p class="mb-3">Declaro ainda que o equipamento está sendo devolvido juntamente com todos os seus acessórios vinculados, conforme indicado neste documento, ficando a empresa responsável pela conferência técnica e verificação de seu estado de conservação e funcionamento.</p>
                    <p>Com a efetivação desta devolução, declaro estar encerrada minha responsabilidade sobre a guarda, uso e conservação do equipamento, transferindo-se novamente à empresa a posse e responsabilidade patrimonial sobre o referido bem.</p>
                </div>

                <!-- 4. CONFERÊNCIA E RECEBIMENTO DO EQUIPAMENTO -->
                <div class="section-title bg-[#f9fafb] p-[6px_12px] border-l-[5px] border-[#d32f2f] font-extrabold uppercase text-[11px] mt-[15px] mb-[8px] flex items-center gap-2">4. CONFERÊNCIA E RECEBIMENTO DO EQUIPAMENTO</div>
                <div class="px-3 text-[10px] leading-relaxed">
                    <p class="mb-3">A empresa declara ter recebido o equipamento descrito neste documento, assumindo a responsabilidade pela realização da conferência técnica e avaliação do estado físico e funcional do bem.</p>
                    <p class="font-bold mb-2">Resultado da conferência técnica:</p>
                    <div class="space-y-1 ml-2">
                        <p>( ) Equipamento recebido em perfeito estado de conservação e funcionamento</p>
                        <p>( ) Equipamento recebido com avarias ou irregularidades</p>
                    </div>
                    <p class="font-bold mt-3 mb-1">Descrição da avaliação técnica (quando aplicável):</p>
                    <div class="w-full h-12 border border-gray-300 bg-gray-50 rounded"></div>
                </div>

                <!-- 5. ASSINATURAS -->
                <div class="section-title bg-[#f9fafb] p-[6px_12px] border-l-[5px] border-[#d32f2f] font-extrabold uppercase text-[11px] mt-[15px] mb-[8px] flex items-center gap-2">5. ASSINATURAS</div>
                <div class="grid grid-cols-2 gap-8 px-4 mt-4">
                    <div class="text-center">
                        <p class="text-[10px] font-bold text-gray-700 mb-2">Assinatura do Colaborador</p>
                        <div class="border-t-2 border-gray-800 pt-2 mb-2">
                            <div class="h-6 mb-1"></div>
                            <p class="text-[9px] text-gray-600">Nome: ${emp.name}</p>
                            <p class="text-[9px] text-gray-600">CPF: ${emp.registrationNumber}</p>
                        </div>
                    </div>
                    <div class="text-center">
                        <p class="text-[10px] font-bold text-gray-700 mb-2">Responsável pelo Recebimento</p>
                        <div class="border-t-2 border-gray-800 pt-2">
                            <div class="h-6 mb-1"></div>
                            <p class="text-[9px] text-gray-600">Nome: ________________________________</p>
                            <p class="text-[9px] text-gray-600">Cargo: ________________________________</p>
                        </div>
                    </div>
                </div>
                `}

                <div class="mt-4 flex justify-between items-end opacity-20 grayscale grayscale-100">
                    <p class="text-[7px] font-black text-gray-400 uppercase italic">Documento Confidencial | NIT - Nordeste Locações</p>
                    <span class="text-[7px] font-black text-red-600">COD: ${docCode}</span>
                </div>
            </div>
        </div>
    `;
};

// Função para carregar e processar templates
window.loadAndProcessTemplate = async (templatePath, data) => {
    try {
        const response = await fetch(templatePath);
        let template = await response.text();
        
        // Substituir todas as variáveis do template
        Object.keys(data).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            template = template.replace(regex, data[key] || '');
        });
        
        // Extrair estilos do head
        const headMatch = template.match(/<head[^>]*>([\s\S]*?)<\/head>/);
        const headContent = headMatch ? headMatch[1] : '';
        const styleMatch = headContent.match(/<style[^>]*>([\s\S]*?)<\/style>/);
        const styles = styleMatch ? styleMatch[1] : '';
        
        // Extrair conteúdo do body
        const bodyMatch = template.match(/<body[^>]*>([\s\S]*?)<\/body>/);
        const bodyContent = bodyMatch ? bodyMatch[1] : template;
        
        return { styles, bodyContent };
    } catch (error) {
        console.error('Erro ao carregar template:', error);
        return null;
    }
};

window.generateNITDocument = async (type, forcedItems = null) => {
    if (!currentEmployeeData) return alert('Selecione um colaborador primeiro.');
    const items = forcedItems || currentItems;
    if (!items || items.length === 0) return alert('Nenhum item vinculado a este colaborador.');

    // Determinar qual template usar
    const isReturn = type === 'DEVOLUCAO' || type === 'devolucao';
    const templatePath = isReturn ? '/templates/termo-devolucao.html' : '/templates/termo-responsabilidade.html';
    
    // Preparar dados básicos
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR').replace(/\//g, '');
    const docCode = `NIT-${dateStr}-${items[0].id.substring(0,4).toUpperCase()}`;
    
    // Gerar páginas para cada item
    let allPagesHTML = '';
    let allStyles = '';
    
    for (const item of items) {
        // Preparar dados do template
        const accessoriesList = (item.accessories || '').split(', ').filter(a => a.trim());
        const accessoriesHTML = accessoriesList.map(a => `(X) ${a}`).join(' ');
        const accessoriesEmptyHTML = accessoriesList.map(a => `( ) ${a}`).join(' ');
        
        const templateData = {
            empresa_nome: currentEmployeeData.employer_name || 'AR2 Serviços e Soluções Ltda',
            empresa_cnpj: '43.529.100/0001-12',
            empresa_endereco: 'Avenida Antônio Sales, nº 1317, sala 604, Joaquim Távora, Fortaleza/CE',
            empresa_unidade: currentEmployeeData.workplace_name || 'Matriz',
            cidade: 'Fortaleza/CE',
            codigo_documento: docCode,
            data_emissao: now.toLocaleDateString('pt-BR'),
            colaborador_nome: currentEmployeeData.name,
            colaborador_cpf: currentEmployeeData.registrationNumber,
            colaborador_unidade: currentEmployeeData.workplace_name || 'N/A',
            colaborador_empresa: currentEmployeeData.employer_name || 'AR2 Serviços e Soluções Ltda',
            patrimonio: item.patrimonio,
            tipo: item.type,
            tipo_equipamento: item.type,
            processador: item.model,
            memoria: item.ram,
            armazenamento: item.storage || 'Não informado',
            tier: item.tier || 'T1',
            acessorios: isReturn ? (accessoriesEmptyHTML || '( ) Nenhum acessório vinculado') : (accessoriesHTML || 'PADRÃO'),
            responsavel_nome: '________________________',
            responsavel_cargo: '________________________'
        };
        
        // Carregar e processar template
        const templateResult = await window.loadAndProcessTemplate(templatePath, templateData);
        if (templateResult) {
            const { styles, bodyContent } = templateResult;
            allStyles += styles + '\n';
            allPagesHTML += `<div class="page" style="page-break-after: always; margin-bottom: 40px;">${bodyContent}</div>`;
        }
    }

    const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <title>Documentação Patrimonial NIT - ${currentEmployeeData.name}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
            ${allStyles}
            @media print {
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; background: white; }
                @page { margin: 0; size: A4; }
                .page { box-shadow: none; margin: 0; border: none; page-break-after: always; }
                .no-print { display: none; }
            }
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #525659; display: flex; flex-direction: column; align-items: center; padding: 40px 0; }
            .page { transition: all 0.3s ease; width: 210mm; min-height: 297mm; background: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 20px; }
            @media screen {
                .page:hover { transform: scale(1.02); }
            }
        </style>
    </head>
    <body onload="setTimeout(() => window.print(), 800)">
        ${allPagesHTML}
    </body>
    </html>
    `;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
};

window.openSwap = async (oldId) => {
    const oldItem = currentItems.find(i => i.id === oldId);
    const modal = document.getElementById('pro-modal-container');
    const content = document.getElementById('pro-modal-content');
    
    // Carregar máquinas disponíveis do estoque
    let availableMachines = [];
    try {
        const res = await fetch('/api/tools/available');
        availableMachines = await res.json();
    } catch (e) {
        console.error("Erro ao carregar máquinas disponíveis:", e);
    }
    
    // Filtrar máquinas do mesmo tipo do equipamento antigo
    const sameTypeMachines = availableMachines.filter(m => m.type === oldItem?.type);
    
    // Gerar sugestão de patrimônio baseado no antigo
    const oldPat = oldItem?.patrimonio || 'PC0000';
    const patNumber = oldPat.match(/\d+/)?.[0] || '0000';
    const newPatSuggestion = `PC${(parseInt(patNumber) + 1).toString().padStart(4, '0')}`;
    
    content.innerHTML = `
        <div class="bg-blue-600 p-8 text-white"><h3 class="text-xl font-black uppercase italic">Protocolo de Substituição</h3></div>
        <div class="p-10 space-y-6">
            <div class="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
                <p class="text-[9px] font-black uppercase text-blue-400">Equipamento Antigo:</p>
                <p class="text-[11px] font-black uppercase text-gray-800">${oldItem?.patrimonio} - ${oldItem?.type}</p>
                <div class="mt-2 text-[9px] text-gray-600">
                    <p><strong>Modelo:</strong> ${oldItem?.model || 'N/A'}</p>
                    <p><strong>RAM:</strong> ${oldItem?.ram || 'N/A'}</p>
                    <p><strong>Armazenamento:</strong> ${oldItem?.storage || 'N/A'}</p>
                    <p><strong>Tier:</strong> ${oldItem?.tier || 'N/A'}</p>
                </div>
            </div>

            <!-- Opção de tipo de troca -->
            <div class="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <label class="pro-label text-gray-700 mb-3">Tipo de Substituição</label>
                <div class="grid grid-cols-2 gap-3">
                    <label class="cursor-pointer">
                        <input type="radio" name="swap-type" value="available" checked class="peer hidden" onchange="window.toggleSwapType('available')">
                        <div class="p-3 border-2 border-gray-200 rounded-xl text-center transition-all peer-checked:border-blue-500 peer-checked:bg-blue-50">
                            <div class="text-lg mb-1">📦</div>
                            <p class="text-[9px] font-black uppercase">Máquina Disponível</p>
                            <p class="text-[7px] text-gray-500">Usar equipamento do estoque</p>
                        </div>
                    </label>
                    <label class="cursor-pointer">
                        <input type="radio" name="swap-type" value="new" class="peer hidden" onchange="window.toggleSwapType('new')">
                        <div class="p-3 border-2 border-gray-200 rounded-xl text-center transition-all peer-checked:border-blue-500 peer-checked:bg-blue-50">
                            <div class="text-lg mb-1">➕</div>
                            <p class="text-[9px] font-black uppercase">Novo Equipamento</p>
                            <p class="text-[7px] text-gray-500">Cadastrar nova máquina</p>
                        </div>
                    </label>
                </div>
            </div>

            <!-- Seção de máquinas disponíveis -->
            <div id="available-machines-section" class="space-y-4">
                <h4 class="text-[10px] font-black uppercase text-gray-400 border-b pb-2 italic">Máquinas Disponíveis em Estoque</h4>
                ${sameTypeMachines.length > 0 ? `
                    <div class="space-y-2 max-h-60 overflow-y-auto border rounded-xl p-2 bg-gray-50">
                        ${sameTypeMachines.map(machine => `
                            <label class="cursor-pointer flex items-center gap-3 p-3 bg-white rounded-lg border hover:border-blue-300 transition-colors">
                                <input type="radio" name="selected-machine" value="${machine.id}" class="w-4 h-4 text-blue-600">
                                <div class="flex-1">
                                    <p class="text-[10px] font-black text-gray-800">${machine.patrimonio}</p>
                                    <p class="text-[8px] text-gray-600">${machine.brand} ${machine.model} - ${machine.ram || 'N/A'} / ${machine.storage || 'N/A'}</p>
                                    <p class="text-[7px] text-blue-600">Tier: ${machine.tier || 'T1'} | ${machine.unit || 'N/A'}</p>
                                </div>
                                <span class="text-[7px] bg-green-100 text-green-700 px-2 py-1 rounded-full font-black">DISPONÍVEL</span>
                            </label>
                        `).join('')}
                    </div>
                    <p class="text-[8px] text-gray-500 italic">Selecione uma máquina disponível acima para realizar a troca.</p>
                ` : `
                    <div class="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                        <p class="text-[9px] text-gray-400 font-black uppercase">Nenhuma máquina disponível</p>
                        <p class="text-[8px] text-gray-500 mt-1">Não há equipamentos do tipo "${oldItem?.type}" em estoque no momento.</p>
                        <button type="button" onclick="window.toggleSwapType('new')" class="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-[8px] font-black uppercase hover:bg-blue-700 transition-all">
                            Cadastrar Nova Máquina
                        </button>
                    </div>
                `}
            </div>

            <!-- Seção de novo equipamento (inicialmente oculta) -->
            <div id="new-equipment-section" class="hidden-pro space-y-4">
                <h4 class="text-[10px] font-black uppercase text-gray-400 border-b pb-2 italic">Dados do Novo Equipamento</h4>
                
                <div class="grid grid-cols-2 gap-4">
                     <div><label for="s-pat" class="pro-label">Patrimônio Novo</label><input id="s-pat" class="pro-input font-bold uppercase" value="${newPatSuggestion}" required></div>
                     <div><label for="s-model" class="pro-label">Marca/Modelo</label><input id="s-model" class="pro-input uppercase" value="${oldItem?.model || ''}" placeholder="Ex: Dell i5" required></div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div><label for="s-ram" class="pro-label">Memória RAM</label><input id="s-ram" class="pro-input uppercase" value="${oldItem?.ram || ''}" placeholder="Ex: 8GB"></div>
                    <div><label for="s-storage" class="pro-label">Armazenamento</label><input id="s-storage" class="pro-input uppercase" value="${oldItem?.storage || ''}" placeholder="Ex: SSD 256GB"></div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div><label for="s-tier" class="pro-label">Tier/Classificação</label><select id="s-tier" class="pro-input">
                        <option value="T1" ${oldItem?.tier === 'T1' ? 'selected' : ''}>T1 - Básico / ADM</option>
                        <option value="T2" ${oldItem?.tier === 'T2' ? 'selected' : ''}>T2 - Multi-Sítio</option>
                        <option value="T3" ${oldItem?.tier === 'T3' ? 'selected' : ''}>T3 - Alto Desempenho</option>
                    </select></div>
                    <div><label for="s-accessories" class="pro-label">Acessórios</label><input id="s-accessories" class="pro-input uppercase" value="${oldItem?.accessories || ''}" placeholder="Ex: CARREGADOR, MOUSE"></div>
                </div>
            </div>

            <form id="swap-form" class="space-y-4">
                <!-- Campos comuns -->
                <div class="grid grid-cols-2 gap-4">
                    <div><label for="s-reason" class="pro-label">Motivo da Troca</label><select id="s-reason" class="pro-input">
                        <option>Upgrade de Desempenho</option>
                        <option>Defeito no Equipamento Antigo</option>
                        <option>Padronização de Setor</option>
                        <option>Obsolescência</option>
                        <option>Danos Físicos</option>
                    </select></div>
                    <div><label for="s-notes" class="pro-label">Observações</label><input id="s-notes" class="pro-input" placeholder="Informações adicionais..."></div>
                </div>
                
                <div class="flex gap-4 pt-6">
                    <button type="button" onclick="window.closeProModal()" class="flex-1 text-[10px] font-black uppercase text-gray-400">Cancelar</button>
                    <button type="submit" class="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-black uppercase shadow-xl">Processar Troca</button>
                </div>
            </form>
        </div>
    `;

    // Aguardar um pouco para o DOM ser atualizado antes de acessar o formulário
    setTimeout(() => {
        const form = document.getElementById('swap-form');
        if (form) {
            form.onsubmit = async (e) => {
        e.preventDefault();
        
        const swapType = document.querySelector('input[name="swap-type"]:checked').value;
        const reason = document.getElementById('s-reason').value;
        const notes = document.getElementById('s-notes').value;
        const responsible = (typeof Auth !== 'undefined') ? Auth.getUser()?.name : 'Admin';
        
        let payload;
        
        if (swapType === 'available') {
            // Troca com máquina disponível do estoque
            const selectedMachine = document.querySelector('input[name="selected-machine"]:checked');
            if (!selectedMachine) {
                alert('Por favor, selecione uma máquina disponível para realizar a troca.');
                return;
            }
            
            payload = {
                oldToolId: oldId,
                newToolId: selectedMachine.value,
                swapType: 'available',
                reason,
                notes,
                responsible
            };
        } else {
            // Troca com nova máquina
            payload = {
                oldToolId: oldId,
                newTool: {
                    employeeId: selectedId,
                    type: oldItem.type,
                    patrimonio: document.getElementById('s-pat').value,
                    model: document.getElementById('s-model').value,
                    brand: 'NIT',
                    serial_number: 'SN-' + document.getElementById('s-pat').value,
                    ram: document.getElementById('s-ram').value,
                    storage: document.getElementById('s-storage').value,
                    tier: document.getElementById('s-tier').value,
                    accessories: document.getElementById('s-accessories').value,
                    unit: oldItem.unit || 'FORTALEZA',
                    status: 'Em uso',
                    date_given: new Date().toISOString().split('T')[0]
                },
                swapType: 'new',
                reason,
                notes,
                responsible
            };
        }

        const res = await fetch('/api/tools/swap', { 
            method: 'POST', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify(payload) 
        });
        
        if (res.ok) { 
            const result = await res.json();
            window.closeProModal(); 
            await window.selectEmployee(selectedId);
            
            // Gerar automaticamente o termo de troca
            setTimeout(() => {
                window.generateSwapTermoWithDetails(oldId, result.newToolId, reason, notes, swapType);
            }, 500);
        } else {
            const error = await res.json();
            alert('Erro ao processar troca: ' + (error.message || 'Tente novamente.'));
        }
            };
        } else {
            console.error('Formulário swap-form não encontrado');
        }
    }, 100);

    modal.classList.remove('hidden');
};

// Função para alternar entre tipos de troca
window.toggleSwapType = (type) => {
    const availableSection = document.getElementById('available-machines-section');
    const newSection = document.getElementById('new-equipment-section');
    
    if (type === 'available') {
        availableSection.classList.remove('hidden-pro');
        newSection.classList.add('hidden-pro');
    } else {
        availableSection.classList.add('hidden-pro');
        newSection.classList.remove('hidden-pro');
    }
};

// Gerar termo de troca automático com detalhes da operação
window.generateSwapTermoWithDetails = async (oldToolId, newToolId, reason, notes, swapType) => {
    if (!currentEmployeeData) return alert('Erro: dados do colaborador não encontrados.');
    
    try {
        // Obter dados do equipamento antigo
        const oldRes = await fetch(`/api/tools/item/${oldToolId}`);
        const oldItem = await oldRes.json();
        
        // Obter dados do novo equipamento
        let newItem;
        if (swapType === 'available') {
            const newRes = await fetch(`/api/tools/item/${newToolId}`);
            newItem = await newRes.json();
        } else {
            // Se for uma nova máquina, buscar dos itens atualizados do colaborador
            await loadDetails(selectedId);
            newItem = currentItems.find(i => i.id === newToolId);
        }
        
        if (!oldItem || !newItem) return alert('Erro ao obter dados dos equipamentos para o termo.');
        
        // Obter histórico de rastreabilidade
        let historyData = [];
        try {
            const historyRes = await fetch(`/api/tools/employee/${selectedId}`);
            const data = await historyRes.json();
            historyData = data.history || [];
        } catch (e) {
            console.error('Erro ao carregar histórico:', e);
        }
        
        // Gerar termo de troca
        const termoHTML = generateSwapTermoHTML(oldItem, newItem, currentEmployeeData, reason, notes, swapType, historyData);
        
        // Abrir em nova janela para impressão
        const win = window.open('', '_blank');
        win.document.write(termoHTML);
        win.document.close();
        
    } catch (error) {
        console.error('Erro ao gerar termo de troca:', error);
        alert('Erro ao gerar termo de troca. Tente gerar manualmente.');
    }
};

// Gerar HTML do termo de troca
function generateSwapTermoHTML(oldItem, newItem, employee, reason, notes, swapType, historyData = []) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR').replace(/\//g, '');
    const docCode = `TROCA-${dateStr}-${oldItem.id.substring(0,4).toUpperCase()}`;
    
    const isPhone = oldItem.type === 'Smartphone';
    
    // Filtrar histórico relevante para esta troca
    const relevantHistory = historyData.filter(h => 
        h.tool_id === oldItem.id || h.tool_id === newItem.id
    ).slice(0, 5); // Últimas 5 movimentações
    
    return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <title>Termo de Troca - ${employee.name}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
            @media print {
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; background: white; }
                @page { margin: 10mm; size: A4; }
                .page { box-shadow: none; margin: 0; border: none; page-break-after: always; }
                .no-print { display: none; }
            }
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #525659; display: flex; flex-direction: column; align-items: center; padding: 20px 0; }
            .page { transition: all 0.3s ease; width: 190mm; min-height: 277mm; background: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 20px; }
            @media screen {
                .page:hover { transform: scale(1.02); }
            }
            .print-btn {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #d32f2f;
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                font-weight: bold;
                font-size: 14px;
                cursor: pointer;
                box-shadow: 0 4px 6px rgba(0,0,0,0.2);
                transition: all 0.3s;
                z-index: 1000;
            }
            .print-btn:hover {
                background: #b71c1c;
                transform: translateY(-2px);
            }
            @media print {
                .print-btn { display: none; }
            }
        </style>
    </head>
    <body>
        <button class="print-btn no-print" onclick="window.print()">
            🖨️ IMPRIMIR TERMO
        </button>
        <div class="page overflow-hidden flex flex-col bg-white shadow-lg mb-10 mx-auto" style="page-break-after: always;">
            <div class="bg-[#d32f2f] text-white p-3 text-center shadow-sm no-print-bg">
                <h1 class="text-lg font-black uppercase tracking-tight">NIT - Nordeste Locações</h1>
                <p class="text-[10px] font-bold opacity-80 uppercase leading-none mt-1">${employee.employer_name || 'AR2 Serviços e Soluções Ltda'}</p>
            </div>

            <div class="content p-4 flex-1 flex flex-col">
                <div class="flex justify-end mb-2 text-right">
                    <div class="text-[8px] text-gray-400 font-bold uppercase tracking-widest leading-tight">
                        Código: <span class="text-gray-700">${docCode}</span><br>
                        Emissão: <span class="text-gray-700">${now.toLocaleDateString('pt-BR')}</span>
                    </div>
                </div>

                <h2 class="text-center text-base font-black text-gray-800 mb-3 uppercase tracking-tight border-b-2 border-gray-100 pb-2">
                    TERMO DE TROCA DE EQUIPAMENTO
                </h2>

                <!-- DADOS DO COLABORADOR -->
                <div class="bg-[#f9fafb] p-2 border-l-[3px] border-[#d32f2f] font-extrabold uppercase text-[9px] mt-2 mb-1">DADOS DO COLABORADOR</div>
                <div class="bg-blue-50/20 p-2 rounded space-y-0.5 border border-blue-50/50">
                    <div class="grid grid-cols-2 gap-2 text-[9px]">
                        <div><span class="font-extrabold text-gray-500">Nome:</span> <span class="font-bold text-gray-900 uppercase">${employee.name}</span></div>
                        <div><span class="font-extrabold text-gray-500">CPF/Matrícula:</span> <span class="font-bold text-gray-900 uppercase">${employee.registrationNumber}</span></div>
                        <div><span class="font-extrabold text-gray-500">Empresa:</span> <span class="font-bold text-gray-900 uppercase">${employee.employer_name || 'N/A'}</span></div>
                        <div><span class="font-extrabold text-gray-500">Unidade:</span> <span class="font-bold text-gray-900 uppercase">${employee.workplace_name || 'N/A'}</span></div>
                    </div>
                </div>

                <!-- EQUIPAMENTOS LADO A LADO -->
                <div class="grid grid-cols-2 gap-3 mt-3">
                    <!-- EQUIPAMENTO ANTERIOR -->
                    <div>
                        <div class="bg-[#f9fafb] p-2 border-l-[3px] border-red-500 font-extrabold uppercase text-[9px] mb-1">EQUIPAMENTO ANTERIOR (DEVOLVIDO)</div>
                        <div class="bg-red-50/20 p-2 rounded space-y-0.5 border border-red-50/50">
                            <div class="text-[9px]"><span class="font-extrabold text-gray-500">Patrimônio:</span> <span class="font-bold text-gray-900 uppercase">${oldItem.patrimonio}</span></div>
                            <div class="text-[9px]"><span class="font-extrabold text-gray-500">Tipo:</span> <span class="font-bold text-gray-900 uppercase">${oldItem.type}</span></div>
                            <div class="text-[9px]"><span class="font-extrabold text-gray-500">Marca/Modelo:</span> <span class="font-bold text-gray-900 uppercase">${oldItem.brand} ${oldItem.model}</span></div>
                            ${!isPhone ? `
                                <div class="text-[9px]"><span class="font-extrabold text-gray-500">Processador:</span> <span class="font-bold text-gray-900 uppercase">${oldItem.model || 'N/A'}</span></div>
                                <div class="text-[9px]"><span class="font-extrabold text-gray-500">RAM:</span> <span class="font-bold text-gray-900 uppercase">${oldItem.ram || 'N/A'}</span></div>
                                <div class="text-[9px]"><span class="font-extrabold text-gray-500">Armazenamento:</span> <span class="font-bold text-gray-900 uppercase">${oldItem.storage || 'N/A'}</span></div>
                            ` : `
                                <div class="text-[9px]"><span class="font-extrabold text-gray-500">Memória/Interno:</span> <span class="font-bold text-gray-900 uppercase">${oldItem.ram || 'N/A'} / ${oldItem.storage || 'N/A'}</span></div>
                                <div class="text-[9px]"><span class="font-extrabold text-gray-500">IMEI:</span> <span class="font-bold text-gray-900 uppercase">${oldItem.serial_number || 'N/A'}</span></div>
                            `}
                            <div class="text-[9px]"><span class="font-extrabold text-gray-500">Tier:</span> <span class="font-bold text-gray-900 uppercase">${oldItem.tier || 'T1'}</span></div>
                            <div class="text-[9px]"><span class="font-extrabold text-gray-500">Acessórios:</span> <span class="font-bold text-gray-900 uppercase">${oldItem.accessories || 'PADRÃO'}</span></div>
                        </div>
                    </div>

                    <!-- NOVO EQUIPAMENTO -->
                    <div>
                        <div class="bg-[#f9fafb] p-2 border-l-[3px] border-green-500 font-extrabold uppercase text-[9px] mb-1">NOVO EQUIPAMENTO (ENTREGUE)</div>
                        <div class="bg-green-50/20 p-2 rounded space-y-0.5 border border-green-50/50">
                            <div class="text-[9px]"><span class="font-extrabold text-gray-500">Patrimônio:</span> <span class="font-bold text-gray-900 uppercase">${newItem.patrimonio}</span></div>
                            <div class="text-[9px]"><span class="font-extrabold text-gray-500">Tipo:</span> <span class="font-bold text-gray-900 uppercase">${newItem.type}</span></div>
                            <div class="text-[9px]"><span class="font-extrabold text-gray-500">Marca/Modelo:</span> <span class="font-bold text-gray-900 uppercase">${newItem.brand} ${newItem.model}</span></div>
                            ${!isPhone ? `
                                <div class="text-[9px]"><span class="font-extrabold text-gray-500">Processador:</span> <span class="font-bold text-gray-900 uppercase">${newItem.model || 'N/A'}</span></div>
                                <div class="text-[9px]"><span class="font-extrabold text-gray-500">RAM:</span> <span class="font-bold text-gray-900 uppercase">${newItem.ram || 'N/A'}</span></div>
                                <div class="text-[9px]"><span class="font-extrabold text-gray-500">Armazenamento:</span> <span class="font-bold text-gray-900 uppercase">${newItem.storage || 'N/A'}</span></div>
                            ` : `
                                <div class="text-[9px]"><span class="font-extrabold text-gray-500">Memória/Interno:</span> <span class="font-bold text-gray-900 uppercase">${newItem.ram || 'N/A'} / ${newItem.storage || 'N/A'}</span></div>
                                <div class="text-[9px]"><span class="font-extrabold text-gray-500">IMEI:</span> <span class="font-bold text-gray-900 uppercase">${newItem.serial_number || 'N/A'}</span></div>
                            `}
                            <div class="text-[9px]"><span class="font-extrabold text-gray-500">Tier:</span> <span class="font-bold text-gray-900 uppercase">${newItem.tier || 'T1'}</span></div>
                            <div class="text-[9px]"><span class="font-extrabold text-gray-500">Acessórios:</span> <span class="font-bold text-gray-900 uppercase">${newItem.accessories || 'PADRÃO'}</span></div>
                        </div>
                    </div>
                </div>

                <!-- MOTIVO DA TROCA -->
                <div class="bg-[#f9fafb] p-2 border-l-[3px] border-[#d32f2f] font-extrabold uppercase text-[9px] mt-3 mb-1">MOTIVO DA TROCA</div>
                <div class="bg-yellow-50/20 p-2 rounded border border-yellow-50/50">
                    <p class="text-[9px] font-bold text-gray-800 uppercase">${reason}</p>
                    ${notes ? `<p class="text-[8px] text-gray-600 mt-1 italic">Observações: ${notes}</p>` : ''}
                </div>

                <!-- DECLARAÇÃO -->
                <div class="bg-[#f9fafb] p-2 border-l-[3px] border-[#d32f2f] font-extrabold uppercase text-[9px] mt-3 mb-1">DECLARAÇÃO</div>
                <div class="px-2 text-justify text-[8px] leading-tight">
                    <p class="mb-2">Declaro, para os devidos fins, que nesta data recebi da empresa <span class="font-bold">AR2 Serviços e Soluções Ltda</span>, inscrita no CNPJ nº <span class="font-bold">43.529.100/0001-12</span>, o novo equipamento acima descrito, em substituição ao equipamento anterior devolvido.</p>
                    <p class="mb-2">Declaro ainda que o novo equipamento foi recebido em perfeito estado de funcionamento, juntamente com todos os seus acessórios vinculados, assumindo desde já a responsabilidade por sua guarda, uso e conservação.</p>
                    <p>Com a efetivação desta troca, declaro estar ciente de minha responsabilidade sobre o novo equipamento e que o equipamento anterior foi devidamente devolvido à empresa.</p>
                </div>

                <!-- LOG DE RASTREABILIDADE PATRIMONIAL -->
                <div class="bg-[#f9fafb] p-2 border-l-[3px] border-[#d32f2f] font-extrabold uppercase text-[9px] mt-3 mb-1">LOG DE RASTREABILIDADE PATRIMONIAL</div>
                <div class="bg-gray-50/20 p-2 rounded border border-gray-50/50">
                    <table class="w-full text-[7px]">
                        <thead>
                            <tr class="border-b border-gray-300">
                                <th class="text-left py-1 font-bold text-gray-700">Data/Hora</th>
                                <th class="text-left py-1 font-bold text-gray-700">Ação</th>
                                <th class="text-left py-1 font-bold text-gray-700">Ferramenta / Descrição</th>
                                <th class="text-left py-1 font-bold text-gray-700">Observação</th>
                                <th class="text-left py-1 font-bold text-gray-700">Responsável</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${relevantHistory.length > 0 ? relevantHistory.map(h => `
                                <tr class="border-b border-gray-200">
                                    <td class="py-1 text-gray-600">${formatarDataHoraBR(h.data_hora)}</td>
                                    <td class="py-1">
                                        <span class="px-1 py-0.5 rounded text-[6px] font-bold uppercase ${
                                            h.action === 'ENTREGA' ? 'bg-blue-50 text-blue-600' : 
                                            h.action === 'DEVOLUCAO' ? 'bg-red-50 text-red-600' : 
                                            'bg-yellow-50 text-yellow-600'
                                        }">${h.action}</span>
                                    </td>
                                    <td class="py-1 text-gray-800 font-bold uppercase">${h.observation || 'Movimentação'}</td>
                                    <td class="py-1 text-gray-600">${h.status_item || '-'}</td>
                                    <td class="py-1 text-blue-600 uppercase font-bold">${h.responsavel || 'Sistema'}</td>
                                </tr>
                            `).join('') : `
                                <tr>
                                    <td colspan="5" class="py-2 text-center text-gray-400 italic text-[7px]">
                                        Nenhuma movimentação recente encontrada
                                    </td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>

                <!-- ASSINATURAS -->
                <div class="bg-[#f9fafb] p-2 border-l-[3px] border-[#d32f2f] font-extrabold uppercase text-[9px] mt-3 mb-2">ASSINATURAS</div>
                <div class="grid grid-cols-2 gap-4 px-2 mt-2">
                    <div class="text-center">
                        <p class="text-[9px] font-bold text-gray-700 mb-1">Assinatura do Colaborador</p>
                        <div class="border-t-2 border-gray-800 pt-1 mb-1">
                            <div class="h-4 mb-1"></div>
                            <p class="text-[7px] text-gray-600">Nome: ${employee.name}</p>
                            <p class="text-[7px] text-gray-600">CPF: ${employee.registrationNumber}</p>
                        </div>
                    </div>
                    <div class="text-center">
                        <p class="text-[9px] font-bold text-gray-700 mb-1">Responsável pela Troca</p>
                        <div class="border-t-2 border-gray-800 pt-1">
                            <div class="h-4 mb-1"></div>
                            <p class="text-[7px] text-gray-600">Nome: ________________________________</p>
                            <p class="text-[7px] text-gray-600">Cargo: ________________________________</p>
                        </div>
                    </div>
                </div>

                <div class="mt-2 flex justify-between items-end opacity-20 grayscale grayscale-100">
                    <p class="text-[6px] font-black text-gray-400 uppercase italic">Documento Confidencial | NIT - Nordeste Locações</p>
                    <span class="text-[6px] font-black text-red-600">COD: ${docCode}</span>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
}

// Gerar Termo de Troca Manual
window.generateSwapTermo = (itemId) => {
    if (!currentEmployeeData) return alert('Selecione um colaborador primeiro.');
    
    const item = currentItems.find(i => i.id === itemId);
    if (!item) return alert('Item não encontrado.');
    
    const modal = document.getElementById('pro-modal-container');
    const content = document.getElementById('pro-modal-content');
    
    content.innerHTML = `
        <div class="bg-green-600 p-8 text-white"><h3 class="text-xl font-black uppercase italic">Termo de Troca Manual</h3></div>
        <div class="p-10 space-y-6">
            <div class="bg-green-50 p-4 rounded-xl border border-green-100 mb-4">
                <p class="text-[9px] font-black uppercase text-green-400 mb-2">Equipamento Atual:</p>
                <div class="text-[11px] font-black uppercase text-gray-800">
                    <p><strong>Patrimônio:</strong> ${item.patrimonio}</p>
                    <p><strong>Tipo:</strong> ${item.type}</p>
                    <p><strong>Modelo:</strong> ${item.model || 'N/A'}</p>
                    <p><strong>RAM:</strong> ${item.ram || 'N/A'}</p>
                    <p><strong>Armazenamento:</strong> ${item.storage || 'N/A'}</p>
                </div>
            </div>

            <form id="swap-termo-form" class="space-y-4">
                <h4 class="text-[10px] font-black uppercase text-gray-400 border-b pb-2 italic">Dados da Troca</h4>
                
                <div class="grid grid-cols-2 gap-4">
                    <div><label for="old-pat" class="pro-label">Patrimônio Antigo</label><input id="old-pat" class="pro-input font-bold uppercase" value="${item.patrimonio}" readonly></div>
                    <div><label for="new-pat" class="pro-label">Patrimônio Novo</label><input id="new-pat" class="pro-input font-bold uppercase" placeholder="PC..." required></div>
                </div>
                
                <div class="grid grid-cols-3 gap-4">
                    <div><label for="old-storage" class="pro-label">Armazenamento</label><input id="old-storage" class="pro-input uppercase" value="${item.storage || ''}" placeholder="SSD 256GB"></div>
                    <div><label for="old-ram" class="pro-label">Memória RAM</label><input id="old-ram" class="pro-input uppercase" value="${item.ram || ''}" placeholder="8GB"></div>
                    <div><label for="old-tier" class="pro-label">Tier</label><select id="old-tier" class="pro-input">
                        <option value="T1" ${item.tier === 'T1' ? 'selected' : ''}>T1 - Básico / ADM</option>
                        <option value="T2" ${item.tier === 'T2' ? 'selected' : ''}>T2 - Multi-Sítio</option>
                        <option value="T3" ${item.tier === 'T3' ? 'selected' : ''}>T3 - Alto Desempenho</option>
                    </select></div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div><label for="old-date" class="pro-label">Data da Troca</label><input id="old-date" type="date" class="pro-input" value="${new Date().toISOString().split('T')[0]}" required></div>
                    <div><label for="old-reason" class="pro-label">Motivo da Troca</label><select id="old-reason" class="pro-input">
                        <option>Upgrade de Desempenho</option>
                        <option>Defeito no Equipamento</option>
                        <option>Padronização de Setor</option>
                        <option>Obsolescência</option>
                        <option>Danos Físicos</option>
                        <option>Outros</option>
                    </select></div>
                </div>
                
                <div><label for="old-obs" class="pro-label">Observações Adicionais</label><textarea id="old-obs" class="pro-input" rows="3" placeholder="Detalhes da troca..."></textarea></div>
                
                <div class="flex gap-4 pt-6">
                    <button type="button" onclick="window.closeProModal()" class="flex-1 text-[10px] font-black uppercase text-gray-400">Cancelar</button>
                    <button type="submit" class="flex-[2] bg-green-600 text-white py-4 rounded-2xl font-black uppercase shadow-xl">Gerar Termo de Troca</button>
                </div>
            </form>
        </div>
    `;

    document.getElementById('swap-termo-form').onsubmit = async (e) => {
        e.preventDefault();
        
        const newPatrimonio = document.getElementById('new-pat').value;
        let newItemData = {
            patrimonio: newPatrimonio,
            type: item.type,
            model: newPatrimonio // Se não tiver no banco, usa o patrimônio como modelo
        };
        
        // Buscar dados do novo equipamento no banco
        try {
            const response = await fetch(`/api/tools/patrimonio/${newPatrimonio}`);
            if (response.ok) {
                const data = await response.json();
                newItemData = {
                    patrimonio: data.patrimonio,
                    type: data.type || item.type,
                    model: data.model || newPatrimonio,
                    ram: data.ram || 'N/A',
                    storage: data.storage || 'N/A',
                    tier: data.tier || 'T1'
                };
            } else {
                // Se não encontrar no banco, oferece opção para cadastrar
                const shouldRegister = confirm(`Equipamento ${newPatrimonio} não encontrado no banco.\n\nDeseja cadastrá-lo agora?`);
                if (shouldRegister) {
                    newItemData = {
                        patrimonio: newPatrimonio,
                        type: item.type,
                        model: newPatrimonio,
                        ram: '8GB', // Valor padrão
                        storage: 'SSD 256GB', // Valor padrão
                        tier: 'T1' // Valor padrão
                    };
                    
                    // Cadastrar novo equipamento
                    const registerResponse = await fetch('/api/tools', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ...newItemData,
                            employeeId: currentEmployeeData.id,
                            status: 'Em uso',
                            date_given: new Date().toISOString().split('T')[0],
                            responsible: (typeof Auth !== 'undefined') ? Auth.getUser()?.name : 'Admin'
                        })
                    });
                    
                    if (!registerResponse.ok) {
                        alert('Erro ao cadastrar equipamento: ' + (await registerResponse.text()));
                        return;
                    }
                }
            }
        } catch (error) {
            console.error('Erro ao buscar equipamento:', error);
            alert('Erro ao consultar dados do equipamento. Usando dados padrão.');
        }
        
        const swapData = {
            oldItem: {
                patrimonio: document.getElementById('old-pat').value,
                type: item.type,
                model: item.model,
                ram: document.getElementById('old-ram').value,
                storage: document.getElementById('old-storage').value,
                tier: document.getElementById('old-tier').value
            },
            newItem: newItemData,
            swapDate: document.getElementById('old-date').value,
            reason: document.getElementById('old-reason').value,
            observation: document.getElementById('old-obs').value,
            employee: currentEmployeeData
        };
        
        await window.generateSwapDocument(swapData);
    };

    modal.classList.remove('hidden');
};

// Gerar documento de troca
window.generateSwapDocument = async (swapData) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR').replace(/\//g, '');
    const docCode = `TROCA-${dateStr}-${swapData.oldItem.patrimonio.substring(2,6)}`;
    
    const templateData = {
        empresa_nome: swapData.employee.employer_name || 'AR2 Serviços e Soluções Ltda',
        empresa_cnpj: '43.529.100/0001-12',
        empresa_endereco: 'Avenida Antônio Sales, nº 1317, sala 604, Joaquim Távora, Fortaleza/CE',
        empresa_unidade: swapData.employee.workplace_name || 'Matriz',
        cidade: 'Fortaleza/CE',
        codigo_documento: docCode,
        data_emissao: swapData.swapDate || now.toLocaleDateString('pt-BR'),
        colaborador_nome: swapData.employee.name,
        colaborador_cpf: swapData.employee.registrationNumber,
        colaborador_unidade: swapData.employee.workplace_name || 'N/A',
        colaborador_empresa: swapData.employee.employer_name || 'AR2 Serviços e Soluções Ltda',
        
        // Equipamento Antigo
        old_patrimonio: swapData.oldItem.patrimonio,
        old_tipo: swapData.oldItem.type,
        old_modelo: swapData.oldItem.model,
        old_memoria: swapData.oldItem.ram,
        old_armazenamento: swapData.oldItem.storage,
        old_tier: swapData.oldItem.tier,
        
        // Equipamento Novo
        new_patrimonio: swapData.newItem.patrimonio,
        new_tipo: swapData.newItem.type,
        new_modelo: swapData.newItem.model,
        
        // Dados da Troca
        motivo_troca: swapData.reason,
        observacoes: swapData.observation || 'Nenhuma observação adicional.',
        responsavel_nome: '________________________',
        responsavel_cargo: '________________________'
    };
    
    // Carregar template de troca
    const templatePath = '/templates/termo-troca.html';
    const templateResult = await window.loadAndProcessTemplate(templatePath, templateData);
    
    if (templateResult) {
        const { styles, bodyContent } = templateResult;
        
        const html = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>Termo de Troca - ${swapData.employee.name}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
                ${styles}
                @media print {
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; background: white; }
                    @page { margin: 0; size: A4; }
                    .page { box-shadow: none; margin: 0; border: none; page-break-after: always; }
                    .no-print { display: none; }
                }
                body { font-family: 'Segoe UI', Arial, sans-serif; background: #525659; display: flex; flex-direction: column; align-items: center; padding: 40px 0; }
                .page { transition: all 0.3s ease; width: 210mm; min-height: 297mm; background: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 20px; }
                @media screen {
                    .page:hover { transform: scale(1.02); }
                }
            </style>
        </head>
        <body onload="setTimeout(() => window.print(), 800)">
            <div class="page" style="page-break-after: always; margin-bottom: 40px;">${bodyContent}</div>
        </body>
        </html>
        `;
        
        const win = window.open('', '_blank');
        win.document.write(html);
        win.document.close();
        
        window.closeProModal();
    }
};

// --- GESTÃO GLOBAL ---
let globalViewActive = false;

window.toggleGlobalView = () => {
    globalViewActive = !globalViewActive;
    const body = document.body;
    const gView = document.getElementById('global-view');
    const iMain = document.getElementById('individual-main');
    
    if (globalViewActive) {
        gView.classList.remove('hidden-pro');
        iMain.classList.add('hidden-pro');
        loadGlobalStats();
    } else {
        gView.classList.add('hidden-pro');
        iMain.classList.remove('hidden-pro');
    }
};

window.setGlobalSubTab = (tab) => {
    const tabs = ['dashboard', 'form', 'inventory'];
    tabs.forEach(t => {
        document.getElementById(`g-subtab-${t}`).classList.add('hidden-pro');
        document.getElementById(`btn-g-${t}`).classList.remove('active');
    });
    
    document.getElementById(`g-subtab-${tab}`).classList.remove('hidden-pro');
    document.getElementById(`btn-g-${tab}`).classList.add('active');
    
    if (tab === 'inventory') renderGlobalInventory();
    if (tab === 'dashboard') loadGlobalStats();
    if (tab === 'form') window.initCadernoForm();

    // Fecha menu mobile após trocar aba
    const nav = document.getElementById('global-sidebar-nav');
    if (nav) nav.classList.add('collapsed');
};

window.toggleMobileGlobalMenu = () => {
    const nav = document.getElementById('global-sidebar-nav');
    if (nav) nav.classList.toggle('collapsed');
};

window.initCadernoForm = async () => {
    // Carregar unidades dinâmicas
    const unitsSet = new Set(['ESTOQUE']);
    employees.forEach(e => { if (e.workplace_name) unitsSet.add(e.workplace_name); });
    const unitSelect = document.getElementById('pc-unid');
    if (unitSelect) {
        unitSelect.innerHTML = Array.from(unitsSet).map(u => `<option>${u.toUpperCase()}</option>`).join('');
    }

    // Carregar acessórios bonitos
    const accList = ['CARREGADOR', 'MOUSE SEM FIO', 'MOUSE PAD', 'TELA EXTRA', 'CABO HDMI', 'MOCHILA'];
    const accGrid = document.getElementById('acc-grid');
    if (accGrid) {
        accGrid.innerHTML = accList.map(item => `
            <label class="cursor-pointer group">
                <input type="checkbox" name="pc-acc-chip" value="${item}" class="hidden peer">
                <div class="px-4 py-3 border border-gray-100 rounded-2xl text-[9px] font-black uppercase transition-all peer-checked:bg-nordeste-black peer-checked:text-white group-hover:bg-gray-50 flex items-center justify-center text-center h-full shadow-sm hover:shadow-md">
                    ${item}
                </div>
            </label>
        `).join('');
    }

    // Atualizar cache de inventário para o patrimônio
    try {
        const res = await fetch('/api/tools/all');
        globalInventoryCache = await res.json();
    } catch (e) { console.error(e); }

    window.generatePatrimonio();
    window.updateFormPreview();
};

window.makeAllAvailable = async () => {
    if (!confirm('Isso irá remover o vínculo de TODOS os ativos com os colaboradores e colocá-los de volta no estoque. Deseja continuar?')) return;
    
    try {
        const res = await fetch('/api/tools/make-all-available', { 
            method: 'POST', 
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ responsible: (typeof Auth !== 'undefined') ? Auth.getUser()?.name : 'Admin' })
        });
        if (res.ok) {
            alert('Inventário resetado com sucesso.');
            loadGlobalStats();
            if (globalViewActive) renderGlobalInventory();
        }
    } catch (e) {
        console.error(e);
        alert('Erro ao resetar inventário.');
    }
};

async function loadGlobalStats() {
    try {
        // Executar migração de unit dos ativos existentes (sem dependência)
        try {
            await fetch('/api/tools/migrate-unit', { method: 'POST' });
        } catch(e) { console.warn('Migração não executada:', e); }

        const res = await fetch('/api/tools/stats');
        const stats = await res.json();
        
        document.getElementById('stat-total-tools').innerText = stats.total;
        document.getElementById('stat-colab-count').innerText = stats.employeeCount;
        document.getElementById('stat-status-aloc').innerText = stats.alocados;
        document.getElementById('stat-status-disp').innerText = stats.disponiveis;
        
        const perc = stats.total > 0 ? Math.round((stats.alocados / stats.total) * 100) : 0;
        document.getElementById('stat-aloc-perc').innerText = `${perc}%`;

        // Ativos por Unidade
        const unitContainer = document.getElementById('unit-distribution-rows');
        if (unitContainer) {
            unitContainer.innerHTML = stats.byUnit.map(u => `
                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <span class="text-[9px] font-black text-gray-400 uppercase">${u.unit}</span>
                        <span class="text-[10px] font-black text-gray-800 bg-gray-100 px-2 py-0.5 rounded-full">${u.count}</span>
                    </div>
                    <div class="bg-gray-100 h-3 rounded-full overflow-hidden">
                        <div class="bg-gradient-to-r from-red-600 to-red-400 h-full rounded-full transition-all duration-500" style="width: ${(u.count/stats.total)*100}%"></div>
                    </div>
                </div>
            `).join('');
        }
        
    } catch (e) {
        console.error("Erro ao carregar stats globais:", e);
    }
}

let toolsData = []; // Cache para filtros globais

async function renderGlobalInventory() {
    try {
        const res = await fetch('/api/tools/all');
        toolsData = await res.json();
        window.applyGlobalFilters();
        extractFormSuggestions(); // Extrai dados para os comboboxes customizados
    } catch (e) {
        console.error("Erro ao carregar inventário global:", e);
    }
}

let suggestionsCache = { cpus: [], storage: [], rams: [], brands: [], models: [] };

function extractFormSuggestions() {
    const cpus = new Set();
    const storages = new Set();
    const rams = new Set();
    const brands = new Set();
    const models = new Set();

    toolsData.forEach(t => {
        // Extração de CPU e Modelo (padrão 'Processador... / Modelo...')
        if (t.model && t.model.includes('Intel Core')) {
            const cpuPart = t.model.split('Intel Core')[1]?.split('/')[0]?.trim();
            if (cpuPart) cpus.add(cpuPart.toUpperCase());
            
            const modelPart = t.model.split('/')[1]?.trim();
            if (modelPart) models.add(modelPart.toUpperCase());
        } else if (t.model && t.model.trim()) {
            models.add(t.model.trim().toUpperCase());
        }

        if (t.brand && t.brand.trim()) brands.add(t.brand.trim().toUpperCase());
        if (t.storage && t.storage.trim()) storages.add(t.storage.trim().toUpperCase());
        if (t.ram) {
            const num = t.ram.toString().replace('GB', '').trim();
            if (num && num !== 'undefined' && num !== 'null') rams.add(num.toUpperCase());
        }
    });

    suggestionsCache.cpus = Array.from(cpus).sort();
    suggestionsCache.storage = Array.from(storages).sort();
    suggestionsCache.rams = Array.from(rams).sort((a,b) => parseInt(a)-parseInt(b));
    // Cache de marcas e modelos mantido para o inventário geral se necessário, mas não usado no form simplificado
    suggestionsCache.brands = Array.from(brands).sort();
    suggestionsCache.models = Array.from(models).sort();
}

window.searchFormBrands = () => {
    const el = document.getElementById('pc-brand');
    const results = document.getElementById('pc-brand-results');
    if (!el || !results) return;
    const search = el.value.toLowerCase();
    const filtered = suggestionsCache.brands.filter(v => v.toLowerCase().includes(search));
    renderFormSuggestions(results, filtered, 'pc-brand');
};

window.searchFormModels = () => {
    const el = document.getElementById('pc-model');
    const results = document.getElementById('pc-model-results');
    if (!el || !results) return;
    const search = el.value.toLowerCase();
    const filtered = suggestionsCache.models.filter(v => v.toLowerCase().includes(search));
    renderFormSuggestions(results, filtered, 'pc-model');
};

// Lógica de busca customizada (Comboboxes)
window.searchFormCpus = () => {
    const search = document.getElementById('pc-cpu').value.toLowerCase();
    const results = document.getElementById('pc-cpu-results');
    const filtered = suggestionsCache.cpus.filter(v => v.toLowerCase().includes(search));
    renderFormSuggestions(results, filtered, 'pc-cpu');
};

window.searchFormStorage = () => {
    const search = document.getElementById('pc-storage').value.toLowerCase();
    const results = document.getElementById('pc-storage-results');
    const filtered = suggestionsCache.storage.filter(v => v.toLowerCase().includes(search));
    renderFormSuggestions(results, filtered, 'pc-storage');
};

window.searchFormRam = () => {
    const search = document.getElementById('pc-ram').value.toLowerCase();
    const results = document.getElementById('pc-ram-results');
    const filtered = suggestionsCache.rams.filter(v => v.toString().includes(search));
    renderFormSuggestions(results, filtered, 'pc-ram');
};

function renderFormSuggestions(container, list, inputId) {
    if (list.length === 0) { container.classList.add('hidden-pro'); return; }
    container.classList.remove('hidden-pro');
    container.innerHTML = list.map(v => `
        <div class="px-3 py-2 hover:bg-red-50 cursor-pointer flex justify-between items-center border-b last:border-0 transition-colors" 
             onclick="document.getElementById('${inputId}').value='${v}'; this.parentElement.classList.add('hidden-pro')">
            <span class="uppercase font-bold">${v}</span>
            <span class="text-[8px] text-gray-400 font-black">SELECIONAR</span>
        </div>
    `).join('');
}

// Fechar dropdowns ao clicar fora
document.addEventListener('click', (e) => {
    const closeDropdown = (inputId, resultsId) => {
        const input = document.getElementById(inputId);
        const results = document.getElementById(resultsId);
        if (input && results && !e.target.closest(`#${inputId}`) && !e.target.closest(`#${resultsId}`)) {
            results.classList.add('hidden-pro');
        }
    };

    closeDropdown('pc-cpu', 'pc-cpu-results');
    closeDropdown('pc-brand', 'pc-brand-results');
    closeDropdown('pc-model', 'pc-model-results');
    closeDropdown('pc-storage', 'pc-storage-results');
    closeDropdown('pc-ram', 'pc-ram-results');
});

window.applyGlobalFilters = () => {
    const searchPat = document.getElementById('g-search-pat').value.toLowerCase();
    const filterStatus = document.getElementById('g-filter-status').value;
    const filterTier = document.getElementById('g-filter-tier').value;
    const filterUnid = document.getElementById('g-filter-unid').value;
    const filterType = document.getElementById('g-filter-type').value;
    const filterChip = document.getElementById('g-filter-chip').value;

    const filtered = toolsData.filter(t => {
        const matchPat = t.patrimonio.toLowerCase().includes(searchPat);
        const matchStatus = !filterStatus || (filterStatus === 'estoque' ? !t.employee_id : t.employee_id);
        const matchTier = !filterTier || (t.patrimonio && t.patrimonio.includes(filterTier)) || (t.tier === filterTier);
        const matchUnid = !filterUnid || (t.unit && t.unit.toUpperCase() === filterUnid.toUpperCase());
        const matchType = !filterType || t.type === filterType;
        
        let matchChip = true;
        if (filterChip === 'com_linha') matchChip = t.accessories && t.accessories.toUpperCase().includes('CHIP:');
        if (filterChip === 'sem_linha') matchChip = (t.type === 'Smartphone' || t.type === 'SIM Card') && (!t.accessories || !t.accessories.toUpperCase().includes('CHIP:'));
        
        return matchPat && matchStatus && matchTier && matchUnid && matchType && matchChip;
    });

    const container = document.getElementById('global-inventory-rows');
    const mobileContainer = document.getElementById('inventory-cards-mobile');

    const tableHTML = filtered.map(t => {
        const isPhone = t.type === 'Smartphone';
        return `
        <tr class="hover:bg-gray-50/50 transition-colors">
            <td class="font-black text-[10px] text-blue-700 font-mono">${t.patrimonio}</td>
            <td class="text-[10px] uppercase font-bold text-gray-800">
                <div class="flex flex-col leading-tight">
                    <span class="text-[10px] font-black">${t.model || 'ATIVO NIT'}</span>
                    <span class="text-[8px] text-gray-400">${isPhone ? (t.brand || 'MOBILE') : ('Core ' + (t.cpu || '-'))}</span>
                </div>
            </td>
            <td><span class="px-3 py-1 bg-gray-100 rounded-full text-[9px] font-black text-gray-400 uppercase leading-none">${t.tier || 'T1'}</span></td>
            <td>
                <div class="flex flex-col leading-tight">
                    <span class="text-[10px] font-bold text-slate-500 uppercase leading-none whitespace-nowrap">${t.ram || '8GB'} ${isPhone ? '/ ' + (t.storage || '-') : '[' + (t.slots || '1/2') + ']'}</span>
                    ${isPhone ? `<span class="text-[7px] text-gray-400 uppercase font-bold">IMEI: ${t.serial_number || '-'}</span>` : ''}
                </div>
            </td>
            <td>
                <span class="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase italic border border-blue-100/50 whitespace-nowrap">
                   📍 ${t.unit || '-'}
                </span>
            </td>
            <td class="text-[10px] font-black uppercase text-gray-700 truncate max-w-[120px]">
                <div class="flex flex-col leading-tight">
                    <span>${t.employee_name || 'Disponível'}</span>
                    ${isPhone && t.accessories && t.accessories.includes('CHIP:') ? 
                        `<span class="text-[7px] text-green-600 font-bold italic">${t.accessories.split('CHIP:')[1]}</span>` : ''}
                </div>
            </td>
            <td class="text-[9px] font-bold text-gray-400 uppercase leading-tight">${t.employer_name || '-'}</td>
            <td class="text-[9px] font-bold text-gray-400 uppercase leading-tight">${t.workplace_name || '-'}</td>
            <td>
                <span class="px-3 py-1 rounded-full text-[9px] font-black uppercase ${t.employee_id ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}">
                    ${t.employee_id ? 'Alocado' : 'Estoque'}
                </span>
            </td>
            <td class="text-right">
                <div class="flex gap-2 justify-end">
                    ${!t.employee_id ? `
                        <button onclick="window.openAllocationModal('${t.id}', '${t.patrimonio}')" class="bg-blue-600 text-white px-3 py-2 rounded-xl text-[8px] font-black uppercase hover:bg-black transition-all shadow-sm">Alocar</button>
                    ` : ''}
                    <button onclick="window.editTool('${t.id}')" title="Editar" class="p-2 hover:bg-gray-100 rounded-xl transition-all">✏️</button>
                    ${t.employee_id ? `
                        <button onclick="window.printTermo('${t.id}')" title="Gerar Termo" class="p-2 hover:bg-blue-50 text-blue-600 rounded-xl transition-all">📄</button>
                    ` : ''}
                    <button onclick="window.deleteTool('${t.id}')" title="Excluir" class="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-all">🗑️</button>
                </div>
            </td>
        </tr>
    `}).join('');

    const cardsHTML = filtered.map(t => {
        const isPhone = t.type === 'Smartphone';
        return `
        <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div class="flex justify-between items-start">
                <div class="flex flex-col">
                    <span class="text-[11px] font-black text-blue-700 font-mono">${t.patrimonio}</span>
                    <span class="text-[11px] font-black uppercase text-gray-800 leading-tight">${t.model || 'NIT Notebook'}</span>
                    ${isPhone ? `<span class="text-[8px] text-blue-600 font-bold uppercase">IMEI: ${t.serial_number}</span>` : ''}
                </div>
                <span class="px-3 py-1 rounded-full text-[8px] font-black uppercase ${t.employee_id ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}">
                    ${t.employee_id ? 'Alocado' : 'Estoque'}
                </span>
            </div>
            <div class="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                <div class="flex flex-col">
                    <span class="text-[8px] font-black text-gray-400 uppercase mb-1">${isPhone ? 'Smartphone' : 'Configuração'}</span>
                    <span class="text-[10px] font-bold text-gray-700">${t.ram || '8GB'} • ${isPhone ? (t.storage || '-') : (t.tier || 'T1')}</span>
                </div>
                <div class="flex flex-col text-right">
                    <span class="text-[8px] font-black text-gray-400 uppercase mb-1">Localização Física</span>
                    <span class="text-[10px] font-black text-blue-600 uppercase italic">📍 ${t.unit || '-'}</span>
                </div>
            </div>
            ${t.employee_id ? `
            <div class="p-3 bg-gray-50 rounded-xl border border-gray-200/50">
                <span class="text-[8px] font-black text-gray-400 uppercase block mb-1">Alocado para:</span>
                <p class="text-[10px] font-black text-gray-800 uppercase leading-tight">${t.employee_name}</p>
                ${isPhone && t.accessories && t.accessories.includes('CHIP:') ? 
                    `<p class="text-[8px] text-green-600 font-bold mt-1">📞 ${t.accessories.split('CHIP:')[1]}</p>` : ''}
            </div>
            ` : `
            <button onclick="window.openAllocationModal('${t.id}', '${t.patrimonio}')" class="w-full bg-blue-600 text-white py-4 rounded-xl text-[10px] font-black uppercase hover:bg-black transition-all shadow-lg flex items-center justify-center gap-2">
                <span>📦</span> Alocar Agora
            </button>
            `}
            <div class="flex gap-2 pt-1">
                <button onclick="window.editTool('${t.id}')" class="flex-1 py-3 bg-nordeste-gray text-[9px] font-black uppercase text-gray-500 rounded-xl shadow-sm">Detalhes</button>
                <button onclick="window.deleteTool('${t.id}')" class="px-4 bg-red-50 text-red-500 rounded-xl border border-red-100">🗑️</button>
            </div>
        </div>
    `}).join('');

    if (container) container.innerHTML = tableHTML;
    if (mobileContainer) mobileContainer.innerHTML = cardsHTML;
};

window.openAllocationModal = (toolId, pat) => {
    const modal = document.getElementById('pro-modal-container');
    const content = document.getElementById('pro-modal-content');
    
    // Filtramos apenas ativos inicialmente
    const activeEmployees = employees.filter(e => e.type !== 'Desligado');
    
    content.innerHTML = `
        <div class="bg-gray-900 p-8 text-white flex justify-between items-center">
            <h3 class="text-xl font-black uppercase italic leading-none">Alocação de Equipamento</h3>
            <button onclick="window.closeProModal()" class="text-gray-400 hover:text-white">✕</button>
        </div>
        <div class="p-10 space-y-6">
            <div class="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center justify-between">
                <div>
                   <p class="text-[9px] font-black uppercase text-blue-400">Equipamento:</p>
                   <p class="text-[11px] font-black uppercase text-gray-800">${pat}</p>
                </div>
                <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                    <svg class="w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                </div>
            </div>

            <div class="space-y-4">
                <div>
                    <label class="pro-label">Pesquisar Colaborador</label>
                    <div class="relative">
                        <input type="text" id="alloc-search" class="pro-input pl-10" placeholder="Nome, matrícula ou setor..." oninput="window.filterAllocationEmployees()">
                        <svg class="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    </div>
                </div>

                <div class="space-y-2 max-h-60 overflow-y-auto custom-scroll border rounded-2xl p-2 bg-gray-50/50" id="alloc-list">
                    ${activeEmployees.map(e => `
                        <div class="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group" onclick="window.selectForAllocation('${e.id}', '${e.name}')">
                            <img src="${e.photoUrl || 'https://ui-avatars.com/api/?name='+encodeURIComponent(e.name)}" class="w-8 h-8 rounded-lg object-cover">
                            <div class="flex-1">
                                <p class="text-[10px] font-black uppercase text-gray-800">${e.name}</p>
                                <p class="text-[8px] font-bold text-gray-400 uppercase">${e.sector || 'Sem Setor'}</p>
                            </div>
                            <div class="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white text-transparent transition-all">✓</div>
                        </div>
                    `).join('')}
                </div>

                <input type="hidden" id="a-employee-id">
            </div>

            <div id="selection-confirm" class="hidden-pro animate-fade bg-green-50 p-4 rounded-xl border border-green-100 flex items-center justify-between">
                <div>
                    <p class="text-[8px] font-black text-green-600 uppercase">Selecionado:</p>
                    <p class="text-[10px] font-black text-gray-800 uppercase italic" id="selected-emp-name">...</p>
                </div>
                <button onclick="document.getElementById('selection-confirm').classList.add('hidden-pro'); document.getElementById('a-employee-id').value='';" class="text-[8px] font-black uppercase text-red-500">Alterar</button>
            </div>

            <form id="allocation-form" class="space-y-6">
                <div class="space-y-3 pt-4 border-t border-gray-100">
                    <label class="pro-label text-blue-600">Acessórios Inclusos (Obrigatório)*</label>
                    <div class="flex flex-wrap gap-2">
                        ${['CARREGADOR', 'MOUSE SEM FIO', 'MOUSE PAD', 'TELA EXTRA', 'CABO HDMI', 'MOCHILA'].map(item => `
                            <label class="cursor-pointer group">
                                <input type="checkbox" name="alloc-acc-chip" value="${item}" class="hidden peer">
                                <div class="px-4 py-2 border-2 border-gray-100 rounded-xl text-[9px] font-black uppercase transition-all peer-checked:bg-blue-600 peer-checked:border-blue-600 peer-checked:text-white group-hover:border-blue-200">
                                    ${item}
                                </div>
                            </label>
                        `).join('')}
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div><label class="pro-label">Data da Entrega</label><input type="date" id="a-date" class="pro-input" value="${new Date().toISOString().split('T')[0]}" required></div>
                </div>
                
                <div class="flex gap-4 pt-6">
                    <button type="button" onclick="window.closeProModal()" class="flex-1 text-[10px] font-black uppercase text-gray-400">Cancelar</button>
                    <button type="submit" class="flex-[2] bg-gray-900 text-white py-4 rounded-2xl font-black uppercase shadow-xl hover:bg-black transition-all">Confirmar Alocação</button>
                </div>
            </form>
        </div>
    `;

    document.getElementById('allocation-form').onsubmit = async (e) => {
        e.preventDefault();
        const employeeId = document.getElementById('a-employee-id').value;
        if (!employeeId) return alert('Por favor, selecione um colaborador na lista.');

        // Coletar acessórios dos chips
        const selectedAcc = Array.from(document.querySelectorAll('input[name="alloc-acc-chip"]:checked')).map(cb => cb.value);
        if (selectedAcc.length === 0) return alert('Por favor, selecione ao menos um acessório (ex: CARREGADOR).');

        const payload = {
            toolId,
            employeeId,
            date_given: document.getElementById('a-date').value,
            accessories: selectedAcc.join(', '),
            responsible: (typeof Auth !== 'undefined') ? Auth.getUser()?.name : 'Admin'
        };

        try {
            const res = await fetch('/api/tools/allocate', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) });
            if (res.ok) { 
                window.closeProModal(); 
                loadGlobalStats();
                renderGlobalInventory();
            } else {
                const data = await res.json();
                alert('Erro: ' + (data.error || 'Nesta versão a rota de alocação falhou.') + '\nTente reiniciar o servidor.');
            }
        } catch (e) {
            alert('Falha na comunicação com o servidor. Verifique se o sistema está rodando.');
        }
    };

    modal.classList.remove('hidden');
};

window.filterAllocationEmployees = () => {
    const search = document.getElementById('alloc-search').value.toLowerCase();
    const container = document.getElementById('alloc-list');
    const activeEmployees = employees.filter(e => e.type !== 'Desligado');
    
    const filtered = activeEmployees.filter(e => 
        e.name.toLowerCase().includes(search) || 
        (e.sector && e.sector.toLowerCase().includes(search)) ||
        (e.registrationNumber && e.registrationNumber.includes(search))
    );
    
    container.innerHTML = filtered.map(e => `
        <div class="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group" onclick="window.selectForAllocation('${e.id}', '${e.name}')">
            <img src="${e.photoUrl || 'https://ui-avatars.com/api/?name='+encodeURIComponent(e.name)}" class="w-8 h-8 rounded-lg object-cover">
            <div class="flex-1">
                <p class="text-[10px] font-black uppercase text-gray-800">${e.name}</p>
                <p class="text-[8px] font-bold text-gray-400 uppercase">${e.sector || 'Sem Setor'}</p>
            </div>
            <div class="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white text-transparent transition-all">✓</div>
        </div>
    `).join('') || `<p class="p-4 text-center text-gray-300 text-[10px] font-black uppercase">Nenhum colaborador encontrado</p>`;
};

window.selectForAllocation = (id, name) => {
    document.getElementById('a-employee-id').value = id;
    document.getElementById('selected-emp-name').innerText = name;
    document.getElementById('selection-confirm').classList.remove('hidden-pro');
    document.getElementById('alloc-search').value = '';
    window.filterAllocationEmployees();
};

// --- CADERNO CADASTRAL (FORMULÁRIO GLOBAL) ---

window.toggleAllocFields = () => {
    const isChecked = document.getElementById('alloc-now').checked;
    document.getElementById('alloc-fields').classList.toggle('hidden-pro', !isChecked);
    // Esconder seção de acessórios no preview lateral se não for alocar agora
    document.getElementById('form-acc-section').classList.toggle('hidden-pro', !isChecked);
};

window.searchFormEmployee = () => {
    const search = document.getElementById('pc-emp-search').value.toLowerCase();
    const results = document.getElementById('pc-emp-results');
    
    if (search.length < 2) { results.classList.add('hidden-pro'); return; }
    
    const filtered = employees.filter(e => e.type !== 'Desligado' && (
        e.name.toLowerCase().includes(search) || 
        (e.cpf && e.cpf.includes(search)) || 
        (e.registrationNumber && e.registrationNumber.includes(search))
    ));

    if (filtered.length === 0) { results.classList.add('hidden-pro'); return; }

    results.classList.remove('hidden-pro');
    results.innerHTML = filtered.map(e => `
        <div class="px-3 py-2 hover:bg-red-50 cursor-pointer flex justify-between items-center border-b last:border-0" 
             onclick="window.selectFormEmployee('${e.id}', '${e.name}', '${e.cpf || e.registrationNumber || '-'}')">
            <span class="uppercase">${e.name}</span>
            <span class="text-[8px] text-gray-400 font-black">SELECIONAR</span>
        </div>
    `).join('');
};

window.selectFormEmployee = (id, name, cpf) => {
    document.getElementById('pc-emp-id').value = id;
    document.getElementById('pc-emp-name').value = name;
    document.getElementById('pc-emp-cpf').value = cpf;
    document.getElementById('pc-emp-results').classList.add('hidden-pro');
    document.getElementById('pc-emp-search').value = name;
};

window.generatePatrimonio = () => {
    const tier = document.getElementById('pc-tier')?.value || 'T1';
    
    // Unificar todas as fontes de dados para garantir que pegamos o último salvo
    const allItems = [...(globalInventoryCache || []), ...(toolsData || [])];
    
    // Filtrar apenas itens que seguem o padrão PCXXXX
    const notebookTools = allItems.filter(t => t.patrimonio && t.patrimonio.toUpperCase().startsWith('PC'));
    
    let maxNum = 0;
    notebookTools.forEach(t => {
        // Extrair apenas os números após o 'PC' e antes de qualquer '-' ou espaço
        const match = t.patrimonio.match(/PC(\d+)/i);
        if (match && match[1]) {
            const n = parseInt(match[1]);
            if (!isNaN(n) && n > maxNum) maxNum = n;
        }
    });
    
    // Se não encontrar nada, começa do 1, senão soma 1 ao maior encontrado
    const nextNum = (maxNum + 1).toString().padStart(4, '0');
    
    const patInput = document.getElementById('pc-pat');
    if (patInput) {
        patInput.value = `PC${nextNum}-${tier}`;
    }
    
    // Atualiza o card de preview para refletir o novo patrimônio
    window.updateFormPreview();
};

window.selectTier = (el, tier) => {
    document.querySelectorAll('.tier-card').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('pc-tier').value = tier;
    
    // Se o patrimônio já estiver preenchido com o padrão PC, atualizamos o sufixo do tier
    const patInput = document.getElementById('pc-pat');
    if (patInput.value.startsWith('PC') && patInput.value.includes('-')) {
        const parts = patInput.value.split('-');
        patInput.value = `${parts[0]}-${tier}`;
    }
    window.updateFormPreview();
};

window.updateFormPreview = () => {
    const pat = document.getElementById('pc-pat')?.value || '...';
    const cpu = document.getElementById('pc-cpu')?.value || '...';
    const tier = document.getElementById('pc-tier')?.value || 'T1';
    const unid = document.getElementById('pc-unid')?.value || 'ESTOQUE';
    const ram = document.getElementById('pc-ram')?.value || '8';
    const storage = document.getElementById('pc-storage')?.value || 'SSD';

    // Seletores do Preview
    const pPat = document.getElementById('preview-pat');
    const pCpu = document.getElementById('preview-cpu');
    const pTier = document.getElementById('preview-tier-tag');
    const pUnid = document.getElementById('preview-unid');
    const pModel = document.getElementById('preview-model');
    const pDate = document.getElementById('preview-date');

    if (pPat) pPat.innerText = pat;
    if (pCpu) pCpu.innerText = cpu !== '...' ? `Processador Intel® Core™ ${cpu}` : 'Processador Não Definido';
    if (pTier) pTier.innerText = `Tier ${tier.replace('T','')}`;
    if (pUnid) pUnid.innerText = unid;
    
    // Configuração composta (RAM + Armazenamento)
    if (pModel) pModel.innerText = `${ram}GB RAM • ${storage}`;
    
    // Data Dinâmica
    if (pDate) pDate.innerText = new Date().toLocaleDateString('pt-BR');
};

window.initCadernoForm = async () => {
    // 1. Popular Checklist de Acessórios (Chips Interativos)
    const accList = ['CARREGADOR', 'MOUSE SEM FIO', 'MOUSE PAD', 'TELA EXTRA', 'CABO HDMI', 'MOCHILA'];
    const accGrid = document.getElementById('acc-grid');
    if (accGrid) {
        accGrid.innerHTML = accList.map(item => `
            <label class="cursor-pointer group">
                <input type="checkbox" name="pc-acc-chip" value="${item}" class="hidden peer">
                <div class="px-3 md:px-4 py-3 border border-gray-100 rounded-2xl text-[9px] font-black uppercase transition-all peer-checked:bg-nordeste-black peer-checked:text-white group-hover:bg-gray-50 flex items-center justify-center text-center h-full shadow-sm hover:shadow-md">
                    ${item}
                </div>
            </label>
        `).join('');
    }

    // 2. Adicionar listeners para atualização em tempo real do preview e contador
    const inputs = ['pc-cpu', 'pc-storage', 'pc-ram', 'pc-unid', 'pc-pat'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', window.updateFormPreview);
            el.addEventListener('change', window.updateFormPreview);
        }
    });

    // Delegar cliques no grid de acessórios para atualizar o contador
    if (accGrid) {
        accGrid.addEventListener('change', () => {
            const count = document.querySelectorAll('input[name="pc-acc-chip"]:checked').length;
            const badge = document.getElementById('acc-count');
            if (badge) {
                badge.innerText = `${count} ITEM${count !== 1 ? 'S' : ''} MARCADO${count !== 1 ? 'S' : ''}`;
                badge.classList.toggle('bg-green-500', count > 0);
                badge.classList.toggle('bg-red-400', count === 0);
            }
        });
    }

    // 3. Atualizar cache de inventário (Necessário para o auto-incremento do patrimônio)
    try {
        const res = await fetch('/api/tools/all');
        globalInventoryCache = await res.json();
    } catch (e) { 
        console.error("Erro ao atualizar cache de inventário:", e); 
    }

    // 4. Gerar patrimônio inicial se o campo estiver vazio
    if (!document.getElementById('pc-pat').value) {
        window.generatePatrimonio();
    }
    
    // Atualiza o card de preview
    window.updateFormPreview();
};

let currentFormMode = 'notebook';

window.setFormMode = (mode) => {
    currentFormMode = mode;
    
    // Atualizar botões
    const btnNb = document.getElementById('mode-btn-notebook');
    const btnSm = document.getElementById('mode-btn-smartphone');
    
    if (mode === 'notebook') {
        btnNb.className = 'px-4 py-1.5 rounded-full text-[8px] font-black uppercase border-2 border-nordeste-black bg-nordeste-black text-white transition-all';
        btnSm.className = 'px-4 py-1.5 rounded-full text-[8px] font-black uppercase border-2 border-gray-100 text-gray-400 hover:border-blue-400 transition-all';
        document.getElementById('fields-notebook').classList.remove('hidden-pro');
        document.getElementById('fields-smartphone').classList.add('hidden-pro');
        document.getElementById('hardware-card-title').innerText = 'Núcleo de Performance & Hardware';
        document.getElementById('pc-pat').placeholder = 'Auto-Gerado...';
    } else {
        btnSm.className = 'px-4 py-1.5 rounded-full text-[8px] font-black uppercase border-2 border-nordeste-black bg-nordeste-black text-white transition-all';
        btnNb.className = 'px-4 py-1.5 rounded-full text-[8px] font-black uppercase border-2 border-gray-100 text-gray-400 hover:border-blue-400 transition-all';
        document.getElementById('fields-notebook').classList.add('hidden-pro');
        document.getElementById('fields-smartphone').classList.remove('hidden-pro');
        document.getElementById('hardware-card-title').innerText = 'Identidade do Dispositivo Móvel';
        document.getElementById('pc-pat').placeholder = 'CEL0001-T1';
    }
    
    window.generatePatrimonio();
    window.updateFormPreview();
};

window.generatePatrimonio = () => {
    const tier = document.getElementById('pc-tier')?.value || 'T1';
    const prefix = currentFormMode === 'notebook' ? 'PC' : 'CEL';
    
    // Unificar todas as fontes de dados para garantir que pegamos o último salvo
    const allItems = [...(globalInventoryCache || []), ...(toolsData || [])];
    
    // Filtrar apenas itens que seguem o padrão do modo atual
    const filteredTools = allItems.filter(t => t.patrimonio && t.patrimonio.toUpperCase().startsWith(prefix));
    
    let maxNum = 0;
    filteredTools.forEach(t => {
        const regex = new RegExp(`${prefix}(\\d+)`, 'i');
        const match = t.patrimonio.match(regex);
        if (match && match[1]) {
            const n = parseInt(match[1]);
            if (!isNaN(n) && n > maxNum) maxNum = n;
        }
    });
    
    const nextNum = (maxNum + 1).toString().padStart(4, '0');
    const patInput = document.getElementById('pc-pat');
    if (patInput) {
        patInput.value = `${prefix}${nextNum}-${tier}`;
    }
    
    window.updateFormPreview();
};

window.updateFormPreview = () => {
    const pat = document.getElementById('pc-pat')?.value || '...';
    const tier = document.getElementById('pc-tier')?.value || 'T1';
    const unid = document.getElementById('pc-unid')?.value || 'ESTOQUE';
    
    // Seletores do Preview
    const pPat = document.getElementById('preview-pat');
    const pCpu = document.getElementById('preview-cpu');
    const pTier = document.getElementById('preview-tier-tag');
    const pUnid = document.getElementById('preview-unid');
    const pModel = document.getElementById('preview-model');
    const pDate = document.getElementById('preview-date');
    const pIcon = document.getElementById('preview-icon-type');

    if (pPat) pPat.innerText = pat;
    if (pTier) pTier.innerText = `Tier ${tier.replace('T','')}`;
    if (pUnid) pUnid.innerText = unid;
    if (pDate) pDate.innerText = new Date().toLocaleDateString('pt-BR');

    if (currentFormMode === 'notebook') {
        const cpu = document.getElementById('pc-cpu')?.value || '...';
        const ram = document.getElementById('pc-ram')?.value || '8';
        const storage = document.getElementById('pc-storage')?.value || 'SSD';
        
        if (pCpu) pCpu.innerText = cpu !== '...' ? `Processador Intel® Core™ ${cpu}` : 'Processador Não Definido';
        if (pModel) pModel.innerText = `${ram}GB RAM • ${storage}`;
        if (pIcon) pIcon.innerText = '💻';
    } else {
        const brand = document.getElementById('phone-brand')?.value || 'MARCA';
        const model = document.getElementById('phone-model')?.value || 'MODELO';
        const ram = document.getElementById('phone-ram')?.value || '4GB';
        const storage = document.getElementById('phone-storage')?.value || '64GB';
        
        if (pCpu) pCpu.innerText = `${brand} ${model}`;
        if (pModel) pModel.innerText = `${ram} RAM • ${storage} INTERNAL`;
        if (pIcon) pIcon.innerText = '📱';
    }
};

window.saveGeneralForm = async () => {
    const patrimonio = document.getElementById('pc-pat').value;
    if (!patrimonio) return alert('Defina um Patrimônio.');

    // --- VALIDAÇÃO DE ACESSÓRIOS CRÍTICOS ---
    const selectedAcc = Array.from(document.querySelectorAll('input[name="pc-acc-chip"]:checked')).map(cb => cb.value);
    if (currentFormMode === 'notebook' && !selectedAcc.includes('CARREGADOR')) {
        return alert('ALERTA DE SEGURANÇA: Todo notebook deve ser acompanhado de um CARREGADOR.\nPor favor, marque este item.');
    }

    // --- VALIDAÇÃO DE DUPLICIDADE ---
    try {
        const checkRes = await fetch('/api/tools/all');
        const currentData = await checkRes.json();
        const exists = currentData.some(t => t.patrimonio && t.patrimonio.toUpperCase() === patrimonio.toUpperCase());
        if (exists) return alert(`ERRO: O patrimônio "${patrimonio}" já está cadastrado.`);
    } catch (e) { console.warn(e); }

    const otherAcc = document.getElementById('pc-other-acc')?.value;
    if (otherAcc) selectedAcc.push(otherAcc.toUpperCase());

    let payload = {
        patrimonio: patrimonio,
        tier: document.getElementById('pc-tier').value,
        unit: document.getElementById('pc-unid').value,
        accessories: selectedAcc.join(', '),
        responsible: (typeof Auth !== 'undefined') ? Auth.getUser()?.name : 'Admin',
        date_given: new Date().toISOString().split('T')[0],
        status: 'Em estoque'
    };

    if (currentFormMode === 'notebook') {
        payload = {
            ...payload,
            type: 'Notebook',
            brand: 'NIT',
            model: `Intel Core ${document.getElementById('pc-cpu').value}`,
            serial_number: 'SN-' + patrimonio, 
            storage: document.getElementById('pc-storage').value,
            ram: document.getElementById('pc-ram').value + 'GB',
            slots: `${document.getElementById('pc-slots-used')?.value || '0'} (${document.getElementById('pc-ram-dist')?.value || 'N/A'})`
        };
    } else {
        payload = {
            ...payload,
            type: 'Smartphone',
            brand: document.getElementById('phone-brand').value,
            model: document.getElementById('phone-model').value,
            serial_number: document.getElementById('phone-imei').value || ('IMEI-' + patrimonio),
            storage: document.getElementById('phone-storage').value,
            ram: document.getElementById('phone-ram').value,
            accessories: payload.accessories + (document.getElementById('phone-line').value ? `, CHIP: ${document.getElementById('phone-line').value} (${document.getElementById('phone-carrier').value})` : '')
        };
    }

    const allocNow = document.getElementById('alloc-now').checked;
    if (allocNow) {
        payload.employeeId = document.getElementById('pc-emp-id').value;
        if (!payload.employeeId) return alert('Selecione um colaborador.');
        payload.status = 'Em uso';
    }

    try {
        const res = await fetch('/api/tools/item', { 
            method: 'POST', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify(payload) 
        });

        if (res.ok) {
            alert(`${currentFormMode === 'notebook' ? 'Notebook' : 'Smartphone'} cadastrado com sucesso!`);
            window.setGlobalSubTab('inventory');
        } else {
            const err = await res.json();
            alert('Erro: ' + (err.error || 'Falha ao salvar.'));
        }
    } catch (e) { alert('Erro de conexão.'); }
};

window.renderGlobalInventory = async () => {
    try {
        const res = await fetch('/api/tools/all');
        toolsData = await res.json();
        globalInventoryCache = toolsData;
        window.applyGlobalFilters();
        if (typeof window.loadGlobalStats === 'function') window.loadGlobalStats();
    } catch (e) { console.error("Erro ao atualizar inventário:", e); }
};

window.editTool = (id) => {
    const tool = globalInventoryCache.find(t => t.id === id);
    if (!tool) return;

    // Abrir a aba de formulário
    window.setGlobalSubTab('form');

    // Mudar o modo do formulário
    const mode = tool.type === 'Smartphone' ? 'smartphone' : 'notebook';
    window.setFormMode(mode);

    // Preencher campos comuns
    document.getElementById('pc-pat').value = tool.patrimonio;
    document.getElementById('pc-tier').value = tool.tier;
    document.getElementById('pc-unid').value = tool.unit || 'FORTALEZA';
    
    // Atualizar visual do Tier (chips ativos)
    document.querySelectorAll('.tier-card').forEach(c => {
        const tVal = c.onclick.toString().match(/'(T\d)'/)[1];
        c.classList.toggle('active', tVal === tool.tier);
    });

    if (mode === 'notebook') {
        const cpuMatch = tool.model ? tool.model.replace('Intel Core ', '') : '-';
        document.getElementById('pc-cpu').value = cpuMatch;
        document.getElementById('pc-storage').value = tool.storage || '';
        document.getElementById('pc-ram').value = tool.ram ? tool.ram.replace('GB', '') : '8';
    } else {
        document.getElementById('phone-brand').value = tool.brand || 'Apple';
        document.getElementById('phone-model').value = tool.model || '';
        document.getElementById('phone-storage').value = tool.storage || '128GB';
        document.getElementById('phone-ram').value = tool.ram || '8GB';
        document.getElementById('phone-imei').value = tool.serial_number || '';
        
        // Extrair linha e operadora se estiverem nos acessórios
        if (tool.accessories && tool.accessories.includes('CHIP:')) {
            const chipParts = tool.accessories.split('CHIP: ')[1].split(' (');
            document.getElementById('phone-line').value = chipParts[0];
            document.getElementById('phone-carrier').value = chipParts[1].replace(')', '');
        }
    }

    // Preview
    window.updateFormPreview();
    
    // Rolar para o topo
    document.querySelector('main').scrollTop = 0;
};

window.deleteTool = async (id) => {
    if (!confirm('Deseja realmente excluir este ativo do inventário? Esta ação é irreversível.')) return;
    
    try {
        const res = await fetch(`/api/tools/delete/${id}`, { method: 'DELETE' });
        if (res.ok) {
            alert('Item removido com sucesso.');
            window.renderGlobalInventory();
        } else {
            alert('Erro ao excluir item.');
        }
    } catch (e) { alert('Erro de conexão com o servidor.'); }
};

window.loadGlobalStats = async () => {
    try {
        const all = globalInventoryCache;
        const total = all.length;
        const aloc = all.filter(t => t.employee_id).length;
        const disp = total - aloc;
        
        document.getElementById('stat-total-tools').innerText = total;
        document.getElementById('stat-status-aloc').innerText = aloc;
        document.getElementById('stat-status-disp').innerText = disp;
        document.getElementById('stat-aloc-perc').innerText = total > 0 ? Math.round((aloc/total)*100) + '%' : '0%';
        
        // Distribuição por Unidade
        const units = {};
        all.forEach(t => {
            const u = t.unit || 'NÃO DEFINIDO';
            units[u] = (units[u] || 0) + 1;
        });
        
        const unitContainer = document.getElementById('unit-distribution-rows');
        if (unitContainer) {
            unitContainer.innerHTML = Object.entries(units).map(([u, count]) => `
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <div class="w-1 h-4 bg-red-600 rounded-full"></div>
                        <span class="text-[10px] font-black uppercase text-gray-700">${u}</span>
                    </div>
                </div>
            `).join('');
        }
    } catch (e) { console.error("Erro ao carregar stats:", e); }
};

window.printTermo = async (itemId, type = 'entrega') => {
    const item = currentItems.find(i => i.id === itemId) || globalInventoryCache.find(i => i.id === itemId);
    if (!item) return alert('Ativo não encontrado para gerar o termo.');
    if (!currentEmployeeData && !item.employee_name) return alert('Este ativo não está alocado a um colaborador.');
    
    const emp = currentEmployeeData || {
        name: item.employee_name,
        registrationNumber: '0000',
        sector: item.workplace_name || '-',
        employer_name: item.employer_name || 'AR2 Serviços e Soluções Ltda',
        workplace_name: item.workplace_name || '-'
    };

    // Determinar qual template usar
    const isReturn = type === 'devolucao' || type === 'DEVOLUCAO';
    const templatePath = isReturn ? '/templates/termo-devolucao.html' : '/templates/termo-responsabilidade.html';
    
    // Preparar dados básicos
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR').replace(/\//g, '');
    const docCode = `NIT-${dateStr}-${item.id.substring(0,4).toUpperCase()}`;
    
    // Preparar dados do template
    const accessoriesList = (item.accessories || '').split(', ').filter(a => a.trim());
    const accessoriesHTML = accessoriesList.map(a => `(X) ${a}`).join(' ');
    const accessoriesEmptyHTML = accessoriesList.map(a => `( ) ${a}`).join(' ');
    
    const templateData = {
        empresa_nome: emp.employer_name || 'AR2 Serviços e Soluções Ltda',
        empresa_cnpj: '43.529.100/0001-12',
        empresa_endereco: 'Avenida Antônio Sales, nº 1317, sala 604, Joaquim Távora, Fortaleza/CE',
        empresa_unidade: emp.workplace_name || 'Matriz',
        cidade: 'Fortaleza/CE',
        codigo_documento: docCode,
        data_emissao: now.toLocaleDateString('pt-BR'),
        colaborador_nome: emp.name,
        colaborador_cpf: emp.registrationNumber,
        colaborador_unidade: emp.sector || 'N/A',
        colaborador_empresa: emp.employer_name || 'AR2 Serviços e Soluções Ltda',
        patrimonio: item.patrimonio,
        tipo: item.type,
        tipo_equipamento: item.type,
        processador: item.model,
        memoria: item.ram,
        armazenamento: item.storage,
        tier: item.tier || 'T1',
        acessorios: isReturn ? (accessoriesEmptyHTML || '( ) Nenhum acessório vinculado') : (accessoriesHTML || 'PADRÃO'),
        responsavel_nome: '________________________',
        responsavel_cargo: '________________________'
    };
    
    // Carregar e processar template
    const templateResult = await window.loadAndProcessTemplate(templatePath, templateData);
    if (!templateResult) {
        alert('Erro ao carregar template do termo.');
        return;
    }
    
    const { styles, bodyContent } = templateResult;

    const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <title>${isReturn ? 'Protocolo de Devolução' : 'Termo de Responsabilidade e Comodato'} - ${item.patrimonio}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
            ${styles}
            @media print {
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; background: white; }
                @page { margin: 0; size: A4; }
                .page { box-shadow: none; margin: 0; border: none; }
                .no-print { display: none; }
            }
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #525659; display: flex; justify-content: center; padding: 20px 0; }
        </style>
    </head>
    <body onload="setTimeout(() => window.print(), 800)">
        <div class="page" style="width: 210mm; min-height: 297mm; background: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            ${bodyContent}
        </div>
    </body>
    </html>
    `;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
};

