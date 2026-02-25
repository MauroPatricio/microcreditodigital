import { body, param, query, validationResult } from 'express-validator';

// Middleware para verificar erros de validação
export const validate = (req, res, next) => {
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
export const registerValidation = [
    body('name').trim().notEmpty().withMessage('Nome é obrigatório'),
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('Email inválido').normalizeEmail(),
    body('phone').trim().notEmpty().withMessage('Telefone é obrigatório'),
    body('password').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres'),
    body('identityDocument').trim().notEmpty().withMessage('Número do BI é obrigatório'),
    body('dateOfBirth').isISO8601().withMessage('Data de nascimento inválida')
];

// Validações para criação de cliente (Agente/Manager)
export const clientValidation = [
    body('name').trim().notEmpty().withMessage('Nome é obrigatório'),
    body('phone').trim().notEmpty().withMessage('Telefone é obrigatório'),
    body('identityDocument').trim().notEmpty().withMessage('Número do BI é obrigatório'),
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('Email inválido').normalizeEmail(),
    body('dateOfBirth').notEmpty().withMessage('Data de nascimento é obrigatória').isISO8601().withMessage('Data de nascimento inválida'),
    body('address.province').notEmpty().withMessage('Província é obrigatória'),
    body('address.city').notEmpty().withMessage('Cidade é obrigatória')
];

// Validações para login
export const loginValidation = [
    body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
    body('password').notEmpty().withMessage('Senha é obrigatória')
];

// Validações para solicitação de crédito
export const creditRequestValidation = [
    body('amount').isNumeric().isFloat({ min: 1000 }).withMessage('Valor mínimo é 1.000 MT'),
    body('term').isInt({ min: 1, max: 365 }).withMessage('Prazo deve ser entre 1 e 365 períodos'),
    body('purpose').trim().notEmpty().withMessage('Finalidade do crédito é obrigatória'),
    body('periodicity').optional().isIn(['daily', 'weekly', 'biweekly', 'monthly']).withMessage('Periodicidade inválida')
];

// Validações para pagamento
export const paymentValidation = [
    body('creditId').notEmpty().withMessage('ID do crédito é obrigatório'),
    body('amount').isNumeric().isFloat({ min: 1 }).withMessage('Valor deve ser maior que 0'),
    body('paymentMethod').isIn(['mpesa', 'emola', 'bank_transfer', 'cash']).withMessage('Método de pagamento inválido')
];

// Validações para upload de documento
export const documentValidation = [
    body('type').isIn(['identity_card', 'proof_of_address', 'contract', 'income_proof', 'other']).withMessage('Tipo de documento inválido')
];
