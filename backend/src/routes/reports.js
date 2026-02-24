import express from 'express';
import Credit from '../models/Credit.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import Institution from '../models/Institution.js';
import { protect } from '../middleware/auth.js';
import * as XLSX from 'xlsx';

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


// ============================================================
// RELATÓRIO MENSAL COMPLETO
// ============================================================
router.get('/monthly', async (req, res) => {
    try {
        const { month, year } = req.query;
        const now = new Date();
        const m = parseInt(month) || now.getMonth() + 1;
        const y = parseInt(year) || now.getFullYear();

        const startOfMonth = new Date(y, m - 1, 1);
        const endOfMonth = new Date(y, m, 0, 23, 59, 59, 999);
        const prevMonthStart = new Date(y, m - 2, 1);
        const prevMonthEnd = new Date(y, m - 1, 0, 23, 59, 59, 999);
        const institutionFilter = { institution: req.user.institution };

        // 1. Créditos concedidos no mês
        const creditosDoMes = await Credit.aggregate([
            { $match: { ...institutionFilter, createdAt: { $gte: startOfMonth, $lte: endOfMonth } } },
            { $group: { _id: null, total: { $sum: 1 }, valor: { $sum: '$amount' } } }
        ]);

        // 2. Créditos ativos
        const creditosAtivos = await Credit.aggregate([
            { $match: { ...institutionFilter, status: { $in: ['approved', 'active'] } } },
            { $group: { _id: null, total: { $sum: 1 }, valor: { $sum: '$amount' } } }
        ]);

        // 3. Créditos liquidados no mês
        const creditosLiquidados = await Credit.aggregate([
            {
                $match: {
                    ...institutionFilter,
                    status: 'liquidated',
                    updatedAt: { $gte: startOfMonth, $lte: endOfMonth }
                }
            },
            { $group: { _id: null, total: { $sum: 1 }, valor: { $sum: '$amount' } } }
        ]);

        // 4. Créditos em atraso
        const creditosEmAtraso = await Credit.aggregate([
            { $match: { ...institutionFilter, status: 'overdue' } },
            { $group: { _id: null, total: { $sum: 1 }, valor: { $sum: '$amount' } } }
        ]);

        // 5. Pagamentos recebidos no mês
        const pagamentosDoMes = await Payment.aggregate([
            {
                $match: {
                    status: 'completed',
                    createdAt: { $gte: startOfMonth, $lte: endOfMonth }
                }
            },
            {
                $lookup: { from: 'credits', localField: 'credit', foreignField: '_id', as: 'creditInfo' }
            },
            { $unwind: '$creditInfo' },
            { $match: { 'creditInfo.institution': req.user.institution } },
            {
                $group: {
                    _id: null,
                    totalArrecadado: { $sum: '$amount' },
                    totalJuros: { $sum: '$interestAmount' },
                    totalMultas: { $sum: '$penaltyAmount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // 6. Novos clientes no mês
        const novosClientes = await User.countDocuments({
            ...institutionFilter,
            role: 'client',
            createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        });

        // 7. Total de clientes ativos
        const totalClientes = await User.countDocuments({ ...institutionFilter, role: 'client', isActive: true });

        // 8. Clientes inadimplentes (têm crédito em atraso)
        const clientesInadimplentes = await Credit.distinct('client', {
            ...institutionFilter, status: 'overdue'
        });

        // 9. Melhores pagadores (maiores pagamentos no mês)
        const melhoresPagadores = await Payment.aggregate([
            {
                $match: {
                    status: 'completed',
                    createdAt: { $gte: startOfMonth, $lte: endOfMonth }
                }
            },
            {
                $lookup: { from: 'credits', localField: 'credit', foreignField: '_id', as: 'creditInfo' }
            },
            { $unwind: '$creditInfo' },
            { $match: { 'creditInfo.institution': req.user.institution } },
            {
                $lookup: { from: 'users', localField: 'creditInfo.client', foreignField: '_id', as: 'clientInfo' }
            },
            { $unwind: '$clientInfo' },
            {
                $group: {
                    _id: '$clientInfo._id',
                    nome: { $first: '$clientInfo.name' },
                    totalPago: { $sum: '$amount' },
                    numeroPagamentos: { $sum: 1 }
                }
            },
            { $sort: { totalPago: -1 } },
            { $limit: 10 }
        ]);

        // 10. Lucro bruto: juros + multas
        const lucroBruto =
            (pagamentosDoMes[0]?.totalJuros || 0) +
            (pagamentosDoMes[0]?.totalMultas || 0);

        res.json({
            success: true,
            data: {
                period: { month: m, year: y },
                creditosDoMes: { total: creditosDoMes[0]?.total || 0, valor: creditosDoMes[0]?.valor || 0 },
                creditosAtivos: { total: creditosAtivos[0]?.total || 0, valor: creditosAtivos[0]?.valor || 0 },
                creditosLiquidados: { total: creditosLiquidados[0]?.total || 0, valor: creditosLiquidados[0]?.valor || 0 },
                creditosEmAtraso: { total: creditosEmAtraso[0]?.total || 0, valor: creditosEmAtraso[0]?.valor || 0 },
                pagamentos: {
                    totalArrecadado: pagamentosDoMes[0]?.totalArrecadado || 0,
                    totalJuros: pagamentosDoMes[0]?.totalJuros || 0,
                    totalMultas: pagamentosDoMes[0]?.totalMultas || 0,
                    count: pagamentosDoMes[0]?.count || 0
                },
                clientes: { novos: novosClientes, total: totalClientes, inadimplentes: clientesInadimplentes.length },
                lucroBruto,
                taxaInadimplencia: creditosAtivos[0]?.total > 0
                    ? ((creditosEmAtraso[0]?.total || 0) / creditosAtivos[0].total * 100).toFixed(2)
                    : '0.00',
                melhoresPagadores
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao gerar relatório mensal', error: error.message });
    }
});

// ============================================================
// RELATÓRIO TRIMESTRAL
// ============================================================
router.get('/quarterly', async (req, res) => {
    try {
        const { quarter, year } = req.query;
        const now = new Date();
        const y = parseInt(year) || now.getFullYear();
        const q = parseInt(quarter) || Math.ceil((now.getMonth() + 1) / 3);

        // Month ranges for quarter
        const quarterMonths = {
            1: [1, 2, 3],
            2: [4, 5, 6],
            3: [7, 8, 9],
            4: [10, 11, 12]
        };
        const months = quarterMonths[q] || [1, 2, 3];
        const startOfQ = new Date(y, months[0] - 1, 1);
        const endOfQ = new Date(y, months[2], 0, 23, 59, 59, 999);

        // Previous quarter
        const prevQ = q === 1 ? 4 : q - 1;
        const prevY = q === 1 ? y - 1 : y;
        const prevMonths = quarterMonths[prevQ];
        const startOfPrevQ = new Date(prevY, prevMonths[0] - 1, 1);
        const endOfPrevQ = new Date(prevY, prevMonths[2], 0, 23, 59, 59, 999);

        const instFilter = { institution: req.user.institution };

        // Monthly breakdown within quarter
        const monthlyBreakdown = await Promise.all(months.map(async (mNum) => {
            const startM = new Date(y, mNum - 1, 1);
            const endM = new Date(y, mNum, 0, 23, 59, 59, 999);

            const credits = await Credit.aggregate([
                { $match: { ...instFilter, createdAt: { $gte: startM, $lte: endM } } },
                { $group: { _id: null, count: { $sum: 1 }, valor: { $sum: '$amount' } } }
            ]);
            const payments = await Payment.aggregate([
                { $match: { status: 'completed', createdAt: { $gte: startM, $lte: endM } } },
                {
                    $lookup: { from: 'credits', localField: 'credit', foreignField: '_id', as: 'ci' }
                },
                { $unwind: '$ci' },
                { $match: { 'ci.institution': req.user.institution } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            const overdue = await Credit.countDocuments({ ...instFilter, status: 'overdue', createdAt: { $lte: endM } });

            return {
                month: mNum,
                creditsConceded: credits[0]?.count || 0,
                volumeConceded: credits[0]?.valor || 0,
                collected: payments[0]?.total || 0,
                overdue
            };
        }));

        // Totals for quarter
        const qtCredits = await Credit.aggregate([
            { $match: { ...instFilter, createdAt: { $gte: startOfQ, $lte: endOfQ } } },
            { $group: { _id: null, count: { $sum: 1 }, valor: { $sum: '$amount' } } }
        ]);
        const qtPayments = await Payment.aggregate([
            { $match: { status: 'completed', createdAt: { $gte: startOfQ, $lte: endOfQ } } },
            {
                $lookup: { from: 'credits', localField: 'credit', foreignField: '_id', as: 'ci' }
            },
            { $unwind: '$ci' },
            { $match: { 'ci.institution': req.user.institution } },
            { $group: { _id: null, total: { $sum: '$amount' }, juros: { $sum: '$interestAmount' }, multas: { $sum: '$penaltyAmount' } } }
        ]);

        // Previous quarter totals for comparison
        const prevQCredits = await Credit.aggregate([
            { $match: { ...instFilter, createdAt: { $gte: startOfPrevQ, $lte: endOfPrevQ } } },
            { $group: { _id: null, count: { $sum: 1 }, valor: { $sum: '$amount' } } }
        ]);
        const prevQPayments = await Payment.aggregate([
            { $match: { status: 'completed', createdAt: { $gte: startOfPrevQ, $lte: endOfPrevQ } } },
            {
                $lookup: { from: 'credits', localField: 'credit', foreignField: '_id', as: 'ci' }
            },
            { $unwind: '$ci' },
            { $match: { 'ci.institution': req.user.institution } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        // Performance por agente
        const agentPerformance = await User.aggregate([
            { $match: { ...instFilter, role: 'agent' } },
            {
                $lookup: {
                    from: 'credits',
                    let: { agentId: '$_id' },
                    pipeline: [
                        {
                            $lookup: { from: 'users', localField: 'client', foreignField: '_id', as: 'clientInfo' }
                        },
                        { $unwind: '$clientInfo' },
                        {
                            $match: {
                                $expr: { $eq: ['$clientInfo.registeredBy', '$$agentId'] },
                                createdAt: { $gte: startOfQ, $lte: endOfQ }
                            }
                        }
                    ],
                    as: 'agentCredits'
                }
            },
            {
                $project: {
                    name: 1,
                    creditCount: { $size: '$agentCredits' },
                    totalVolume: { $sum: '$agentCredits.amount' }
                }
            },
            { $match: { creditCount: { $gt: 0 } } },
            { $sort: { totalVolume: -1 } }
        ]);

        // Performance por tipo de crédito
        const creditsByType = await Credit.aggregate([
            { $match: { ...instFilter, createdAt: { $gte: startOfQ, $lte: endOfQ } } },
            { $group: { _id: '$creditType', count: { $sum: 1 }, valor: { $sum: '$amount' } } }
        ]);

        const currentVolume = qtCredits[0]?.valor || 0;
        const prevVolume = prevQCredits[0]?.valor || 0;
        const crescimento = prevVolume > 0 ? (((currentVolume - prevVolume) / prevVolume) * 100).toFixed(2) : 'N/A';

        res.json({
            success: true,
            data: {
                period: { quarter: q, year: y },
                months,
                monthlyBreakdown,
                totals: {
                    creditsConceded: qtCredits[0]?.count || 0,
                    volumeConceded: qtCredits[0]?.valor || 0,
                    collected: qtPayments[0]?.total || 0,
                    juros: qtPayments[0]?.juros || 0,
                    multas: qtPayments[0]?.multas || 0
                },
                previousQuarter: {
                    quarter: prevQ, year: prevY,
                    creditsConceded: prevQCredits[0]?.count || 0,
                    volumeConceded: prevQCredits[0]?.valor || 0,
                    collected: prevQPayments[0]?.total || 0
                },
                crescimentoVolume: crescimento,
                agentPerformance,
                creditsByType
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao gerar relatório trimestral', error: error.message });
    }
});

// ============================================================
// RELATÓRIO FORMATO BDM (Banco de Moçambique)
// ============================================================
router.get('/bom', async (req, res) => {
    try {
        const { month, year } = req.query;
        const now = new Date();
        const m = parseInt(month) || now.getMonth() + 1;
        const y = parseInt(year) || now.getFullYear();
        const startOfMonth = new Date(y, m - 1, 1);
        const endOfMonth = new Date(y, m, 0, 23, 59, 59, 999);

        // Get institution info
        const institution = await Institution.findById(req.user.institution);

        // Get all credits with client info for the period
        const operations = await Credit.find({
            institution: req.user.institution,
            createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        })
            .populate('client', 'name phone address identityDocument')
            .sort({ createdAt: 1 });

        // For each credit, calculate overdue info
        const operationsWithDetails = await Promise.all(operations.map(async (credit, idx) => {
            const paidAmount = await Payment.aggregate([
                { $match: { credit: credit._id, status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            const paid = paidAmount[0]?.total || 0;
            const creditoEmDivida = Math.max(0, credit.amount - paid);

            // Overdue installments
            const overdueInstallments = (credit.installments || []).filter(
                i => i.status === 'overdue' && new Date(i.dueDate) < new Date()
            );
            const creditoEmAtraso = overdueInstallments.reduce((s, i) => s + (i.amount || 0), 0);
            const diasAtraso = overdueInstallments.length > 0
                ? Math.max(0, Math.floor((new Date() - new Date(Math.min(...overdueInstallments.map(i => new Date(i.dueDate))))) / (1000 * 60 * 60 * 24)))
                : 0;

            return {
                numero: idx + 1,
                nomeCliente: credit.client?.name || 'N/A',
                dataDesembolso: credit.disbursementDate || credit.createdAt,
                montanteDesembolso: credit.amount,
                finalidade: credit.creditType || 'consumo',
                valorPrestacao: credit.installmentAmount || (credit.amount / credit.termMonths),
                periodicidade: credit.paymentFrequency || 'mensal',
                prazoReembolso: credit.termMonths,
                taxaJuro: credit.interestRate,
                creditoEmDivida,
                creditoEmAtraso,
                diasAtraso,
                ppes: credit.isPPE ? 'Sim' : 'Não'
            };
        }));

        res.json({
            success: true,
            data: {
                period: { month: m, year: y, label: `${String(m).padStart(2, '0')}/${y}` },
                institution: {
                    name: institution?.name || '',
                    address: institution?.address || '',
                    province: institution?.province || 'MAPUTO',
                    phone: institution?.phone || '',
                    email: institution?.email || '',
                    workers: institution?.workers || 2,
                    startDate: institution?.createdAt,
                    manager: institution?.managerName || ''
                },
                operations: operationsWithDetails,
                totals: {
                    totalOperacoes: operationsWithDetails.length,
                    totalDesembolsado: operationsWithDetails.reduce((s, o) => s + o.montanteDesembolso, 0),
                    totalEmDivida: operationsWithDetails.reduce((s, o) => s + o.creditoEmDivida, 0),
                    totalEmAtraso: operationsWithDetails.reduce((s, o) => s + o.creditoEmAtraso, 0)
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao gerar relatório BdM', error: error.message });
    }
});

// ============================================================
// EXPORT EXCEL — RELATÓRIO MENSAL
// ============================================================
router.get('/monthly/excel', async (req, res) => {
    try {
        const { month, year } = req.query;
        const now = new Date();
        const m = parseInt(month) || now.getMonth() + 1;
        const y = parseInt(year) || now.getFullYear();
        const startOfMonth = new Date(y, m - 1, 1);
        const endOfMonth = new Date(y, m, 0, 23, 59, 59, 999);
        const instFilter = { institution: req.user.institution };

        const credits = await Credit.find({ ...instFilter, createdAt: { $gte: startOfMonth, $lte: endOfMonth } })
            .populate('client', 'name phone').sort({ createdAt: 1 });

        const payments = await Payment.find({ status: 'completed', createdAt: { $gte: startOfMonth, $lte: endOfMonth } })
            .populate({ path: 'credit', match: { institution: req.user.institution }, populate: { path: 'client', select: 'name' } })
            .sort({ createdAt: 1 });

        const institution = await Institution.findById(req.user.institution);
        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

        const wb = XLSX.utils.book_new();

        // Sheet 1: Resumo
        const resumoData = [
            [`RELATÓRIO MENSAL DE MICROCRÉDITO — ${monthNames[m - 1].toUpperCase()} ${y}`],
            [`Instituição: ${institution?.name || ''}`],
            [],
            ['RESUMO DO PERÍODO'],
            ['Indicador', 'Quantidade', 'Valor (MT)'],
            ['Créditos Concedidos no Mês', credits.length, credits.reduce((s, c) => s + c.amount, 0)],
            ['Pagamentos Recebidos', payments.length, payments.reduce((s, p) => s + p.amount, 0)],
        ];
        const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
        XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');

        // Sheet 2: Créditos
        const creditRows = [
            ['Nº', 'Cliente', 'Telefone', 'Tipo', 'Valor (MT)', 'Taxa Juro (%)', 'Prazo (meses)', 'Data', 'Estado']
        ];
        credits.forEach((c, i) => {
            creditRows.push([
                i + 1,
                c.client?.name || '',
                c.client?.phone || '',
                c.creditType || '',
                c.amount,
                c.interestRate,
                c.termMonths,
                new Date(c.createdAt).toLocaleDateString('pt-MZ'),
                c.status
            ]);
        });
        const wsCredits = XLSX.utils.aoa_to_sheet(creditRows);
        XLSX.utils.book_append_sheet(wb, wsCredits, 'Créditos');

        // Sheet 3: Pagamentos
        const payRows = [['Nº', 'Cliente', 'Valor (MT)', 'Método', 'Data']];
        payments.filter(p => p.credit).forEach((p, i) => {
            payRows.push([
                i + 1,
                p.credit?.client?.name || '',
                p.amount,
                p.paymentMethod || '',
                new Date(p.createdAt).toLocaleDateString('pt-MZ')
            ]);
        });
        const wsPay = XLSX.utils.aoa_to_sheet(payRows);
        XLSX.utils.book_append_sheet(wb, wsPay, 'Pagamentos');

        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Disposition', `attachment; filename="relatorio-mensal-${m}-${y}.xlsx"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buf);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao gerar Excel mensal', error: error.message });
    }
});

// ============================================================
// EXPORT EXCEL — RELATÓRIO BDM
// ============================================================
router.get('/bom/excel', async (req, res) => {
    try {
        const { month, year } = req.query;
        const now = new Date();
        const m = parseInt(month) || now.getMonth() + 1;
        const y = parseInt(year) || now.getFullYear();
        const startOfMonth = new Date(y, m - 1, 1);
        const endOfMonth = new Date(y, m, 0, 23, 59, 59, 999);

        const institution = await Institution.findById(req.user.institution);
        const credits = await Credit.find({
            institution: req.user.institution,
            createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        }).populate('client', 'name').sort({ createdAt: 1 });

        const wb = XLSX.utils.book_new();

        // Header sheet matching BdM format
        const headerData = [
            ['', 'BANCO DE MOÇAMBIQUE'],
            ['', 'DEPARTAMENTO DE SUPERVISÃO PRUDENCIAL'],
            ['', 'REPORTE PERIÓDICO DE INFORMAÇÕES DE'],
            ['', 'INSTITUIÇÕES SUJEITAS À MONITORIZAÇÃO'],
            [],
            [`PERÍODO DE REPORTE:`, `${String(m).padStart(2, '0')}/${y}`],
            [`DATA:`, new Date().toLocaleDateString('pt-MZ')],
            [],
            ['1. IDENTIFICAÇÃO DA INSTITUIÇÃO'],
            ['Denominação:', institution?.name || ''],
            ['Endereço:', institution?.address || ''],
            ['Província:', institution?.province || 'MAPUTO'],
            ['Telefone:', institution?.phone || ''],
            ['Fax:', '', 'E-mail:', institution?.email || ''],
            ['Nº de Trabalhadores:', institution?.workers || 2],
            ['Data de Início das Actividades:', institution?.createdAt ? new Date(institution.createdAt).toLocaleDateString('pt-MZ') : ''],
            ['Nome do Responsável pela Gestão da Instituição:', institution?.managerName || ''],
            []
        ];

        const ws = XLSX.utils.aoa_to_sheet(headerData);

        // Operations table header
        const tableHeaders = [
            'Nº da Operação (1)',
            'Nome do Cliente (2)',
            'Data de Desembolso (3)',
            'Montante do Desembolso (4)',
            'Finalidade do Crédito (5)',
            'Valor da Prestação (6)',
            'Periodicidade dos Pagamentos (7)',
            'Prazo de Reembolso (8)',
            'Taxa de Juro (9)',
            'Crédito em Dívida (10)',
            'Crédito em Atraso (11)',
            'Dias em Atraso (12)',
            'PPEs (13)'
        ];

        const startRow = headerData.length;
        XLSX.utils.sheet_add_aoa(ws, [tableHeaders], { origin: { r: startRow, c: 0 } });

        // Operations rows
        const rows = await Promise.all(credits.map(async (credit, idx) => {
            const paid = await Payment.aggregate([
                { $match: { credit: credit._id, status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            const paidAmt = paid[0]?.total || 0;
            const emDivida = Math.max(0, credit.amount - paidAmt);
            const overdueInst = (credit.installments || []).filter(i => i.status === 'overdue' && new Date(i.dueDate) < new Date());
            const emAtraso = overdueInst.reduce((s, i) => s + (i.amount || 0), 0);
            const diasAtraso = overdueInst.length > 0
                ? Math.floor((new Date() - new Date(Math.min(...overdueInst.map(i => new Date(i.dueDate))))) / (1000 * 60 * 60 * 24))
                : 0;

            return [
                idx + 1,
                credit.client?.name || '',
                credit.disbursementDate ? new Date(credit.disbursementDate).toLocaleDateString('pt-MZ') : new Date(credit.createdAt).toLocaleDateString('pt-MZ'),
                credit.amount,
                credit.creditType || 'consumo',
                credit.installmentAmount || (credit.amount / (credit.termMonths || 1)),
                credit.paymentFrequency || 'mensal',
                credit.termMonths || 0,
                `${credit.interestRate || 0}%`,
                emDivida,
                emAtraso,
                diasAtraso,
                credit.isPPE ? 'Sim' : 'Não'
            ];
        }));

        XLSX.utils.sheet_add_aoa(ws, rows, { origin: { r: startRow + 1, c: 0 } });

        // Totals row
        const totalRow = startRow + 1 + rows.length;
        XLSX.utils.sheet_add_aoa(ws, [
            ['', '', '', `Total: ${credits.reduce((s, c) => s + c.amount, 0).toLocaleString('pt-MZ')} MT`, '', '', '', '', '',
                `${credits.reduce((s, c) => s + Math.max(0, c.amount), 0).toLocaleString('pt-MZ')} MT`]
        ], { origin: { r: totalRow, c: 0 } });

        // Notes
        const notasRow = totalRow + 3;
        const notas = [
            ['Notas Explicativas:'],
            ['1- Número da operação de crédito'],
            ['2- Nome do cliente'],
            ['3- Data do desembolso inicial'],
            ['4- Valor do crédito concedido'],
            ['5- Finalidade do crédito desembolsado, designadamente para empresa, consumo ou habitação.'],
            ['6- Montante da prestação periódica para amortização do crédito'],
            ['7- Forma de pagamento, acordada, designadamente diário, semanal, mensal ou anual.'],
            ['8- Data de vencimento do crédito desembolsado'],
            ['9- Percentagem da taxa jura aplicada ao crédito'],
            ['10- Montante do crédito desembolsado que falta pagar, excluindo prestação em atraso.'],
            ['11- Montante da prestação em atraso incluindo capital e juros.'],
            ['12- Dias em atraso do pagamento da prestação.'],
            ['13- Crédito concedido por razão politicamente exposta.']
        ];
        XLSX.utils.sheet_add_aoa(ws, notas, { origin: { r: notasRow, c: 0 } });

        // Set column widths
        ws['!cols'] = [
            { wch: 12 }, { wch: 25 }, { wch: 18 }, { wch: 20 }, { wch: 20 },
            { wch: 16 }, { wch: 18 }, { wch: 16 }, { wch: 12 }, { wch: 18 },
            { wch: 18 }, { wch: 14 }, { wch: 10 }
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'Reporte BdM');

        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Disposition', `attachment; filename="reporte-bdm-${String(m).padStart(2, '0')}-${y}.xlsx"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buf);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao gerar Excel BdM', error: error.message });
    }
});

export default router;

