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

// Importar jobs
import paymentRemindersJob from './src/jobs/paymentReminders.js';
import overdueHandlingJob from './src/jobs/overdueHandling.js';
import interestCalculationJob from './src/jobs/interestCalculation.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(compression()); // Enable gzip compression
app.use(cors());
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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/institutions', institutionRoutes);

// Rota raiz
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'CrediSmart+ API - Plataforma Premium de Microcrédito Digital',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            clients: '/api/clients',
            credits: '/api/credits',
            payments: '/api/payments',
            analytics: '/api/analytics',
            notifications: '/api/notifications'
        }
    });
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
