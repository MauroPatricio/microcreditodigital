import express from 'express';
import SmsLog from '../models/SmsLog.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/sms/logs
// @desc    Listar logs de SMS
// @access  Private (Owner/Manager)
router.get('/logs', protect, authorize('owner', 'manager', 'super_admin'), async (req, res) => {
    try {
        const { type, status, recipient, page = 1, limit = 20 } = req.query;

        const query = { institution: req.user.institution._id };

        if (type) query.type = type;
        if (status) query.status = status;
        if (recipient) query.recipient = new RegExp(recipient, 'i');

        const logs = await SmsLog.find(query)
            .populate('user', 'name')
            .populate('credit', '_id')
            .sort({ sentAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await SmsLog.countDocuments(query);

        res.json({
            success: true,
            data: {
                logs,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                totalLogs: count
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar logs de SMS',
            error: error.message
        });
    }
});

// @route   GET /api/sms/stats
// @desc    Estatísticas de SMS
// @access  Private (Owner/Manager)
router.get('/stats', protect, authorize('owner', 'manager', 'super_admin'), async (req, res) => {
    try {
        const stats = await SmsLog.aggregate([
            { $match: { institution: req.user.institution._id } },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    sent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
                    failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
                    totalCost: { $sum: '$cost' }
                }
            }
        ]);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar estatísticas de SMS',
            error: error.message
        });
    }
});

export default router;
