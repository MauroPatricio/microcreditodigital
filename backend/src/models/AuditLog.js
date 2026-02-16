import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
    institution: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Institution',
        required: false
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    action: {
        type: String,
        required: true // e.g., 'create', 'update', 'delete', 'approve', 'disburse', 'login'
    },
    entityType: {
        type: String,
        required: true // e.g., 'Credit', 'Payment', 'User', 'Client'
    },
    entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false
    },
    changes: {
        before: mongoose.Schema.Types.Mixed,
        after: mongoose.Schema.Types.Mixed
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    metadata: {
        ipAddress: String,
        userAgent: String,
        path: String,
        method: String
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for fast searching
auditLogSchema.index({ institution: 1, timestamp: -1 });
auditLogSchema.index({ user: 1, timestamp: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ action: 1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
