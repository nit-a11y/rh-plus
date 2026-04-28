
import { formatCurrency } from '../utils.js';
import { DateFixer } from '../date-fixer.js';

let fullData = { employees: [], vacations: [], events: [], promotions: [] };
let viewDate = new Date();
// Garantir que começamos no dia 1 para evitar bugs de transição de mês
viewDate.setDate(1);

let activeFilters = ['birthday', 'anniversary', 'vacation', 'event', 'promotion'];

document.addEventListener('DOMContentLoaded', init);

async function init() {
    setupFilterControls();
    await loadData();
    render();
}

async function loadData() {
    try {
        const res = await fetch('/api/human-center/summary');
        fullData = await res.json();
    } catch (e) { console.error("Erro ao carregar dados:", e); }
}

function setupFilterControls() {
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const mSel = document.getElementById('filter-month');
    const ySel = document.getElementById('filter-year');

    mSel.innerHTML = months.map((m, i) => `<option value="${i}" ${i === viewDate.getMonth() ? 'selected' : ''}>${m}</option>`).join('');
    for (let y = 2024; y <= 2030; y++) {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        if (y === viewDate.getFullYear()) opt.selected = true;
        ySel.appendChild(opt);
    }

    mSel.onchange = (e) => { viewDate.setMonth(parseInt(e.target.value)); render(); };
    ySel.onchange = (e) => { viewDate.setFullYear(parseInt(e.target.value)); render(); };

    document.querySelectorAll('.filter-item').forEach(item => {
        item.onclick = () => {
            const type = item.dataset.type;
            if (activeFilters.includes(type)) {
                activeFilters = activeFilters.filter(f => f !== type);
                item.classList.remove('active');
            } else {
                activeFilters.push(type);
                item.classList.add('active');
            }
            render();
        };
    });
}

window.prevMonth = () => { viewDate.setMonth(viewDate.getMonth() - 1); updateSelectors(); render(); };
window.nextMonth = () => { viewDate.setMonth(viewDate.getMonth() + 1); updateSelectors(); render(); };

function updateSelectors() {
    document.getElementById('filter-month').value = viewDate.getMonth();
    document.getElementById('filter-year').value = viewDate.getFullYear();
}

function render() {
    renderCalendar();
    renderTodayList();
    renderPromotions();
}

function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    const title = document.getElementById('calendar-title');
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    title.innerText = `Calendário de ${months[viewDate.getMonth()]} ${viewDate.getFullYear()}`;
    grid.innerHTML = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => `<div class="calendar-day-head">${d}</div>`).join('');

    const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const lastDay = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const totalDays = lastDay.getDate();

    // Dias do mês anterior (padding)
    const prevMonthLastDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
        grid.innerHTML += `<div class="calendar-cell other-month"><span class="day-number">${prevMonthLastDay - i}</span></div>`;
    }

    // Dias do mês atual
    for (let d = 1; d <= totalDays; d++) {
        const currentDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), d);
        const isToday = currentDate.toDateString() === new Date().toDateString();
        const cell = document.createElement('div');
        cell.className = `calendar-cell ${isToday ? 'today' : ''}`;
        cell.innerHTML = `<span class="day-number">${d}</span>`;

        const dayEvents = getEventsForDate(currentDate);
        dayEvents.forEach(ev => {
            if (!activeFilters.includes(ev.type)) return;
            const pill = document.createElement('div');
            pill.className = `event-dot dot-${ev.type}`;
            pill.innerHTML = `<span class="flex-shrink-0">${ev.emoji}</span> <span class="truncate">${ev.title}</span>`;
            pill.onclick = (e) => { e.stopPropagation(); openEventDetail(ev); };
            cell.appendChild(pill);
        });
        grid.appendChild(cell);
    }

    // Dias do mês seguinte (padding para fechar a grade)
    const remainingCells = 42 - (startDayOfWeek + totalDays);
    for (let i = 1; i <= (remainingCells % 7 === remainingCells ? remainingCells : remainingCells % 7); i++) {
        // Apenas para fechar a linha se necessário, ou preencher até 42 (6 semanas)
    }
}

function getEventsForDate(date) {
    const events = [];
    const dStr = date.getDate().toString().padStart(2, '0');
    const mStr = (date.getMonth() + 1).toString().padStart(2, '0');
    const yStr = date.getFullYear();
    const fullDateStr = `${yStr}-${mStr}-${dStr}`;

    // Segurança contra datas nulas (BUG FIX: e.admissionDate?.split)
    fullData.employees.forEach(e => {
        if (e.birthDate && e.birthDate.includes(`-${mStr}-${dStr}`)) {
            events.push({ title: e.name.split(' ')[0], emoji: '🎂', type: 'birthday', data: e });
        }

        if (e.admissionDate && e.admissionDate.includes(`-${mStr}-${dStr}`)) {
            const parts = e.admissionDate.split('-');
            const years = yStr - parseInt(parts[0]);
            if (years > 0) events.push({ title: `${years} ANOS`, emoji: '🏠', type: 'anniversary', data: e, years });
        }
    });

    fullData.vacations.forEach(v => {
        if (!v.start_date || !v.return_date) return;
        const start = new Date(v.start_date);
        const end = new Date(v.return_date);
        // Normalizar horas para comparação justa
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        if (checkDate >= start && checkDate <= end) {
            events.push({ title: v.employee_name.split(' ')[0], emoji: '🏖️', type: 'vacation', data: v });
        }
    });

    fullData.promotions.forEach(p => {
        if (p.date === fullDateStr) {
            events.push({ title: p.emp_name.split(' ')[0], emoji: '🚀', type: 'promotion', data: p });
        }
    });

    fullData.events.forEach(ev => {
        if (ev.date === fullDateStr) {
            events.push({ ...ev, emoji: '🎯', type: 'event' });
        }
    });

    return events;
}

function renderTodayList() {
    const list = document.getElementById('today-list');
    const label = document.getElementById('today-date-label');
    const today = new Date();
    label.innerText = today.toLocaleDateString('pt-BR');

    const evs = getEventsForDate(today);
    list.innerHTML = '';

    if (evs.length === 0) {
        list.innerHTML = `<div class="py-10 text-center text-gray-400 italic font-bold">Nenhuma comemoração oficial para hoje.</div>`;
        return;
    }

    evs.forEach(ev => {
        const card = document.createElement('div');
        card.className = 'human-card animate-pop';
        card.onclick = () => openEventDetail(ev);
        card.innerHTML = `
            <div class="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner">${ev.emoji}</div>
            <div class="min-w-0 flex-1">
                <p class="text-[8px] font-black text-nordeste-red uppercase tracking-widest">${ev.type.toUpperCase()}</p>
                <h4 class="font-black text-gray-800 uppercase text-xs truncate">${ev.title}</h4>
            </div>
            <div class="flex gap-2">
                <div class="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.483 8.412-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.308 1.655zm6.24-3.328c1.554.921 3.21 1.403 4.933 1.403 5.403 0 9.8-4.398 9.802-9.8.001-2.618-1.019-5.079-2.872-6.932-1.851-1.852-4.311-2.871-6.93-2.871-5.404 0-9.802 4.398-9.802 9.8 0 1.761.474 3.479 1.373 5.013l-1.03 3.757 3.858-1.012zm11.396-10.421c-.301-.151-1.782-.879-2.057-.979-.275-.1-.475-.151-.675.151-.199.301-.775.979-.95 1.179-.175.2-.351.226-.652.076-.301-.151-1.269-.467-2.418-1.492-.893-.796-1.496-1.78-1.672-2.08-.175-.3-.019-.463.13-.613.135-.134.301-.351.451-.526.15-.176.2-.301.3-.501.1-.2.05-.376-.025-.526-.075-.151-.675-1.628-.925-2.228-.243-.584-.489-.505-.675-.514-.175-.008-.376-.01-.576-.01s-.526.075-.801.376c-.275.301-1.052 1.028-1.052 2.508s1.077 2.908 1.227 3.109c.151.2 2.119 3.235 5.132 4.534.717.309 1.277.493 1.714.633.721.228 1.376.196 1.895.119.578-.085 1.782-.728 2.032-1.43.25-.701.25-1.303.175-1.43-.075-.125-.275-.201-.576-.351z"/></svg>
                </div>
            </div>
        `;
        list.appendChild(card);
    });
}

function renderPromotions() {
    const list = document.getElementById('promotions-list');
    list.innerHTML = '';

    if (!fullData.promotions || fullData.promotions.length === 0) {
        list.innerHTML = `<div class="py-10 text-center text-gray-400 italic font-bold">Nenhuma promoção registrada no histórico.</div>`;
        return;
    }

    fullData.promotions.slice(0, 10).forEach(p => {
        const card = document.createElement('div');
        card.className = 'human-card promo-card animate-pop';
        card.onclick = () => openEventDetail({ title: p.emp_name, emoji: '🚀', type: 'promotion', data: p });
        card.innerHTML = `
            <img src="${p.photoUrl || 'https://ui-avatars.com/api/?name=' + p.emp_name}" class="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-md">
            <div class="min-w-0 flex-1">
                <p class="text-[8px] font-black text-amber-600 uppercase tracking-widest">Conquista Profissional</p>
                <h4 class="font-black text-gray-800 uppercase text-xs truncate">${p.emp_name}</h4>
                <p class="text-[9px] text-gray-500 font-bold uppercase italic">${p.role}</p>
                <p class="text-[7px] text-gray-400 font-mono mt-1">${DateFixer.formatarDataParaExibicao(p.date)}</p>
            </div>
            <div class="text-xl">🚀</div>
        `;
        list.appendChild(card);
    });
}

window.openEventDetail = (ev) => {
    const modal = document.getElementById('human-overlay');
    const content = document.getElementById('human-modal-content');

    let themeColor = "#D32F2F";
    let icon = "🎯";
    let title = ev.title;
    let message = "";

    // Resolve dados do colaborador
    const targetId = ev.data?.id || ev.data?.employee_id;
    const emp = fullData.employees.find(e => e.id === targetId);
    const firstName = ev.title.split(' ')[0];

    if (ev.type === 'birthday') {
        themeColor = "#8B5CF6"; icon = "🎂";
        message = `Olá, ${firstName}! 🎂\n\nA Nordeste Locações deseja a você um dia espetacular! Que sua nova jornada seja repleta de saúde, alegria e muitas conquistas. Parabéns pelo seu aniversário! 🚀✨`;
    }
    else if (ev.type === 'anniversary') {
        themeColor = "#10B981"; icon = "🏠";
        message = `Parabéns, ${firstName}! 🏠👏\n\nHoje celebramos seus ${ev.years} anos de dedicação na Nordeste Locações! Sua trajetória é motivo de orgulho para todos nós. Obrigado por fazer parte da nossa história! 🔥`;
    }
    else if (ev.type === 'promotion') {
        themeColor = "#F59E0B"; icon = "🚀"; title = ev.data.emp_name;
        message = `Parabéns pela promoção, ${ev.data.emp_name.split(' ')[0]}! 🚀✨\n\nFicamos muito felizes em ver seu crescimento para o cargo de ${ev.data.role}! Seu talento e esforço são inspiradores. Sucesso no novo desafio! 🏆`;
    }
    else if (ev.type === 'vacation') {
        themeColor = "#3B82F6"; icon = "🏖️"; title = ev.data.employee_name;
        message = `Bom descanso, ${firstName}! 🏖️☀️\n\nAproveite suas férias para recarregar as energias. Você merece este tempo! Nos vemos na volta! 😎`;
    }

    content.innerHTML = `
        <div style="background-color: ${themeColor}" class="p-10 text-white relative">
            <div class="absolute top-8 right-8 text-5xl opacity-20">${icon}</div>
            <p class="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-2">${ev.type.toUpperCase()}</p>
            <h2 class="text-3xl font-black uppercase italic leading-none">${title}</h2>
        </div>
        <div class="p-10 space-y-8">
            <div class="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 shadow-inner">
                <label class="text-[9px] font-black text-gray-400 uppercase mb-3 block">Mensagem Personalizada</label>
                <textarea id="modal-msg-text" class="w-full h-40 bg-transparent border-none outline-none font-bold text-gray-700 text-sm leading-relaxed">${message}</textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <button onclick="sendWpp('${emp?.personalPhone || ''}')" class="bg-[#25D366] text-white py-4 rounded-2xl font-black text-[10px] uppercase shadow-xl flex items-center justify-center gap-2 hover:scale-105 transition-all">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.483 8.412-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.308 1.655zm6.24-3.328c1.554.921 3.21 1.403 4.933 1.403 5.403 0 9.8-4.398 9.802-9.8.001-2.618-1.019-5.079-2.872-6.932-1.851-1.852-4.311-2.871-6.93-2.871-5.404 0-9.802 4.398-9.802 9.8 0 1.761.474 3.479 1.373 5.013l-1.03 3.757 3.858-1.012zm11.396-10.421c-.301-.151-1.782-.879-2.057-.979-.275-.1-.475-.151-.675.151-.199.301-.775.979-.95 1.179-.175.2-.351.226-.652.076-.301-.151-1.269-.467-2.418-1.492-.893-.796-1.496-1.78-1.672-2.08-.175-.3-.019-.463.13-.613.135-.134.301-.351.451-.526.15-.176.2-.301.3-.501.1-.2.05-.376-.025-.526-.075-.151-.675-1.628-.925-2.228-.243-.584-.489-.505-.675-.514-.175-.008-.376-.01-.576-.01s-.526.075-.801.376c-.275.301-1.052 1.028-1.052 2.508s1.077 2.908 1.227 3.109c.151.2 2.119 3.235 5.132 4.534.717.309 1.277.493 1.714.633.721.228 1.376.196 1.895.119.578-.085 1.782-.728 2.032-1.43.25-.701.25-1.303.175-1.43-.075-.125-.275-.201-.576-.351z"/></svg>
                    WhatsApp Privado
                </button>
                <button onclick="closeHumanModal()" class="bg-nordeste-black text-white py-4 rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-black transition-all">Fechar</button>
            </div>
        </div>
    `;
    modal.classList.remove('hidden');
};

window.sendWpp = (phone) => {
    if (!phone || phone === "Pendente") return alert("Celular não cadastrado para este colaborador.");
    const text = encodeURIComponent(document.getElementById('modal-msg-text').value);
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}?text=${text}`, '_blank');
};

window.openNewEventModal = () => {
    const modal = document.getElementById('human-overlay');
    const content = document.getElementById('human-modal-content');
    content.innerHTML = `
        <div class="bg-nordeste-red p-8 text-white"><h3 class="text-xl font-black uppercase italic">Novo Evento Organizacional</h3></div>
        <form onsubmit="saveEvent(event)" class="p-10 space-y-5">
            <div><label class="pro-label">Título do Evento</label><input id="ev-title" class="pro-input font-bold" required></div>
            <div class="grid grid-cols-2 gap-4">
                <div><label class="pro-label">Data</label><input type="date" id="ev-date" class="pro-input" required></div>
                <div><label class="pro-label">Categoria</label><select id="ev-type" class="pro-input font-bold"><option value="event">Festa / Confraternização</option><option value="reunion">Reunião Geral</option><option value="holiday">Feriado / Ponte</option></select></div>
            </div>
            <div><label class="pro-label">Descrição</label><textarea id="ev-desc" class="pro-input h-24"></textarea></div>
            <div class="flex gap-4 pt-6"><button type="button" onclick="closeHumanModal()" class="flex-1 py-4 font-black uppercase text-gray-400">Descartar</button><button type="submit" class="flex-[2] bg-nordeste-black text-white py-4 rounded-2xl font-black uppercase shadow-xl">Salvar Evento</button></div>
        </form>
    `;
    modal.classList.remove('hidden');
};

async function saveEvent(e) {
    e.preventDefault();
    const payload = {
        title: document.getElementById('ev-title').value,
        date: document.getElementById('ev-date').value,
        type: document.getElementById('ev-type').value,
        description: document.getElementById('ev-desc').value
    };
    try {
        const res = await fetch('/api/human-center/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (res.ok) {
            closeHumanModal();
            await loadData();
            render();
        }
    } catch (err) { alert("Erro ao salvar evento"); }
}

window.closeHumanModal = () => document.getElementById('human-overlay').classList.add('hidden');

window.openMassMessageModal = () => {
    const modal = document.getElementById('human-overlay');
    const content = document.getElementById('human-modal-content');
    content.innerHTML = `
        <div class="bg-nordeste-black p-8 text-white"><h3 class="text-xl font-black uppercase italic">Comunicado Comunidade</h3></div>
        <div class="p-10 space-y-6">
            <p class="text-sm text-gray-500 font-medium">Esta mensagem será aberta para que você compartilhe com o grupo oficial.</p>
            <div class="bg-gray-50 p-6 rounded-3xl border border-gray-100"><textarea id="mass-msg" class="w-full h-40 bg-transparent border-none outline-none font-bold text-gray-700 italic">⚠️ COMUNICADO RH: Hoje é dia de comemoração na Nordeste Locações! Parabéns a todos os aniversariantes e promovidos do dia! Vocês são fundamentais para o nosso sucesso! 🚀✨</textarea></div>
            <div class="flex gap-4"><button onclick="closeHumanModal()" class="flex-1 py-4 font-black uppercase text-gray-400">Cancelar</button><button onclick="window.open('https://wa.me/?text='+encodeURIComponent(document.getElementById('mass-msg').value), '_blank')" class="flex-[2] bg-[#25D366] text-white py-4 rounded-2xl font-black uppercase shadow-xl">Abrir WhatsApp</button></div>
        </div>
    `;
    modal.classList.remove('hidden');
};
