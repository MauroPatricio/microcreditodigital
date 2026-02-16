import express from 'express';
import ContractTemplate from '../models/ContractTemplate.js';
import { protect, authorize } from '../middleware/auth.js';
import { auditAction } from '../middleware/auditMiddleware.js';

const router = express.Router();

// @route   GET /api/contract-templates
// @desc    Listar templates de contrato da instituição ativa
router.get('/', protect, authorize('owner', 'manager', 'super_admin'), async (req, res) => {
    try {
        const templates = await ContractTemplate.find({ institution: req.institutionId });
        res.json({ success: true, data: templates });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/contract-templates
// @desc    Criar novo template de contrato
router.post('/', protect, authorize('owner', 'super_admin'), auditAction('ContractTemplate', 'create', 'medium'), async (req, res) => {
    try {
        const template = await ContractTemplate.create({
            ...req.body,
            institution: req.institutionId
        });
        res.status(201).json({ success: true, data: template });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   PUT /api/contract-templates/:id
// @desc    Atualizar template de contrato
router.put('/:id', protect, authorize('owner', 'super_admin'), auditAction('ContractTemplate', 'update', 'low'), async (req, res) => {
    try {
        const template = await ContractTemplate.findOneAndUpdate(
            { _id: req.params.id, institution: req.institutionId },
            req.body,
            { new: true }
        );
        res.json({ success: true, data: template });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
