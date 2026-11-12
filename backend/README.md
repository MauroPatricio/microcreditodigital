# CrediSmart+ Backend API

Plataforma Premium de Microcrédito Digital - Backend Node.js + Express + MongoDB

## 🚀 Funcionalidades

- ✅ Autenticação JWT com Refresh Tokens
- ✅ Gestão completa de clientes
- ✅ Solicitação, aprovação e gestão de créditos
- ✅ Cálculo automático de parcelas (sistema Price)
- ✅ Processamento de pagamentos
- ✅ Integração M-Pesa e e-Mola
- ✅ Jobs automáticos (lembretes, multas, juros)
- ✅ Sistema de notificações (Push, SMS)
- ✅ Analytics e relatórios avançados
- ✅ Upload e validação de documentos
- ✅ Rate limiting e segurança

## 📋 Pré-requisitos

- Node.js 16+ 
- MongoDB (local ou Atlas)
- NPM ou Yarn

## 🔧 Instalação

```bash
# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp .env.example .env

# Editar .env com suas configurações
# Especialmente: MONGODB_URI, JWT_SECRET, etc.
```

## ⚙️ Configuração

Edite o arquivo `.env` com suas credenciais:

```env
# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/credismart

# JWT
JWT_SECRET=seu_secret_aqui
JWT_REFRESH_SECRET=seu_refresh_secret_aqui

# M-Pesa (opcional)
MPESA_PUBLIC_KEY=sua_chave
MPESA_SERVICE_PROVIDER_CODE=seu_codigo

# e-Mola (opcional)
EMOLA_API_KEY=sua_chave
EMOLA_MERCHANT_ID=seu_merchant_id

# Firebase (opcional - para push notifications)
FIREBASE_PROJECT_ID=seu_project_id
FIREBASE_PRIVATE_KEY=sua_private_key
FIREBASE_CLIENT_EMAIL=seu_client_email
```

## 🏃 Executar

```bash
# Modo desenvolvimento (com nodemon)
npm run dev

# Modo produção
npm start
```

O servidor estará disponível em `http://localhost:5000`

## 📚 Endpoints Principais

### Autenticação
- `POST /api/auth/register` - Registrar novo cliente
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Renovar token
- `GET /api/auth/me` - Obter dados do usuário

### Créditos
- `POST /api/credits/simulate` - Simular crédito
- `POST /api/credits/request` - Solicitar crédito
- `GET /api/credits` - Listar créditos
- `GET /api/credits/:id` - Detalhes de crédito
- `PUT /api/credits/:id/approve` - Aprovar (Admin)
- `PUT /api/credits/:id/reject` - Rejeitar (Admin)

### Pagamentos
- `POST /api/payments` - Registrar pagamento
- `GET /api/payments` - Listar pagamentos
- `POST /api/payments/webhook/mpesa` - Webhook M-Pesa
- `POST /api/payments/webhook/emola` - Webhook e-Mola

### Clientes (Admin)
- `GET /api/clients` - Listar clientes
- `GET /api/clients/:id` - Detalhes de cliente
- `PUT /api/clients/:id/verify` - Verificar cliente
- `POST /api/clients/:id/documents` - Upload de documento

### Analytics (Admin)
- `GET /api/analytics/dashboard` - Métricas do dashboard
- `GET /api/analytics/portfolio` - Análise de carteira
- `GET /api/analytics/revenue` - Análise de receita

## 🤖 Jobs Automáticos

Os seguintes jobs executam automaticamente:

- **Lembretes de Pagamento** (10:00 AM) - Envia notificações 3 dias e 1 dia antes do vencimento
- **Tratamento de Atrasos** (00:00 AM) - Aplica multas e atualiza status de parcelas vencidas
- **Cálculo de Juros** (01:00 AM) - Calcula juros diários em créditos ativos

## 📦 Estrutura de Diretórios

```
backend/
├── src/
│   ├── config/         # Configurações (database, etc)
│   ├── models/         # Models Mongoose
│   ├── routes/         # Rotas da API
│   ├── middleware/     # Middleware (auth, validation)
│   ├── jobs/           # Jobs automáticos (cron)
│   ├── services/       # Integrações externas
│   └── index.js        # Entry point
├── uploads/            # Arquivos enviados
├── .env.example        # Template de variáveis
├── package.json
└── README.md
```

## 🔒 Segurança

- Senhas hasheadas com bcrypt
- JWT tokens com expiração
- Rate limiting (100 req/15min por IP)
- Validação de inputs
- CORS habilitado
- Upload de arquivos com limitação de tamanho

## 🚀 Produção

Para deploy em produção:

1. Configure todas as variáveis de ambiente
2. Adicione IP do servidor à whitelist do MongoDB Atlas
3. Configure Firebase para push notifications
4. Configure credenciais M-Pesa e e-Mola
5. Use PM2 ou similar para gerenciar o processo

```bash
npm install -g pm2
pm2 start src/index.js --name credismart-api
pm2 save
pm2 startup
```

## 📄 Licença

ISC

## 👥 Suporte

Para suporte, entre em contato através do email: nhiquelaservicos@gmail.com
