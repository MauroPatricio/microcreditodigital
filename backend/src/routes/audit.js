import express from 'express';
import AuditLog from '../models/AuditLog.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/audit/logs
// @desc    Listar logs de auditoria
// @access  Private (Owner/SuperAdmin)
router.get('/logs', protect, authorize('owner', 'super_admin', 'admin'), async (req, res) => {
    try {
        const { user, entityType, action, severity, page = 1, limit = 20 } = req.query;

        const query = { institution: req.user.institution._id };

        if (user) query.user = user;
        if (entityType) query.entityType = entityType;
        if (action) query.action = action;
        if (severity) query.severity = severity;

        const logs = await AuditLog.find(query)
            .populate('user', 'name email role')
            .sort({ timestamp: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await AuditLog.countDocuments(query);

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
            message: 'Erro ao buscar logs de auditoria',
            error: error.message
        });
    }
});

// @route   GET /api/audit/entity/:type/:id
// @desc    Obter histórico de uma entidade específica
// @access  Private
router.get('/entity/:type/:id', protect, async (req, res) => {
    try {
        const logs = await AuditLog.find({
            institution: req.user.institution._id,
            entityType: req.params.type,
            entityId: req.params.id
        })
            .populate('user', 'name role')
            .sort({ timestamp: -1 });

        res.json({
            success: true,
            data: logs
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar histórico da entidade',
            error: error.message
        });
    }
});

export default router;
