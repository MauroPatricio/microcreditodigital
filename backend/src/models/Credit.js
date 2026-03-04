import mongoose from 'mongoose';
import { calculateSimulation } from '../services/simulationService.js';

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
    loanNumber: {
        type: String,
        unique: true,
        sparse: true
    },
    agent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    branchId: String,
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
        max: 365 // relaxado para suportar dias/semanas
    },
    periodicity: {
        type: String,
        enum: ['daily', 'weekly', 'biweekly', 'monthly'],
        default: 'monthly'
    },
    amortizationType: {
        type: String,
        enum: ['price', 'sac', 'simples', 'composto', 'flat'],
        default: 'price'
    },
    interestType: {
        type: String,
        enum: ['simple', 'compound', 'flat'],
        default: 'simple'
    },
    totalInterest: {
        type: Number,
        default: 0
    },
    gracePeriod: {
        type: Number,
        default: 0
    },
    startDate: Date,
    firstDueDate: Date,
    endDate: Date,
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
    delayPenalties: {
        type: Number,
        default: 0
    },
    fines: {
        type: Number,
        default: 0
    },
    arrearsInterest: {
        type: Number,
        default: 0
    },
    remainingBalance: {
        type: Number,
        default: 0
    },
    overdueDays: {
        type: Number,
        default: 0
    },
    lateFee: {
        type: Number,
        default: 0
    },
    penaltyFee: {
        type: Number,
        default: 0
    },
    lastPaymentDate: Date,
    nextDueDate: Date,
    status: {
        type: String,
        enum: ['draft', 'pending', 'under_analysis', 'waiting_documents', 'approved', 'rejected', 'active', 'paid', 'overdue', 'defaulted', 'restructured', 'cancelled'],
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
    riskProfile: {
        score: { type: Number, default: 500 },
        confidenceLevel: { type: Number, min: 1, max: 5 },
        label: { type: String },
        metrics: {
            defaultRate: Number,
            lateDaysAverage: Number,
            totalPaidVolume: Number,
            loanFrequency: Number
        },
        calculatedAt: Date
    },
    riskCategory: {
        type: String,
        enum: ['low', 'medium', 'high', 'baixo', 'médio', 'alto'],
        default: 'medium'
    },
    paymentPerformanceScore: {
        type: Number,
        default: 100
    },
    timesLate: {
        type: Number,
        default: 0
    },
    defaultFlag: {
        type: Boolean,
        default: false
    },
    revenueInterestGenerated: {
        type: Number,
        default: 0
    },
    provisionForLoss: {
        type: Number,
        default: 0
    },
    writeOffFlag: {
        type: Boolean,
        default: false
    },
    writeOffAmount: {
        type: Number,
        default: 0
    },
    accountingEntryId: String,
    lastSmsSent: Date,
    lastWhatsappSent: Date,
    communicationStatus: String,
    remindersSentCount: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    modifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    modificationReason: String,
    auditLogId: String,
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

// Middleware para gerar loanNumber sequencial/único
creditSchema.pre('save', async function (next) {
    if (this.isNew || !this.loanNumber) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');

        // Contar quantos empréstimos existem no mês atual para esta instituição
        const count = await this.constructor.countDocuments({
            institution: this.institution,
            createdAt: {
                $gte: new Date(year, date.getMonth(), 1),
                $lt: new Date(year, date.getMonth() + 1, 1)
            }
        });

        const sequence = String(count + 1).padStart(4, '0');
        this.loanNumber = `LOAN-${year}${month}-${sequence}`;
    }
    next();
});

// Calcular total a pagar antes de salvar
creditSchema.pre('save', function (next) {
    if (this.isModified('approvedAmount') || this.isModified('interestRate') || this.isModified('term') || this.isModified('amount') || this.isModified('periodicity') || this.isModified('amortizationType')) {
        const baseAmount = this.approvedAmount || this.amount;
        const numberOfPayments = this.term;

        if (baseAmount > 0 && numberOfPayments > 0) {
            // Utiliza o serviço de simulação para garantir que a BD, o PDF e a UI usam a mesma matemática exata
            const simulation = calculateSimulation(
                baseAmount,
                this.term,
                this.interestRate || 15,
                this.periodicity || 'monthly',
                new Date(),
                this.amortizationType || 'price'
            );

            this.monthlyPayment = simulation.summary.paymentAmount; // Para referências simples (Primeira Parcela no SAC)
            this.totalPayable = simulation.summary.totalPayable;
            this.endDate = simulation.summary.endDate;
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
