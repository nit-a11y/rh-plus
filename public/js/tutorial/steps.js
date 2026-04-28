
export const KNOWLEDGE_BASE = {
    "/dashboard": {
        title: "Painel de Controle Principal",
        icon: "🏠",
        tips: [
            {
                task: "Entender os Indicadores",
                instruction: "Os cards coloridos no topo mostram a saúde do seu estoque. <b>Vermelho</b> indica fardamentos vencidos que precisam de troca imediata. <b>Amarelo</b> são itens que vencem nos próximos 30 dias."
            },
            {
                task: "Navegação Rápida",
                instruction: "Use o menu lateral para alternar entre os módulos. O 'Mestre de Colab.' é onde reside toda a inteligência de prontuários e documentos."
            }
        ]
    },
    "/colaboradores-pro": {
        title: "Mestre de Colaboradores",
        icon: "👤",
        tips: [
            {
                task: "Admissão Digital",
                instruction: "Para contratar, clique em <b>'Novo Colaborador'</b>. O sistema abrirá um formulário onde você deve selecionar o cargo da matriz. <i>Dica: O setor e o CBO são preenchidos sozinhos!</i>"
            },
            {
                task: "Gestão de Documentos",
                instruction: "Dentro do editor de cada colaborador, você encontrará abas para CPF, RG e eSocial. Certifique-se de manter o CPF atualizado para evitar erros no eSocial."
            },
            {
                task: "Vínculo de Unidade",
                instruction: "Você pode definir onde o funcionário trabalha fisicamente e quem é o empregador legal. Isso ajuda no mapa de geolocalização do BI."
            }
        ]
    },
    "/fardamento": {
        title: "Logística de Uniformes",
        icon: "🎽",
        tips: [
            {
                task: "Registrar uma Troca",
                instruction: "Selecione o colaborador na lista à esquerda. No painel central, escolha a peça e clique em <b>'Trocar'</b>. O sistema perguntará se é por desgaste natural ou avaria."
            },
            {
                task: "Avaria e Fotos",
                instruction: "Ao registrar uma troca por <b>Avaria</b>, o sistema permite descrever o dano. Isso gera um log de auditoria para controle de custos de reposição."
            },
            {
                task: "Itens Avulsos",
                instruction: "Precisa entregar algo fora do kit padrão? Use o botão <b>'+ Item Avulso'</b> para registrar qualquer peça extra no inventário do funcionário."
            }
        ]
    },
    "/carreira": {
        title: "Gestão de Carreira",
        icon: "📈",
        tips: [
            {
                task: "Promoções",
                instruction: "Ao promover um funcionário, selecione o novo cargo. O sistema verificará se o novo cargo exige um <b>Kit de Fardamento</b> diferente e sugerirá a troca automática."
            },
            {
                task: "Reajuste Coletivo",
                instruction: "O botão <b>'Reajuste Coletivo'</b> permite aplicar uma porcentagem de aumento para todos os ativos de uma vez, registrando o histórico individual de cada um."
            }
        ]
    },
    "/vacation-unified.html": {
        title: "Gestão de Férias Unificada",
        icon: "🏖️",
        tips: [
            {
                task: "Timeline de Ausências",
                instruction: "Selecione um colaborador na sidebar para ver todo o histórico de férias na timeline. Cada registro mostra datas, dias, motivo e responsável."
            },
            {
                task: "Registro Retroativo Automático",
                instruction: "Ao cadastrar uma ausência com data no passado, o sistema automaticamente marca como <b>retroativo</b> (🕰️)."
            },
            {
                task: "CRUD Completo",
                instruction: "Passe o mouse sobre cada card da timeline para ver opções de <b>Editar</b>, <b>Alterar Status</b> ou <b>Excluir</b> o registro."
            }
        ]
    },
    "/perfil": {
        title: "Minha Conta & Segurança",
        icon: "⚙️",
        tips: [
            {
                task: "Personalização de Perfil",
                instruction: "Você pode alterar seu nome de exibição e sua foto de perfil. Clique na moldura da foto para fazer o upload. <b>Importante:</b> Seu ID de usuário (login) é fixo por segurança."
            },
            {
                task: "Segurança da Senha",
                instruction: "Para trocar sua senha, você deve informar a <b>Senha Atual</b> primeiro. A nova senha deve ter no mínimo 6 caracteres. Use o indicador de força para garantir um acesso seguro."
            }
        ]
    }
};
