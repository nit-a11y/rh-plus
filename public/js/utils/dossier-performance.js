/**
 * Funções de performance para renderização do dossier
 */

// Função para criar loading state
export function createLoadingState(message = 'Carregando...') {
    return `
        <div class="flex flex-col items-center justify-center p-12 text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p class="text-blue-600 font-semibold">📋 ${message}</p>
            <p class="text-sm text-gray-500 mt-2">Aguarde alguns instantes</p>
        </div>
    `;
}

// Função para criar erro state
export function createErrorState(error, retryAction = 'location.reload()') {
    return `
        <div class="flex flex-col items-center justify-center p-12 text-center">
            <div class="text-red-500 text-4xl mb-4">❌</div>
            <p class="text-red-600 font-semibold">Erro ao carregar dossiê</p>
            <p class="text-sm text-gray-500 mt-2">${error.message}</p>
            <button onclick="${retryAction}" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Tentar novamente
            </button>
        </div>
    `;
}

// Função para medir performance
export function measurePerformance(name, fn) {
    return async (...args) => {
        const startTime = performance.now();
        try {
            const result = await fn(...args);
            const endTime = performance.now();
            console.log(`📊 ${name} executado em ${(endTime - startTime).toFixed(2)}ms`);
            
            // Disparar evento de performance
            window.dispatchEvent(new CustomEvent('performanceMeasured', { 
                detail: { name, duration: endTime - startTime, args }
            }));
            
            return result;
        } catch (error) {
            const endTime = performance.now();
            console.error(`❌ ${name} falhou após ${(endTime - startTime).toFixed(2)}ms:`, error);
            throw error;
        }
    };
}

// Função para renderização otimizada
export function optimizedRender(element, htmlGenerator) {
    return new Promise((resolve) => {
        requestAnimationFrame(() => {
            try {
                const html = htmlGenerator();
                element.innerHTML = html;
                resolve();
            } catch (error) {
                console.error('❌ Erro na renderização otimizada:', error);
                throw error;
            }
        });
    });
}
