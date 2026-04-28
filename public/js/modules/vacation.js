
import { state, getRefresher } from '../state.js';

export function renderVacationView() {
    const container = document.getElementById('view-vacation');
    if (!container) return;

    container.innerHTML = `
        <div class="space-y-6">
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center">
                <div>
                    <h2 class="text-2xl font-bold text-gray-800">🌴 Gestão de Férias</h2>
                    <p class="text-sm text-gray-500">Regra: 18 meses de carência + Janela de 6 meses.</p>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="card p-4 border-l-4 border-gray-400">
                    <p class="text-[10px] font-bold text-gray-400 uppercase">Em Carência</p>
                    <h4 id="vac-stat-care" class="text-2xl font-black">0</h4>
                </div>
                <div class="card p-4 border-l-4 border-yellow-500">
                    <p class="text-[10px] font-bold text-gray-400 uppercase">Janela Aberta</p>
                    <h4 id="vac-stat-open" class="text-2xl font-black">0</h4>
                </div>
                <div class="card p-4 border-l-4 border-blue-500">
                    <p class="text-[10px] font-bold text-gray-400 uppercase">Aguardando Aprovação</p>
                    <h4 id="vac-stat-wait" class="text-2xl font-black">0</h4>
                </div>
                <div class="card p-4 border-l-4 border-red-600">
                    <p class="text-[10px] font-bold text-gray-400 uppercase">Férias Vencidas</p>
                    <h4 id="vac-stat-expired" class="text-2xl font-black">0</h4>
                </div>
            </div>

            <div class="card p-6">
                <div class="table-container">
                    <table class="styled-table w-full">
                        <thead>
                            <tr>
                                <th>Colaborador</th>
                                <th>Liberação</th>
                                <th>Limite Máx.</th>
                                <th class="text-center">Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody id="vacation-table-body"></tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    updateVacationList();
}

async function updateVacationList() {
    const tbody = document.getElementById('vacation-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    let stats = { care: 0, open: 0, wait: 0, expired: 0 };
    const today = new Date();

    for (const emp of state.employees) {
        const res = await fetch(`/api/vacation/${emp.id}`);
        let vac = await res.json();

        // Se não existir registro, simula o inicial baseado na admissão
        if (!vac) {
            const adm = new Date(emp.admissionDate);
            const elig = new Date(adm); elig.setMonth(elig.getMonth() + 18);
            const limit = new Date(elig); limit.setMonth(limit.getMonth() + 6);
            
            let simStatus = 'EM CARÊNCIA';
            if (today > limit) simStatus = 'VENCIDO';
            else if (today > elig) simStatus = 'JANELA ABERTA';

            vac = { 
                eligibility_date: elig.toISOString().split('T')[0], 
                limit_date: limit.toISOString().split('T')[0],
                status: simStatus 
            };
        }

        // Stats
        if (vac.status === 'EM CARÊNCIA') stats.care++;
        else if (vac.status === 'JANELA ABERTA' || vac.status === 'LIBERADO') stats.open++;
        else if (vac.status.includes('AGUARDANDO')) stats.wait++;
        else if (vac.status === 'VENCIDO') stats.expired++;

        const tr = document.createElement('tr');
        const statusClass = getStatusClass(vac.status);

        tr.innerHTML = `
            <td>
                <div class="font-bold text-xs text-gray-800">${emp.name}</div>
                <div class="text-[10px] text-gray-400">Adm: ${new Date(emp.admissionDate).toLocaleDateString('pt-BR')}</div>
            </td>
            <td class="text-xs font-mono">${new Date(vac.eligibility_date).toLocaleDateString('pt-BR')}</td>
            <td class="text-xs font-mono text-red-600 font-bold">${new Date(vac.limit_date).toLocaleDateString('pt-BR')}</td>
            <td class="text-center"><span class="badge ${statusClass}">${vac.status}</span></td>
            <td>
                <button onclick="window.modules.vacation.openPlanModal('${emp.id}')" class="btn btn-secondary btn-sm">Planejar</button>
            </td>
        `;
        tbody.appendChild(tr);
    }

    document.getElementById('vac-stat-care').innerText = stats.care;
    document.getElementById('vac-stat-open').innerText = stats.open;
    document.getElementById('vac-stat-wait').innerText = stats.wait;
    document.getElementById('vac-stat-expired').innerText = stats.expired;
}

function getStatusClass(s) {
    if (s.includes('CARÊNCIA')) return 'badge-neutral';
    if (s.includes('AGUARDANDO')) return 'badge-warning';
    if (s.includes('APROVADO') || s.includes('GOZO')) return 'badge-success';
    return 'badge-danger';
}

export function openPlanModal(empId) {
    alert("Interface de Planejamento Nordeste:\n\nModelos Disponíveis:\n1. 30 Dias Corridos\n2. 20 + 10 (Venda)\n3. 15 + 15\n4. 20 + 10 (Fracionado)\n\nO sistema validará automaticamente se a soma dos dias é igual a 30 e se está dentro da janela de gozo permitida.");
}
