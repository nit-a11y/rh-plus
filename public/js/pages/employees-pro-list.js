
import { getState } from '../state.js';
import { formatCurrencyInput } from '../utils.js';

let employees = [];
let filterStatus = 'active';

export async function initList() {
    try {
        const res = await fetch('/api/employees-pro/list-summary');
        const data = await res.json();
        employees = Array.isArray(data) ? data : [];
        
        setupFilters();
        renderGrid();
    } catch (error) {
        console.error("Erro ao carregar lista de colaboradores:", error);
    }
}

function setupFilters() {
    const select = document.getElementById('list-filter-sector');
    if (!select) return;

    const sectors = [...new Set(employees.map(e => e.sector).filter(Boolean))].sort();
    select.innerHTML = '<option value="all">TODOS OS SETORES</option>';
    sectors.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = s.toUpperCase();
        select.appendChild(opt);
    });

    const searchInput = document.getElementById('list-search');
    if (searchInput) searchInput.oninput = renderGrid;
    if (select) select.onchange = renderGrid;
    
    const btnActive = document.getElementById('list-tab-active');
    const btnInactive = document.getElementById('list-tab-inactive');
    
    if (btnActive) btnActive.onclick = () => setStatus('active');
    if (btnInactive) btnInactive.onclick = () => setStatus('inactive');
}

function setStatus(status) {
    filterStatus = status;
    const btnActive = document.getElementById('list-tab-active');
    const btnInactive = document.getElementById('list-tab-inactive');
    
    if (status === 'active') {
        if (btnActive) btnActive.className = "px-5 py-2 rounded-xl bg-white shadow-sm text-gray-800 transition-all font-black";
        if (btnInactive) btnInactive.className = "px-5 py-2 rounded-xl text-gray-400 hover:text-gray-600 transition-all font-black";
    } else {
        if (btnInactive) btnInactive.className = "px-5 py-2 rounded-xl bg-white shadow-sm text-gray-800 transition-all font-black";
        if (btnActive) btnActive.className = "px-5 py-2 rounded-xl text-gray-400 hover:text-gray-600 transition-all font-black";
    }
    renderGrid();
}

function renderGrid() {
    const container = document.getElementById('grid-container');
    const searchInput = document.getElementById('list-search');
    const sectorSelect = document.getElementById('list-filter-sector');

    if (!container) return;

    const query = searchInput ? searchInput.value.toLowerCase() : '';
    const sector = sectorSelect ? sectorSelect.value : 'all';
    
    const filtered = employees.filter(e => {
        const name = (e.name || '').toLowerCase();
        const reg = String(e.registrationNumber || '');
        const matchesText = name.includes(query) || reg.includes(query);
        const matchesSector = sector === 'all' || e.sector === sector;
        const matchesStatus = filterStatus === 'active' ? e.type !== 'Desligado' : e.type === 'Desligado';
        return matchesText && matchesSector && matchesStatus;
    });

    container.innerHTML = '';

    filtered.forEach(e => {
        const card = document.createElement('div');
        card.className = 'pro-card animate-fade-in';
        const isInactive = e.type === 'Desligado';
        
        card.innerHTML = `
            <div class="pro-card-header">
                <div class="pro-card-status ${isInactive ? 'status-inactive' : 'status-active'}">
                    ${isInactive ? 'Desligado' : 'Ativo'}
                </div>
            </div>
            <div class="pro-card-avatar-wrap">
                <img src="${e.photoUrl || 'https://ui-avatars.com/api/?name='+e.name}" class="pro-card-avatar">
            </div>
            <div class="p-5 text-center flex flex-col flex-1">
                <h3 class="font-black text-gray-800 text-[11px] uppercase leading-tight mb-1 truncate">${e.name}</h3>
                <p class="text-[9px] font-mono text-gray-400 font-bold mb-3 tracking-tighter">#${e.registrationNumber}</p>
                
                <div class="mt-auto space-y-0.5">
                    <p class="text-[9px] text-nordeste-red font-black uppercase truncate">${e.role}</p>
                    <p class="text-[8px] text-amber-600 font-black uppercase">CBO: ${e.cbo || 'NÃO INFORMADO'}</p>
                    <p class="text-[8px] text-gray-400 font-bold uppercase truncate">${e.sector}</p>
                </div>

                <div class="grid grid-cols-2 gap-2 mt-5">
                    <button onclick="window.openEmployeeEditor('${e.id}')" class="bg-nordeste-black hover:bg-black text-white text-[9px] font-black uppercase py-2.5 rounded-lg transition-all shadow-md">
                        Editar
                    </button>
                    <button onclick="window.openEmployeeDossier('${e.id}')" class="bg-gray-50 hover:bg-gray-100 text-gray-500 text-[9px] font-black uppercase py-2.5 rounded-lg transition-all border border-gray-200">
                        Dossiê
                    </button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

window.openEmployeeEditor = (id) => {
    window.toggleModule('editor');
    setTimeout(() => {
        if (window.loadEditorData) {
            window.loadEditorData(id);
        }
    }, 50);
};

window.openNewEmployeePro = async () => {
    const modal = document.getElementById('pro-modal-container');
    const content = document.getElementById('pro-modal-content');
    
    content.parentElement.classList.remove('p-4');
    content.className = "bg-white rounded-[2.5rem] w-full max-w-5xl shadow-2xl overflow-hidden animate-pop border border-white/20";

    const [compRes, rolesRes] = await Promise.all([
        fetch('/api/companies'),
        fetch('/api/roles')
    ]);
    
    const companies = await compRes.json();
    const roles = await rolesRes.json();

    content.innerHTML = `
        <div class="bg-nordeste-black p-8 text-white flex justify-between items-center">
            <div>
                <h3 class="text-2xl font-black uppercase italic tracking-tight">Ficha Digital de Admissão</h3>
                <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Sincronizado com a Matriz de Cargos Organizacional</p>
            </div>
            <button onclick="window.closeProModal()" class="text-white/30 hover:text-white transition-colors">✕ FECHAR</button>
        </div>
        
        <form id="pro-new-emp-form" class="flex flex-col h-[80vh]">
            <div class="flex-1 overflow-y-auto p-10 space-y-12 custom-scroll">
                
                <section>
                    <h4 class="text-nordeste-red font-black text-xs uppercase italic mb-6 flex items-center gap-2">
                        <span class="w-2 h-6 bg-nordeste-red rounded-full"></span> 01. Vínculo Empregatício
                    </h4>
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div class="md:col-span-2"><label class="pro-label">Empregador Legal</label><select id="p-employer" class="pro-input font-bold" required><option value="">Selecione...</option>${companies.filter(c => c.type !== 'Unidade').map(c => `<option value="${c.id}">${c.name} (${c.cnpj})</option>`).join('')}</select></div>
                        <div class="md:col-span-2"><label class="pro-label">Local de Atuação</label><select id="p-workplace" class="pro-input font-bold" required><option value="">Selecione...</option>${companies.filter(c => c.type !== 'Empregador').map(c => `<option value="${c.id}">${c.name} (${c.cnpj})</option>`).join('')}</select></div>
                        
                        <div class="md:col-span-2">
                            <label class="pro-label">Cargo (Definido na Matriz)</label>
                            <select id="p-role-select" class="pro-input font-black text-amber-700" onchange="window.handleRoleChange(this.value)" required>
                                <option value="">ESCOLHA UM CARGO...</option>
                                ${roles.map(r => `<option value="${r.id}">${r.name}</option>`).join('')}
                            </select>
                        </div>
                        
                        <div><label class="pro-label">Setor (Auto)</label><input id="p-sector" class="pro-input bg-gray-50 font-bold" readonly required></div>
                        <div><label class="pro-label">CBO (Auto)</label><input id="p-cbo" class="pro-input bg-gray-50 font-mono" readonly required></div>

                        <div><label class="pro-label">Matrícula</label><input id="p-reg" class="pro-input font-mono font-bold" required></div>
                        <div><label class="pro-label">Data Admissão</label><input type="date" id="p-adm" class="pro-input font-bold" required></div>
                        <div><label class="pro-label">Salário Base</label><input id="p-salary" class="pro-input font-black text-green-700" placeholder="R$ 0,00" oninput="formatCurrencyInput(event)" required></div>
                        <div><label class="pro-label">Tipo de Kit</label><select id="p-type" class="pro-input font-bold"><option value="ADM">Administrativo</option><option value="OP">Operacional</option><option value="ASD">Serviços Gerais</option></select></div>
                    </div>
                </section>

                <section class="bg-gray-50 p-8 rounded-3xl border border-gray-100">
                    <h4 class="text-blue-600 font-black text-xs uppercase italic mb-6 flex items-center gap-2">
                        <span class="w-2 h-6 bg-blue-600 rounded-full"></span> 02. Medidas para Fardamento & EPI
                    </h4>
                    <div class="grid grid-cols-3 gap-6">
                        <div><label class="pro-label">Tamanho Camisa</label><select id="p-size-shirt" class="pro-input font-black"><option>P</option><option selected>M</option><option>G</option><option>GG</option><option>XG</option></select></div>
                        <div><label class="pro-label">Número Calça</label><select id="p-size-pants" class="pro-input font-black"><option>36</option><option>38</option><option selected>40</option><option>42</option><option>44</option><option>46</option></select></div>
                        <div><label class="pro-label">Calçado (Número)</label><select id="p-size-shoe" class="pro-input font-black"><option>35</option><option>36</option><option>37</option><option>38</option><option>39</option><option selected>40</option><option>41</option><option>42</option><option>43</option><option>44</option></select></div>
                    </div>
                    <p class="text-[8px] text-gray-400 font-bold uppercase mt-4 italic">* Os itens configurados no enxoval do cargo serão injetados automaticamente com estas medidas.</p>
                </section>

                <section>
                    <h4 class="text-nordeste-red font-black text-xs uppercase italic mb-6 flex items-center gap-2">
                        <span class="w-2 h-6 bg-nordeste-red rounded-full"></span> 03. Identidade
                    </h4>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div class="md:col-span-2"><label class="pro-label">Nome Completo</label><input id="p-name" class="pro-input font-bold" required></div>
                        <div><label class="pro-label">Data Nascimento</label><input type="date" id="p-birth" class="pro-input font-bold" required></div>
                        <div><label class="pro-label">Nome da Mãe</label><input id="p-mother" class="pro-input" required></div>
                        <div><label class="pro-label">CPF</label><input id="p-cpf" class="pro-input font-mono font-black" placeholder="000.000.000-00" required></div>
                        <div><label class="pro-label">RG Número</label><input id="p-rg" class="pro-input font-mono font-bold" required></div>
                    </div>
                </section>
            </div>

            <div class="p-8 bg-gray-50 border-t flex gap-4">
                <button type="button" onclick="window.closeProModal()" class="flex-1 py-4 text-xs font-black uppercase text-gray-400">Descartar</button>
                <button type="submit" class="flex-[3] bg-nordeste-red text-white py-4 rounded-2xl font-black text-sm uppercase shadow-2xl">Finalizar Admissão Digital</button>
            </div>
        </form>
    `;

    window.handleRoleChange = (roleId) => {
        const role = roles.find(r => r.id === roleId);
        if (role) {
            document.getElementById('p-sector').value = role.sector;
            document.getElementById('p-cbo').value = role.cbo;
        }
    };

    modal.classList.remove('hidden');

    document.getElementById('pro-new-emp-form').onsubmit = async (e) => {
        e.preventDefault();
        
        const selectedRoleId = document.getElementById('p-role-select').value;
        const roleData = roles.find(r => r.id === selectedRoleId);

        const payload = {
            emp: {
                name: document.getElementById('p-name').value,
                registrationNumber: document.getElementById('p-reg').value,
                admissionDate: document.getElementById('p-adm').value,
                birthDate: document.getElementById('p-birth').value,
                motherName: document.getElementById('p-mother').value,
                role: roleData.name,
                sector: roleData.sector,
                cbo: roleData.cbo,
                currentSalary: document.getElementById('p-salary').value,
                type: document.getElementById('p-type').value,
                employer_id: document.getElementById('p-employer').value,
                workplace_id: document.getElementById('p-workplace').value,
            },
            docs: {
                cpf: document.getElementById('p-cpf').value,
                rg_number: document.getElementById('p-rg').value
            },
            sizes: {
                shirt: document.getElementById('p-size-shirt').value,
                pants: document.getElementById('p-size-pants').value,
                shoe: document.getElementById('p-size-shoe').value
            }
        };

        const res = await fetch('/api/employees-pro/admit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            window.uiAlert('ADMISSÃO E INJEÇÃO DE KIT REALIZADAS COM SUCESSO!');
            window.closeProModal();
            initList();
        }
    };
};
