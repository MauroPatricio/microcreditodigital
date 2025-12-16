const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

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

module.exports = router;
