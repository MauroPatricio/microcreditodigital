import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './src/config/database.js';

// Routes
import authRoutes from './src/routes/auth.js';
import clientRoutes from './src/routes/clients.js';
import institutionRoutes from './src/routes/institutions.js';
import creditRoutes from './src/routes/credits.js';
import paymentRoutes from './src/routes/payments.js';
import analyticsRoutes from './src/routes/analytics.js';
import reportRoutes from './src/routes/reports.js';
import documentRoutes from './src/routes/documents.js';
import notificationRoutes from './src/routes/notifications.js';
import whatsappRoutes from './src/routes/whatsapp.js';
import healthRoutes from './src/routes/health.js';
import auditRoutes from './src/routes/audit.js';
import commissionRoutes from './src/routes/commissions.js';
import smsRoutes from './src/routes/sms.js';
import contractTemplateRoutes from './src/routes/contractTemplates.js';
import cashflowRoutes from './src/routes/cashflow.js';
import communicationRoutes from './src/routes/communicationRoutes.js';
import confidenceRoutes from './src/routes/confidence.js';
import simulationRoutes from './src/routes/simulations.js';
import contractRoutes from './src/routes/contracts.js';
import userRoutes from './src/routes/users.js';

// Services
import whatsappService from './src/services/whatsappService.js';
import whatsappJobs from './src/jobs/whatsappJobs.js';
import { messageQueueJob, automatedRemindersJob } from './src/jobs/messageWorker.js';

// Config
dotenv.config();
connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes Middleware
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/institutions', institutionRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/commissions', commissionRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/contract-templates', contractTemplateRoutes);
app.use('/api/cashflow', cashflowRoutes);
app.use('/api/communication', communicationRoutes);
app.use('/api/confidence', confidenceRoutes);
app.use('/api/simulations', simulationRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/users', userRoutes);

// Root
app.get('/', (req, res) => {
    res.send(`
    <html>
        <head>
            <title>MicroCrédito Digital API</title>
            <style>
                body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #0f172a; color: #f8fafc; margin: 0; }
                .container { text-align: center; padding: 2rem; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: #1e293b; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
                .status { color: #10b981; font-weight: bold; }
                h1 { margin-bottom: 0.5rem; }
                p { margin: 0.5rem 0; color: #94a3b8; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>MicroCrédito Digital API</h1>
                <p>Status: <span class="status">OPERATIONAL</span></p>
                <p>Version: 1.0.0</p>
            </div>
        </body>
    </html>
    `);
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start Services
try {
    import('./src/services/communicationService.js').then(m => m.default.seedTemplates());
    whatsappService.initializeClient();
    whatsappJobs.start();
    messageQueueJob.start();
    automatedRemindersJob.start();
    console.log('   ✓ Serviços de Comunicação e WhatsApp iniciados');
} catch (error) {
    console.error('Falha ao iniciar serviços de comunicação:', error);
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
});
