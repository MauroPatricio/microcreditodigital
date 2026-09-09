import express from 'express';
import whatsappService from '../services/whatsappService.js';
import notificationService from '../services/notificationService.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/whatsapp/status
// @desc    Get connection status and QR code
// @access  Private
router.get('/status', protect, authorize('owner', 'super_admin', 'admin', 'manager', 'supervisor', 'agent', 'representative'), (req, res) => {
    const status = whatsappService.getStatus();
    res.json({ success: true, data: status });
});

// @route   GET /api/whatsapp/templates
// @desc    Get available notification templates
// @access  Private
router.get('/templates', protect, authorize('owner', 'super_admin', 'admin', 'manager', 'supervisor', 'agent', 'representative'), (req, res) => {
    const templatesList = Object.keys(notificationService.templates).map(key => ({
        key,
        name: key.replace(/_/g, ' '),
        preview: notificationService.templates[key]('{Nome}', '{Valor}', '{Data}')
    }));
    res.json({ success: true, data: templatesList });
});

// @route   POST /api/whatsapp/restart
// @desc    Restart WhatsApp client / refresh QR code
// @access  Private
router.post('/restart', protect, authorize('owner', 'super_admin', 'admin', 'manager', 'supervisor', 'agent', 'representative'), async (req, res) => {
    try {
        await whatsappService.restartClient();
        res.json({ success: true, message: 'WhatsApp client restarting...' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to restart client', error: error.message });
    }
});

// @route   POST /api/whatsapp/disconnect
// @desc    Disconnect WhatsApp and reset session for new QR code
// @access  Private
router.post('/disconnect', protect, authorize('owner', 'super_admin', 'admin', 'manager', 'supervisor', 'agent', 'representative'), async (req, res) => {
    try {
        await whatsappService.restartClient(true);
        res.json({ success: true, message: 'WhatsApp sessão encerrada com sucesso.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Falha ao desconectar WhatsApp', error: error.message });
    }
});

// @route   POST /api/whatsapp/send (Test endpoint)
// @desc    Send a test message
// @access  Private
router.post('/send', protect, authorize('owner', 'super_admin', 'admin', 'manager', 'supervisor', 'agent', 'representative'), async (req, res) => {
    const { to, message } = req.body;
    try {
        await whatsappService.sendMessage(to, message);
        res.json({ success: true, message: 'Mensagem de teste enviada com sucesso!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Falha ao enviar mensagem', error: error.message });
    }
});

export default router;
