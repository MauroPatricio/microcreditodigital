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
        initialBalance: { type: Number, default: 0 }, // Saldo Inicial de Caixa
        loanLimits: {
            min: { type: Number, default: 1000 },
            max: { type: Number, default: 50000 }
        },
        interestRates: {
            default: { type: Number, default: 10 }, // 10%
            penaltyRate: { type: Number, default: 1 } // 1% ao dia de atraso
        },
        appearance: {
            primaryColor: { type: String, default: '#0A2540' },
            logoUrl: String,
            headerTitle: String
        },
        signature: {
            name: String,
            role: String,
            stampUrl: String
        },
        paymentAccounts: [{
            type: { type: String, enum: ['bank', 'mpesa', 'emola', 'other'] },
            bankName: String,
            accountName: String,
            accountNumber: String,
            nib: String,
            agency: String,
            phoneProvider: String, // para mpesa, emola
            phoneNumber: String,
            description: String,
            isPrimary: { type: Boolean, default: false },
            isActive: { type: Boolean, default: true }
        }],
        guaranteeSettings: {
            isRequired: { type: Boolean, default: false },
            allowOptional: { type: Boolean, default: true },
            requiredDocuments: [{ type: String }] // ex: ['BI_FRENTE', 'BI_VERSO', 'COMPROVATIVO_RESIDENCIA']
        },
        notificationSettings: {
            remindersBeforeDue: [{ type: Number, default: [7, 3, 1] }], // dias antes
            remindOnDueDate: { type: Boolean, default: true },
            remindAfterDue: { type: Boolean, default: true },
            channels: {
                push: { type: Boolean, default: true },
                email: { type: Boolean, default: true },
                sms: { type: Boolean, default: false }
            },
            emailConfig: {
                senderName: { type: String, trim: true, default: '' },
                senderEmail: { type: String, trim: true, default: '' },
                smtpHost: { type: String, trim: true, default: '' },
                smtpPort: { type: Number, default: 587 },
                smtpSecure: { type: Boolean, default: false },
                smtpUser: { type: String, trim: true, default: '' },
                smtpPassword: { type: String, default: '' },
                alertRecipients: { type: [String], default: [] },
                notifyOnPaymentReceived: { type: Boolean, default: true },
                notifyOnPaymentConfirmed: { type: Boolean, default: true }
            }
        },
        onboardingSettings: {
            requireEmergencyContact: { type: Boolean, default: true },
            requireProfessionalInfo: { type: Boolean, default: true },
            requiredDocuments: [{ type: String }]
        }
    },
    subscription: {
        plan: {
            type: String,
            default: 'trial',
            trim: true
        },
        packageId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SubscriptionPackage',
            default: null
        },
        packageName: {
            type: String,
            default: 'Período Experimental (7 Dias)'
        },
        enabledFeatures: {
            type: [String],
            default: null
        },
        maxUsers: {
            type: Number,
            default: 0
        },
        status: {
            type: String,
            enum: ['active', 'expired', 'pending', 'cancelled', 'rejected'],
            default: 'active'
        },
        expiresAt: {
            type: Date
        },
        lastPaymentDate: {
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
