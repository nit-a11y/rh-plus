
let currentYear = new Date().getFullYear();
let employees = [];
let vacations = [];
let sectors = {}; // Cache agrupado

const MONTH_WIDTH = 100; 
const TOTAL_WIDTH = MONTH_WIDTH * 12;

document.addEventListener('DOMContentLoaded', init);

async function init() {
    await loadData();
    processData();
    renderGantt();
    setupSyncScroll();
}

async function loadData() {
    try {
        const res = await fetch('/api/vacations/summary');
        const data = await res.json();
        employees = data.employees;
        vacations = data.allVacations;
    } catch (e) {
        console.error("Erro ao carregar dados:", e);
    }
}

function processData() {
    // Agrupar por setor
    sectors = {};
    employees.forEach(emp => {
        if (!sectors[emp.sector]) sectors[emp.sector] = [];
        sectors[emp.sector].push(emp);
    });
}

window.changeYear = (delta) => {
    currentYear += delta;
    document.getElementById('current-year-display').innerText = currentYear;
    renderGantt();
};

window.renderGantt = function() {
    const headerContainer = document.getElementById('timeline-days-header');
    const leftSidebar = document.getElementById('sidebar-employees');
    const rightSidebar = document.getElementById('sidebar-capacity');
    const timelineTrack = document.getElementById('timeline-grid-track');

    // Limpar
    headerContainer.innerHTML = '';
    leftSidebar.innerHTML = '';
    rightSidebar.innerHTML = '';
    timelineTrack.innerHTML = '';

    // 1. Renderizar Header (Meses)
    const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    months.forEach(m => {
        headerContainer.innerHTML += `<div class="timeline-header-cell" style="width: ${MONTH_WIDTH}px;"><span class="month-label">${m}</span></div>`;
    });
    // Define largura total do track
    timelineTrack.style.width = `${TOTAL_WIDTH}px`;

    // 2. Renderizar por Setor
    const sortedSectors = Object.keys(sectors).sort();

    sortedSectors.forEach(sectorName => {
        const sectorEmployees = sectors[sectorName];
        
        // --- Cabeçalho do Setor ---
        const secHeaderLeft = document.createElement('div');
        secHeaderLeft.className = 'sector-group-row';
        secHeaderLeft.innerHTML = `<div class="sector-title"><span class="text-nordeste-red">🏢</span> ${sectorName} <span class="text-[8px] bg-gray-200 text-gray-600 px-1.5 rounded ml-2">${sectorEmployees.length}</span></div>`;
        leftSidebar.appendChild(secHeaderLeft);

        const secHeaderRight = document.createElement('div');
        secHeaderRight.className = 'sector-cap-header';
        secHeaderRight.innerHTML = 'IMPACTO';
        rightSidebar.appendChild(secHeaderRight);

        const secHeaderTrack = document.createElement('div');
        secHeaderTrack.className = 'sector-group-row bg-gray-50 border-b border-gray-200';
        timelineTrack.appendChild(secHeaderTrack);

        // --- Calcular Conflitos do Setor ---
        // Array de 12 meses, contagem de pessoas fora
        const monthlyLoad = new Array(12).fill(0);
        
        sectorEmployees.forEach(emp => {
            const empVacs = vacations.filter(v => v.employee_id === emp.id);
            empVacs.forEach(v => {
                const start = new Date(v.start_date);
                const end = new Date(v.end_date);
                if (start.getFullYear() === currentYear) {
                    const mStart = start.getMonth();
                    const mEnd = end.getFullYear() > currentYear ? 11 : end.getMonth();
                    for(let i = mStart; i <= mEnd; i++) monthlyLoad[i]++;
                }
            });
        });

        // --- Renderizar Colaboradores ---
        sectorEmployees.forEach(emp => {
            // Left Sidebar Cell
            const leftCell = document.createElement('div');
            leftCell.className = 'emp-cell';
            leftCell.innerHTML = `
                <img src="${emp.photoUrl}" class="emp-avatar">
                <div class="min-w-0">
                    <p class="emp-name" title="${emp.name}">${emp.name}</p>
                    <p class="text-[8px] font-bold text-gray-400 uppercase">${emp.role.substring(0, 20)}</p>
                </div>
            `;
            leftSidebar.appendChild(leftCell);

            // Right Sidebar Cell (Placeholder - poderia ser saldo de dias)
            const rightCell = document.createElement('div');
            rightCell.className = 'cap-cell';
            rightCell.innerHTML = `<span class="text-[8px] font-mono text-gray-400">---</span>`; // Placeholder
            rightSidebar.appendChild(rightCell);

            // Track Row
            const trackRow = document.createElement('div');
            trackRow.className = 'timeline-track-row';
            
            // Adicionar Barras de Férias
            const empVacs = vacations.filter(v => v.employee_id === emp.id);
            empVacs.forEach(v => {
                const start = new Date(v.start_date);
                const end = new Date(v.end_date);
                
                if (start.getFullYear() === currentYear) {
                    const yearStart = new Date(currentYear, 0, 1);
                    const dayOfYear = Math.floor((start - yearStart) / (1000 * 60 * 60 * 24));
                    
                    // Cálculo de Posição: (Dia do Ano / 365) * Largura Total
                    const leftPos = (dayOfYear / 365) * TOTAL_WIDTH;
                    const durationDays = v.days_taken;
                    const width = (durationDays / 365) * TOTAL_WIDTH;

                    let barClass = 'bar-agendada';
                    if (v.status === 'Planejada') barClass = 'bar-planejada';
                    if (v.status === 'Em Gozo') barClass = 'bar-gozo';

                    const bar = document.createElement('div');
                    bar.className = `vacation-bar ${barClass}`;
                    bar.style.left = `${leftPos}px`;
                    bar.style.width = `${Math.max(width, 5)}px`; // Min width visual
                    bar.innerText = `${v.days_taken}d`;
                    bar.onmouseenter = (e) => showTooltip(e, emp, v);
                    bar.onmouseleave = hideTooltip;
                    
                    trackRow.appendChild(bar);
                }
            });

            timelineTrack.appendChild(trackRow);
        });

        // --- Renderizar Highlight de Conflito no Track (Camada de Fundo) ---
        // Se em algum mês > 30% do setor estiver fora
        monthlyLoad.forEach((count, monthIdx) => {
            const riskRatio = count / sectorEmployees.length;
            if (riskRatio > 0.3 && sectorEmployees.length > 2) { // Regra de negócio
                const conflictBox = document.createElement('div');
                conflictBox.className = 'conflict-zone';
                conflictBox.style.left = `${monthIdx * MONTH_WIDTH}px`;
                conflictBox.style.width = `${MONTH_WIDTH}px`;
                // Altura deve cobrir todas as linhas desse setor. 
                // Header (40) + (N * 50). Ajustamos position absolute relative ao container do setor se possível,
                // mas aqui estamos no fluxo. Injetamos dentro da primeira linha do track e forçamos altura?
                // Simplificação: Injetamos visualmente no header do setor no track
                
                const warningBadge = document.createElement('div');
                warningBadge.className = 'absolute top-1 left-1 bg-red-100 text-red-600 text-[8px] font-black px-1 rounded border border-red-200 z-20';
                warningBadge.style.left = `${monthIdx * MONTH_WIDTH + 5}px`;
                warningBadge.innerText = `⚠️ ${Math.round(riskRatio*100)}% AUSENTE`;
                secHeaderTrack.appendChild(warningBadge);
            }
        });
    });
};

function setupSyncScroll() {
    const header = document.getElementById('header-container');
    const body = document.getElementById('timeline-body-scroll');
    
    if (body && header) {
        body.addEventListener('scroll', () => {
            header.scrollLeft = body.scrollLeft;
        });
    }
}

window.showTooltip = (e, emp, v) => {
    const tip = document.getElementById('plan-tooltip');
    const start = new Date(v.start_date).toLocaleDateString('pt-BR');
    const end = new Date(v.end_date).toLocaleDateString('pt-BR');
    
    tip.innerHTML = `
        <div class="flex items-center gap-2 mb-2 pb-2 border-b border-white/20">
            <img src="${emp.photoUrl}" class="w-6 h-6 rounded-full">
            <div>
                <p class="leading-none">${emp.name}</p>
                <p class="text-[8px] text-gray-400 font-normal">${emp.role}</p>
            </div>
        </div>
        <div class="space-y-1">
            <div class="flex justify-between"><span>Período:</span> <span class="text-nordeste-red">${start} - ${end}</span></div>
            <div class="flex justify-between"><span>Duração:</span> <span>${v.days_taken} Dias</span></div>
            <div class="flex justify-between"><span>Abono:</span> <span>${v.abono_days > 0 ? 'SIM (10d)' : 'NÃO'}</span></div>
            <div class="mt-2 pt-2 border-t border-white/10 text-center text-[9px] italic text-gray-400">${v.status}</div>
        </div>
    `;
    
    // Posicionamento inteligente
    const rect = e.target.getBoundingClientRect();
    tip.style.left = `${rect.right + 10}px`;
    tip.style.top = `${rect.top}px`;
    tip.classList.remove('hidden');
};

window.hideTooltip = () => document.getElementById('plan-tooltip').classList.add('hidden');
