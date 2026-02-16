import mongoose from 'mongoose';

const whatsappTemplateSchema = new mongoose.Schema({
    institution: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Institution',
        required: true
    },
    name: {
        type: String, // e.g., 'payment_reminder', 'welcome', 'overdue'
        required: true
    },
    title: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true // e.g., 'Olá {{name}}, sua parcela de {{amount}} vence em {{date}}'
    },
    triggerType: {
        type: String,
        enum: ['before_due', 'on_due_date', 'after_due', 'manual'],
        required: true
    },
    triggerDays: {
        type: Number,
        default: 0 // +3 for before_due, -2 for after_due
    },
    isActive: {
        type: Boolean,
        default: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

whatsappTemplateSchema.index({ institution: 1, name: 1 });

const WhatsAppTemplate = mongoose.model('WhatsAppTemplate', whatsappTemplateSchema);

export default WhatsAppTemplate;
