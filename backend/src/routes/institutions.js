import express from 'express';
import Institution from '../models/Institution.js';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/institutions
// @desc    Criar uma nova instituição (Apenas por super_admin ou via fluxo de registro de owner)
// @access  Private/SuperAdmin
router.post('/', protect, authorize('super_admin'), async (req, res) => {
    try {
        const { name, email, phone, nuit, address } = req.body;

        const institution = await Institution.create({
            name,
            email,
            phone,
            nuit,
            address,
            owner: req.user._id
        });

        res.status(201).json({
            success: true,
            data: institution
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao criar instituição',
            error: error.message
        });
    }
});

// @route   GET /api/institutions/my
// @desc    Obter detalhes da minha instituição
// @access  Private (Owner, Manager, Agent)
router.get('/my', protect, async (req, res) => {
    try {
        if (!req.user.institution) {
            return res.status(404).json({
                success: false,
                message: 'Instituição não encontrada para este usuário'
            });
        }

        const institution = await Institution.findById(req.user.institution._id)
            .populate('owner', 'name email');

        res.json({
            success: true,
            data: institution
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar instituição',
            error: error.message
        });
    }
});

// @route   PUT /api/institutions/my
// @desc    Atualizar minha instituição
// @access  Private (Owner)
router.put('/my', protect, authorize('owner'), async (req, res) => {
    try {
        const institution = await Institution.findByIdAndUpdate(
            req.user.institution._id,
            req.body,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            data: institution
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar instituição',
            error: error.message
        });
    }
});

export default router;
