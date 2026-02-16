import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import {
    FiHome, FiUsers, FiDollarSign, FiBarChart2, FiActivity,
    FiSettings, FiLogOut, FiBriefcase, FiTrendingUp,
    FiSmartphone, FiFileText, FiMessageCircle, FiChevronLeft, FiMenu
} from 'react-icons/fi';
import InstitutionSwitcher from './InstitutionSwitcher';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const [isCollapsed, setIsCollapsed] = React.useState(false);

    // Auto-collapse on smaller screens
    React.useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setIsCollapsed(true);
            } else {
                setIsCollapsed(false);
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Initial check

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Update CSS variable for layout stability
    React.useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--sidebar-width', isCollapsed ? 'var(--sidebar-collapsed-width)' : '260px');
    }, [isCollapsed]);

    const sections = [
        {
            title: 'Operacional',
            roles: ['owner', 'manager', 'agent'],
            items: [
                { name: 'Dashboard', icon: <FiHome />, path: '/dashboard', roles: ['owner', 'manager', 'agent'] },
                { name: 'Clientes', icon: <FiUsers />, path: '/clients', roles: ['owner', 'manager', 'agent'] },
                { name: 'Empréstimos', icon: <FiBriefcase />, path: '/loans', roles: ['owner', 'manager', 'agent'] },
                { name: 'Cobranças', icon: <FiDollarSign />, path: '/payments', roles: ['owner', 'manager', 'agent'] },
            ]
        },
        {
            title: 'Controle',
            roles: ['owner', 'manager'],
            items: [
                { name: 'Global View', icon: <FiBarChart2 />, path: '/global-dashboard', roles: ['owner'] },
                { name: 'Documentos', icon: <FiFileText />, path: '/pending-documents', roles: ['owner', 'manager'] },
                { name: 'Contratos', icon: <FiFileText />, path: '/contract-templates', roles: ['owner', 'manager'] },
                { name: 'Relatórios', icon: <FiTrendingUp />, path: '/reports', roles: ['owner', 'manager'] },
                { name: 'Comissões', icon: <FiDollarSign />, path: '/commissions', roles: ['owner', 'manager'] },
                { name: 'Meus Ganhos', icon: <FiTrendingUp />, path: '/my-commissions', roles: ['agent'] },
            ]
        },
        {
            title: 'Sistema',
            roles: ['owner', 'manager'],
            items: [
                { name: 'WhatsApp', icon: <FiMessageCircle />, path: '/whatsapp-settings', roles: ['owner', 'manager'] },
                { name: 'SMS Logs', icon: <FiSmartphone />, path: '/sms-logs', roles: ['owner', 'manager'] },
                { name: 'Auditoria', icon: <FiActivity />, path: '/audit-logs', roles: ['owner'] },
                { name: 'Performance', icon: <FiTrendingUp />, path: '/agent-performance', roles: ['owner', 'manager'] },
                { name: 'Configurações', icon: <FiSettings />, path: '/settings', roles: ['owner'] },
            ]
        }
    ];

    const toggleSidebar = () => setIsCollapsed(!isCollapsed);

    return (
        <aside className="sidebar" style={{
            width: isCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-card)',
            borderRight: '1px solid rgba(255, 255, 255, 0.05)',
            transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 1000,
            overflowX: 'hidden'
        }}>
            {/* Header / Logo */}
            <div style={{
                padding: isCollapsed ? '1.5rem 0.5rem' : '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'space-between',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                minHeight: '70px'
            }}>
                {!isCollapsed && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            background: 'var(--accent)',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            flexShrink: 0
                        }}>
                            <FiTrendingUp size={18} />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '1rem', whiteSpace: 'nowrap', color: 'white' }}>
                            {user?.institution?.name || 'Microcrédito'}
                        </span>
                    </div>
                )}
                <button
                    onClick={toggleSidebar}
                    style={{
                        background: 'transparent',
                        color: 'var(--text-muted)',
                        padding: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '6px'
                    }}
                    className="sidebar-toggle"
                >
                    {isCollapsed ? <FiMenu size={20} /> : <FiChevronLeft size={20} />}
                </button>
            </div>

            {/* Institution Switcher (Grouped with header conceptually) */}
            {!isCollapsed && (
                <div style={{ padding: '1rem' }}>
                    <InstitutionSwitcher />
                </div>
            )}

            {/* Navigation */}
            <nav style={{ flex: 1, padding: '1rem 0.5rem', overflowY: 'auto', overflowX: 'hidden' }}>
                {sections.map((section, idx) => {
                    const visibleItems = section.items.filter(item => item.roles.includes(user?.role));
                    if (visibleItems.length === 0) return null;

                    return (
                        <div key={idx} style={{ marginBottom: '1.5rem' }}>
                            {!isCollapsed && (
                                <p style={{
                                    paddingLeft: '1rem',
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    color: 'var(--text-muted)',
                                    marginBottom: '0.5rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    {section.title}
                                </p>
                            )}
                            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                {visibleItems.map((item) => (
                                    <li key={item.path}>
                                        <NavLink
                                            to={item.path}
                                            style={({ isActive }) => ({
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: isCollapsed ? '0' : '0.875rem',
                                                justifyContent: isCollapsed ? 'center' : 'flex-start',
                                                padding: '0.75rem 1rem',
                                                borderRadius: '8px',
                                                textDecoration: 'none',
                                                color: isActive ? 'white' : 'var(--text-muted)',
                                                background: isActive ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                                                transition: 'all 0.2s ease',
                                                fontWeight: isActive ? 600 : 500,
                                                fontSize: '0.9rem',
                                                position: 'relative'
                                            })}
                                            className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}
                                        >
                                            <span style={{ fontSize: '1.1rem', display: 'flex', flexShrink: 0 }}>{item.icon}</span>
                                            {!isCollapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.name}</span>}

                                            {/* Active indicator bar */}
                                            {!isCollapsed && (
                                                <div className="active-indicator" style={{
                                                    position: 'absolute',
                                                    left: '0',
                                                    top: '20%',
                                                    bottom: '20%',
                                                    width: '3px',
                                                    background: 'var(--accent)',
                                                    borderRadius: '0 4px 4px 0',
                                                    opacity: 0,
                                                    transition: 'opacity 0.2s'
                                                }} />
                                            )}
                                        </NavLink>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    );
                })}
            </nav>

            {/* Footer / User Profile */}
            <div style={{
                padding: isCollapsed ? '1rem 0.5rem' : '1.25rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                background: 'rgba(0,0,0,0.1)'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isCollapsed ? '0' : '0.75rem',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    marginBottom: isCollapsed ? '0' : '1rem'
                }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        color: 'white',
                        flexShrink: 0
                    }}>{user?.name?.charAt(0)}</div>
                    {!isCollapsed && (
                        <div style={{ overflow: 'hidden' }}>
                            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</p>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{user?.role}</p>
                        </div>
                    )}
                </div>

                {!isCollapsed && (
                    <button
                        onClick={logout}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            padding: '0.6rem',
                            borderRadius: '6px',
                            background: 'rgba(239, 68, 68, 0.05)',
                            color: 'var(--danger)',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            border: '1px solid rgba(239, 68, 68, 0.1)'
                        }}
                        className="btn-logout"
                    >
                        <FiLogOut size={16} /> Sair
                    </button>
                )}
                {isCollapsed && (
                    <button
                        onClick={logout}
                        style={{
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--danger)',
                            marginTop: '1rem',
                            background: 'rgba(239, 68, 68, 0.05)',
                            borderRadius: '6px'
                        }}
                    >
                        <FiLogOut size={18} />
                    </button>
                )}
            </div>

            <style>{`
                .sidebar { scrollbar-width: none; }
                .sidebar::-webkit-scrollbar { width: 0; display: none; }
                
                .sidebar-link:hover:not(.active) {
                    background: rgba(255, 255, 255, 0.03);
                    color: white;
                }
                
                .sidebar-link.active .active-indicator {
                    opacity: 1 !important;
                }
                
                .sidebar-toggle:hover {
                    background: rgba(255, 255, 255, 0.05) !important;
                    color: white !important;
                }
                
                .btn-logout:hover {
                    background: rgba(239, 68, 68, 0.1) !important;
                    border-color: rgba(239, 68, 68, 0.2) !important;
                }

                @media (max-width: 1024px) {
                    .sidebar {
                        width: var(--sidebar-collapsed-width) !important;
                    }
                }
            `}</style>
        </aside>
    );
};

export default Sidebar;
