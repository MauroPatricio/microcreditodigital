import React, { useState, useEffect } from 'react';
import { FiRefreshCw, FiCheckCircle, FiSmartphone, FiAlertCircle } from 'react-icons/fi';
import api from '../api';

const WhatsAppConnect = () => {
    const [status, setStatus] = useState('DISCONNECTED');
    const [qrCode, setQrCode] = useState(null);
    const [loading, setLoading] = useState(true);
    const [restarting, setRestarting] = useState(false);

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

    return (
        <div className="card glass" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FiSmartphone color={status === 'READY' || status === 'AUTHENTICATED' ? 'var(--success)' : 'var(--text-muted)'} />
                    WhatsApp Automation
                </h3>
                <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    background: status === 'READY' || status === 'AUTHENTICATED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                    color: status === 'READY' || status === 'AUTHENTICATED' ? '#10b981' : 'var(--text-muted)'
                }}>
                    {status}
                </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
                {loading ? (
                    <div className="spinner"></div>
                ) : (status === 'READY' || status === 'AUTHENTICATED') ? (
                    <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s' }}>
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto'
                        }}>
                            <FiCheckCircle size={40} color="#10b981" />
                        </div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Conectado com Sucesso</h4>
                        <p style={{ color: 'var(--text-muted)', maxWidth: '300px', margin: '0 auto', fontSize: '0.9rem' }}>
                            O sistema está pronto para enviar notificações automáticas para seus clientes.
                        </p>
                    </div>
                ) : qrCode ? (
                    <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s' }}>
                        <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'inline-block' }}>
                            <img src={qrCode} alt="WhatsApp QR Code" style={{ width: '200px', height: '200px' }} />
                        </div>
                        <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Escaneie o QR Code</p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '300px', margin: '0 auto' }}>
                            Abra o WhatsApp no seu celular, vá em Aparelhos Conectados e escaneie o código acima.
                        </p>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        <FiAlertCircle size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                        <p>Aguardando inicialização do serviço...</p>
                        <p style={{ fontSize: '0.8rem' }}>Se demorar muito, tente reiniciar.</p>
                    </div>
                )}
            </div>

            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                    onClick={handleRestart}
                    disabled={restarting}
                    className="btn-secondary"
                    style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <FiRefreshCw className={restarting ? 'spin' : ''} />
                    {restarting ? 'Reiniciando...' : 'Reiniciar Serviço'}
                </button>
            </div>
        </div>
    );
};

export default WhatsAppConnect;
