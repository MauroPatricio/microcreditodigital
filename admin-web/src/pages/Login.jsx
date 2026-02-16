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
            height: '100vh',
            background: '#020617',
            padding: '1.5rem',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background Orbs for Premium Look */}
            <div style={{
                position: 'absolute',
                top: '-10%',
                left: '-10%',
                width: '40%',
                height: '40%',
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
                filter: 'blur(100px)',
                zIndex: 0
            }} />
            <div style={{
                position: 'absolute',
                bottom: '-10%',
                right: '-10%',
                width: '50%',
                height: '50%',
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
                filter: 'blur(120px)',
                zIndex: 0
            }} />

            <div className="glass" style={{
                width: '100%',
                maxWidth: '400px',
                padding: '2.5rem 1.75rem',
                borderRadius: '32px',
                textAlign: 'center',
                position: 'relative',
                zIndex: 1,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                {/* Logo Section */}
                <div style={{
                    width: '64px',
                    height: '64px',
                    margin: '0 auto 1.5rem',
                    position: 'relative'
                }}>
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'var(--accent)',
                        borderRadius: '20px',
                        transform: 'rotate(45deg)',
                        opacity: 0.2,
                        filter: 'blur(8px)'
                    }} />
                    <div style={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(135deg, var(--accent) 0%, #3b82f6 100%)',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                        color: 'white',
                        boxShadow: '0 10px 20px rgba(59, 130, 246, 0.3)'
                    }}>
                        <FiTrendingUp />
                    </div>
                </div>

                <h1 style={{
                    fontSize: '1.8rem',
                    fontWeight: 900,
                    marginBottom: '0.15rem',
                    background: 'linear-gradient(to bottom, #fff, #94a3b8)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-1px'
                }}>
                    Microcrédito Digital
                </h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.75rem', fontSize: '0.9rem', fontWeight: 500 }}>
                    Acesso ao Painel Administrativo
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ position: 'relative' }}>
                        <div style={{
                            position: 'absolute',
                            left: '1.25rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-muted)',
                            zIndex: 2,
                            display: 'flex',
                            transition: 'color 0.3s'
                        }}>
                            <FiMail size={18} />
                        </div>
                        <input
                            type="email"
                            placeholder="Email institucional"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="premium-input"
                            style={{
                                width: '100%',
                                padding: '1.1rem 1.1rem 1.1rem 3.5rem',
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '16px',
                                color: 'white',
                                fontSize: '1rem',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <div style={{
                            position: 'absolute',
                            left: '1.25rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-muted)',
                            zIndex: 2,
                            display: 'flex',
                            transition: 'color 0.3s'
                        }}>
                            <FiLock size={18} />
                        </div>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Sua senha secreta"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="premium-input"
                            style={{
                                width: '100%',
                                padding: '1.1rem 3.5rem 1.1rem 3.5rem',
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '16px',
                                color: 'white',
                                fontSize: '1rem',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                outline: 'none'
                            }}
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
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: '0.4rem',
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'all 0.3s',
                                zIndex: 2
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                        >
                            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                        </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Link
                            to="/forgot-password"
                            style={{
                                color: 'var(--accent)',
                                textDecoration: 'none',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                transition: 'all 0.2s',
                                opacity: 0.8
                            }}
                            onMouseEnter={(e) => e.target.style.opacity = '1'}
                            onMouseLeave={(e) => e.target.style.opacity = '0.8'}
                        >
                            Esqueceu sua senha?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary"
                        style={{
                            marginTop: '0.5rem',
                            padding: '1.1rem',
                            borderRadius: '16px',
                            fontSize: '1rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.75rem',
                            boxShadow: '0 10px 20px -5px rgba(59, 130, 246, 0.4)',
                            transition: 'all 0.3s'
                        }}
                    >
                        {loading ? (
                            <div className="spinner-small"></div>
                        ) : (
                            <>
                                Autenticar <FiArrowRight />
                            </>
                        )}
                    </button>
                </form>

                {error && (
                    <div className="fade-in" style={{
                        marginTop: '1.5rem',
                        padding: '1rem',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        color: '#fca5a5',
                        borderRadius: '12px',
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                    }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }} />
                        {error}
                    </div>
                )}

                <div style={{
                    marginTop: '1.75rem',
                    paddingTop: '1.25rem',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    textAlign: 'center'
                }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.15rem' }}>
                        Novo por aqui?
                    </p>
                    <Link
                        to="/register-owner"
                        style={{
                            color: 'white',
                            textDecoration: 'none',
                            fontSize: '1rem',
                            fontWeight: 700,
                            transition: 'all 0.3s',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                        onMouseEnter={(e) => e.target.style.color = 'var(--accent)'}
                        onMouseLeave={(e) => e.target.style.color = 'white'}
                    >
                        Criar Conta Corporativa <FiArrowRight size={14} />
                    </Link>
                </div>

                <div style={{
                    marginTop: '1.5rem',
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
                    opacity: 0.5
                }}>
                    © 2026 Desenvolvido por <span style={{ fontWeight: 700 }}>Nhiquela Servicos e Consultoria, LDA</span>
                </div>
            </div>

            {/* Premium Animations Style */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .fade-in {
                    animation: fadeIn 0.4s ease forwards;
                }
                .premium-input:focus {
                    background: rgba(255, 255, 255, 0.05) !important;
                    border-color: var(--accent) !important;
                    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1) !important;
                }
                .spinner-small {
                    width: 20px;
                    height: 20px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-radius: 50%;
                    border-top-color: white;
                    animation: spin 0.8s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                .btn-primary:active {
                    transform: scale(0.98);
                }
                .btn-primary:hover {
                    box-shadow: 0 15px 30px -5px rgba(59, 130, 246, 0.5);
                }
            `}</style>
        </div>
    );
};

export default Login;

