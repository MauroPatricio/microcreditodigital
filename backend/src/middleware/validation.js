const { body, param, query, validationResult } = require('express-validator');

// Middleware para verificar erros de validação
exports.validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Dados inválidos',
            errors: errors.array()
        });
    }
    next();
};

// Validações para registro de usuário
exports.registerValidation = [
    body('name').trim().notEmpty().withMessage('Nome é obrigatório'),
    body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
    body('phone').trim().notEmpty().withMessage('Telefone é obrigatório'),
    body('password').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres'),
    body('identityDocument').trim().notEmpty().withMessage('Número do BI é obrigatório'),
    body('dateOfBirth').isISO8601().withMessage('Data de nascimento inválida')
];

// Validações para login
exports.loginValidation = [
    body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
    body('password').notEmpty().withMessage('Senha é obrigatória')
];

// Validações para solicitação de crédito
exports.creditRequestValidation = [
    body('amount').isNumeric().isFloat({ min: 1000 }).withMessage('Valor mínimo é 1.000 MT'),
    body('term').isInt({ min: 1, max: 36 }).withMessage('Prazo deve ser entre 1 e 36 meses'),
    body('purpose').trim().notEmpty().withMessage('Finalidade do crédito é obrigatória')
];

// Validações para pagamento
exports.paymentValidation = [
    body('creditId').notEmpty().withMessage('ID do crédito é obrigatório'),
    body('amount').isNumeric().isFloat({ min: 1 }).withMessage('Valor deve ser maior que 0'),
    body('paymentMethod').isIn(['mpesa', 'emola', 'bank_transfer', 'cash']).withMessage('Método de pagamento inválido')
];

// Validações para upload de documento
exports.documentValidation = [
    body('type').isIn(['identity_card', 'proof_of_address', 'contract', 'income_proof', 'other']).withMessage('Tipo de documento inválido')
];

module.exports = exports;
