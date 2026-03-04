import mongoose from 'mongoose';

const messageScheduleSchema = new mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    agent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    institution: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Institution',
        required: true
    },
    credit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Credit'
    },
    channel: {
        type: String,
        enum: ['sms', 'whatsapp'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'sent', 'failed', 'cancelled'],
        default: 'pending'
    },
    type: {
        type: String,
        enum: ['manual', 'auto_reminder', 'campaign'],
        default: 'manual'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    scheduledFor: {
        type: Date,
        required: true
    },
    sentAt: {
        type: Date
    },
    error: {
        type: String
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Index for the worker to find pending messages
messageScheduleSchema.index({ status: 1, scheduledFor: 1 });

const MessageSchedule = mongoose.model('MessageSchedule', messageScheduleSchema);

export default MessageSchedule;
