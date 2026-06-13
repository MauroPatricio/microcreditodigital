import { useAuth } from '../context/AuthContext';

export const usePermissions = () => {
    const { user } = useAuth();

    const role = user?.role || 'guest';

    const permissions = {
        // Dashboard
        canViewDashboard: ['super_admin', 'owner', 'admin', 'supervisor', 'representative', 'agent', 'manager'].includes(role),
        canViewGlobalDashboard: ['super_admin'].includes(role),
        
        // Utilizadores
        canManageUsers: ['super_admin', 'owner', 'admin'].includes(role),
        
        // Clientes
        canViewClients: ['super_admin', 'owner', 'admin', 'supervisor', 'representative', 'agent', 'manager'].includes(role),
        canCreateClient: ['super_admin', 'owner', 'admin', 'representative', 'agent', 'manager'].includes(role),
        canEditClient: ['super_admin', 'owner', 'admin', 'representative', 'manager'].includes(role),
        canDeleteClient: ['super_admin', 'owner', 'admin'].includes(role),
        
        // Seguros / Apólices / Processos
        canManageLoans: ['super_admin', 'owner', 'admin', 'supervisor', 'representative', 'agent', 'manager'].includes(role),
        
        // Relatórios
        canViewReports: ['super_admin', 'owner', 'admin', 'supervisor', 'representative', 'manager'].includes(role),
        canViewAllProduction: ['super_admin', 'owner', 'admin', 'supervisor', 'manager'].includes(role),
        
        // Configurações e Auditoria
        canManageSettings: ['super_admin', 'owner', 'admin'].includes(role),
        canViewAuditLogs: ['super_admin', 'owner', 'admin'].includes(role),
        
        // Supervisor Específico
        canManageTeams: ['super_admin', 'owner', 'admin', 'supervisor'].includes(role),
    };

    return permissions;
};
