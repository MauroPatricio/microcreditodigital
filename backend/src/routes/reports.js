import express from 'express';
import Credit from '../models/Credit.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Aplicar proteção a todas as rotas
router.use(protect);

// @route   GET /api/reports/credit-performance
// @desc    Relatório de performance de créditos
// @access  Private (Owner/Admin)
router.get('/credit-performance', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const match = { institution: req.user.institution };
        if (startDate && endDate) {
            match.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        // Total de créditos por status
        const creditsByStatus = await Credit.aggregate([
            { $match: match },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        // Volume total e médio
        const volumeStats = await Credit.aggregate([
            { $match: match },
            {
                $group: {
                    _id: null,
                    totalCredits: { $sum: 1 },
                    totalAmount: { $sum: '$amount' },
                    avgAmount: { $avg: '$amount' }
                }
            }
        ]);

        // Créditos por mês (últimos 6 meses)
        const creditsByMonth = await Credit.aggregate([
            { $match: match },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 },
                    amount: { $sum: '$amount' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
            { $limit: 6 }
        ]);

        res.json({
            success: true,
            data: {
                byStatus: creditsByStatus,
                volume: volumeStats[0] || { totalCredits: 0, totalAmount: 0, avgAmount: 0 },
                timeline: creditsByMonth
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao gerar relatório de performance',
            error: error.message
        });
    }
});

// @route   GET /api/reports/default-analysis
// @desc    Análise de inadimplência
// @access  Private (Owner/Admin)
router.get('/default-analysis', async (req, res) => {
    try {
        const match = { institution: req.user.institution };

        // Créditos com parcelas vencidas
        const overdueCredits = await Credit.aggregate([
            { $match: { ...match, status: 'approved' } },
            { $unwind: '$installments' },
            {
                $match: {
                    'installments.dueDate': { $lt: new Date() },
                    'installments.status': { $in: ['pending', 'overdue'] }
                }
            },
            {
                $group: {
                    _id: '$_id',
                    clientName: { $first: '$clientName' },
                    totalOverdue: { $sum: '$installments.amount' },
                    overdueCount: { $sum: 1 },
                    daysOverdue: {
                        $max: {
                            $dateDiff: {
                                startDate: '$installments.dueDate',
                                endDate: new Date(),
                                unit: 'day'
                            }
                        }
                    }
                }
            }
        ]);

        // Taxa de inadimplência
        const totalCredits = await Credit.countDocuments({ ...match, status: 'approved' });
        const defaultRate = totalCredits > 0 ? (overdueCredits.length / totalCredits) * 100 : 0;

        // Total em atraso
        const totalOverdueAmount = overdueCredits.reduce((sum, credit) => sum + credit.totalOverdue, 0);

        // Distribuição por dias de atraso
        const overdueDistribution = {
            '0-30': overdueCredits.filter(c => c.daysOverdue <= 30).length,
            '31-60': overdueCredits.filter(c => c.daysOverdue > 30 && c.daysOverdue <= 60).length,
            '61-90': overdueCredits.filter(c => c.daysOverdue > 60 && c.daysOverdue <= 90).length,
            '90+': overdueCredits.filter(c => c.daysOverdue > 90).length
        };

        res.json({
            success: true,
            data: {
                defaultRate: defaultRate.toFixed(2),
                totalOverdueAmount,
                overdueCredits: overdueCredits.slice(0, 10), // Top 10
                distribution: overdueDistribution
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao gerar análise de inadimplência',
            error: error.message
        });
    }
});

// @route   GET /api/reports/financial-summary
// @desc    Resumo financeiro
// @access  Private (Owner/Admin)
router.get('/financial-summary', async (req, res) => {
    try {
        const match = { institution: req.user.institution };

        // Total emprestado
        const totalLent = await Credit.aggregate([
            { $match: { ...match, status: 'approved' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        // Total recebido (pagamentos)
        const totalReceived = await Payment.aggregate([
            { $match: { status: 'completed' } },
            {
                $lookup: {
                    from: 'credits',
                    localField: 'credit',
                    foreignField: '_id',
                    as: 'creditInfo'
                }
            },
            { $unwind: '$creditInfo' },
            { $match: { 'creditInfo.institution': req.user.institution } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        // Receita de juros
        const interestRevenue = await Credit.aggregate([
            { $match: { ...match, status: 'approved' } },
            {
                $group: {
                    _id: null,
                    totalInterest: {
                        $sum: { $multiply: ['$amount', { $divide: ['$interestRate', 100] }] }
                    }
                }
            }
        ]);

        // Distribuição por método de pagamento
        const paymentMethods = await Payment.aggregate([
            { $match: { status: 'completed' } },
            {
                $lookup: {
                    from: 'credits',
                    localField: 'credit',
                    foreignField: '_id',
                    as: 'creditInfo'
                }
            },
            { $unwind: '$creditInfo' },
            { $match: { 'creditInfo.institution': req.user.institution } },
            {
                $group: {
                    _id: '$paymentMethod',
                    count: { $sum: 1 },
                    amount: { $sum: '$amount' }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                totalLent: totalLent[0]?.total || 0,
                totalReceived: totalReceived[0]?.total || 0,
                interestRevenue: interestRevenue[0]?.totalInterest || 0,
                paymentMethods
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao gerar resumo financeiro',
            error: error.message
        });
    }
});

// @route   GET /api/reports/client-statistics
// @desc    Estatísticas de clientes
// @access  Private (Owner/Admin)
router.get('/client-statistics', async (req, res) => {
    try {
        const match = { institution: req.user.institution };

        // Total de clientes
        const totalClients = await User.countDocuments({ ...match, role: 'client' });

        // Novos clientes (último mês)
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const newClients = await User.countDocuments({
            ...match,
            role: 'client',
            createdAt: { $gte: lastMonth }
        });

        // Clientes com créditos ativos
        const activeClients = await Credit.distinct('client', {
            ...match,
            status: 'approved'
        });

        // Distribuição por score de crédito
        const scoreDistribution = await User.aggregate([
            { $match: { ...match, role: 'client' } },
            {
                $bucket: {
                    groupBy: '$creditScore',
                    boundaries: [0, 300, 500, 700, 850],
                    default: 'outros',
                    output: { count: { $sum: 1 } }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                totalClients,
                newClients,
                activeClients: activeClients.length,
                scoreDistribution
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao gerar estatísticas de clientes',
            error: error.message
        });
    }
});

// @route   GET /api/reports/approval-metrics
// @desc    Métricas de aprovação
// @access  Private (Owner/Admin)
router.get('/approval-metrics', async (req, res) => {
    try {
        const match = { institution: req.user.institution };

        // Total de solicitações
        const totalRequests = await Credit.countDocuments(match);

        // Status das solicitações
        const statusCount = await Credit.aggregate([
            { $match: match },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Taxa de aprovação
        const approved = statusCount.find(s => s._id === 'approved')?.count || 0;
        const rejected = statusCount.find(s => s._id === 'rejected')?.count || 0;
        const approvalRate = totalRequests > 0 ? (approved / totalRequests) * 100 : 0;

        // Tempo médio de análise
        const avgAnalysisTime = await Credit.aggregate([
            { $match: { ...match, status: { $in: ['approved', 'rejected'] } } },
            {
                $project: {
                    analysisTime: {
                        $subtract: ['$updatedAt', '$createdAt']
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    avgTime: { $avg: '$analysisTime' }
                }
            }
        ]);

        const avgTimeInHours = avgAnalysisTime[0]?.avgTime
            ? Math.round(avgAnalysisTime[0].avgTime / (1000 * 60 * 60))
            : 0;

        res.json({
            success: true,
            data: {
                totalRequests,
                approvalRate: approvalRate.toFixed(2),
                rejectionRate: ((rejected / totalRequests) * 100).toFixed(2),
                avgAnalysisTime: avgTimeInHours,
                statusBreakdown: statusCount
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao gerar métricas de aprovação',
            error: error.message
        });
    }
});

// @route   GET /api/reports/onboarding-funnel
// @desc    Funil de conversão de onboarding
// @access  Private (Owner/Admin)
router.get('/onboarding-funnel', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const match = { institution: req.user.institution };
        if (startDate && endDate) {
            match.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        // Etapa 1: Registros Totais
        const totalRegistrations = await User.countDocuments({ ...match, role: 'client' });

        // Etapa 2: Clientes com Documentos (ex: BI preenchido)
        const withDocs = await User.countDocuments({
            ...match,
            role: 'client',
            identityDocument: { $exists: true, $ne: '' }
        });

        // Etapa 3: Clientes com Solicitação de Crédito
        const withCreditRequest = await Credit.distinct('client', match);

        // Etapa 4: Créditos Aprovados
        const approvedCredits = await Credit.countDocuments({ ...match, status: 'approved' });

        // Etapa 5: Créditos Ativos (Desembolsados)
        const disbursedCredits = await Credit.countDocuments({ ...match, status: 'active' });

        res.json({
            success: true,
            data: {
                steps: [
                    { name: 'Cadastros', count: totalRegistrations },
                    { name: 'Documentação', count: withDocs },
                    { name: 'Solicitações', count: withCreditRequest.length },
                    { name: 'Aprovações', count: approvedCredits },
                    { name: 'Desembolsos', count: disbursedCredits }
                ]
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao gerar funil de onboarding',
            error: error.message
        });
    }
});

// @route   GET /api/reports/agent-performance
// @desc    Performance de agentes (onboarding e créditos)
// @access  Private (Owner/Admin)
router.get('/agent-performance', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const match = { institution: req.user.institution };
        if (startDate && endDate) {
            match.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        // Performance por Agente (Registros e Créditos)
        const agentStats = await User.aggregate([
            { $match: { ...match, role: 'agent' } },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: 'registeredBy',
                    as: 'clients'
                }
            },
            {
                $project: {
                    name: 1,
                    clientCount: { $size: '$clients' },
                    agentId: '$_id'
                }
            },
            {
                $lookup: {
                    from: 'credits',
                    localField: 'agentId',
                    foreignField: 'performedBy', // Ou via client registeredBy se o agente não for o que criou o crédito
                    as: 'credits'
                }
            },
            // Como créditos são associados ao cliente, vamos buscar créditos dos clientes registrados pelo agente
            {
                $lookup: {
                    from: 'credits',
                    let: { agentId: '$_id' },
                    pipeline: [
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'client',
                                foreignField: '_id',
                                as: 'clientInfo'
                            }
                        },
                        { $unwind: '$clientInfo' },
                        { $match: { $expr: { $eq: ['$clientInfo.registeredBy', '$$agentId'] } } }
                    ],
                    as: 'agentCredits'
                }
            },
            {
                $project: {
                    name: 1,
                    clientCount: 1,
                    creditCount: { $size: '$agentCredits' },
                    totalVolume: { $sum: '$agentCredits.amount' }
                }
            },
            { $sort: { creditCount: -1 } }
        ]);

        res.json({
            success: true,
            data: agentStats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao gerar performance de agentes',
            error: error.message
        });
    }
});

export default router;
