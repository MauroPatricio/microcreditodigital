import mongoose from 'mongoose';

const contractTemplateSchema = new mongoose.Schema({
    institution: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Institution',
        required: true
    },
    name: {
        type: String,
        required: true // ex: 'standard_loan_v1'
    },
    title: {
        type: String,
        required: true // ex: 'Contrato de Mútuo Padrão'
    },
    content: {
        type: String,
        required: true // HTML or Markdown with {{tags}}
    },
    placeholders: [{
        key: String,
        description: String
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    version: {
        type: Number,
        default: 1
    }
}, {
    timestamps: true
});

contractTemplateSchema.index({ institution: 1, name: 1 });

const ContractTemplate = mongoose.model('ContractTemplate', contractTemplateSchema);

export default ContractTemplate;
