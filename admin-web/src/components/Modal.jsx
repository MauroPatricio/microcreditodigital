import React from 'react';
import { FiX, FiAlertCircle, FiCheckCircle, FiInfo } from 'react-icons/fi';

const Modal = ({ isOpen, onClose, title, message, type = 'error' }) => {
    if (!isOpen) return null;

    const icons = {
        success: <FiCheckCircle size={48} color="#10b981" />,
        error: <FiAlertCircle size={48} color="#ef4444" />,
        info: <FiInfo size={48} color="#3b82f6" />
    };

    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6'
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            background: 'rgba(2, 6, 23, 0.8)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            animation: 'modalFadeIn 0.3s ease-out'
        }}>
            <div className="glass" style={{
                width: '100%',
                maxWidth: '450px',
                padding: '2.5rem',
                borderRadius: '32px',
                textAlign: 'center',
                position: 'relative',
                animation: 'modalScaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '1.5rem',
                        right: '1.5rem',
                        background: 'none',
                        border: 'none',
                        color: 'rgba(255, 255, 255, 0.4)',
                        cursor: 'pointer',
                        padding: '0.5rem',
                        borderRadius: '50%',
                        display: 'flex',
                        transition: 'all 0.2s',
                        zIndex: 2
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)'}
                >
                    <FiX size={20} />
                </button>

                <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        background: `${colors[type]}15`,
                        borderRadius: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `1px solid ${colors[type]}33`
                    }}>
                        {icons[type]}
                    </div>
                </div>

                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem', letterSpacing: '-0.5px' }}>
                    {title}
                </h2>

                <p style={{ color: 'rgba(255, 255, 255, 0.6)', lineHeight: '1.6', marginBottom: '2rem', fontSize: '1rem' }}>
                    {message}
                </p>

                <button
                    onClick={onClose}
                    className="btn-primary"
                    style={{
                        width: '100%',
                        padding: '1.1rem',
                        borderRadius: '16px',
                        fontSize: '1rem',
                        fontWeight: 700,
                        background: colors[type],
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        boxShadow: `0 10px 20px -5px ${colors[type]}40`,
                        transition: 'all 0.3s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    Entendido
                </button>
            </div>

            <style>{`
                @keyframes modalFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes modalScaleIn {
                    from { transform: scale(0.9); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default Modal;
