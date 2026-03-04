import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Nome é obrigatório'],
        trim: true
    },
    email: {
        type: String,
        unique: true,
        sparse: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Email inválido']
    },
    phone: {
        type: String,
        required: [true, 'Telefone é obrigatório'],
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Senha é obrigatória'],
        minlength: 6,
        select: false
    },
    role: {
        type: String,
        enum: ['client', 'agent', 'manager', 'owner', 'super_admin'],
        default: 'client'
    },
    institution: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Institution',
        required: function () {
            return this.role !== 'super_admin' && this.role !== 'owner';
        }
    },
    activeInstitution: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Institution'
    },
    identityDocument: {
        type: String,
        required: [true, 'Número do BI é obrigatório']
    },
    nuit: {
        type: String,
        trim: true
    },
    dateOfBirth: {
        type: Date,
        required: [true, 'Data de nascimento é obrigatória']
    },
    address: {
        street: String,
        city: String,
        province: String,
        country: { type: String, default: 'Moçambique' },
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    demographics: {
        gender: { type: String, enum: ['male', 'female', 'other'] },
        maritalStatus: { type: String, enum: ['single', 'married', 'divorced', 'widowed'] },
        dependents: { type: Number, default: 0 },
        educationLevel: { type: String, enum: ['none', 'primary', 'secondary', 'university', 'post_grad'] },
        residenceType: { type: String, enum: ['owned', 'rented', 'family', 'other'] },
        yearsInResidence: { type: Number, default: 0 }
    },
    professionalInfo: {
        employmentStatus: { type: String, enum: ['employed', 'self_employed', 'unemployed', 'retired', 'student', 'civil_servant'] },
        employerName: String,
        monthlyIncome: Number,
        monthlyExpenses: Number,
        incomeSource: String,
        employmentDuration: String,
        position: String,
        workAddress: String
    },
    guarantor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    collateralType: String,
    businessInfo: {
        name: String,
        type: String,
        yearsInOperation: Number,
        monthlyRevenue: Number
    },
    references: [{
        name: String,
        relationship: String,
        phone: String
    }],
    selfieUrl: String,
    onboardingStep: {
        type: Number,
        default: 1
    },
    onboardingStatus: {
        type: String,
        enum: ['incomplete', 'pending_verification', 'verified', 'rejected'],
        default: 'incomplete'
    },
    riskProfile: {
        score: { type: Number, default: 500, min: 0, max: 1000 },
        confidenceLevel: { type: Number, default: 3, min: 1, max: 5 },
        label: {
            type: String,
            enum: ['Muito Arriscado', 'Arriscado', 'Moderado', 'Confiável', 'Muito Confiável'],
            default: 'Moderado'
        },
        metrics: {
            defaultRate: { type: Number, default: 0 }, // Taxa de Inadimplência %
            lateDaysAverage: { type: Number, default: 0 }, // Média de dias de atraso
            totalPaidVolume: { type: Number, default: 0 }, // Valor total histórico já liquidado
            loanFrequency: { type: Number, default: 0 }, // Total de créditos ativos/pagos
        },
        lastCalculated: { type: Date, default: Date.now },
        history: [{
            score: Number,
            confidenceLevel: Number,
            date: { type: Date, default: Date.now },
            reason: String
        }]
    },

    isVerified: {
        type: Boolean,
        default: false
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    documents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document'
    }],
    registeredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    pushToken: {
        type: String,
        default: null
    },
    lastLogin: {
        type: Date
    },
    resetPasswordToken: {
        type: String,
        default: null
    },
    resetPasswordExpires: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Hash password antes de salvar
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Método para comparar senha
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Método para retornar user sem senha
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    return user;
};

// Indexes para otimização de performance
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ identityDocument: 1, institution: 1 }, { unique: true, sparse: true });
userSchema.index({ nuit: 1, institution: 1 }, { unique: true, sparse: true });
userSchema.index({ 'address.coordinates': '2dsphere' });
userSchema.index({ createdAt: -1 });

const User = mongoose.model('User', userSchema);

export default User;
