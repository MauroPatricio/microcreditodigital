/**
 * confidence.js
 * Rotas para cálculo e consulta de Nível de Confiança (Premium)
 */
import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import User from '../models/User.js';
import Credit from '../models/Credit.js';
import { calculateConfidence, getRiskRecommendation } from '../services/confidenceService.js';

const router = express.Router();

// @route   POST /api/confidence/calculate/:clientId
// @desc    Calcular nível de confiança de um cliente
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

        // Calcular Confiança
        const confidenceResult = await calculateConfidence(user, credits);
        const recommendation = getRiskRecommendation(confidenceResult);

        // Atualizar User
        user.riskProfile = {
            ...user.riskProfile,
            score: confidenceResult.score,
            confidenceLevel: confidenceResult.confidenceLevel,
            label: confidenceResult.label,
            lastCalculated: new Date(),
            metrics: confidenceResult.metrics
        };

        // Adicionar ao histórico
        user.riskProfile.history.push({
            score: confidenceResult.score,
            confidenceLevel: confidenceResult.confidenceLevel,
            date: new Date(),
            reason: req.body.reason || 'Manual Calculation'
        });

        await user.save();

        res.json({
            success: true,
            data: {
                score: confidenceResult.score,
                confidenceLevel: confidenceResult.confidenceLevel,
                label: confidenceResult.label,
                metrics: confidenceResult.metrics,
                recommendation
            }
        });

    } catch (error) {
        console.error('Erro ao calcular confiança:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// @route   GET /api/confidence/:clientId
// @desc    Obter nível de confiança e recomendação atual
// @access  Private (Manager/Owner/Agent)
router.get('/:clientId', protect, authorize('manager', 'owner', 'agent'), async (req, res) => {
    try {
        const user = await User.findById(req.params.clientId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Cliente não encontrado' });
        }

        const confidenceData = {
            score: user.riskProfile?.score || 500,
            confidenceLevel: user.riskProfile?.confidenceLevel || 3,
            label: user.riskProfile?.label || 'Moderado',
            metrics: user.riskProfile?.metrics || {},
            history: user.riskProfile?.history || []
        };

        const recommendation = getRiskRecommendation(confidenceData);

        res.json({
            success: true,
            data: {
                ...confidenceData,
                recommendation
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
