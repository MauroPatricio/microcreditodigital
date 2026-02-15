import mongoose from 'mongoose';

const commissionSchema = new mongoose.Schema({
    agent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    institution: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Institution',
        required: true
    },
    credit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Credit',
        required: true
    },
    commissionType: {
        type: String,
        enum: ['registration', 'approval', 'collection'],
        required: true
    },
    baseAmount: {
        type: Number,
        required: true,
        min: 0
    },
    rate: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'paid'],
        default: 'pending'
    },
    period: {
        type: String,
        required: true,
        match: /^\d{4}-\d{2}$/ // Format: YYYY-MM
    },
    approvedAt: {
        type: Date
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    paidAt: {
        type: Date
    },
    paidBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    notes: {
        type: String
    }
}, {
    timestamps: true
});

// Indexes para otimização de performance
commissionSchema.index({ agent: 1, period: 1 });
commissionSchema.index({ status: 1, period: 1 });
commissionSchema.index({ institution: 1, period: 1 });
commissionSchema.index({ agent: 1, status: 1 });

// Method para calcular valores
commissionSchema.statics.calculateCommission = function (baseAmount, rate) {
    return (baseAmount * rate) / 100;
};

const Commission = mongoose.model('Commission', commissionSchema);

export default Commission;
