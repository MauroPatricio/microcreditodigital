import React from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FiMoon, FiSun } from 'react-icons/fi';

const Layout = ({ children }) => {
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();
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
                    {/* Placeholder para notificações / busca se necessário */}
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
                {children}
            </main>
        </div>
    );
};

export default Layout;
