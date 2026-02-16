import express from 'express';
import Document from '../models/Document.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { protect, authorize } from '../middleware/auth.js';
import { auditAction } from '../middleware/auditMiddleware.js';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// @route   GET /api/documents/pending
// @desc    Listar documentos aguardando validação
router.get('/pending', protect, authorize('manager', 'owner', 'super_admin'), async (req, res) => {
    try {
        const documents = await Document.find({
            institution: req.user.institution._id,
            isVerified: false,
            rejectionReason: { $exists: false }
        }).populate('client', 'name email phone identityDocument');

        res.json({ success: true, data: documents });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   PUT /api/documents/:id/verify
// @desc    Aprovar ou rejeitar documento
router.put('/:id/verify', protect, authorize('manager', 'owner', 'super_admin'), auditAction('Document', 'verify', 'medium'), async (req, res) => {
    try {
        const { status, reason, notes } = req.body; // status: 'approved' | 'rejected'
        const isApproved = status === 'approved';

        const document = await Document.findById(req.params.id).populate('client');
        if (!document) {
            return res.status(404).json({ success: false, message: 'Documento não encontrado' });
        }

        document.isVerified = isApproved;
        document.verifiedBy = req.user._id;
        document.verifiedAt = new Date();
        document.rejectionReason = isApproved ? null : reason;
        document.notes = notes;

        await document.save();

        // Notificar o cliente
        await Notification.create({
            user: document.client._id,
            institution: document.institution,
            type: 'document_update',
            title: isApproved ? 'Documento Aprovado' : 'Documento Rejeitado',
            message: isApproved
                ? `Seu documento (${document.type}) foi validado com sucesso.`
                : `Seu documento (${document.type}) foi rejeitado. Motivo: ${reason}`,
            metadata: { documentId: document._id, type: document.type }
        });

        res.json({ success: true, message: `Documento ${isApproved ? 'aprovado' : 'rejeitado'} com sucesso`, data: document });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/documents/:id/download
// @desc    Download seguro de documento
router.get('/:id/download', protect, async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);
        if (!document) {
            return res.status(404).json({ success: false, message: 'Documento não encontrado' });
        }

        // Verificar permissão
        const isStaff = ['owner', 'manager', 'agent', 'super_admin'].includes(req.user.role);
        const isOwnerOfDoc = document.client.toString() === req.user._id.toString();

        if (!isStaff && !isOwnerOfDoc) {
            return res.status(403).json({ success: false, message: 'Sem permissão para baixar este arquivo' });
        }

        const filePath = path.resolve(document.fileUrl);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: 'Arquivo físico não encontrado no servidor' });
        }

        res.download(filePath, document.fileName);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
