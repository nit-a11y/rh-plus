
import { getState } from '../state.js';
import { formatCurrencyInput } from '../utils.js';

let employees = [];
let filterStatus = 'active';
let cpfSearchResult = null;

// Validar CPF ao sair do campo - Abre modal estilo transferência
window.validateCpfOnBlur = async (input) => {
    let cpf = input.value.replace(/\D/g, '');
    if (cpf.length < 11) return;
    cpf = cpf.substring(0, 11);
    
    try {
        const res = await fetch(`/api/employees-pro/search-by-cpf/${cpf}`);
        const data = await res.json();
        
        if (!data.found || data.employees.length === 0) {
            return;
        }
        
        const empList = data.employees;
        const activeEmployees = empList.filter(e => e.type !== 'Desligado');
        
        if (activeEmployees.length > 0) {
            const active = activeEmployees[0];
            const msg = `CPF já vinculado ao colaborador ativo: ${active.name}\n\nDeseja realizar uma transferência?\nAcesse: Menu do colaborador > Transferência`;
            alert(msg);
            input.value = '';
            input.focus();
        } else {
            const lastEmployee = empList[0];
            
            // Usar dados da busca CPF (já tem as informações necessárias)
            cpfSearchResult = lastEmployee;
            
            const modal = document.getElementById('pro-modal-container');
            const content = document.getElementById('pro-modal-content');
            const today = new Date().toISOString().split('T')[0];
            
            content.innerHTML = `
                <div class="bg-orange-600 p-4 md:p-6 text-white sticky top-0 z-10">
                    <h3 class="text-lg md:text-xl font-black uppercase italic">Reativação</h3>
                    <p class="text-xs font-medium mt-1">Reativa colaborador desligado</p>
                </div>
                <div class="p-4 md:p-6 space-y-4 overflow-y-auto max-h-[70vh] md:max-h-[80vh] custom-scroll">
                    <div class="bg-blue-50 p-3 md:p-4 rounded-xl border border-blue-100">
                        <p class="text-sm font-bold text-blue-600">Colaborador DESLIGADO:</p>
                        <p class="text-lg font-black text-gray-800">${cpfSearchResult.name}</p>
                        <p class="text-sm text-gray-600">Matrícula: ${cpfSearchResult.registrationNumber}</p>
                        <p class="text-sm text-gray-600">CPF: ${cpf}</p>
                        <p class="text-sm text-gray-600">Cargo: ${cpfSearchResult.role || 'N/A'}</p>
                        <p class="text-sm text-gray-600">Setor: ${cpfSearchResult.sector || 'N/A'}</p>
                        <p class="text-sm text-gray-600">Admissão: ${cpfSearchResult.admissionDate || 'N/A'}</p>
                    </div>
                    
                    <div class="border-t border-gray-200 pt-4">
                        <p class="text-sm font-bold text-orange-600 mb-3">DADOS DA REATIVAÇÃO</p>
                    </div>
                    
                    <div>
                        <label class="pro-label">Nova Data de Admissão *</label>
                        <input type="date" id="reativ-admission-date" class="pro-input" value="${today}">
                    </div>
                    
                    <div>
                        <label class="pro-label">Novo Empregador</label>
                        <select id="reativ-employer" class="pro-input">
                            <option value="">-- Selecione --</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="pro-label">Nova Unidade</label>
                        <select id="reativ-workplace" class="pro-input">
                            <option value="">-- Selecione --</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="pro-label">Novo Cargo/Função</label>
                        <select id="reativ-role" class="pro-input">
                            <option value="">-- Selecione --</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="pro-label">Novo Salário</label>
                        <input type="text" id="reativ-salary" class="pro-input font-bold text-green-700" placeholder="R$ 0,00" value="${cpfSearchResult.currentSalary || ''}" oninput="formatCurrencyInput(event)">
                    </div>
                    
                    <div>
                        <label class="pro-label">Motivo / Observação</label>
                        <textarea id="reativ-reason" class="pro-input" rows="2" placeholder="Descreva o motivo da reativação..."></textarea>
                    </div>
                    
                    <div class="p-3 md:p-4 bg-amber-50 rounded-xl border border-amber-200">
                        <p class="text-xs font-bold text-amber-700">ATENÇÃO:</p>
                        <p class="text-xs text-amber-600">Um novo colaborador ATIVO será criado com os dados acima.</p>
                    </div>
                </div>
                
                <div class="p-4 md:p-6 border-t flex flex-col md:flex-row gap-3 md:justify-end">
                    <button onclick="window.closeProModal()" class="w-full md:w-auto px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300">Cancelar</button>
                    <button onclick="window.executeReativacao()" class="w-full md:w-auto px-6 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700">Confirmar Reativação</button>
                </div>
            `;
            
modal.classList.remove('hidden');
            
            // Expor função globalmente
            window.loadCompaniesForReativacao = async () => {
                try {
                    const empSelect = document.getElementById('reativ-employer');
                    const wpSelect = document.getElementById('reativ-workplace');
                    const roleSelect = document.getElementById('reativ-role');
                    
                    if (!empSelect || !wpSelect) return;
                    
                    const [companiesRes, rolesRes] = await Promise.all([
                        fetch('/api/companies'),
                        fetch('/api/roles')
                    ]);
                    
                    const companies = await companiesRes.json();
                    const roles = await rolesRes.json();
                    
                    // Corrigir filtro: type !== 'Unidade' para empregadores, type === 'Unidade' OU 'Ambos' para unidades
                    const employers = companies.filter(c => c.type !== 'Unidade');
                    const workplaces = companies.filter(c => c.type === 'Unidade' || c.type === 'Ambos');
                    
                    empSelect.innerHTML = '<option value="">-- Selecione --</option>' + 
                        employers.map(e => `<option value="${e.id}">${e.name}</option>`).join('');
                    
                    wpSelect.innerHTML = '<option value="">-- Selecione --</option>' + 
                        workplaces.map(w => `<option value="${w.id}">${w.name}</option>`).join('');
                    
                    if (roleSelect && roles.length > 0) {
                        roleSelect.innerHTML = '<option value="">-- Selecione --</option>' + 
                            roles.map(r => `<option value="${r.name}">${r.name}</option>`).join('');
                        if (cpfSearchResult.role) {
                            roleSelect.value = cpfSearchResult.role;
                        }
                    }
                } catch (err) {
                    console.error('Erro ao carregar dados:', err);
                }
            };
            
            // Carregar empregadores, unidades e cargos
            setTimeout(() => {
                window.loadCompaniesForReativacao();
            }, 200);
        }
    } catch (err) {
        console.error('Erro ao validar CPF:', err);
    }
};

// Executar reativação
window.executeReativacao = async () => {
    const newAdmissionDate = document.getElementById('reativ-admission-date').value;
    const newEmployer = document.getElementById('reativ-employer').value;
    const newWorkplace = document.getElementById('reativ-workplace').value;
    const newRole = document.getElementById('reativ-role').value;
    const newSalary = document.getElementById('reativ-salary').value;
    const reason = document.getElementById('reativ-reason').value;
    
    if (!newAdmissionDate) {
        alert('Informe a data de admissão');
        return;
    }
    
    if (!confirm('Confirmar reativação? Um novo colaborador ATIVO será criado.')) {
        return;
    }
    
    try {
        const res = await fetch(`/api/transfers/employee/${cpfSearchResult.id}/reativar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                new_admission_date: newAdmissionDate,
                to_employer_id: newEmployer || null,
                to_workplace_id: newWorkplace || null,
                new_role: newRole || null,
                new_salary: newSalary || null,
                reason: reason || 'Reativação via CPF',
                changed_by: 'Sistema'
            })
        });
        
        const result = await res.json();
        
        if (res.ok) {
            window.closeProModal();
            alert('Colaborador reativado com sucesso!');
            window.location.reload();
        } else {
            alert('Erro: ' + (result.error || 'Erro desconhecido'));
        }
    } catch (err) {
        console.error('Erro ao reativar:', err);
        alert('Erro ao reativar colaborador');
    }
};

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

// Expor função globalmente para uso no oninput
window.formatCurrencyInput = formatCurrencyInput;

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
                        <span class="w-2 h-6 bg-nordeste-red rounded-full"></span> 01. Identidade
                    </h4>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div><label class="pro-label">CPF</label><input id="p-cpf" class="pro-input font-mono font-black" placeholder="000.000.000-00" onblur="window.validateCpfOnBlur(this)" required></div>
                        <div class="md:col-span-2"><label class="pro-label">Nome Completo</label><input id="p-name" class="pro-input font-bold" required></div>
                        <div><label class="pro-label">Data Nascimento</label><input type="date" id="p-birth" class="pro-input font-bold" required></div>
                        <div><label class="pro-label">Nome da Mãe</label><input id="p-mother" class="pro-input" required></div>
                        <div><label class="pro-label">RG Número</label><input id="p-rg" class="pro-input font-mono font-bold" required></div>
                    </div>
                </section>

                <section>
                    <h4 class="text-nordeste-red font-black text-xs uppercase italic mb-6 flex items-center gap-2">
                        <span class="w-2 h-6 bg-nordeste-red rounded-full"></span> 02. Vínculo Empregatício
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
                        <span class="w-2 h-6 bg-blue-600 rounded-full"></span> 03. Medidas para Fardamento & EPI
                    </h4>
                    <div class="grid grid-cols-3 gap-6">
                        <div><label class="pro-label">Tamanho Camisa</label><select id="p-size-shirt" class="pro-input font-black"><option>P</option><option selected>M</option><option>G</option><option>GG</option><option>XG</option></select></div>
                        <div><label class="pro-label">Número Calça</label><select id="p-size-pants" class="pro-input font-black"><option>36</option><option>38</option><option selected>40</option><option>42</option><option>44</option><option>46</option></select></div>
                        <div><label class="pro-label">Calçado (Número)</label><select id="p-size-shoe" class="pro-input font-black"><option>35</option><option>36</option><option>37</option><option>38</option><option>39</option><option selected>40</option><option>41</option><option>42</option><option>43</option><option>44</option></select></div>
                    </div>
                    <p class="text-[8px] text-gray-400 font-bold uppercase mt-4 italic">* Os itens configurados no enxoval do cargo serão injetados automaticamente com estas medidas.</p>
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
