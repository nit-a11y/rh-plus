
/**
 * MOTOR DE PRECISÃO TEMPORAL - NORDESTE RH+
 * Resolve o bug de "D-1" (dia anterior) e gerencia logs de auditoria.
 */

export const DateFixer = {
    /**
     * Converte YYYY-MM-DD do banco para DD/MM/YYYY sem sofrer interferência de fuso horário.
     */
    formatarDataParaExibicao(dateString, incluirHora = false) {
        if (!dateString || dateString === '-') return '-';

        // Se a data vier com o timestamp completo do SQLite (YYYY-MM-DD HH:MM:SS ou ISO T)
        const partes = dateString.split(/[\sT]/);
        const apenasData = partes[0];
        const apenasHora = partes[1] ? partes[1].split('.')[0] : '00:00:00';

        // Verifica se é o formato ISO YYYY-MM-DD
        if (apenasData.includes('-')) {
            const [ano, mes, dia] = apenasData.split('-');
            const dataBR = `${dia}/${mes}/${ano}`;
            return incluirHora ? `${dataBR} ${apenasHora}` : dataBR;
        }

        return dateString;
    },

    /**
     * Retorna a data e hora atual no formato brasileiro para auditoria visual.
     */
    obterTimestampAudit() {
        return new Date().toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    },

};

// Injeta no window para uso em scripts legados
window.DateFixer = DateFixer;
