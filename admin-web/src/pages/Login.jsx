import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { FiLock, FiMail, FiTrendingUp, FiEye, FiEyeOff } from 'react-icons/fi';

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

    const inputStyle = {
        width: '100%',
        padding: '0.85rem 1rem 0.85rem 2.75rem',
        background: '#0F172A',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '8px',
        color: '#F1F5F9',
        fontSize: '0.9rem',
        outline: 'none',
        transition: 'border-color 0.2s',
        fontFamily: 'inherit'
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: '#080F1E',
            fontFamily: "'Inter', sans-serif",
            padding: '1rem',
        }}>
            <div style={{
                width: '100%',
                maxWidth: '380px',
                padding: '2.5rem 2rem',
                borderRadius: '16px',
                background: '#1E293B',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255,255,255,0.06)',
                textAlign: 'center'
            }}>
                {/* Logo Icon */}
                <div style={{
                    width: '52px',
                    height: '52px',
                    margin: '0 auto 1rem',
                    background: '#16A34A',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                }}>
                    <FiTrendingUp size={26} color="white" />
                </div>

                <h1 style={{
                    fontSize: '1.2rem',
                    fontWeight: '700',
                    color: '#F1F5F9',
                    marginBottom: '0.2rem',
                    letterSpacing: '-0.3px',
                }}>
                    Microcrédito<span style={{ color: '#16A34A' }}>Digital</span>
                </h1>

                <p style={{
                    color: '#64748B',
                    marginBottom: '1.75rem',
                    fontSize: '0.65rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                }}>
                    SISTEMA DE GESTÃO DE MICROCRÉDITOS
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
                    {/* Email Input */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{
                            fontSize: '0.65rem',
                            fontWeight: '600',
                            color: '#64748B',
                            letterSpacing: '0.8px',
                            textTransform: 'uppercase',
                            marginBottom: 0
                        }}>
                            E-MAIL
                        </label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#475569' }}>
                                <FiMail size={15} />
                            </div>
                            <input
                                type="email"
                                placeholder="admin@microcredito.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={inputStyle}
                                className="login-input"
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label style={{
                                fontSize: '0.65rem',
                                fontWeight: '600',
                                color: '#64748B',
                                letterSpacing: '0.8px',
                                textTransform: 'uppercase',
                                marginBottom: 0
                            }}>
                                PASSWORD
                            </label>
                            <Link to="/forgot-password" style={{
                                color: '#16A34A',
                                textDecoration: 'none',
                                fontSize: '0.65rem',
                                fontWeight: '600',
                                letterSpacing: '0.5px'
                            }}>
                                ESQUECEU?
                            </Link>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#475569' }}>
                                <FiLock size={15} />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{ ...inputStyle, paddingRight: '2.75rem' }}
                                className="login-input"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '0.85rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: '#475569',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            marginTop: '0.25rem',
                            fontSize: '0.95rem',
                            fontWeight: '600'
                        }}
                    >
                        {loading ? 'A entrar...' : 'Fazer login'}
                    </button>
                </form>

                {error && (
                    <div style={{
                        marginTop: '1rem',
                        padding: '0.75rem',
                        background: 'rgba(220, 38, 38, 0.08)',
                        border: '1px solid rgba(220, 38, 38, 0.2)',
                        color: '#FCA5A5',
                        borderRadius: '8px',
                        fontSize: '0.85rem'
                    }}>
                        {error}
                    </div>
                )}

                <div style={{ marginTop: '1.25rem' }}>
                    <Link to="/register-owner" style={{
                        color: '#16A34A',
                        textDecoration: 'none',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                    }}>
                        + Criar nova conta
                    </Link>
                </div>

                <div style={{
                    marginTop: '1.75rem',
                    paddingTop: '1.25rem',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    fontSize: '0.65rem',
                    color: '#334155',
                    fontWeight: '500',
                    letterSpacing: '0.3px'
                }}>
                    NHIQUELA SERVIÇOS & CONSULTORIA, LDA
                </div>
            </div>

            <style>{`
                .login-input:focus {
                    border-color: rgba(22, 163, 74, 0.4) !important;
                    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.08) !important;
                }
            `}</style>
        </div>
    );
};

export default Login;
