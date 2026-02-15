import mongoose from 'mongoose';

const agentTargetSchema = new mongoose.Schema({
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
    period: {
        type: String,
        required: true,
        match: /^\d{4}-\d{2}$/ // Format: YYYY-MM
    },
    targets: {
        newClients: {
            type: Number,
            default: 0,
            min: 0
        },
        creditsApproved: {
            type: Number,
            default: 0,
            min: 0
        },
        totalDisbursed: {
            type: Number,
            default: 0,
            min: 0
        },
        collectionRate: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        }
    },
    achieved: {
        newClients: {
            type: Number,
            default: 0,
            min: 0
        },
        creditsApproved: {
            type: Number,
            default: 0,
            min: 0
        },
        totalDisbursed: {
            type: Number,
            default: 0,
            min: 0
        },
        collectionRate: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        }
    },
    bonus: {
        type: Number,
        default: 0,
        min: 0
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'failed'],
        default: 'active'
    },
    completedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Indexes para otimização
agentTargetSchema.index({ agent: 1, period: 1 }, { unique: true });
agentTargetSchema.index({ institution: 1, period: 1 });
agentTargetSchema.index({ status: 1, period: 1 });

// Method para calcular if targets foram atingidos
agentTargetSchema.methods.checkTargetsAchieved = function () {
    const { targets, achieved } = this;

    const clientsAchieved = achieved.newClients >= targets.newClients;
    const creditsAchieved = achieved.creditsApproved >= targets.creditsApproved;
    const disbursedAchieved = achieved.totalDisbursed >= targets.totalDisbursed;
    const collectionAchieved = achieved.collectionRate >= targets.collectionRate;

    return clientsAchieved && creditsAchieved && disbursedAchieved && collectionAchieved;
};

// Method para calcular percentagem de conclusão
agentTargetSchema.methods.getCompletionPercentage = function () {
    const { targets, achieved } = this;

    const percentages = [];

    if (targets.newClients > 0) {
        percentages.push((achieved.newClients / targets.newClients) * 100);
    }
    if (targets.creditsApproved > 0) {
        percentages.push((achieved.creditsApproved / targets.creditsApproved) * 100);
    }
    if (targets.totalDisbursed > 0) {
        percentages.push((achieved.totalDisbursed / targets.totalDisbursed) * 100);
    }
    if (targets.collectionRate > 0) {
        percentages.push((achieved.collectionRate / targets.collectionRate) * 100);
    }

    if (percentages.length === 0) return 0;

    const average = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
    return Math.min(average, 100);
};

const AgentTarget = mongoose.model('AgentTarget', agentTargetSchema);

export default AgentTarget;
