import mongoose from 'mongoose';

const creditSchema = new mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    institution: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Institution',
        required: true
    },
    amount: {
        type: Number,
        required: [true, 'Valor do crédito é obrigatório'],
        min: [1000, 'Valor mínimo de crédito é 1.000 MT']
    },
    approvedAmount: {
        type: Number,
        default: 0
    },
    interestRate: {
        type: Number,
        required: true,
        default: 15 // 15% ao ano
    },
    term: {
        type: Number,
        required: [true, 'Prazo é obrigatório'],
        min: 1,
        max: 36 // até 36 meses
    },
    monthlyPayment: {
        type: Number,
        default: 0
    },
    totalPayable: {
        type: Number,
        default: 0
    },
    totalPaid: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['draft', 'pending', 'under_analysis', 'waiting_documents', 'approved', 'rejected', 'active', 'paid', 'defaulted', 'restructured', 'cancelled'],
        default: 'pending'
    },
    currentStage: {
        type: String,
        enum: ['submission', 'analysis', 'approval', 'signature', 'disbursement'],
        default: 'submission'
    },
    workflowHistory: [{
        stage: String,
        action: String, // 'submitted', 'marked_waiting', 'approved_by_analyst', 'approved_by_supervisor', 'rejected', 'disbursed'
        performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
        comment: String
    }],
    scoring: {
        score: { type: Number, default: 0 },
        riskLevel: { type: String, enum: ['low', 'medium', 'high'] },
        indicators: {
            paymentHistory: Number,
            incomeScore: Number,
            stabilityScore: Number,
            referenceScore: Number
        },
        calculatedAt: Date
    },
    collateral: [{
        type: { type: String, enum: ['vehicle', 'real_estate', 'guarantor', 'equipment', 'other'] },
        description: String,
        value: Number,
        documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }]
    }],
    purpose: {
        type: String,
        required: [true, 'Finalidade do crédito é obrigatória']
    },
    installments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Installment'
    }],
    requestedAt: {
        type: Date,
        default: Date.now
    },
    analyzedAt: Date,
    analyzedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: {
        type: Date
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    rejectedAt: {
        type: Date
    },
    rejectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    rejectionReason: {
        type: String
    },
    disbursedAt: {
        type: Date
    },
    disbursementMethod: {
        type: String,
        enum: ['mpesa', 'emola', 'bank_transfer']
    },
    contractStatus: {
        type: String,
        enum: ['draft', 'pending_signature', 'signed', 'rejected'],
        default: 'draft'
    },
    signedContractUrl: String,
    signatureData: {
        timestamp: Date,
        ipAddress: String,
        userAgent: String,
        method: { type: String, enum: ['otp', 'manuscript'] }
    },
    notes: {
        type: String
    }
}, {
    timestamps: true
});

// Calcular total a pagar antes de salvar
creditSchema.pre('save', function (next) {
    if (this.isModified('approvedAmount') || this.isModified('interestRate') || this.isModified('term') || this.isModified('amount')) {
        const baseAmount = this.approvedAmount || this.amount;
        // Tratamos a taxa como MENSAL conforme o padrão de microcrédito e UI (30% Mensal)
        const monthlyRate = (this.interestRate || 10) / 100;
        const numberOfPayments = this.term;

        if (baseAmount > 0 && numberOfPayments > 0) {
            // Fórmula de amortização (Price) - Adaptada para taxa mensal direta
            if (monthlyRate > 0) {
                this.monthlyPayment = baseAmount *
                    (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
                    (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
            } else {
                this.monthlyPayment = baseAmount / numberOfPayments;
            }

            this.totalPayable = this.monthlyPayment * this.term;
        }
    }
    next();
});

// Indexes para otimização de performance
creditSchema.index({ client: 1 });
creditSchema.index({ status: 1 });
creditSchema.index({ currentStage: 1 }); // New index for workflow
creditSchema.index({ requestedAt: -1 });
creditSchema.index({ approvedAt: -1 });
creditSchema.index({ client: 1, status: 1 }); // Compound index
creditSchema.index({ status: 1, requestedAt: -1 }); // Compound index

const Credit = mongoose.model('Credit', creditSchema);

export default Credit;
