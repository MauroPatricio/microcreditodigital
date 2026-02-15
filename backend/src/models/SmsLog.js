import mongoose from 'mongoose';

const smsLogSchema = new mongoose.Schema({
    institution: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Institution',
        required: true
    },
    recipient: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    credit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Credit'
    },
    type: {
        type: String,
        enum: ['approval', 'rejection', 'disbursement', 'payment', 'reminder', 'overdue', 'otp'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['sent', 'failed', 'delivered'],
        default: 'sent'
    },
    provider: {
        type: String,
        default: 'local'
    },
    providerId: String,
    cost: {
        type: Number,
        default: 0
    },
    sentAt: {
        type: Date,
        default: Date.now
    },
    error: String
}, {
    timestamps: true
});

smsLogSchema.index({ institution: 1, sentAt: -1 });
smsLogSchema.index({ recipient: 1 });
smsLogSchema.index({ type: 1 });

const SmsLog = mongoose.model('SmsLog', smsLogSchema);

export default SmsLog;
