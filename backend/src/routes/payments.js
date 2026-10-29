import express from 'express';
import Payment from '../models/Payment.js';
import Installment from '../models/Installment.js';
import Credit from '../models/Credit.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import smsService from '../services/sms.js';
import CashTransaction from '../models/CashTransaction.js';
import { protect, authorize } from '../middleware/auth.js';
import { auditAction } from '../middleware/auditMiddleware.js';
import { paymentValidation, validate } from '../middleware/validation.js';
import uploadPaymentReceipt from '../middleware/uploadPaymentMiddleware.js';
import fs from 'fs';

const router = express.Router();

// @route   POST /api/payments
// @desc    Registrar pagamento com comprovativo
// @access  Private (Client)
router.post('/', protect, uploadPaymentReceipt.single('receipt'), async (req, res) => {
    try {
        const { creditId, installmentId, amount, paymentMethod, transactionId } = req.body;
        
        // Verifica se há ficheiro
        const receiptUrl = req.file ? `/uploads/receipts/${req.file.filename}` : null;

        // Verificar se crédito existe
        const credit = await Credit.findById(creditId);

        if (!credit) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(404).json({ success: false, message: 'Crédito não encontrado' });
        }

        if (credit.institution.toString() !== req.institution._id.toString() || 
           (req.user.role === 'client' && credit.client.toString() !== req.user._id.toString())) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(403).json({ success: false, message: 'Acesso negado' });
        }

        let installment = null;
        if (installmentId) {
            installment = await Installment.findById(installmentId);
            if (!installment || installment.credit.toString() !== creditId) {
                if (req.file) fs.unlinkSync(req.file.path);
                return res.status(404).json({ success: false, message: 'Parcela não encontrada' });
            }
            
            // Alterar estado da parcela para indicar que está em análise
            installment.status = 'in_analysis';
            await installment.save();
        }

        // Criar pagamento como pendente
        const payment = await Payment.create({
            credit: creditId,
            institution: req.institution._id,
            installment: installmentId || null,
            client: req.user._id,
            amount: Number(amount),
            paymentMethod,
            transactionId: transactionId || `PAY-${Date.now()}`,
            status: 'pending',
            receiptUrl
        });

        // Notificar Instituição
        // Aqui deve notificar administradores da instituição
        await Notification.create({
            user: credit.agent || credit.institution, // Pode ser broadcast para admin
            institution: req.institution._id,
            type: 'payment_submitted',
            title: 'Novo pagamento submetido',
            message: `Cliente submeteu um comprovativo de pagamento de ${amount} MT pendente de confirmação.`,
            metadata: { paymentId: payment._id }
        });

        res.status(201).json({
            success: true,
            message: 'Pagamento submetido e pendente de confirmação',
            data: { payment }
        });
    } catch (error) {
        if (req.file) fs.unlinkSync(req.file.path);
        res.status(500).json({ success: false, message: 'Erro ao registrar pagamento', error: error.message });
    }
});

// @route   GET /api/payments/pending
// @desc    Listar pagamentos pendentes
// @access  Private (Admin/Manager)
router.get('/pending', protect, authorize('admin', 'manager', 'owner'), async (req, res) => {
    try {
        const payments = await Payment.find({ institution: req.institution._id, status: 'pending' })
            .populate('client', 'name email phone')
            .populate('credit', 'loanNumber amount status')
            .populate('installment', 'installmentNumber dueDate')
            .sort({ createdAt: -1 });

        res.json({ success: true, data: { payments } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao listar pagamentos pendentes', error: error.message });
    }
});

// @route   PUT /api/payments/:id/confirm
// @desc    Confirmar pagamento
// @access  Private (Admin/Manager)
router.put('/:id/confirm', protect, authorize('admin', 'manager', 'owner'), auditAction('Payment', 'confirm', 'high'), async (req, res) => {
    try {
        const payment = await Payment.findOne({ _id: req.params.id, institution: req.institution._id });

        if (!payment) return res.status(404).json({ success: false, message: 'Pagamento não encontrado' });
        if (payment.status !== 'pending') return res.status(400).json({ success: false, message: 'Pagamento não está pendente' });

        const credit = await Credit.findById(payment.credit);
        let installment = null;

        if (payment.installment) {
            installment = await Installment.findById(payment.installment);
            installment.paidAmount += payment.amount;
            installment.payments.push(payment._id);

            if (installment.paidAmount >= installment.totalAmount) {
                installment.status = 'paid';
                installment.paidAt = new Date();
            } else {
                installment.status = 'partially_paid';
            }
            await installment.save();
        }

        credit.totalPaid += payment.amount;
        if (credit.totalPaid >= credit.totalPayable) {
            credit.status = 'paid';
        }
        await credit.save();

        payment.status = 'confirmed';
        payment.processedAt = new Date();
        payment.confirmedBy = req.user._id;
        await payment.save();

        // Notificar cliente
        await Notification.create({
            user: payment.client,
            institution: req.institution._id,
            type: 'payment_confirmed',
            title: 'Pagamento Confirmado',
            message: `O seu pagamento de ${payment.amount} MT foi confirmado com sucesso.`,
            metadata: { paymentId: payment._id }
        });

        // Registrar no Fluxo de Caixa (Cash Flow)
        const creditClient = await User.findById(credit.client);
        const clientName = creditClient ? creditClient.name : 'Cliente';
        const isFullLiquidation = credit.totalPaid >= credit.totalPayable;
        const txDescription = isFullLiquidation 
            ? `Liquidação do empréstimo de ${clientName}`
            : `Pagamento de parcela do empréstimo de ${clientName}${installment ? ` (Parcela ${installment.installmentNumber})` : ''}`;

        let principalPaid = payment.amount;
        let interestPaid = 0;

        if (installment) {
            const unpaidInterest = Math.max(0, installment.interest - (installment.paidAmount - payment.amount));
            interestPaid = Math.min(payment.amount, unpaidInterest);
            principalPaid = payment.amount - interestPaid;
        }

        if (principalPaid > 0) {
            await CashTransaction.create({
                institution: req.institution._id,
                type: 'entrada',
                category: 'reembolso_emprestimo',
                amount: principalPaid,
                description: txDescription + ' (Capital)',
                reference: credit.loanNumber || credit._id.toString(),
                paymentMethod: payment.paymentMethod,
                date: new Date(),
                createdBy: req.user._id
            });
        }

        if (interestPaid > 0) {
            await CashTransaction.create({
                institution: req.institution._id,
                type: 'entrada',
                category: 'juros',
                amount: interestPaid,
                description: txDescription + ' (Juros/Lucro)',
                reference: credit.loanNumber || credit._id.toString(),
                paymentMethod: payment.paymentMethod,
                date: new Date(),
                createdBy: req.user._id
            });
        }

        res.json({ success: true, message: 'Pagamento confirmado com sucesso', data: { payment } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao confirmar pagamento', error: error.message });
    }
});

// @route   PUT /api/payments/:id/reject
// @desc    Rejeitar pagamento
// @access  Private (Admin/Manager)
router.put('/:id/reject', protect, authorize('admin', 'manager', 'owner'), auditAction('Payment', 'reject', 'high'), async (req, res) => {
    try {
        const { reason } = req.body;
        if (!reason) return res.status(400).json({ success: false, message: 'Motivo da rejeição é obrigatório' });

        const payment = await Payment.findOne({ _id: req.params.id, institution: req.institution._id });

        if (!payment) return res.status(404).json({ success: false, message: 'Pagamento não encontrado' });
        if (payment.status !== 'pending') return res.status(400).json({ success: false, message: 'Pagamento não está pendente' });

        payment.status = 'rejected';
        payment.rejectionReason = reason;
        payment.confirmedBy = req.user._id;
        payment.processedAt = new Date();
        await payment.save();

        if (payment.installment) {
            const installment = await Installment.findById(payment.installment);
            if (installment) {
                // Reverter status in_analysis
                if(installment.paidAmount > 0) {
                    installment.status = 'partially_paid';
                } else if (new Date() > installment.dueDate) {
                    installment.status = 'overdue';
                } else {
                    installment.status = 'pending';
                }
                await installment.save();
            }
        }

        // Notificar cliente
        await Notification.create({
            user: payment.client,
            institution: req.institution._id,
            type: 'payment_rejected',
            title: 'Pagamento Rejeitado',
            message: `O seu pagamento de ${payment.amount} MT não foi confirmado. Motivo: ${reason}`,
            metadata: { paymentId: payment._id }
        });

        res.json({ success: true, message: 'Pagamento rejeitado', data: { payment } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao rejeitar pagamento', error: error.message });
    }
});

// @route   GET /api/payments
// @desc    Listar pagamentos
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const { creditId, status, page = 1, limit = 20 } = req.query;
        let query = {};
        const instId = req.institutionId || req.institution?._id;
        if (instId) {
            query.institution = instId;
        } else if (req.user.role !== 'super_admin') {
            return res.status(400).json({ success: false, message: 'Instituição não identificada' });
        }
        if (req.user.role === 'client') query.client = req.user._id;
        if (creditId) query.credit = creditId;
        if (status) query.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const payments = await Payment.find(query)
            .populate('client', 'name email')
            .populate('credit', 'loanNumber amount status')
            .populate('installment', 'installmentNumber dueDate status')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        const total = await Payment.countDocuments(query);

        res.json({
            success: true,
            data: {
                payments,
                pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao listar pagamentos', error: error.message });
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

        if (!payment) return res.status(404).json({ success: false, message: 'Pagamento não encontrado' });
        
        const isSameInst = payment.institution?.toString() === req.institution?._id.toString();
        const isOwn = payment.client._id.toString() === req.user._id.toString();

        if (!isSameInst || (req.user.role === 'client' && !isOwn)) {
            return res.status(403).json({ success: false, message: 'Acesso negado' });
        }

        res.json({ success: true, data: { payment } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao obter pagamento', error: error.message });
    }
});

export default router;
