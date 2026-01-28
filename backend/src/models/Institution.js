import mongoose from 'mongoose';

const institutionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Nome da instituição é obrigatório'],
        trim: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    email: {
        type: String,
        required: [true, 'Email da instituição é obrigatório'],
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    address: {
        street: String,
        city: String,
        province: String,
        country: { type: String, default: 'Moçambique' }
    },
    nuit: {
        type: String,
        required: [true, 'NUIT é obrigatório'],
        unique: true
    },
    settings: {
        currency: { type: String, default: 'MT' },
        loanLimits: {
            min: { type: Number, default: 1000 },
            max: { type: Number, default: 50000 }
        },
        interestRates: {
            default: { type: Number, default: 10 } // 10%
        }
    },
    subscription: {
        plan: {
            type: String,
            enum: ['starter', 'business', 'enterprise', 'free'],
            default: 'free'
        },
        status: {
            type: String,
            enum: ['active', 'expired', 'pending', 'cancelled'],
            default: 'active'
        },
        expiresAt: {
            type: Date
        }
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indexes
institutionSchema.index({ owner: 1 });
institutionSchema.index({ nuit: 1 });

const Institution = mongoose.model('Institution', institutionSchema);

export default Institution;
