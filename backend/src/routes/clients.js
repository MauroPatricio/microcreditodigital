import express from 'express';
import User from '../models/User.js';
import Document from '../models/Document.js';
import Credit from '../models/Credit.js';
import Notification from '../models/Notification.js';
import { protect, authorize } from '../middleware/auth.js';
import { auditAction } from '../middleware/auditMiddleware.js';
import { clientValidation, validate } from '../middleware/validation.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Configurar multer para upload de documentos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, process.env.UPLOAD_PATH || './uploads/documents');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'doc-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 // 5MB
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Apenas arquivos JPEG, PNG e PDF são permitidos'));
        }
    }
});

// @route   POST /api/clients
// @desc    Registar novo cliente (pelo Agente/Manager)
// @access  Private (Agent, Manager, Owner)
router.post('/', protect, authorize('agent', 'manager', 'owner', 'super_admin'), auditAction('User', 'create_client', 'medium'), clientValidation, validate, async (req, res) => {
    try {
        const {
            name, email, phone, password, identityDocument,
            dateOfBirth, address, nuit
        } = req.body;

        // Limpar campos opcionais para evitar conflitos de string vazia em índices únicos (sparse)
        const cleanEmail = email && email.trim() !== '' ? email.trim().toLowerCase() : undefined;
        const cleanNuit = nuit && nuit.trim() !== '' ? nuit.trim().toLowerCase() : undefined;

        // Verificar se usuário já existe (Global para Phone/Email, Instituição para BI/NUIT)
        const existingMatch = await User.findOne({
            $or: [
                { phone },
                ...(cleanEmail ? [{ email: cleanEmail }] : []),
                { identityDocument, institution: req.institutionId },
                ...(cleanNuit ? [{ nuit: cleanNuit, institution: req.institutionId }] : [])
            ]
        });

        if (existingMatch) {
            let field = 'Telefone ou BI';
            if (existingMatch.phone === phone) field = 'Telefone';
            else if (cleanEmail && existingMatch.email === cleanEmail) field = 'Email';
            else if (existingMatch.identityDocument === identityDocument) field = 'Número do BI';
            else if (cleanNuit && existingMatch.nuit === cleanNuit) field = 'NUIT';

            return res.status(400).json({
                success: false,
                message: `${field} já está em uso.`
            });
        }

        if (!req.institutionId) {
            return res.status(400).json({
                success: false,
                message: 'Usuário logado não possui uma instituição associada.'
            });
        }

        const client = new User({
            name,
            email: cleanEmail,
            nuit: cleanNuit,
            phone,
            password: password || '123456', // Senha padrão para ser alterada
            identityDocument,
            dateOfBirth,
            address,
            role: 'client',
            institution: req.institutionId,
            registeredBy: req.user.role === 'agent' ? req.user._id : null,
            isVerified: false
        });

        await client.save();

        console.log(`Client registered: ${client._id} by user ${req.user._id} in institution ${req.institutionId}`); // Added logging

        res.status(201).json({
            success: true,
            message: 'Cliente registrado com sucesso',
            data: {
                client: client.toJSON()
            }
        });
    } catch (error) {
        console.error("ERRO CRÍTICO NO REGISTER_CLIENT:", error);
        res.status(500).json({
            success: false,
            message: 'Erro ao registrar cliente',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// @route   GET /api/clients
// @desc    Listar clientes
// @access  Private (Agent, Manager, Owner)
router.get('/', protect, authorize('agent', 'manager', 'owner', 'super_admin'), async (req, res) => {
    try {
        const { search, isVerified, isBlocked, page = 1, limit = 20 } = req.query;

        console.log('GET /clients request');
        console.log('User:', req.user._id, req.user.role);
        console.log('Institution Context:', req.institutionId);

        let query = {
            role: 'client',
            institution: req.institutionId
        };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        if (isVerified !== undefined) {
            query.isVerified = isVerified === 'true';
        }

        if (isBlocked !== undefined) {
            query.isBlocked = isBlocked === 'true';
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const clients = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        const total = await User.countDocuments(query);

        res.json({
            success: true,
            data: {
                clients,
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
            message: 'Erro ao listar clientes',
            error: error.message
        });
    }
});

// @route   GET /api/clients/:id
// @desc    Obter detalhes de cliente
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const client = await User.findById(req.params.id)
            .select('-password')
            .populate('documents');

        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Cliente não encontrado'
            });
        }

        const isSameInstitution = client.institution?.toString() === req.user.institution?._id.toString();
        const isOwnProfile = client._id.toString() === req.user._id.toString();

        if (!isSameInstitution && !isOwnProfile) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado'
            });
        }

        const credits = await Credit.find({ client: client._id })
            .sort({ createdAt: -1 })
            .limit(10);

        res.json({
            success: true,
            data: {
                client,
                credits
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao obter cliente',
            error: error.message
        });
    }
});

// @route   PUT /api/clients/:id
// @desc    Atualizar perfil de cliente
// @access  Private
router.put('/:id', protect, auditAction('User', 'update', 'medium'), async (req, res) => {
    try {
        const { name, phone, address } = req.body;

        const client = await User.findById(req.params.id);

        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Cliente não encontrado'
            });
        }

        const isSameInstitution = client.institution?.toString() === req.user.institution?._id.toString();
        const isOwnProfile = client._id.toString() === req.user._id.toString();

        if (!isSameInstitution || (req.user.role === 'client' && !isOwnProfile)) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado'
            });
        }

        if (name) client.name = name;
        if (phone) client.phone = phone;
        if (address) client.address = address;

        await client.save();

        res.json({
            success: true,
            message: 'Perfil atualizado com sucesso',
            data: { client }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar perfil',
            error: error.message
        });
    }
});

// @route   POST /api/clients/:id/documents
// @desc    Upload de documento
// @access  Private
router.post('/:id/documents', protect, upload.single('document'), async (req, res) => {
    try {
        const { type } = req.body;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Nenhum arquivo foi enviado'
            });
        }

        if (req.user.role === 'client' && req.params.id !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado'
            });
        }

        const document = await Document.create({
            client: req.params.id,
            institution: req.user.institution._id,
            type: type || 'other',
            fileUrl: req.file.path,
            fileName: req.file.originalname,
            fileType: req.file.mimetype,
            fileSize: req.file.size
        });

        await User.findByIdAndUpdate(req.params.id, {
            $push: { documents: document._id }
        });

        res.status(201).json({
            success: true,
            message: 'Documento enviado com sucesso',
            data: { document }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao enviar documento',
            error: error.message
        });
    }
});

// @route   POST /api/clients/documents/me
// @desc    Upload de documento para o próprio perfil
// @access  Private (Client)
router.post('/documents/me', protect, upload.single('document'), async (req, res) => {
    try {
        const { type } = req.body;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Nenhum arquivo foi enviado'
            });
        }

        // Verificar se já existe um documento deste tipo pendente/rejeitado e remover se necessário
        // (Opcional, mas bom para manter a base limpa)

        const document = await Document.create({
            client: req.user._id,
            institution: req.user.institution._id,
            type: type || 'other',
            fileUrl: req.file.path,
            fileName: req.file.originalname,
            fileType: req.file.mimetype,
            fileSize: req.file.size
        });

        await User.findByIdAndUpdate(req.user._id, {
            $push: { documents: document._id }
        });

        res.status(201).json({
            success: true,
            message: 'Documento enviado com sucesso',
            data: { document }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao enviar documento',
            error: error.message
        });
    }
});

// @route   PUT /api/clients/:id/verify
// @desc    Verificar cliente
// @access  Private (Manager/Owner)
router.put('/:id/verify', protect, authorize('manager', 'owner', 'super_admin'), auditAction('User', 'verify_client', 'high'), async (req, res) => {
    try {
        const client = await User.findById(req.params.id);

        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Cliente não encontrado'
            });
        }

        client.isVerified = true;
        await client.save();

        res.json({
            success: true,
            message: 'Cliente verificado com sucesso',
            data: { client }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao verificar cliente',
            error: error.message
        });
    }
});

// @route   PUT /api/clients/:id/block
// @desc    Bloquear/Desbloquear cliente
// @access  Private (Manager/Owner)
router.put('/:id/block', protect, authorize('manager', 'owner', 'super_admin'), auditAction('User', 'block_client', 'critical'), async (req, res) => {
    try {
        const { isBlocked } = req.body;

        const client = await User.findById(req.params.id);

        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Cliente não encontrado'
            });
        }

        client.isBlocked = isBlocked;
        await client.save();

        res.json({
            success: true,
            message: `Cliente ${isBlocked ? 'bloqueado' : 'desbloqueado'} com sucesso`,
            data: { client }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar status do cliente',
            error: error.message
        });
    }
});

// @route   PUT /api/clients/documents/:docId/verify
// @desc    Verificar/Rejeitar documento individual
// @access  Private (Manager/Owner)
router.put('/documents/:docId/verify', protect, authorize('manager', 'owner', 'super_admin'), auditAction('Document', 'verify', 'medium'), async (req, res) => {
    try {
        const { isVerified, rejectionReason, notes } = req.body;

        const document = await Document.findById(req.params.docId);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Documento não encontrado'
            });
        }

        document.isVerified = isVerified;
        document.rejectionReason = isVerified ? null : rejectionReason;
        document.notes = notes;
        document.verifiedBy = req.user._id;
        document.verifiedAt = new Date();

        await document.save();

        res.json({
            success: true,
            message: `Documento ${isVerified ? 'verificado' : 'rejeitado'} com sucesso`,
            data: { document }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao verificar documento',
            error: error.message
        });
    }
});

export default router;
