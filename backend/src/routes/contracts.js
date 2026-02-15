import express from 'express';
import Contract from '../models/Contract.js';
import Credit from '../models/Credit.js';
import contractService from '../services/contractService.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/contracts/generate/:creditId
// @desc    Gerar contrato PDF para um crédito
// @access  Private (Manager/Owner)
router.post('/generate/:creditId', protect, authorize('manager', 'owner', 'super_admin'), async (req, res) => {
    try {
        const credit = await Credit.findById(req.params.creditId);

        if (!credit) {
            return res.status(404).json({
                success: false,
                message: 'Crédito não encontrado'
            });
        }

        // Verificar se já existe contrato
        let contract = await Contract.findOne({ credit: credit._id });

        // Gerar Buffer do PDF
        const pdfBuffer = await contractService.generateContractPDF(credit._id);
        const fileName = `contract-${credit._id}-${Date.now()}.pdf`;

        // Salvar localmente
        const fileUrl = await contractService.uploadToLocal(pdfBuffer, fileName);

        if (contract) {
            contract.fileUrl = fileUrl;
            contract.status = 'draft';
            await contract.save();
        } else {
            contract = await Contract.create({
                credit: credit._id,
                institution: credit.institution,
                client: credit.client,
                contractNumber: `CONT-${credit._id.toString().slice(-6).toUpperCase()}-${Date.now().toString().slice(-4)}`,
                fileUrl,
                status: 'draft'
            });
        }

        res.status(201).json({
            success: true,
            message: 'Contrato gerado com sucesso',
            data: { contract }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao gerar contrato',
            error: error.message
        });
    }
});

// @route   POST /api/contracts/:id/send-for-signature
// @desc    Enviar contrato para assinatura
// @access  Private (Manager/Owner)
router.post('/:id/send-for-signature', protect, authorize('manager', 'owner', 'super_admin'), async (req, res) => {
    try {
        const contract = await Contract.findById(req.params.id).populate('client');

        if (!contract) {
            return res.status(404).json({
                success: false,
                message: 'Contrato não encontrado'
            });
        }

        // Simular envio
        const signatureInfo = await contractService.sendForSignature(contract._id, contract.client.email);

        contract.status = 'pending_signature';
        contract.signatureId = signatureInfo.signatureId;
        contract.signatureUrl = signatureInfo.signatureUrl;
        contract.metadata = {
            ...contract.metadata,
            sentAt: new Date()
        };

        await contract.save();

        res.json({
            success: true,
            message: 'Contrato enviado para assinatura',
            data: {
                signatureUrl: contract.signatureUrl
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao enviar para assinatura',
            error: error.message
        });
    }
});

// @route   GET /api/contracts/credit/:creditId
// @desc    Obter contrato por crédito
// @access  Private
router.get('/credit/:creditId', protect, async (req, res) => {
    try {
        const contract = await Contract.findOne({ credit: req.params.creditId });

        if (!contract) {
            return res.status(404).json({
                success: false,
                message: 'Contrato não encontrado para este crédito'
            });
        }

        res.json({
            success: true,
            data: { contract }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao obter contrato',
            error: error.message
        });
    }
});

// @route   POST /api/contracts/webhook/signature
// @desc    Webhook para atualização de status de assinatura
// @access  Public
router.post('/webhook/signature', async (req, res) => {
    try {
        const { signatureId, status, signedAt } = req.body;

        const contract = await Contract.findOne({ signatureId });

        if (!contract) {
            return res.status(404).json({ success: false });
        }

        if (status === 'signed') {
            contract.status = 'signed';
            contract.signedAt = signedAt || new Date();
        } else if (status === 'declined') {
            contract.status = 'canceled';
        }

        await contract.save();

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

export default router;
