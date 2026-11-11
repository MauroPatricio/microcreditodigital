import express from 'express';
import Notification from '../models/Notification.js';
import Payment from '../models/Payment.js';
import SubscriptionRequest from '../models/SubscriptionRequest.js';
import User from '../models/User.js';
import emailService from '../services/emailService.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/notifications/email-preferences
// @desc    Obter preferência de email do utilizador autenticado para receber alertas de pagamentos
// @access  Private
router.get('/email-preferences', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('email paymentNotificationEmail receivePaymentEmails name role');
        res.json({
            success: true,
            data: {
                email: user?.email || req.user.email || '',
                paymentNotificationEmail: user?.paymentNotificationEmail || '',
                receivePaymentEmails: user ? user.receivePaymentEmails !== false : true,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao obter preferências de email', error: error.message });
    }
});

// @route   PUT /api/notifications/email-preferences
// @desc    Utilizador configura email para recepção de notificações e alertas de pagamentos
// @access  Private
router.put('/email-preferences', protect, async (req, res) => {
    try {
        const { paymentNotificationEmail, receivePaymentEmails } = req.body;
        const cleanEmail = paymentNotificationEmail !== undefined ? String(paymentNotificationEmail).trim().toLowerCase() : undefined;

        if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            return res.status(400).json({
                success: false,
                message: 'Email inválido. Informe um endereço de email válido.',
            });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Utilizador não encontrado' });
        }

        if (cleanEmail !== undefined) user.paymentNotificationEmail = cleanEmail;
        if (receivePaymentEmails !== undefined) user.receivePaymentEmails = Boolean(receivePaymentEmails);
        await user.save();

        res.json({
            success: true,
            message: 'Preferências de email de pagamentos guardadas com sucesso!',
            data: {
                email: user.email,
                paymentNotificationEmail: user.paymentNotificationEmail || '',
                receivePaymentEmails: user.receivePaymentEmails !== false,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao guardar preferências de email', error: error.message });
    }
});

// @route   POST /api/notifications/email-preferences/test
// @desc    Enviar email de teste para o endereço configurado pelo utilizador
// @access  Private
router.post('/email-preferences/test', protect, async (req, res) => {
    try {
        const target = String(req.body?.email || req.user.paymentNotificationEmail || req.user.email || '').trim();
        if (!target || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
            return res.status(400).json({
                success: false,
                message: 'Configure primeiro um endereço de email válido.',
            });
        }

        const instId = req.institutionId || req.institution?._id || null;
        const result = await emailService.sendEmail(
            [target],
            'Teste de Recepção de Pagamentos — Microcrédito Digital',
            `<h2>Alerta de Pagamentos Activo</h2><p>Olá <strong>${req.user.name}</strong>, este email confirma que passará a receber notificações e alertas de pagamentos neste endereço (${target}).</p>`,
            { institutionId: instId }
        );

        if (!result.success) {
            return res.status(400).json({ success: false, message: `Falha ao enviar email: ${result.error}` });
        }

        res.json({
            success: true,
            message: `Email de teste enviado para ${target}!`,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/notifications/badges
// @desc    Contagem em tempo real de notificações, cobranças pendentes e subscrições pendentes
// @access  Private
router.get('/badges', protect, async (req, res) => {
    try {
        const unreadNotifications = await Notification.countDocuments({
            user: req.user._id,
            isRead: false,
        });

        let pendingPayments = 0;
        const instId = req.institutionId || req.institution?._id || req.user?.activeInstitution?._id || req.user?.institution?._id;
        if (instId && ['owner', 'admin', 'manager', 'financial', 'collector'].includes(req.user.role)) {
            pendingPayments = await Payment.countDocuments({
                institution: instId,
                status: 'pending',
            });
        } else if (req.user.role === 'super_admin' && instId) {
            pendingPayments = await Payment.countDocuments({
                institution: instId,
                status: 'pending',
            });
        }

        let pendingSubscriptions = 0;
        if (req.user.role === 'super_admin') {
            pendingSubscriptions = await SubscriptionRequest.countDocuments({ status: 'pending' });
        }

        res.json({
            success: true,
            data: {
                unreadNotifications,
                pendingPayments,
                pendingSubscriptions,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao obter contagens de notificações',
            error: error.message,
        });
    }
});

// @route   GET /api/notifications
// @desc    Listar notificações do usuário
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const { isRead, page = 1, limit = 20 } = req.query;

        let query = { user: req.user._id };

        if (isRead !== undefined) {
            query.isRead = isRead === 'true';
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        const total = await Notification.countDocuments(query);
        const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });

        res.json({
            success: true,
            data: {
                notifications,
                unreadCount,
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao listar notificações',
            error: error.message
        });
    }
});

// @route   PUT /api/notifications/:id/read
// @desc    Marcar notificação como lida
// @access  Private
router.put('/:id/read', protect, async (req, res) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notificação não encontrada'
            });
        }

        notification.isRead = true;
        notification.readAt = new Date();
        await notification.save();

        res.json({
            success: true,
            data: {
                notification
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar notificação',
            error: error.message
        });
    }
});

// @route   PUT /api/notifications/mark-all-read
// @desc    Marcar todas como lidas
// @access  Private
router.put('/mark-all-read', protect, async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.user._id, isRead: false },
            { isRead: true, readAt: new Date() }
        );

        res.json({
            success: true,
            message: 'Todas as notificações marcadas como lidas'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar notificações',
            error: error.message
        });
    }
});

export default router;
