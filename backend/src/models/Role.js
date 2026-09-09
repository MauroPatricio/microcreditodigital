import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Nome do perfil é obrigatório'],
        trim: true
    },
    slug: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    institution: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Institution',
        default: null
    },
    isCustom: {
        type: Boolean,
        default: true
    },
    isSystem: {
        type: Boolean,
        default: false
    },
    permissions: [{
        type: String
    }],
    approvalLimit: {
        type: Number,
        default: 0 // 0 significa usar padrão ou sem autorização direta para aprovação se não for registado limite
    }
}, {
    timestamps: true
});

roleSchema.index({ slug: 1, institution: 1 }, { unique: true });

const Role = mongoose.model('Role', roleSchema);

export default Role;
