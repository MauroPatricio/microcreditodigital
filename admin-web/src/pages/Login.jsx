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
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: '#050511', // Very dark blue/black
            fontFamily: "'Inter', sans-serif"
        }}>
            <div style={{
                width: '100%',
                maxWidth: '420px',
                padding: '2.5rem',
                borderRadius: '32px',
                background: '#0a0a1a', // Slightly lighter card bg
                boxShadow: '0 0 50px rgba(0,0,0,0.5), 0 0 30px rgba(0, 230, 118, 0.1)', // Added neon glow
                border: '1px solid rgba(0, 230, 118, 0.1)', // Subtle green border
                textAlign: 'center'
            }}>
                {/* Logo Icon */}
                <div style={{
                    width: '80px',
                    height: '80px',
                    margin: '0 auto 1.5rem',
                    background: 'linear-gradient(135deg, #00C853 0%, #009624 100%)', // Neon Green gradient
                    borderRadius: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 40px rgba(0, 230, 118, 0.4)' // Stronger neon glow
                }}>
                    <FiTrendingUp size={40} color="white" />
                </div>

                <h1 style={{
                    fontSize: '1.75rem',
                    fontWeight: '800',
                    color: '#ffffff',
                    marginBottom: '0.5rem',
                    letterSpacing: '-0.5px',
                    textShadow: '0 0 20px rgba(0, 230, 118, 0.2)' // Subtle neon title glow
                }}>
                    Microcrédito Digital
                </h1>

                <p style={{
                    color: '#94a3b8',
                    marginBottom: '2.5rem',
                    fontSize: '0.95rem'
                }}>
                    Acesso ao Painel Administrativo
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Email Input */}
                    <div style={{ position: 'relative' }}>
                        <div style={{
                            position: 'absolute',
                            left: '1.25rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#64748b'
                        }}>
                            <FiMail size={20} />
                        </div>
                        <input
                            type="email"
                            placeholder="Email institucional"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '1.1rem 1.1rem 1.1rem 3.5rem',
                                background: '#13132b',
                                border: '1px solid rgba(255,255,255,0.05)',
                                borderRadius: '16px',
                                color: 'white',
                                fontSize: '1rem',
                                outline: 'none',
                                transition: 'all 0.2s'
                            }}
                            className="login-input"
                        />
                    </div>

                    {/* Password Input */}
                    <div style={{ position: 'relative' }}>
                        <div style={{
                            position: 'absolute',
                            left: '1.25rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#64748b'
                        }}>
                            <FiLock size={20} />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Sua senha secreta"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '1.1rem 3.5rem 1.1rem 3.5rem',
                                background: '#13132b',
                                border: '1px solid rgba(255,255,255,0.05)',
                                borderRadius: '16px',
                                color: 'white',
                                fontSize: '1rem',
                                outline: 'none',
                                transition: 'all 0.2s'
                            }}
                            className="login-input"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute',
                                right: '1.25rem',
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
                            {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                        </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-0.5rem' }}>
                        <Link
                            to="/forgot-password"
                            style={{
                                color: '#00e676', // Neon Green
                                textDecoration: 'none',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                textShadow: '0 0 10px rgba(0, 230, 118, 0.3)'
                            }}
                        >
                            Esqueceu sua senha?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            background: '#00e676', // Bright neon green
                            color: '#000',
                            padding: '1.1rem',
                            borderRadius: '16px',
                            fontSize: '1.1rem',
                            fontWeight: '700',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            marginTop: '0.5rem',
                            transition: 'transform 0.1s',
                            boxShadow: '0 0 30px rgba(0, 230, 118, 0.5)' // Intense neon glow
                        }}
                        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        {loading ? 'Carregando...' : (
                            <>
                                Autenticar <FiArrowRight />
                            </>
                        )}
                    </button>
                </form>

                {error && (
                    <div style={{
                        marginTop: '1.5rem',
                        padding: '1rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        color: '#f87171',
                        borderRadius: '12px',
                        fontSize: '0.9rem'
                    }}>
                        {error}
                    </div>
                )}

                <div style={{ marginTop: '3rem' }}>
                    <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                        Novo por aqui?
                    </p>
                    <Link
                        to="/register-owner"
                        style={{
                            color: 'white',
                            textDecoration: 'none',
                            fontSize: '1.1rem',
                            fontWeight: '700',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        Criar Conta Corporativa <FiArrowRight size={18} />
                    </Link>
                </div>

                <div style={{
                    marginTop: '3rem',
                    fontSize: '0.8rem',
                    color: '#475569'
                }}>
                    © 2026 Desenvolvido por <strong>Nhiquela Servicos e Consultoria, LDA</strong>
                </div>
            </div>

            <style>{`
                .login-input:focus {
                    border-color: #00e676 !important;
                    background: #1a1a35 !important;
                    box-shadow: 0 0 20px rgba(0, 230, 118, 0.2) !important;
                }
            `}</style>
        </div>
    );
};

export default Login;
