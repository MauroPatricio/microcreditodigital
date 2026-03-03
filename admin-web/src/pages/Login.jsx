import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { FiLock, FiMail, FiTrendingUp, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';

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
        try {
            const res = await login(email, password);
            if (res.success) {
                navigate('/dashboard');
            } else {
                setError(res.message);
            }
        } catch (err) {
            setError('Ocorreu um erro ao tentar entrar. Verifique sua conexão.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: '#04040e', // Darker background for neon contrast
            fontFamily: "'Inter', sans-serif",
            padding: '1rem',
            overflow: 'hidden'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '380px',
                padding: '2rem 2rem',
                borderRadius: '24px',
                background: '#0d0d1f', // Dark card background
                boxShadow: '0 0 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(59, 130, 246, 0.1)', // General shadow + subtle neon
                border: '1px solid rgba(59, 130, 246, 0.15)', // Neon border glow
                textAlign: 'center'
            }}>
                {/* Logo Icon */}
                <div
                    className="login-logo-neon"
                    style={{
                        width: '56px',
                        height: '56px',
                        margin: '0 auto 0.75rem',
                        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', // Blue like image
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 25px rgba(59, 130, 246, 0.5)', // Neon glow on logo
                        transition: 'background 0.3s ease, box-shadow 0.3s ease'
                    }}>
                    <FiTrendingUp size={28} color="white" />
                </div>

                <h1 style={{
                    fontSize: '1.25rem',
                    fontWeight: '800',
                    color: 'var(--text-main)',
                    marginBottom: '0.15rem',
                    letterSpacing: '-0.5px',
                    textShadow: '0 0 15px rgba(59, 130, 246, 0.3)' // Text neon glow
                }}>
                    Microcrédito<span style={{ color: '#3b82f6', textShadow: '0 0 20px rgba(59, 130, 246, 0.6)' }}>Digital</span>
                </h1>

                <p style={{
                    color: '#94a3b8',
                    marginBottom: '1.5rem',
                    fontSize: '0.6rem',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                }}>
                    SISTEMA DE GESTÃO DE MICROCRÉDITOS
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Email Input */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.65rem', fontWeight: '800', color: '#64748b', letterSpacing: '1px' }}>
                            E-MAIL
                        </label>
                        <div style={{ position: 'relative', width: '100%' }}>
                            <div style={{
                                position: 'absolute',
                                left: '1rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#64748b'
                            }}>
                                <FiMail size={16} />
                            </div>
                            <input
                                type="email"
                                placeholder="admin@microcredito.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.8rem 1rem 0.8rem 2.5rem',
                                    background: '#13132b',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    borderRadius: '10px',
                                    color: 'var(--text-main)',
                                    fontSize: '0.9rem',
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                                }}
                                className="login-input-neon"
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.4rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                            <label style={{ fontSize: '0.65rem', fontWeight: '800', color: '#64748b', letterSpacing: '1px' }}>
                                PASSWORD
                            </label>
                            <Link
                                to="/forgot-password"
                                style={{
                                    color: '#3b82f6',
                                    textDecoration: 'none',
                                    fontSize: '0.65rem',
                                    fontWeight: '800',
                                    textShadow: '0 0 10px rgba(59, 130, 246, 0.4)'
                                }}
                            >
                                ESQUECEU?
                            </Link>
                        </div>
                        <div style={{ position: 'relative', width: '100%' }}>
                            <div style={{
                                position: 'absolute',
                                left: '1rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#64748b'
                            }}>
                                <FiLock size={16} />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.8rem 2.5rem 0.8rem 2.5rem',
                                    background: '#13132b',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    borderRadius: '10px',
                                    color: 'var(--text-main)',
                                    fontSize: '0.9rem',
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                                }}
                                className="login-input-neon"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '0.8rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: '#64748b',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="login-btn-neon"
                        style={{
                            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)', // Blue/Purple gradient
                            color: 'var(--text-main)',
                            padding: '0.9rem',
                            borderRadius: '10px',
                            fontSize: '0.95rem',
                            fontWeight: '700',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            marginTop: '0.5rem',
                            transition: 'background 0.3s ease, box-shadow 0.3s ease, transform 0.1s ease-out',
                            boxShadow: '0 0 25px rgba(99, 102, 241, 0.6)' // Strong neon glow
                        }}
                        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        {loading ? 'Carregando...' : (
                            <>
                                Fazer login <span style={{ fontSize: '1.1rem', marginLeft: '4px' }}></span>
                            </>
                        )}
                    </button>
                </form>

                {error && (
                    <div style={{
                        marginTop: '1rem',
                        padding: '0.8rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        color: '#f87171',
                        borderRadius: '10px',
                        fontSize: '0.85rem'
                    }}>
                        {error}
                    </div>
                )}

                <div style={{ marginTop: '1.25rem' }}>
                    <Link
                        to="/register-owner"
                        style={{
                            color: '#3b82f6',
                            textDecoration: 'none',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}
                    >
                        <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>[+]</span> NOVO CADASTRO
                    </Link>
                </div>

                <div style={{
                    marginTop: '1.75rem',
                    paddingTop: '1.25rem',
                    borderTop: '1px solid rgba(255,255,255,0.05)'
                }}>

                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: '#04040e',
                        padding: '0.5rem',
                        borderRadius: '8px',
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        color: '#94a3b8',
                        maxWidth: 'max-content',
                        margin: '0 auto',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        boxShadow: '0 0 10px rgba(59, 130, 246, 0.1)'
                    }}>
                        <span style={{ color: '#3b82f6' }}>DESENVOLVIDO POR NHIQUELA SERVIÇOS & CONSULTORIA, LDA</span>

                    </div>
                </div>
            </div>


            <style>{`
                .login-input-neon:focus {
                    border-color: #3b82f6 !important;
                    background: #1a1a35 !important;
                    box-shadow: 0 0 15px rgba(59, 130, 246, 0.3) !important;
                }
                .login-logo-neon:hover {
                    background: linear-gradient(135deg, #2563eb 0%, #60a5fa 100%) !important;
                    box-shadow: 0 0 35px rgba(59, 130, 246, 0.8) !important;
                }
                .login-btn-neon:hover {
                    background: linear-gradient(135deg, #3b82f6 0%, #a78bfa 100%) !important;
                    box-shadow: 0 0 35px rgba(139, 92, 246, 0.8) !important;
                }
            `}</style>
        </div>
    );
};

export default Login;
