import mongoose from 'mongoose';

const communicationTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    content: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['reminder_pre_due', 'reminder_due', 'overdue_notice', 'payment_confirmation', 'general'],
        required: true
    },
    category: {
        type: String,
        enum: ['sms', 'whatsapp', 'both'],
        default: 'both'
    },
    variables: [{
        type: String
    }], // e.g., ["nome", "valor", "data"]
    isActive: {
        type: Boolean,
        default: true
    },
    institution: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Institution'
    }
}, {
    timestamps: true
});

const CommunicationTemplate = mongoose.model('CommunicationTemplate', communicationTemplateSchema);

export default CommunicationTemplate;
