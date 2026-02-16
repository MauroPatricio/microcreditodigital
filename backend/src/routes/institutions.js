import express from 'express';
import Institution from '../models/Institution.js';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';
import { auditAction } from '../middleware/auditMiddleware.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Configurar multer para upload de logo
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, process.env.UPLOAD_PATH || './uploads/documents');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 2097152 // 2MB
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Apenas imagens JPEG e PNG são permitidas'));
        }
    }
});

// @route   POST /api/institutions
// @desc    Criar uma nova instituição (Apenas por super_admin ou via fluxo de registro de owner)
// @access  Private/SuperAdmin
// @route   POST /api/institutions
// @desc    Criar uma nova instituição (Agente SuperAdmin ou Owner)
// @access  Private
router.post('/', protect, authorize('super_admin', 'owner'), auditAction('Institution', 'create', 'high'), async (req, res) => {
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

        // Criar template de contrato padrão para a nova instituição
        try {
            const ContractTemplate = (await import('../models/ContractTemplate.js')).default;
            await ContractTemplate.create({
                institution: institution._id,
                name: 'loan_contract_standard',
                title: 'Contrato de Empréstimo de Microcrédito',
                content: `
                    <h1>CONTRATO DE EMPRÉSTIMO</h1>
                    <p>Pelo presente instrumento particular, a <strong>{{institution_name}}</strong>...</p>
                    <p>O cliente <strong>{{client_name}}</strong>, portador do BI {{client_bi}}...</p>
                    <p>Montante: {{loan_amount}} {{currency}}</p>
                    <p>Data: {{current_date}}</p>
                `,
                placeholders: [
                    { key: 'institution_name', description: 'Nome da firma' },
                    { key: 'client_name', description: 'Nome do cliente' },
                    { key: 'loan_amount', description: 'Valor solicitado' }
                ]
            });
        } catch (templateError) {
            console.error('Erro ao criar template padrão:', templateError);
            // Non-blocking error, we still created the institution
        }

        // Se for o primeiro, definir como ativo
        if (!req.user.activeInstitution) {
            req.user.activeInstitution = institution._id;
            await req.user.save();
        }

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

// @route   GET /api/institutions/all
// @desc    Listar todas as instituições do Owner
// @access  Private (Owner)
router.get('/all', protect, authorize('owner', 'super_admin'), async (req, res) => {
    try {
        const query = req.user.role === 'super_admin' ? {} : { owner: req.user._id };
        const institutions = await Institution.find(query);

        res.json({
            success: true,
            data: institutions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao listar instituições',
            error: error.message
        });
    }
});

// @route   POST /api/institutions/switch/:id
// @desc    Alternar instituição ativa
// @access  Private (Owner)
router.post('/switch/:id', protect, authorize('owner', 'super_admin'), auditAction('User', 'switch_tenant', 'low'), async (req, res) => {
    try {
        const institution = await Institution.findOne({
            _id: req.params.id,
            ...(req.user.role !== 'super_admin' && { owner: req.user._id })
        });

        if (!institution) {
            return res.status(404).json({
                success: false,
                message: 'Instituição não encontrada ou acesso negado'
            });
        }

        req.user.activeInstitution = institution._id;
        await req.user.save();

        res.json({
            success: true,
            message: `Contexto alterado para: ${institution.name}`,
            data: institution
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao alternar instituição',
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
router.put('/my', protect, authorize('owner'), auditAction('Institution', 'update', 'medium'), async (req, res) => {
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

// @route   GET /api/institutions/stats/global
// @desc    Métricas consolidadas de todas as instituições do Owner
// @access  Private (Owner)
router.get('/stats/global', protect, authorize('owner', 'super_admin'), async (req, res) => {
    try {
        const query = req.user.role === 'super_admin' ? {} : { owner: req.user._id };
        const institutions = await Institution.find(query);
        const instIds = institutions.map(i => i._id);

        // Aqui faríamos agregações complexas em Credits, Installments, etc.
        // Por agora, retornamos um resumo básico
        res.json({
            success: true,
            data: {
                totalInstitutions: institutions.length,
                activeInstitutions: institutions.filter(i => i.isActive).length,
                institutions: institutions.map(i => ({
                    id: i._id,
                    name: i.name,
                    status: i.isActive ? 'Ativa' : 'Inativa'
                }))
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/institutions/my/logo
// @desc    Upload de logo da instituição
// @access  Private (Owner/Manager)
router.post('/my/logo', protect, authorize('owner', 'manager'), upload.single('logo'), auditAction('Institution', 'update_logo', 'medium'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Nenhum arquivo de logo enviado'
            });
        }

        const logoUrl = req.file.path;

        const institution = await Institution.findById(req.user.institution._id);
        if (!institution) {
            return res.status(404).json({ success: false, message: 'Instituição não encontrada' });
        }

        // Inicializar appearance se não existir
        if (!institution.settings) institution.settings = {};
        if (!institution.settings.appearance) institution.settings.appearance = {};

        institution.settings.appearance.logoUrl = logoUrl;
        await institution.save();

        res.json({
            success: true,
            message: 'Logo atualizado com sucesso',
            data: { logoUrl }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
