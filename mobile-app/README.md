# CrediSmart+ Mobile App

Aplicativo móvel para gestão de microcréditos - Cliente

## 🚀 Funcionalidades Implementadas

- ✅ Autenticação (Login e Registro)
- ✅ Dashboard com resumo de créditos
- ✅ Simulador de crédito interativo
- ✅ Visualização de créditos solicitados
- ✅ Notificações
- ✅ Integração completa com backend API

## 📋 Pré-requisitos

- Node.js 18+
- Expo CLI
- Expo Go app (para testar no dispositivo)
- Android Studio ou Xcode (para emuladores)

## 🔧 Instalação

```bash
# Instalar dependências
npm install

# Iniciar servidor Expo
npm start
```

## ⚙️ Configuração

Edite o arquivo `src/services/api.js` e altere a `API_URL` para o endereço do seu backend:

```javascript
const API_URL = 'http://SEU_IP:5000/api';  // Exemplo: http://192.168.1.100:5000/api
```

> **Nota**: Use o IP da máquina onde o backend está rodando, não `localhost` se estiver testando em dispositivo físico.

## 🏃 Executar

```bash
# Iniciar expo
npm start

# Opções:
# - Pressione 'a' para Android
# - Pressione 'i' para iOS  
# - Pressione 'w' para Web
# - Escaneie o QR code com Expo Go
```

## 📱 Estrutura do App

```
src/
├── context/
│   └── AuthContext.js          # Contexto de autenticação
├── navigation/
│   └── AppNavigator.js         # Configuração de navegação
├── screens/
│   ├── Auth/
│   │   ├── LoginScreen.js
│   │   └── RegisterScreen.js
│   ├── Home/
│   │   └── HomeScreen.js
│   └── Credit/
│       ├── CreditSimulatorScreen.js
│       └── MyCreditsScreen.js
└── services/
    ├── api.js                  # Configuração Axios
    └── index.js                # Serviços da API
```

## 🎨 Telas Implementadas

### Autenticação
- **Login**: Email e senha
- **Registro**: Cadastro completo de cliente

### Dashboard (Home)
- Resumo de créditos ativos
- Notificações recentes
- Atalhos rápidos
- Status de verificação

### Simulador de Crédito
- Slider interativo para prazo
- Cálculo em tempo real
- Exibição detalhada de parcelas e juros
- Botão para solicitar crédito

### Meus Créditos
- Listagem de todos os créditos
- Status coloridos (pendente, ativo, pago, rejeitado)
- Barra de progresso para créditos ativos
- Pull-to-refresh

## 🔐 Fluxo de Autenticação

1. Usuário faz login/registro
2. Token JWT é salvo no AsyncStorage
3. Token é enviado automaticamente em todas as requisições
4. Refresh token automático quando token expira
5. Logout limpa todos os dados armazenados

## 📦 Dependências Principais

- **React Navigation**: Navegação entre telas
- **Axios**: Cliente HTTP
- **AsyncStorage**: Armazenamento persistente
- **Expo Image Picker**: Upload de documentos
- **Expo Notifications**: Push notifications
- **React Native Slider**: Slider para seleção de prazo

## 🚧 Próximas Funcionalidades

- [ ] Detalhes de crédito com parcelas
- [ ] Solicitação de crédito  
- [ ] Upload de documentos
- [ ] Histórico de pagamentos
- [ ] Perfil do usuário
- [ ] Notificações push
- [ ] Educação financeira

## 📝 Notas

- O app está configurado para funcionar com Node.js 18+
- Certifique-se de que o backend está rodando antes de testar
- Para testes em dispositivo físico, use o IP da rede local
- As credenciais são armazenadas de forma segura no AsyncStorage

## 🐛 Troubleshooting

### Erro de conexão com API
- Verifique se o backend está rodando
- Confirme que o IP em `api.js` está correto
- Certifique-se de que está na mesma rede

### Problemas com dependências
```bash
# Limpar cache e reinstalar
rm -rf node_modules
npm install
expo start -c
```

## 📄 Licença

ISC
