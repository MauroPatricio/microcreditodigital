import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiCreditCard, FiArrowLeft, FiCheck } from 'react-icons/fi';
import api from '../api';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [resetToken, setResetToken] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await api.post('/auth/forgot-password', { email });
            if (res.data.success) {
                setSuccess(true);
                // Em desenvolvimento, mostrar o token
                if (res.data.token) {
                    setResetToken(res.data.token);
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Erro ao processar solicitação');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                background: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)',
                padding: '1rem'
            }}>
                <div className="glass" style={{
                    width: '100%',
                    maxWidth: '420px',
                    padding: '3rem 2.5rem',
                    borderRadius: '24px',
                    textAlign: 'center'
                }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        background: '#10b981',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.8rem',
                        color: 'white',
                        margin: '0 auto 1.5rem'
                    }}>
                        <FiCheck />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Email Enviado!</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                        Se o email existir no sistema, você receberá instruções para redefinir sua senha.
                    </p>

                    {resetToken && (
                        <div style={{
                            background: 'rgba(59, 130, 246, 0.1)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: '12px',
                            padding: '1rem',
                            marginBottom: '1.5rem'
                        }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                Modo de Desenvolvimento - Token:
                            </p>
                            <Link
                                to={`/reset-password/${resetToken}`}
                                style={{
                                    color: 'var(--accent)',
                                    fontSize: '0.9rem',
                                    wordBreak: 'break-all',
                                    textDecoration: 'none',
                                    fontWeight: 600
                                }}
                            >
                                Redefinir senha →
                            </Link>
                        </div>
                    )}

                    <Link
                        to="/login"
                        className="btn-primary"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            textDecoration: 'none'
                        }}
                    >
                        <FiArrowLeft />
                        Voltar ao Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            background: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)',
            padding: '1rem'
        }}>
            <div className="glass" style={{
                width: '100%',
                maxWidth: '420px',
                padding: '3rem 2.5rem',
                borderRadius: '24px',
                textAlign: 'center'
            }}>
                <div style={{
                    width: '60px',
                    height: '60px',
                    background: 'var(--accent)',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.8rem',
                    color: 'white',
                    margin: '0 auto 1.5rem'
                }}>
                    <FiCreditCard />
                </div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>Esqueceu a Senha?</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '0.95rem' }}>
                    Sem problema! Digite seu email e enviaremos as instruções.
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ position: 'relative' }}>
                        <FiMail style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="email"
                            placeholder="Email institucional"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '1rem 1rem 1rem 3rem',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                color: 'white',
                                fontSize: '0.95rem'
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary"
                        style={{
                            marginTop: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        {loading ? 'Enviando...' : 'Enviar Instruções'}
                    </button>
                </form>

                {error && (
                    <div style={{
                        marginTop: '1.5rem',
                        padding: '0.75rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: 'var(--danger)',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        fontWeight: 500
                    }}>
                        {error}
                    </div>
                )}

                <Link
                    to="/login"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        marginTop: '2rem',
                        color: 'var(--text-muted)',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.color = 'var(--accent)'}
                    onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
                >
                    <FiArrowLeft />
                    Voltar ao Login
                </Link>
            </div>
        </div>
    );
};

export default ForgotPassword;
