import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Middleware para verificar JWT token
export const protect = async (req, res, next) => {
    try {
        let token;

        // Verificar se o token existe no header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Não autorizado. Token não fornecido.'
            });
        }

        try {
            // Verificar token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Buscar usuário e popular instituição
            req.user = await User.findById(decoded.id).populate('institution');

            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuário não encontrado'
                });
            }

            if (req.user.isBlocked) {
                return res.status(403).json({
                    success: false,
                    message: 'Usuário bloqueado. Contate o suporte.'
                });
            }

            // Injetar ID da instituição no request para fácil acesso em outros controllers
            if (req.user.institution) {
                req.institutionId = req.user.institution._id;
            }

            next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Token inválido ou expirado'
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Erro no servidor',
            error: error.message
        });
    }
};

// Middleware para verificar roles específicos
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Acesso negado. Role '${req.user.role}' não tem permissão.`
            });
        }
        next();
    };
};

// Gerar JWT token
export const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '1h'
    });
};

// Gerar refresh token
export const generateRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
    });
};

// Verificar refresh token
export const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
        return null;
    }
};
