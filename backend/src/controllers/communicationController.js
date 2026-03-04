import communicationService from '../services/communicationService.js';
import MessageSchedule from '../models/MessageSchedule.js';
import CommunicationTemplate from '../models/CommunicationTemplate.js';
import User from '../models/User.js';

/**
 * Send immediate message
 */
export const sendMessage = async (req, res) => {
    try {
        const { clientId, channel, message, type } = req.body;
        const result = await communicationService.sendImmediate({
            clientId,
            agentId: req.user.id,
            institutionId: req.user.institutionId,
            channel,
            message,
            type: type || 'manual'
        });
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Schedule a message
 */
export const scheduleMessage = async (req, res) => {
    try {
        const { clientId, channel, message, scheduledFor, priority, type } = req.body;
        const result = await communicationService.scheduleMessage({
            clientId,
            agentId: req.user.id,
            institutionId: req.user.institutionId,
            channel,
            message,
            scheduledFor,
            priority,
            type: type || 'manual'
        });
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * List scheduled and sent messages (History)
 */
export const getHistory = async (req, res) => {
    try {
        const { status, channel, type, limit = 50, page = 1 } = req.query;
        const query = { institution: req.user.institutionId };

        if (status) query.status = status;
        if (channel) query.channel = channel;
        if (type) query.type = type;

        const history = await MessageSchedule.find(query)
            .populate('client', 'name phone')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await MessageSchedule.countDocuments(query);

        res.status(200).json({
            success: true,
            data: { history, total, page, totalPages: Math.ceil(total / limit) }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Get communication stats for dashboard
 */
export const getStats = async (req, res) => {
    try {
        const institutionId = req.user.institutionId;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const totalSentToday = await MessageSchedule.countDocuments({
            institution: institutionId,
            status: 'sent',
            sentAt: { $gte: today }
        });

        const failedToday = await MessageSchedule.countDocuments({
            institution: institutionId,
            status: 'failed',
            updatedAt: { $gte: today }
        });

        const pending = await MessageSchedule.countDocuments({
            institution: institutionId,
            status: 'pending'
        });

        const channelStats = await MessageSchedule.aggregate([
            { $match: { institution: institutionId, status: 'sent' } },
            { $group: { _id: '$channel', count: { $sum: 1 } } }
        ]);

        res.status(200).json({
            success: true,
            data: { totalSentToday, failedToday, pending, channelStats }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Template Management
 */
export const getTemplates = async (req, res) => {
    try {
        const templates = await CommunicationTemplate.find({
            $or: [{ institution: req.user.institutionId }, { institution: null }]
        });
        res.status(200).json({ success: true, data: templates });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const createTemplate = async (req, res) => {
    try {
        const template = await CommunicationTemplate.create({
            ...req.body,
            institution: req.user.institutionId
        });
        res.status(201).json({ success: true, data: template });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
