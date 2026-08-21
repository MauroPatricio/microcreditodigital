import React from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FiMoon, FiSun, FiAlertTriangle, FiLock } from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';

const Layout = ({ children }) => {
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const primaryColor = user?.institution?.settings?.appearance?.primaryColor || '#00FF00';

    // Função para escurecer a cor (para hover states)
    const darkenColor = (hex, percent) => {
        const num = parseInt(hex.replace('#', ''), 16),
            amt = Math.round(2.55 * percent),
            R = (num >> 16) - amt,
            G = (num >> 8 & 0x00FF) - amt,
            B = (num & 0x0000FF) - amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    };

    const accentHover = darkenColor(primaryColor, 15);

    // Calculate subscription status
    const subscription = user?.institution?.subscription;
    const expiresAt = subscription?.expiresAt ? new Date(subscription.expiresAt) : null;
    const now = new Date();
    const remainingDays = expiresAt ? Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)) : 0;
    const isExpired = subscription?.status === 'expired' || remainingDays <= 0;
    const isMySubscriptionPage = location.pathname === '/my-subscription';

    return (
        <div style={{ display: 'flex' }}>
            <style>{`
                :root {
                    --accent: ${primaryColor};
                    --accent-hover: ${accentHover};
                    --primary: ${primaryColor};
                }
            `}</style>
            <Sidebar />
            <main style={{
                flex: 1,
                marginLeft: 'var(--sidebar-width)',
                padding: '2rem',
                minHeight: '100vh',
                background: 'var(--bg-main)',
                transition: 'margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s ease'
            }}>
                <header style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginBottom: '2rem',
                    alignItems: 'center',
                    gap: '1rem' // Added gap
                }}>
                    <button
                        onClick={toggleTheme}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-light)',
                            color: theme === 'dark' ? '#FBBF24' : '#6B7280', // Yellow for dark mode to indicate sun
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: theme === 'dark' ? '0 0 10px rgba(251, 191, 36, 0.2)' : '0 2px 5px rgba(0,0,0,0.05)'
                        }}
                        title={theme === 'dark' ? 'Mudar para Light Mode' : 'Mudar para Dark Mode'}
                        onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            if (theme === 'light') e.currentTarget.style.color = '#111827';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            if (theme === 'light') e.currentTarget.style.color = '#6B7280';
                        }}
                    >
                        {theme === 'dark' ? <FiSun size={20} /> : <FiMoon size={20} />}
                    </button>
                    
                    {/* Subscription Badge */}
                    {subscription && !isExpired && (
                        <div style={{
                            padding: '0.5rem 1rem',
                            background: remainingDays <= 7 ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-card)',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            color: remainingDays <= 7 ? 'var(--danger)' : 'var(--text-main)',
                            border: `1px solid ${remainingDays <= 7 ? 'rgba(239, 68, 68, 0.2)' : 'var(--border-light)'}`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            {remainingDays <= 7 && <FiAlertTriangle />}
                            {remainingDays} dias restantes
                        </div>
                    )}

                    {/* Data Atual */}
                    <div style={{
                        padding: '0.5rem 1rem',
                        background: 'var(--bg-card)',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border-light)',
                        transition: 'var(--theme-transition)'
                    }}>
                        {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </header>

                {isExpired && !isMySubscriptionPage && user?.role !== 'super_admin' ? (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '70vh',
                        background: 'var(--bg-card-solid)',
                        borderRadius: '16px',
                        border: '1px solid var(--border-light)',
                        padding: '3rem',
                        textAlign: 'center',
                        animation: 'fadeIn 0.5s ease'
                    }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            background: 'rgba(239, 68, 68, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '1.5rem'
                        }}>
                            <FiLock size={40} color="var(--danger)" />
                        </div>
                        <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1rem' }}>Subscrição Expirada</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '500px', marginBottom: '2.5rem', lineHeight: 1.6 }}>
                            A subscrição da sua instituição terminou. Para continuar a utilizar todas as funcionalidades da plataforma de Microcrédito Digital, por favor, proceda à renovação.
                        </p>
                        <button
                            className="btn-primary"
                            onClick={() => navigate('/my-subscription')}
                            style={{ padding: '1rem 3rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                        >
                            Renovar Agora
                        </button>
                    </div>
                ) : (
                    children
                )}
            </main>
        </div>
    );
};

export default Layout;
