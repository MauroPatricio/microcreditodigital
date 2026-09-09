import React, { useState, useEffect } from 'react';
import { FiRefreshCw, FiCheckCircle, FiSmartphone, FiAlertCircle, FiSend, FiQrCode, FiLogOut, FiHelpCircle } from 'react-icons/fi';
import api from '../api';

const WhatsAppConnect = () => {
    const [status, setStatus] = useState('DISCONNECTED');
    const [qrCode, setQrCode] = useState(null);
    const [loading, setLoading] = useState(true);
    const [restarting, setRestarting] = useState(false);
    
    // Test message state
    const [testPhone, setTestPhone] = useState('');
    const [testMessage, setTestMessage] = useState('Olá! Esta é uma mensagem de teste do sistema Microcrédito Digital.');
    const [sendingTest, setSendingTest] = useState(false);
    const [testResult, setTestResult] = useState(null);

    const fetchStatus = async () => {
        try {
            const res = await api.get('/whatsapp/status');
            if (res.data.success) {
                setStatus(res.data.data.status);
                setQrCode(res.data.data.qrCode);
            }
        } catch (error) {
            console.error("Error fetching WhatsApp status", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 3000); // Poll every 3 seconds
        return () => clearInterval(interval);
    }, []);

    const handleRestart = async () => {
        setRestarting(true);
        setTestResult(null);
        try {
            await api.post('/whatsapp/restart');
            setStatus('INITIALIZING');
            setQrCode(null);
        } catch (error) {
            console.error("Error restarting WhatsApp", error);
            alert("Erro ao reiniciar serviço WhatsApp");
        } finally {
            setRestarting(false);
        }
    };

    const handleDisconnect = async () => {
        if (!window.confirm("Deseja realmente encerrar a sessão do WhatsApp e gerar um novo QR Code?")) return;
        setRestarting(true);
        setTestResult(null);
        try {
            await api.post('/whatsapp/disconnect');
            setStatus('INITIALIZING');
            setQrCode(null);
        } catch (error) {
            console.error("Error disconnecting WhatsApp", error);
            alert("Erro ao desconectar serviço WhatsApp");
        } finally {
            setRestarting(false);
        }
    };

    const handleSendTest = async (e) => {
        e.preventDefault();
        if (!testPhone) return;
        setSendingTest(true);
        setTestResult(null);
        try {
            const res = await api.post('/whatsapp/send', {
                to: testPhone,
                message: testMessage
            });
            if (res.data.success) {
                setTestResult({ success: true, message: 'Mensagem enviada com sucesso!' });
            }
        } catch (error) {
            setTestResult({
                success: false,
                message: error.response?.data?.message || 'Falha ao enviar mensagem de teste.'
            });
        } finally {
            setSendingTest(false);
        }
    };

    const isConnected = status === 'READY' || status === 'AUTHENTICATED';

    const getStatusBadge = () => {
        if (isConnected) {
            return { text: 'CONECTADO', bg: 'rgba(16, 185, 129, 0.2)', color: '#10b981' };
        }
        if (status === 'QR_READY' || qrCode) {
            return { text: 'AGUARDANDO SCAN', bg: 'rgba(234, 179, 8, 0.2)', color: '#eab308' };
        }
        if (status === 'INITIALIZING') {
            return { text: 'INICIALIZANDO...', bg: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' };
        }
        return { text: 'DESCONECTADO', bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' };
    };

    const badge = getStatusBadge();

    return (
        <div className="card glass" style={{ padding: '2rem', borderRadius: '24px', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-main)' }}>
                        <FiSmartphone style={{ color: isConnected ? '#10b981' : 'var(--accent)' }} size={24} />
                        Conexão WhatsApp Web (QR Code)
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Escaneie o código para associar o número do WhatsApp da instituição ao sistema
                    </p>
                </div>
                <span style={{
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    padding: '0.4rem 1rem',
                    borderRadius: '20px',
                    background: badge.bg,
                    color: badge.color,
                    letterSpacing: '0.5px'
                }}>
                    {badge.text}
                </span>
            </div>

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem' }}>
                    <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Verificando status do serviço...</p>
                </div>
            ) : isConnected ? (
                <div style={{ animation: 'fadeIn 0.5s' }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '2rem',
                        alignItems: 'center'
                    }}>
                        <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '24px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                            <div style={{
                                width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem'
                            }}>
                                <FiCheckCircle size={40} color="#10b981" />
                            </div>
                            <h4 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-main)' }}>WhatsApp Conectado</h4>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: '1.6' }}>
                                O dispositivo está emparelhado com sucesso. O sistema enviará notificações de cobrança e alertas automaticamente.
                            </p>
                        </div>

                        {/* Form de Mensagem de Teste */}
                        <div style={{ padding: '1.5rem', background: 'var(--bg-main)', borderRadius: '20px', border: '1px solid var(--border-light)' }}>
                            <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
                                <FiSend color="var(--accent)" /> Enviar Mensagem de Teste
                            </h4>
                            <form onSubmit={handleSendTest} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                                        Número de Telemóvel (ex: 841234567)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="84xxxxxxx"
                                        value={testPhone}
                                        onChange={e => setTestPhone(e.target.value)}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '0.8rem 1rem',
                                            borderRadius: '12px',
                                            border: '1px solid var(--border-light)',
                                            background: 'var(--bg-card)',
                                            color: 'var(--text-main)',
                                            fontSize: '0.95rem'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                                        Mensagem
                                    </label>
                                    <textarea
                                        rows="2"
                                        value={testMessage}
                                        onChange={e => setTestMessage(e.target.value)}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '0.8rem 1rem',
                                            borderRadius: '12px',
                                            border: '1px solid var(--border-light)',
                                            background: 'var(--bg-card)',
                                            color: 'var(--text-main)',
                                            fontSize: '0.9rem',
                                            resize: 'none'
                                        }}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={sendingTest}
                                    className="btn-primary"
                                    style={{
                                        padding: '0.8rem',
                                        borderRadius: '12px',
                                        fontWeight: 700,
                                        fontSize: '0.9rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    {sendingTest ? <div className="spinner-small" /> : <><FiSend size={16} /> Enviar Teste</>}
                                </button>
                                {testResult && (
                                    <div style={{
                                        padding: '0.75rem',
                                        borderRadius: '10px',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        background: testResult.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                        color: testResult.success ? '#10b981' : '#ef4444'
                                    }}>
                                        {testResult.message}
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '2.5rem',
                    alignItems: 'center'
                }}>
                    {/* Área do QR Code */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        {qrCode ? (
                            <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s' }}>
                                <div style={{
                                    background: '#ffffff',
                                    padding: '1.25rem',
                                    borderRadius: '24px',
                                    boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                                    display: 'inline-block',
                                    marginBottom: '1rem',
                                    border: '4px solid var(--accent)'
                                }}>
                                    <img src={qrCode} alt="WhatsApp QR Code" style={{ width: '220px', height: '220px', display: 'block' }} />
                                </div>
                                <p style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>Escaneie para Conectar</p>
                                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>O código atualiza automaticamente</p>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: 'var(--bg-main)', borderRadius: '24px', width: '100%', border: '1px solid var(--border-light)' }}>
                                <FiAlertCircle size={48} style={{ color: 'var(--warning)', marginBottom: '1rem', opacity: 0.8 }} />
                                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>Aguardando QR Code</h4>
                                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '300px', margin: '0 auto' }}>
                                    O serviço de WhatsApp está a ser inicializado no servidor. O QR Code aparecerá em poucos segundos.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Instruções de Scan */}
                    <div style={{ background: 'var(--bg-main)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border-light)' }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)' }}>
                            <FiHelpCircle color="var(--accent)" size={20} />
                            Como conectar o WhatsApp:
                        </h4>
                        <ol style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: '1.5' }}>
                            <li>Abra a aplicação do <strong>WhatsApp</strong> no seu telemóvel.</li>
                            <li>Toque em <strong>Menu (⋮)</strong> no Android ou em <strong>Definições (⚙️)</strong> no iPhone.</li>
                            <li>Selecione a opção <strong>Dispositivos Conectados</strong>.</li>
                            <li>Toque em <strong>Conectar um Dispositivo</strong>.</li>
                            <li>Aponte a câmara do seu telemóvel para este ecrã e digitalize o <strong>QR Code</strong>.</li>
                        </ol>
                    </div>
                </div>
            )}

            <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Provider: <strong>whatsapp-web.js (Puppeteer)</strong>
                </span>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        onClick={handleRestart}
                        disabled={restarting}
                        className="btn-secondary"
                        style={{
                            fontSize: '0.85rem',
                            padding: '0.65rem 1.25rem',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            cursor: 'pointer'
                        }}
                    >
                        <FiRefreshCw className={restarting ? 'spin' : ''} />
                        {restarting ? 'Processando...' : 'Reiniciar Serviço'}
                    </button>
                    <button
                        onClick={handleDisconnect}
                        disabled={restarting}
                        style={{
                            fontSize: '0.85rem',
                            padding: '0.65rem 1.25rem',
                            borderRadius: '12px',
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            cursor: 'pointer'
                        }}
                    >
                        <FiLogOut />
                        Desconectar / Novo QR Code
                    </button>
                </div>
            </div>
            
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .spin { animation: spin 1s linear infinite; }
            `}</style>
        </div>
    );
};

export default WhatsAppConnect;
