require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');
const os = require('os');

// Importar rotas
const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/clients');
const creditRoutes = require('./routes/credits');
const paymentRoutes = require('./routes/payments');
const analyticsRoutes = require('./routes/analytics');
const notificationRoutes = require('./routes/notifications');

// Importar jobs
const paymentRemindersJob = require('./jobs/paymentReminders');
const overdueHandlingJob = require('./jobs/overdueHandling');
const interestCalculationJob = require('./jobs/interestCalculation');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
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
app.use('/uploads', express.static('uploads'));

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);

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
        const fs = require('fs');
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
