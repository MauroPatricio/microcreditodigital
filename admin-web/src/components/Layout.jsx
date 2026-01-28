import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
    return (
        <div style={{ display: 'flex' }}>
            <Sidebar />
            <main style={{
                flex: 1,
                marginLeft: 'var(--sidebar-width)',
                padding: '2rem',
                minHeight: '100vh',
                background: 'var(--bg-main)'
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
