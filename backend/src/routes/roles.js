import express from 'express';
import Role from '../models/Role.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { protect } from '../middleware/auth.js';
import { requirePermission, requireFeature, PERMISSIONS_CATALOG, DEFAULT_ROLE_PERMISSIONS } from '../middleware/rbac.js';

const router = express.Router();

// Todas as rotas exigem autenticação e funcionalidade rbac no pacote
router.use(protect, requireFeature('rbac'));

// Catálogo base de perfis nativos do sistema com descrições detalhadas do que cada perfil faz
export const SYSTEM_ROLES_DEFINITIONS = [
    {
        name: 'Super Administrador',
        slug: 'super_admin',
        description: 'Administrador Global da Plataforma Nhiquela. Possui acesso irrestrito e soberano a todas as instituições, pacotes de subscrição, faturação, governança de perfis e segurança global.',
        isSystem: true,
        isCustom: false,
        institution: null,
        permissions: ['*'],
        approvalLimit: 0,
    },
    {
        name: 'Proprietário / Diretor Executivo',
        slug: 'owner',
        description: 'Proprietário ou Diretor Executivo da Instituição de Microcrédito. Tem alçada total sobre a gestão da instituição, tesouraria e caixa, equipa, aprovações de alto nível e contratação de pacotes.',
        isSystem: true,
        isCustom: false,
        institution: null,
        permissions: DEFAULT_ROLE_PERMISSIONS.owner || [],
        approvalLimit: 0,
    },
    {
        name: 'Administrador Institucional',
        slug: 'admin',
        description: 'Administrador Operacional da Instituição. Responsável pela gestão diária dos utilizadores, parametrização dos fluxos de crédito, relatórios gerenciais e acompanhamento dos processos.',
        isSystem: true,
        isCustom: false,
        institution: null,
        permissions: DEFAULT_ROLE_PERMISSIONS.admin || [],
        approvalLimit: 500000,
    },
    {
        name: 'Gestor de Carteira / Crédito',
        slug: 'manager',
        description: 'Gestor de Crédito e Carteira de Clientes. Responsável pelo acompanhamento da carteira ativa, triagem de propostas, gestão de clientes e supervisão das cobranças.',
        isSystem: true,
        isCustom: false,
        institution: null,
        permissions: DEFAULT_ROLE_PERMISSIONS.manager || [],
        approvalLimit: 250000,
    },
    {
        name: 'Analista de Crédito e Risco',
        slug: 'analyst',
        description: 'Analista de Crédito e Risco. Responsável pela verificação documental, análise da capacidade de endividamento e histórico financeiro do mutuário, avaliação de garantias reais e emissão de parecer técnico.',
        isSystem: true,
        isCustom: false,
        institution: null,
        permissions: DEFAULT_ROLE_PERMISSIONS.analyst || [],
        approvalLimit: 0,
    },
    {
        name: 'Aprovador de Crédito / Comité',
        slug: 'approver',
        description: 'Membro do Comité de Crédito / Aprovador Autorizado. Responsável pela decisão final de homologação e aprovação de empréstimos e contratos dentro do seu limite de alçada estipulado.',
        isSystem: true,
        isCustom: false,
        institution: null,
        permissions: DEFAULT_ROLE_PERMISSIONS.approver || [],
        approvalLimit: 100000,
    },
    {
        name: 'Gestor Financeiro / Tesouraria',
        slug: 'financial',
        description: 'Equipa de Tesouraria e Finanças. Responsável pela emissão e execução de ordens de desembolso, conferência e reconciliação de pagamentos/comprovativos e lançamentos no fluxo de caixa.',
        isSystem: true,
        isCustom: false,
        institution: null,
        permissions: DEFAULT_ROLE_PERMISSIONS.financial || [],
        approvalLimit: 0,
    },
    {
        name: 'Técnico de Cobranças',
        slug: 'collector',
        description: 'Gestor de Cobranças e Recuperação de Ativos. Atua no acompanhamento de mutuários com prestações vencidas ou em risco de mora, registo de contactos, negociação de acordos e cobrança de valores.',
        isSystem: true,
        isCustom: false,
        institution: null,
        permissions: DEFAULT_ROLE_PERMISSIONS.collector || [],
        approvalLimit: 0,
    },
    {
        name: 'Apoio ao Cliente / Suporte',
        slug: 'support',
        description: 'Atendimento ao Cliente. Focado no esclarecimento de dúvidas dos utilizadores, consulta de estado de pedidos e suporte de primeiro nível, sem permissões de alteração financeira.',
        isSystem: true,
        isCustom: false,
        institution: null,
        permissions: DEFAULT_ROLE_PERMISSIONS.support || [],
        approvalLimit: 0,
    },
    {
        name: 'Auditor Interno & Compliance',
        slug: 'auditor',
        description: 'Auditoria e Conformidade Regulamentar. Acesso independente de leitura a logs de auditoria, rastreabilidade de ações, relatórios regulamentares (BdM) e conformidade de processos.',
        isSystem: true,
        isCustom: false,
        institution: null,
        permissions: DEFAULT_ROLE_PERMISSIONS.auditor || [],
        approvalLimit: 0,
    },
    {
        name: 'Supervisor de Agentes',
        slug: 'supervisor',
        description: 'Supervisor de Campo. Coordena equipas de agentes no terreno, supervisiona angariação de clientes, validação de pré-cadastros e conferência de documentos recolhidos.',
        isSystem: true,
        isCustom: false,
        institution: null,
        permissions: DEFAULT_ROLE_PERMISSIONS.supervisor || [],
        approvalLimit: 50000,
    },
    {
        name: 'Agente de Crédito / Promotor',
        slug: 'agent',
        description: 'Agente Comercial de Terreno. Captação e onboarding presencial de clientes, simulação e submissão de pedidos de crédito através da aplicação móvel.',
        isSystem: true,
        isCustom: false,
        institution: null,
        permissions: DEFAULT_ROLE_PERMISSIONS.agent || [],
        approvalLimit: 0,
    },
    {
        name: 'Representante Comercial',
        slug: 'representative',
        description: 'Representante Externo. Responsável pela expansão de parcerias e angariação de mutuários com cálculo de comissões por contratos desembolsados.',
        isSystem: true,
        isCustom: false,
        institution: null,
        permissions: DEFAULT_ROLE_PERMISSIONS.representative || [],
        approvalLimit: 0,
    },
    {
        name: 'Cliente / Mutuário',
        slug: 'client',
        description: 'Mutuário do Sistema. Acesso à aplicação mobile para simulação de condições, assinatura digital de contratos, consulta de extratos e envio de comprovativos de pagamento.',
        isSystem: true,
        isCustom: false,
        institution: null,
        permissions: DEFAULT_ROLE_PERMISSIONS.client || [],
        approvalLimit: 0,
    }
];

// Helper para sincronizar os perfis nativos na base de dados
async function ensureSystemRoles() {
    try {
        for (const def of SYSTEM_ROLES_DEFINITIONS) {
            const exists = await Role.findOne({ slug: def.slug, institution: null });
            if (!exists) {
                await Role.create({
                    name: def.name,
                    slug: def.slug,
                    description: def.description,
                    institution: null,
                    isSystem: true,
                    isCustom: false,
                    permissions: def.permissions,
                    approvalLimit: def.approvalLimit
                });
            }
        }
    } catch (err) {
        console.error('Erro ao sincronizar perfis nativos:', err.message);
    }
}

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
        // Garantir que os perfis de sistema existem
        await ensureSystemRoles();

        let query = {};
        if (req.user.role === 'super_admin') {
            // Super Admin visualiza todos os perfis do sistema e das instituições
            query = {};
        } else {
            query = {
                $or: [
                    { institution: req.institutionId },
                    { isSystem: true },
                    { institution: null }
                ]
            };
        }

        const roles = await Role.find(query).sort({ isSystem: -1, createdAt: -1 });

        res.json({
            success: true,
            isSuperAdmin: req.user.role === 'super_admin',
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

// POST /api/roles - Criar role (Super Admin pode criar perfis globais ou de sistema; outros apenas customizados da instituição)
router.post('/', requirePermission('roles.manage'), async (req, res) => {
    try {
        const { name, description, permissions, approvalLimit, isSystem } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Nome do perfil é obrigatório'
            });
        }

        const isSuperAdmin = req.user.role === 'super_admin';

        if (isSystem && !isSuperAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Apenas o Super Admin tem permissão para registar perfis nativos de sistema.'
            });
        }

        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
        const targetInstitution = isSuperAdmin && req.body.institution === null ? null : (req.institutionId || req.body.institution || null);

        const existingRole = await Role.findOne({ slug, institution: targetInstitution });
        if (existingRole) {
            return res.status(400).json({
                success: false,
                message: 'Já existe um perfil com este identificador / nome'
            });
        }

        const role = await Role.create({
            name,
            slug,
            description: description || '',
            permissions: permissions || [],
            approvalLimit: approvalLimit || 0,
            institution: targetInstitution,
            isCustom: isSuperAdmin ? !isSystem : true,
            isSystem: isSuperAdmin ? Boolean(isSystem) : false
        });

        // Audit Log
        await AuditLog.create({
            institution: req.institutionId || null,
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
            message: 'Perfil de acesso criado com sucesso'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao criar perfil',
            error: error.message
        });
    }
});

// PUT /api/roles/:id - Editar perfil (Super Admin pode descrever e alterar qualquer perfil; outros apenas customizados)
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

        const isSuperAdmin = req.user.role === 'super_admin';

        // Perfis de sistema só podem ser editados / descritos pelo Super Admin
        if (role.isSystem && !isSuperAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado: Apenas o Super Admin tem permissão para alterar ou descrever perfis nativos do sistema.'
            });
        }

        // Se não for super admin, só pode editar perfis da sua própria instituição
        if (!isSuperAdmin && role.institution && role.institution.toString() !== req.institutionId?.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado: Não pode editar perfis de outra instituição.'
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
            institution: req.institutionId || null,
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
            message: 'Perfil e descrição atualizados com sucesso'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar perfil',
            error: error.message
        });
    }
});

// DELETE /api/roles/:id - Eliminar perfil (Super Admin pode remover qualquer perfil exceto super_admin; outros apenas customizados da sua instituição)
router.delete('/:id', requirePermission('roles.manage'), async (req, res) => {
    try {
        const role = await Role.findById(req.params.id);
        if (!role) {
            return res.status(404).json({
                success: false,
                message: 'Perfil não encontrado'
            });
        }

        // Proteger o perfil principal do Super Admin
        if (role.slug === 'super_admin') {
            return res.status(400).json({
                success: false,
                message: 'O perfil Super Administrador é o núcleo do sistema e não pode ser eliminado.'
            });
        }

        const isSuperAdmin = req.user.role === 'super_admin';

        // Perfis de sistema só podem ser removidos pelo Super Admin
        if (role.isSystem && !isSuperAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado: Apenas o Super Admin tem autorização para remover perfis nativos do sistema.'
            });
        }

        // Se não for super admin, só pode eliminar perfis da sua própria instituição
        if (!isSuperAdmin && role.institution && role.institution.toString() !== req.institutionId?.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado: Não pode eliminar perfis de outra instituição.'
            });
        }

        // Verificar se existem utilizadores atribuídos a este perfil (por customRole ou por role nativa)
        const usersCount = await User.countDocuments({
            $or: [
                { customRole: role._id },
                { role: role.slug }
            ]
        });

        if (usersCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Não é possível eliminar este perfil porque existem ${usersCount} utilizador(es) ativos associados a ele. Reatribua esses utilizadores antes de remover o perfil.`
            });
        }

        await role.deleteOne();

        // Audit Log
        await AuditLog.create({
            institution: req.institutionId || null,
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
            message: `Perfil "${role.name}" eliminado com sucesso`
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
