/**
 * score.js
 * Rotas para cálculo e consulta de Score de Risco (Premium)
 */
import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import User from '../models/User.js';
import Credit from '../models/Credit.js';
import { calculateScore, getRiskRecommendation } from '../services/scoringService.js';

const router = express.Router();

// @route   POST /api/score/calculate/:clientId
// @desc    Calcular score de um cliente
// @access  Private (Manager/Owner/Agent)
router.post('/calculate/:clientId', protect, authorize('manager', 'owner', 'agent'), async (req, res) => {
    try {
        const { clientId } = req.params;

        const user = await User.findById(clientId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Cliente não encontrado' });
        }

        // Buscar histórico de créditos
        const credits = await Credit.find({ client: clientId });

        // Calcular Score
        const scoreResult = await calculateScore(user, credits);
        const recommendation = getRiskRecommendation(scoreResult);

        // Atualizar User
        user.creditScore = {
            ...user.creditScore,
            score: scoreResult.score,
            riskLevel: scoreResult.riskLevel,
            lastCalculated: new Date(),
            breakdown: scoreResult.breakdown
        };

        // Adicionar ao histórico
        user.creditScore.history.push({
            score: scoreResult.score,
            date: new Date(),
            reason: req.body.reason || 'Manual Calculation'
        });

        await user.save();

        res.json({
            success: true,
            data: {
                score: scoreResult.score,
                riskLevel: scoreResult.riskLevel,
                breakdown: scoreResult.breakdown,
                recommendation
            }
        });

    } catch (error) {
        console.error('Erro ao calcular score:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// @route   GET /api/score/:clientId
// @desc    Obter score e recomendação atual
// @access  Private (Manager/Owner/Agent)
router.get('/:clientId', protect, authorize('manager', 'owner', 'agent'), async (req, res) => {
    try {
        const user = await User.findById(req.params.clientId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Cliente não encontrado' });
        }

        const scoreData = {
            score: user.creditScore?.score || 0,
            riskLevel: user.creditScore?.riskLevel || 'medium',
            breakdown: user.creditScore?.breakdown || {},
            history: user.creditScore?.history || []
        };

        const recommendation = getRiskRecommendation(scoreData);

        res.json({
            success: true,
            data: {
                ...scoreData,
                recommendation
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
