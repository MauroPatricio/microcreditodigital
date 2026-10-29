import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { FiLock, FiMail, FiTrendingUp, FiEye, FiEyeOff, FiSmartphone, FiArrowRight } from 'react-icons/fi';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [require2FA, setRequire2FA] = useState(false);
    const [twoFactorToken, setTwoFactorToken] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await login(email, password, require2FA ? twoFactorToken : undefined);
            if (res.success && res.require2FA) {
                setRequire2FA(true);
                setError('');
                return;
            } else if (res.success) {
                if (res.user?.role === 'super_admin') {
                    navigate('/global-dashboard');
                } else {
                    navigate('/dashboard');
                }
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
        <div className="modern-login-container">
            {/* Background elements for modern look */}
            <div className="bg-blob blob-1"></div>
            <div className="bg-blob blob-2"></div>
            <div className="bg-blob blob-3"></div>

            <div className="login-glass-card">
                <div className="brand-header">
                    <div className="logo-icon">
                        <FiTrendingUp size={24} color="#fff" />
                    </div>
                    <h1>
                        Microcrédito<span>Digital</span>
                    </h1>
                    <p className="subtitle">SISTEMA DE GESTÃO DE MICROCRÉDITOS</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {/* Email Input */}
                    <div className="input-group">
                        <label>E-MAIL DA INSTITUIÇÃO</label>
                        <div className="input-wrapper">
                            <FiMail className="input-icon" />
                            <input
                                type="email"
                                placeholder="admin@instituicao.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div className="input-group">
                        <div className="label-row">
                            <label>PASSWORD</label>
                            <Link to="/forgot-password" className="forgot-link">
                                Recuperar senha
                            </Link>
                        </div>
                        <div className="input-wrapper">
                            <FiLock className="input-icon" />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="eye-btn"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                            </button>
                        </div>
                    </div>

                    {require2FA && (
                        <div className="input-group">
                            <label>CÓDIGO 2FA (GOOGLE AUTHENTICATOR)</label>
                            <div className="input-wrapper">
                                <FiLock className="input-icon" />
                                <input
                                    type="text"
                                    placeholder="000000"
                                    value={twoFactorToken}
                                    onChange={(e) => setTwoFactorToken(e.target.value)}
                                    required
                                    style={{ letterSpacing: '2px', textAlign: 'center', paddingLeft: '1rem' }}
                                />
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <button type="submit" disabled={loading} className="submit-btn">
                        {loading ? (
                            <span className="loader-text">A autenticar...</span>
                        ) : (
                            <>
                                Fazer login <FiArrowRight className="btn-icon" />
                            </>
                        )}
                    </button>
                </form>

                <div className="register-link-container">
                    <Link to="/register-owner" className="register-link">
                        Criar nova conta de instituição
                    </Link>
                </div>

                {/* Credismart App Banner */}
                <div className="credismart-banner">
                    <div className="app-icon">
                        <FiSmartphone size={20} color="#10B981" />
                    </div>
                    <div className="app-info">
                        <h4>É um cliente individual?</h4>
                        <p>Baixe a aplicação <strong>TaquiMola</strong> no seu telemóvel para solicitar o seu crédito.</p>
                    </div>
                </div>

                <div className="footer-credits">
                    <p>&copy; {new Date().getFullYear()} NHIQUELA SERVIÇOS & CONSULTORIA, LDA</p>
                </div>
            </div>

            <style>{`
                /* Container and Background */
                .modern-login-container {
                    position: relative;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #030712; /* Very dark blue/black */
                    font-family: 'Inter', system-ui, -apple-system, sans-serif;
                    overflow: hidden;
                    padding: 1.5rem;
                }

                /* Animated background blobs for visual depth */
                .bg-blob {
                    position: absolute;
                    filter: blur(80px);
                    border-radius: 50%;
                    opacity: 0.4;
                    animation: float 20s ease-in-out infinite alternate;
                    z-index: 0;
                }
                .blob-1 {
                    top: -10%;
                    left: -10%;
                    width: 500px;
                    height: 500px;
                    background: #10B981; /* Emerald */
                    animation-delay: 0s;
                }
                .blob-2 {
                    bottom: -20%;
                    right: -10%;
                    width: 600px;
                    height: 600px;
                    background: #3B82F6; /* Blue */
                    animation-delay: -5s;
                }
                .blob-3 {
                    top: 40%;
                    left: 60%;
                    width: 400px;
                    height: 400px;
                    background: #8B5CF6; /* Violet */
                    opacity: 0.2;
                    animation-delay: -10s;
                }

                @keyframes float {
                    0% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(50px, 30px) scale(1.1); }
                    100% { transform: translate(-30px, -50px) scale(0.9); }
                }

                /* Glassmorphic Card */
                .login-glass-card {
                    position: relative;
                    z-index: 10;
                    width: 100%;
                    max-width: 420px;
                    background: rgba(17, 24, 39, 0.6);
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 24px;
                    padding: 3rem 2.5rem;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }

                /* Header Styling */
                .brand-header {
                    text-align: center;
                    margin-bottom: 2.5rem;
                }
                .logo-icon {
                    width: 56px;
                    height: 56px;
                    margin: 0 auto 1.25rem;
                    background: linear-gradient(135deg, #10B981 0%, #059669 100%);
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.4);
                }
                .brand-header h1 {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: #F8FAFC;
                    margin: 0 0 0.5rem 0;
                    letter-spacing: -0.5px;
                }
                .brand-header h1 span {
                    color: #10B981;
                }
                .subtitle {
                    font-size: 0.7rem;
                    font-weight: 600;
                    color: #64748B;
                    margin: 0;
                    letter-spacing: 1.5px;
                }

                /* Form Elements */
                .login-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1.25rem;
                }
                .input-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .label-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .input-group label {
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: #94A3B8;
                    letter-spacing: 0.5px;
                }
                .forgot-link {
                    font-size: 0.75rem;
                    font-weight: 500;
                    color: #10B981;
                    text-decoration: none;
                    transition: color 0.2s;
                }
                .forgot-link:hover {
                    color: #34D399;
                    text-decoration: underline;
                }

                .input-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                }
                .input-icon {
                    position: absolute;
                    left: 1.25rem;
                    color: #64748B;
                    font-size: 1.1rem;
                }
                .input-wrapper input {
                    width: 100%;
                    padding: 1rem 1rem 1rem 3rem;
                    background: rgba(15, 23, 42, 0.6);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    color: #F8FAFC;
                    font-size: 0.95rem;
                    outline: none;
                    transition: all 0.3s ease;
                }
                .input-wrapper input:focus {
                    background: rgba(15, 23, 42, 0.8);
                    border-color: #10B981;
                    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
                }
                .input-wrapper input::placeholder {
                    color: #475569;
                }
                .eye-btn {
                    position: absolute;
                    right: 1rem;
                    background: transparent;
                    border: none;
                    color: #64748B;
                    cursor: pointer;
                    padding: 0.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: background 0.2s;
                }
                .eye-btn:hover {
                    background: rgba(255, 255, 255, 0.05);
                    color: #94A3B8;
                }

                /* Button */
                .submit-btn {
                    margin-top: 0.5rem;
                    width: 100%;
                    padding: 1rem;
                    background: linear-gradient(135deg, #10B981 0%, #059669 100%);
                    color: #fff;
                    border: none;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    transition: transform 0.2s, box-shadow 0.2s;
                    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
                }
                .submit-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
                }
                .submit-btn:active:not(:disabled) {
                    transform: translateY(0);
                }
                .submit-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }
                .btn-icon {
                    transition: transform 0.2s;
                }
                .submit-btn:hover .btn-icon {
                    transform: translateX(4px);
                }

                /* Messages & Links */
                .error-message {
                    padding: 0.75rem 1rem;
                    background: rgba(239, 68, 68, 0.1);
                    border-left: 4px solid #EF4444;
                    color: #FCA5A5;
                    border-radius: 6px;
                    font-size: 0.85rem;
                }
                
                .register-link-container {
                    text-align: center;
                    margin-top: 1.5rem;
                }
                .register-link {
                    color: #F8FAFC;
                    text-decoration: none;
                    font-size: 0.9rem;
                    font-weight: 500;
                    transition: color 0.2s;
                }
                .register-link:hover {
                    color: #10B981;
                }

                /* Banner */
                .credismart-banner {
                    margin-top: 2rem;
                    padding: 1.25rem;
                    background: rgba(16, 185, 129, 0.05);
                    border: 1px solid rgba(16, 185, 129, 0.2);
                    border-radius: 16px;
                    display: flex;
                    align-items: flex-start;
                    gap: 1rem;
                    transition: all 0.3s ease;
                }
                .credismart-banner:hover {
                    background: rgba(16, 185, 129, 0.08);
                    border-color: rgba(16, 185, 129, 0.3);
                    transform: translateY(-2px);
                }
                .app-icon {
                    width: 40px;
                    height: 40px;
                    background: rgba(16, 185, 129, 0.15);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .app-info h4 {
                    margin: 0 0 0.25rem 0;
                    color: #F8FAFC;
                    font-size: 0.85rem;
                    font-weight: 600;
                }
                .app-info p {
                    margin: 0;
                    color: #94A3B8;
                    font-size: 0.75rem;
                    line-height: 1.5;
                }

                /* Footer */
                .footer-credits {
                    margin-top: 2.5rem;
                    text-align: center;
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                    padding-top: 1.5rem;
                }
                .footer-credits p {
                    margin: 0;
                    font-size: 0.65rem;
                    color: #475569;
                    font-weight: 600;
                    letter-spacing: 0.5px;
                }
            `}</style>
        </div>
    );
};

export default Login;
