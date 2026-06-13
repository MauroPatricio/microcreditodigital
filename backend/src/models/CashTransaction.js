import mongoose from 'mongoose';

const CashTransactionSchema = new mongoose.Schema({
    institution: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Institution',
        required: true
    },
    type: {
        type: String,
        enum: ['entrada', 'saida'],
        required: true
    },
    category: {
        type: String,
        enum: ['parcela', 'juros', 'multa', 'despesa_operacional', 'emprestimo_desembolso', 'emprestimo_concedido', 'reembolso_emprestimo', 'outro'],
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    description: {
        type: String,
        trim: true
    },
    reference: {
        type: String, // credit ID, payment ID, etc.
        trim: true
    },
    paymentMethod: {
        type: String,
        enum: ['dinheiro', 'mpesa', 'emola', 'transferencia', 'outro'],
        default: 'dinheiro'
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    balance: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Index for fast queries by institution+date
CashTransactionSchema.index({ institution: 1, date: -1 });
CashTransactionSchema.index({ institution: 1, type: 1, date: -1 });

export default mongoose.model('CashTransaction', CashTransactionSchema);
