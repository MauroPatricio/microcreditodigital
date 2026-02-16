import mongoose from 'mongoose';

const whatsappLogSchema = new mongoose.Schema({
    institution: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Institution',
        required: true
    },
    recipient: {
        type: String, // Phone number
        required: true
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    credit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Credit'
    },
    installment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Installment'
    },
    template: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WhatsAppTemplate'
    },
    message: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['sent', 'delivered', 'read', 'failed'],
        default: 'sent'
    },
    provider: {
        type: String,
        default: 'simulated'
    },
    providerId: String,
    error: String,
    sentAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

whatsappLogSchema.index({ institution: 1, sentAt: -1 });
whatsappLogSchema.index({ client: 1 });
whatsappLogSchema.index({ recipient: 1 });

const WhatsAppLog = mongoose.model('WhatsAppLog', whatsappLogSchema);

export default WhatsAppLog;
