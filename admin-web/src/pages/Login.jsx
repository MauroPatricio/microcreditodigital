import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

import { FiLock, FiMail, FiCreditCard, FiEye, FiEyeOff } from 'react-icons/fi';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const res = await login(email, password);
        setLoading(false);
        if (res.success) {
            navigate('/dashboard');
        } else {
            setError(res.message);
        }
    };

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
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>CrediSmart+</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '0.95rem' }}>Gestão Inteligente de Microcrédito</p>

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
                    <div style={{ position: 'relative' }}>
                        <FiLock style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Senha de acesso"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '1rem 3rem 1rem 3rem',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                color: 'white',
                                fontSize: '0.95rem'
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute',
                                right: '1rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                        >
                            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                        </button>
                    </div>

                    <Link
                        to="/forgot-password"
                        style={{
                            textAlign: 'right',
                            color: 'var(--accent)',
                            textDecoration: 'none',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            transition: 'opacity 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                        onMouseLeave={(e) => e.target.style.opacity = '1'}
                    >
                        Esqueceu a senha?
                    </Link>

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
                        {loading ? 'Entrando...' : 'Entrar no Sistema'}
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

                <div style={{
                    marginTop: '2rem',
                    paddingTop: '1.5rem',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    textAlign: 'center'
                }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                        Ainda não tem conta?
                    </p>
                    <Link
                        to="/register-owner"
                        style={{
                            color: 'var(--accent)',
                            textDecoration: 'none',
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            transition: 'opacity 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                        onMouseLeave={(e) => e.target.style.opacity = '1'}
                    >
                        Criar nova conta →
                    </Link>
                </div>

                <div style={{ marginTop: '2.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Desenvolvido por <a href="#" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Nhiquela Servicos e Consultoria, LDA</a>
                </div>
            </div>
        </div>
    );
};

export default Login;
