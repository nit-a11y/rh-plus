# Plugin Login System - Template Plug-and-Play

Sistema de tela de login reutilizável com customização de temas e autenticação dual.

---

## 📁 Estrutura de Arquivos

```
login-plugin/
├── index.html              # Página demo standalone
├── nle-config.js          # Configurações centralizadas (EDITE AQUI)
├── nle-styles.css         # Estilos com namespacing
├── nle-script.js          # Lógica JavaScript
├── nle-integracao.md      # Guia de integração detalhado
└── README.md              # Este arquivo
```

---

## ⚙️ CONFIGURAÇÃO (nle-config.js)

### Credenciais do Auth da Interface de Temas

```javascript
NLE_CONFIG.authTheme = {
  email: 'interface@seusistema.com.br',
  password: 'SENHA123'
};
```

### Configurações do Sistema de Login (para integrar com seu backend)

```javascript
NLE_CONFIG.authSystem = {
  enabled: true,
  endpoint: '/api/login',
  method: 'POST',
  redirectSuccess: '/dashboard.html',
  storageKey: 'nle_user_logged',
  onSuccess: function(response) {
    // Callback personalizado após login
  },
  onError: function(error) {
    // Callback personalizado em caso de erro
  }
};
```

### Armazenamento Local

```javascript
NLE_CONFIG.storageKeys = {
  theme: 'nle_theme_config',
  background: 'nle_background_image'
};
```

### Tema Padrão

```javascript
NLE_CONFIG.defaultTheme = {
  cardBg: '#ffffff',
  buttonColor: '#b91c1c',
  textColor: '#374151',
  cardBorderColor: '#b91c1c'
};
```

---

## 🎨 Personalização do Tema

### Via Interface (Painel de Controle)

1. Clique em "Nossa Essência" na tela de login
2. Faça login com as credenciais definidas em `nle-config.js`
3. Use os controles de cor para personalizar
4. Faça upload de uma imagem de background
5. Salve as alterações

### Via Código (nle-config.js)

```javascript
NLE_CONFIG.defaultTheme = {
  cardBg: '#SUA_COR',      // Fundo do card
  buttonColor: '#SUA_COR',  // Cor dos botões
  textColor: '#SUA_COR',    // Cor dos textos
  cardBorderColor: '#SUA_COR' // Cor das bordas
};
```

### Seletor de Cores (EyeDropper)

A interface suporta o seletor de cores nativo do navegador (Chrome/Edge).
Se não suportado, use os campos de texto com valores hexadecimais.

### Background - Modo STRETCH

O background usa **STRETCH (100% 100%)** por padrão, garantindo que a imagem cubra 100% da tela sem cortes, independente das dimensões da imagem.

Para alterar manualmente:
```javascript
NLE_CONFIG.defaultTheme = {
  // ...
};
```

O seletor no painel de temas permite escolher:
- **STRETCH (100% tela)** - Padrão, preenche 100% da tela
- **Cover** - Preenche, pode cortar bordas
- **Contain** - Mostra imagem completa, pode ter barras
- **Auto** - Tamanho original da imagem

---

## 🔐 Sistema de Autenticação Dual

### Auth da Interface de Temas

- **Propósito**: Proteger o acesso ao painel de customização
- **Credenciais**: Definidas em `NLE_CONFIG.authTheme`
- **Armazenamento**: Não persiste (volta ao estado inicial ao fechar modal)

### Auth do Sistema Destino

- **Propósito**: Autenticar usuários no sistema onde a tela será injetada
- **Configuração**: Definida em `NLE_CONFIG.authSystem`
- **Fluxo**:
  1. Usuário preenche email/senha
  2. Dados são enviados ao endpoint configurado
  3. Se sucesso: redireciona para página definida
  4. Se erro: exibe mensagem de feedback

---

## 📝 Referência de Funções JavaScript

### Funções Públicas (para integração externa)

| Função | Descrição |
|--------|-----------|
| `NLE.init()` | Inicializa o plugin |
| `NLE.openThemePanel()` | Abre o painel de configuração |
| `NLE.closeThemePanel()` | Fecha o painel de configuração |
| `NLE.resetTheme()` | Reseta o tema para padrão |
| `NLE.setTheme(theme)` | Define tema customizado |
| `NLE.getTheme()` | Retorna tema atual |
| `NLE.setBackground(imageUrl)` | Define background customizado |
| `NLE.isThemeAuthenticated()` | Verifica se está autenticado no painel |

### Eventos (Callbacks)

```javascript
NLE_CONFIG.callbacks = {
  onLoginSuccess: function(userData) {
    console.log('Login realizado:', userData);
  },
  onLoginError: function(error) {
    console.error('Erro no login:', error);
  },
  onThemeSaved: function(theme) {
    console.log('Tema salvo:', theme);
  }
};
```

---

## 🎯 Classes CSS com Namespacing

Todas as classes CSS usam prefixo `nle-` para evitar conflitos:

| Classe | Elemento |
|--------|----------|
| `nle-login-container` | Container principal |
| `nle-card` | Card do login |
| `nle-header` | Cabeçalho do card |
| `nle-body` | Corpo do card |
| `nle-input-group` | Grupo de input |
| `nle-input` | Campos de formulário |
| `nle-btn` | Botões |
| `nle-btn-primary` | Botão primário |
| `nle-btn-secondary` | Botão secundário |
| `nle-modal` | Modal de configuração |
| `nle-color-picker` | Seletor de cor |
| `nle-valor-card` | Cards de valores |

---

## 🔧 API de Integração

### Para receber callbacks do login do sistema:

```javascript
// No seu sistema, após incluir o plugin:
window.addEventListener('nle-login-success', function(e) {
  console.log('Usuário logado:', e.detail.user);
});

window.addEventListener('nle-login-error', function(e) {
  console.log('Erro:', e.detail.error);
});
```

### Para acessar/modificar o tema programaticamente:

```javascript
// Obter tema atual
const theme = NLE.getTheme();

// Definir novo tema
NLE.setTheme({
  cardBg: '#f0f0f0',
  buttonColor: '#0000ff'
});

// Resetar para padrão
NLE.resetTheme();
```

### Para abrir/fechar painel de temas:

```javascript
// Abrir painel (requer autenticação)
NLE.openThemePanel();

// Fechar painel
NLE.closeThemePanel();
```

---

## 📦 Checklist de Integração

### 1. Copiar arquivos
- [ ] Copiar `nle-config.js` para seu projeto
- [ ] Copiar `nle-styles.css` para seu projeto
- [ ] Copiar `nle-script.js` para seu projeto
- [ ] Copiar `index.html` (ou adaptar conteúdo)

### 2. Editar configurações
- [ ] Definir credenciais do auth de tema em `nle-config.js`
- [ ] Definir endpoint do sistema de login
- [ ] Definir página de redirect após login

### 3. Incluir no HTML
```html
<link rel="stylesheet" href="nle-styles.css">
<script src="nle-config.js"></script>
<script src="nle-script.js"></script>
```

### 4. Testar
- [ ] Testar tela de login standalone
- [ ] Testar autenticação no painel de temas
- [ ] Testar integração com sistema de backend

---

## 🚀 Exemplos de Uso

### Exemplo 1: Integração básica com auth localStorage

```javascript
NLE_CONFIG.authSystem = {
  enabled: true,
  customAuth: function(email, password, callback) {
    // Sua lógica de autenticação aqui
    if (email === 'admin@teste.com' && password === '123') {
      callback.success({ name: 'Admin', email: email });
    } else {
      callback.error('Credenciais inválidas');
    }
  }
};
```

### Exemplo 2: Integração com API REST

```javascript
NLE_CONFIG.authSystem = {
  enabled: true,
  endpoint: '/api/auth/login',
  method: 'POST',
  redirectSuccess: '/dashboard',
  onSuccess: function(data) {
    localStorage.setItem('token', data.token);
  }
};
```

### Exemplo 3: Callback após login

```javascript
NLE_CONFIG.callbacks.onLoginSuccess = function(userData) {
  // Redirecionar ou atualizar UI
  window.location.href = '/painel';
};
```

---

## ⚠️ Notas Importantes

1. **Prefixos únicos**: Todas as classes CSS usam `nle-` para não conflitar com outros projetos
2. **Config centralizada**: Todas as configurações estão em `nle-config.js` - não edite os outros arquivos
3. **Autenticação dual**: O auth de tema protege apenas o painel, não o login do sistema
4. **localStorage**: O tema fica salvo no navegador do usuário
5. **Sem dependências**: Funciona com HTML/CSS/JS puro

---

*Plugin desenvolvido para uso plug-and-play - v1.0*