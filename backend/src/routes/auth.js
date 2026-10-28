import express from 'express';
import User from '../models/User.js';
import Institution from '../models/Institution.js';
import { protect, authorize, generateToken, generateRefreshToken, verifyRefreshToken } from '../middleware/auth.js';
import { registerValidation, loginValidation, validate } from '../middleware/validation.js';
import { auditAction } from '../middleware/auditMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';
import emailService from '../services/emailService.js';

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Registrar novo usuário (Cliente ou Owner)
// @access  Public
router.post('/register', upload.single('logo'), auditAction('User', 'register', 'high'), registerValidation, validate, async (req, res) => {
    try {
        const {
            name, email, phone, password, identityDocument,
            dateOfBirth, address, role, institutionId,
            institutionName, institutionNuit, // Apenas para Owners
            nuit, professionalInfo, businessInfo, references, onboardingStep,
            guarantor
        } = req.body;

        const userRole = role === 'owner' ? 'owner' : 'client';

        // Verificar se usuário já existe
        if (email) {
            const existingEmail = await User.findOne({ email });
            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'Este email já está registado. Por favor, use outro email ou faça login.'
                });
            }
        }

        if (phone) {
            const existingPhone = await User.findOne({ phone });
            if (existingPhone) {
                return res.status(400).json({
                    success: false,
                    message: 'Este número de telefone já está registado. Por favor, use outro número ou faça login.'
                });
            }
        }

        if (identityDocument) {
            const existingDoc = await User.findOne({ identityDocument });
            if (existingDoc) {
                return res.status(400).json({
                    success: false,
                    message: 'Este número de BI já está registado no sistema.'
                });
            }
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
            guarantor,
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

            const trialExpiresAt = new Date();
            trialExpiresAt.setDate(trialExpiresAt.getDate() + 3);

            const institutionData = {
                name: institutionName,
                nuit: institutionNuit,
                email: email,
                owner: user._id,
                subscription: {
                    plan: 'trial',
                    status: 'active',
                    expiresAt: trialExpiresAt
                }
            };

            if (req.file) {
                // Configurar o logoUrl no appearance settings
                institutionData.settings = {
                    appearance: {
                        logoUrl: `/uploads/logos/${req.file.filename}`
                    }
                };
            }

            const institution = await Institution.create(institutionData);

            user.institution = institution._id;
        } else if (userRole === 'client' && institutionId) {
            // Se for Cliente e enviou um institutionId, verificar se existe
            const institution = await Institution.findById(institutionId);
            if (!institution || !institution.isActive) {
                return res.status(400).json({
                    success: false,
                    message: 'A instituição selecionada é inválida ou inativa'
                });
            }
            user.institution = institution._id;
        }

        await user.save();

        // Popular as instituições para retornar no payload
        await user.populate('institution');
        await user.populate('activeInstitution');

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
        const { email, password, isMobile, twoFactorToken } = req.body;

        // Buscar usuário com senha (por email ou por telefone)
        const user = await User.findOne({
            $or: [
                { email: email.toLowerCase() },
                { phone: email }
            ]
        }).select('+password').populate('institution').populate('activeInstitution');

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

        // Verificar 2FA
        if (user.isTwoFactorEnabled) {
            if (!twoFactorToken) {
                return res.json({
                    success: true,
                    require2FA: true,
                    message: 'Autenticação de Dois Fatores obrigatória'
                });
            }

            const speakeasy = await import('speakeasy');
            const verified = speakeasy.default.totp.verify({
                secret: user.twoFactorSecret,
                encoding: 'base32',
                token: twoFactorToken
            });

            if (!verified) {
                return res.status(401).json({
                    success: false,
                    message: 'Código 2FA inválido ou expirado'
                });
            }
        }

        // Verificar se usuário está bloqueado
        if (user.isBlocked) {
            return res.status(403).json({
                success: false,
                message: 'Usuário bloqueado. Contate o suporte.'
            });
        }

        // Restrição de Acesso Mobile baseada no Plano (Standard não permite app mobile)
        if (isMobile && user.role !== 'super_admin') {
            const currentInstitution = user.activeInstitution || user.institution;
            if (currentInstitution && currentInstitution.subscription) {
                const plan = currentInstitution.subscription.plan;
                if (plan === 'standard' || plan === 'free' || plan === 'starter') {
                    return res.status(403).json({
                        success: false,
                        message: 'O seu plano actual não inclui acesso à aplicação móvel. Use a plataforma Web ou contacte o suporte para actualizar para o plano Premium.'
                    });
                }
            }
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
            .populate('activeInstitution')
            .populate('customRole');

        const userData = user.toJSON();

        // Calcular permissões efetivas do utilizador
        let effectivePermissions = [];
        if (user.role === 'super_admin') {
            effectivePermissions = ['*'];
        } else if (user.customRole && user.customRole.permissions) {
            effectivePermissions = user.customRole.permissions;
        } else {
            const { DEFAULT_ROLE_PERMISSIONS } = await import('../middleware/rbac.js');
            effectivePermissions = DEFAULT_ROLE_PERMISSIONS[user.role] || [];
        }

        userData.effectivePermissions = effectivePermissions;

        res.json({
            success: true,
            data: {
                user: userData
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

// @route   DELETE /api/auth/me
// @desc    Desativar conta do usuário atual (Soft Delete)
// @access  Private
router.delete('/me', protect, auditAction('User', 'delete_account', 'critical'), async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
        }
        
        // Soft delete: set isActive to false or isBlocked to true
        // If the schema uses `isActive`, we'll set it to false, otherwise isBlocked to true.
        // The User model has `isBlocked`, let's set it to true to disable login
        user.isBlocked = true;
        // Optionally add a deactivated flag if the schema has it, but isBlocked prevents login
        await user.save();

        res.json({
            success: true,
            message: 'Conta desativada com sucesso'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao desativar conta',
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

        // Enviar email com o link de recuperação
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const resetLink = `${clientUrl}/reset-password/${resetToken}`;

        try {
            await emailService.sendEmail(
                user.email,
                'Recuperação de Palavra-passe - Microcrédito Digital',
                `
                <h2>Olá, ${user.name}</h2>
                <p>Recebemos um pedido para redefinir a palavra-passe da sua conta.</p>
                <p>Clique no botão ou link abaixo para prosseguir:</p>
                <p style="margin: 20px 0;">
                    <a href="${resetLink}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                        Redefinir Palavra-passe
                    </a>
                </p>
                <p>Ou copie e cole o seguinte link no seu navegador:</p>
                <p><a href="${resetLink}">${resetLink}</a></p>
                <p><small>Este link é válido por 1 hora. Se não solicitou esta redefinição, por favor ignore este email.</small></p>
                <br/>
                <p>Com os melhores cumprimentos,<br/>A Equipa do Microcrédito Digital</p>
                `
            );
        } catch (emailErr) {
            console.error('Erro ao enviar email de reset de senha:', emailErr);
        }

        console.log(`Password reset token for ${email}: ${resetToken}`);
        console.log(`Reset link: ${resetLink}`);

        res.json({
            success: true,
            message: 'Se o email existir, você receberá instruções para redefinir a senha',
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

// @route   PUT /api/auth/push-token
// @desc    Update push token for the current user
// @access  Private
router.put('/push-token', protect, async (req, res) => {
    try {
        const { pushToken } = req.body;
        
        if (!pushToken) {
            return res.status(400).json({
                success: false,
                message: 'Push token é obrigatório'
            });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
        }

        user.pushToken = pushToken;
        await user.save();

        res.json({
            success: true,
            message: 'Push token atualizado com sucesso'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar push token',
            error: error.message
        });
    }
});

// @route   GET /api/auth/2fa/generate
// @desc    Generate 2FA secret and QR code
// @access  Private
router.get('/2fa/generate', protect, async (req, res) => {
    try {
        const speakeasy = await import('speakeasy');
        const qrcode = await import('qrcode');

        const secret = speakeasy.default.generateSecret({
            name: `MicrocreditoDigital (${req.user.email})`
        });

        // Atualiza o secret no user temporariamente, ainda não ativo
        const user = await User.findById(req.user._id);
        user.twoFactorSecret = secret.base32;
        await user.save();

        qrcode.default.toDataURL(secret.otpauth_url, (err, data_url) => {
            if (err) throw err;
            res.json({
                success: true,
                data: {
                    secret: secret.base32,
                    qrcode: data_url
                }
            });
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao gerar 2FA',
            error: error.message
        });
    }
});

// @route   POST /api/auth/2fa/enable
// @desc    Enable 2FA with token
// @access  Private
router.post('/2fa/enable', protect, async (req, res) => {
    try {
        const { token } = req.body;
        const user = await User.findById(req.user._id);

        if (!user.twoFactorSecret) {
            return res.status(400).json({ success: false, message: '2FA não foi gerado' });
        }

        const speakeasy = await import('speakeasy');
        const verified = speakeasy.default.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: token
        });

        if (verified) {
            user.isTwoFactorEnabled = true;
            await user.save();
            res.json({ success: true, message: '2FA ativado com sucesso' });
        } else {
            res.status(400).json({ success: false, message: 'Código 2FA inválido' });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao ativar 2FA',
            error: error.message
        });
    }
});

// @route   POST /api/auth/2fa/disable
// @desc    Disable 2FA
// @access  Private
router.post('/2fa/disable', protect, async (req, res) => {
    try {
        const { token, password } = req.body;
        const user = await User.findById(req.user._id).select('+password');

        // Requer password para desativar
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Senha incorreta' });
        }

        // Verifica o código atual do 2FA
        const speakeasy = await import('speakeasy');
        const verified = speakeasy.default.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: token
        });

        if (verified) {
            user.isTwoFactorEnabled = false;
            user.twoFactorSecret = null;
            await user.save();
            res.json({ success: true, message: '2FA desativado com sucesso' });
        } else {
            res.status(400).json({ success: false, message: 'Código 2FA inválido' });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao desativar 2FA',
            error: error.message
        });
    }
});

export default router;
