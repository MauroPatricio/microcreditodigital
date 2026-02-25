import express from 'express';
import Credit from '../models/Credit.js';
import Installment from '../models/Installment.js';
import User from '../models/User.js';
import Commission from '../models/Commission.js';
import Contract from '../models/Contract.js';
import contractService from '../services/contractService.js';
import smsService from '../services/sms.js';
import { protect, authorize } from '../middleware/auth.js';
import { auditAction } from '../middleware/auditMiddleware.js';
import { creditRequestValidation, validate } from '../middleware/validation.js';
import { addMonths } from 'date-fns';
import { calculateScore } from '../services/scoringService.js';
import simulationService from '../services/simulationService.js';

const router = express.Router();

// @route   POST /api/credits/simulate
// @desc    Simular crédito
// @access  Private (Client)
router.post('/simulate', protect, async (req, res) => {
    try {
        const { amount, term, interestRate, periodicity, startDate } = req.body;

        if (!amount || !term) {
            return res.status(400).json({
                success: false,
                message: 'Valor e prazo são obrigatórios'
            });
        }

        const rate = interestRate || 10;
        // Default to monthly if not specified, for backward compatibility
        const period = periodicity || 'monthly';
        const start = startDate || new Date();

        const simulation = simulationService.calculateSimulation(amount, term, rate, period, start);

        res.json({
            success: true,
            data: simulation.summary,
            schedule: simulation.schedule
        });
    } catch (error) {
        console.error('Simulate Error:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao simular crédito',
            error: error.message
        });
    }
});

// @route   POST /api/credits/simulate/pdf
// @desc    Gerar PDF da simulação
// @access  Private
router.post('/simulate/pdf', protect, async (req, res) => {
    try {
        const { amount, term, interestRate, periodicity, startDate, clientName, template } = req.body;

        if (!amount || !term) {
            return res.status(400).json({ success: false, message: 'Dados incompletos' });
        }

        const rate = interestRate || req.user.institution.settings?.interestRates?.default || 10;
        const period = periodicity || 'monthly';
        const start = startDate || new Date();

        // Usar o serviço para garantir que os cálculos batem com a tela
        const simulation = simulationService.calculateSimulation(amount, term, rate, period, start);

        // Incluir metadados para o PDF
        simulation.summary.clientName = clientName;
        simulation.summary.template = template;

        const pdfBuffer = await contractService.generateSimulationPDF(simulation.summary, req.user);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Length': pdfBuffer.length,
            'Content-Disposition': `attachment; filename="simulacao-${Date.now()}.pdf"`
        });

        res.send(pdfBuffer);

    } catch (error) {
        console.error("Erro ao gerar PDF de simulação:", error);
        res.status(500).json({ success: false, message: 'Erro ao gerar PDF' });
    }
});

// @route   POST /api/credits/request
// @desc    Solicitar crédito
// @access  Private (Agent/Client)
router.post('/request', protect, auditAction('Credit', 'request', 'medium'), creditRequestValidation, validate, async (req, res) => {
    try {
        const { amount, term, purpose, collateral, clientId } = req.body;

        // Se um clientId for passado (por um agente), usamos ele. Caso contrário, usamos o req.user._id
        const effectiveClientId = (['agent', 'manager', 'owner'].includes(req.user.role) && clientId) ? clientId : req.user._id;
        const client = await User.findById(effectiveClientId);

        if (!client) {
            return res.status(404).json({ success: false, message: 'Cliente não encontrado' });
        }

        // Verificar se cliente está verificado
        if (!client.isVerified && req.user.role === 'client') {
            return res.status(403).json({
                success: false,
                message: 'Você precisa verificar sua conta antes de solicitar crédito'
            });
        }

        // Verificar se cliente tem créditos ativos não pagos
        const activeCredits = await Credit.find({
            client: effectiveClientId,
            status: { $in: ['active', 'defaulted'] }
        });

        if (activeCredits.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'O cliente já possui um crédito ativo.'
            });
        }

        // Calcular Score Automático
        const allClientCredits = await Credit.find({ client: effectiveClientId });
        const scoringData = await calculateScore(client, allClientCredits);

        // Criar solicitação de crédito
        const credit = await Credit.create({
            client: effectiveClientId,
            institution: req.user.institution._id,
            amount,
            term,
            purpose,
            collateral,
            interestRate: req.user.institution.settings?.interestRates?.default || 15,
            status: 'pending',
            currentStage: 'submission',
            scoring: scoringData,
            workflowHistory: [{
                stage: 'submission',
                action: 'submitted',
                performedBy: req.user._id,
                comment: 'Solicitação submetida via Onboarding Premium.'
            }]
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

        let query = { institution: req.user.institution._id };

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
        const isSameInstitution = credit.institution.toString() === req.user.institution._id.toString();
        const isOwnCredit = req.user.role === 'client' && credit.client._id.toString() === req.user._id.toString();
        const isAdminOrStaff = ['owner', 'manager', 'agent'].includes(req.user.role);

        if (!isSameInstitution || (req.user.role === 'client' && !isOwnCredit)) {
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
// @access  Private (Manager/Owner)
router.put('/:id/approve', protect, authorize('manager', 'owner', 'super_admin'), auditAction('Credit', 'approve', 'high'), async (req, res) => {
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

        // Validar valor aprovado
        const finalApprovedAmount = approvedAmount || credit.amount;
        if (finalApprovedAmount > credit.amount) {
            return res.status(400).json({
                success: false,
                message: 'O valor aprovado não pode ser superior ao solicitado'
            });
        }

        // Atualizar crédito
        credit.approvedAmount = finalApprovedAmount;
        credit.status = 'approved';
        credit.currentStage = 'approval';
        credit.approvedBy = req.user._id;
        credit.approvedAt = new Date();

        credit.workflowHistory.push({
            stage: 'approval',
            action: 'approved',
            performedBy: req.user._id,
            comment: `Crédito aprovado no valor de ${finalApprovedAmount.toLocaleString()} MT.`
        });

        // O pre-save hook do Mongoose calculará monthlyPayment e totalPayable automaticamente
        await credit.save();

        // Gerar parcelas
        const installments = [];
        for (let i = 1; i <= credit.term; i++) {
            const dueDate = addMonths(new Date(), i);

            const installment = await Installment.create({
                credit: credit._id,
                institution: credit.institution,
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

        // Calcular comissão do agente automaticamente
        const client = await User.findById(credit.client);
        if (client && client.registeredBy) {
            const currentPeriod = new Date().toISOString().slice(0, 7);
            const commissionRate = 2.5; // Pode ser configurável por instituição

            await Commission.create({
                agent: client.registeredBy,
                institution: credit.institution,
                credit: credit._id,
                commissionType: 'approval',
                baseAmount: credit.approvedAmount,
                rate: commissionRate,
                amount: Commission.calculateCommission(credit.approvedAmount, commissionRate),
                status: 'pending',
                period: currentPeriod
            });
        }

        // Gerar contrato automaticamente
        const pdfBuffer = await contractService.generateContractPDF(credit._id);
        const fileName = `contract-${credit._id}-${Date.now()}.pdf`;
        const fileUrl = await contractService.uploadToLocal(pdfBuffer, fileName);

        await Contract.create({
            credit: credit._id,
            institution: credit.institution,
            client: credit.client,
            contractNumber: `CONT-${credit._id.toString().slice(-6).toUpperCase()}-${Date.now().toString().slice(-4)}`,
            fileUrl,
            status: 'draft'
        });

        // Enviar SMS de aprovação
        await smsService.sendCreditApproved(
            credit.client.phone,
            credit.approvedAmount,
            req.user.institution,
            req.user._id,
            credit._id
        );

        res.json({
            success: true,
            message: 'Crédito aprovado e contrato gerado com sucesso',
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
// @access  Private (Manager/Owner)
router.put('/:id/reject', protect, authorize('manager', 'owner', 'super_admin'), async (req, res) => {
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
        credit.currentStage = 'analysis';
        credit.rejectedBy = req.user._id;
        credit.rejectedAt = new Date();
        credit.rejectionReason = reason || 'Não especificado';

        credit.workflowHistory.push({
            stage: 'analysis',
            action: 'rejected',
            performedBy: req.user._id,
            comment: `Solicitação rejeitada. Motivo: ${reason || 'Não especificado'}`
        });

        await credit.save();

        // Enviar SMS de rejeição
        const client = await User.findById(credit.client);
        await smsService.sendCreditRejected(
            client.phone,
            reason,
            req.user.institution,
            req.user._id,
            credit._id
        );

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
// @access  Private (Manager/Owner)
router.put('/:id/disburse', protect, authorize('manager', 'owner', 'super_admin'), auditAction('Credit', 'disburse', 'high'), async (req, res) => {
    try {
        const { disbursementMethod } = req.body;

        const credit = await Credit.findById(req.params.id);

        if (!credit) {
            return res.status(404).json({
                success: false,
                message: 'Crédito não encontrado'
            });
        }

        if (credit.status !== 'approved' || credit.contractStatus !== 'signed') {
            return res.status(400).json({
                success: false,
                message: 'Crédito deve estar aprovado e contrato assinado para desembolso'
            });
        }

        credit.status = 'active';
        credit.currentStage = 'disbursement';
        credit.disbursedAt = new Date();
        credit.disbursementMethod = disbursementMethod || 'mpesa';

        credit.workflowHistory.push({
            stage: 'disbursement',
            action: 'disbursed',
            performedBy: req.user._id,
            comment: `Crédito desembolsado via ${disbursementMethod ? disbursementMethod.toUpperCase() : 'método não especificado'}.`
        });

        await credit.save();

        // Enviar SMS de desembolso
        const client = await User.findById(credit.client);
        await smsService.sendDisbursementNotice(
            client.phone,
            credit.approvedAmount,
            disbursementMethod,
            req.user.institution,
            req.user._id,
            credit._id
        );

        res.json({
            success: true,
            message: `Crédito desembolsado via ${disbursementMethod ? disbursementMethod.toUpperCase() : 'método não especificado'}`,
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

// @route   POST /api/credits/:id/generate-contract
// @desc    Gerar PDF do contrato via template
// @access  Private (Owner/Manager)
router.post('/:id/generate-contract', protect, authorize('owner', 'manager'), auditAction('Credit', 'generate_contract', 'medium'), async (req, res) => {
    try {
        const { templateName } = req.body;
        const credit = await Credit.findById(req.params.id);

        if (!credit) return res.status(404).json({ success: false, message: 'Crédito não encontrado' });

        const pdfBuffer = await contractService.generateContractPDF(credit._id, templateName);
        const fileName = `contract-${credit._id}-${Date.now()}.pdf`;
        const fileUrl = await contractService.uploadToLocal(pdfBuffer, fileName);

        credit.signedContractUrl = fileUrl; // Inicialmente apenas o template gerado
        credit.contractStatus = 'pending_signature';
        credit.currentStage = 'signature';

        credit.workflowHistory.push({
            stage: 'signature',
            action: 'contract_generated',
            performedBy: req.user._id,
            comment: `Contrato digital (${templateName || 'Padrão'}) gerado e enviado para assinatura.`
        });

        await credit.save();

        res.json({
            success: true,
            message: 'Contrato gerado e enviado para assinatura',
            data: { fileUrl }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/credits/:id/sign-contract
// @desc    Assinar contrato digitalmente
// @access  Private (Client)
router.post('/:id/sign-contract', protect, auditAction('Credit', 'sign_contract', 'high'), async (req, res) => {
    try {
        const credit = await Credit.findById(req.params.id);

        if (!credit || credit.client.toString() !== req.user._id.toString()) {
            return res.status(404).json({ success: false, message: 'Acesso negado' });
        }

        credit.contractStatus = 'signed';
        credit.signatureData = {
            timestamp: new Date(),
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            method: req.body.method || 'otp'
        };

        credit.workflowHistory.push({
            stage: 'signature',
            action: 'signed',
            performedBy: req.user._id,
            comment: 'Contrato assinado digitalmente pelo cliente.'
        });

        await credit.save();

        res.json({
            success: true,
            message: 'Contrato assinado com sucesso'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
