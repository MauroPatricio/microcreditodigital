import express from 'express';
import whatsappService from '../services/whatsappService.js';
import notificationService from '../services/notificationService.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/whatsapp/status
// @desc    Get connection status and QR code
// @access  Private (Owner/Admin)
router.get('/status', protect, authorize('owner', 'super_admin', 'admin'), (req, res) => {
    const status = whatsappService.getStatus();
    res.json({ success: true, data: status });
});

// @route   GET /api/whatsapp/templates
// @desc    Get available notification templates
// @access  Private (Owner/Admin)
router.get('/templates', protect, authorize('owner', 'super_admin', 'admin'), (req, res) => {
    // Transform templates object into array of { key, description }
    const templatesList = Object.keys(notificationService.templates).map(key => ({
        key,
        name: key.replace(/_/g, ' '),
        preview: notificationService.templates[key]('{Nome}', '{Valor}', '{Data}')
    }));
    res.json({ success: true, data: templatesList });
});

// @route   POST /api/whatsapp/restart
// @desc    Restart WhatsApp client
// @access  Private (Owner/Admin)
router.post('/restart', protect, authorize('owner', 'super_admin'), async (req, res) => {
    try {
        await whatsappService.restartClient();
        res.json({ success: true, message: 'WhatsApp client restarting...' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to restart client', error: error.message });
    }
});

// @route   POST /api/whatsapp/send (Test endpoint)
// @desc    Send a test message
// @access  Private (Owner)
router.post('/send', protect, authorize('owner'), async (req, res) => {
    const { to, message } = req.body;
    try {
        await whatsappService.sendMessage(to, message);
        res.json({ success: true, message: 'Message sent' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to send message', error: error.message });
    }
});

export default router;
