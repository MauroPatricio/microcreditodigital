import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './src/config/database.js';

// Importar rotas
import authRoutes from './src/routes/auth.js';
import clientRoutes from './src/routes/clients.js';
import creditRoutes from './src/routes/credits.js';
import paymentRoutes from './src/routes/payments.js';
import analyticsRoutes from './src/routes/analytics.js';
import notificationRoutes from './src/routes/notifications.js';
import institutionRoutes from './src/routes/institutions.js';
import reportsRoutes from './src/routes/reports.js';
import commissionRoutes from './src/routes/commissions.js';
import contractRoutes from './src/routes/contracts.js';
import smsRoutes from './src/routes/sms.js';
import auditRoutes from './src/routes/audit.js';
import whatsappRoutes from './src/routes/whatsapp.js';
import documentRoutes from './src/routes/documents.js';
import contractTemplateRoutes from './src/routes/contractTemplates.js';
import healthRoutes from './src/routes/health.js';

// Importar jobs
import paymentRemindersJob from './src/jobs/paymentReminders.js';
import overdueHandlingJob from './src/jobs/overdueHandling.js';
import interestCalculationJob from './src/jobs/interestCalculation.js';
import whatsappJobs from './src/jobs/whatsappJobs.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(compression()); // Enable gzip compression

// Configuração dinâmica de CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
    origin: function (origin, callback) {
        // Permitir requisições sem origin (como apps mobile ou curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            callback(new Error('Não permitido pelo CORS'));
        }
    },
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // limite de 100 requisições por IP
    message: {
        success: false,
        message: 'Muitas requisições deste IP, tente novamente mais tarde.'
    }
});

app.use('/api/', limiter);

// Servir arquivos estáticos (uploads)
const uploadDir = process.env.UPLOAD_PATH || './uploads/documents';
app.use('/uploads', express.static(path.join(__dirname, uploadDir)));

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/institutions', institutionRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/commissions', commissionRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/contract-templates', contractTemplateRoutes);
app.use('/api/health', healthRoutes);

// Rota raiz com página de status visual
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Status - CrediSmart+</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background-color: #0f172a;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        .container {
            width: 90%;
            max-width: 600px;
            padding: 2px;
            border-radius: 16px;
            background: linear-gradient(45deg, #00C853, #1de9b6);
            box-shadow: 0 0 20px rgba(0, 200, 83, 0.3);
        }
        .content {
            background-color: #0f172a;
            border-radius: 14px;
            padding: 48px;
            text-align: center;
            color: white;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .rocket {
            font-size: 60px;
            margin-bottom: 24px;
            display: inline-block;
            animation: bounce-slow 3s infinite ease-in-out;
        }
        h1 {
            font-size: 32px;
            font-weight: 900;
            margin: 0 0 16px 0;
            letter-spacing: -0.5px;
        }
        p {
            color: #94a3b8;
            font-size: 18px;
            line-height: 1.6;
            margin: 0 0 32px 0;
        }
        .badges {
            display: flex;
            justify-content: center;
            gap: 16px;
            flex-wrap: wrap;
        }
        .badge {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            border-radius: 8px;
            font-weight: bold;
            font-size: 14px;
        }
        .badge-status {
            background-color: #064e3b;
            border: 1px solid rgba(5, 150, 105, 0.3);
            color: #34d399;
        }
        .badge-port {
            background-color: #1e1b4b;
            border: 1px solid rgba(79, 70, 229, 0.3);
            color: #818cf8;
        }
        @keyframes bounce-slow {
            0%, 100% { transform: translateY(-5%); }
            50% { transform: translateY(5%); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="content">
            <div class="rocket">🚀</div>
            <h1>API Conectada com Sucesso</h1>
            <p>Você conseguiu chegar ao servidor. Este endpoint é apenas para fins de verificação.</p>
            <div class="badges">
                <div class="badge badge-status">
                    <span>Status:</span>
                    <span>OK</span>
                </div>
                <div class="badge badge-port">
                    <span>Porta:</span>
                    <span>${PORT}</span>
                </div>
                <div class="badge badge-port" style="border-color: rgba(236, 72, 153, 0.3); background-color: #500724; color: #f472b6;">
                   <span>Versão:</span>
                   <span>1.0.0</span>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
    `);
});

// Rota de health check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Erro:', err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Erro interno do servidor',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Rota não encontrada'
    });
});

// Obter IP local da máquina
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

// Iniciar servidor
const startServer = async () => {
    try {
        // Conectar ao MongoDB
        await connectDB();

        // Criar diretório de uploads se não existir
        const uploadDir = process.env.UPLOAD_PATH || './uploads/documents';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
            console.log('📁 Diretório de uploads criado');
        }

        // Iniciar jobs automáticos
        console.log('\n🤖 Iniciando jobs automáticos...');
        paymentRemindersJob.start();
        console.log('   ✓ Job de lembretes de pagamento ativado');

        overdueHandlingJob.start();
        console.log('   ✓ Job de tratamento de parcelas vencidas ativado');

        interestCalculationJob.start();
        console.log('   ✓ Job de cálculo de juros ativado');

        whatsappJobs.start();
        console.log('   ✓ Job de notificações WhatsApp ativado');

        // Iniciar servidor
        app.listen(PORT, () => {
            const localIP = getLocalIP();
            console.log('\n' + '='.repeat(60));
            console.log('🚀 CrediSmart+ Backend API');
            console.log('='.repeat(60));
            console.log(`✅ Servidor disponível e escutando na porta ${PORT}`);
            console.log(`🌐 Local: http://localhost:${PORT}`);
            console.log(`🌐 Network: http://${localIP}:${PORT}`);
            console.log(`📝 Ambiente: ${process.env.NODE_ENV || 'development'}`);
            console.log('='.repeat(60) + '\n');
        });
    } catch (error) {
        console.error('❌ Erro ao iniciar servidor:', error.message);
        process.exit(1);
    }
};

// Iniciar aplicação
startServer();

// Tratamento de erros não capturados
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err.message);
});

process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err.message);
    process.exit(1);
});
