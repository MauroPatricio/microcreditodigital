import express from 'express';
import Commission from '../models/Commission.js';
import AgentTarget from '../models/AgentTarget.js';
import User from '../models/User.js';
import Credit from '../models/Credit.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/commissions
// @desc    Listar comissões
// @access  Private (Manager/Owner/Agent)
router.get('/', protect, async (req, res) => {
    try {
        const { agent, period, status, page = 1, limit = 20 } = req.query;

        let query = { institution: req.user.institution._id };

        // Se for agente, só pode ver suas próprias comissões
        if (req.user.role === 'agent') {
            query.agent = req.user._id;
        } else if (agent) {
            query.agent = agent;
        }

        if (period) query.period = period;
        if (status) query.status = status;

        const commissions = await Commission.find(query)
            .populate('agent', 'name email')
            .populate('credit', 'amount approvedAmount')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await Commission.countDocuments(query);

        res.json({
            success: true,
            data: {
                commissions,
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
            message: 'Erro ao listar comissões',
            error: error.message
        });
    }
});

// @route   GET /api/commissions/my-commissions
// @desc    Comissões do agente logado
// @access  Private (Agent)
router.get('/my-commissions', protect, authorize('agent'), async (req, res) => {
    try {
        const { period, status } = req.query;

        let query = {
            agent: req.user._id,
            institution: req.user.institution._id
        };

        if (period) query.period = period;
        if (status) query.status = status;

        const commissions = await Commission.find(query)
            .populate('credit', 'amount approvedAmount client')
            .populate({
                path: 'credit',
                populate: {
                    path: 'client',
                    select: 'name'
                }
            })
            .sort({ createdAt: -1 });

        // Calcular totais
        const totals = {
            pending: 0,
            approved: 0,
            paid: 0,
            total: 0
        };

        commissions.forEach(comm => {
            totals[comm.status] += comm.amount;
            totals.total += comm.amount;
        });

        res.json({
            success: true,
            data: {
                commissions,
                totals
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao obter comissões',
            error: error.message
        });
    }
});

// @route   GET /api/commissions/summary/:period
// @desc    Resumo de comissões por período
// @access  Private (Manager/Owner)
router.get('/summary/:period', protect, authorize('manager', 'owner', 'super_admin'), async (req, res) => {
    try {
        const { period } = req.params;

        const commissions = await Commission.find({
            institution: req.user.institution._id,
            period
        }).populate('agent', 'name email');

        // Agrupar por agente
        const byAgent = {};
        let totalPending = 0;
        let totalApproved = 0;
        let totalPaid = 0;

        commissions.forEach(comm => {
            const agentId = comm.agent._id.toString();

            if (!byAgent[agentId]) {
                byAgent[agentId] = {
                    agent: comm.agent,
                    pending: 0,
                    approved: 0,
                    paid: 0,
                    total: 0,
                    count: 0
                };
            }

            byAgent[agentId][comm.status] += comm.amount;
            byAgent[agentId].total += comm.amount;
            byAgent[agentId].count++;

            if (comm.status === 'pending') totalPending += comm.amount;
            if (comm.status === 'approved') totalApproved += comm.amount;
            if (comm.status === 'paid') totalPaid += comm.amount;
        });

        res.json({
            success: true,
            data: {
                period,
                byAgent: Object.values(byAgent),
                summary: {
                    pending: totalPending,
                    approved: totalApproved,
                    paid: totalPaid,
                    total: totalPending + totalApproved + totalPaid,
                    totalCommissions: commissions.length
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao obter resumo',
            error: error.message
        });
    }
});

// @route   POST /api/commissions/calculate/:period
// @desc    Calcular comissões do período
// @access  Private (Owner)
router.post('/calculate/:period', protect, authorize('owner', 'super_admin'), async (req, res) => {
    try {
        const { period } = req.params;
        const { rate = 2.5 } = req.body; // Default 2.5%

        // Buscar créditos aprovados no período
        const [year, month] = period.split('-');
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

        const credits = await Credit.find({
            institution: req.user.institution._id,
            status: { $in: ['approved', 'active', 'paid'] },
            approvedAt: { $gte: startDate, $lte: endDate }
        }).populate('client', 'registeredBy');

        let commissionsCreated = 0;
        let commissionsSkipped = 0;

        for (const credit of credits) {
            // Verificar se cliente tem agente registrador
            if (!credit.client.registeredBy) {
                commissionsSkipped++;
                continue;
            }

            // Verificar se comissão já existe
            const existingCommission = await Commission.findOne({
                credit: credit._id,
                commissionType: 'approval'
            });

            if (existingCommission) {
                commissionsSkipped++;
                continue;
            }

            // Criar comissão
            await Commission.create({
                agent: credit.client.registeredBy,
                institution: credit.institution,
                credit: credit._id,
                commissionType: 'approval',
                baseAmount: credit.approvedAmount,
                rate,
                amount: Commission.calculateCommission(credit.approvedAmount, rate),
                status: 'pending',
                period
            });

            commissionsCreated++;
        }

        res.json({
            success: true,
            message: `Cálculo de comissões concluído`,
            data: {
                period,
                creditsProcessed: credits.length,
                commissionsCreated,
                commissionsSkipped
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao calcular comissões',
            error: error.message
        });
    }
});

// @route   PUT /api/commissions/:id/approve
// @desc    Aprovar comissão
// @access  Private (Manager/Owner)
router.put('/:id/approve', protect, authorize('manager', 'owner', 'super_admin'), async (req, res) => {
    try {
        const commission = await Commission.findById(req.params.id);

        if (!commission) {
            return res.status(404).json({
                success: false,
                message: 'Comissão não encontrada'
            });
        }

        if (commission.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Apenas comissões pendentes podem ser aprovadas'
            });
        }

        commission.status = 'approved';
        commission.approvedAt = new Date();
        commission.approvedBy = req.user._id;

        await commission.save();

        res.json({
            success: true,
            message: 'Comissão aprovada com sucesso',
            data: { commission }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao aprovar comissão',
            error: error.message
        });
    }
});

// @route   PUT /api/commissions/:id/pay
// @desc    Marcar comissão como paga
// @access  Private (Owner)
router.put('/:id/pay', protect, authorize('owner', 'super_admin'), async (req, res) => {
    try {
        const commission = await Commission.findById(req.params.id);

        if (!commission) {
            return res.status(404).json({
                success: false,
                message: 'Comissão não encontrada'
            });
        }

        if (commission.status !== 'approved') {
            return res.status(400).json({
                success: false,
                message: 'Apenas comissões aprovadas podem ser pagas'
            });
        }

        commission.status = 'paid';
        commission.paidAt = new Date();
        commission.paidBy = req.user._id;

        await commission.save();

        res.json({
            success: true,
            message: 'Comissão marcada como paga',
            data: { commission }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao marcar comissão como paga',
            error: error.message
        });
    }
});

// @route   GET /api/commissions/agent/:agentId/performance
// @desc    Performance do agente
// @access  Private (Manager/Owner)
router.get('/agent/:agentId/performance', protect, authorize('manager', 'owner', 'super_admin'), async (req, res) => {
    try {
        const { agentId } = req.params;
        const { months = 6 } = req.query;

        const agent = await User.findById(agentId);

        if (!agent || agent.role !== 'agent') {
            return res.status(404).json({
                success: false,
                message: 'Agente não encontrado'
            });
        }

        // Clientes registrados pelo agente
        const clientsRegistered = await User.countDocuments({
            registeredBy: agentId,
            role: 'client',
            institution: req.user.institution._id
        });

        // Créditos aprovados de clientes do agente
        const clients = await User.find({
            registeredBy: agentId,
            role: 'client'
        }).select('_id');

        const clientIds = clients.map(c => c._id);

        const creditsApproved = await Credit.countDocuments({
            client: { $in: clientIds },
            status: { $in: ['approved', 'active', 'paid'] },
            institution: req.user.institution._id
        });

        const totalDisbursed = await Credit.aggregate([
            {
                $match: {
                    client: { $in: clientIds },
                    status: { $in: ['approved', 'active', 'paid'] },
                    institution: req.user.institution._id
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$approvedAmount' }
                }
            }
        ]);

        // Comissões
        const commissions = await Commission.find({
            agent: agentId,
            institution: req.user.institution._id
        });

        const commissionTotals = {
            pending: 0,
            approved: 0,
            paid: 0,
            total: 0
        };

        commissions.forEach(comm => {
            commissionTotals[comm.status] += comm.amount;
            commissionTotals.total += comm.amount;
        });

        // Evolution mensal
        const monthsAgo = new Date();
        monthsAgo.setMonth(monthsAgo.getMonth() - parseInt(months));

        const monthlyCommissions = await Commission.aggregate([
            {
                $match: {
                    agent: agent._id,
                    institution: req.user.institution._id,
                    createdAt: { $gte: monthsAgo }
                }
            },
            {
                $group: {
                    _id: '$period',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        res.json({
            success: true,
            data: {
                agent: {
                    id: agent._id,
                    name: agent.name,
                    email: agent.email
                },
                metrics: {
                    clientsRegistered,
                    creditsApproved,
                    totalDisbursed: totalDisbursed[0]?.total || 0
                },
                commissions: commissionTotals,
                monthlyEvolution: monthlyCommissions
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao obter performance',
            error: error.message
        });
    }
});

// @route   GET /api/commissions/targets/my-targets
// @desc    Metas do agente logado
// @access  Private (Agent)
router.get('/targets/my-targets', protect, authorize('agent'), async (req, res) => {
    try {
        const currentPeriod = new Date().toISOString().slice(0, 7);

        let target = await AgentTarget.findOne({
            agent: req.user._id,
            period: currentPeriod
        });

        if (!target) {
            // Criar target vazio se não existir
            target = await AgentTarget.create({
                agent: req.user._id,
                institution: req.user.institution._id,
                period: currentPeriod,
                targets: {
                    newClients: 10,
                    creditsApproved: 5,
                    totalDisbursed: 100000,
                    collectionRate: 90
                },
                achieved: {
                    newClients: 0,
                    creditsApproved: 0,
                    totalDisbursed: 0,
                    collectionRate: 0
                }
            });
        }

        const completionPercentage = target.getCompletionPercentage();
        const isAchieved = target.checkTargetsAchieved();

        res.json({
            success: true,
            data: {
                target,
                completionPercentage,
                isAchieved
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao obter metas',
            error: error.message
        });
    }
});

export default router;
