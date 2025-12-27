import express from 'express';
import Credit from '../models/Credit.js';
import Installment from '../models/Installment.js';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';
import { creditRequestValidation, validate } from '../middleware/validation.js';
import { addMonths } from 'date-fns';

const router = express.Router();

// @route   POST /api/credits/simulate
// @desc    Simular crédito
// @access  Private (Client)
router.post('/simulate', protect, async (req, res) => {
    try {
        const { amount, term, interestRate } = req.body;

        if (!amount || !term) {
            return res.status(400).json({
                success: false,
                message: 'Valor e prazo são obrigatórios'
            });
        }

        const rate = interestRate || parseFloat(process.env.DEFAULT_INTEREST_RATE) || 15;
        const monthlyRate = rate / 100 / 12;
        const numberOfPayments = parseInt(term);

        // Calcular parcela mensal (Price)
        const monthlyPayment = amount *
            (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
            (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

        const totalPayable = monthlyPayment * numberOfPayments;
        const totalInterest = totalPayable - amount;

        res.json({
            success: true,
            data: {
                amount: parseFloat(amount),
                term: numberOfPayments,
                interestRate: rate,
                monthlyPayment: Math.round(monthlyPayment * 100) / 100,
                totalPayable: Math.round(totalPayable * 100) / 100,
                totalInterest: Math.round(totalInterest * 100) / 100
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao simular crédito',
            error: error.message
        });
    }
});

// @route   POST /api/credits/request
// @desc    Solicitar crédito
// @access  Private (Client)
router.post('/request', protect, creditRequestValidation, validate, async (req, res) => {
    try {
        const { amount, term, purpose } = req.body;

        // Verificar se cliente está verificado
        if (!req.user.isVerified) {
            return res.status(403).json({
                success: false,
                message: 'Você precisa verificar sua conta antes de solicitar crédito'
            });
        }

        // Verificar se cliente tem créditos ativos não pagos
        const activeCredits = await Credit.find({
            client: req.user._id,
            status: { $in: ['active', 'defaulted'] }
        });

        if (activeCredits.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Você já possui um crédito ativo. Quite-o antes de solicitar outro.'
            });
        }

        // Criar solicitação de crédito
        const credit = await Credit.create({
            client: req.user._id,
            amount,
            term,
            purpose,
            interestRate: parseFloat(process.env.DEFAULT_INTEREST_RATE) || 15,
            status: 'pending'
        });

        res.status(201).json({
            success: true,
            message: 'Solicitação de crédito enviada com sucesso',
            data: {
                credit
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao solicitar crédito',
            error: error.message
        });
    }
});

// @route   GET /api/credits
// @desc    Listar créditos
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;

        let query = {};

        // Se for cliente, só pode ver seus próprios créditos
        if (req.user.role === 'client') {
            query.client = req.user._id;
        }

        // Filtrar por status
        if (status) {
            query.status = status;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const credits = await Credit.find(query)
            .populate('client', 'name email phone')
            .populate('approvedBy', 'name')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        const total = await Credit.countDocuments(query);

        res.json({
            success: true,
            data: {
                credits,
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao listar créditos',
            error: error.message
        });
    }
});

// @route   GET /api/credits/:id
// @desc    Obter detalhes de crédito
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const credit = await Credit.findById(req.params.id)
            .populate('client', 'name email phone identityDocument')
            .populate('approvedBy', 'name')
            .populate({
                path: 'installments',
                options: { sort: { installmentNumber: 1 } }
            });

        if (!credit) {
            return res.status(404).json({
                success: false,
                message: 'Crédito não encontrado'
            });
        }

        // Verificar permissão
        if (req.user.role === 'client' && credit.client._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado'
            });
        }

        res.json({
            success: true,
            data: {
                credit
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao obter crédito',
            error: error.message
        });
    }
});

// @route   PUT /api/credits/:id/approve
// @desc    Aprovar crédito
// @access  Private (Admin)
router.put('/:id/approve', protect, authorize('admin', 'super_admin'), async (req, res) => {
    try {
        const { approvedAmount } = req.body;

        const credit = await Credit.findById(req.params.id);

        if (!credit) {
            return res.status(404).json({
                success: false,
                message: 'Crédito não encontrado'
            });
        }

        if (credit.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Apenas créditos pendentes podem ser aprovados'
            });
        }

        // Atualizar crédito
        credit.approvedAmount = approvedAmount || credit.amount;
        credit.status = 'approved';
        credit.approvedBy = req.user._id;
        credit.approvedAt = new Date();
        await credit.save();

        // Gerar parcelas
        const installments = [];
        for (let i = 1; i <= credit.term; i++) {
            const dueDate = addMonths(new Date(), i);

            const installment = await Installment.create({
                credit: credit._id,
                installmentNumber: i,
                dueDate,
                amount: credit.monthlyPayment,
                principal: credit.approvedAmount / credit.term,
                interest: credit.monthlyPayment - (credit.approvedAmount / credit.term),
                totalAmount: credit.monthlyPayment,
                status: 'pending'
            });

            installments.push(installment._id);
        }

        credit.installments = installments;
        await credit.save();

        res.json({
            success: true,
            message: 'Crédito aprovado com sucesso',
            data: {
                credit
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao aprovar crédito',
            error: error.message
        });
    }
});

// @route   PUT /api/credits/:id/reject
// @desc    Rejeitar crédito
// @access  Private (Admin)
router.put('/:id/reject', protect, authorize('admin', 'super_admin'), async (req, res) => {
    try {
        const { reason } = req.body;

        const credit = await Credit.findById(req.params.id);

        if (!credit) {
            return res.status(404).json({
                success: false,
                message: 'Crédito não encontrado'
            });
        }

        if (credit.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Apenas créditos pendentes podem ser rejeitados'
            });
        }

        credit.status = 'rejected';
        credit.rejectedBy = req.user._id;
        credit.rejectedAt = new Date();
        credit.rejectionReason = reason || 'Não especificado';
        await credit.save();

        res.json({
            success: true,
            message: 'Crédito rejeitado',
            data: {
                credit
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao rejeitar crédito',
            error: error.message
        });
    }
});

// @route   PUT /api/credits/:id/disburse
// @desc    Desembolsar crédito
// @access  Private (Admin)
router.put('/:id/disburse', protect, authorize('admin', 'super_admin'), async (req, res) => {
    try {
        const { disbursementMethod } = req.body;

        const credit = await Credit.findById(req.params.id);

        if (!credit) {
            return res.status(404).json({
                success: false,
                message: 'Crédito não encontrado'
            });
        }

        if (credit.status !== 'approved') {
            return res.status(400).json({
                success: false,
                message: 'Apenas créditos aprovados podem ser desembolsados'
            });
        }

        credit.status = 'active';
        credit.disbursedAt = new Date();
        credit.disbursementMethod = disbursementMethod || 'mpesa';
        await credit.save();

        res.json({
            success: true,
            message: 'Crédito desembolsado com sucesso',
            data: {
                credit
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao desembolsar crédito',
            error: error.message
        });
    }
});

export default router;
