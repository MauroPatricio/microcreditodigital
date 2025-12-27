import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['identity_card', 'proof_of_address', 'contract', 'income_proof', 'other'],
        required: true
    },
    fileUrl: {
        type: String,
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    verifiedAt: {
        type: Date
    },
    rejectionReason: {
        type: String
    },
    notes: {
        type: String
    }
}, {
    timestamps: true
});

const Document = mongoose.model('Document', documentSchema);

export default Document;
