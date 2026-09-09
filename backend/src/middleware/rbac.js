import Role from '../models/Role.js';

// Catálogo Mestre de Permissões
export const PERMISSIONS_CATALOG = [
    {
        module: 'clientes',
        name: 'Clientes',
        actions: [
            { code: 'clientes.view', name: 'Visualizar Clientes' },
            { code: 'clientes.create', name: 'Registar Cliente' },
            { code: 'clientes.edit', name: 'Editar Cliente' },
            { code: 'clientes.delete', name: 'Eliminar Cliente' },
            { code: 'clientes.history', name: 'Ver Histórico do Cliente' }
        ]
    },
    {
        module: 'creditos',
        name: 'Créditos e Solicitações',
        actions: [
            { code: 'creditos.view', name: 'Visualizar Créditos' },
            { code: 'creditos.create', name: 'Criar Solicitação' },
            { code: 'creditos.analyze', name: 'Analisar Crédito' },
            { code: 'creditos.recommend', name: 'Recomendar Aprovação/Rejeição' },
            { code: 'creditos.approve', name: 'Aprovar Crédito' },
            { code: 'creditos.reject', name: 'Rejeitar Crédito' },
            { code: 'creditos.disburse', name: 'Desembolsar Crédito' },
            { code: 'creditos.cancel', name: 'Cancelar Crédito' }
        ]
    },
    {
        module: 'pagamentos',
        name: 'Pagamentos e Tesouraria',
        actions: [
            { code: 'pagamentos.view', name: 'Visualizar Pagamentos' },
            { code: 'pagamentos.create', name: 'Registar Pagamento' },
            { code: 'pagamentos.reconcile', name: 'Conciliar Pagamentos' },
            { code: 'pagamentos.delete', name: 'Anular Pagamento' }
        ]
    },
    {
        module: 'cobrancas',
        name: 'Gestão de Cobranças',
        actions: [
            { code: 'cobrancas.view', name: 'Visualizar Carteira de Cobranças' },
            { code: 'cobrancas.contact', name: 'Registar Contacto' },
            { code: 'cobrancas.negotiate', name: 'Registar Promessa/Renegociação' },
            { code: 'cobrancas.payment', name: 'Receber Pagamento de Cobrança' }
        ]
    },
    {
        module: 'relatorios',
        name: 'Relatórios e Métricas',
        actions: [
            { code: 'relatorios.view', name: 'Consultar Relatórios' },
            { code: 'relatorios.export', name: 'Exportar Relatórios (PDF/Excel)' }
        ]
    },
    {
        module: 'utilizadores',
        name: 'Utilizadores e Roles',
        actions: [
            { code: 'utilizadores.view', name: 'Visualizar Utilizadores' },
            { code: 'utilizadores.create', name: 'Criar Utilizador' },
            { code: 'utilizadores.edit', name: 'Editar Utilizador' },
            { code: 'utilizadores.block', name: 'Bloquear/Desbloquear Utilizador' },
            { code: 'roles.view', name: 'Visualizar Perfis/Roles' },
            { code: 'roles.manage', name: 'Gerir Perfis e Permissões' }
        ]
    },
    {
        module: 'auditoria',
        name: 'Auditoria e Segurança',
        actions: [
            { code: 'auditoria.view', name: 'Visualizar Audit Logs' },
            { code: 'configuracoes.view', name: 'Visualizar Configurações' },
            { code: 'configuracoes.edit', name: 'Editar Configurações Críticas' }
        ]
    }
];

// Permissões padrão por role nativa
export const DEFAULT_ROLE_PERMISSIONS = {
    super_admin: ['*'],
    owner: [
        'clientes.view', 'clientes.create', 'clientes.edit', 'clientes.delete', 'clientes.history',
        'creditos.view', 'creditos.create', 'creditos.analyze', 'creditos.recommend', 'creditos.approve', 'creditos.reject', 'creditos.disburse', 'creditos.cancel',
        'pagamentos.view', 'pagamentos.create', 'pagamentos.reconcile',
        'cobrancas.view', 'cobrancas.contact', 'cobrancas.negotiate', 'cobrancas.payment',
        'relatorios.view', 'relatorios.export',
        'utilizadores.view', 'utilizadores.create', 'utilizadores.edit', 'utilizadores.block',
        'roles.view', 'roles.manage',
        'auditoria.view', 'configuracoes.view', 'configuracoes.edit'
    ],
    admin: [
        'clientes.view', 'clientes.create', 'clientes.edit', 'clientes.history',
        'creditos.view', 'creditos.create', 'creditos.analyze', 'creditos.recommend', 'creditos.approve', 'creditos.reject',
        'pagamentos.view', 'pagamentos.create', 'pagamentos.reconcile',
        'cobrancas.view', 'cobrancas.contact', 'cobrancas.negotiate',
        'relatorios.view', 'relatorios.export',
        'utilizadores.view', 'utilizadores.create', 'utilizadores.edit',
        'roles.view', 'auditoria.view'
    ],
    manager: [
        'clientes.view', 'clientes.create', 'clientes.edit', 'clientes.history',
        'creditos.view', 'creditos.create', 'creditos.analyze', 'creditos.recommend', 'creditos.approve', 'creditos.reject',
        'pagamentos.view', 'pagamentos.create',
        'cobrancas.view', 'cobrancas.contact', 'cobrancas.negotiate',
        'relatorios.view', 'relatorios.export'
    ],
    agent: [
        'clientes.view', 'clientes.create', 'clientes.edit', 'clientes.history',
        'creditos.view', 'creditos.create',
        'relatorios.view'
    ],
    representative: [
        'clientes.view', 'clientes.create', 'clientes.edit', 'clientes.history',
        'creditos.view', 'creditos.create',
        'relatorios.view'
    ],
    analyst: [
        'clientes.view', 'clientes.history',
        'creditos.view', 'creditos.analyze', 'creditos.recommend'
    ],
    approver: [
        'clientes.view', 'clientes.history',
        'creditos.view', 'creditos.approve', 'creditos.reject'
    ],
    supervisor: [
        'clientes.view', 'clientes.history',
        'creditos.view', 'creditos.analyze', 'creditos.recommend', 'creditos.approve', 'creditos.reject',
        'relatorios.view'
    ],
    financial: [
        'creditos.view', 'creditos.disburse',
        'pagamentos.view', 'pagamentos.create', 'pagamentos.reconcile',
        'relatorios.view'
    ],
    collector: [
        'clientes.view', 'clientes.history',
        'creditos.view',
        'cobrancas.view', 'cobrancas.contact', 'cobrancas.negotiate', 'cobrancas.payment'
    ],
    support: [
        'clientes.view', 'clientes.history',
        'creditos.view', 'pagamentos.view'
    ],
    auditor: [
        'clientes.view', 'clientes.history',
        'creditos.view', 'pagamentos.view', 'cobrancas.view',
        'relatorios.view', 'relatorios.export',
        'utilizadores.view', 'roles.view', 'auditoria.view', 'configuracoes.view'
    ],
    client: [
        'client_area.view', 'creditos.create_my_request'
    ]
};

// Helper para verificar se um objeto utilizador possui determinada permissão
export const checkUserPermission = async (user, permissionCode) => {
    if (!user) return false;

    // Super admin possui permissão universal
    if (user.role === 'super_admin') return true;

    let userPermissions = [];

    // Se o utilizador possui uma role personalizada vinculada
    if (user.customRole) {
        try {
            const roleObj = typeof user.customRole === 'object' && user.customRole.permissions
                ? user.customRole
                : await Role.findById(user.customRole);

            if (roleObj && roleObj.permissions) {
                userPermissions = roleObj.permissions;
            }
        } catch (e) {
            console.error('Erro ao buscar customRole do utilizador:', e);
        }
    }

    // Se não encontrou permissões da customRole, usa as permissões padrão da role base
    if (userPermissions.length === 0) {
        userPermissions = DEFAULT_ROLE_PERMISSIONS[user.role] || [];
    }

    if (userPermissions.includes('*')) return true;

    // Tratar wildcard por módulo (ex: 'creditos.*')
    if (permissionCode.includes('.')) {
        const [mod] = permissionCode.split('.');
        if (userPermissions.includes(`${mod}.*`)) return true;
    }

    return userPermissions.includes(permissionCode);
};

// Middleware para verificar permissão do backend
export const requirePermission = (permissionCode) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Não autenticado'
                });
            }

            const hasPerm = await checkUserPermission(req.user, permissionCode);

            if (!hasPerm) {
                return res.status(403).json({
                    success: false,
                    message: `Acesso negado. Ação '${permissionCode}' não é permitida para o seu perfil.`
                });
            }

            next();
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Erro ao verificar permissão',
                error: error.message
            });
        }
    };
};

// Middleware para segregação de funções em aprovações de crédito
export const enforceSegregationOfDuties = (creditResolverFn) => {
    return async (req, res, next) => {
        try {
            // Super Admin possui override de auditoria
            if (req.user.role === 'super_admin') return next();

            const credit = await creditResolverFn(req);
            if (!credit) return next();

            const currentUserId = req.user._id.toString();

            // Quem criou a solicitação não pode aprovar
            const creatorId = credit.createdBy ? credit.createdBy.toString() : (credit.agent ? credit.agent.toString() : null);
            if (creatorId && creatorId === currentUserId) {
                return res.status(403).json({
                    success: false,
                    message: 'Segregação de Funções: O criador da solicitação não pode aprovar o seu próprio crédito.'
                });
            }

            // Quem analisou a solicitação não pode aprovar
            const analystId = credit.makerChecker?.analyzedBy ? credit.makerChecker.analyzedBy.toString() : null;
            if (analystId && analystId === currentUserId) {
                return res.status(403).json({
                    success: false,
                    message: 'Segregação de Funções: O analista que avaliou a solicitação não pode aprovar o próprio crédito.'
                });
            }

            next();
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Erro na validação de segregação de funções',
                error: error.message
            });
        }
    };
};

// Middleware para verificar limite de valor de aprovação
export const requireApprovalLimit = (amountResolverFn) => {
    return async (req, res, next) => {
        try {
            if (req.user.role === 'super_admin' || req.user.role === 'owner') return next();

            const amount = await amountResolverFn(req);
            if (!amount || isNaN(amount)) return next();

            let userLimit = req.user.approvalLimit;

            // Se o limite individual for nulo, tenta obter da customRole
            if ((userLimit === null || userLimit === undefined) && req.user.customRole) {
                const roleObj = typeof req.user.customRole === 'object' && req.user.customRole.approvalLimit !== undefined
                    ? req.user.customRole
                    : await Role.findById(req.user.customRole);

                if (roleObj) {
                    userLimit = roleObj.approvalLimit;
                }
            }

            // Se o limite for definido (> 0) e o valor ultrapassar o limite
            if (userLimit && userLimit > 0 && amount > userLimit) {
                return res.status(403).json({
                    success: false,
                    message: `Limite de Aprovação Excedido: O seu perfil permite aprovações até ${userLimit.toLocaleString()} MT. Esta solicitação é de ${amount.toLocaleString()} MT e requer escalamento para aprovação superior.`
                });
            }

            next();
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Erro na verificação de limite de aprovação',
                error: error.message
            });
        }
    };
};
