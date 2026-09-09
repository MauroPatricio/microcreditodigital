import express from 'express';
import Role from '../models/Role.js';
import AuditLog from '../models/AuditLog.js';
import { protect } from '../middleware/auth.js';
import { requirePermission, PERMISSIONS_CATALOG, DEFAULT_ROLE_PERMISSIONS } from '../middleware/rbac.js';

const router = express.Router();

// Todas as rotas exigem autenticação
router.use(protect);

// GET /api/roles/permissions-catalog - Obter catálogo de permissões
router.get('/permissions-catalog', requirePermission('roles.view'), (req, res) => {
    res.json({
        success: true,
        catalog: PERMISSIONS_CATALOG,
        defaultRolePermissions: DEFAULT_ROLE_PERMISSIONS
    });
});

// GET /api/roles - Listar roles (nativas + customizadas)
router.get('/', requirePermission('roles.view'), async (req, res) => {
    try {
        const query = {
            $or: [
                { institution: req.institutionId },
                { isSystem: true },
                { institution: null }
            ]
        };

        const roles = await Role.find(query).sort({ createdAt: -1 });

        res.json({
            success: true,
            data: roles
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar perfis',
            error: error.message
        });
    }
});

// POST /api/roles - Criar role personalizada
router.post('/', requirePermission('roles.manage'), async (req, res) => {
    try {
        const { name, description, permissions, approvalLimit } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Nome do perfil é obrigatório'
            });
        }

        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_');

        const existingRole = await Role.findOne({ slug, institution: req.institutionId });
        if (existingRole) {
            return res.status(400).json({
                success: false,
                message: 'Já existe um perfil com este nome'
            });
        }

        const role = await Role.create({
            name,
            slug,
            description,
            permissions: permissions || [],
            approvalLimit: approvalLimit || 0,
            institution: req.institutionId,
            isCustom: true,
            isSystem: false
        });

        // Audit Log
        await AuditLog.create({
            institution: req.institutionId,
            user: req.user._id,
            action: 'create',
            entityType: 'Role',
            entityId: role._id,
            changes: { after: role.toObject() },
            severity: 'high',
            metadata: {
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
                path: req.originalUrl,
                method: req.method
            }
        });

        res.status(201).json({
            success: true,
            data: role,
            message: 'Perfil criado com sucesso'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao criar perfil',
            error: error.message
        });
    }
});

// PUT /api/roles/:id - Editar role personalizada
router.put('/:id', requirePermission('roles.manage'), async (req, res) => {
    try {
        const { name, description, permissions, approvalLimit } = req.body;

        const role = await Role.findById(req.params.id);
        if (!role) {
            return res.status(404).json({
                success: false,
                message: 'Perfil não encontrado'
            });
        }

        if (role.isSystem) {
            return res.status(403).json({
                success: false,
                message: 'Não é possível alterar perfis nativos do sistema'
            });
        }

        const beforeState = role.toObject();

        if (name) role.name = name;
        if (description !== undefined) role.description = description;
        if (permissions) role.permissions = permissions;
        if (approvalLimit !== undefined) role.approvalLimit = approvalLimit;

        await role.save();

        // Audit Log
        await AuditLog.create({
            institution: req.institutionId,
            user: req.user._id,
            action: 'update',
            entityType: 'Role',
            entityId: role._id,
            changes: {
                before: beforeState,
                after: role.toObject()
            },
            severity: 'high',
            metadata: {
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
                path: req.originalUrl,
                method: req.method
            }
        });

        res.json({
            success: true,
            data: role,
            message: 'Perfil atualizado com sucesso'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar perfil',
            error: error.message
        });
    }
});

// DELETE /api/roles/:id - Eliminar role personalizada
router.delete('/:id', requirePermission('roles.manage'), async (req, res) => {
    try {
        const role = await Role.findById(req.params.id);
        if (!role) {
            return res.status(404).json({
                success: false,
                message: 'Perfil não encontrado'
            });
        }

        if (role.isSystem) {
            return res.status(403).json({
                success: false,
                message: 'Não é possível eliminar perfis nativos do sistema'
            });
        }

        await role.deleteOne();

        // Audit Log
        await AuditLog.create({
            institution: req.institutionId,
            user: req.user._id,
            action: 'delete',
            entityType: 'Role',
            entityId: role._id,
            changes: { before: role.toObject() },
            severity: 'critical',
            metadata: {
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
                path: req.originalUrl,
                method: req.method
            }
        });

        res.json({
            success: true,
            message: 'Perfil eliminado com sucesso'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao eliminar perfil',
            error: error.message
        });
    }
});

export default router;
