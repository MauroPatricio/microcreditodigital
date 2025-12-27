import express from 'express';
import User from '../models/User.js';
import Document from '../models/Document.js';
import Credit from '../models/Credit.js';
import { protect, authorize } from '../middleware/auth.js';
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

// @route   GET /api/clients
// @desc    Listar clientes
// @access  Private (Admin)
router.get('/', protect, authorize('admin', 'super_admin'), async (req, res) => {
    try {
        const { search, isVerified, isBlocked, page = 1, limit = 20 } = req.query;

        let query = { role: 'client' };

        // Busca por nome, email ou telefone
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

        // Verificar permissão
        if (req.user.role === 'client' && client._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado'
            });
        }

        // Buscar créditos do cliente
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
router.put('/:id', protect, async (req, res) => {
    try {
        const { name, phone, address } = req.body;

        const client = await User.findById(req.params.id);

        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Cliente não encontrado'
            });
        }

        // Verificar permissão
        if (req.user.role === 'client' && client._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado'
            });
        }

        // Atualizar campos permitidos
        if (name) client.name = name;
        if (phone) client.phone = phone;
        if (address) client.address = address;

        await client.save();

        res.json({
            success: true,
            message: 'Perfil atualizado com sucesso',
            data: {
                client
            }
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

        // Verificar permissão
        if (req.user.role === 'client' && req.params.id !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado'
            });
        }

        const document = await Document.create({
            client: req.params.id,
            type: type || 'other',
            fileUrl: req.file.path,
            fileName: req.file.originalname,
            fileType: req.file.mimetype,
            fileSize: req.file.size
        });

        // Adicionar documento ao array do usuário
        await User.findByIdAndUpdate(req.params.id, {
            $push: { documents: document._id }
        });

        res.status(201).json({
            success: true,
            message: 'Documento enviado com sucesso',
            data: {
                document
            }
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
// @access  Private (Admin)
router.put('/:id/verify', protect, authorize('admin', 'super_admin'), async (req, res) => {
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
            data: {
                client
            }
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
// @access  Private (Admin)
router.put('/:id/block', protect, authorize('admin', 'super_admin'), async (req, res) => {
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
            data: {
                client
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar status do cliente',
            error: error.message
        });
    }
});

export default router;
