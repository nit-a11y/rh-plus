/**
 * 📋 MÓDULO DE CONSULTA DE COLABORADORES
 * Sistema completo de visualização e exportação de dados
 */

class ConsultaColaboradores {
    constructor() {
        this.data = [];
        this.filteredData = [];
        this.sortColumn = -1;
        this.sortDirection = 'asc';
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Auto-refresh a cada 5 minutos
        setInterval(() => this.loadData(), 5 * 60 * 1000);
    }

    async loadData() {
        try {
            this.showLoading(true);
            
            const response = await fetch('/api/consulta-colaboradores');
            const result = await response.json();
            
            if (result.success) {
                this.data = result.data;
                this.filteredData = [...this.data];
                this.updateStatistics(result);
                this.populateFilters();
                this.renderTable();
                this.showLoading(false);
            } else {
                throw new Error(result.error || 'Erro ao carregar dados');
            }
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            this.showError('Erro ao carregar dados: ' + error.message);
            this.showLoading(false);
        }
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        const emptyState = document.getElementById('emptyState');
        const tabelaBody = document.getElementById('tabelaBody');
        
        if (show) {
            loading.style.display = 'block';
            emptyState.style.display = 'none';
            tabelaBody.innerHTML = '';
        } else {
            loading.style.display = 'none';
        }
    }

    showError(message) {
        // Implementar toast ou alert
        alert(message);
    }

    updateStatistics(result) {
        document.getElementById('totalCount').textContent = result.total || 0;
        document.getElementById('ativosCount').textContent = result.ativos || 0;
        document.getElementById('desligadosCount').textContent = result.desligados || 0;
        
        // Calcular média salarial (apenas ativos)
        const ativos = this.data.filter(emp => emp.saida === 'Ativo');
        const salarios = ativos
            .map(emp => parseFloat(emp.salario_atual.replace('R$ ', '').replace(',', '.')) || 0)
            .filter(sal => sal > 0);
        
        const mediaSalarial = salarios.length > 0 
            ? salarios.reduce((a, b) => a + b, 0) / salarios.length 
            : 0;
        
        document.getElementById('mediaSalarial').textContent = 
            `R$ ${mediaSalarial.toFixed(2).replace('.', ',')}`;
    }

    populateFilters() {
        // Preencher filtro de empresas
        const empresas = [...new Set(this.data.map(emp => emp.empresa).filter(e => e && e !== 'N/A'))];
        const filtroEmpresa = document.getElementById('filtroEmpresa');
        filtroEmpresa.innerHTML = '<option value="">Todas</option>';
        empresas.sort().forEach(empresa => {
            filtroEmpresa.innerHTML += `<option value="${empresa}">${empresa}</option>`;
        });

        // Preencher filtro de setores
        const setores = [...new Set(this.data.map(emp => emp.setor).filter(s => s && s !== 'N/A'))];
        const filtroSetor = document.getElementById('filtroSetor');
        filtroSetor.innerHTML = '<option value="">Todos</option>';
        setores.sort().forEach(setor => {
            filtroSetor.innerHTML += `<option value="${setor}">${setor}</option>`;
        });
    }

    filterData() {
        const status = document.getElementById('filtroStatus').value;
        const empresa = document.getElementById('filtroEmpresa').value;
        const setor = document.getElementById('filtroSetor').value;
        const busca = document.getElementById('buscaNome').value.toLowerCase();

        this.filteredData = this.data.filter(emp => {
            // Filtro de status
            if (status === 'ativos' && emp.saida !== 'Ativo') return false;
            if (status === 'desligados' && emp.saida === 'Ativo') return false;

            // Filtro de empresa
            if (empresa && emp.empresa !== empresa) return false;

            // Filtro de setor
            if (setor && emp.setor !== setor) return false;

            // Busca por nome ou CPF
            if (busca) {
                const nomeMatch = emp.nome.toLowerCase().includes(busca);
                const cpfMatch = emp.cpf.includes(busca);
                if (!nomeMatch && !cpfMatch) return false;
            }

            return true;
        });

        this.renderTable();
    }

    renderTable() {
        const tbody = document.getElementById('tabelaBody');
        const emptyState = document.getElementById('emptyState');

        if (this.filteredData.length === 0) {
            tbody.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        
        tbody.innerHTML = this.filteredData.map(emp => {
            const statusClass = emp.saida === 'Ativo' ? 'success' : 'danger';
            const statusBadge = `<span class="badge bg-${statusClass}">${emp.saida}</span>`;
            
            return `
                <tr>
                    <td>${emp.empresa}</td>
                    <td>${emp.unidade}</td>
                    <td><strong>${emp.nome}</strong></td>
                    <td>${emp.cpf}</td>
                    <td>${emp.sexo}</td>
                    <td>${emp.nascimento}</td>
                    <td>${emp.idade}</td>
                    <td>${emp.cargo}</td>
                    <td class="text-end">${emp.salario_atual}</td>
                    <td>${emp.setor}</td>
                    <td>${emp.diretoria}</td>
                    <td>${emp.ultimo_aso}</td>
                    <td>${emp.tipo}</td>
                    <td>${emp.admissao}</td>
                    <td>${statusBadge}</td>
                    <td>${emp.tempo_de_empresa}</td>
                    <td>${emp.motivo_da_saida}</td>
                </tr>
            `;
        }).join('');
    }

    sortTable(columnIndex) {
        if (this.sortColumn === columnIndex) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = columnIndex;
            this.sortDirection = 'asc';
        }

        const columns = [
            'empresa', 'unidade', 'nome', 'cpf', 'sexo', 'nascimento', 'idade',
            'cargo', 'salario_atual', 'setor', 'diretoria', 'ultimo_aso',
            'tipo', 'admissao', 'saida', 'tempo_de_empresa', 'motivo_da_saida'
        ];

        const column = columns[columnIndex];

        this.filteredData.sort((a, b) => {
            let aVal = a[column];
            let bVal = b[column];

            // Tratar valores numéricos
            if (column === 'idade' || column === 'salario_atual') {
                aVal = parseFloat(aVal.toString().replace('R$ ', '').replace(',', '.')) || 0;
                bVal = parseFloat(bVal.toString().replace('R$ ', '').replace(',', '.')) || 0;
            }

            // Tratar datas
            if (column === 'nascimento' || column === 'admissao' || column === 'ultimo_aso') {
                aVal = this.parseDate(aVal);
                bVal = this.parseDate(bVal);
            }

            if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        this.renderTable();
    }

    parseDate(dateStr) {
        if (!dateStr || dateStr === 'N/A') return new Date(0);
        
        // Tentar diferentes formatos de data
        const formats = [
            /(\d{2})\/(\d{2})\/(\d{4})/,  // DD/MM/YYYY
            /(\d{4})-(\d{2})-(\d{2})/,    // YYYY-MM-DD
        ];

        for (const format of formats) {
            const match = dateStr.match(format);
            if (match) {
                if (format === formats[0]) {
                    // DD/MM/YYYY
                    return new Date(match[3], match[2] - 1, match[1]);
                } else {
                    // YYYY-MM-DD
                    return new Date(match[1], match[2] - 1, match[3]);
                }
            }
        }

        return new Date(0);
    }

    async exportToCSV() {
        try {
            window.open('/api/consulta-colaboradores/export', '_blank');
        } catch (error) {
            console.error('Erro ao exportar:', error);
            this.showError('Erro ao exportar dados');
        }
    }
}

// Funções globais para acesso pelo HTML
let consultaApp;

window.loadData = () => consultaApp?.loadData();
window.filterData = () => consultaApp?.filterData();
window.sortTable = (col) => consultaApp?.sortTable(col);
window.exportToCSV = () => consultaApp?.exportToCSV();

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    consultaApp = new ConsultaColaboradores();
});
