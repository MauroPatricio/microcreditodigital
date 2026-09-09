import express from 'express';
import Credit from '../models/Credit.js';
import Installment from '../models/Installment.js';
import User from '../models/User.js';
import Commission from '../models/Commission.js';
import Contract from '../models/Contract.js';
import contractService from '../services/contractService.js';
import smsService from '../services/sms.js';
import { mpesaService } from '../services/mpesaService.js';
import { protect, authorize } from '../middleware/auth.js';
import { requirePermission, enforceSegregationOfDuties, requireApprovalLimit } from '../middleware/rbac.js';
import { auditAction } from '../middleware/auditMiddleware.js';
import { creditRequestValidation, validate } from '../middleware/validation.js';
import { addMonths } from 'date-fns';
import { calculateConfidence } from '../services/confidenceService.js';
import simulationService from '../services/simulationService.js';
import cashflowService from '../services/cashflowService.js';
import CashTransaction from '../models/CashTransaction.js';
import uploadCollateral from '../middleware/uploadCollateralMiddleware.js';
import emailService from '../services/emailService.js';
import notificationService from '../services/notificationService.js';

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

        const rate = interestRate || req.institution?.settings?.interestRates?.default || 10;
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

        const rate = interestRate || req.institution.settings?.interestRates?.default || 10;
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

        // Actualizar Garante no perfil caso tenha sido submetido no pedido
        if (req.body.guarantor && req.body.guarantor.name) {
            client.guarantor = {
                ...client.guarantor,
                name: req.body.guarantor.name,
                documentNumber: req.body.guarantor.documentNumber,
                phone: req.body.guarantor.phone,
                relationship: req.body.guarantor.relationship || 'Outro'
            };
            await client.save();
        }

        // Validação de Garantia Obrigatória
        const guaranteeSettings = req.institution.settings?.guaranteeSettings;
        if (guaranteeSettings && guaranteeSettings.isRequired) {
            if (!client.guarantor || !client.guarantor.name || !client.guarantor.documentNumber) {
                return res.status(400).json({
                    success: false,
                    message: 'Este produto de crédito exige garantia. Por favor, adicione as informações de um Garante no seu perfil antes de solicitar o crédito.'
                });
            }
            
            // Validar documentos obrigatórios do garante se definidos
            if (guaranteeSettings.requiredDocuments && guaranteeSettings.requiredDocuments.length > 0) {
                const hasDocs = client.guarantor.documents && client.guarantor.documents.length >= guaranteeSettings.requiredDocuments.length;
                if (!hasDocs) {
                    return res.status(400).json({
                        success: false,
                        message: 'Faltam documentos obrigatórios do Garante exigidos por esta instituição.'
                    });
                }
            }
        }

        // Calcular Confiança Automática
        const allClientCredits = await Credit.find({ client: effectiveClientId });
        const confidenceData = await calculateConfidence(client, allClientCredits);

        const credit = await Credit.create({
            client: effectiveClientId,
            institution: req.institution._id,
            amount,
            term,
            periodicity: periodicity || 'monthly',
            amortizationType: amortizationType || 'price',
            interestRate: interestRate || req.institution.settings?.interestRates?.default || 15,
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

        // -----------------------------------------------------
        // Enviar Notificações e Emails
        // -----------------------------------------------------
        try {
            // Notificação App/WhatsApp para o Cliente
            if (client.phone) {
                // Se tiver push notification ou outro canal, podemos usar, mas vamos garantir o email
                // Vamos tentar o sendNotification do notificationService se ele tiver um template apropriado
                // Por agora enviamos apenas email e uma log-based notification
            }

            // Email para o Cliente
            await emailService.sendCreditRequestClient(client, credit);

            // Obter os proprietários/gestores da instituição
            const managers = await User.find({
                institution: req.institution._id,
                role: { $in: ['owner', 'manager'] }
            });

            // Email e Notificação para cada proprietário/gestor
            for (const manager of managers) {
                if (manager.email) {
                    await emailService.sendCreditRequestOwner(manager.email, client, credit);
                }
            }
            console.log(`[Notification] Sent notifications for Credit Request ${credit._id}`);
        } catch (notifErr) {
            console.error('[Notification] Error sending credit request notifications:', notifErr.message);
        }

        res.status(201).json({
            success: true,
            message: 'Solicitação de crédito enviada com sucesso',
            data: {
                credit
            }
        });
    } catch (error) {
        import('fs').then(fs => fs.appendFileSync('error_log.txt', new Date().toISOString() + '\\n' + error.stack + '\\n\\n'));
        res.status(500).json({
            success: false,
            message: 'Erro ao solicitar crédito: ' + error.message,
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

        let query = { institution: req.institution._id };

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
        const isSameInstitution = credit.institution.toString() === req.institution._id.toString();
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

const resolveCreditFromReq = async (req) => Credit.findById(req.params.id);
const resolveAmountFromReq = async (req) => {
    const credit = await Credit.findById(req.params.id);
    return req.body.approvedAmount || (credit ? credit.amount : 0);
};

// @route   PUT /api/credits/:id/analyze
// @desc    Registar análise de crédito
// @access  Private
router.put('/:id/analyze', protect, requirePermission('creditos.analyze'), auditAction('Credit', 'analyze', 'medium'), async (req, res) => {
    try {
        const { riskNotes, recommendedAmount } = req.body;
        const credit = await Credit.findById(req.params.id);
        if (!credit) return res.status(404).json({ success: false, message: 'Crédito não encontrado' });

        credit.status = 'under_analysis';
        credit.currentStage = 'analysis';
        if (!credit.makerChecker) credit.makerChecker = {};
        credit.makerChecker.analyzedBy = req.user._id;
        credit.makerChecker.analyzedAt = new Date();

        credit.workflowHistory.push({
            stage: 'analysis',
            action: 'analyzed',
            performedBy: req.user._id,
            comment: riskNotes || `Análise concluída. Valor recomendado: ${recommendedAmount || credit.amount} MT`
        });

        await credit.save();
        res.json({ success: true, message: 'Análise de crédito registada com sucesso', data: { credit } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao registar análise', error: error.message });
    }
});

// @route   PUT /api/credits/:id/recommend
// @desc    Recomendar aprovação ou rejeição
// @access  Private
router.put('/:id/recommend', protect, requirePermission('creditos.recommend'), auditAction('Credit', 'recommend', 'medium'), async (req, res) => {
    try {
        const { recommendation, comment } = req.body;
        const credit = await Credit.findById(req.params.id);
        if (!credit) return res.status(404).json({ success: false, message: 'Crédito não encontrado' });

        credit.status = 'recommended';
        credit.currentStage = 'recommendation';
        credit.workflowHistory.push({
            stage: 'recommendation',
            action: recommendation === 'reject' ? 'recommended_rejection' : 'recommended_approval',
            performedBy: req.user._id,
            comment: comment || `Parecer: ${recommendation}`
        });

        await credit.save();
        res.json({ success: true, message: 'Recomendação registada com sucesso', data: { credit } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao registar recomendação', error: error.message });
    }
});

// @route   PUT /api/credits/:id/reject
// @desc    Rejeitar crédito
// @access  Private
router.put('/:id/reject', protect, requirePermission('creditos.reject'), auditAction('Credit', 'reject', 'high'), async (req, res) => {
    try {
        const { reason } = req.body;
        const credit = await Credit.findById(req.params.id);
        if (!credit) return res.status(404).json({ success: false, message: 'Crédito não encontrado' });

        credit.status = 'rejected';
        credit.currentStage = 'completed';
        credit.workflowHistory.push({
            stage: 'approval',
            action: 'rejected',
            performedBy: req.user._id,
            comment: reason || 'Solicitação de crédito rejeitada'
        });

        await credit.save();
        res.json({ success: true, message: 'Crédito rejeitado com sucesso', data: { credit } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao rejeitar crédito', error: error.message });
    }
});

// @route   PUT /api/credits/:id/disburse
// @desc    Desembolsar crédito aprovado
// @access  Private
router.put('/:id/disburse', protect, requirePermission('creditos.disburse'), auditAction('Credit', 'disburse', 'critical'), async (req, res) => {
    try {
        const credit = await Credit.findById(req.params.id);
        if (!credit) return res.status(404).json({ success: false, message: 'Crédito não encontrado' });

        if (!['approved', 'awaiting_disbursement'].includes(credit.status)) {
            return res.status(400).json({ success: false, message: 'Apenas créditos aprovados podem ser desembolsados' });
        }

        credit.status = 'disbursed';
        credit.currentStage = 'disbursement';
        if (!credit.makerChecker) credit.makerChecker = {};
        credit.makerChecker.disbursedBy = req.user._id;
        credit.makerChecker.disbursedAt = new Date();
        credit.startDate = new Date();

        credit.workflowHistory.push({
            stage: 'disbursement',
            action: 'disbursed',
            performedBy: req.user._id,
            comment: `Crédito desembolsado no valor de ${credit.approvedAmount} MT`
        });

        await credit.save();
        res.json({ success: true, message: 'Crédito desembolsado com sucesso', data: { credit } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao desembolsar crédito', error: error.message });
    }
});

// @route   PUT /api/credits/:id/approve
// @desc    Aprovar crédito
// @access  Private (Com Segregação de Funções e Limite por Valor)
router.put('/:id/approve', protect, requirePermission('creditos.approve'), enforceSegregationOfDuties(resolveCreditFromReq), requireApprovalLimit(resolveAmountFromReq), auditAction('Credit', 'approve', 'high'), async (req, res) => {
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
            req.institution,
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
            req.institution,
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
                message: `Crédito deve estar aprovado e contrato assinado para desembolso.`
            });
        }

        // MAKER ACTION: Solicitar Desembolso
        credit.currentStage = 'awaiting_disbursement';
        credit.disbursementMethod = disbursementMethod || 'mpesa';
        
        credit.makerChecker = {
            requestedBy: req.user._id,
            requestedAt: new Date(),
            status: 'pending'
        };

        credit.workflowHistory.push({
            stage: 'awaiting_disbursement',
            action: 'disbursement_requested',
            performedBy: req.user._id,
            comment: `Pedido de desembolso via ${disbursementMethod ? disbursementMethod.toUpperCase() : 'método não especificado'}. Aguardando aprovação do Checker.`
        });

        await credit.save();

        res.json({
            success: true,
            message: `Pedido de liberação de fundos enviado. Aguardando aprovação de outro colega (Checker).`,
            data: { credit }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao solicitar desembolso',
            error: error.message
        });
    }
});

// @route   PUT /api/credits/:id/approve-disbursement
// @desc    Aprovar o desembolso do crédito (Checker Action)
// @access  Private (Manager/Owner/Super Admin)
router.put('/:id/approve-disbursement', protect, authorize('manager', 'owner', 'super_admin'), auditAction('Credit', 'approve_disbursement', 'high'), async (req, res) => {
    try {
        const credit = await Credit.findById(req.params.id);

        if (!credit) {
            return res.status(404).json({ success: false, message: 'Crédito não encontrado' });
        }

        if (credit.currentStage !== 'awaiting_disbursement') {
            return res.status(400).json({ success: false, message: 'Este crédito não está aguardando liberação de fundos' });
        }

        // Validação MAKER-CHECKER (O Checker não pode ser o Maker)
        // Permitimos bypass apenas se for o owner da instituição e forçado (mas por segurança bloqueamos estritamente)
        if (credit.makerChecker?.requestedBy?.toString() === req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Acesso Negado: O utilizador que solicitou o desembolso (Maker) não pode ser o mesmo a autorizar (Checker).'
            });
        }

        // CHECKER ACTION: Aprovar Desembolso
        credit.status = 'active';
        credit.currentStage = 'disbursement';
        credit.disbursedAt = new Date();
        
        credit.makerChecker.approvedBy = req.user._id;
        credit.makerChecker.approvedAt = new Date();
        credit.makerChecker.status = 'approved';

        credit.workflowHistory.push({
            stage: 'disbursement',
            action: 'disbursed',
            performedBy: req.user._id,
            comment: `Crédito desembolsado definitivamente via ${credit.disbursementMethod}. Checker: ${req.user.name}`
        });

        const client = await User.findById(credit.client);

        // Desembolso via M-Pesa B2C se escolhido
        if (credit.disbursementMethod === 'mpesa') {
            const mpesaResult = await mpesaService.executeMpesaPayout({
                amount: credit.approvedAmount,
                phoneNumber: client.phone,
                referenceId: credit._id.toString()
            });

            if (!mpesaResult.success) {
                return res.status(400).json({
                    success: false,
                    message: `Falha no desembolso M-Pesa: ${mpesaResult.errorMessage}`
                });
            }

            credit.workflowHistory.push({
                stage: 'disbursement',
                action: 'mpesa_success',
                performedBy: req.user._id,
                comment: `Transferência M-Pesa concluída. TX ID: ${mpesaResult.transactionId}`
            });
        }

        await credit.save();
        await smsService.sendDisbursementNotice(
            client.phone,
            credit.approvedAmount,
            credit.disbursementMethod,
            req.institution,
            req.user._id,
            credit._id
        );

        res.json({
            success: true,
            message: `Desembolso autorizado e concluído com sucesso.`,
            data: { credit }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao aprovar desembolso',
            error: error.message
        });
    }
});

// @route   POST /api/credits/request/:id/insist
// @desc    Alert finance team that disbursement countdown has reached 0
// @access  Private (Client)
router.post('/request/:id/insist', protect, async (req, res) => {
    try {
        const credit = await Credit.findById(req.params.id).populate('client', 'name phone');
        if (!credit) return res.status(404).json({ success: false, message: 'Crédito não encontrado' });
        
        // Notify finance team (we'll send to admin email for now)
        const financeEmail = process.env.EMAIL_USER || 'nhiquelaservicos@gmail.com';
        const subject = `[ALERTA] Desembolso Pendente - Crédito #${credit._id.toString().slice(-6)}`;
        const html = `
            <h2>Alerta de Desembolso Pendente</h2>
            <p>O cliente <strong>${credit.client?.name || 'Cliente'}</strong> está aguardando o desembolso do crédito há mais de 30 minutos.</p>
            <p><strong>Detalhes do Crédito:</strong></p>
            <ul>
                <li><strong>ID:</strong> ${credit._id}</li>
                <li><strong>Valor Solicitado:</strong> ${credit.amount} MT</li>
                <li><strong>Cliente:</strong> ${credit.client?.name} (${credit.client?.phone})</li>
                <li><strong>Data de Solicitação:</strong> ${new Date(credit.createdAt).toLocaleString()}</li>
            </ul>
            <p>Por favor, verifique a solicitação no sistema e proceda com o desembolso.</p>
        `;

        await emailService.sendEmail(financeEmail, subject, html);
        
        res.json({ success: true, message: 'Equipa de finanças alertada com sucesso' });
    } catch (error) {
        console.error('Error on insist:', error);
        res.status(500).json({ success: false, message: 'Erro ao enviar alerta' });
    }
});

// @route   POST /api/credits/:id/generate-contract
// @desc    Gerar PDF do contrato via template
// @access  Private (Owner/Manager/Admin)
router.post('/:id/generate-contract', protect, authorize('owner', 'manager', 'admin', 'super_admin', 'supervisor'), auditAction('Credit', 'generate_contract', 'medium'), async (req, res) => {
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

// @route   POST /api/credits/:id/approve-contract
// @desc    Aprovar contrato manualmente (Admin/Manager)
// @access  Private
router.post('/:id/approve-contract', protect, authorize('owner', 'manager', 'admin', 'super_admin', 'supervisor'), auditAction('Credit', 'approve_contract', 'high'), async (req, res) => {
    try {
        const credit = await Credit.findById(req.params.id);

        if (!credit) {
            return res.status(404).json({ success: false, message: 'Crédito não encontrado' });
        }

        credit.contractStatus = 'signed';
        
        credit.workflowHistory.push({
            stage: 'signature',
            action: 'contract_signed',
            performedBy: req.user._id,
            comment: 'Contrato aprovado/assinado manualmente pelo administrador.'
        });

        await credit.save();

        res.json({
            success: true,
            message: 'Contrato aprovado com sucesso'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/credits/:id/reject-contract
// @desc    Rejeitar/Cancelar contrato (Admin/Manager)
// @access  Private
router.post('/:id/reject-contract', protect, authorize('owner', 'manager', 'admin', 'super_admin', 'supervisor'), auditAction('Credit', 'reject_contract', 'medium'), async (req, res) => {
    try {
        const credit = await Credit.findById(req.params.id);

        if (!credit) {
            return res.status(404).json({ success: false, message: 'Crédito não encontrado' });
        }

        credit.contractStatus = 'rejected';
        
        credit.workflowHistory.push({
            stage: 'signature',
            action: 'rejected',
            performedBy: req.user._id,
            comment: 'Contrato rejeitado/cancelado pelo administrador.'
        });

        await credit.save();

        res.json({
            success: true,
            message: 'Contrato rejeitado com sucesso'
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
// @desc    Liquidação antecipada de um crédito com perdão de juros futuros
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

        // Buscar todas as parcelas não pagas
        const installments = await Installment.find({ credit: credit._id, status: { $ne: 'paid' } });

        let amountToPayCapital = 0;
        let amountToPayInterest = 0; // Juros de parcelas já em atraso (não perdoados)
        let forgivenInterest = 0;

        const now = new Date();

        for (let inst of installments) {
            const unpaidPrincipal = (inst.principalAmount || 0) - (inst.paidPrincipal || 0);
            const unpaidInterest = (inst.interestAmount || 0) - (inst.paidInterest || 0);

            amountToPayCapital += unpaidPrincipal;

            // Se a parcela já venceu, o cliente tem de pagar os juros
            if (new Date(inst.dueDate) < now) {
                amountToPayInterest += unpaidInterest;
                inst.paidInterest = (inst.paidInterest || 0) + unpaidInterest;
            } else {
                // Se a parcela é futura, perdoar os juros
                forgivenInterest += unpaidInterest;
                inst.interestAmount = inst.paidInterest || 0; // Zera o juro restante para refletir o perdão
                inst.totalAmount = inst.principalAmount + inst.interestAmount; // Ajusta o total da parcela
            }

            inst.paidPrincipal = (inst.paidPrincipal || 0) + unpaidPrincipal;
            inst.paidAmount = inst.totalAmount;
            inst.status = 'paid';
            inst.paymentDate = now;
            await inst.save();
        }

        const totalToPay = amountToPayCapital + amountToPayInterest;

        // Atualizar o crédito
        credit.totalPaid = (credit.totalPaid || 0) + totalToPay;
        credit.remainingBalance = 0;
        credit.status = 'paid';
        credit.lastPaymentDate = now;

        // Adicionar ao histórico de auditoria
        credit.workflowHistory.push({
            stage: 'disbursement',
            action: 'liquidated_early',
            performedBy: req.user._id,
            timestamp: now,
            comment: `Liquidação antecipada efetuada. Capital pago: ${amountToPayCapital} MT. Juros perdoados: ${forgivenInterest} MT.`
        });

        const creditClient = await User.findById(credit.client);
        const clientName = creditClient ? creditClient.name : 'Cliente';

        // Registrar no Fluxo de Caixa separadamente (Capital)
        if (amountToPayCapital > 0) {
            await cashflowService.registerTransaction({
                institution: credit.institution,
                type: 'entrada',
                category: 'reembolso_emprestimo', // Capital recuperado
                amount: amountToPayCapital,
                description: `Liquidação antecipada (Capital) - ${clientName}`,
                reference: credit.loanNumber || credit._id.toString(),
                paymentMethod: 'dinheiro',
                createdBy: req.user._id,
                date: now
            });
        }

        // Registrar no Fluxo de Caixa separadamente (Juros Atrasados, se houver)
        if (amountToPayInterest > 0) {
            await cashflowService.registerTransaction({
                institution: credit.institution,
                type: 'entrada',
                category: 'juros', // Lucro
                amount: amountToPayInterest,
                description: `Liquidação antecipada (Juros Vencidos) - ${clientName}`,
                reference: credit.loanNumber || credit._id.toString(),
                paymentMethod: 'dinheiro',
                createdBy: req.user._id,
                date: now
            });
        }

        await credit.save();

        res.json({
            success: true,
            data: { credit }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao liquidar crédito', error: error.message });
    }
});
// @route   POST /api/credits/:id/collateral/:collateralId/photos
// @desc    Upload de foto para uma garantia específica
// @access  Private
router.post('/:id/collateral/:collateralId/photos', protect, authorize('admin', 'manager', 'owner', 'supervisor', 'agent', 'representative'), uploadCollateral.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Nenhuma imagem enviada.' });
        }

        const credit = await Credit.findOne({ _id: req.params.id, institution: req.institution });
        if (!credit) {
            return res.status(404).json({ success: false, message: 'Crédito não encontrado.' });
        }

        const collateralItem = credit.collateral.id(req.params.collateralId);
        if (!collateralItem) {
            return res.status(404).json({ success: false, message: 'Garantia não encontrada.' });
        }

        // Adiciona a foto no array
        const photoUrl = `/uploads/collateral/${req.file.filename}`;
        collateralItem.photos.push(photoUrl);

        await credit.save();

        res.json({
            success: true,
            message: 'Foto carregada com sucesso.',
            data: collateralItem
        });
    } catch (error) {
        console.error('Upload Collateral Photo Error:', error);
        res.status(500).json({ success: false, message: 'Erro ao carregar a foto.', error: error.message });
    }
});

// @route   POST /api/credits/upload-collateral-photo
// @desc    Upload de foto de garantia antes da criação do pedido
// @access  Private (Qualquer utilizador autenticado)
router.post('/upload-collateral-photo', protect, uploadCollateral.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Nenhuma imagem enviada.' });
        }

        const photoUrl = `/uploads/collateral/${req.file.filename}`;

        res.json({
            success: true,
            message: 'Foto de garantia enviada com sucesso.',
            photoUrl
        });
    } catch (error) {
        console.error('Upload Temp Collateral Photo Error:', error);
        res.status(500).json({ success: false, message: 'Erro ao carregar a foto.', error: error.message });
    }
});

export default router;
