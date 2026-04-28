
import { state, getRefresher } from '../state.js';

export function renderAsoView() {
    const container = document.getElementById('view-aso');
    if (!container) return;

    container.innerHTML = `
        <div class="space-y-6">
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center">
                <div>
                    <h2 class="text-2xl font-bold text-gray-800">🩺 Saúde Ocupacional</h2>
                    <p class="text-sm text-gray-500">Monitoramento de exames ASO e conformidade legal.</p>
                </div>
                <div class="flex gap-4">
                    <div class="text-center px-4 border-r">
                        <span id="aso-stat-ok" class="block text-2xl font-bold text-green-600">0</span>
                        <span class="text-[10px] uppercase font-bold text-gray-400">Em Dia</span>
                    </div>
                    <div class="text-center px-4 border-r">
                        <span id="aso-stat-warning" class="block text-2xl font-bold text-yellow-600">0</span>
                        <span class="text-[10px] uppercase font-bold text-gray-400">Vencendo</span>
                    </div>
                    <div class="text-center px-4">
                        <span id="aso-stat-expired" class="block text-2xl font-bold text-red-600">0</span>
                        <span class="text-[10px] uppercase font-bold text-gray-400">Vencidos</span>
                    </div>
                </div>
            </div>

            <div class="card p-6">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="font-bold text-gray-800">Monitoramento de ASO</h3>
                    <input type="text" id="aso-search" placeholder="Buscar colaborador..." class="input-field w-64 text-sm" oninput="window.modules.aso.filterAso()">
                </div>
                <div class="table-container">
                    <table class="styled-table w-full">
                        <thead>
                            <tr>
                                <th>Colaborador</th>
                                <th>Último Exame</th>
                                <th>Validade</th>
                                <th class="text-center">Status</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody id="aso-table-body"></tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    updateAsoList();
}

async function updateAsoList() {
    const tbody = document.getElementById('aso-table-body');
    const search = document.getElementById('aso-search')?.value.toLowerCase() || '';
    if (!tbody) return;

    tbody.innerHTML = '';
    let stats = { ok: 0, warning: 0, expired: 0 };

    const today = new Date();

    for (const emp of state.employees) {
        const res = await fetch(`/api/aso/${emp.id}`);
        const records = await res.json();
        const last = records[0] || null;
        
        let status = 'Vencido';
        let statusClass = 'badge-danger';
        
        if (last) {
            const valDate = new Date(last.validity_date);
            const diffDays = Math.ceil((valDate - today) / (1000 * 60 * 60 * 24));
            
            if (diffDays < 0) {
                status = 'Vencido';
                statusClass = 'badge-danger';
                stats.expired++;
            } else if (diffDays <= 45) {
                status = 'Vencendo';
                statusClass = 'badge-warning';
                stats.warning++;
            } else {
                status = 'Em Dia';
                statusClass = 'badge-success';
                stats.ok++;
            }
        } else {
            stats.expired++;
        }

        if (emp.name.toLowerCase().includes(search) || emp.registrationNumber.includes(search)) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div class="flex items-center gap-3">
                        <img src="${emp.photoUrl}" class="w-8 h-8 rounded-full object-cover border border-gray-200">
                        <div>
                            <div class="font-bold text-gray-800 text-xs">${emp.name}</div>
                            <div class="text-[10px] text-gray-400 font-mono">${emp.registrationNumber}</div>
                        </div>
                    </div>
                </td>
                <td class="text-xs text-gray-600">${last ? new Date(last.date).toLocaleDateString('pt-BR') : 'N/A'}</td>
                <td class="text-xs font-mono font-bold">${last ? new Date(last.validity_date).toLocaleDateString('pt-BR') : 'N/A'}</td>
                <td class="text-center"><span class="badge ${statusClass}">${status}</span></td>
                <td class="text-right">
                    <button onclick="window.modules.aso.registerNew('${emp.id}')" class="btn btn-outline btn-sm">Atualizar</button>
                </td>
            `;
            tbody.appendChild(tr);
        }
    }

    document.getElementById('aso-stat-ok').innerText = stats.ok;
    document.getElementById('aso-stat-warning').innerText = stats.warning;
    document.getElementById('aso-stat-expired').innerText = stats.expired;
}

export function filterAso() {
    updateAsoList();
}

export function registerNew(empId) {
    const date = prompt("Data do Exame (AAAA-MM-DD):", new Date().toISOString().split('T')[0]);
    if (!date) return;

    fetch('/api/aso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            employeeId: empId,
            date: date,
            type: 'Periódico',
            observation: 'Registro via Módulo ASO',
            responsible: state.user.name
        })
    }).then(() => {
        alert('ASO atualizado com sucesso!');
        updateAsoList();
    });
}
