import express from 'express';
import User from '../models/User.js';
import Institution from '../models/Institution.js';
import { protect, authorize, generateToken, generateRefreshToken, verifyRefreshToken } from '../middleware/auth.js';
import { registerValidation, loginValidation, validate } from '../middleware/validation.js';
import { auditAction } from '../middleware/auditMiddleware.js';

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Registrar novo usuário (Cliente ou Owner)
// @access  Public
router.post('/register', auditAction('User', 'register', 'high'), registerValidation, validate, async (req, res) => {
    try {
        const {
            name, email, phone, password, identityDocument,
            dateOfBirth, address, role,
            institutionName, institutionNuit, // Apenas para Owners
            nuit, professionalInfo, businessInfo, references, onboardingStep
        } = req.body;

        const userRole = role === 'owner' ? 'owner' : 'client';

        // Verificar se usuário já existe
        const matchCriteria = [{ phone }, { identityDocument }];
        if (email) matchCriteria.push({ email });

        const existingUser = await User.findOne({
            $or: matchCriteria
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Usuário já existe com este email, telefone ou BI'
            });
        }

        // Criar usuário
        const user = new User({
            name,
            email,
            phone,
            password,
            identityDocument,
            nuit,
            dateOfBirth,
            address,
            role: userRole,
            professionalInfo,
            businessInfo,
            references,
            onboardingStep: onboardingStep || 1
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
router.post('/login', auditAction('User', 'login', 'medium'), loginValidation, validate, async (req, res) => {
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
        const user = await User.findById(req.user._id)
            .populate('documents')
            .populate('institution')
            .populate('activeInstitution');

        res.json({
            success: true,
            data: {
                user
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

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email é obrigatório'
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            // Por segurança, não revelar se o usuário existe
            return res.json({
                success: true,
                message: 'Se o email existir, você receberá instruções para redefinir a senha'
            });
        }

        // Gerar token de reset (simples para desenvolvimento)
        const crypto = await import('crypto');
        const resetToken = crypto.default.randomBytes(32).toString('hex');

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hora
        await user.save();

        // Em produção, enviar email com o link
        // Para desenvolvimento, retornar o token no console ou na resposta
        console.log(`Password reset token for ${email}: ${resetToken}`);
        console.log(`Reset link: http://localhost:5173/reset-password/${resetToken}`);

        res.json({
            success: true,
            message: 'Se o email existir, você receberá instruções para redefinir a senha',
            // Em desenvolvimento, incluir o token
            ...(process.env.NODE_ENV === 'development' && { token: resetToken })
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao processar solicitação',
            error: error.message
        });
    }
});

// @route   POST /api/auth/reset-password/:token
// @desc    Reset password with token
// @access  Public
router.post('/reset-password/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Nova senha é obrigatória'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'A senha deve ter no mínimo 6 caracteres'
            });
        }

        // Buscar usuário com token válido
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        }).select('+password');

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Token inválido ou expirado'
            });
        }

        // Atualizar senha
        user.password = password;
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        res.json({
            success: true,
            message: 'Senha redefinida com sucesso'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao redefinir senha',
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

// @route   GET /api/auth/users
// @desc    Obter usuários filtrados (ex: por role)
// @access  Private (Manager/Owner)
router.get('/users', protect, authorize('manager', 'owner', 'super_admin'), async (req, res) => {
    try {
        const { role } = req.query;
        let query = { institution: req.institutionId };

        if (role) {
            query.role = role;
        }

        const users = await User.find(query).select('-password');

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar usuários',
            error: error.message
        });
    }
});

export default router;
