import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
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
    installment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Installment'
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: [true, 'Valor do pagamento é obrigatório'],
        min: [1, 'Valor mínimo de pagamento é 1 MT']
    },
    paymentMethod: {
        type: String,
        enum: ['mpesa', 'emola', 'bank_transfer', 'cash'],
        required: true
    },
    transactionId: {
        type: String,
        unique: true,
        sparse: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'cancelled'],
        default: 'pending'
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    receiptUrl: {
        type: String
    },
    processedAt: {
        type: Date
    },
    failureReason: {
        type: String
    }
}, {
    timestamps: true
});

// Índice para busca rápida por transactionId
paymentSchema.index({ transactionId: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
