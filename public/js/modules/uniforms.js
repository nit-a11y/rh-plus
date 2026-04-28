
import { state, getRefresher } from '../state.js';
import { formatarDataHoraBR } from '../utils.js';

function calculateNextExchange(lastExchange, role) {
    const duration = (role === 'OP' || role === 'ASD') ? 6 : 12;
    const date = new Date(lastExchange);
    date.setMonth(date.getMonth() + duration);
    return date.toISOString().split('T')[0];
}

function getUniformStatus(nextDate) {
    const today = new Date();
    const target = new Date(nextDate);
    const diffTime = target.getTime() - today.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Vencida';
    if (days <= 30) return 'Próximo do vencimento';
    return 'Em dia';
}

function getItemStyles(color) {
    switch(color) {
        case 'Vermelha': return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
        case 'Preta': return { bg: 'bg-gray-800', text: 'text-white', border: 'border-gray-700' };
        case 'Azul': return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
        case 'Jeans': return { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' };
        default: return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' };
    }
}

function getStatusBadge(status) {
    switch (status) {
        case 'Em dia': return `<span class="badge badge-success">OK</span>`;
        case 'Próximo do vencimento': return `<span class="badge badge-warning">Atenção</span>`;
        case 'Vencida': return `<span class="badge badge-danger">Vencido</span>`;
        default: return `<span class="badge badge-neutral">${status}</span>`;
    }
}

export function renderUniformsTab(emp) {
    const grid = document.getElementById('items-grid');
    if (!grid) return; 
    grid.innerHTML = '';
    
    if (emp.items.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full p-12 bg-white rounded-[2.5rem] border border-dashed border-gray-200 flex flex-col items-center text-center text-gray-400">
                <svg class="w-12 h-12 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                <p class="font-black uppercase text-xs tracking-widest italic">Nenhum item ativo vinculado.</p>
            </div>`;
    } else {
        emp.items.forEach(item => {
            const style = getItemStyles(item.color);
            const isExpired = item.status === 'Vencida';
            const card = document.createElement('div');
            card.className = "card bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl hover:border-nordeste-red transition-all group border border-gray-100";
            card.innerHTML = `
                <div class="h-2 ${style.bg} ${style.border}"></div>
                <div class="p-6">
                    <div class="flex justify-between items-start mb-4">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 rounded-2xl flex items-center justify-center ${style.bg} ${style.text} shadow-inner border ${style.border}"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-width="2.5" d="M20.38 3.46 16 2 13 3h-2L7 2 2.62 3.46a2 2 0 0 0-1.09 1.19l-1.2 6A2 2 0 0 0 3.61 12.91l.82 4.16A2 2 0 0 0 6.42 19l1.09 5.55A2 2 0 0 0 9.5 26h5a2 2 0 0 0 1.99-1.45l1.09-5.55a2 2 0 0 0 1.99-1.93l.82-4.16a2 2 0 0 0 3.28-2.26l-1.2-6a2 2 0 0 0-1.09-1.19z"/></svg></div>
                            <div>
                                <h4 class="font-black text-gray-800 text-sm uppercase italic">${item.type}</h4>
                                <p class="text-[9px] text-gray-400 font-black uppercase tracking-widest">${item.color} • Tam ${item.size}</p>
                            </div>
                        </div>
                        ${getStatusBadge(item.status)}
                    </div>
                    <div class="bg-gray-50 rounded-2xl p-4 text-[10px] mb-5 border border-gray-100 space-y-2">
                        <div class="flex justify-between font-bold"><span class="text-gray-400 uppercase">Entrega</span><span class="text-gray-700">${new Date(item.dateGiven).toLocaleDateString('pt-BR')}</span></div>
                        <div class="flex justify-between font-black"><span class="text-gray-400 uppercase">Limite</span><span class="${isExpired ? 'text-red-600' : 'text-gray-800'}">${new Date(item.nextExchangeDate).toLocaleDateString('pt-BR')}</span></div>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <button onclick="window.modules.uniforms.openExchangeModal('${item.id}')" class="bg-nordeste-red text-white py-3 rounded-xl font-black text-[9px] uppercase shadow-md transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2">Trocar</button>
                        <button onclick="window.modules.uniforms.openReturnModal('${item.id}')" class="bg-white text-gray-400 border border-gray-200 py-3 rounded-xl font-black text-[9px] uppercase transition-all hover:text-red-600 active:scale-95">Devolver</button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    }
    renderHistory(emp);
}

function renderHistory(emp) {
    const historyBody = document.getElementById('history-table-body');
    if (!historyBody) return;
    historyBody.innerHTML = '';
    
    if (!emp.history || emp.history.length === 0) {
        historyBody.innerHTML = `<tr><td colspan="5" class="p-10 text-center text-gray-300 text-[10px] font-black uppercase italic opacity-50">Sem histórico de movimentação registrado.</td></tr>`;
    } else {
        emp.history.forEach(h => {
            const tr = document.createElement('tr');
            tr.className = "hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-0";
            
            let icon = '📦';
            let typeClass = 'text-gray-500';
            const tipoMov = h.tipo_movimentacao || '';
            
            if (tipoMov.includes('TROCA')) { icon = '🔄'; typeClass = 'text-blue-600 font-black'; }
            else if (tipoMov.includes('RECEBIMENTO')) { icon = '✅'; typeClass = 'text-green-600 font-black'; }
            else if (tipoMov.includes('DEVOLUÇÃO')) { icon = '↩️'; typeClass = 'text-nordeste-red font-black'; }

            tr.innerHTML = `
                <td class="py-4 pl-4"><div class="font-mono text-[9px] text-gray-400 font-bold">${formatarDataHoraBR(h.data_hora)}</div></td>
                <td class="text-[10px] font-black text-gray-800 uppercase italic">${h.type || 'Item'} <span class="text-gray-400 font-bold not-italic">(${h.color || '-'})</span></td>
                <td class="text-[9px] uppercase font-black ${typeClass}">${icon} ${tipoMov}</td>
                <td class="text-[9px] text-gray-500 font-bold italic">${h.observacao || ''}</td>
                <td class="text-[8px] text-gray-300 font-black uppercase pr-4 text-right">${h.responsavel || 'Sistema'}</td>
            `;
            historyBody.appendChild(tr);
        });
    }
}

let currentItemExchangeId = null;
let currentItemReturnId = null;

export const openExchangeModal = (itemId) => {
    currentItemExchangeId = itemId;
    const modal = document.getElementById('modal-exchange');
    if (!modal) return;
    document.getElementById('exchange-obs').value = '';
    document.getElementById('exchange-returned').checked = true;
    window.setExchangeType('Tempo'); 
    modal.classList.remove('hidden-custom');
};

export const closeExchangeModal = () => document.getElementById('modal-exchange').classList.add('hidden-custom');

export const submitExchange = async (e) => {
    e.preventDefault();
    if (!currentItemExchangeId) return;
    const { loadData, renderApp } = getRefresher(); 
    const type = document.getElementById('modal-exchange').dataset.type || 'Tempo';
    const reason = document.getElementById('exchange-reason').value;
    const obs = document.getElementById('exchange-obs').value;
    const returnedOld = document.getElementById('exchange-returned').checked;
    
    const emp = state.selectedEmployee;
    const today = new Date().toISOString().split('T')[0];
    const nextDate = calculateNextExchange(today, emp.type);
    const status = getUniformStatus(nextDate);
    
    const payload = { 
        itemId: currentItemExchangeId, 
        date: today, 
        nextExchangeDate: nextDate, 
        status: status, 
        reason: type === 'Tempo' ? 'Desgaste Natural' : reason, 
        observation: obs, 
        responsible: state.user ? state.user.name : 'Admin RH' 
    };

    const res = await fetch('/api/exchange', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
    });

    if (res.ok) {
        await loadData();
        state.selectedEmployee = state.employees.find(e => e.id === emp.id);
        renderApp(); 
        closeExchangeModal();
    }
};

export const openReturnModal = (itemId) => {
    currentItemReturnId = itemId;
    const modal = document.getElementById('modal-return');
    if(!modal) return;
    document.getElementById('return-obs').value = '';
    modal.classList.remove('hidden-custom');
}

export const closeReturnModal = () => document.getElementById('modal-return').classList.add('hidden-custom');

export const submitReturn = async (e) => {
    e.preventDefault();
    if (!currentItemReturnId) return;
    const { loadData, renderApp } = getRefresher();
    const payload = { 
        itemId: currentItemReturnId, 
        reason: document.getElementById('return-reason').value, 
        observation: document.getElementById('return-obs').value, 
        responsible: state.user ? state.user.name : 'Admin RH' 
    };
    const res = await fetch('/api/return', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
    });

    if (res.ok) {
        await loadData();
        if (state.selectedEmployee) state.selectedEmployee = state.employees.find(e => e.id === state.selectedEmployee.id);
        renderApp();
        closeReturnModal();
    }
}
