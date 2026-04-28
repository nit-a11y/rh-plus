
import { state, setState } from '../state.js';
import { formatCurrency, initInputMasks } from '../utils.js';

export const GoalsModule = {
    async init() {
        // Inicialização se necessário
    },

    async openCreateGoalModal() {
        const modal = document.getElementById('pro-modal-container');
        const res = await fetch('/api/companies');
        const companies = await res.json();

        const employers = companies.filter(c => c.type !== 'Unidade');
        const units = companies.filter(c => c.type === 'Unidade');

        document.getElementById('pro-modal-content').innerHTML = `
            <div class="bg-nordeste-black p-8 text-white">
                <h3 class="text-xl font-black uppercase italic">Criar Nova Meta Administrativa</h3>
            </div>
            <div class="p-10 space-y-5">
                <div>
                    <label class="pro-label">Título da Meta</label>
                    <input id="goal-title" class="pro-input uppercase" placeholder="Ex: Auditoria Geral 2024" data-mask="text">
                </div>
                <div>
                    <label class="pro-label">Descrição</label>
                    <textarea id="goal-desc" class="pro-input h-24 uppercase" placeholder="Objetivo da meta..."></textarea>
                </div>
                <div>
                    <label class="pro-label">Alvo da Meta (Empresa ou Unidade)</label>
                    <select id="goal-target" class="pro-input font-bold">
                        <option value="all">-- TODOS OS REGISTROS (GERAL) --</option>
                        <optgroup label="EMPREGADORES (Legal)">
                            ${employers.map(c => `<option value="employer:${c.id}">${c.name}</option>`).join('')}
                        </optgroup>
                        <optgroup label="UNIDADES (Operacional)">
                            ${units.map(c => `<option value="unit:${c.id}">${c.name}</option>`).join('')}
                        </optgroup>
                    </select>
                </div>
                <div>
                    <label class="pro-label">Prazo Final</label>
                    <input type="date" id="goal-deadline" class="pro-input">
                </div>
                <button onclick="window.GoalsModule.saveGoal()" class="w-full bg-nordeste-red text-white py-4 rounded-2xl font-black uppercase shadow-xl hover:scale-105 transition-transform">Lançar Meta e Gerar Demandas</button>
            </div>
        `;
        initInputMasks(document.getElementById('pro-modal-content'));
        modal.classList.remove('hidden');
    },

    async saveGoal() {
        const user = Auth.getUser();
        const targetValue = document.getElementById('goal-target').value;
        const payload = {
            title: document.getElementById('goal-title').value,
            description: document.getElementById('goal-desc').value,
            target_company_id: targetValue,
            target_date: document.getElementById('goal-deadline').value,
            created_by: user.name || user.username
        };

        if (!payload.title || !payload.target_date) return alert("Preencha o título e o prazo!");

        try {
            const res = await fetch('/api/goals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                alert(`Meta criada! ${data.records_count} demandas geradas.`);
                document.getElementById('pro-modal-container').classList.add('hidden');
                if (window.location.pathname.includes('dashboard.html')) {
                    location.reload();
                }
            }
        } catch (e) {
            alert("Erro ao salvar meta.");
        }
    },

    async markDemandAsDone(demandId) {
        if (!confirm("Confirmar conclusão desta demanda?")) return;

        try {
            const res = await fetch(`/api/demands/${demandId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'Concluída' })
            });

            if (res.ok) {
                alert("Demanda concluída!");
                location.reload();
            }
        } catch (e) {
            alert("Erro ao atualizar status.");
        }
    }
};

window.GoalsModule = GoalsModule;
