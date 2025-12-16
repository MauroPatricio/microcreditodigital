const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Installment = require('../models/Installment');
const Credit = require('../models/Credit');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');
const { paymentValidation, validate } = require('../middleware/validation');

// @route   POST /api/payments
// @desc    Registrar pagamento
// @access  Private (Client)
router.post('/', protect, paymentValidation, validate, async (req, res) => {
    try {
        const { creditId, installmentId, amount, paymentMethod, transactionId } = req.body;

        // Verificar se crédito existe e pertence ao usuário
        const credit = await Credit.findById(creditId);

        if (!credit) {
            return res.status(404).json({
                success: false,
                message: 'Crédito não encontrado'
            });
        }

        if (req.user.role === 'client' && credit.client.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado'
            });
        }

        // Se installmentId foi fornecido, verificar
        let installment = null;
        if (installmentId) {
            installment = await Installment.findById(installmentId);

            if (!installment || installment.credit.toString() !== creditId) {
                return res.status(404).json({
                    success: false,
                    message: 'Parcela não encontrada'
                });
            }
        }

        // Criar pagamento
        const payment = await Payment.create({
            credit: creditId,
            installment: installmentId || null,
            client: req.user._id,
            amount,
            paymentMethod,
            transactionId: transactionId || `PAY-${Date.now()}`,
            status: 'completed', // Em produção, seria 'pending' até confirmação
            processedAt: new Date()
        });

        // Atualizar parcela se específica
        if (installment) {
            installment.paidAmount += amount;
            installment.payments.push(payment._id);

            if (installment.paidAmount >= installment.totalAmount) {
                installment.status = 'paid';
                installment.paidAt = new Date();
            } else {
                installment.status = 'partially_paid';
            }

            await installment.save();
        }

        // Atualizar total pago no crédito
        credit.totalPaid += amount;

        // Verificar se crédito foi totalmente pago
        if (credit.totalPaid >= credit.totalPayable) {
            credit.status = 'paid';
        }

        await credit.save();

        // Criar notificação
        await Notification.create({
            user: req.user._id,
            type: 'payment_confirmed',
            title: 'Pagamento Confirmado',
            message: `Pagamento de ${amount.toFixed(2)} MT foi processado com sucesso.`,
            metadata: {
                paymentId: payment._id,
                creditId: credit._id
            }
        });

        res.status(201).json({
            success: true,
            message: 'Pagamento registrado com sucesso',
            data: {
                payment
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao registrar pagamento',
            error: error.message
        });
    }
});

// @route   GET /api/payments
// @desc    Listar pagamentos
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const { creditId, status, page = 1, limit = 20 } = req.query;

        let query = {};

        // Se for cliente, só pode ver seus próprios pagamentos
        if (req.user.role === 'client') {
            query.client = req.user._id;
        }

        if (creditId) {
            query.credit = creditId;
        }

        if (status) {
            query.status = status;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const payments = await Payment.find(query)
            .populate('client', 'name email')
            .populate('credit', 'amount status')
            .populate('installment', 'installmentNumber dueDate')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        const total = await Payment.countDocuments(query);

        res.json({
            success: true,
            data: {
                payments,
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
            message: 'Erro ao listar pagamentos',
            error: error.message
        });
    }
});

// @route   GET /api/payments/:id
// @desc    Obter detalhes de pagamento
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id)
            .populate('client', 'name email phone')
            .populate('credit')
            .populate('installment');

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Pagamento não encontrado'
            });
        }

        // Verificar permissão
        if (req.user.role === 'client' && payment.client._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado'
            });
        }

        res.json({
            success: true,
            data: {
                payment
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao obter pagamento',
            error: error.message
        });
    }
});

// @route   POST /api/payments/webhook/mpesa
// @desc    Webhook M-Pesa
// @access  Public (protegido por validação de assinatura)
router.post('/webhook/mpesa', async (req, res) => {
    try {
        // Em produção, validar assinatura do webhook
        const { transactionId, amount, reference } = req.body;

        // Atualizar pagamento
        const payment = await Payment.findOne({ transactionId });

        if (payment) {
            payment.status = 'completed';
            payment.processedAt = new Date();
            await payment.save();
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// @route   POST /api/payments/webhook/emola
// @desc    Webhook e-Mola
// @access  Public (protegido por validação de assinatura)
router.post('/webhook/emola', async (req, res) => {
    try {
        // Em produção, validar assinatura do webhook
        const { transactionId, amount, reference } = req.body;

        // Atualizar pagamento
        const payment = await Payment.findOne({ transactionId });

        if (payment) {
            payment.status = 'completed';
            payment.processedAt = new Date();
            await payment.save();
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
