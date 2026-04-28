
import { calculateAge, parseCurrency, formatCurrency, formatarDataHoraBR, formatarDataBR, calcularTempoCasa } from '../utils.js';

let dossierData = null;
let currentEmployeeId = null;

window.openModuleWithEmployee = (module, empId) => {
    const emp = dossierData?.employee;
    if (!emp) return;
    
    if (module === 'vacations') {
        window.location.href = `/vacation-unified.html?emp=${emp.id}`;
    } else if (module === 'aso') {
        window.location.href = `/aso.html?emp=${emp.id}`;
    } else if (module === 'career') {
        window.location.href = `/carreira.html?emp=${emp.id}`;
    } else if (module === 'uniforms') {
        window.location.href = `/uniforms-module.html?emp=${emp.id}`;
    } else if (module === 'tools') {
        window.location.href = `/tools-module.html?emp=${emp.id}`;
    }
};

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function sanitizeForHtml(value) {
    if (Array.isArray(value)) return value.map(sanitizeForHtml);
    if (value && typeof value === 'object') {
        const out = {};
        Object.keys(value).forEach((k) => { out[k] = sanitizeForHtml(value[k]); });
        return out;
    }
    if (typeof value === 'string') return escapeHtml(value);
    return value;
}

export function initDossier() {
    setupDNav();
}

function setupDNav() {
    document.querySelectorAll('#dossier-tabs-nav .nav-tab-pro').forEach(tab => {
        tab.onclick = () => {
            const targetId = `section-${tab.dataset.dtab}`;
            const element = document.getElementById(targetId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                document.querySelectorAll('#dossier-tabs-nav .nav-tab-pro').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
            }
        };
    });
}

window.openEmployeeDossier = async (id) => {
    const res = await fetch(`/api/employees-pro/${id}/dossier`);
    const rawData = await res.json();
    dossierData = sanitizeForHtml(rawData);
    currentEmployeeId = id;

    const rawEmp = rawData.employee || {};
    document.getElementById('dossier-avatar').src = rawEmp.photoUrl || `https://ui-avatars.com/api/?name=${rawEmp.name || ''}`;
    document.getElementById('dossier-name').innerText = rawEmp.name || '';
    document.getElementById('dossier-role-sector').innerText = `${rawEmp.role || ''} (CBO: ${rawEmp.cbo || '---'}) ? ${rawEmp.sector || ''}`;
    document.getElementById('dossier-reg-tag').innerText = `#${rawEmp.registrationNumber || ''}`;

    window.toggleModule('dossier');
    renderFullDossier();
};

function renderFullDossier() {
    const area = document.getElementById('dossier-pages-container');
    const e = dossierData.employee;
    
    // TESTE: Verificar se área existe e se dados do colaborador estão ok
    if (!area) {
        console.error('❌ Área do dossier não encontrada');
        return;
    }
    
    if (!e || !e.name) {
        console.error('❌ Dados do colaborador não encontrados');
        area.innerHTML = '<div class="p-8 text-center text-red-500">Erro: Dados do colaborador não encontrados</div>';
        return;
    }
    
    console.log('📋 Renderizando dossier para:', e.name);
    
    const d = dossierData.documents || {};
    const ben = dossierData.benefits || [];
    const benHist = dossierData.benefitHistory || [];
    const dep = dossierData.dependents || [];
    const emg = dossierData.emergencyContacts || [];
    const career = dossierData.career || [];
    const occ = dossierData.occurrences || [];
    const aso = dossierData.aso || [];
    const uni = dossierData.uniformItems || [];
    const uniHist = dossierData.uniformHistory || [];
    const vac = dossierData.vacations || [];
    const abs = dossierData.absenteismo || []; 
    const tools = dossierData.toolItems || [];
    const toolsHist = dossierData.toolHistory || [];
    const todayStr = new Date().toLocaleString('pt-BR');

    const vinculoPrincipal = (dossierData.vinculos || []).find(v => v.principal) || (dossierData.vinculos || [])[0] || {};
    const employerName = vinculoPrincipal.employer_name || e.employer_name || 'AR2 SERVIÇOS E SOLUÇÕES LTDA';
    const employerCnpj = vinculoPrincipal.employer_cnpj || e.employer_cnpj || '43.529.100/0001-12';
    const workplaceName = vinculoPrincipal.workplace_name || e.workplace_name || 'N/A';
    const workplaceCnpj = vinculoPrincipal.workplace_cnpj || e.workplace_cnpj || '-';

    // Cálculos de Tempo e Desligamento
    const desligamento = career.find(c => c.move_type === 'Desligamento');
    const isDesligado = e.type === 'Desligado';
    const tempoCasa = calcularTempoCasa(e.admissionDate, desligamento?.date);

    // Soma total de dias de atestado (Tratamento para não vir NaN)
    const totalDiasAfastado = abs.reduce((acc, curr) => acc + (parseInt(curr.days_count) || 0), 0);

    // Lógica de Evolução Salarial
    const histSalarial = [...career].reverse().filter(c => c.salary && c.salary !== '-' && c.salary !== '');
    const salInicialStr = histSalarial.length > 0 ? histSalarial[0].salary : e.currentSalary;
    const salAtualStr = e.currentSalary;
    const valInicial = parseCurrency(salInicialStr);
    const valAtual = parseCurrency(salAtualStr);
    const variacao = valInicial > 0 ? ((valAtual - valInicial) / valInicial) * 100 : 0;

    // Divisão Disciplinar
    const premiacoes = occ.filter(o => 
        o.type.toLowerCase().includes('premiação') || 
        o.type.toLowerCase().includes('destaque') || 
        o.type.toLowerCase().includes('elogio') || 
        o.type.toLowerCase().includes('melhor') ||
        o.type.toLowerCase().includes('bônus')
    );
    const punicoes = occ.filter(o => 
        o.type.toLowerCase().includes('advertência') || 
        o.type.toLowerCase().includes('suspensão') || 
        o.type.toLowerCase().includes('justa causa')
    );

    const html = `
        <div class="paper-dossier animate-fade-in">
            <!-- TESTE DE RENDERIZAÇÃO -->
            <div class="bg-green-100 border-2 border-green-300 rounded-xl p-4 m-4">
                <h3 class="text-green-800 font-bold">📋 DOSSIER RENDERIZANDO</h3>
                <p>Colaborador: ${e.name}</p>
                <p>ID: ${e.id}</p>
            </div>
            
            <div class="paper-stamp">CONFIDENCIAL</div>
            
            <!-- CABEÇALHO -->
            <div id="section-master" class="dossier-print-section">
                <div class="paper-header">
                    <div class="paper-title">
                        <h2>Ficha de Registro</h2>
                        <p>Nordeste Locações • Dossiê 360º • Prontuário Digital</p>
                    </div>
                    <div class="paper-photo-frame">
                        <img src="${e.photoUrl || 'https://ui-avatars.com/api/?name='+e.name}">
                    </div>
                </div>

                <div class="paper-section-bar">🔎 Situação Atual</div>
                <div class="paper-dashed-box !grid-cols-2">
                    <div>
                        <p class="font-black text-2xl ${isDesligado ? 'text-red-700' : 'text-green-700'}">${isDesligado ? 'INATIVO' : 'ATIVO'}</p>
                        <span class="paper-field-label">Status do Colaborador</span>
                    </div>
                    <div class="text-right">
                        <p class="font-black text-xl text-gray-800">${tempoCasa}</p>
                        <span class="paper-field-label">Tempo de Casa Acumulado</span>
                    </div>
                </div>

                <!-- VÍNCULO CORPORATIVO -->
                <div class="paper-section-bar blue">🏢 Vínculo Corporativo</div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 mb-4">
                    <div class="paper-field"><span class="paper-field-label">Empregador (Contratual):</span> <span class="paper-field-value text-[10px]">${employerName}</span></div>
                    <div class="paper-field"><span class="paper-field-label">CNPJ:</span> <span class="paper-field-value font-mono text-[10px]">${employerCnpj}</span></div>
                    <div class="paper-field"><span class="paper-field-label">Lotação Física (Unidade):</span> <span class="paper-field-value text-[10px]">${workplaceName}</span></div>
                    <div class="paper-field"><span class="paper-field-label">CNPJ Unidade:</span> <span class="paper-field-value font-mono text-[10px]">${workplaceCnpj}</span></div>
                </div>
                
                <!-- HISTÓRICO DE TRANSFERÊNCIAS -->
                <div class="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
                    <div class="flex items-center justify-between mb-3">
                        <h4 class="font-black text-blue-800 text-sm uppercase">Histórico de Transferências</h4>
                        <span class="text-xs text-blue-600 font-bold">MOVIMENTAÇÃO DE VÍNCULOS</span>
                    </div>
                    <div id="transfer-history-${e.id}" class="space-y-2">
                        <p class="text-xs text-gray-500 italic">Carregando histórico...</p>
                    </div>
                </div>

                <!-- IDENTIFICAÇÃO -->
                <div class="paper-section-bar">👤 Identificação & Filição</div>
                <div class="grid grid-cols-2 gap-x-12 gap-y-1">
                    <div class="paper-field col-span-2"><span class="paper-field-label">Nome Completo:</span> <span class="paper-field-value">${e.name}</span></div>
                    <div class="paper-field"><span class="paper-field-label">Nascimento:</span> <span class="paper-field-value">${formatarDataBR(e.birthDate)} (${calculateAge(e.birthDate)} anos)</span></div>
                    <div class="paper-field"><span class="paper-field-label">Gênero:</span> <span class="paper-field-value">${e.gender || '-'}</span></div>
                    <div class="paper-field"><span class="paper-field-label">Nome do Pai:</span> <span class="paper-field-value">${e.fatherName || 'N/C'}</span></div>
                    <div class="paper-field"><span class="paper-field-label">Nome da Mãe:</span> <span class="paper-field-value">${e.motherName || '-'}</span></div>
                    <div class="paper-field"><span class="paper-field-label">Estado Civil:</span> <span class="paper-field-value">${e.maritalStatus || '-'}</span></div>
                    <div class="paper-field"><span class="paper-field-label">Escolaridade:</span> <span class="paper-field-value text-[9px]">${e.educationLevel || '-'}</span></div>
                    <div class="paper-field"><span class="paper-field-label">Etnia:</span> <span class="paper-field-value">${e.ethnicity || '-'}</span></div>
                    <div class="paper-field"><span class="paper-field-label">Naturalidade:</span> <span class="paper-field-value">${e.placeOfBirth || '-'}</span></div>
                </div>

                <!-- CONTATOS -->
                <div class="paper-section-bar">📞 Contatos & Localização</div>
                <div class="grid grid-cols-2 gap-x-12 gap-y-1">
                    <div class="paper-field"><span class="paper-field-label">E-mail:</span> <span class="paper-field-value" style="text-transform:lowercase">${e.personalEmail || '-'}</span></div>
                    <div class="paper-field"><span class="paper-field-label">Telefone:</span> <span class="paper-field-value">${e.personalPhone || '-'}</span></div>
                    <div class="paper-field col-span-2"><span class="paper-field-label">Endereço:</span> <span class="paper-field-value">${e.street || '-'}, ${e.neighborhood || '-'}</span></div>
                    <div class="paper-field"><span class="paper-field-label">Cidade/UF:</span> <span class="paper-field-value">${e.city || '-'}/${e.state_uf || '-'}</span></div>
                    <div class="paper-field"><span class="paper-field-label">CEP:</span> <span class="paper-field-value font-mono">${e.cep || '-'}</span></div>
                </div>
            </div>

            <!-- DOCUMENTOS -->
            <div id="section-documents" class="dossier-print-section">
                <div class="paper-section-bar">📄 Central de Documentos Legais</div>
                <div class="grid grid-cols-3 gap-x-8 gap-y-1">
                    <div class="paper-field"><span class="paper-field-label">CPF:</span> <span class="paper-field-value font-mono">${d.cpf || '-'}</span></div>
                    <div class="paper-field"><span class="paper-field-label">PIS/PASEP:</span> <span class="paper-field-value font-mono">${d.pis_pasep || '-'}</span></div>
                    <div class="paper-field"><span class="paper-field-label">RG Número:</span> <span class="paper-field-value font-mono">${d.rg_number || '-'}</span></div>
                    <div class="paper-field"><span class="paper-field-label">RG Órgão/UF:</span> <span class="paper-field-value">${d.rg_organ || '-'}/${d.rg_uf || '-'}</span></div>
                    <div class="paper-field"><span class="paper-field-label">CTPS:</span> <span class="paper-field-value font-mono">${d.ctps_number || '-'}</span></div>
                    <div class="paper-field"><span class="paper-field-label">CNH:</span> <span class="paper-field-value font-mono">${d.cnh_number || '-'}</span></div>
                    <div class="paper-field"><span class="paper-field-label">Título Eleitor:</span> <span class="paper-field-value font-mono">${d.voter_title || '-'}</span></div>
                    <div class="paper-field col-span-2"><span class="paper-field-label">Zona/Seção:</span> <span class="paper-field-value font-mono">${d.voter_zone || '-'}/${d.voter_section || '-'}</span></div>
                </div>
            </div>

            <!-- ESOCIAL E JORNADA -->
            <div id="section-contract" class="dossier-print-section">
                <div class="paper-section-bar">💼 Configuração de Vínculo eSocial</div>
                <div class="grid grid-cols-2 gap-x-12 gap-y-1">
                    <div class="paper-field"><span class="paper-field-label">Matrícula:</span> <span class="paper-field-value font-mono">${e.registrationNumber}</span></div>
                    <div class="paper-field"><span class="paper-field-label">Admissão:</span> <span class="paper-field-value">${formatarDataBR(e.admissionDate)}</span></div>
                    <div class="paper-field"><span class="paper-field-label">Cargo:</span> <span class="paper-field-value uppercase">${e.role}</span></div>
                    <div class="paper-field"><span class="paper-field-label">CBO:</span> <span class="paper-field-value font-mono font-black text-amber-700">${e.cbo || '---'}</span></div>
                    <div class="paper-field"><span class="paper-field-label">Setor:</span> <span class="paper-field-value uppercase">${e.sector}</span></div>
                    <div class="paper-field"><span class="paper-field-label">Salário Base:</span> <span class="paper-field-value text-red-700 font-black">${formatCurrency(e.currentSalary)}</span></div>
                    <div class="paper-field"><span class="paper-field-label">Hierarquia:</span> <span class="paper-field-value">${e.hierarchy || '-'}</span></div>
                </div>
                
                <div class="paper-section-bar orange" style="background:#4b5563">⏰ Escala & Jornada</div>
                <div class="grid grid-cols-2 gap-x-12">
                    <div class="paper-field"><span class="paper-field-label">Escala:</span> <span class="paper-field-value">${e.work_scale || '5x2'}</span></div>
                    <div class="paper-field"><span class="paper-field-label">Horário:</span> <span class="paper-field-value">${e.work_schedule || '07:30 às 17:18'}</span></div>
                </div>
                
                <div class="paper-section-bar" style="background:#6b7280">📜 DADOS DE ENTRADA (HISTÓRICO)</div>
                <div class="grid grid-cols-2 gap-x-12 gap-y-1">
                    <div class="paper-field"><span class="paper-field-label">Cargo Inicial (Admissão):</span> <span class="paper-field-value uppercase">${e.initialRole || e.role}</span></div>
                    <div class="paper-field"><span class="paper-field-label">Salário Inicial:</span> <span class="paper-field-value text-blue-700 font-black">${formatCurrency(e.initialSalary || e.currentSalary)}</span></div>
                </div>
            </div>
            <div id="section-uniforms" class="dossier-print-section">
                <div class="paper-section-bar blue">🎽 Logística de Fardamento (Ciclo de Vida)</div>
                <h4 class="text-[9px] font-black uppercase text-gray-400 mb-2">Itens Ativos no Momento</h4>
                <table class="paper-table mb-8">
                    <thead><tr><th>Peça / Tipo</th><th>Cor</th><th>Tam.</th><th>Entrega</th><th>Status</th></tr></thead>
                    <tbody>
                        ${uni.map(u => `<tr>
                            <td class="font-bold">${u.type.toUpperCase()}</td>
                            <td>${u.color}</td>
                            <td class="font-black">${u.size}</td>
                            <td>${formatarDataBR(u.dateGiven)}</td>
                            <td><span class="text-[8px] font-black uppercase text-green-600">${u.status}</span></td>
                        </tr>`).join('') || '<tr><td colspan="5" class="text-center italic py-4">Sem itens ativos.</td></tr>'}
                    </tbody>
                </table>

                <h4 class="text-[9px] font-black uppercase text-gray-400 mb-2">Histórico Completo de Movimentações (Auditável)</h4>
                <table class="paper-table">
                    <thead><tr><th>Data/Hora</th><th>Movimento</th><th>Peça</th><th>Status</th><th>Resp.</th></tr></thead>
                    <tbody>
                        ${uniHist.map(h => `<tr>
                            <td class="font-mono text-[8px]">${formatarDataHoraBR(h.data_hora)}</td>
                            <td><strong class="text-blue-700">${h.tipo_movimentacao}</strong></td>
                            <td class="text-[9px]">${h.type} (${h.color})</td>
                            <td class="text-[8px] font-black uppercase">${h.status_peca}</td>
                            <td class="text-[8px] text-gray-400">${h.responsavel}</td>
                        </tr>`).join('') || '<tr><td colspan="5" class="text-center italic py-4 text-gray-300">Sem histórico registrado.</td></tr>'}
                    </tbody>
                </table>
            </div>

            <!-- FERRAMENTAS & ATIVOS -->
            <div id="section-tools" class="dossier-print-section">
                <div class="paper-section-bar" style="background: #0284c7">💻 Inventário de Ativos & Ferramentas</div>
                <h4 class="text-[9px] font-black uppercase text-gray-400 mb-2">Hardware sob Responsabilidade (Comodato)</h4>
                <table class="paper-table mb-8">
                    <thead><tr><th>Ativo</th><th>Patrimônio</th><th>S/N Serial</th><th>Acessórios</th><th>Status</th></tr></thead>
                    <tbody>
                        ${tools.map(t => `<tr>
                            <td class="font-bold text-[10px]">${t.type} ${t.brand}</td>
                            <td class="font-black text-blue-700 font-mono">${t.patrimonio || '-'}</td>
                            <td class="font-mono text-gray-500">${t.serial_number || '-'}</td>
                            <td class="italic text-[9px]">${t.accessories || 'Padrão'}</td>
                            <td><span class="text-[8px] font-black uppercase text-blue-600">${t.status}</span></td>
                        </tr>`).join('') || '<tr><td colspan="5" class="text-center italic py-4">Nenhum ativo vinculado no momento.</td></tr>'}
                    </tbody>
                </table>

                <h4 class="text-[9px] font-black uppercase text-gray-400 mb-2">Histórico de Atribuição e Baixas</h4>
                <table class="paper-table">
                    <thead><tr><th>Data/Hora</th><th>Ação</th><th>Descrição</th><th>Motivo</th><th>Resp.</th></tr></thead>
                    <tbody>
                        ${toolsHist.map(h => `<tr>
                            <td class="font-mono text-[8px]">${formatarDataHoraBR(h.data_hora)}</td>
                            <td><span class="text-[8px] font-black uppercase ${h.action === 'ENTREGA' ? 'text-blue-600' : 'text-red-600'}">${h.action}</span></td>
                            <td class="text-[9px] font-bold uppercase">${h.observation || '-'}</td>
                            <td class="text-[8px] italic">${h.status_item || '-'}</td>
                            <td class="text-[8px] text-gray-400 uppercase">${h.responsavel}</td>
                        </tr>`).join('') || '<tr><td colspan="5" class="text-center italic py-4 text-gray-300">Sem histórico registrado.</td></tr>'}
                    </tbody>
                </table>
            </div>

            <!-- FÉRIAS -->
            <div id="section-vacations" class="dossier-print-section">
                <div class="paper-section-bar orange">📅 Gestão de Férias e Descansos</div>
                <table class="paper-table">
                    <thead><tr><th>Período de Gozo</th><th>Dias</th><th>Retorno</th><th>Vlr. Bruto</th><th>Status</th></tr></thead>
                    <tbody>
                        ${vac.length > 0 ? vac.map(v => `<tr>
                            <td>${formatarDataBR(v.start_date)} a ${formatarDataBR(v.end_date)}</td>
                            <td class="font-black text-center">${v.days_taken}</td>
                            <td>${formatarDataBR(v.return_date)}</td>
                            <td class="font-mono">${formatCurrency(v.total_value)}</td>
                            <td><span class="text-[9px] font-black uppercase">${v.status}</span></td>
                        </tr>`).join('') : '<tr><td colspan="5" class="text-center italic py-10 text-gray-400">Sem histórico de férias registradas no prontuário.</td></tr>'}
                    </tbody>
                </table>
            </div>

            <!-- ABSENTEÍSMO -->
            <div id="section-absence" class="dossier-print-section">
                <div class="paper-section-bar" style="background:#4338ca">🏥 Histórico de Absenteísmo e Afastamentos</div>
                <div class="paper-dashed-box !grid-cols-1 mb-4">
                    <div class="flex justify-between items-center">
                        <span class="paper-field-label">Total de Dias de Ausência (Histórico):</span>
                        <p class="font-black text-xl text-indigo-700">${totalDiasAfastado} DIAS</p>
                    </div>
                </div>
                <table class="paper-table">
                    <thead><tr><th>Início</th><th>Fim</th><th>Dias</th><th>CID</th><th>Motivo / Médico</th></tr></thead>
                    <tbody>
                        ${abs.length > 0 ? abs.map(a => `<tr>
                            <td class="font-mono">${formatarDataBR(a.start_date)}</td>
                            <td class="font-mono">${formatarDataBR(a.end_date)}</td>
                            <td class="font-black text-center">${a.days_count}</td>
                            <td class="font-bold text-gray-500">${a.cid || '-'}</td>
                            <td><p class="text-[10px] font-black uppercase">${a.type || 'Doença'}</p><p class="text-[8px] text-gray-400">${a.doctor_name || '-'}</p></td>
                        </tr>`).join('') : '<tr><td colspan="5" class="text-center italic py-10 text-gray-400 font-bold">Nenhum registro de afastamento médico.</td></tr>'}
                    </tbody>
                </table>
            </div>

            <!-- BENEFÍCIOS -->
            <div id="section-financial" class="dossier-print-section">
                <div class="paper-section-bar orange">🎁 Gestão de Benefícios & Verbas</div>
                <h4 class="text-[9px] font-black uppercase text-gray-400 mb-2">Benefícios Contratuais Vigentes</h4>
                <table class="paper-table mb-8">
                    <thead><tr><th>Descrição</th><th>Valor</th><th>Status</th><th>Início</th></tr></thead>
                    <tbody>
                        ${ben.map(b => `<tr>
                            <td class="font-bold">${b.benefit_name.toUpperCase()}</td>
                            <td class="font-mono">${formatCurrency(b.value)}</td>
                            <td class="font-black text-[9px] uppercase">${b.status}</td>
                            <td>${formatarDataBR(b.start_date)}</td>
                        </tr>`).join('') || '<tr><td colspan="4" class="text-center italic py-4">Sem benefícios.</td></tr>'}
                    </tbody>
                </table>

                <h4 class="text-[9px] font-black uppercase text-gray-400 mb-2">Logs de Alteração (Concedido/Suspenso/Pausado)</h4>
                <table class="paper-table">
                    <thead><tr><th>Data/Hora</th><th>Benefício</th><th>Ação / Transição</th><th>Resp.</th></tr></thead>
                    <tbody>
                        ${benHist.map(h => `<tr>
                            <td class="font-mono text-[8px]">${formatarDataHoraBR(h.data_hora)}</td>
                            <td class="font-black text-[9px] uppercase">${h.benefit_name}</td>
                            <td><span class="text-gray-400 uppercase">${h.status_anterior}</span> ➔ <strong class="text-orange-700 uppercase">${h.status_novo}</strong></td>
                            <td class="text-[8px] text-gray-400 uppercase">${h.responsavel}</td>
                        </tr>`).join('') || '<tr><td colspan="4" class="text-center italic py-4 text-gray-300">Sem histórico de alterações de verbas.</td></tr>'}
                    </tbody>
                </table>
            </div>

            <!-- FAMÍLIA & SOS -->
            <div id="section-family" class="dossier-print-section">
                <div class="paper-section-bar">👨‍👩‍👧 Dependentes Legais (IRRF / Salário Família)</div>
                <table class="paper-table">
                    <thead><tr><th>Nome Completo</th><th>CPF</th><th>Nascimento</th><th>Parentesco</th></tr></thead>
                    <tbody>
                        ${dep.map(d => `<tr>
                            <td class="font-bold uppercase">${d.name}</td>
                            <td class="font-mono">${d.cpf || '-'}</td>
                            <td>${formatarDataBR(d.birth_date)}</td>
                            <td class="uppercase">${d.relationship}</td>
                        </tr>`).join('') || '<tr><td colspan="4" class="text-center italic py-4">Nenhum dependente vinculado.</td></tr>'}
                    </tbody>
                </table>

                <div class="paper-section-bar red" style="background:#1e40af">🆘 Contatos de Emergência</div>
                <div class="space-y-2">
                    ${emg.map(c => `
                        <div class="p-4 border border-gray-200 bg-white rounded-lg">
                            <p class="text-[11px] font-black uppercase text-blue-800">${c.name}</p>
                            <p class="text-[9px] font-bold text-gray-500 mt-1">${c.relationship.toUpperCase()} • ${c.phone}</p>
                        </div>
                    `).join('') || '<p class="text-xs italic text-gray-400">Nenhum contato SOS cadastrado.</p>'}
                </div>
            </div>

            <!-- JORNADA PROFISSIONAL -->
            <div id="section-career" class="dossier-print-section">
                <div class="paper-section-bar">📈 Jornada & Histórico Profissional</div>
                <table class="paper-table">
                    <thead><tr><th>Data/Hora</th><th>Movimento</th><th>Cargo / CBO / Setor</th><th>Responsável</th></tr></thead>
                    <tbody>
                        ${career.map(c => `<tr>
                            <td class="font-mono text-[9px]">${formatarDataHoraBR(c.date)}</td>
                            <td><strong class="uppercase text-[9px]">${c.move_type}</strong></td>
                            <td><p class="font-black text-[10px] uppercase">${c.role} <span class="text-[8px] font-mono text-amber-600">(${c.cbo || '---'})</span></p><p class="text-[8px] text-gray-400 uppercase">${c.sector}</p></td>
                            <td class="text-[8px] uppercase font-bold text-gray-400">${c.responsible || 'Sistema RH+'}</td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>

            <!-- EVOLUÇÃO SALARIAL -->
            <div id="section-salary-evolution" class="dossier-print-section">
                <div class="paper-section-bar green" style="background:#15803d">💰 Evolução Salarial & Crescimento de Carreira</div>
                
                <h3 class="font-black text-xs uppercase italic mb-4">📊 Análise Comparativa</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 bg-emerald-50/50 p-6 border-2 border-emerald-100 rounded-2xl">
                    <div><span class="paper-field-label">Salário Inicial (Admissão)</span><p class="font-black text-lg text-gray-600">${formatCurrency(salInicialStr)}</p></div>
                    <div><span class="paper-field-label">Salário Atual / Final</span><p class="font-black text-lg text-emerald-700">${formatCurrency(salAtualStr)}</p></div>
                    <div><span class="paper-field-label">Variação Total</span><p class="font-black text-lg ${variacao > 0 ? 'text-blue-600' : 'text-gray-400'}">${formatCurrency(valAtual - valInicial)} (${variacao.toFixed(2)}%)</p></div>
                </div>

                <h3 class="font-black text-xs uppercase italic mb-4">🕒 Linha do Tempo Salarial</h3>
                <table class="paper-table">
                    <thead><tr><th>Data</th><th>Evento</th><th>Cargo</th><th>Salário</th><th>Motivo</th></tr></thead>
                    <tbody>
                        ${histSalarial.map(h => `<tr>
                            <td class="font-mono text-[9px]">${formatarDataBR(h.date)}</td>
                            <td class="font-bold text-[9px] uppercase">${h.move_type}</td>
                            <td class="text-[9px] uppercase">${h.role}</td>
                            <td class="font-black text-emerald-700">${formatCurrency(h.salary)}</td>
                            <td class="italic text-[9px] text-gray-500">${h.observation || '-'}</td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>

            <!-- HISTÓRICO DISCIPLINAR -->
            <div id="section-discipline" class="dossier-print-section">
                <div class="paper-section-bar" style="background: #121212">⚖️ Histórico Disciplinar & Mérito</div>
                
                <h4 class="font-black text-[11px] text-amber-600 uppercase italic mt-6 mb-4 flex items-center gap-2">🏆 Premiações e Reconhecimento</h4>
                <table class="paper-table mb-8" style="background: rgba(251, 192, 45, 0.02)">
                    <thead><tr><th width="15%">Data</th><th width="30%">Evento</th><th width="55%">Descrição / Bônus</th></tr></thead>
                    <tbody>
                        ${premiacoes.map(o => `<tr>
                            <td class="font-mono text-[9px]">${formatarDataBR(o.date)}</td>
                            <td><span class="text-amber-700 font-black uppercase text-[9px]">${o.type}</span></td>
                            <td class="italic text-[10px] uppercase">${o.reason}</td>
                        </tr>`).join('') || '<tr><td colspan="3" class="text-center italic py-4 text-gray-300 uppercase text-[9px]">Nenhum registro de mérito.</td></tr>'}
                    </tbody>
                </table>

                <h4 class="font-black text-[11px] text-red-700 uppercase italic mt-10 mb-4 flex items-center gap-2">⚠️ Medidas Disciplinares Aplicadas</h4>
                <table class="paper-table" style="background: rgba(211, 47, 47, 0.02)">
                    <thead><tr><th width="15%">Data</th><th width="30%">Tipo</th><th width="55%">Motivo / Justificativa</th></tr></thead>
                    <tbody>
                        ${punicoes.map(o => `<tr>
                            <td class="font-mono text-[9px]">${formatarDataBR(o.date)}</td>
                            <td><span class="text-red-700 font-black uppercase text-[9px]">${o.type}</span></td>
                            <td class="text-[10px] uppercase font-bold text-gray-700">${o.reason}</td>
                        </tr>`).join('') || '<tr><td colspan="3" class="text-center italic py-10 text-green-600 font-black uppercase text-[10px] tracking-widest">Ficha Limpa: Nenhuma punição registrada.</td></tr>'}
                    </tbody>
                </table>
            </div>

            <!-- SAÚDE -->
            <div id="section-health" class="dossier-print-section">
                <div class="paper-section-bar green">🩺 Saúde Ocupacional (ASOs)</div>
                <table class="paper-table">
                    <thead><tr><th>Exame</th><th>Data</th><th>Validade</th><th>Resultado</th><th>Status</th></tr></thead>
                    <tbody>
                        ${aso.map(a => {
                            const exp = new Date(a.expiry_date);
                            const isVencido = exp < new Date();
                            return `<tr>
                                <td class="font-bold">${a.exam_type}</td>
                                <td>${formatarDataBR(a.exam_date)}</td>
                                <td>${formatarDataBR(a.expiry_date)}</td>
                                <td class="font-black uppercase">${a.result}</td>
                                <td><span class="text-[8px] font-black ${isVencido?'text-red-600':'text-green-600'}">${isVencido?'VENCIDO':'VÁLIDO'}</span></td>
                            </tr>`;
                        }).join('') || '<tr><td colspan="5" class="text-center py-6 italic text-gray-400">Sem registros de saúde.</td></tr>'}
                    </tbody>
                </table>
            </div>

            <!-- SEÇÃO DEMISSIONAL -->
            <div id="section-termination" class="dossier-print-section">
                <div class="paper-section-bar" style="background:#121212">🚪 Seção Demissional</div>
                <div class="p-6 bg-gray-50 border-2 border-gray-200 rounded-2xl">
                    <div class="grid grid-cols-2 gap-4">
                        <div><span class="paper-field-label">Status do Colaborador:</span><p class="font-black uppercase ${isDesligado?'text-red-700':'text-green-700'}">${isDesligado?'Desligado':'Ativo'}</p></div>
                        <div><span class="paper-field-label">Data de Desligamento:</span><p class="font-black uppercase text-gray-800">${isDesligado ? formatarDataBR(desligamento?.date) : 'Colaborador ativo por enquanto.'}</p></div>
                    </div>
                </div>
            </div>

            <div class="paper-footer">
                <span>Relatório Gerado em: ${todayStr}</span>
                <span>Dossiê Consolidado • Sistema Nordeste RH+</span>
            </div>
        </div>
    `;
    
    console.log('📝 Atribuindo HTML ao dossier...');
    console.log('📏 Tamanho do HTML:', html.length, 'caracteres');
    
    area.innerHTML = html;
    
    console.log('✅ HTML atribuído ao dossier');
    
    // Carregar histórico de transferências após renderizar o HTML
    setTimeout(() => loadTransferHistory(e.id), 100);
}

window.printDossier = () => window.print();

// Carregar histórico de transferências no dossier
async function loadTransferHistory(employeeId) {
    try {
        console.log('🔍 Buscando histórico para employeeId:', employeeId);
        
        const res = await fetch(`/api/transfers/employee/${employeeId}/history`);
        console.log('📡 Status da resposta:', res.status, res.ok);
        console.log('📡 Headers:', [...res.headers.entries()]);
        
        const responseText = await res.text();
        console.log('📄 Resposta bruta:', responseText);
        console.log('📄 Tipo da resposta:', typeof responseText);
        
        let history;
        try {
            history = JSON.parse(responseText);
            console.log('📋 JSON parseado:', history);
            console.log('📋 Tipo do history:', typeof history);
            console.log('📋 É array?', Array.isArray(history));
        } catch (parseError) {
            console.error('❌ Erro ao fazer parse do JSON:', parseError);
            return;
        }
        
        const container = document.getElementById(`transfer-history-${employeeId}`);
        console.log('📦 Container encontrado:', container);
        
        if (!container) {
            console.error('❌ Container não encontrado');
            return;
        }
        
        if (!Array.isArray(history)) {
            console.error('❌ History não é array:', history);
            container.innerHTML = '<p class="text-xs text-red-500 italic">Erro: Formato de dados inválido</p>';
            return;
        }
        
        if (history.length === 0) {
            container.innerHTML = '<p class="text-xs text-gray-500 italic">Nenhuma transferência registrada</p>';
            return;
        }
        
        container.innerHTML = history.map(t => `
            <div class="bg-white rounded-lg p-3 border border-blue-100">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <p class="text-xs font-bold text-gray-800">${new Date(t.changed_at).toLocaleString('pt-BR')}</p>
                        <p class="text-xs text-gray-600">Responsável: ${t.changed_by}</p>
                    </div>
                    <span class="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-bold">
                        TRANSFERIDO
                    </span>
                </div>
                <div class="text-xs">
                    <p><strong>De:</strong> ${t.from_employer_name || 'N/A'} / ${t.from_workplace_name || 'N/A'}</p>
                    <p><strong>Para:</strong> ${t.to_employer_name || 'N/A'} / ${t.to_workplace_name || 'N/A'}</p>
                    ${t.observation ? `<p class="mt-1 italic text-gray-600">📝 ${t.observation}</p>` : '<p class="mt-1 text-sm text-gray-400 italic">Sem motivo informado</p>'}
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('❌ Erro completo em loadTransferHistory:', error);
        console.error('❌ Stack trace:', error.stack);
        
        const container = document.getElementById(`transfer-history-${employeeId}`);
        if (container) {
            container.innerHTML = `<p class="text-xs text-red-500 italic">Erro: ${error.message}</p>`;
        }
    }
}
