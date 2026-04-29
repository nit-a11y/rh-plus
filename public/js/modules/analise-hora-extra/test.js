/**
 * 🧪 Script de Teste para Verificar Carregamento dos Módulos
 * Use este script para debug dos problemas de inicialização
 */

// Função para testar se todos os módulos foram carregados
function testModuleLoading() {
    console.log('🧪 Iniciando teste de carregamento de módulos...');
    
    const modules = [
        { name: 'analiseAPI', obj: window.analiseAPI },
        { name: 'chartManager', obj: window.chartManager },
        { name: 'filterManager', obj: window.filterManager },
                { name: 'dashboard', obj: window.dashboard }
    ];
    
    let allLoaded = true;
    
    modules.forEach(module => {
        if (module.obj) {
            console.log(`✅ ${module.name}: Carregado`);
            
            // Testa se tem métodos essenciais
            if (module.name === 'analiseAPI') {
                const hasMethods = typeof module.obj.getDashboard === 'function' && 
                                  typeof module.obj.getEvolution === 'function';
                console.log(`   ${hasMethods ? '✅' : '❌'} Métodos essenciais: ${hasMethods ? 'Presentes' : 'Ausentes'}`);
            }
            
            if (module.name === 'chartManager') {
                const hasMethods = typeof module.obj.createEvolutionChart === 'function' && 
                                  typeof module.obj.createSectorChart === 'function';
                console.log(`   ${hasMethods ? '✅' : '❌'} Métodos essenciais: ${hasMethods ? 'Presentes' : 'Ausentes'}`);
            }
            
            if (module.name === 'filterManager') {
                const hasMethods = typeof module.obj.initialize === 'function' && 
                                  typeof module.obj.getFilters === 'function';
                console.log(`   ${hasMethods ? '✅' : '❌'} Métodos essenciais: ${hasMethods ? 'Presentes' : 'Ausentes'}`);
            }
            
            if (module.name === 'dashboard') {
                const hasMethods = typeof module.obj.initialize === 'function' && 
                                  typeof module.obj.switchTab === 'function';
                console.log(`   ${hasMethods ? '✅' : '❌'} Métodos essenciais: ${hasMethods ? 'Presentes' : 'Ausentes'}`);
            }
            
                    } else {
            console.log(`❌ ${module.name}: NÃO carregado`);
            allLoaded = false;
        }
    });
    
    console.log(`\n📊 Resultado: ${allLoaded ? '✅ Todos os módulos carregados' : '❌ Alguns módulos não carregados'}`);
    
    return allLoaded;
}

// Função para testar elementos DOM
function testDOMElements() {
    console.log('\n🏗️ Testando elementos DOM...');
    
    const elements = [
        { id: 'filter-year', name: 'Filtro de ano' },
        { id: 'filter-month', name: 'Filtro de mês' },
        { id: 'filter-unit', name: 'Filtro de unidade' },
        { id: 'tab-dashboard', name: 'Aba dashboard' },
        { id: 'tab-comparison', name: 'Aba comparação' },
        { id: 'dashboard-content', name: 'Conteúdo dashboard' },
        { id: 'comparison-content', name: 'Conteúdo comparação' },
        { id: 'evolution-chart', name: 'Gráfico evolução' },
        { id: 'sector-chart', name: 'Gráfico setor' }
    ];
    
    let allFound = true;
    
    elements.forEach(element => {
        const el = document.getElementById(element.id);
        if (el) {
            console.log(`✅ ${element.name}: Encontrado`);
        } else {
            console.log(`❌ ${element.name}: NÃO encontrado`);
            allFound = false;
        }
    });
    
    console.log(`\n📊 Resultado DOM: ${allFound ? '✅ Todos os elementos encontrados' : '❌ Alguns elementos não encontrados'}`);
    
    return allFound;
}

// Função para testar inicialização
async function testInitialization() {
    console.log('\n🚀 Testando inicialização...');
    
    try {
        // Testa se os módulos existem
        if (!testModuleLoading()) {
            throw new Error('Módulos não carregados');
        }
        
        if (!testDOMElements()) {
            throw new Error('Elementos DOM não encontrados');
        }
        
        // Testa inicialização dos filtros
        console.log('\n🎛️ Testando inicialização dos filtros...');
        await window.filterManager.initialize();
        console.log('✅ Filtros inicializados');
        
        // Testa inicialização do dashboard
        console.log('\n📊 Testando inicialização do dashboard...');
        await window.dashboard.initialize();
        console.log('✅ Dashboard inicializado');
        
        console.log('\n🎉 SUCESSO: Sistema inicializado corretamente!');
        return true;
        
    } catch (error) {
        console.error('\n❌ ERRO na inicialização:', error);
        return false;
    }
}

// Função principal de teste
async function runTests() {
    console.clear();
    console.log('🧪 INICIANDO TESTES DO SISTEMA DE ANÁLISE DE HORA EXTRA');
    console.log('=' .repeat(60));
    
    const success = await testInitialization();
    
    if (success) {
        console.log('\n✅ Todos os testes passaram! O sistema está pronto para uso.');
    } else {
        console.log('\n❌ Alguns testes falharam. Verifique os erros acima.');
    }
}

// Exporta funções de teste
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testModuleLoading, testDOMElements, testInitialization, runTests };
} else {
    window.AnaliseHoraExtraTests = {
        testModuleLoading,
        testDOMElements,
        testInitialization,
        runTests
    };
}

// Auto-executa se for o script principal
if (typeof window !== 'undefined') {
    // Espera um pouco para garantir que todos os scripts foram carregados
    setTimeout(() => {
        if (document.readyState === 'complete') {
            console.log('🧪 Executando testes automáticos...');
            runTests();
        }
    }, 1000);
}
