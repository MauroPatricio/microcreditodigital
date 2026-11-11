import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import {
    FiHome, FiUsers, FiDollarSign, FiBarChart2, FiActivity,
    FiSettings, FiLogOut, FiBriefcase, FiTrendingUp,
    FiSmartphone, FiFileText, FiMessageCircle, FiChevronLeft, FiMenu, FiServer, FiCreditCard,
    FiSend, FiCalendar, FiMail, FiBarChart, FiShield, FiPackage, FiLock
} from 'react-icons/fi';
import InstitutionSwitcher from './InstitutionSwitcher';

const Sidebar = () => {
    const { user, logout, hasPermission, hasFeature } = useAuth();
    const [isCollapsed, setIsCollapsed] = React.useState(false);
    const [pendingSubsCount, setPendingSubsCount] = React.useState(0);
    const [pendingPaymentsCount, setPendingPaymentsCount] = React.useState(0);

    // Calcular status e dias restantes da subscrição
    const activeInst = user?.activeInstitution || user?.institution;
    const subscription = activeInst?.subscription;
    const expiresAt = subscription?.expiresAt ? new Date(subscription.expiresAt) : null;
    const now = new Date();
    const remainingDays = expiresAt ? Math.max(0, Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24))) : 0;
    const isExpired =
        (subscription?.status === 'expired' || subscription?.status === 'pending' || subscription?.status === 'rejected' || (expiresAt && remainingDays <= 0)) &&
        user?.role !== 'super_admin';

    React.useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setIsCollapsed(true);
            } else {
                setIsCollapsed(false);
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    React.useEffect(() => {
        if (!user) return;
        const fetchBadges = async () => {
            try {
                const res = await api.get('/notifications/badges');
                if (res.data?.success && res.data.data) {
                    setPendingSubsCount(res.data.data.pendingSubscriptions || 0);
                    setPendingPaymentsCount(res.data.data.pendingPayments || 0);
                }
            } catch (err) {
                if (user?.role === 'super_admin') {
                    api.get('/institutions/subscription-requests/all')
                        .then((r) => {
                            if (r.data?.success) setPendingSubsCount(r.data.data.length || 0);
                        })
                        .catch(() => {});
                }
            }
        };
        fetchBadges();
        const timer = setInterval(fetchBadges, 25000);
        window.addEventListener('badges:refresh', fetchBadges);
        return () => {
            clearInterval(timer);
            window.removeEventListener('badges:refresh', fetchBadges);
        };
    }, [user]);

    React.useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--sidebar-width', isCollapsed ? 'var(--sidebar-collapsed-width)' : '260px');
    }, [isCollapsed]);

    const sections = [
        {
            title: 'Principal',
            items: [
                { name: 'Global View', icon: <FiBarChart2 />, path: '/global-dashboard', roles: ['owner', 'super_admin'], feature: 'multi_institution' },
                { name: 'Dashboard', icon: <FiHome />, path: '/dashboard', roles: ['owner', 'manager', 'agent', 'representative', 'supervisor', 'admin'], feature: 'dashboard' },
                { name: 'Caixa', icon: <FiCreditCard />, path: '/cashflow', roles: ['owner', 'manager', 'admin', 'financial'], feature: 'cashflow' },
                { name: 'Clientes', icon: <FiUsers />, path: '/clients', roles: ['owner', 'manager', 'agent', 'representative', 'supervisor', 'admin', 'analyst', 'collector', 'auditor'], feature: 'clients' },
                { name: 'Documentos', icon: <FiFileText />, path: '/pending-documents', roles: ['owner', 'manager', 'admin', 'supervisor'], feature: 'documents' },
                { name: 'Empréstimos', icon: <FiBriefcase />, path: '/loans', roles: ['owner', 'manager', 'agent', 'representative', 'supervisor', 'admin', 'analyst', 'approver', 'collector', 'auditor'], feature: 'loans' },
                { name: 'Contratos', icon: <FiFileText />, path: '/contract-templates', roles: ['owner', 'manager', 'admin', 'super_admin', 'supervisor'], feature: 'contracts' },
                { name: 'Cobranças', icon: <FiDollarSign />, path: '/payments', roles: ['owner', 'manager', 'agent', 'representative', 'supervisor', 'admin', 'financial', 'collector', 'auditor'], feature: 'payments', badge: pendingPaymentsCount },
            ]
        },
        {
            title: 'Relatórios',
            items: [
                { name: 'Relatórios', icon: <FiTrendingUp />, path: '/reports', roles: ['owner', 'manager', 'admin', 'supervisor', 'representative', 'auditor'], feature: 'reports' },
                { name: 'Rel. Mensal', icon: <FiBarChart2 />, path: '/reports/monthly', roles: ['owner', 'manager', 'admin'], feature: 'reports' },
                { name: 'Rel. Trimestral', icon: <FiBarChart2 />, path: '/reports/quarterly', roles: ['owner', 'manager', 'admin'], feature: 'reports' },
                { name: 'Rel. BdM', icon: <FiFileText />, path: '/reports/bom', roles: ['owner', 'manager', 'admin'], feature: 'reports' },
                { name: 'Comissões', icon: <FiDollarSign />, path: '/commissions', roles: ['owner', 'manager', 'admin', 'supervisor'], feature: 'commissions' },
                { name: 'Meus Ganhos', icon: <FiTrendingUp />, path: '/my-commissions', roles: ['agent', 'representative'], feature: 'commissions' },
            ]
        },
        {
            title: 'Comunicação',
            items: [
                { name: 'Painel Com.', icon: <FiBarChart />, path: '/communication', roles: ['owner', 'manager', 'agent', 'representative', 'supervisor', 'admin', 'super_admin'], feature: 'communication' },
                { name: 'Conexão WhatsApp', icon: <FiMessageCircle />, path: '/whatsapp-settings', roles: ['owner', 'manager', 'agent', 'representative', 'supervisor', 'admin', 'super_admin'], feature: 'whatsapp' },
                { name: 'Enviar', icon: <FiSend />, path: '/communication/send', roles: ['owner', 'manager', 'agent', 'representative', 'supervisor', 'admin', 'super_admin'], feature: 'communication' },
                { name: 'Agendamentos', icon: <FiCalendar />, path: '/communication/schedules', roles: ['owner', 'manager', 'agent', 'representative', 'supervisor', 'admin', 'super_admin'], feature: 'communication' },
                { name: 'Templates', icon: <FiMail />, path: '/communication/templates', roles: ['owner', 'manager', 'admin', 'super_admin', 'supervisor'], feature: 'communication' },
                { name: 'Histórico', icon: <FiActivity />, path: '/communication/history', roles: ['owner', 'manager', 'agent', 'representative', 'supervisor', 'admin', 'super_admin'], feature: 'communication' },
            ]
        },
        {
            title: 'Sistema',
            items: [
                { name: 'Utilizadores', icon: <FiUsers />, path: '/users', permission: 'utilizadores.view', roles: ['owner', 'admin', 'supervisor', 'manager', 'super_admin'] },
                { name: 'Perfis & Permissões', icon: <FiShield />, path: '/roles', permission: 'roles.view', roles: ['owner', 'admin', 'manager', 'super_admin'], feature: 'rbac' },
                { name: 'SMS Logs', icon: <FiSmartphone />, path: '/sms-logs', roles: ['owner', 'manager', 'admin'], feature: 'sms' },
                { name: 'Auditoria', icon: <FiActivity />, path: '/audit-logs', permission: 'auditoria.view', roles: ['owner', 'admin', 'auditor'], feature: 'audit' },
                { name: 'Performance', icon: <FiTrendingUp />, path: '/agent-performance', roles: ['owner', 'manager', 'supervisor', 'admin'], feature: 'commissions' },
                { name: 'Minha Subscrição', icon: <FiCreditCard />, path: '/my-subscription', roles: ['owner', 'admin'] },
                { name: 'Configurações', icon: <FiSettings />, path: '/settings', permission: 'configuracoes.view', roles: ['owner', 'admin'] },
            ]
        },
        {
            title: 'Super Admin Nhiquela',
            items: [
                { name: 'Gestão de Subscrições', icon: <FiCreditCard />, path: '/superadmin-subscriptions', roles: ['super_admin'], badge: pendingSubsCount },
                { name: 'Pacotes & Contas Nhiquela', icon: <FiPackage />, path: '/superadmin-packages', roles: ['super_admin'], badge: pendingSubsCount },
                { name: 'Emails de Pagamento', icon: <FiMail />, path: '/superadmin-emails', roles: ['super_admin'] },
                { name: 'Dashboard Global', icon: <FiBarChart2 />, path: '/global-dashboard', roles: ['super_admin'] },
                { name: 'Instituições', icon: <FiServer />, path: '/institution-management', roles: ['super_admin'] },
                { name: 'Utilizadores', icon: <FiUsers />, path: '/users', roles: ['super_admin'] },
            ]
        }
    ];

    const toggleSidebar = () => setIsCollapsed(!isCollapsed);

    const daysColor = isExpired ? '#f87171' : remainingDays <= 5 ? '#fbbf24' : '#4ade80';

    return (
        <aside className="sidebar" style={{
            width: isCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--sidebar-bg)',
            borderRight: '1px solid var(--sidebar-border)',
            transition: 'width 0.2s ease',
            zIndex: 1000,
            overflowX: 'hidden'
        }}>
            {/* Header / Logo */}
            <div style={{
                padding: isCollapsed ? '1.25rem 0.5rem' : '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'space-between',
                borderBottom: '1px solid var(--sidebar-border)',
                minHeight: '68px'
            }}>
                {!isCollapsed && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            flexShrink: 0,
                            background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            {activeInst?.settings?.appearance?.logoUrl ? (
                                <img
                                    src={`${api.defaults.baseURL.replace('/api', '')}${activeInst.settings.appearance.logoUrl}`}
                                    alt="Logo"
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                />
                            ) : (
                                <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.95rem' }}>
                                    {(activeInst?.name || 'NH').substring(0, 2).toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap', color: '#ffffff', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                {user?.role === 'super_admin' ? 'NHIQUELA CENTRAL' : (activeInst?.name || 'Microcrédito')}
                            </div>
                            <span style={{ fontSize: '0.7rem', color: '#38bdf8', letterSpacing: '0.04em' }}>
                                {user?.role === 'super_admin' ? 'SUPER ADMIN' : (subscription?.packageName || subscription?.plan || 'MICROCRÉDITO').toUpperCase()}
                            </span>
                        </div>
                    </div>
                )}
                <button
                    onClick={toggleSidebar}
                    style={{
                        background: 'transparent',
                        color: 'var(--sidebar-text)',
                        padding: '0.45rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                    className="sidebar-toggle"
                >
                    {isCollapsed ? <FiMenu size={18} /> : <FiChevronLeft size={18} />}
                </button>
            </div>

            {/* Institution Switcher */}
            {!isCollapsed && user?.role !== 'super_admin' && (
                <div style={{ padding: '0.75rem 1rem 0' }}>
                    <InstitutionSwitcher />
                </div>
            )}

            {/* Cartão de Subscrição & Dias Restantes (para instituições) */}
            {!isCollapsed && user?.role !== 'super_admin' && activeInst && (
                <div style={{ padding: '0.75rem 1rem 0' }}>
                    <NavLink
                        to="/my-subscription"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.6rem 0.75rem',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: `1px solid ${daysColor}55`,
                            textDecoration: 'none',
                            color: '#ffffff'
                        }}
                    >
                        <div>
                            <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                                {subscription?.packageName || subscription?.plan || 'Plano'}
                            </div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: daysColor }}>
                                {isExpired ? 'Subscrição Expirada' : `${remainingDays} dia(s) restante(s)`}
                            </div>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 600 }}>Gerir →</span>
                    </NavLink>
                </div>
            )}

            {/* Navigation */}
            <nav style={{ flex: 1, padding: '1rem 0.65rem', overflowY: 'auto', overflowX: 'hidden' }}>
                {sections.map((section, idx) => {
                    const visibleItems = section.items.filter(item => {
                        if (user?.role === 'super_admin') {
                            return item.roles && item.roles.includes('super_admin');
                        }
                        const roleAllowed = item.permission
                            ? hasPermission(item.permission)
                            : (item.roles ? item.roles.includes(user?.role) : false);
                        if (!roleAllowed) return false;
                        if (item.feature && !hasFeature(item.feature)) {
                            // Proprietário vê o item bloqueado com cadeado para saber do upgrade; demais perfis não veem
                            return user?.role === 'owner';
                        }
                        return true;
                    });
                    if (visibleItems.length === 0) return null;

                    return (
                        <div key={idx} style={{ marginBottom: '1.25rem' }}>
                            {!isCollapsed && (
                                <p style={{
                                    paddingLeft: '0.75rem',
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    color: '#64748b',
                                    marginBottom: '0.4rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.06em'
                                }}>
                                    {section.title}
                                </p>
                            )}
                            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                {visibleItems.map((item) => {
                                    const featureLocked = item.feature && !hasFeature(item.feature) && user?.role !== 'super_admin';
                                    const blockedBySub = (isExpired && item.path !== '/my-subscription') || featureLocked;

                                    return (
                                    <li key={item.path + item.name}>
                                        <NavLink
                                            to={featureLocked ? '/my-subscription' : item.path}
                                            onClick={(e) => {
                                                if (isExpired && item.path !== '/my-subscription') {
                                                    e.preventDefault();
                                                }
                                            }}
                                            title={featureLocked ? 'Funcionalidade não incluída no pacote actual. Clique para fazer upgrade.' : item.name}
                                            style={({ isActive }) => ({
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: isCollapsed ? 'center' : 'space-between',
                                                padding: '0.65rem 0.85rem',
                                                borderRadius: '8px',
                                                textDecoration: 'none',
                                                color: blockedBySub ? '#64748b' : (isActive ? '#38bdf8' : '#cbd5e1'),
                                                background: isActive && !featureLocked ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                                                fontWeight: isActive && !featureLocked ? 600 : 400,
                                                fontSize: '0.875rem',
                                                position: 'relative',
                                                opacity: blockedBySub ? 0.55 : 1,
                                                cursor: (isExpired && item.path !== '/my-subscription') ? 'not-allowed' : 'pointer'
                                            })}
                                            className={({ isActive }) => isActive && !featureLocked ? 'sidebar-link active' : 'sidebar-link'}
                                        >
                                            {({ isActive }) => (
                                                <>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: isCollapsed ? '0' : '0.75rem', overflow: 'hidden', position: 'relative' }}>
                                                        <span style={{ fontSize: '1.05rem', display: 'flex', flexShrink: 0, color: isActive && !featureLocked ? '#38bdf8' : 'inherit', position: 'relative' }}>
                                                            {item.icon}
                                                            {isCollapsed && item.badge > 0 && (
                                                                <span style={{
                                                                    position: 'absolute',
                                                                    top: '-6px',
                                                                    right: '-8px',
                                                                    background: '#ef4444',
                                                                    color: '#fff',
                                                                    fontSize: '0.62rem',
                                                                    fontWeight: 800,
                                                                    padding: '0 4px',
                                                                    minWidth: '15px',
                                                                    height: '15px',
                                                                    borderRadius: '9999px',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                }}>
                                                                    {item.badge > 99 ? '99+' : item.badge}
                                                                </span>
                                                            )}
                                                        </span>
                                                        {!isCollapsed && <span style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{item.name}</span>}
                                                    </span>
                                                    {!isCollapsed && featureLocked && <FiLock size={13} color="#f59e0b" />}
                                                    {!isCollapsed && item.badge > 0 && (
                                                        <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '1px 6px', borderRadius: '9999px' }}>
                                                            {item.badge}
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </NavLink>
                                    </li>
                                    );
                                })}
                            </ul>
                        </div>
                    );
                })}
            </nav>

            {/* Footer / User Profile */}
            <div style={{
                padding: isCollapsed ? '0.85rem 0.5rem' : '1rem',
                borderTop: '1px solid var(--sidebar-border)',
                background: 'var(--sidebar-footer-bg)'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isCollapsed ? '0' : '0.75rem',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    marginBottom: isCollapsed ? '0' : '0.85rem'
                }}>
                    <div style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        background: user?.role === 'super_admin' ? '#f59e0b' : '#38bdf8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        color: '#0f172a',
                        flexShrink: 0
                    }}>{user?.name?.charAt(0)}</div>
                    {!isCollapsed && (
                        <div style={{ overflow: 'hidden' }}>
                            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</p>
                            <p style={{ fontSize: '0.72rem', color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{user?.role}</p>
                        </div>
                    )}
                </div>

                {!isCollapsed ? (
                    <button
                        onClick={logout}
                        className="btn-danger"
                        style={{ width: '100%', padding: '0.55rem' }}
                    >
                        <FiLogOut size={15} /> Sair do Sistema
                    </button>
                ) : (
                    <button
                        onClick={logout}
                        className="btn-danger"
                        style={{ width: '36px', height: '36px', padding: 0, margin: '0.5rem auto 0' }}
                    >
                        <FiLogOut size={16} />
                    </button>
                )}
            </div>

            <style>{`
                .sidebar { scrollbar-width: none; }
                .sidebar::-webkit-scrollbar { width: 0; display: none; }
                .sidebar-toggle:hover {
                    background: rgba(255, 255, 255, 0.08) !important;
                    color: #ffffff !important;
                }
                @media (max-width: 1024px) {
                    .sidebar { width: var(--sidebar-collapsed-width) !important; }
                }
            `}</style>
        </aside>
    );
};

export default Sidebar;
