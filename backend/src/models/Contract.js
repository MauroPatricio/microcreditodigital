import mongoose from 'mongoose';

const contractSchema = new mongoose.Schema({
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
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    contractNumber: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['draft', 'pending_signature', 'signed', 'expired', 'canceled'],
        default: 'draft'
    },
    fileUrl: {
        type: String
    },
    cloudinaryId: {
        type: String
    },
    signatureId: {
        type: String // ID from external signature provider
    },
    signatureUrl: {
        type: String // URL for client to sign
    },
    signedAt: {
        type: Date
    },
    expiresAt: {
        type: Date
    },
    metadata: {
        ipAddress: String,
        userAgent: String,
        location: {
            type: { type: String, default: 'Point' },
            coordinates: [Number]
        }
    }
}, {
    timestamps: true
});

// Index for performance
contractSchema.index({ credit: 1 });
contractSchema.index({ status: 1 });
contractSchema.index({ client: 1 });
contractSchema.index({ signatureId: 1 });

const Contract = mongoose.model('Contract', contractSchema);

export default Contract;
