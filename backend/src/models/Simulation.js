import mongoose from 'mongoose';

const simulationSchema = new mongoose.Schema({
    simulationNumber: {
        type: String,
        required: true,
        unique: true
    },
    institution: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Institution',
        required: true
    },
    agent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    clientName: String,
    identityDocument: String,
    phone: String,
    amount: {
        type: Number,
        required: true
    },
    term: {
        type: Number,
        required: true
    },
    interestRate: {
        type: Number,
        required: true
    },
    periodicity: {
        type: String,
        enum: ['daily', 'weekly', 'biweekly', 'monthly'],
        default: 'monthly'
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    summary: {
        paymentAmount: Number,
        totalPayable: Number,
        totalInterest: Number,
        endDate: Date
    },
    schedule: [{
        number: Number,
        dueDate: Date,
        amount: Number,
        principal: Number,
        interest: Number,
        balance: Number
    }],
    riskProfile: {
        score: Number,
        confidenceLevel: Number,
        label: String
    }
}, {
    timestamps: true
});

// Middleware para gerar número sequencial antes de salvar
simulationSchema.pre('validate', async function (next) {
    if (this.isNew && !this.simulationNumber) {
        const date = new Date();
        const year = date.getFullYear();
        const count = await mongoose.model('Simulation').countDocuments({
            institution: this.institution,
            createdAt: {
                $gte: new Date(year, 0, 1),
                $lt: new Date(year + 1, 0, 1)
            }
        });
        this.simulationNumber = `SIM-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    next();
});

const Simulation = mongoose.model('Simulation', simulationSchema);

export default Simulation;
