
const MANUAL_DATA = {
    intro: `
        <div class="animate-manual">
            <p class="m-subtitle">01. Fundamentos</p>
            <h1 class="m-title">Ecossistema <span class="text-nordeste-red">Nordeste RH+</span></h1>
            <p class="m-p">Bem-vindo ao centro de inteligência da Nordeste Locações. Este sistema foi projetado para ser o braço direito do RH, unindo <b>Gestão de Pessoas</b>, <b>Logística de Uniformes</b> e <b>Segurança do Trabalho</b> em uma única interface fluida.</p>
            
            <div class="m-card border-l-8 border-nordeste-red bg-red-50/30">
                <h3 class="font-black text-gray-800 uppercase italic mb-2">A Filosofia "Zero Planilha"</h3>
                <p class="text-sm text-gray-600 leading-relaxed">O objetivo principal é eliminar o uso de arquivos externos. Quando um dado entra no Nordeste RH+, ele se torna uma entidade viva que alimenta gráficos, gera documentos e dispara alertas automáticos.</p>
            </div>

            <h2 class="m-h2">A Jornada de Implantação</h2>
            <p class="m-p">Para que o sistema funcione com 100% de sua inteligência, siga a ordem lógica de configuração:</p>
            
            <div class="space-y-4">
                <div class="step-box">
                    <div class="step-num">1</div>
                    <div>
                        <h4 class="font-black text-gray-800 uppercase">Matriz de Cargos</h4>
                        <p class="text-xs text-gray-500">Cadastre todos os cargos da empresa com seus respectivos CBOs e Setores. Isso evita erros de digitação no futuro.</p>
                    </div>
                </div>
                <div class="step-box">
                    <div class="step-num">2</div>
                    <div>
                        <h4 class="font-black text-gray-800 uppercase">Kits de Enxoval</h4>
                        <p class="text-xs text-gray-500">Vincule cada cargo ao seu kit de fardamento ideal. O sistema usará isso para "injetar" as roupas no colaborador no momento da admissão.</p>
                    </div>
                </div>
                <div class="step-box">
                    <div class="step-num">3</div>
                    <div>
                        <h4 class="font-black text-gray-800 uppercase">Empresas e Unidades</h4>
                        <p class="text-xs text-gray-500">Defina quem é o Empregador (CNPJ do contrato) e onde é a Unidade Física (onde o funcionário bate o ponto).</p>
                    </div>
                </div>
            </div>
        </div>
    `,
    'onboarding': `
        <div class="animate-manual">
            <p class="m-subtitle">Guia Operacional</p>
            <h1 class="m-title">Passo a Passo: <span class="text-nordeste-red">Admissão do Zero</span></h1>
            <p class="m-p">Este é o fluxo ideal para cadastrar um novo colaborador garantindo que todos os módulos sejam alimentados corretamente.</p>
            
            <div class="m-card">
                <h3 class="font-black text-gray-800 uppercase italic mb-6">Fase 1: Preparação (Mestre de Colaboradores)</h3>
                <div class="space-y-6">
                    <div class="flex gap-4">
                        <span class="w-6 h-6 bg-nordeste-red text-white rounded-full flex items-center justify-center text-[10px] font-black shrink-0">1</span>
                        <p class="text-sm text-gray-600">Acesse <b>"Mestre de Colab."</b> e clique em <b>"Novo Colaborador"</b>.</p>
                    </div>
                    <div class="flex gap-4">
                        <span class="w-6 h-6 bg-nordeste-red text-white rounded-full flex items-center justify-center text-[10px] font-black shrink-0">2</span>
                        <p class="text-sm text-gray-600">Selecione o <b>Empregador Legal</b> e o <b>Local de Atuação</b>. <i>Isso alimenta o BI de geolocalização.</i></p>
                    </div>
                    <div class="flex gap-4">
                        <span class="w-6 h-6 bg-nordeste-red text-white rounded-full flex items-center justify-center text-[10px] font-black shrink-0">3</span>
                        <p class="text-sm text-gray-600">Escolha o <b>Cargo na Matriz</b>. O sistema preencherá automaticamente o Setor e o CBO.</p>
                    </div>
                    <div class="flex gap-4">
                        <span class="w-6 h-6 bg-nordeste-red text-white rounded-full flex items-center justify-center text-[10px] font-black shrink-0">4</span>
                        <p class="text-sm text-gray-600">Informe o <b>Salário Base</b> e a <b>Data de Admissão</b>.</p>
                    </div>
                </div>
            </div>

            <div class="m-card bg-blue-50 border-blue-100">
                <h3 class="font-black text-blue-800 uppercase italic mb-6">Fase 2: Fardamento & Medidas</h3>
                <div class="space-y-4">
                    <p class="text-sm text-blue-900 font-bold">⚠️ CRÍTICO: Selecione os tamanhos de Camisa, Calça e Calçado corretamente.</p>
                    <p class="text-xs text-blue-700">Ao clicar em <b>"Finalizar Admissão Digital"</b>, o sistema consultará o Kit do cargo e criará automaticamente as peças no inventário do funcionário com os tamanhos escolhidos.</p>
                </div>
            </div>

            <div class="m-card bg-green-50 border-green-100">
                <h3 class="font-black text-green-800 uppercase italic mb-6">Fase 3: Saúde (ASO)</h3>
                <p class="text-sm text-green-900">O sistema gera um <b>ASO Admissional</b> automático com validade de 12 meses. Você pode conferir isso no módulo <b>"Saúde (ASO/SST)"</b> imediatamente após o cadastro.</p>
            </div>
        </div>
    `,
    'tech': `
        <div class="animate-manual">
            <p class="m-subtitle">01. Fundamentos</p>
            <h1 class="m-title">Arquitetura <span class="text-nordeste-red">Técnica Master</span></h1>
            <p class="m-p">O Nordeste RH+ foi construído sob o paradigma de <b>Simplicidade e Performance Extrema</b>. Utilizamos uma stack "Vanilla-First" para garantir que o sistema seja leve, independente de conexões externas lentas e de fácil manutenção.</p>
            
            <h2 class="m-h2">A Engrenagem Principal</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div class="p-8 bg-gray-900 text-white rounded-[2rem] shadow-xl border-b-8 border-nordeste-red">
                    <h4 class="font-black text-nordeste-red uppercase text-xs mb-4">🖥️ Backend Engine</h4>
                    <ul class="space-y-3 text-[11px] font-medium">
                        <li class="flex items-center gap-2"><span class="text-nordeste-red">●</span> Node.js + Express.js API</li>
                        <li class="flex items-center gap-2"><span class="text-nordeste-red">●</span> SQLite3 Relacional (Persistência Local)</li>
                        <li class="flex items-center gap-2"><span class="text-nordeste-red">●</span> Arquitetura de Rotas Modularizada</li>
                        <li class="flex items-center gap-2"><span class="text-nordeste-red">●</span> Middleware de Segurança & Auth</li>
                    </ul>
                </div>
                <div class="p-8 bg-white border border-gray-100 rounded-[2rem] shadow-sm border-b-8 border-gray-800">
                    <h4 class="font-black text-gray-800 uppercase text-xs mb-4">🎨 Frontend UI/UX</h4>
                    <ul class="space-y-3 text-[11px] font-medium text-gray-600">
                        <li class="flex items-center gap-2"><span class="text-gray-800">○</span> HTML5 Semântico & CSS3 Grid/Flex</li>
                        <li class="flex items-center gap-2"><span class="text-gray-800">○</span> JavaScript Vanilla (Zero Frameworks)</li>
                        <li class="flex items-center gap-2"><span class="text-gray-800">○</span> Motor de Estado (State Management) Custom</li>
                        <li class="flex items-center gap-2"><span class="text-gray-800">○</span> Tailwind CSS JIT (Estilização Rápida)</li>
                    </ul>
                </div>
            </div>

            <h2 class="m-h2">Modelagem de Dados (Entity-Relationship)</h2>
            <div class="m-card">
                <p class="m-p">O sistema opera sobre um banco de dados relacional que garante a <b>Integridade Referencial</b>. As principais tabelas são:</p>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="p-4 border rounded-xl"><b class="block text-nordeste-red text-xs">employees</b><span class="text-[9px] text-gray-400 font-bold">Núcleo Central</span></div>
                    <div class="p-4 border rounded-xl"><b class="block text-nordeste-red text-xs">uniform_items</b><span class="text-[9px] text-gray-400 font-bold">Inventário Ativo</span></div>
                    <li class="p-4 border rounded-xl list-none"><b class="block text-nordeste-red text-xs">career_history</b><span class="text-[9px] text-gray-400 font-bold">Logs de Promoção</span></li>
                </div>
                <p class="text-[10px] text-gray-500 mt-6 italic bg-gray-50 p-4 rounded-xl">"O sistema utiliza o concept de <b>Cascade Deletion</b> apenas em módulos específicos, garantindo que o histórico de carreira e fardamento nunca seja apagado, mesmo que um colaborador seja inativado."</p>
            </div>

            <h2 class="m-h2">Integrações & Libs de Apoio</h2>
            <div class="space-y-4">
                <div class="step-box">
                    <div class="step-num">📈</div>
                    <div>
                        <h4 class="font-black text-gray-800 uppercase">Chart.js Engine</h4>
                        <p class="text-xs text-gray-500">Renderização de dashboards financeiros e demográficos em tempo real.</p>
                    </div>
                </div>
                <div class="step-box">
                    <div class="step-num">📍</div>
                    <div>
                        <h4 class="font-black text-gray-800 uppercase">Leaflet.js + GeoJSON</h4>
                        <p class="text-xs text-gray-500">Mapeamento geográfico de colaboradores baseado no arquivo de coordenadas estático.</p>
                    </div>
                </div>
                <div class="step-box">
                    <div class="step-num">📄</div>
                    <div>
                        <h4 class="font-black text-gray-800 uppercase">jsPDF + AutoTable</h4>
                        <p class="text-xs text-gray-500">Geração de documentos auditáveis e dossiês em formato PDF diretamente no navegador.</p>
                    </div>
                </div>
            </div>
        </div>
    `,
    'uniform-logic': `
        <div class="animate-manual">
            <p class="m-subtitle">02. Fardamento Inteligente</p>
            <h1 class="m-title">Gestão de <span class="text-nordeste-red">Inventário Ativo</span></h1>
            <p class="m-p">O módulo de fardamento não é apenas um registro de entrega, é um sistema de monitoramento de depreciação têxtil.</p>
            
            <h2 class="m-h2">Significado das Cores (Status)</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                <div class="p-4 bg-green-100 rounded-2xl border border-green-200">
                    <p class="text-[10px] font-black text-green-800 uppercase">Verde (Em Dia)</p>
                    <p class="text-[9px] text-green-700 mt-1">A peça está dentro do prazo de vida útil estimado.</p>
                </div>
                <div class="p-4 bg-yellow-100 rounded-2xl border border-yellow-200">
                    <p class="text-[10px] font-black text-yellow-800 uppercase">Amarelo (Atenção)</p>
                    <p class="text-[9px] text-yellow-700 mt-1">Faltam menos de 30 dias para o vencimento do ciclo.</p>
                </div>
                <div class="p-4 bg-red-100 rounded-2xl border border-red-200">
                    <p class="text-[10px] font-black text-red-800 uppercase">Vermelho (Vencido)</p>
                    <p class="text-[9px] text-red-700 mt-1">Troca obrigatória necessária para manter o padrão visual.</p>
                </div>
            </div>

            <h2 class="m-h2">Funcionalidades do Módulo</h2>
            <ul class="space-y-6">
                <li class="step-box">
                    <div class="step-num">🔄</div>
                    <div>
                        <h4 class="font-black text-gray-800 uppercase">Registrar Troca</h4>
                        <p class="text-sm text-gray-500 italic">"Zera" o cronômetro da peça. Se for por avaria, exige justificativa que fica gravada no log de auditoria do colaborador.</p>
                    </div>
                </li>
                <li class="step-box">
                    <div class="step-num">↩️</div>
                    <div>
                        <h4 class="font-black text-gray-800 uppercase">Devolver Peça</h4>
                        <p class="text-sm text-gray-500 italic">Remove o item do inventário ativo (usado em desligamentos ou trocas de kit por promoção).</p>
                    </div>
                </li>
                <li class="step-box">
                    <div class="step-num">➕</div>
                    <div>
                        <h4 class="font-black text-gray-800 uppercase">Item Avulso</h4>
                        <p class="text-sm text-gray-500 italic">Permite entregar peças extras que não fazem parte do kit padrão (ex: Jaqueta térmica em casos excepcionais).</p>
                    </div>
                </li>
            </ul>
        </div>
    `,
    'kits': `
        <div class="animate-manual">
            <p class="m-subtitle">02. Fardamento Inteligente</p>
            <h1 class="m-title">Gestão de <span class="text-nordeste-red">Enxovais (Kits)</span></h1>
            <p class="m-p">Para garantir a padronização visual e a automação de entregas, o sistema utiliza o concept de <b>Kits Organizacionais</b>.</p>
            
            <div class="m-card">
                <h3 class="font-black text-gray-800 uppercase italic mb-4">O que é um Kit?</h3>
                <p class="m-p">Um Kit é um conjunto de itens (Fardamento, EPIs ou Ferramentas) vinculado a um <b>Cargo na Matriz</b>. Quando um funcionário é admitido para esse cargo, o sistema consulta o Kit e gera todos os itens de uma só vez.</p>
            </div>

            <h2 class="m-h2">Configuração Estratégica</h2>
            <p class="m-p">No módulo de Kits, você define:</p>
            <ul class="space-y-4 mb-8">
                <li class="flex items-center gap-3">
                    <span class="w-8 h-8 rounded-xl bg-nordeste-red text-white flex items-center justify-center font-black">1</span>
                    <p class="text-sm text-gray-600"><b>Vínculo Hieraquico:</b> O kit só pode ser associado a cargos existentes na matriz.</p>
                </li>
                <li class="flex items-center gap-3">
                    <span class="w-8 h-8 rounded-xl bg-nordeste-red text-white flex items-center justify-center font-black">2</span>
                    <p class="text-sm text-gray-600"><b>Auto-Sugestão:</b> O sistema sugere peças baseadas na categoria (OP ganha Jeans, ADM ganha Polo Azul).</p>
                </li>
                <li class="flex items-center gap-3">
                    <span class="w-8 h-8 rounded-xl bg-nordeste-red text-white flex items-center justify-center font-black">3</span>
                    <p class="text-sm text-gray-600"><b>Medidas Dinâmicas:</b> No kit você define apenas o "modelo". O tamanho real (P, M, G, 42) é puxado da ficha do funcionário na hora da injeção.</p>
                </li>
            </ul>

            <div class="p-8 bg-gray-900 rounded-[2.5rem] text-white">
                <h4 class="font-black text-red-400 uppercase italic mb-4">Impacto na Promoção</h4>
                <p class="text-xs text-gray-400 leading-relaxed">Se um colaborador mudar de cargo (ex: de Ajudante para Líder) e o novo cargo possuir um kit diferente, o sistema alertará sobre a <b>necessidade de troca de enxoval</b>, garantindo que o colaborador use sempre a vestimenta correta da sua nova função.</p>
            </div>
        </div>
    `,
    'career': `
        <div class="animate-manual">
            <p class="m-subtitle">03. Gestão Profissional</p>
            <h1 class="m-title">Engenharia de <span class="text-nordeste-red">Carreira</span></h1>
            <p class="m-p">Este módulo rastreia a evolução financeira e hierárquica, transformando histórico em indicadores de retenção.</p>
            
            <h2 class="m-h2">O Painel de Variação</h2>
            <div class="m-card bg-nordeste-black text-white">
                <p class="text-[9px] font-black text-nordeste-red uppercase tracking-widest mb-4">Cálculo de Valorização</p>
                <p class="m-p !text-gray-300">O sistema captura o <b>Salário da Admissão</b> e compara com o <b>Salário Atual</b>. 
                <br><br>Fórmula: <span class="code-inline">((Salário Atual - Salário Inicial) / Salário Inicial) * 100</span>
                <br><br>Isso gera a porcentagem de crescimento que você vê no card principal do módulo.</p>
            </div>

            <h2 class="m-h2">Ações de Trajetória</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="p-6 border rounded-3xl">
                    <h4 class="font-black text-gray-800 uppercase text-xs">Promoção / Cargo</h4>
                    <p class="text-[10px] text-gray-500 mt-2">Altera Cargo, CBO e Salário. Se o novo cargo tiver um kit de fardamento diferente (ex: OP para ADM), o sistema sugerirá a troca total do enxoval.</p>
                </div>
                <div class="p-6 border rounded-3xl">
                    <h4 class="font-black text-amber-600 uppercase text-xs">Bonificação</h4>
                    <p class="text-[10px] text-gray-500 mt-2">Registra prêmios ou valores pontuais que não alteram o salário base, mas contam como mérito no prontuário.</p>
                </div>
                <div class="p-6 border rounded-3xl">
                    <h4 class="font-black text-red-600 uppercase text-xs">Reajuste Coletivo</h4>
                    <p class="text-[10px] text-gray-500 mt-2">Localizado na sidebar, permite aplicar um percentual de aumento (ex: 5%) para <b>todos os funcionários ativos</b> de uma só vez via processo em lote (bulk).</p>
                </div>
            </div>
        </div>
    `,
    'vacation': `
        <div class="animate-manual">
            <p class="m-subtitle">03. Gestão Profissional</p>
            <h1 class="m-title">Compliance de <span class="text-nordeste-red">Férias PRO</span></h1>
            <p class="m-p">O módulo de férias é blindado com as regras da CLT para evitar passivos trabalhistas.</p>
            
            <h2 class="m-h2">Inteligência de Prazos</h2>
            <div class="m-card">
                <table class="paper-table">
                    <thead><tr><th>Situação</th><th>Critério Temporal</th><th>Status Visual</th></tr></thead>
                    <tbody>
                        <tr><td><b>Em Carência</b></td><td>Menos de 18 meses de registro</td><td>Cinza (Bloqueado)</td></tr>
                        <tr><td><b>Apto</b></td><td>Entre 18 e 23 meses</td><td>Verde (Ideal)</td></tr>
                        <tr><td><b>Risco Crítico</b></td><td>Mais de 24 meses sem gozo</td><td>Vermelho (Urgente)</td></tr>
                    </tbody>
                </table>
            </div>

            <h2 class="m-h2">Calculadora Master (Fórmulas)</h2>
            <div class="p-8 bg-gray-50 rounded-[2rem] border border-gray-200">
                <div class="mb-6">
                    <p class="text-[10px] font-black text-gray-400 uppercase">1. Remuneração Base (30 dias)</p>
                    <p class="text-sm font-mono text-gray-700">Salário / 30 * Dias de Gozo</p>
                </div>
                <div class="mb-6">
                    <p class="text-[10px] font-black text-gray-400 uppercase">2. 1/3 Constitucional</p>
                    <p class="text-sm font-mono text-gray-700">Resultado do item 1 / 3</p>
                </div>
                <div class="mb-6">
                    <p class="text-[10px] font-black text-blue-600 uppercase">3. Abono Pecuniário (Venda de 10 dias)</p>
                    <p class="text-sm font-mono text-blue-700">(Salário / 30 * 10) + (Valor dos 10 dias / 3)</p>
                </div>
            </div>

            <h2 class="m-h2">Mapa Anual (Gantt)</h2>
            <p class="m-p">Na visão de <b>"Planejamento"</b>, você vê uma barra temporal. Ela serve para evitar que funcionários cruciais do mesmo setor saiam na mesma data, prevenindo buracos na operação.</p>
        </div>
    `,
    'sst': `
        <div class="animate-manual">
            <p class="m-subtitle">04. Saúde & BI</p>
            <h1 class="m-title">Segurança do Trabalho <span class="text-nordeste-red">(SST)</span></h1>
            <p class="m-p">Monitoramento rigoroso da saúde ocupacional e frequência médica.</p>
            
            <h2 class="m-h2">Gestão de ASOs</h2>
            <p class="m-p">O sistema controla 3 tipos de exames:</p>
            <div class="space-y-3 mb-8">
                <div class="p-4 border rounded-2xl flex justify-between items-center">
                    <div><span class="font-black text-xs uppercase">Admissional</span><p class="text-[9px] text-gray-400">Gerado automaticamente no cadastro.</p></div>
                    <span class="badge badge-neutral">12 Meses</span>
                </div>
                <div class="p-4 border rounded-2xl flex justify-between items-center">
                    <div><span class="font-black text-xs uppercase">Periódico</span><p class="text-[9px] text-gray-400">Deve ser renovado anualmente ou a cada 2 anos.</p></div>
                    <span class="badge badge-warning">Renovável</span>
                </div>
                <div class="p-4 border rounded-2xl flex justify-between items-center">
                    <div><span class="font-black text-xs uppercase">Demissional</span><p class="text-[9px] text-gray-400">Obrigatório no encerramento do contrato.</p></div>
                    <span class="badge badge-danger">Finalizador</span>
                </div>
            </div>

            <h2 class="m-h2">Absenteísmo (Atestados)</h2>
            <p class="m-p">Ao lançar um atestado, o sistema calcula os dias de afastamento e vincula o CID. No BI, você verá a <b>Taxa de Absenteísmo</b>, ajudando a identificar setores com alta incidência de doenças ocupacionais.</p>
        </div>
    `,
    'bi': `
        <div class="animate-manual">
            <p class="m-subtitle">04. Saúde & BI</p>
            <h1 class="m-title">Inteligência <span class="text-nordeste-red">Estratégica</span></h1>
            <p class="m-p">Transformamos o banco de dados em visão executiva para tomada de decisão.</p>
            
            <h2 class="m-h2">Métricas Disponíveis</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="m-card">
                    <h4 class="font-black text-gray-800 uppercase text-xs mb-3">📍 Geodensidade</h4>
                    <p class="text-[10px] text-gray-500 leading-relaxed">Mapa interativo que mostra onde os colaboradores moram. Use isso para planejar rotas de transporte e reduzir custos de vale-transporte.</p>
                </div>
                <div class="m-card">
                    <h4 class="font-black text-gray-800 uppercase text-xs mb-3">📉 Taxa de Turnover</h4>
                    <p class="text-[10px] text-gray-500 leading-relaxed">Relação entre admissões e desligamentos no período. Ajuda a medir a estabilidade da cultura organizacional.</p>
                </div>
                <div class="m-card">
                    <h4 class="font-black text-gray-800 uppercase text-xs mb-3">📊 Custo de Folha</h4>
                    <p class="text-[10px] text-gray-500 leading-relaxed">Visualização da soma salarial por setor. Permite identificar onde a empresa está investindo mais capital humano.</p>
                </div>
                <div class="m-card">
                    <h4 class="font-black text-gray-800 uppercase text-xs mb-3">🎂 Pirâmide Etária</h4>
                    <p class="text-[10px] text-gray-500 leading-relaxed">Distribuição de idade. Crucial para planos de sucessão e diversidade geracional.</p>
                </div>
            </div>
        </div>
    `
};

document.addEventListener('DOMContentLoaded', () => {
    initManual();
});

function initManual() {
    const navItems = document.querySelectorAll('#manual-nav .nav-item');
    const contentArea = document.getElementById('manual-content');

    navItems.forEach(item => {
        item.onclick = () => {
            const target = item.dataset.target;
            
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            contentArea.innerHTML = MANUAL_DATA[target] || `<p class="m-p">Capítulo em desenvolvimento...</p>`;
            contentArea.scrollTo(0, 0);
        };
    });

    const urlParams = new URLSearchParams(window.location.search);
    const initialTab = urlParams.get('tab') || 'intro';
    
    const activeItem = Array.from(navItems).find(i => i.dataset.target === initialTab);
    if(activeItem) activeItem.click();
    else contentArea.innerHTML = MANUAL_DATA.intro;
}

// --- GERADOR DE CERTIFICADO INSTITUCIONAL PREMIUM (V3) ---
window.generateCertificate = async () => {
    const user = Auth.getUser();
    if (!user) return alert("Erro: Usuário não autenticado.");

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // 1. FUNDO E MARCA D'ÁGUA TÉCNICA
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Marca d'água Diagonal (Nordeste Locações)
    doc.setTextColor(252, 252, 252);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(70);
    doc.text("NORDESTE LOCAÇÕES", pageWidth / 2, pageHeight / 2, { align: 'center', angle: 45 });

    // 2. MOLDURAS PREMIUM
    doc.setDrawColor(211, 47, 47); // Vermelho Nordeste
    doc.setLineWidth(0.8);
    doc.rect(8, 8, pageWidth - 16, pageHeight - 16, 'S');
    
    doc.setDrawColor(255, 235, 238); // Rosa Coral Sutil
    doc.setLineWidth(0.4);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20, 'S');

    // 3. LOGO DA NORDESTE (CANTO SUPERIOR ESQUERDO) - SUBSTITUI A FOTO
    const logoUrl = "https://raw.githubusercontent.com/caiquecustodiob/Apresenta-o/21a61cab378f5c952913acb77aa90e037d234c5e/imagens/logo-nordeste-white.svg";
    try {
        const imgData = await getBase64ImageFromURL(logoUrl);
        if (imgData) {
            // Container vermelho para dar contraste à logo branca
            doc.setFillColor(211, 47, 47);
            doc.roundedRect(15, 15, 38, 18, 3, 3, 'F');
            doc.addImage(imgData, 'PNG', 18, 16.5, 32, 15);
        }
    } catch (e) { 
        console.warn("Erro ao carregar logo institucional");
        // Fallback: apenas texto se a logo falhar
        doc.setTextColor(211, 47, 47);
        doc.setFontSize(10);
        doc.text("NORDESTE LOCAÇÕES", 18, 25);
    }

    // 4. CABEÇALHO CENTRALIZADO
    doc.setTextColor(211, 47, 47);
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text("CERTIFICADO DE CONCLUSÃO", pageWidth / 2, 40, { align: 'center', charSpace: 1.5 });
    
    doc.setTextColor(160, 160, 160);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("SISTEMA INTEGRADO DE GESTÃO ESTRATÉGICA • NORDESTE RH+", pageWidth / 2, 48, { align: 'center' });

    // 5. TEXTO DE RECONHECIMENTO
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(14);
    doc.text("Reconhecemos formalmente para fins de conformidade e excelência que", pageWidth / 2, 65, { align: 'center' });
    
    doc.setTextColor(183, 28, 28); // Vermelho Profundo
    doc.setFontSize(42);
    doc.setFont("times", "bolditalic");
    doc.text(user.name.toUpperCase(), pageWidth / 2, 85, { align: 'center' });

    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    const bodyText = [
        "concluiu com êxito a capacitação técnica integral no ecossistema Nordeste RH+, demonstrando pleno domínio funcional,",
        "autonomia operacional e compreensão avançada dos fluxos de Gestão de Pessoas, Logística Inteligente e Saúde Ocupacional.",
        "O participante está homologado para operar as ferramentas de inteligência corporativa da Nordeste Locações."
    ];
    let bodyY = 100;
    bodyText.forEach(line => {
        doc.text(line, pageWidth / 2, bodyY, { align: 'center' });
        bodyY += 6;
    });

    // 6. COMPETÊNCIAS EM CARDS (ESTILIZADO)
    const modules = [
        ["Fundamentos do Sistema", "Lógica operacional e padronização"],
        ["Admissão & Colaboradores", "Gestão legal e vínculos contratuais"],
        ["Fardamento Inteligente", "Logística, ciclos e rastreabilidade"],
        ["Plano de Carreira", "Desenvolvimento e histórico salarial"],
        ["Saúde e Segurança (SST)", "Compliance ASO e normas vigentes"],
        ["Business Intelligence", "Análise de indicadores e suporte à decisão"]
    ];

    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.setFont("helvetica", "bold");
    doc.text("COMPETÊNCIAS AVALIADAS E HOMOLOGADAS:", pageWidth / 2, 132, { align: 'center' });

    let startX = 25;
    let startY = 140;
    const cardWidth = 80;
    const cardHeight = 16;
    const gap = 4;

    modules.forEach((mod, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const x = startX + (col * (cardWidth + gap));
        const y = startY + (row * (cardHeight + gap));

        // Desenhar Card
        doc.setFillColor(252, 252, 252);
        doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'F');
        doc.setDrawColor(240, 240, 240);
        doc.setLineWidth(0.2);
        doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'S');

        // Bullet Red
        doc.setFillColor(211, 47, 47);
        doc.circle(x + 4, y + 6, 0.8, 'F');

        // Texto Card
        doc.setTextColor(60, 60, 60);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text(mod[0], x + 7, y + 6.5);
        
        doc.setTextColor(140, 140, 140);
        doc.setFontSize(6.5);
        doc.setFont("helvetica", "normal");
        doc.text(mod[1], x + 7, y + 11.5);
    });

    // 7. ASSINATURA E DATA
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.4);
    doc.line(pageWidth / 2 - 55, 183, pageWidth / 2 + 55, 183);
    
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("DIRETORIA DE OPERAÇÕES RH & DESENVOLVIMENTO NORDESTE", pageWidth / 2, 189, { align: 'center' });
    
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    const dateStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    doc.text(`Emitido digitalmente em ${dateStr}`, pageWidth / 2, 194, { align: 'center' });

    // 8. RODAPÉ TÉCNICO
    doc.setTextColor(230, 230, 230);
    doc.setFontSize(6);
    const authCode = `CERT-HASH: ${user.id.toUpperCase()}-${Date.now().toString(16).toUpperCase()}`;
    doc.text(authCode, 15, pageHeight - 12);
    doc.text("VALIDAÇÃO INTERNA • DOCUMENTO AUDITÁVEL", pageWidth - 15, pageHeight - 12, { align: 'right' });

    // Download
    doc.save(`Certificado_Premium_V3_${user.username}.pdf`);
};

// Helper para converter imagem em base64 via Canvas (Suporta SVG renderizando em PNG)
async function getBase64ImageFromURL(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.setAttribute("crossOrigin", "anonymous");
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width; 
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/png")); // Uso de PNG para preservar transparência do SVG
        };
        img.onerror = e => reject(e);
        img.src = url;
    });
}
