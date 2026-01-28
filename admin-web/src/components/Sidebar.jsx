import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    FiHome, FiUsers, FiDollarSign, FiBarChart2,
    FiSettings, FiLogOut, FiBriefcase, FiCreditCard
} from 'react-icons/fi';

const Sidebar = () => {
    const { user, logout } = useAuth();

    const menuItems = [
        { name: 'Dashboard', icon: <FiHome />, path: '/dashboard', roles: ['owner', 'manager', 'agent'] },
        { name: 'Clientes', icon: <FiUsers />, path: '/clients', roles: ['owner', 'manager', 'agent'] },
        { name: 'Empréstimos', icon: <FiBriefcase />, path: '/loans', roles: ['owner', 'manager', 'agent'] },
        { name: 'Cobranças', icon: <FiDollarSign />, path: '/payments', roles: ['owner', 'manager', 'agent'] },
        { name: 'Relatórios', icon: <FiBarChart2 />, path: '/reports', roles: ['owner', 'manager'] },
        { name: 'Minha Instituição', icon: <FiSettings />, path: '/settings', roles: ['owner'] },
    ];

    const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role));

    return (
        <aside className="sidebar glass" style={{
            width: 'var(--sidebar-width)',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000
        }}>
            <div className="sidebar-header" style={{
                padding: '2rem 1.5rem',
                borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        background: 'var(--accent)',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '1.2rem'
                    }}><FiCreditCard /></div>
                    <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.5px' }}>CrediSmart+</span>
                </div>
                <div style={{
                    marginTop: '1.5rem',
                    padding: '0.75rem',
                    background: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    color: 'var(--accent)',
                    fontWeight: 600,
                    textTransform: 'uppercase'
                }}>
                    {user?.institution?.name || 'Gestão Digital'}
                </div>
            </div>

            <nav style={{ flex: 1, padding: '1.5rem 0.75rem' }}>
                <ul style={{ listStyle: 'none' }}>
                    {filteredMenu.map((item) => (
                        <li key={item.path} style={{ marginBottom: '0.5rem' }}>
                            <NavLink
                                to={item.path}
                                style={({ isActive }) => ({
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '0.875rem 1rem',
                                    borderRadius: '12px',
                                    textDecoration: 'none',
                                    color: isActive ? 'white' : 'var(--text-muted)',
                                    background: isActive ? 'var(--accent)' : 'transparent',
                                    transition: 'var(--transition)',
                                    fontWeight: isActive ? 600 : 500
                                })}
                            >
                                <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                                <span>{item.name}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="sidebar-footer" style={{
                padding: '1.5rem',
                borderTop: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'var(--primary-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem',
                        fontWeight: 700
                    }}>{user?.name?.charAt(0)}</div>
                    <div style={{ overflow: 'hidden' }}>
                        <p style={{ fontSize: '0.9rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user?.role}</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: 'var(--danger)',
                        fontSize: '0.9rem',
                        fontWeight: 600
                    }}
                >
                    <FiLogOut /> Sair
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
