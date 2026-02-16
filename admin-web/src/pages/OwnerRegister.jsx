import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiUser, FiMail, FiPhone, FiLock, FiTrendingUp, FiFileText, FiCalendar, FiMapPin, FiBriefcase, FiArrowLeft, FiCheck, FiEye, FiEyeOff } from 'react-icons/fi';
import api from '../api';

const OwnerRegister = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Dados pessoais
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        identityDocument: '',
        dateOfBirth: '',
        address: '',
        institutionName: '',
        institutionNuit: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleNextStep = (e) => {
        e.preventDefault();
        setError('');

        if (step === 1) {
            if (formData.password !== formData.confirmPassword) {
                setError('As senhas não correspondem');
                return;
            }
            if (formData.password.length < 6) {
                setError('A senha deve ter no mínimo 6 caracteres');
                return;
            }
        }

        setStep(step + 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await api.post('/auth/register', {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                password: formData.password,
                identityDocument: formData.identityDocument,
                dateOfBirth: formData.dateOfBirth,
                address: formData.address,
                role: 'owner',
                institutionName: formData.institutionName,
                institutionNuit: formData.institutionNuit
            });

            if (res.data.success) {
                // Mostrar mensagem de sucesso
                setSuccess(true);
                // Login automático após registro
                localStorage.setItem('token', res.data.data.token);
                localStorage.setItem('refreshToken', res.data.data.refreshToken);
                localStorage.setItem('user', JSON.stringify(res.data.data.user));
                // Redirecionar após 3 segundos
                setTimeout(() => {
                    navigate('/dashboard');
                }, 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Erro ao criar conta');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '1rem 1rem 1rem 3rem',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        color: 'white',
        fontSize: '0.95rem'
    };

    const iconStyle = {
        position: 'absolute',
        left: '1rem',
        top: '50%',
        transform: 'translateY(-50%)',
        color: 'var(--text-muted)'
    };

    // Tela de sucesso
    if (success) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)',
                padding: '2rem 1rem'
            }}>
                <div className="glass" style={{
                    width: '100%',
                    maxWidth: '520px',
                    padding: '3rem 2.5rem',
                    borderRadius: '24px',
                    textAlign: 'center'
                }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        background: '#10b981',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2.5rem',
                        color: 'white',
                        margin: '0 auto 2rem'
                    }}>
                        <FiCheck />
                    </div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem', color: '#10b981' }}>
                        ✅ Conta Criada com Sucesso!
                    </h1>
                    <p style={{
                        color: 'white',
                        fontSize: '1.15rem',
                        marginBottom: '0.5rem',
                        fontWeight: 600
                    }}>
                        Instituição: <span style={{ color: 'var(--accent)' }}>"{formData.institutionName}"</span>
                    </p>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: 1.6, fontSize: '0.95rem' }}>
                        Foi registrada com sucesso no sistema de microcrédito digital!
                        <br />
                        Redirecionando para o dashboard...
                    </p>
                    <div style={{
                        width: '100%',
                        height: '4px',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '2px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            height: '100%',
                            width: '100%',
                            background: 'linear-gradient(90deg, var(--accent) 0%, #10b981 100%)'
                        }} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)',
            padding: '2rem 1rem'
        }}>
            <div className="glass" style={{
                width: '100%',
                maxWidth: '520px',
                padding: '3rem 2.5rem',
                borderRadius: '24px'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
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
                        <FiTrendingUp />
                    </div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>Criar Conta de Owner</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        Passo {step} de 2 - {step === 1 ? 'Dados Pessoais' : 'Dados da Instituição'}
                    </p>
                </div>

                {/* Progress Bar */}
                <div style={{
                    height: '4px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '2px',
                    marginBottom: '2rem',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        height: '100%',
                        width: step === 1 ? '50%' : '100%',
                        background: 'var(--accent)',
                        transition: 'width 0.3s ease',
                        borderRadius: '2px'
                    }} />
                </div>

                {step === 1 ? (
                    <form onSubmit={handleNextStep} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ position: 'relative' }}>
                            <FiUser style={iconStyle} />
                            <input
                                type="text"
                                name="name"
                                placeholder="Nome completo"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                style={inputStyle}
                            />
                        </div>

                        <div style={{ position: 'relative' }}>
                            <FiMail style={iconStyle} />
                            <input
                                type="email"
                                name="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                style={inputStyle}
                            />
                        </div>

                        <div style={{ position: 'relative' }}>
                            <FiPhone style={iconStyle} />
                            <input
                                type="tel"
                                name="phone"
                                placeholder="Telefone"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                                style={inputStyle}
                            />
                        </div>

                        <div style={{ position: 'relative' }}>
                            <FiFileText style={iconStyle} />
                            <input
                                type="text"
                                name="identityDocument"
                                placeholder="Número do BI"
                                value={formData.identityDocument}
                                onChange={handleChange}
                                required
                                style={inputStyle}
                            />
                        </div>

                        <div style={{ position: 'relative' }}>
                            <FiCalendar style={iconStyle} />
                            <input
                                type="date"
                                name="dateOfBirth"
                                placeholder="Data de nascimento"
                                value={formData.dateOfBirth}
                                onChange={handleChange}
                                required
                                style={inputStyle}
                            />
                        </div>

                        <div style={{ position: 'relative' }}>
                            <FiMapPin style={iconStyle} />
                            <input
                                type="text"
                                name="address"
                                placeholder="Endereço"
                                value={formData.address}
                                onChange={handleChange}
                                required
                                style={inputStyle}
                            />
                        </div>

                        <div style={{ position: 'relative' }}>
                            <FiLock style={iconStyle} />
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                placeholder="Senha"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                style={{ ...inputStyle, paddingRight: '3rem' }}
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
                            <FiLock style={iconStyle} />
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                name="confirmPassword"
                                placeholder="Confirmar senha"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                style={{ ...inputStyle, paddingRight: '3rem' }}
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
                            className="btn-primary"
                            style={{
                                marginTop: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            Próximo Passo →
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ position: 'relative' }}>
                            <FiBriefcase style={iconStyle} />
                            <input
                                type="text"
                                name="institutionName"
                                placeholder="Nome da Instituição"
                                value={formData.institutionName}
                                onChange={handleChange}
                                required
                                style={inputStyle}
                            />
                        </div>

                        <div style={{ position: 'relative' }}>
                            <FiFileText style={iconStyle} />
                            <input
                                type="text"
                                name="institutionNuit"
                                placeholder="NUIT da Instituição"
                                value={formData.institutionNuit}
                                onChange={handleChange}
                                required
                                style={inputStyle}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="btn-primary"
                                style={{
                                    flex: 1,
                                    background: 'rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                ← Voltar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary"
                                style={{
                                    flex: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                {loading ? 'Criando...' : 'Criar Conta'}
                            </button>
                        </div>
                    </form>
                )}

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
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                    <FiArrowLeft />
                    Já tem uma conta? Fazer login
                </Link>
            </div>
        </div>
    );
};

export default OwnerRegister;
