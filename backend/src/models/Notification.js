const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: [
            'payment_reminder',
            'payment_confirmed',
            'credit_approved',
            'credit_rejected',
            'credit_disbursed',
            'overdue_notice',
            'late_fee_applied',
            'general'
        ],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    channel: {
        type: String,
        enum: ['push', 'sms', 'email', 'in_app'],
        default: 'in_app'
    },
    sent: {
        type: Boolean,
        default: false
    },
    sentAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Índice para busca rápida por usuário e status de leitura
notificationSchema.index({ user: 1, isRead: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
