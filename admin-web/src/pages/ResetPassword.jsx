import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiLock, FiCreditCard, FiCheck, FiEye, FiEyeOff } from 'react-icons/fi';
import api from '../api';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('As senhas não correspondem');
            return;
        }

        if (password.length < 6) {
            setError('A senha deve ter no mínimo 6 caracteres');
            return;
        }

        setLoading(true);

        try {
            const res = await api.post(`/auth/reset-password/${token}`, { password });
            if (res.data.success) {
                setSuccess(true);
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Erro ao redefinir senha');
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
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Senha Redefinida!</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                        Sua senha foi redefinida com sucesso. Você será redirecionado para o login...
                    </p>
                    <Link
                        to="/login"
                        className="btn-primary"
                        style={{ textDecoration: 'none' }}
                    >
                        Ir para Login
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
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>Nova Senha</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '0.95rem' }}>
                    Digite sua nova senha abaixo
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ position: 'relative' }}>
                        <FiLock style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Nova senha"
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

                    <div style={{ position: 'relative' }}>
                        <FiLock style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirmar senha"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
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
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                            {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                        </button>
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
                        {loading ? 'Redefinindo...' : 'Redefinir Senha'}
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
                        display: 'inline-block',
                        marginTop: '2rem',
                        color: 'var(--text-muted)',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.color = 'var(--accent)'}
                    onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
                >
                    Voltar ao Login
                </Link>
            </div>
        </div>
    );
};

export default ResetPassword;
