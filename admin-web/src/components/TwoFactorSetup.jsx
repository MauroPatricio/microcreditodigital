import React, { useState, useEffect } from 'react';
import api from '../api';
import { FiLock, FiShield, FiShieldOff, FiCheck, FiX } from 'react-icons/fi';

const TwoFactorSetup = () => {
    const [status, setStatus] = useState('checking'); // checking, enabled, disabled, generating, confirming
    const [qrCode, setQrCode] = useState('');
    const [secret, setSecret] = useState('');
    const [token, setToken] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        try {
            const res = await api.get('/auth/me');
            if (res.data.success) {
                if (res.data.data.user.isTwoFactorEnabled) {
                    setStatus('enabled');
                } else {
                    setStatus('disabled');
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    const generate2FA = async () => {
        setLoading(true);
        try {
            const res = await api.get('/auth/2fa/generate');
            if (res.data.success) {
                setQrCode(res.data.data.qrcode);
                setSecret(res.data.data.secret);
                setStatus('confirming');
                setError('');
            }
        } catch (error) {
            setError('Erro ao gerar código 2FA');
        } finally {
            setLoading(false);
        }
    };

    const enable2FA = async () => {
        if (!token) return setError('Introduza o código de 6 dígitos');
        
        setLoading(true);
        try {
            const res = await api.post('/auth/2fa/enable', { token });
            if (res.data.success) {
                setStatus('enabled');
                setToken('');
                setError('');
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Código inválido');
        } finally {
            setLoading(false);
        }
    };

    const disable2FA = async () => {
        if (!token || !password) return setError('Introduza a password e o código 2FA');
        
        setLoading(true);
        try {
            const res = await api.post('/auth/2fa/disable', { token, password });
            if (res.data.success) {
                setStatus('disabled');
                setToken('');
                setPassword('');
                setError('');
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Código ou senha inválidos');
        } finally {
            setLoading(false);
        }
    };

    if (status === 'checking') return <div>A verificar segurança...</div>;

    return (
        <div className="card" style={{ marginTop: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: 700 }}>
                <FiLock style={{ color: 'var(--accent)' }} /> Segurança da Conta (2FA)
            </h3>
            
            {status === 'disabled' && (
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        <FiShieldOff size={24} color="#EF4444" />
                        <div>
                            <p style={{ fontWeight: 600, margin: 0, color: '#FCA5A5' }}>Autenticação de 2 Fatores Desativada</p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Proteja a sua conta adicionando uma camada extra de segurança.</p>
                        </div>
                    </div>
                    <button type="button" onClick={generate2FA} disabled={loading} style={{ marginTop: '1rem', padding: '0.75rem 1.5rem', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                        {loading ? 'A gerar...' : 'Ativar 2FA'}
                    </button>
                </div>
            )}

            {status === 'confirming' && (
                <div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>1. Instale o Google Authenticator ou Authy no seu telemóvel.</p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>2. Digitalize o código QR abaixo ou insira o código manual: <strong style={{color: 'white'}}>{secret}</strong></p>
                    
                    <div style={{ background: 'white', padding: '1rem', display: 'inline-block', borderRadius: '8px', margin: '1rem 0' }}>
                        <img src={qrCode} alt="QR Code 2FA" style={{ width: '150px', height: '150px' }} />
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>3. Insira o código de 6 dígitos gerado pela app</label>
                        <input
                            type="text"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            placeholder="000000"
                            style={{ padding: '0.75rem', background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-main)', letterSpacing: '2px', width: '120px', textAlign: 'center' }}
                            maxLength={6}
                        />
                    </div>

                    {error && <p style={{ color: '#EF4444', fontSize: '0.85rem', marginTop: '0.5rem' }}>{error}</p>}

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                        <button type="button" onClick={enable2FA} disabled={loading} style={{ padding: '0.75rem 1.5rem', background: '#10B981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                            {loading ? 'A verificar...' : 'Confirmar e Ativar'}
                        </button>
                        <button type="button" onClick={() => setStatus('disabled')} style={{ padding: '0.75rem 1.5rem', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-light)', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {status === 'enabled' && (
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                        <FiShield size={24} color="#10B981" />
                        <div>
                            <p style={{ fontWeight: 600, margin: 0, color: '#34D399' }}>Autenticação de 2 Fatores Ativada</p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>A sua conta está protegida com um nível extra de segurança.</p>
                        </div>
                    </div>

                    <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                        <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem' }}>Desativar 2FA</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Senha de acesso</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="A sua senha atual"
                                    style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-panel)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-main)' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Código 2FA</label>
                                <input
                                    type="text"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    placeholder="000000"
                                    style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-panel)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-main)', letterSpacing: '2px', textAlign: 'center' }}
                                    maxLength={6}
                                />
                            </div>
                        </div>
                        {error && <p style={{ color: '#EF4444', fontSize: '0.85rem', marginTop: '1rem' }}>{error}</p>}
                        <button type="button" onClick={disable2FA} disabled={loading} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: 'transparent', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.5)', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                            {loading ? 'A desativar...' : 'Desativar 2FA'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TwoFactorSetup;
