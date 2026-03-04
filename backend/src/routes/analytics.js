import express from 'express';
import Credit from '../models/Credit.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import Installment from '../models/Installment.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/analytics/dashboard
// @desc    Métricas do dashboard
// @access  Private (Manager/Owner)
router.get('/dashboard', protect, authorize('manager', 'owner', 'super_admin'), async (req, res) => {
    try {
        const institutionId = req.user.institution._id;

        // Total de clientes
        const totalClients = await User.countDocuments({ role: 'client', institution: institutionId });
        const verifiedClients = await User.countDocuments({ role: 'client', isVerified: true, institution: institutionId });

        // Créditos ativos
        const activeCredits = await Credit.find({ status: 'active', institution: institutionId });
        const totalActiveAmount = activeCredits.reduce((sum, credit) => sum + credit.approvedAmount, 0);

        // Créditos em atraso
        const overdueInstallments = await Installment.find({
            status: 'overdue',
            institution: institutionId
        }).populate('credit');

        const overdueAmount = overdueInstallments.reduce((sum, inst) => sum + (inst.totalAmount - inst.paidAmount), 0);

        // Taxa de incumprimento
        const defaultedCredits = await Credit.countDocuments({ status: 'defaulted', institution: institutionId });
        const totalCredits = await Credit.countDocuments({ status: { $ne: 'pending' }, institution: institutionId });
        const defaultRate = totalCredits > 0 ? (defaultedCredits / totalCredits) * 100 : 0;

        // Receita total (juros recebidos)
        const allPayments = await Payment.find({ status: 'completed', institution: institutionId });
        const totalRevenue = allPayments.reduce((sum, payment) => sum + payment.amount, 0);

        // Créditos pendentes de aprovação
        const pendingCredits = await Credit.countDocuments({ status: 'pending', institution: institutionId });

        // Créditos do mês
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const creditsThisMonth = await Credit.countDocuments({
            institution: institutionId,
            createdAt: { $gte: startOfMonth },
            status: { $ne: 'rejected' }
        });

        const paymentsThisMonth = await Payment.find({
            institution: institutionId,
            createdAt: { $gte: startOfMonth },
            status: 'completed'
        });

        const revenueThisMonth = paymentsThisMonth.reduce((sum, payment) => sum + payment.amount, 0);

        // Calcular PAR (Portfolio At Risk)
        const totalActiveBalance = activeCredits.reduce((sum, credit) => sum + (credit.totalPayable - credit.totalPaid), 0);
        const par = totalActiveBalance > 0 ? (overdueAmount / totalActiveBalance) * 100 : 0;

        // Total recuperado (Global)
        const totalRecoveredRes = await Credit.aggregate([
            { $match: { institution: institutionId } },
            { $group: { _id: null, total: { $sum: "$totalPaid" } } }
        ]);
        const totalRecovered = totalRecoveredRes[0]?.total || 0;

        // Rendimento mensal de juros (estimado pelos pagamentos)
        // Nota: Idealmente os pagamentos teriam discriminado o que é juro. 
        // Aqui usamos uma aproximação baseada no total de juros proporcional
        const monthlyInterestIncome = paymentsThisMonth.reduce((sum, payment) => sum + (payment.amount * 0.2), 0); // Exemplo: 20% do pago é juro (ajustar conforme lógica real)

        // Performance por Agente
        const agentPerformance = await Credit.aggregate([
            { $match: { institution: institutionId, agent: { $exists: true } } },
            {
                $group: {
                    _id: "$agent",
                    activeLoans: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
                    totalAmount: { $sum: "$approvedAmount" },
                    totalPaid: { $sum: "$totalPaid" }
                }
            },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'agentInfo' } },
            { $unwind: "$agentInfo" },
            {
                $project: {
                    agentName: "$agentInfo.name",
                    activeLoans: 1,
                    totalAmount: 1,
                    recoveryRate: { $cond: [{ $gt: ["$totalAmount", 0] }, { $divide: ["$totalPaid", "$totalAmount"] }, 0] }
                }
            },
            { $sort: { recoveryRate: -1 } },
            { $limit: 5 }
        ]);

        res.json({
            success: true,
            data: {
                clients: {
                    total: totalClients,
                    verified: verifiedClients
                },
                portfolio: {
                    activeCredits: activeCredits.length,
                    totalActiveAmount: Math.round(totalActiveAmount * 100) / 100,
                    overdueCredits: overdueInstallments.length,
                    overdueAmount: Math.round(overdueAmount * 100) / 100,
                    par: Math.round(par * 100) / 100,
                    totalRecovered: Math.round(totalRecovered * 100) / 100
                },
                performance: {
                    defaultRate: Math.round(defaultRate * 100) / 100,
                    totalRevenue: Math.round(totalRevenue * 100) / 100,
                    pendingApprovals: pendingCredits,
                    agentPerformance
                },
                monthly: {
                    creditsIssued: creditsThisMonth,
                    revenue: Math.round(revenueThisMonth * 100) / 100,
                    interestIncome: Math.round(monthlyInterestIncome * 100) / 100
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao obter métricas',
            error: error.message
        });
    }
});

// @route   GET /api/analytics/portfolio
// @desc    Análise de carteira
// @access  Private (Manager/Owner)
router.get('/portfolio', protect, authorize('manager', 'owner', 'super_admin'), async (req, res) => {
    try {
        const credits = await Credit.find({
            institution: req.user.institution._id,
            status: { $in: ['active', 'paid', 'defaulted'] }
        });

        // Agrupar por status
        const byStatus = credits.reduce((acc, credit) => {
            acc[credit.status] = (acc[credit.status] || 0) + 1;
            return acc;
        }, {});

        // Agrupar por faixa de valor
        const byRange = {
            '1000-5000': 0,
            '5001-10000': 0,
            '10001-20000': 0,
            '20001+': 0
        };

        credits.forEach(credit => {
            const amount = credit.approvedAmount;
            if (amount <= 5000) byRange['1000-5000']++;
            else if (amount <= 10000) byRange['5001-10000']++;
            else if (amount <= 20000) byRange['10001-20000']++;
            else byRange['20001+']++;
        });

        res.json({
            success: true,
            data: {
                totalCredits: credits.length,
                byStatus,
                byRange
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao analisar carteira',
            error: error.message
        });
    }
});

// @route   GET /api/analytics/revenue
// @desc    Análise de receita
// @access  Private (Manager/Owner)
router.get('/revenue', protect, authorize('manager', 'owner', 'super_admin'), async (req, res) => {
    try {
        const { months = 6 } = req.query;

        const monthsAgo = new Date();
        monthsAgo.setMonth(monthsAgo.getMonth() - parseInt(months));

        const payments = await Payment.find({
            institution: req.user.institution._id,
            status: 'completed',
            createdAt: { $gte: monthsAgo }
        });

        // Agrupar por mês
        const revenueByMonth = {};

        payments.forEach(payment => {
            const month = payment.createdAt.toISOString().slice(0, 7);
            revenueByMonth[month] = (revenueByMonth[month] || 0) + payment.amount;
        });

        res.json({
            success: true,
            data: {
                revenueByMonth,
                totalRevenue: payments.reduce((sum, p) => sum + p.amount, 0)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao analisar receita',
            error: error.message
        });
    }
});

// @route   GET /api/analytics/global
// @desc    Métricas globais multi-instituição
// @access  Private (Owner/SuperAdmin)
router.get('/global', protect, authorize('owner', 'super_admin'), async (req, res) => {
    try {
        const Institution = (await import('../models/Institution.js')).default;

        // 1. Buscar todas as instituições do dono
        const institutions = await Institution.find({ owner: req.user._id });

        if (institutions.length === 0) {
            return res.json({
                success: true,
                data: {
                    aggregate: {
                        totalStartups: 0,
                        totalActiveLoans: 0,
                        totalActiveValue: 0,
                        totalRevenue: 0,
                        globalDefaultRate: 0
                    },
                    breakdown: []
                }
            });
        }

        const breakdown = [];
        let aggActiveLoans = 0;
        let aggActiveValue = 0;
        let aggRevenue = 0;
        let aggTotalCredits = 0;
        let aggDefaultedCredits = 0;

        // 2. Iterar e calcular métricas para cada uma
        // (Poderia ser otimizado com aggregation framework, mas loop é ok para < 50 filiais)
        for (const inst of institutions) {
            const instId = inst._id;

            // Créditos Ativos
            const activeCredits = await Credit.find({ status: 'active', institution: instId });
            const activeValue = activeCredits.reduce((sum, c) => sum + c.approvedAmount, 0);

            // Receita
            const payments = await Payment.find({ status: 'completed', institution: instId });
            const revenue = payments.reduce((sum, p) => sum + p.amount, 0);

            // Inadimplência
            const defaultedCount = await Credit.countDocuments({ status: 'defaulted', institution: instId });
            const totalCount = await Credit.countDocuments({ status: { $ne: 'pending' }, institution: instId });
            const defaultRate = totalCount > 0 ? (defaultedCount / totalCount) * 100 : 0;

            // Clientes
            const clientCount = await User.countDocuments({ role: 'client', institution: instId });

            breakdown.push({
                id: instId,
                name: inst.name,
                activeLoans: activeCredits.length,
                activeValue,
                revenue,
                defaultRate,
                clients: clientCount
            });

            // Agregação
            aggActiveLoans += activeCredits.length;
            aggActiveValue += activeValue;
            aggRevenue += revenue;
            aggTotalCredits += totalCount;
            aggDefaultedCredits += defaultedCount;
        }

        const globalDefaultRate = aggTotalCredits > 0 ? (aggDefaultedCredits / aggTotalCredits) * 100 : 0;

        res.json({
            success: true,
            data: {
                aggregate: {
                    totalBranches: institutions.length,
                    totalActiveLoans: aggActiveLoans,
                    totalActiveValue: Math.round(aggActiveValue * 100) / 100,
                    totalRevenue: Math.round(aggRevenue * 100) / 100,
                    globalDefaultRate: Math.round(globalDefaultRate * 100) / 100
                },
                breakdown: breakdown.sort((a, b) => b.revenue - a.revenue) // Ordenar por receita
            }
        });

    } catch (error) {
        console.error('Global Analytics Error:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao obter métricas globais',
            error: error.message
        });
    }
});

export default router;
