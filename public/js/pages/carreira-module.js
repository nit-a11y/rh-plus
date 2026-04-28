
import { formatCurrency, formatarDataBR, formatarDataHoraBR, parseCurrency, formatCurrencyInput } from '../utils.js';

function formatSalaryValue(salary) {
    if (!salary || typeof salary !== 'string') return salary || '-';
    if (salary.includes('R$')) return salary;
    const num = parseFloat(salary);
    if (isNaN(num)) return salary;
    return formatCurrency(salary);
}

let employees = [];
let selectedId = null;
let currentEmployeeData = null;
let filterStatus = 'active';
let rolesMatrix = [];
let fullHistory = [];

document.addEventListener('DOMContentLoaded', () => {
    if (typeof Auth === 'object' && Auth !== null) {
        const user = Auth.check();
        if (!user) return;
    }
    loadAllEmployees();
    loadRoles();
    
    const urlParams = new URLSearchParams(window.location.search);
    const empId = urlParams.get('emp');
    if (empId) {
        setTimeout(() => {
            window.openEmployeeById(empId);
        }, 500);
    }
});

async function loadAllEmployees() {
    try {
        const res = await fetch('/api/employees');
        employees = await res.json();
        renderSidebar();
        
        // Só atualiza a view se employees foi carregado com sucesso
        if (selectedId && employees.length > 0) {
            const emp = employees.find(e => e.id === selectedId);
            if (emp) {
                currentEmployeeData = emp;
                updateEmployeeView(emp);
            }
        }
    } catch (e) { console.error(e); }
}

function updateEmployeeView(emp) {
    const salaryEl = document.getElementById('view-salary');
    const roleEl = document.getElementById('view-role');
    if (salaryEl) salaryEl.innerText = formatCurrency(emp.currentSalary);
    if (roleEl) roleEl.innerText = `${emp.role} (CBO: ${emp.cbo || '---'})`;
}

async function refreshCurrentEmployee() {
    if (!selectedId) return;
    try {
        const res = await fetch('/api/employees');
        employees = await res.json();
        const emp = employees.find(e => e.id === selectedId);
        if (emp) {
            currentEmployeeData = emp;
            updateEmployeeView(emp);
            renderSidebar();
        }
    } catch (e) { console.error(e); }
    if (currentEmployeeData) {
        await loadCareerTimeline(selectedId);
    }
}

async function loadRoles() {
    try {
        const res = await fetch('/api/roles');
        rolesMatrix = await res.json();
    } catch (e) { }
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
        const matchesSearch = (e.name || '').toLowerCase().includes(search) || (e.registrationNumber || '').includes(search);
        const matchesStatus = filterStatus === 'active' ? e.type !== 'Desligado' : e.type === 'Desligado';
        return matchesSearch && matchesStatus;
    });

    container.innerHTML = filtered.map(e => `
        <div class="emp-item ${selectedId === e.id ? 'active' : ''}" onclick="window.selectEmployee('${e.id}')">
            <img src="${e.photoUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(e.name)}" class="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-sm">
            <div class="min-w-0 flex-1">
                <p class="text-[10px] font-black text-gray-800 uppercase truncate">${e.name}</p>
                <p class="text-[8px] text-gray-400 font-bold uppercase tracking-widest leading-none">${e.role}</p>
            </div>
            ${e.type === 'Desligado' ? '<span class="text-[7px] bg-red-100 text-red-600 font-black px-2 py-0.5 rounded-full uppercase">Sair</span>' : ''}
        </div>
    `).join('') || `<p class="p-8 text-center text-gray-300 text-[9px] font-black uppercase italic">Vazio</p>`;
}

window.filterList = () => renderSidebar();

window.openEmployeeById = async (id) => {
    const exists = employees.find(e => e.id === id);
    if (exists) {
        window.selectEmployee(id);
    } else {
        await loadAllEmployees();
        setTimeout(() => {
            window.selectEmployee(id);
        }, 300);
    }
};

window.selectEmployee = async (id) => {
    selectedId = id;
    renderSidebar();

    const emp = employees.find(e => e.id === id);
    if (!emp) return;
    currentEmployeeData = emp;

    document.getElementById('welcome-msg').classList.add('hidden');
    document.getElementById('selection-view').classList.remove('hidden');

    document.getElementById('view-photo').src = emp.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}`;
    document.getElementById('view-name').innerText = emp.name;
    document.getElementById('view-reg').innerText = `#${emp.registrationNumber}`;
    document.getElementById('view-role').innerText = `${emp.role} (CBO: ${emp.cbo || '---'})`;
    document.getElementById('view-salary').innerText = formatCurrency(emp.currentSalary);

    await loadCareerTimeline(id);
};

async function loadCareerTimeline(id) {
    try {
        const res = await fetch(`/api/employees-pro/${id}/dossier`);
        const data = await res.json();

        fullHistory = [
            ...(data.career || []).map(c => {
                // Classificação inteligente do tipo de registro
                const isBonus = c.move_type.toLowerCase().includes('bonificação') ||
                    c.move_type.toLowerCase().includes('mérito') ||
                    c.move_type.toLowerCase().includes('bônus') ||
                    c.move_type.toLowerCase().includes('bonus');
                return {
                    ...c,
                    type_group: isBonus ? 'BONUS' : 'CARREIRA',
                    source_table: 'career'
                };
            }),
            ...(data.occurrences || []).map(o => ({
                id: o.id, date: o.date, move_type: o.type, role: 'OCORRÊNCIA', sector: o.reason,
                salary: o.type.includes('Premiação') ? 'MÉRITO' : 'CONDUTA',
                observation: o.observation, type_group: 'CONDUTA', cbo: '', responsible: o.responsible,
                source_table: 'occurrences'
            }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date));

        renderTimeline(fullHistory);
    } catch (e) { console.error(e); }
}

function renderTimeline(history) {
    const container = document.getElementById('career-timeline');
    if (!container) return;

    container.innerHTML = `
        <div class="flex justify-between items-center mb-4">
            <h4 class="text-[9px] font-black text-gray-400 uppercase tracking-widest italic">Timeline do Colaborador</h4>
            <button onclick="window.viewFullHistory()" class="text-[8px] font-black text-nordeste-red uppercase bg-red-50 px-3 py-1 rounded-lg border border-red-100 hover:bg-red-100 transition-all">📄 Log de Auditoria</button>
        </div>
    `;

    if (history.length === 0) {
        container.innerHTML += '<p class="text-gray-400 text-xs italic">Sem registros no banco.</p>';
        return;
    }

    // Cálculo de Variação (Exclui Bônus e Ocorrências)
    const salaryEvents = history.filter(h => h.type_group === 'CARREIRA' && h.salary && h.salary !== '-').reverse();

    if (salaryEvents.length > 0) {
        const firstSal = parseCurrency(salaryEvents[0].salary); // Primeiro salário histórico
        const lastSal = parseCurrency(currentEmployeeData.currentSalary); // Salário Atual do cadastro

        let variation = 0;
        if (firstSal > 0) {
            variation = ((lastSal - firstSal) / firstSal * 100).toFixed(1);
        }
        document.getElementById('view-variation').innerText = `${variation > 0 ? '+' : ''}${variation}%`;
    } else {
        document.getElementById('view-variation').innerText = `0.0%`;
    }

    container.innerHTML += history.map((c, i) => {
        let dotColor = "border-nordeste-red";
        let cardBg = "bg-white";
        let amountColor = "text-nordeste-red";

        if (c.type_group === 'CONDUTA') {
            dotColor = c.salary === 'MÉRITO' ? "border-amber-400" : "border-gray-800";
            amountColor = c.salary === 'MÉRITO' ? 'text-amber-500' : 'text-gray-400';
        } else if (c.type_group === 'BONUS') {
            dotColor = "border-emerald-500";
            cardBg = "bg-emerald-50/30";
            amountColor = "text-emerald-600";
        }

        return `
            <div class="career-item animate-fade" style="animation-delay: ${i * 0.05}s">
                <div class="timeline-dot" style="border-color: ${dotColor.replace('border-', '')}"></div>
                <div class="career-card ${cardBg} group">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <span class="move-badge ${c.type_group === 'CONDUTA' ? 'bg-gray-100 text-gray-500' : c.type_group === 'BONUS' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-50 text-red-600'}">${c.move_type}</span>
                            <h4 class="font-black text-gray-800 text-sm uppercase italic mt-2 leading-none">
                                ${c.role} ${c.cbo ? `<span class="text-[8px] font-mono text-amber-600 ml-1">(CBO: ${c.cbo})</span>` : ''}
                            </h4>
                            <p class="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">${c.sector}</p>
                        </div>
                        <div class="text-right">
                            <div class="flex justify-end gap-2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onclick="window.editCareerItem('${c.id}', '${c.source_table}')" class="p-1.5 bg-gray-50 text-gray-400 hover:text-nordeste-red rounded-lg transition-colors border border-gray-100" title="Editar">✏️</button>
                                <button onclick="window.deleteHistoryItem('${c.id}', '${c.source_table}')" class="p-1.5 bg-gray-50 text-gray-400 hover:text-red-700 rounded-lg transition-colors border border-gray-100" title="Excluir">🗑️</button>
                            </div>
                            <p class="text-lg font-black ${amountColor} tabular-nums">${formatSalaryValue(c.salary)}</p>
                            ${c.type_group === 'BONUS' ? '<p class="text-[7px] font-black text-emerald-600 uppercase mt-1">PAGAMENTO ÚNICO</p>' : ''}
                            <p class="text-[8px] font-mono text-gray-400 font-bold mt-1">${formatarDataHoraBR(c.date)}</p>
                        </div>
                    </div>
                    ${c.observation ? `<div class="mt-3 pt-3 border-t border-gray-100 text-[10px] text-gray-500 italic">"${c.observation}"</div>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

window.deleteHistoryItem = async (id, table) => {
    if (!confirm("⚠️ ATENÇÃO: Deseja excluir permanentemente este registro do histórico?\nEsta ação não altera os dados atuais do colaborador, apenas remove o registro da timeline.")) return;

    try {
        const endpoint = table === 'career' ? `/api/career/${id}` : `/api/occurrences/${id}`;
        const res = await fetch(endpoint, { method: 'DELETE' });
        if (res.ok) {
            refreshCurrentEmployee();
        } else {
            alert("Erro ao excluir registro.");
        }
    } catch (e) {
        alert("Falha de comunicação.");
    }
};

window.editCareerItem = (id, table) => {
    const item = fullHistory.find(h => h.id === id);
    if (!item) return;

    const modal = document.getElementById('pro-modal-container');
    const content = document.getElementById('pro-modal-content');

    const isOccurrence = table === 'occurrences';
    const dateValue = item.date.replace(' ', 'T').substring(0, 19);

    content.innerHTML = `
        <div class="bg-nordeste-black p-8 text-white"><h3 class="text-xl font-black uppercase italic">Corrigir Histórico de Carreira</h3></div>
        <form id="edit-history-form" class="p-10 space-y-6">
            <div class="grid grid-cols-2 gap-4">
                <div><label class="pro-label">Tipo de Evento</label><input id="e-type" class="pro-input uppercase" value="${item.move_type}" ${isOccurrence ? 'readonly' : ''}></div>
                <div><label class="pro-label">Data e Hora (Manual)</label><input type="datetime-local" id="e-date" class="pro-input font-bold" value="${dateValue}"></div>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div><label class="pro-label">Cargo</label><input id="e-role" class="pro-input uppercase" value="${item.role}" ${isOccurrence ? 'readonly' : ''}></div>
                <div><label class="pro-label">Setor</label><input id="e-sector" class="pro-input uppercase" value="${item.sector}" ${isOccurrence ? 'readonly' : ''}></div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div><label class="pro-label">Valor / Salário</label><input id="e-salary" class="pro-input font-black text-nordeste-red" value="${item.salary}" ${isOccurrence ? 'readonly' : ''}></div>
                <div><label class="pro-label">CBO</label><input id="e-cbo" class="pro-input font-mono" value="${item.cbo || ''}" ${isOccurrence ? 'readonly' : ''}></div>
            </div>

            <div><label class="pro-label">Observação / Justificativa</label><textarea id="e-obs" class="pro-input h-24 uppercase">${item.observation || ''}</textarea></div>

            <div class="flex gap-4">
                <button type="button" onclick="window.closeProModal()" class="flex-1 py-4 font-black uppercase text-gray-400">Cancelar</button>
                <button type="submit" class="flex-[3] bg-nordeste-black text-white py-4 rounded-2xl font-black uppercase shadow-xl">Salvar Alterações</button>
            </div>
        </form>
    `;

    document.getElementById('edit-history-form').onsubmit = async (e) => {
        e.preventDefault();

        const payload = isOccurrence ? {
            type: item.move_type,
            date: document.getElementById('e-date').value.replace('T', ' '),
            reason: item.sector,
            responsible: item.responsible,
            observation: document.getElementById('e-obs').value
        } : {
            move_type: document.getElementById('e-type').value,
            date: document.getElementById('e-date').value.replace('T', ' '),
            role: document.getElementById('e-role').value,
            sector: document.getElementById('e-sector').value,
            salary: document.getElementById('e-salary').value,
            cbo: document.getElementById('e-cbo').value,
            observation: document.getElementById('e-obs').value,
            responsible: Auth.getUser()?.name || 'Administrador'
        };

        const endpoint = table === 'career' ? `/api/career/${id}` : `/api/occurrences/${id}`;

        try {
            const res = await fetch(endpoint, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                window.closeProModal();
                await loadAllEmployees();
                if (selectedId) window.selectEmployee(selectedId);
            } else {
                alert("Erro ao salvar alterações.");
            }
        } catch (e) {
            alert("Falha de conexão.");
        }
    };

    modal.classList.remove('hidden');
};

// LOG DE AUDITORIA (HISTÓRICO COMPLETO EM TABELA)
window.viewFullHistory = () => {
    const modal = document.getElementById('pro-modal-container');
    const content = document.getElementById('pro-modal-content');
    content.className = "bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-hidden animate-pop";
    content.innerHTML = `
        <div class="bg-nordeste-black p-8 text-white flex justify-between items-center">
            <div>
                <h3 class="text-xl font-black uppercase italic">Log de Auditoria de Carreira</h3>
                <p class="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Registros chronológicos e invariáveis</p>
            </div>
            <button onclick="window.closeProModal()" class="text-white/20">✕</button>
        </div>
        <div class="p-8 overflow-x-auto max-h-[60vh] custom-scroll">
            <table class="w-full text-left border-collapse text-[10px]">
                <thead>
                    <tr class="text-gray-400 uppercase font-black border-b border-gray-100">
                        <th class="p-4">Data/Hora</th>
                        <th class="p-4">Evento</th>
                        <th class="p-4">Cargo / Setor</th>
                        <th class="p-4">Valor</th>
                        <th class="p-4">Responsável</th>
                        <th class="p-4 text-center">Ações</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                    ${fullHistory.map(h => `
                        <tr>
                            <td class="p-4 font-mono text-gray-400">${formatarDataHoraBR(h.date)}</td>
                            <td class="p-4"><span class="font-black uppercase italic ${h.type_group === 'CARREIRA' ? 'text-blue-600' : h.type_group === 'BONUS' ? 'text-emerald-600' : 'text-amber-600'}">${h.move_type}</span></td>
                            <td class="p-4 font-bold uppercase">${h.role} <br> <span class="text-[8px] text-gray-300 font-medium">${h.sector}</span></td>
                            <td class="p-4 font-black text-gray-800">${formatSalaryValue(h.salary)}</td>
                            <td class="p-4 text-nordeste-red font-black uppercase italic">${h.responsible || '---'}</td>
                            <td class="p-4 text-center">
                                <div class="flex justify-center gap-1">
                                    <button onclick="window.editCareerItem('${h.id}', '${h.source_table}')" class="p-1 hover:bg-gray-100 rounded-md transition-all" title="Editar">✏️</button>
                                    <button onclick="window.deleteHistoryItem('${h.id}', '${h.source_table}')" class="p-1 hover:bg-red-50 rounded-md transition-all" title="Excluir">🗑️</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div class="p-8 bg-gray-50 border-t flex justify-end">
            <button onclick="window.closeProModal()" class="bg-nordeste-black text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase">Fechar Auditoria</button>
        </div>
    `;
    modal.classList.remove('hidden');
};

// REAJUSTE COLETIVO (FUNCIONAL)
window.openBulkAdjustment = () => {
    if (!employees || employees.length === 0) {
        alert('Carregue os dados dos colaboradores primeiro.');
        return;
    }
    const modal = document.getElementById('pro-modal-container');
    const content = document.getElementById('pro-modal-content');
    content.innerHTML = `
        <div class="bg-green-600 p-8 text-white"><h3 class="text-xl font-black uppercase italic">Reajuste Salarial Coletivo</h3></div>
        <form id="bulk-form" class="p-10 space-y-6">
            <div>
                <label class="pro-label">Percentual de Aumento (%)</label>
                <input type="number" id="b-percent" step="0.01" class="pro-input font-black text-3xl text-center text-green-700" placeholder="0.00" required>
            </div>
            <div>
                <label class="pro-label">Observação / Justificativa</label>
                <textarea id="b-obs" class="pro-input h-20" placeholder="Ex: Dissídio Coletivo 2026..." required></textarea>
            </div>
            <div class="p-4 bg-amber-50 rounded-xl border border-amber-200 flex gap-3">
                <span class="text-xl">⚠️</span>
                <p class="text-[9px] text-amber-700 font-bold uppercase leading-tight">Atenção: Esta ação atualizará o salário de TODOS os colaboradores ativos e gerará um registro no histórico individual de cada um.</p>
            </div>
            <button type="submit" class="w-full bg-nordeste-black text-white py-4 rounded-2xl font-black uppercase shadow-xl">Aplicar Aumento Geral</button>
            <button type="button" onclick="window.closeProModal()" class="w-full text-gray-400 font-black text-[10px] mt-2 uppercase">Cancelar</button>
        </form>
    `;
    document.getElementById('bulk-form').onsubmit = async (e) => {
        e.preventDefault();
        const percent = document.getElementById('b-percent').value;
        const obs = document.getElementById('b-obs').value;
        const responsible = Auth.getUser()?.name || 'Administrador';

        if (!confirm(`Confirma a aplicação de reajuste de ${percent}% para toda a base?`)) return;

        const res = await fetch('/api/career/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ percentage: percent, observation: obs, responsible })
        });

        if (res.ok) {
            alert("🎯 REAJUSTE COLETIVO APLICADO COM SUCESSO!");
            window.closeProModal();
            await loadAllEmployees();
            if (selectedId) window.selectEmployee(selectedId);
        } else {
            alert("Erro ao processar reajuste.");
        }
    };
    modal.classList.remove('hidden');
};

// OUTRAS MODAIS MANTIDAS COM PRECISÃO DE DATA
window.openPromotionModal = () => {
    if (!currentEmployeeData) {
        alert('Selecione um colaborador primeiro.');
        return;
    }
    const modal = document.getElementById('pro-modal-container');
    const content = document.getElementById('pro-modal-content');
    content.innerHTML = `
        <div class="bg-nordeste-black p-8 text-white"><h3 class="text-xl font-black uppercase italic">Nova Movimentação Profissional</h3></div>
        <form id="promo-form" class="p-10 space-y-6">
            <div><label class="pro-label">Tipo de Evento</label><select id="m-type" class="pro-input font-bold"><option>Promoção</option><option>Reajuste Salarial</option><option>Acordo Individual</option><option>Desligamento</option></select></div>
            <div><label class="pro-label">Novo Cargo</label><select id="m-role-select" class="pro-input font-bold"><option value="">-- MANTER ATUAL --</option>${rolesMatrix.map(r => `<option value="${r.id}">${r.name}</option>`).join('')}</select></div>
            <div class="grid grid-cols-2 gap-4">
                <div><label class="pro-label">Setor</label><input id="m-sector" class="pro-input bg-gray-50" readonly value="${currentEmployeeData.sector}"></div>
                <div><label class="pro-label">Novo Salário</label><input id="m-salary" class="pro-input font-black text-green-700" oninput="window.formatCurrencyInput(event)" value="${currentEmployeeData.currentSalary}"></div>
            </div>
            <div><label class="pro-label">CBO (Auto)</label><input id="m-cbo" class="pro-input bg-gray-50 font-mono" readonly value="${currentEmployeeData.cbo}"></div>
            <div><label class="pro-label">Observação</label><textarea id="m-obs" class="pro-input h-20" placeholder="Justificativa..."></textarea></div>
            <button type="submit" class="w-full bg-nordeste-red text-white py-4 rounded-2xl font-black uppercase shadow-xl">Confirmar Alteração</button>
            <button type="button" onclick="window.closeProModal()" class="w-full text-gray-400 font-black text-[10px] mt-2 uppercase">Cancelar</button>
        </form>
    `;
    document.getElementById('m-role-select').addEventListener('change', (e) => {
        const r = rolesMatrix.find(x => x.id === e.target.value);
        if (r) { document.getElementById('m-sector').value = r.sector; document.getElementById('m-cbo').value = r.cbo; }
    });
    document.getElementById('promo-form').onsubmit = async (e) => {
        e.preventDefault();
        const now = new Date();
        const preciseDate = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0');
        const roleData = rolesMatrix.find(r => r.id === document.getElementById('m-role-select').value);
        const payload = {
            employeeId: selectedId, move_type: document.getElementById('m-type').value,
            role: roleData ? roleData.name : currentEmployeeData.role,
            sector: document.getElementById('m-sector').value, cbo: document.getElementById('m-cbo').value,
            salary: document.getElementById('m-salary').value, date: preciseDate,
            observation: document.getElementById('m-obs').value, responsible: Auth.getUser()?.name || 'Sistema'
        };
        const res = await fetch('/api/career', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (res.ok) { window.closeProModal(); refreshCurrentEmployee(); }
    };
    modal.classList.remove('hidden');
};

window.openBonusModal = () => {
    if (!currentEmployeeData) {
        alert('Selecione um colaborador primeiro.');
        return;
    }
    const modal = document.getElementById('pro-modal-container');
    const content = document.getElementById('pro-modal-content');
    content.innerHTML = `
        <div class="bg-amber-500 p-8 text-white"><h3 class="text-xl font-black uppercase italic">Registrar Bonificação / Mérito</h3></div>
        <form id="bonus-form" class="p-10 space-y-6">
            <div><label class="pro-label">Valor do Bônus (Pagamento Único)</label><input id="b-salary" class="pro-input font-black text-amber-700" oninput="window.formatCurrencyInput(event)"></div>
            <div><label class="pro-label">Motivo do Reconhecimento</label><input id="b-reason" class="pro-input" placeholder="Ex: Meta batida, Destaque do mês"></div>
            <div><label class="pro-label">Descrição Detalhada</label><textarea id="b-obs" class="pro-input h-20"></textarea></div>
            <div class="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <p class="text-[9px] font-bold text-amber-700 uppercase">Nota: Este valor será registrado apenas como histórico e não alterará o salário base do colaborador.</p>
            </div>
            <button type="submit" class="w-full bg-nordeste-black text-white py-4 rounded-2xl font-black uppercase shadow-xl">Gravar no Prontuário</button>
            <button type="button" onclick="window.closeProModal()" class="w-full text-gray-400 font-black text-[10px] mt-2 uppercase">Cancelar</button>
        </form>
    `;
    document.getElementById('bonus-form').onsubmit = async (e) => {
        e.preventDefault();
        const now = new Date();
        const preciseDate = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0');

        // Mantemos os dados atuais de cargo/setor para consistência do registro
        const payload = {
            employeeId: selectedId, move_type: 'Bonificação / Mérito',
            role: currentEmployeeData.role, sector: currentEmployeeData.sector, cbo: currentEmployeeData.cbo,
            salary: document.getElementById('b-salary').value, date: preciseDate,
            observation: document.getElementById('b-reason').value + ': ' + document.getElementById('b-obs').value,
            responsible: Auth.getUser()?.name || 'Sistema'
        };
        const res = await fetch('/api/career', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (res.ok) { window.closeProModal(); refreshCurrentEmployee(); }
    };
    modal.classList.remove('hidden');
};

window.openOccurrenceModal = () => {
    if (!currentEmployeeData) {
        alert('Selecione um colaborador primeiro.');
        return;
    }
    const modal = document.getElementById('pro-modal-container');
    const content = document.getElementById('pro-modal-content');
    content.innerHTML = `
        <div class="bg-nordeste-red p-8 text-white"><h3 class="text-xl font-black uppercase italic">Registrar Ocorrência Disciplinar</h3></div>
        <form id="occ-form" class="p-10 space-y-6">
            <div><label class="pro-label">Tipo de Medida</label><select id="o-type" class="pro-input font-bold"><option>Advertência Verbal</option><option>Advertência Escrita</option><option>Suspensão</option><option>Justa Causa (Desligamento)</option></select></div>
            <div><label class="pro-label">Motivo Principal</label><input id="o-reason" class="pro-input" placeholder="Ex: Atraso recorrente, Indisciplina..."></div>
            <div><label class="pro-label">Detalhamento</label><textarea id="o-obs" class="pro-input h-20"></textarea></div>
            <button type="submit" class="w-full bg-nordeste-black text-white py-4 rounded-2xl font-black uppercase shadow-xl">Gravar Ocorrência</button>
            <button type="button" onclick="window.closeProModal()" class="w-full text-gray-400 font-black text-[10px] mt-2 uppercase">Cancelar</button>
        </form>
    `;
    document.getElementById('occ-form').onsubmit = async (e) => {
        e.preventDefault();
        const now = new Date();
        const preciseDate = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0');
        const payload = {
            employeeId: selectedId, type: document.getElementById('o-type').value,
            date: preciseDate, reason: document.getElementById('o-reason').value,
            observation: document.getElementById('o-obs').value, responsible: Auth.getUser()?.name || 'Sistema'
        };
        const res = await fetch('/api/occurrences', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (res.ok) { window.closeProModal(); refreshCurrentEmployee(); }
    };
    modal.classList.remove('hidden');
};

window.formatCurrencyInput = formatCurrencyInput;
window.closeProModal = () => document.getElementById('pro-modal-container').classList.add('hidden');
