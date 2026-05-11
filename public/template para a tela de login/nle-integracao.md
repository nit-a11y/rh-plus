# NLE Login Plugin - Guia de Integração

Sistema de login reutilizável com suporte a autenticação dual (tema + sistema).

---

## 📦 Instalação

Copie os seguintes arquivos para o seu projeto:

| Arquivo | Descrição |
|---------|-----------|
| `nle-config.js` | Configurações centralizadas |
| `nle-styles.css` | Estilos com namespacing |
| `nle-script.js` | Lógica JavaScript |

---

## 🔧 Configuração Básica

Edite apenas `nle-config.js` para personalizar:

### 1. Credenciais do Painel de Temas

```javascript
NLE_CONFIG.authTheme = {
  email: 'seu@email.com',
  password: 'SUA_SENHA'
};
```

### 2. Autenticação do Sistema Destino

#### Opção A: Auth Custom (JavaScript)

```javascript
NLE_CONFIG.authSystem = {
  enabled: true,
  customAuth: function(email, password, callback) {
    // Sua lógica aqui
    if (email === 'admin@teste.com' && password === '123') {
      callback.success({ name: 'Admin', email: email });
    } else {
      callback.error('Credenciais inválidas');
    }
  }
};
```

#### Opção B: API REST

```javascript
NLE_CONFIG.authSystem = {
  enabled: true,
  endpoint: '/api/auth/login',
  method: 'POST',
  redirectSuccess: '/dashboard.html'
};
```

### 3. Redirect Após Login

```javascript
NLE_CONFIG.authSystem.redirectSuccess = '/pagina-inicial.html';
```

---

## 📝 Inclusão no HTML

### Opção 1: Página Standalone

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="nle-styles.css">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
  <!-- Cole o conteúdo do index.html aqui -->
  
  <script src="nle-config.js"></script>
  <script src="nle-script.js"></script>
</body>
</html>
```

### Opção 2: Iframe

```html
<iframe src="login.html" 
        style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; border: none;">
</iframe>
```

### Opção 3: Include (PHP)

```php
<?php include 'login.html'; ?>
```

### Opção 4: React/Vue/Angular

Copie os componentes HTML para seus arquivos de template.

---

## 🎨 Personalização do Tema

### Via Interface

1. Clique em "Nossa Essência" na tela de login
2. Autentique-se com as credenciais do painel de temas
3. Use os seletores de cor para personalizar
4. Faça upload de uma imagem de background
5. Salve as alterações

### Via Código

```javascript
// Resetar para padrão
NLE.resetTheme();

// Definir tema customizado
NLE.setTheme({
  cardBg: '#f0f0f0',
  buttonColor: '#0000ff',
  textColor: '#333333',
  cardBorderColor: '#ff0000'
});

// Obter tema atual
const theme = NLE.getTheme();
console.log(theme);

// Definir background
NLE.setBackground('url-da-imagem.jpg');
```

---

## 🔐 Sistema de Autenticação Dual

### Auth 1: Painel de Temas

- **Protege**: Acesso às configurações de tema
- **Não persiste**: Reseta ao fechar o modal
- **Credenciais**: Definidas em `NLE_CONFIG.authTheme`

### Auth 2: Sistema de Login

- **Autentica**: Usuários no sistema destino
- **Configurável**: API REST ou custom function
- **Redireciona**: Para página definida após sucesso

---

## 📡 Eventos e Callbacks

### Eventos JavaScript

```javascript
// Login realizado com sucesso
window.addEventListener('nle-login-success', function(e) {
  console.log('Usuário:', e.detail);
});

// Erro no login
window.addEventListener('nle-login-error', function(e) {
  console.error('Erro:', e.detail.error);
});

// Tema salvo
window.addEventListener('nle-theme-saved', function(e) {
  console.log('Tema:', e.detail);
});
```

### Callbacks (em nle-config.js)

```javascript
NLE_CONFIG.callbacks = {
  onLoginSuccess: function(data) {
    // Executado após login bem-sucedido
  },
  onLoginError: function(error) {
    // Executado em caso de erro
  },
  onThemeSaved: function(theme) {
    // Executado após salvar tema
  },
  onThemeReset: function(theme) {
    // Executado após resetar tema
  }
};
```

---

## 🎯 API Pública

| Método | Descrição |
|--------|-----------|
| `NLE.init()` | Inicializa o plugin |
| `NLE.openModal()` | Abre painel de temas |
| `NLE.closeModal()` | Fecha painel de temas |
| `NLE.resetTheme()` | Reseta tema para padrão |
| `NLE.setTheme(obj)` | Define tema customizado |
| `NLE.getTheme()` | Retorna tema atual |
| `NLE.setBackground(url)` | Define background |
| `NLE.isThemeAuthenticated()` | Verifica auth do painel |

---

## 🛡️ Prevenção de Conflitos

### Prefixos CSS

Todas as classes usam prefixo `nle-`:

```css
.nle-card { }
.nle-input { }
.nle-btn-primary { }
.nle-modal-overlay { }
```

### Prefixos de Variáveis CSS

```css
:root {
  --nle-rubi: #b91c1c;
  --nle-branco: #ffffff;
}
```

### IDs Únicos

```html
<div id="nle-background">
<div id="nle-config-modal">
<input id="nle-email">
```

---

## 📋 Checklist de Implantação

1. [ ] Copiar arquivos `nle-*.js` e `nle-*.css`
2. [ ] Editar `nle-config.js` com credenciais
3. [ ] Configurar auth do sistema (API ou custom)
4. [ ] Definir página de redirect
5. [ ] Testar login standalone
6. [ ] Testar painel de temas
7. [ ] Testar integração com sistema

---

## ⚠️ Notas Importantes

1. **Edite apenas `nle-config.js`** - Não modifique os outros arquivos
2. **Sem dependências externas** - Funciona com HTML/CSS/JS puro
3. **Armazenamento local** - Tema salvo no navegador
4. **Cross-browser** - Compatível com Chrome, Firefox, Edge, Safari

---

## 🆘 Suporte

- HTML/CSS/JS puro
- Sem frameworks necessários
- Compatível com React, Vue, Angular, PHP, ASP, JSP
- Funciona em desktop e mobile