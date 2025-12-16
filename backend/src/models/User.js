const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Nome é obrigatório'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email é obrigatório'],
        unique: true,
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
        enum: ['client', 'admin', 'super_admin'],
        default: 'client'
    },
    identityDocument: {
        type: String,
        required: [true, 'Número do BI é obrigatório'],
        unique: true
    },
    address: {
        street: String,
        city: String,
        province: String,
        country: { type: String, default: 'Moçambique' }
    },
    dateOfBirth: {
        type: Date,
        required: [true, 'Data de nascimento é obrigatória']
    },
    creditScore: {
        type: Number,
        default: 500,
        min: 0,
        max: 1000
    },
    riskProfile: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
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
    pushToken: {
        type: String,
        default: null
    },
    lastLogin: {
        type: Date
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

const User = mongoose.model('User', userSchema);

module.exports = User;
