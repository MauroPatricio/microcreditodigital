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
import { calculateConfidence } from '../services/confidenceService.js';
import simulationService from '../services/simulationService.js';
import cashflowService from '../services/cashflowService.js';
import CashTransaction from '../models/CashTransaction.js';

const router = express.Router();

// @route   POST /api/credits/simulate
// @desc    Simular crédito
// @access  Private (Client)
router.post('/simulate', protect, async (req, res) => {
    try {
        const { amount, term, interestRate, periodicity, startDate, amortizationType } = req.body;

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
        const amortType = amortizationType || 'price';

        const simulation = simulationService.calculateSimulation(amount, term, rate, period, start, amortType);

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
        const { amount, term, interestRate, periodicity, startDate, clientName, template, amortizationType } = req.body;

        if (!amount || !term) {
            return res.status(400).json({ success: false, message: 'Dados incompletos' });
        }

        const rate = interestRate || req.user.institution.settings?.interestRates?.default || 10;
        const period = periodicity || 'monthly';
        const start = startDate || new Date();
        const amortType = amortizationType || 'price';

        // Usar o serviço para garantir que os cálculos batem com a tela
        const simulation = simulationService.calculateSimulation(amount, term, rate, period, start, amortType);

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
        const { amount, term, purpose, collateral, clientId, periodicity, interestRate, amortizationType } = req.body;

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

        // Calcular Confiança Automática
        const allClientCredits = await Credit.find({ client: effectiveClientId });
        const confidenceData = await calculateConfidence(client, allClientCredits);

        // Criar solicitação de crédito
        const credit = await Credit.create({
            client: effectiveClientId,
            institution: req.user.institution._id,
            amount,
            term,
            periodicity: periodicity || 'monthly',
            amortizationType: amortizationType || 'price',
            interestRate: interestRate || req.user.institution.settings?.interestRates?.default || 15,
            purpose,
            collateral,
            status: 'pending',
            currentStage: 'submission',
            confidenceAnalysis: confidenceData,
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
            if (credit.status === 'approved' || credit.status === 'active') {
                return res.json({
                    success: true,
                    message: 'Este crédito já se encontra aprovado',
                    data: { credit }
                });
            }
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

        // Validar saldo em caixa (Controlo Automático de Caixa)
        const currentBalance = await cashflowService.getCurrentBalance(credit.institution);
        if (finalApprovedAmount > currentBalance) {
            return res.status(400).json({
                success: false,
                message: 'Saldo insuficiente em caixa para conceder este empréstimo.'
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

        // Gerar parcelas via Simulation Service garantindo matemática idêntica
        const simulation = simulationService.calculateSimulation(
            credit.approvedAmount,
            credit.term,
            credit.interestRate || 15,
            credit.periodicity || 'monthly',
            new Date(),
            credit.amortizationType || 'price'
        );

        const installments = [];
        for (let i = 0; i < simulation.schedule.length; i++) {
            const row = simulation.schedule[i];
            const installment = await Installment.create({
                credit: credit._id,
                institution: credit.institution,
                installmentNumber: row.number,
                dueDate: row.dueDate,
                amount: row.amount,
                principal: row.principal,
                interest: row.interest,
                totalAmount: row.amount,
                status: 'pending'
            });

            installments.push(installment._id);
        }

        credit.installments = installments;
        await credit.save();

        // Criar transação de saída no caixa automaticamente (Controlo Automático de Caixa)
        const clientForTx = await User.findById(credit.client);
        await CashTransaction.create({
            institution: credit.institution,
            type: 'saida',
            category: 'emprestimo_concedido',
            amount: credit.approvedAmount,
            description: `Empréstimo aprovado para ${clientForTx ? clientForTx.name : 'Cliente'}`,
            reference: credit.loanNumber || credit._id.toString(),
            paymentMethod: 'dinheiro', // Default, a alteração de método pode ser no desembolso
            date: new Date(),
            createdBy: req.user._id
        });

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

        console.log(`[DEBUG DISBURSE] Credit ID: ${credit._id}`);
        console.log(`[DEBUG DISBURSE] Status: ${credit.status}`);
        console.log(`[DEBUG DISBURSE] Contract Status: ${credit.contractStatus}`);

        if (credit.status !== 'approved' || credit.contractStatus !== 'signed') {
            return res.status(400).json({
                success: false,
                message: `Crédito deve estar aprovado e contrato assinado para desembolso. Atual: status=${credit.status}, contractStatus=${credit.contractStatus}`
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

// @route   PUT /api/credits/:id/installments/:installmentId/toggle-status
// @desc    Alternar estado da parcela entre pago e pendente
// @access  Private (Agent/Manager/Owner)
router.put('/:id/installments/:installmentId/toggle-status', protect, authorize('owner', 'manager', 'agent'), async (req, res) => {
    try {
        const { id, installmentId } = req.params;
        const credit = await Credit.findById(id);
        if (!credit) return res.status(404).json({ success: false, message: 'Crédito não encontrado' });

        const installment = await Installment.findById(installmentId);
        if (!installment || installment.credit.toString() !== id) {
            return res.status(404).json({ success: false, message: 'Parcela não encontrada' });
        }

        const oldStatus = installment.status;
        const amount = installment.totalAmount;

        if (oldStatus === 'paid') {
            // Reverter para pendente
            installment.status = 'pending';
            installment.paidAt = undefined;
            installment.paidAmount = 0;
            credit.totalPaid = Math.max(0, credit.totalPaid - amount);
            if (credit.status === 'paid') credit.status = 'active';
        } else {
            // Marcar como pago
            installment.status = 'paid';
            installment.paidAt = new Date();
            installment.paidAmount = amount;
            credit.totalPaid += amount;
            if (credit.totalPaid >= credit.totalPayable) credit.status = 'paid';
        }

        await installment.save();
        await credit.save();

        res.json({
            success: true,
            message: `Parcela ${installment.installmentNumber} marcada como ${installment.status === 'paid' ? 'Paga' : 'Pendente'}`,
            data: { installment, credit }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   PUT /api/credits/:id/restructure
// @desc    Reestruturação de um crédito (alteração de prazos/valores)
// @access  Private (Manager/Owner)
router.put('/:id/restructure', protect, authorize('manager', 'owner', 'super_admin'), async (req, res) => {
    try {
        const { newTerm, newAmount, reason } = req.body;
        const credit = await Credit.findById(req.params.id);

        if (!credit) return res.status(404).json({ success: false, message: 'Crédito não encontrado' });

        // Backup do estado anterior na auditoria
        credit.workflowHistory.push({
            stage: 'analysis',
            action: 'restructured',
            performedBy: req.user._id,
            timestamp: new Date(),
            comment: `Reestruturação: ${reason || 'Sem motivo especificado'}. Termo anterior: ${credit.term}, Valor: ${credit.amount}`
        });

        if (newTerm) credit.term = newTerm;
        if (newAmount) credit.approvedAmount = newAmount;

        credit.status = 'restructured';
        // O pre-save hook do modelo Credit irá recalcular o totalPayable e monthlyPayment

        await credit.save();

        res.json({
            success: true,
            data: { credit }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao reestruturar crédito', error: error.message });
    }
});

// @route   PUT /api/credits/:id/liquidate
// @desc    Liquidação antecipada de um crédito
// @access  Private (Manager/Owner)
router.put('/:id/liquidate', protect, authorize('manager', 'owner', 'super_admin'), async (req, res) => {
    try {
        const credit = await Credit.findById(req.params.id);
        if (!credit) {
            return res.status(404).json({ success: false, message: 'Crédito não encontrado' });
        }

        if (credit.status !== 'active' && credit.status !== 'overdue') {
            return res.status(400).json({ success: false, message: 'Apenas créditos ativos ou em atraso podem ser liquidados' });
        }

        const remainingBalance = credit.totalPayable - credit.totalPaid;

        // Registrar o pagamento final (Simulado ou real dependendo da integração)
        credit.totalPaid = credit.totalPayable;
        credit.remainingBalance = 0;
        credit.status = 'paid';
        credit.lastPaymentDate = new Date();

        // Adicionar ao histórico de auditoria
        credit.workflowHistory.push({
            stage: 'disbursement',
            action: 'liquidated_early',
            performedBy: req.user._id,
            timestamp: new Date(),
            comment: `Liquidação antecipada efetuada. Valor: ${remainingBalance} MT`
        });

        // Registrar automaticamente no Fluxo de Caixa (Caixa)
        const creditClient = await User.findById(credit.client);
        const clientName = creditClient ? creditClient.name : 'Cliente';
        await CashTransaction.create({
            institution: credit.institution,
            type: 'entrada',
            category: 'reembolso_emprestimo',
            amount: remainingBalance,
            description: `Liquidação antecipada do empréstimo de ${clientName}`,
            reference: credit.loanNumber || credit._id.toString(),
            paymentMethod: 'dinheiro', // Ou o método usado na liquidação
            date: new Date(),
            createdBy: req.user._id
        });

        await credit.save();

        res.json({
            success: true,
            data: { credit }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao liquidar crédito', error: error.message });
    }
});

export default router;
