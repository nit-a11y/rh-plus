
import { DateFixer } from './date-fixer.js';

/**
 * UTILS - MOTOR DE PRECISÃO E NEGÓCIO
 */

export function formatarDataBR(isoDate) {
    return DateFixer.formatarDataParaExibicao(isoDate);
}

export function formatarDataHoraBR(dataString) {
    if (!dataString) return '-';
    if (dataString.includes('/') && dataString.includes(':')) return dataString;
    
    try {
        const partes = dataString.split(' ');
        const dataFormatada = DateFixer.formatarDataParaExibicao(partes[0]);
        const horaFormatada = partes[1] || '00:00:00';
        return `${dataFormatada} às ${horaFormatada}`;
    } catch(e) {
        return dataString;
    }
}

export function getStatusColorClass(status) {
    switch (status) {
        case 'Em dia': return 'bg-green-100 text-green-800 border-green-200';
        case 'Próximo do vencimento': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'Vencida': return 'bg-red-100 text-red-800 border-red-200';
        case 'Inativo': return 'bg-gray-100 text-gray-800 border-gray-200';
        default: return 'bg-gray-50 text-gray-500 border-gray-100';
    }
}

export function calcularTempoCasa(dataAdm, dataDem = null) {
    if (!dataAdm) return '-';
    const inicio = new Date(dataAdm + 'T00:00:00');
    const fim = dataDem ? new Date(dataDem + 'T00:00:00') : new Date();
    
    let anos = fim.getFullYear() - inicio.getFullYear();
    let meses = fim.getMonth() - inicio.getMonth();
    
    if (meses < 0 || (meses === 0 && fim.getDate() < inicio.getDate())) {
        anos--;
        meses += 12;
    }
    
    if (anos === 0) return `${meses} meses`;
    return `${anos} anos e ${meses} meses`;
}

// Função para calcular tempo acumulado por CPF (busca todos os registros)
export async function calcularTempoAcumuladoPorCPF(cpf) {
    try {
        // Limpar CPF para busca
        const cpfLimpo = cpf.replace(/\D/g, '');
        
        const response = await fetch(`/api/employees-pro/tempo-acumulado-cpf/${cpfLimpo}`);
        
        if (!response.ok) {
            throw new Error('Erro ao buscar tempo acumulado');
        }
        
        const data = await response.json();
        
        return {
            tempoAcumulado: data.tempoAcumulado,
            totalDias: data.totalDias,
            registros: data.registros,
            totalRegistros: data.totalRegistros,
            cpf: data.cpf
        };
        
    } catch (error) {
        console.error('Erro ao calcular tempo acumulado por CPF:', error);
        return {
            tempoAcumulado: 'Erro',
            totalDias: 0,
            registros: [],
            totalRegistros: 0,
            cpf: cpf,
            erro: error.message
        };
    }
}

// Função combinada que calcula tempo atual + acumulado por CPF
export async function calcularTempoCompleto(dataAdmissaoAtual, dataDemissaoAtual = null, cpf = null) {
    // Tempo do registro atual
    const tempoAtual = calcularTempoCasa(dataAdmissaoAtual, dataDemissaoAtual);
    
    // Se não tem CPF, retorna apenas o tempo atual
    if (!cpf) {
        return {
            tempoAtual,
            tempoAcumulado: tempoAtual,
            diferenca: null,
            multiplosRegistros: false,
            totalRegistros: 1
        };
    }
    
    // Buscar tempo acumulado por CPF
    const acumuladoData = await calcularTempoAcumuladoPorCPF(cpf);
    
    // Verificar se há diferença
    const multiplosRegistros = acumuladoData.totalRegistros > 1;
    const diferenca = multiplosRegistros ? acumuladoData.tempoAcumulado : null;
    
    return {
        tempoAtual,
        tempoAcumulado: acumuladoData.tempoAcumulado,
        tempoAcumuladoDetalhado: acumuladoData,
        diferenca,
        multiplosRegistros,
        totalRegistros: acumuladoData.totalRegistros
    };
}

export function calculateAge(dateString) {
    if (!dateString || dateString === '-') return '-';
    const birthDate = new Date(dateString + 'T00:00:00');
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
}

export function parseCurrency(value) {
    if (!value || value === '-') return 0;
    if (typeof value === 'number') return value;
    
    const strValue = value.toString().replace(/[R$\s]/g, '');
    
    // Se já tem vírgula decimal (formato brasileiro 1.234,56 ou americano 1,234.56)
    //Converter diretamente
    if (strValue.includes(',') && strValue.includes('.')) {
        // Formato brasileiro: 1.234,56 → 1234.56
        const clean = strValue.replace(/\./g, '').replace(',', '.');
        return parseFloat(clean) || 0;
    }
    
    // Se só tem vírgula (formato brasileiro sem miles) ex: "1234,56"
    if (strValue.includes(',')) {
        const clean = strValue.replace(',', '.');
        return parseFloat(clean) || 0;
    }
    
    // Se não tem vírgula nem ponto - pode ser:
    // 1. Número puro do banco (pode estar em centavos)
    // 2. Número americano sem decimal
    const numValue = parseFloat(strValue) || 0;
    
    // Detectar se está em centavos: valores > 100000 são quase certamente centavos
    if (numValue > 100000) {
        return numValue / 100;
    }
    
    return numValue;
}

export function formatCurrency(value) {
    const number = typeof value === 'string' ? parseCurrency(value) : value;
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency', currency: 'BRL'
    }).format(number || 0);
}

export function formatCurrencyDebug(value, fieldName = '') {
    const number = typeof value === 'string' ? parseCurrency(value) : value;
    
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency', currency: 'BRL'
    }).format(number || 0);
}

export const formatadores = {
    moeda: formatCurrency,
    data: formatarDataBR,
    idade: calculateAge,
    tempo: calcularTempoCasa,
    dataHora: formatarDataHoraBR
};

export function formatCurrencyInput(event) {
    let value = event.target.value.replace(/\D/g, "");
    if (value === "") { event.target.value = ""; return; }
    value = (Number(value) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    event.target.value = value;
}

/**
 * MOTOR DE MÁSCARAS INTELIGENTES (UX/UI)
 * Padroniza entrada de dados e força CAIXA ALTA
 */
export const Masks = {
    cpf(v) {
        v = v.replace(/\D/g, "");
        if (v.length > 11) v = v.substring(0, 11);
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
        return v;
    },
    pis(v) {
        v = v.replace(/\D/g, "");
        if (v.length > 11) v = v.substring(0, 11);
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{5})(\d)/, "$1.$2");
        v = v.replace(/(\d{5}\.)(\d{2})/, "$1$2-"); 
        v = v.replace(/(\d{10})(\d)/, "$1-$2");
        return v;
    },
    cep(v) {
        v = v.replace(/\D/g, "");
        if (v.length > 8) v = v.substring(0, 8);
        v = v.replace(/^(\d{5})(\d)/, "$1-$2");
        return v;
    },
    phone(v) {
        v = v.replace(/\D/g, "");
        if (v.length > 11) v = v.substring(0, 11);
        v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
        v = v.replace(/(\d)(\d{4})$/, "$1-$2");
        return v;
    },
    uf(v) {
        v = v.replace(/[^a-zA-Z]/g, "");
        if (v.length > 2) v = v.substring(0, 2);
        return v.toUpperCase();
    },
    text(v) {
        return v.toUpperCase(); // Força CAIXA ALTA em nomes e textos via JS
    },
    number(v) {
        return v.replace(/\D/g, "");
    }
};

/**
 * Inicializa ouvintes de eventos para máscaras em um container
 */
export function initInputMasks(container = document) {
    const inputs = container.querySelectorAll('[data-mask]');
    inputs.forEach(input => {
        // Remover listeners antigos para evitar duplicação (clone hack)
        const newEl = input.cloneNode(true);
        input.parentNode.replaceChild(newEl, input);
        
        newEl.addEventListener('input', (e) => {
            const type = e.target.dataset.mask;
            if (Masks[type]) {
                const start = e.target.selectionStart;
                const oldVal = e.target.value;
                const newVal = Masks[type](oldVal);
                e.target.value = newVal;
                
                // Ajuste simples de cursor (opcional, pode ser melhorado)
                if (oldVal.length < newVal.length) e.target.setSelectionRange(start+1, start+1);
            }
        });
        
        // Aplica máscara inicial se já tiver valor
        if(newEl.value) newEl.value = Masks[newEl.dataset.mask](newEl.value);
    });
}
