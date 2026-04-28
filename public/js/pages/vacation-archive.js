
let archiveData = [];
let employees = [];

document.addEventListener('DOMContentLoaded', init);

async function init() {
    await loadData();
    setupFilters();
    renderArchive();
    calculateInsights();
}

async function loadData() {
    try {
        const res = await fetch('/api/vacations/summary');
        const data = await res.json();
        archiveData = data.allVacations || [];
        employees = data.employees || [];
    } catch (e) {
        console.error("Erro ao carregar dados:", e);
    }
}

function calculateInsights() {
    const total = archiveData.length;
    if (total === 0) return;

    // 1. Taxa de Abono
    const withAbono = archiveData.filter(v => v.abono_days > 0).length;
    const rateAbono = Math.round((withAbono / total) * 100);

    // 2. Setor mais impactado
    const sectorCounts = {};
    archiveData.forEach(v => {
        const emp = employees.find(e => e.id === v.employee_id);
        if (emp) {
            sectorCounts[emp.sector] = (sectorCounts[emp.sector] || 0) + 1;
        }
    });
    const topSector = Object.keys(sectorCounts).reduce((a, b) => sectorCounts[a] > sectorCounts[b] ? a : b, '---');

    // 3. Custo Total
    const totalCost = archiveData.reduce((acc, v) => acc + (v.total_value || 0), 0);

    document.getElementById('ins-total').innerText = total;
    document.getElementById('ins-abono').innerText = `${rateAbono}%`;
    document.getElementById('ins-sector').innerText = topSector;
    document.getElementById('ins-cost').innerText = totalCost.toLocaleString('pt-BR', {style:'currency', currency:'BRL'});
}

function setupFilters() {
    const sSel = document.getElementById('arc-sector');
    const ySel = document.getElementById('arc-year');
    
    // Setores
    const sectors = [...new Set(employees.map(e => e.sector))].sort();
    sSel.innerHTML = '<option value="all">Todos</option>' + sectors.map(s => `<option value="${s}">${s}</option>`).join('');

    // Anos
    const years = [...new Set(archiveData.map(v => new Date(v.start_date).getFullYear()))].sort((a,b) => b-a);
    ySel.innerHTML = '<option value="all">Todos</option>' + years.map(y => `<option value="${y}">${y}</option>`).join('');

    ['arc-search', 'arc-sector', 'arc-year', 'arc-type'].forEach(id => {
        document.getElementById(id).addEventListener(id === 'arc-search' ? 'input' : 'change', renderArchive);
    });
}

function renderArchive() {
    const tbody = document.getElementById('archive-table-body');
    const empty = document.getElementById('archive-empty');
    
    const search = document.getElementById('arc-search').value.toLowerCase();
    const sector = document.getElementById('arc-sector').value;
    const year = document.getElementById('arc-year').value;
    const type = document.getElementById('arc-type').value;

    const filtered = archiveData.filter(v => {
        const emp = employees.find(e => e.id === v.employee_id);
        if (!emp) return false;

        const matchSearch = emp.name.toLowerCase().includes(search) || emp.reg.includes(search);
        const matchSector = sector === 'all' || emp.sector === sector;
        const matchYear = year === 'all' || new Date(v.start_date).getFullYear().toString() === year;
        const matchType = type === 'all' || (type === 'abono' ? v.abono_days > 0 : v.days_taken === 30);

        return matchSearch && matchSector && matchYear && matchType;
    });

    tbody.innerHTML = '';
    if (filtered.length === 0) {
        empty.classList.remove('hidden');
        return;
    }
    empty.classList.add('hidden');

    filtered.forEach(v => {
        const emp = employees.find(e => e.id === v.employee_id);
        const start = new Date(v.start_date).toLocaleDateString('pt-BR');
        const end = new Date(v.end_date).toLocaleDateString('pt-BR');
        const value = (v.total_value || 0).toLocaleString('pt-BR', {style:'currency', currency:'BRL'});

        const tr = document.createElement('tr');
        tr.className = 'arch-row border-b border-gray-50';
        tr.innerHTML = `
            <td class="p-5 pl-8">
                <div class="flex items-center gap-3">
                    <img src="${emp.photoUrl}" class="arch-avatar">
                    <div>
                        <p class="text-[10px] font-black text-gray-800 uppercase">${emp.name}</p>
                        <p class="text-[8px] font-bold text-gray-400 uppercase">${emp.sector} • ${emp.reg}</p>
                    </div>
                </div>
            </td>
            <td class="p-5">
                <p class="text-[10px] font-black text-gray-700 uppercase">Gozo: ${start} a ${end}</p>
                <p class="text-[8px] font-bold text-nordeste-red uppercase mt-1">Retorno: ${new Date(v.return_date).toLocaleDateString('pt-BR')}</p>
            </td>
            <td class="p-5 text-center">
                <span class="bg-gray-100 text-gray-600 px-2 py-1 rounded text-[10px] font-black">${v.days_taken} Dias</span>
                ${v.abono_days > 0 ? '<span class="bg-amber-100 text-amber-700 px-2 py-1 rounded text-[10px] font-black ml-1">+ Abono</span>' : ''}
            </td>
            <td class="p-5 text-right font-mono text-xs font-bold text-gray-700">${value}</td>
            <td class="p-5 text-center">
                <div class="flex justify-center gap-2">
                    <button onclick="generateDoc('${v.id}', 'recibo')" class="arch-doc-btn" title="Recibo de Férias">RECIBO</button>
                    <button onclick="generateDoc('${v.id}', 'aviso')" class="arch-doc-btn" title="Aviso de Férias">AVISO</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.generateDoc = (id, type) => {
    const v = archiveData.find(x => x.id === id);
    const emp = employees.find(e => e.id === v.employee_id);
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const title = type === 'recibo' ? 'RECIBO DE FÉRIAS' : 'AVISO DE FÉRIAS';
    const color = type === 'recibo' ? [211, 47, 47] : [33, 33, 33];

    // Cabeçalho Simples
    doc.setFillColor(...color);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255);
    doc.setFontSize(16); doc.setFont("helvetica", "bold");
    doc.text(title, 105, 18, { align: 'center' });

    // Dados
    doc.setTextColor(0);
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    
    let y = 50;
    doc.text(`EMPREGADOR: NORDESTE LOCAÇÕES`, 20, y);
    doc.text(`COLABORADOR: ${emp.name.toUpperCase()} (${emp.reg})`, 20, y+10);
    doc.text(`PERÍODO DE GOZO: ${new Date(v.start_date).toLocaleDateString('pt-BR')} a ${new Date(v.end_date).toLocaleDateString('pt-BR')}`, 20, y+20);
    doc.text(`DIAS DE FÉRIAS: ${v.days_taken}`, 20, y+30);
    if(v.abono_days > 0) doc.text(`ABONO PECUNIÁRIO: ${v.abono_days} dias vendidos`, 20, y+40);

    // Tabela Financeira
    const body = [
        ['Férias (+1/3)', v.gross_value + v.one_third_value],
    ];
    if(v.abono_days > 0) body.push(['Abono (+1/3)', v.abono_value + v.one_third_abono_value]);
    
    doc.autoTable({
        startY: y + 50,
        head: [['Descrição', 'Valor']],
        body: body.map(r => [r[0], r[1].toLocaleString('pt-BR', {style:'currency', currency:'BRL'})]),
        theme: 'grid',
        headStyles: { fillColor: color }
    });

    // Assinaturas
    doc.line(20, 250, 90, 250);
    doc.text("Empresa", 40, 255);
    doc.line(120, 250, 190, 250);
    doc.text("Colaborador", 140, 255);

    doc.save(`${title}_${emp.name}.pdf`);
};

window.exportArchiveExcel = () => {
    alert("Funcionalidade de exportação CSV será baixada em breve.");
};
