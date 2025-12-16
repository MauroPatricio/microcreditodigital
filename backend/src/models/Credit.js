const mongoose = require('mongoose');

const creditSchema = new mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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
        enum: ['pending', 'approved', 'rejected', 'active', 'paid', 'defaulted', 'restructured'],
        default: 'pending'
    },
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
    contractUrl: {
        type: String
    },
    notes: {
        type: String
    }
}, {
    timestamps: true
});

// Calcular total a pagar antes de salvar
creditSchema.pre('save', function (next) {
    if (this.isModified('approvedAmount') || this.isModified('interestRate') || this.isModified('term')) {
        const monthlyRate = this.interestRate / 100 / 12;
        const numberOfPayments = this.term;

        // Fórmula de amortização (Price)
        this.monthlyPayment = this.approvedAmount *
            (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
            (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

        this.totalPayable = this.monthlyPayment * this.term;
    }
    next();
});

const Credit = mongoose.model('Credit', creditSchema);

module.exports = Credit;
