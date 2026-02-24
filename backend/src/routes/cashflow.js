import express from 'express';
import CashTransaction from '../models/CashTransaction.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

// @route   GET /api/cashflow/summary
// @desc    Resumo financeiro do mês (saldo inicial, entradas, saídas, saldo final)
router.get('/summary', async (req, res) => {
    try {
        const { month, year } = req.query;
        const now = new Date();
        const m = parseInt(month) || now.getMonth() + 1;
        const y = parseInt(year) || now.getFullYear();

        const startOfMonth = new Date(y, m - 1, 1);
        const endOfMonth = new Date(y, m, 0, 23, 59, 59, 999);

        // Saldo inicial = soma de todas as entradas - todas as saídas ANTES do mês
        const beforeMonth = await CashTransaction.aggregate([
            { $match: { institution: req.user.institution, date: { $lt: startOfMonth } } },
            {
                $group: {
                    _id: null,
                    entradas: {
                        $sum: { $cond: [{ $eq: ['$type', 'entrada'] }, '$amount', 0] }
                    },
                    saidas: {
                        $sum: { $cond: [{ $eq: ['$type', 'saida'] }, '$amount', 0] }
                    }
                }
            }
        ]);
        const saldoInicial = (beforeMonth[0]?.entradas || 0) - (beforeMonth[0]?.saidas || 0);

        // Transações do mês
        const monthTx = await CashTransaction.aggregate([
            { $match: { institution: req.user.institution, date: { $gte: startOfMonth, $lte: endOfMonth } } },
            {
                $group: {
                    _id: null,
                    totalEntradas: {
                        $sum: { $cond: [{ $eq: ['$type', 'entrada'] }, '$amount', 0] }
                    },
                    totalSaidas: {
                        $sum: { $cond: [{ $eq: ['$type', 'saida'] }, '$amount', 0] }
                    }
                }
            }
        ]);

        const totalEntradas = monthTx[0]?.totalEntradas || 0;
        const totalSaidas = monthTx[0]?.totalSaidas || 0;
        const saldoFinal = saldoInicial + totalEntradas - totalSaidas;

        // Entradas por categoria
        const entradasByCategory = await CashTransaction.aggregate([
            {
                $match: {
                    institution: req.user.institution,
                    type: 'entrada',
                    date: { $gte: startOfMonth, $lte: endOfMonth }
                }
            },
            { $group: { _id: '$category', amount: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]);

        // Saídas por categoria
        const saidasByCategory = await CashTransaction.aggregate([
            {
                $match: {
                    institution: req.user.institution,
                    type: 'saida',
                    date: { $gte: startOfMonth, $lte: endOfMonth }
                }
            },
            { $group: { _id: '$category', amount: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            data: {
                period: { month: m, year: y },
                saldoInicial,
                totalEntradas,
                totalSaidas,
                saldoFinal,
                entradasByCategory,
                saidasByCategory
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao calcular resumo de caixa', error: error.message });
    }
});

// @route   GET /api/cashflow/transactions
// @desc    Listar transações com filtros
router.get('/transactions', async (req, res) => {
    try {
        const { page = 1, limit = 30, type, category, startDate, endDate } = req.query;
        const query = { institution: req.user.institution };

        if (type) query.type = type;
        if (category) query.category = category;
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate + 'T23:59:59');
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [transactions, total] = await Promise.all([
            CashTransaction.find(query)
                .sort({ date: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate('createdBy', 'name'),
            CashTransaction.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: { transactions, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao listar transações', error: error.message });
    }
});

// @route   POST /api/cashflow/transaction
// @desc    Registar nova transação (entrada/saída manual)
router.post('/transaction', async (req, res) => {
    try {
        const { type, category, amount, description, paymentMethod, date, reference } = req.body;

        if (!type || !category || !amount) {
            return res.status(400).json({ success: false, message: 'Tipo, categoria e montante são obrigatórios' });
        }

        const tx = await CashTransaction.create({
            institution: req.user.institution,
            type,
            category,
            amount: parseFloat(amount),
            description,
            paymentMethod,
            date: date ? new Date(date) : new Date(),
            reference,
            createdBy: req.user._id
        });

        res.status(201).json({ success: true, data: tx });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao registar transação', error: error.message });
    }
});

// @route   PUT /api/cashflow/transaction/:id
// @desc    Editar transação
router.put('/transaction/:id', async (req, res) => {
    try {
        const tx = await CashTransaction.findOneAndUpdate(
            { _id: req.params.id, institution: req.user.institution },
            req.body,
            { new: true, runValidators: true }
        );
        if (!tx) return res.status(404).json({ success: false, message: 'Transação não encontrada' });
        res.json({ success: true, data: tx });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao editar transação', error: error.message });
    }
});

// @route   DELETE /api/cashflow/transaction/:id
// @desc    Eliminar transação
router.delete('/transaction/:id', async (req, res) => {
    try {
        const tx = await CashTransaction.findOneAndDelete({ _id: req.params.id, institution: req.user.institution });
        if (!tx) return res.status(404).json({ success: false, message: 'Transação não encontrada' });
        res.json({ success: true, message: 'Transação eliminada' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao eliminar transação', error: error.message });
    }
});

// @route   GET /api/cashflow/daily-balance
// @desc    Saldo diário para gráficos
router.get('/daily-balance', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const now = new Date();
        const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
        const end = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const txs = await CashTransaction.aggregate([
            {
                $match: {
                    institution: req.user.institution,
                    date: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$date' },
                        month: { $month: '$date' },
                        day: { $dayOfMonth: '$date' }
                    },
                    entradas: { $sum: { $cond: [{ $eq: ['$type', 'entrada'] }, '$amount', 0] } },
                    saidas: { $sum: { $cond: [{ $eq: ['$type', 'saida'] }, '$amount', 0] } }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);

        res.json({ success: true, data: txs });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao calcular saldo diário', error: error.message });
    }
});

export default router;
