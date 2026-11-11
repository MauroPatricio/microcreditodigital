import express from 'express';
import Institution from '../models/Institution.js';
import SubscriptionRequest from '../models/SubscriptionRequest.js';
import SubscriptionPackage, { seedDefaultPackages } from '../models/SubscriptionPackage.js';
import Credit from '../models/Credit.js';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';
import { auditAction } from '../middleware/auditMiddleware.js';
import uploadPaymentReceipt from '../middleware/uploadPaymentMiddleware.js';
import {
  handleSubmitSubscriptionRequest,
  handleApproveSubscriptionRequest,
  handleRejectSubscriptionRequest,
} from './subscriptions.js';
import { ALL_FEATURE_CODES, DEFAULT_FEATURES_BY_LEGACY_PLAN } from '../config/packageFeatures.js';
import emailService, { normalizeEmailList } from '../services/emailService.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Configurar multer para upload de logo
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, process.env.UPLOAD_PATH || './uploads/documents');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 2097152 // 2MB
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Apenas imagens JPEG e PNG são permitidas'));
        }
    }
});

// @route   POST /api/institutions
// @desc    Criar uma nova instituição (Apenas por super_admin ou via fluxo de registro de owner)
// @access  Private/SuperAdmin
// @route   POST /api/institutions
// @desc    Criar uma nova instituição (Agente SuperAdmin ou Owner)
// @access  Private
router.post('/', protect, authorize('super_admin', 'owner'), auditAction('Institution', 'create', 'high'), async (req, res) => {
    try {
        const { name, email, phone, nuit, address } = req.body;

        const trialExpiresAt = new Date();
        trialExpiresAt.setDate(trialExpiresAt.getDate() + 7);

        const institution = await Institution.create({
            name,
            email,
            phone,
            nuit,
            address,
            owner: req.user._id,
            subscription: {
                plan: 'trial',
                packageName: 'Período Experimental (7 Dias)',
                status: 'active',
                expiresAt: trialExpiresAt
            }
        });

        // Criar template de contrato padrão para a nova instituição
        try {
            const ContractTemplate = (await import('../models/ContractTemplate.js')).default;
            await ContractTemplate.create({
                institution: institution._id,
                name: 'loan_contract_standard',
                title: 'Contrato de Empréstimo de Microcrédito',
                content: `
                    <h1>CONTRATO DE EMPRÉSTIMO</h1>
                    <p>Pelo presente instrumento particular, a <strong>{{institution_name}}</strong>...</p>
                    <p>O cliente <strong>{{client_name}}</strong>, portador do BI {{client_bi}}...</p>
                    <p>Montante: {{loan_amount}} {{currency}}</p>
                    <p>Data: {{current_date}}</p>
                `,
                placeholders: [
                    { key: 'institution_name', description: 'Nome da firma' },
                    { key: 'client_name', description: 'Nome do cliente' },
                    { key: 'loan_amount', description: 'Valor solicitado' }
                ]
            });
        } catch (templateError) {
            console.error('Erro ao criar template padrão:', templateError);
            // Non-blocking error, we still created the institution
        }

        // Se for o primeiro, definir como ativo
        if (!req.user.activeInstitution) {
            req.user.activeInstitution = institution._id;
            await req.user.save();
        }

        res.status(201).json({
            success: true,
            data: institution
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao criar instituição',
            error: error.message
        });
    }
});

// @route   GET /api/institutions/public
// @desc    Listar instituições públicas para registo na app mobile (Apenas pacotes premium)
// @access  Public
router.get('/public', async (req, res) => {
    try {
        const institutions = await Institution.find({
            isActive: true,
            'subscription.plan': 'premium',
            'subscription.status': 'active'
        }).select('_id name settings.appearance.logoUrl');

        res.json({
            success: true,
            data: institutions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao listar instituições públicas',
            error: error.message
        });
    }
});

// @route   GET /api/institutions/all
// @desc    Listar todas as instituições do Owner
// @access  Private (Owner)
router.get('/all', protect, authorize('owner', 'super_admin'), async (req, res) => {
    try {
        const query = req.user.role === 'super_admin' ? {} : { owner: req.user._id };
        const institutions = await Institution.find(query);

        res.json({
            success: true,
            data: institutions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao listar instituições',
            error: error.message
        });
    }
});

// @route   POST /api/institutions/switch/:id
// @desc    Alternar instituição ativa
// @access  Private (Owner)
router.post('/switch/:id', protect, authorize('owner', 'super_admin'), auditAction('User', 'switch_tenant', 'low'), async (req, res) => {
    try {
        const institution = await Institution.findOne({
            _id: req.params.id,
            ...(req.user.role !== 'super_admin' && { owner: req.user._id })
        });

        if (!institution) {
            return res.status(404).json({
                success: false,
                message: 'Instituição não encontrada ou acesso negado'
            });
        }

        req.user.activeInstitution = institution._id;
        await req.user.save();

        res.json({
            success: true,
            message: `Contexto alterado para: ${institution.name}`,
            data: institution
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao alternar instituição',
            error: error.message
        });
    }
});

// @route   GET /api/institutions/my
// @desc    Obter detalhes da minha instituição
// @access  Private (Owner, Manager, Agent)
router.get('/my', protect, async (req, res) => {
    try {
        if (!req.user.institution) {
            return res.status(404).json({
                success: false,
                message: 'Instituição não encontrada para este usuário'
            });
        }

        const institution = await Institution.findById(req.user.institution._id)
            .populate('owner', 'name email');

        const obj = institution ? institution.toObject() : null;
        if (obj?.settings?.notificationSettings?.emailConfig) {
            obj.settings.notificationSettings.emailConfig.hasSmtpPassword = Boolean(
                obj.settings.notificationSettings.emailConfig.smtpPassword
            );
            obj.settings.notificationSettings.emailConfig.smtpPassword = '';
        }

        res.json({
            success: true,
            data: obj
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar instituição',
            error: error.message
        });
    }
});

// @route   PUT /api/institutions/my
// @desc    Atualizar minha instituição
// @access  Private (Owner/Admin)
router.put('/my', protect, authorize('owner', 'admin'), auditAction('Institution', 'update', 'medium'), async (req, res) => {
    try {
        const instId = req.institutionId || req.user.institution?._id || req.user.institution;
        const current = await Institution.findById(instId);
        if (!current) {
            return res.status(404).json({ success: false, message: 'Instituição não encontrada' });
        }

        const payload = { ...req.body };
        if (payload.settings?.notificationSettings?.emailConfig) {
            const prevCfg = current.settings?.notificationSettings?.emailConfig?.toObject?.()
                || current.settings?.notificationSettings?.emailConfig
                || {};
            const incCfg = payload.settings.notificationSettings.emailConfig;
            payload.settings.notificationSettings.emailConfig = {
                ...prevCfg,
                ...incCfg,
                smtpPassword: (incCfg.smtpPassword && String(incCfg.smtpPassword).trim() !== '')
                    ? incCfg.smtpPassword
                    : (prevCfg.smtpPassword || ''),
                alertRecipients: incCfg.alertRecipients !== undefined
                    ? normalizeEmailList(incCfg.alertRecipients)
                    : (prevCfg.alertRecipients || []),
            };
        }

        const institution = await Institution.findByIdAndUpdate(
            instId,
            payload,
            { new: true, runValidators: true }
        );

        const obj = institution ? institution.toObject() : null;
        if (obj?.settings?.notificationSettings?.emailConfig) {
            obj.settings.notificationSettings.emailConfig.hasSmtpPassword = Boolean(
                obj.settings.notificationSettings.emailConfig.smtpPassword
            );
            obj.settings.notificationSettings.emailConfig.smtpPassword = '';
        }

        res.json({
            success: true,
            data: obj
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar instituição',
            error: error.message
        });
    }
});

// @route   POST /api/institutions/my/test-email
// @desc    Testar configuração de email da instituição (recepção e envio)
// @access  Private (Owner/Admin)
router.post('/my/test-email', protect, authorize('owner', 'admin'), async (req, res) => {
    try {
        const instId = req.institutionId || req.user.institution?._id || req.user.institution;
        const current = await Institution.findById(instId);
        if (!current) {
            return res.status(404).json({ success: false, message: 'Instituição não encontrada' });
        }

        const { to, emailConfig } = req.body || {};
        const prevCfg = current.settings?.notificationSettings?.emailConfig?.toObject?.()
            || current.settings?.notificationSettings?.emailConfig
            || {};
        const mergedCfg = emailConfig
            ? {
                ...prevCfg,
                ...emailConfig,
                smtpPassword: (emailConfig.smtpPassword && String(emailConfig.smtpPassword).trim() !== '')
                    ? emailConfig.smtpPassword
                    : prevCfg.smtpPassword,
            }
            : prevCfg;

        const recipients = normalizeEmailList(
            to || mergedCfg.alertRecipients || current.email || req.user.email
        );
        if (recipients.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Informe pelo menos um email válido para testar a recepção.',
            });
        }

        const result = await emailService.sendEmail(
            recipients,
            `Teste de Alertas — ${current.name}`,
            `<h2>Configuração de Email Verificada</h2><p>A instituição <strong>${current.name}</strong> receberá notificações e alertas de pagamentos neste endereço.</p>`,
            {
                institutionId: instId,
                overrideConfig: (mergedCfg.smtpUser && mergedCfg.smtpPassword) ? mergedCfg : null,
            }
        );

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: `Falha ao enviar email de teste: ${result.error}`,
            });
        }

        res.json({
            success: true,
            message: `Email de teste enviado para: ${recipients.join(', ')}`,
            data: result,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/institutions/stats/global
// @desc    Métricas consolidadas de todas as instituições do Owner
// @access  Private (Owner)
router.get('/stats/global', protect, authorize('owner', 'super_admin'), async (req, res) => {
    try {
        const query = req.user.role === 'super_admin' ? {} : { owner: req.user._id };
        const institutions = await Institution.find(query);
        const instIds = institutions.map(i => i._id);

        const volumeData = await Credit.aggregate([
            { $match: { institution: { $in: instIds } } },
            { $group: { _id: '$institution', totalValue: { $sum: '$amount' } } }
        ]);

        const volumeMap = {};
        volumeData.forEach(v => {
            volumeMap[v._id.toString()] = v.totalValue;
        });

        // Aqui faríamos agregações complexas em Credits, Installments, etc.
        // Por agora, retornamos um resumo básico
        res.json({
            success: true,
            data: {
                totalInstitutions: institutions.length,
                activeInstitutions: institutions.filter(i => i.isActive).length,
                institutions: institutions.map(i => ({
                    id: i._id,
                    name: i.name,
                    status: i.isActive ? 'Ativa' : 'Inativa',
                    value: volumeMap[i._id.toString()] || 0
                }))
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/institutions/my/logo
// @desc    Upload de logo da instituição
// @access  Private (Owner/Manager)
router.post('/my/logo', protect, authorize('owner', 'manager'), upload.single('logo'), auditAction('Institution', 'update_logo', 'medium'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Nenhum arquivo de logo enviado'
            });
        }

        const logoUrl = req.file.path;

        const institution = await Institution.findById(req.user.institution._id);
        if (!institution) {
            return res.status(404).json({ success: false, message: 'Instituição não encontrada' });
        }

        // Inicializar appearance se não existir
        if (!institution.settings) institution.settings = {};
        if (!institution.settings.appearance) institution.settings.appearance = {};

        institution.settings.appearance.logoUrl = logoUrl;
        await institution.save();

        res.json({
            success: true,
            message: 'Logo atualizado com sucesso',
            data: { logoUrl }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/institutions/subscription-requests/all
// @desc    Listar todos os pedidos de subscrição pendentes (Super Admin)
// @access  Private (Super Admin)
router.get('/subscription-requests/all', protect, authorize('super_admin'), async (req, res) => {
    try {
        const requests = await SubscriptionRequest.find({ status: 'pending' })
            .populate('institution', 'name email nuit')
            .populate('requestedBy', 'name email phone')
            .populate('packageId', 'name price durationDays features')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: requests
        });
    } catch (error) {
        console.error('Erro ao buscar pedidos de subscrição:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Pedidos da instituição actual
router.get('/my-subscription-requests', protect, async (req, res) => {
    try {
        const instId = req.institutionId || req.user?.activeInstitution?._id || req.user?.institution?._id || req.user?.institution;
        if (!instId) return res.json({ success: true, data: [] });

        const requests = await SubscriptionRequest.find({ institution: instId })
            .populate('packageId', 'name price durationDays features')
            .sort({ createdAt: -1 });

        res.json({ success: true, data: requests });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Submeter pedido de subscrição (Owner/Admin)
router.post('/subscription-request', protect, authorize('owner', 'admin'), uploadPaymentReceipt.single('proof'), handleSubmitSubscriptionRequest);

// Aprovar / Rejeitar pedido (Super Admin)
router.put('/subscription-request/:id/approve', protect, authorize('super_admin'), handleApproveSubscriptionRequest);
router.put('/subscription-request/:id/reject', protect, authorize('super_admin'), handleRejectSubscriptionRequest);

// Renovar/atribuir pacote e tempo de acesso diretamente a uma instituição (Super Admin)
router.put('/:id/subscription', protect, authorize('super_admin'), async (req, res) => {
    try {
        const { plan, packageId, durationDays, enabledFeatures, maxUsers, status } = req.body;
        const inst = await Institution.findById(req.params.id);
        if (!inst) {
            return res.status(404).json({ success: false, message: 'Instituição não encontrada.' });
        }

        await seedDefaultPackages();
        let pkg = null;
        if (packageId) {
            pkg = await SubscriptionPackage.findById(packageId);
        } else if (plan) {
            pkg = await SubscriptionPackage.findOne({ slug: String(plan).toLowerCase().trim() });
        }

        const days = Number(durationDays) || (plan === 'trial' ? 7 : pkg?.durationDays) || 30;
        const now = new Date();
        const newExpiresAt = status === 'expired'
            ? new Date(now.getTime() - 1000)
            : new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

        const resolvedFeatures = Array.isArray(enabledFeatures)
            ? enabledFeatures
            : pkg?.features || DEFAULT_FEATURES_BY_LEGACY_PLAN[plan] || ALL_FEATURE_CODES;

        const resolvedMaxUsers = maxUsers !== undefined && maxUsers !== null && maxUsers !== ''
            ? Number(maxUsers)
            : (pkg?.limits?.maxUsers ?? (plan === 'trial' ? 0 : inst.subscription?.maxUsers ?? 0));

        inst.subscription = {
            ...inst.subscription?.toObject?.(),
            plan: pkg?.slug || plan || inst.subscription?.plan || 'standard',
            packageId: pkg?._id || inst.subscription?.packageId || null,
            packageName: pkg?.name || (plan === 'trial' ? 'Período Experimental (7 Dias)' : plan) || inst.subscription?.packageName || 'Personalizado',
            enabledFeatures: resolvedFeatures,
            maxUsers: resolvedMaxUsers,
            status: status || 'active',
            expiresAt: newExpiresAt,
            lastPaymentDate: now,
        };
        await inst.save();

        res.json({
            success: true,
            message: 'Subscrição e funcionalidades da instituição actualizadas com sucesso!',
            data: inst,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Activar/bloquear instituição (Super Admin)
router.put('/:id/status', protect, authorize('super_admin'), async (req, res) => {
    try {
        const { isActive } = req.body;
        const inst = await Institution.findByIdAndUpdate(
            req.params.id,
            { isActive: Boolean(isActive) },
            { new: true }
        );
        if (!inst) {
            return res.status(404).json({ success: false, message: 'Instituição não encontrada.' });
        }
        res.json({ success: true, data: inst });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Remover instituição (Super Admin)
router.delete('/:id', protect, authorize('super_admin'), async (req, res) => {
    try {
        const inst = await Institution.findByIdAndDelete(req.params.id);
        if (!inst) {
            return res.status(404).json({ success: false, message: 'Instituição não encontrada.' });
        }
        res.json({ success: true, message: 'Instituição removida com sucesso.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
