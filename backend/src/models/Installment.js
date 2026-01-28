import mongoose from 'mongoose';

const installmentSchema = new mongoose.Schema({
    credit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Credit',
        required: true
    },
    institution: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Institution',
        required: true
    },
    installmentNumber: {
        type: Number,
        required: true
    },
    dueDate: {
        type: Date,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    principal: {
        type: Number,
        required: true
    },
    interest: {
        type: Number,
        required: true
    },
    lateFee: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        required: true
    },
    paidAmount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'overdue', 'partially_paid'],
        default: 'pending'
    },
    paidAt: {
        type: Date
    },
    payments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment'
    }],
    daysPastDue: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Atualizar totalAmount quando lateFee muda
installmentSchema.pre('save', function (next) {
    this.totalAmount = this.amount + this.lateFee;
    next();
});

// Verificar se está vencida
installmentSchema.methods.isOverdue = function () {
    return this.status !== 'paid' && new Date() > this.dueDate;
};

// Calcular dias de atraso
installmentSchema.methods.calculateDaysPastDue = function () {
    if (this.status === 'paid') {
        return 0;
    }

    const today = new Date();
    if (today > this.dueDate) {
        const diffTime = Math.abs(today - this.dueDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    return 0;
};

// Indexes para otimização de performance
installmentSchema.index({ credit: 1 });
installmentSchema.index({ dueDate: 1 });
installmentSchema.index({ status: 1 });
installmentSchema.index({ credit: 1, dueDate: 1 });
installmentSchema.index({ status: 1, dueDate: 1 });

const Installment = mongoose.model('Installment', installmentSchema);

export default Installment;
