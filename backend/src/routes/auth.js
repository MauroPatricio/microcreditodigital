import express from 'express';
import User from '../models/User.js';
import Institution from '../models/Institution.js';
import { protect, generateToken, generateRefreshToken, verifyRefreshToken } from '../middleware/auth.js';
import { registerValidation, loginValidation, validate } from '../middleware/validation.js';

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Registrar novo usuário (Cliente ou Owner)
// @access  Public
router.post('/register', registerValidation, validate, async (req, res) => {
    try {
        const {
            name, email, phone, password, identityDocument,
            dateOfBirth, address, role,
            institutionName, institutionNuit // Apenas para Owners
        } = req.body;

        const userRole = role === 'owner' ? 'owner' : 'client';

        // Verificar se usuário já existe
        const existingUser = await User.findOne({
            $or: [{ email }, { phone }, { identityDocument }]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Usuário já existe com este email, telefone ou BI'
            });
        }

        // Criar usuário (sem instituição primeiro se for owner, ou com se for cliente de algum fluxo)
        const user = new User({
            name,
            email,
            phone,
            password,
            identityDocument,
            dateOfBirth,
            address,
            role: userRole
        });

        // Se for Owner, criar instituição
        if (userRole === 'owner') {
            if (!institutionName || !institutionNuit) {
                return res.status(400).json({
                    success: false,
                    message: 'Dados da instituição são obrigatórios para Owner'
                });
            }

            const institution = await Institution.create({
                name: institutionName,
                nuit: institutionNuit,
                email: email,
                owner: user._id
            });

            user.institution = institution._id;
        }

        await user.save();

        // Gerar tokens
        const token = generateToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        res.status(201).json({
            success: true,
            message: userRole === 'owner' ? 'Instituição e Owner registrados com sucesso' : 'Usuário registrado com sucesso',
            data: {
                user: user.toJSON(),
                token,
                refreshToken
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao registrar usuário',
            error: error.message
        });
    }
});

// @route   POST /api/auth/login
// @desc    Login de usuário
// @access  Public
router.post('/login', loginValidation, validate, async (req, res) => {
    try {
        const { email, password } = req.body;

        // Buscar usuário com senha
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Credenciais inválidas'
            });
        }

        // Verificar senha
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Credenciais inválidas'
            });
        }

        // Verificar se usuário está bloqueado
        if (user.isBlocked) {
            return res.status(403).json({
                success: false,
                message: 'Usuário bloqueado. Contate o suporte.'
            });
        }

        // Atualizar último login
        user.lastLogin = new Date();
        await user.save();

        // Gerar tokens
        const token = generateToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        res.json({
            success: true,
            message: 'Login realizado com sucesso',
            data: {
                user: user.toJSON(),
                token,
                refreshToken
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao fazer login',
            error: error.message
        });
    }
});

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token não fornecido'
            });
        }

        // Verificar refresh token
        const decoded = verifyRefreshToken(refreshToken);

        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token inválido ou expirado'
            });
        }

        // Gerar novo access token
        const token = generateToken(decoded.id);

        res.json({
            success: true,
            data: {
                token
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao renovar token',
            error: error.message
        });
    }
});

// @route   GET /api/auth/me
// @desc    Obter usuário atual
// @access  Private
router.get('/me', protect, async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                user: req.user
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao obter dados do usuário',
            error: error.message
        });
    }
});

// @route   POST /api/auth/logout
// @desc    Logout (invalidar token)
// @access  Private
router.post('/logout', protect, async (req, res) => {
    try {
        // Em produção, você pode adicionar o token a uma blacklist
        res.json({
            success: true,
            message: 'Logout realizado com sucesso'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao fazer logout',
            error: error.message
        });
    }
});

export default router;
