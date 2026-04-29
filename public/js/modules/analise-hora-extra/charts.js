/**
 * 📈 Módulo de Gráficos para Análise de Hora Extra
 * Responsável por criar e gerenciar todos os gráficos Chart.js
 * Segue o princípio de Single Responsibility
 */

class AnaliseHoraExtraCharts {
    constructor() {
        this.charts = new Map();
        this.defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: {
                            size: 12,
                            weight: '600'
                        }
                    }
                }
            }
        };
    }

    /**
     * Destroi um gráfico específico
     * @param {string} chartId - ID do gráfico
     */
    destroyChart(chartId) {
        const chart = this.charts.get(chartId);
        if (chart) {
            chart.destroy();
            this.charts.delete(chartId);
        }
    }

    /**
     * Destroi todos os gráficos
     */
    destroyAllCharts() {
        for (const [id, chart] of this.charts) {
            chart.destroy();
        }
        this.charts.clear();
    }

    /**
     * Formata valor para moeda brasileira
     * @param {number} value - Valor a formatar
     * @returns {string} - Valor formatado
     */
    formatCurrency(value) {
        if (value === undefined || value === null || isNaN(value)) {
            return 'R$ 0,00';
        }
        return value.toLocaleString('pt-BR', { 
            style: 'currency', 
            currency: 'BRL' 
        });
    }

    /**
     * Cria gráfico de evolução mensal
     * @param {string} canvasId - ID do canvas
     * @param {Array} data - Dados do gráfico
     * @returns {Object} - Instância do gráfico
     */
    createEvolutionChart(canvasId, data) {
        // Destroi gráfico anterior se existir
        this.destroyChart(canvasId);

        const ctx = document.getElementById(canvasId);
        if (!ctx) {
            throw new Error(`Canvas #${canvasId} não encontrado`);
        }

        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(item => item.mes),
                datasets: [{
                    label: 'Horas Extras',
                    data: data.map(item => item.minutos_totais / 60),
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.1,
                    fill: true
                }, {
                    label: 'Valor (R$)',
                    data: data.map(item => item.valor_total),
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    tension: 0.1,
                    fill: true,
                    yAxisID: 'y1'
                }]
            },
            options: {
                ...this.defaultOptions,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Horas'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Valor (R$)'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                        ticks: {
                            callback: (value) => this.formatCurrency(value)
                        }
                    }
                },
                plugins: {
                    ...this.defaultOptions.plugins,
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                
                                if (context.datasetIndex === 0) {
                                    label += `${context.parsed.y.toFixed(1)} horas`;
                                } else {
                                    label += this.formatCurrency(context.parsed.y);
                                }
                                
                                return label;
                            }
                        }
                    }
                }
            }
        });

        this.charts.set(canvasId, chart);
        return chart;
    }

    /**
     * Cria gráfico de distribuição por setor (donut)
     * @param {string} canvasId - ID do canvas
     * @param {Array} data - Dados do gráfico
     * @returns {Object} - Instância do gráfico
     */
    createSectorChart(canvasId, data) {
        // Destroi gráfico anterior se existir
        this.destroyChart(canvasId);

        const ctx = document.getElementById(canvasId);
        if (!ctx) {
            throw new Error(`Canvas #${canvasId} não encontrado`);
        }

        // Cores consistentes para o gráfico
        const colors = [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 206, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
            'rgba(255, 159, 64, 0.8)',
            'rgba(199, 199, 199, 0.8)',
            'rgba(83, 102, 255, 0.8)'
        ];

        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.map(item => item.setor),
                datasets: [{
                    data: data.map(item => item.valor_total),
                    backgroundColor: colors.slice(0, data.length),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                ...this.defaultOptions,
                plugins: {
                    ...this.defaultOptions.plugins,
                    legend: {
                        position: 'right',
                        labels: {
                            padding: 15,
                            font: {
                                size: 11
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = this.formatCurrency(context.parsed);
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '60%'
            }
        });

        this.charts.set(canvasId, chart);
        return chart;
    }

    /**
     * Atualiza dados de um gráfico existente
     * @param {string} chartId - ID do gráfico
     * @param {Object} newData - Novos dados
     */
    updateChart(chartId, newData) {
        const chart = this.charts.get(chartId);
        if (!chart) {
            console.warn(`Gráfico #${chartId} não encontrado para atualização`);
            return;
        }

        if (newData.labels) {
            chart.data.labels = newData.labels;
        }
        
        if (newData.datasets) {
            chart.data.datasets = newData.datasets;
        }

        chart.update('active');
    }

    /**
     * Redimensiona todos os gráficos
     */
    resizeAllCharts() {
        for (const chart of this.charts.values()) {
            chart.resize();
        }
    }

    /**
     * Retorna estatísticas dos gráficos
     * @returns {Object} - Estatísticas
     */
    getStats() {
        return {
            totalCharts: this.charts.size,
            chartIds: Array.from(this.charts.keys())
        };
    }
}

// Exporta instância única (Singleton)
const chartManager = new AnaliseHoraExtraCharts();

// Exporta para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AnaliseHoraExtraCharts, chartManager };
} else {
    window.AnaliseHoraExtraCharts = AnaliseHoraExtraCharts;
    window.chartManager = chartManager;
}
