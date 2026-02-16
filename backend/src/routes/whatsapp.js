import express from 'express';
import WhatsAppTemplate from '../models/WhatsAppTemplate.js';
import WhatsAppLog from '../models/WhatsAppLog.js';
import WhatsAppService from '../services/whatsappService.js';
import { protect, authorize } from '../middleware/auth.js';
import { auditAction } from '../middleware/auditMiddleware.js';

const router = express.Router();

// --- TEMPLATES ---

// @route   GET /api/whatsapp/templates
// @desc    Listar templates de WhatsApp
router.get('/templates', protect, authorize('owner', 'super_admin'), async (req, res) => {
    try {
        const templates = await WhatsAppTemplate.find({ institution: req.user.institution._id });
        res.json({ success: true, data: templates });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/whatsapp/templates
// @desc    Criar novo template
router.post('/templates', protect, authorize('owner', 'super_admin'), auditAction('WhatsAppTemplate', 'create', 'medium'), async (req, res) => {
    try {
        const template = await WhatsAppTemplate.create({
            ...req.body,
            institution: req.user.institution._id
        });
        res.status(201).json({ success: true, data: template });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   PUT /api/whatsapp/templates/:id
// @desc    Atualizar template
router.put('/templates/:id', protect, authorize('owner', 'super_admin'), auditAction('WhatsAppTemplate', 'update', 'low'), async (req, res) => {
    try {
        const template = await WhatsAppTemplate.findOneAndUpdate(
            { _id: req.params.id, institution: req.user.institution._id },
            req.body,
            { new: true }
        );
        res.json({ success: true, data: template });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- LOGS & DASHBOARD ---

// @route   GET /api/whatsapp/logs
// @desc    Obter logs de envio
router.get('/logs', protect, authorize('owner', 'manager', 'super_admin'), async (req, res) => {
    try {
        const { status, recipient, page = 1, limit = 20 } = req.query;
        let query = { institution: req.user.institution._id };

        if (status) query.status = status;
        if (recipient) query.recipient = { $regex: recipient, $options: 'i' };

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const logs = await WhatsAppLog.find(query)
            .populate('client', 'name phone')
            .sort({ sentAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        const total = await WhatsAppLog.countDocuments(query);

        res.json({
            success: true,
            data: {
                logs,
                pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/whatsapp/stats
// @desc    Obter métricas de WhatsApp
router.get('/stats', protect, authorize('owner', 'manager', 'super_admin'), async (req, res) => {
    try {
        const stats = await WhatsAppLog.aggregate([
            { $match: { institution: req.user.institution._id } },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);
        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/whatsapp/send-test
// @desc    Enviar mensagem de teste manual
router.post('/send-test', protect, authorize('owner', 'super_admin'), async (req, res) => {
    try {
        const { recipient, message } = req.body;
        const result = await WhatsAppService.sendMessage(recipient, message, {
            institutionId: req.user.institution._id,
            clientId: req.user._id, // Quem enviou o teste
            extra: { isTest: true }
        });
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
