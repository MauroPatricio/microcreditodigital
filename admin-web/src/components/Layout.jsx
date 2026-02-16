import React from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
    const { user } = useAuth();
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
                transition: 'margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
                <header style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginBottom: '2rem',
                    alignItems: 'center'
                }}>
                    {/* Placeholder para notificações / busca se necessário */}
                    <div style={{
                        padding: '0.5rem 1rem',
                        background: 'var(--bg-card)',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        color: 'var(--text-muted)',
                        border: '1px solid rgba(255,255,255,0.05)'
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
