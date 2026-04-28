
import { state, getRefresher } from '../state.js';
import { formatCurrency } from '../utils.js';

export function renderOccurrencesTab(emp) {
    const occTimeline = document.getElementById('occurrences-timeline');
    if (!occTimeline) return;
    
    occTimeline.innerHTML = `
        <div class="flex justify-between items-center mb-8">
            <div>
                <h3 class="text-xl font-black text-gray-800 uppercase italic">Registro Disciplinar & Mérito</h3>
                <p class="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Timeline de Conduta e Reconhecimento</p>
            </div>
            <button onclick="window.modules.occurrences.openOccurrenceModal()" class="bg-nordeste-black text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase shadow-xl hover:scale-105 transition-all">+ Registrar Evento</button>
        </div>
    `;
    
    const totalOccurrences = emp.occurrences ? emp.occurrences.length : 0;
    
    if (totalOccurrences === 0) {
        occTimeline.innerHTML += `<div class="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-gray-200"><p class="text-gray-400 font-black uppercase text-[10px] tracking-widest opacity-50">Ficha Limpa • Sem registros disciplinares ou premiações</p></div>`;
        return;
    }

    const listContainer = document.createElement('div');
    listContainer.className = "space-y-8 relative pl-10 border-l-2 border-gray-100 ml-5 pb-8";
    occTimeline.appendChild(listContainer);

    emp.occurrences.forEach((occ) => {
        let theme = { border: 'border-gray-100', bg: 'bg-white', icon: '📝', accent: 'text-gray-500', label: 'REGISTRO' };
        
        if (occ.type.includes('Verbal')) theme = { border: 'border-yellow-200', bg: 'bg-yellow-50/30', icon: '📢', accent: 'text-yellow-600', label: 'ADVERTÊNCIA' };
        else if (occ.type.includes('Escrito')) theme = { border: 'border-orange-300', bg: 'bg-orange-50/40', icon: '📝', accent: 'text-orange-600', label: 'ADVERTÊNCIA' };
        else if (occ.type.includes('Suspensão')) theme = { border: 'border-red-400', bg: 'bg-red-50/40', icon: '🛑', accent: 'text-red-700', label: 'PUNITIVA' };
        else if (occ.type.includes('Justa Causa')) theme = { border: 'border-black', bg: 'bg-gray-100', icon: '⚖️', accent: 'text-gray-900', label: 'RESCISÓRIA' };
        else if (occ.type.includes('Premiação') || occ.type.includes('Melhor')) theme = { border: 'border-amber-400', bg: 'bg-gradient-to-br from-white to-amber-50', icon: '🏆', accent: 'text-amber-600', label: 'MÉRITO / RECONHECIMENTO' };

        const item = document.createElement('div');
        item.className = `relative animate-fade-in`;
        item.innerHTML = `
            <div class="absolute -left-[61px] top-1 w-12 h-12 rounded-[1rem] bg-white border-2 ${theme.border} flex items-center justify-center text-xl z-10 shadow-sm">${theme.icon}</div>
            <div class="card ${theme.bg} p-8 border-2 ${theme.border} hover:shadow-xl transition-all rounded-[2.5rem]">
                <div class="flex justify-between items-start mb-6">
                    <div>
                        <span class="text-[9px] font-black uppercase tracking-[0.2em] ${theme.accent}">${theme.label}</span>
                        <h4 class="font-black text-gray-800 text-lg uppercase italic mt-1 leading-none">${occ.type}</h4>
                    </div>
                    <span class="text-[10px] font-mono font-bold text-gray-400 bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm">${new Date(occ.date).toLocaleDateString('pt-BR')}</span>
                </div>
                <div class="bg-white/80 p-5 rounded-2xl border border-gray-100 mb-2 shadow-inner">
                    <p class="text-sm text-gray-700 font-bold leading-relaxed uppercase italic">${occ.reason}</p>
                </div>
                ${occ.observation ? `<p class="text-[11px] text-gray-500 italic mt-4 border-t pt-4 border-gray-100/50 leading-relaxed">"${occ.observation}"</p>` : ''}
                <div class="mt-6 flex justify-between items-center">
                    <div class="flex gap-2">
                        ${occ.type.includes('Premiação') ? `<span class="bg-amber-600 text-white text-[8px] font-black px-3 py-1 rounded-full animate-pulse shadow-lg">DESTAQUE DO MÊS</span>` : ''}
                    </div>
                    <p class="text-[8px] text-gray-300 font-black uppercase tracking-widest italic">Registrador: ${occ.responsible}</p>
                </div>
            </div>
        `;
        listContainer.appendChild(item);
    });
}

export const openOccurrenceModal = () => document.getElementById('modal-new-occurrence').classList.remove('hidden-custom');
export const closeOccurrenceModal = () => document.getElementById('modal-new-occurrence').classList.add('hidden-custom');

export const submitOccurrence = async (e) => {
    e.preventDefault();
    if (!state.selectedEmployee) return;
    
    const { loadData, renderApp } = getRefresher();
    
    const bonusEl = document.getElementById('occ-bonus');
    const bonus = bonusEl ? bonusEl.value : "";
    const observation = document.getElementById('occ-obs').value;
    const finalObs = bonus ? `${observation} [BONIFICAÇÃO: ${bonus}]` : observation;

    const payload = {
        employeeId: state.selectedEmployee.id,
        type: document.getElementById('occ-type').value,
        date: document.getElementById('occ-date').value,
        reason: document.getElementById('occ-reason').value,
        observation: finalObs,
        responsible: state.user ? state.user.name : 'Admin RH'
    };

    try {
        const res = await fetch('/api/occurrences', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(payload) 
        });

        if (res.ok) {
            await loadData();
            state.selectedEmployee = state.employees.find(e => e.id === state.selectedEmployee.id);
            renderApp();
            closeOccurrenceModal();
        } else {
            alert('Erro ao salvar ocorrência.');
        }
    } catch (err) {
        console.error(err);
        alert('Falha de conexão ao registrar ocorrência.');
    }
};
