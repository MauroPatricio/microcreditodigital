import React, { useState, useEffect } from 'react';
import api from '../api';
import { FiFileText, FiDownload, FiSend, FiCheckCircle, FiClock, FiXCircle } from 'react-icons/fi';

const ContractViewer = ({ creditId, onUpdate }) => {
    const [contract, setContract] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        fetchContract();
    }, [creditId]);

    const fetchContract = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/contracts/credit/${creditId}`);
            if (res.data.success) {
                setContract(res.data.data.contract);
            }
        } catch (error) {
            console.error("No contract found or error fetching", error);
            setContract(null);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const res = await api.post(`/contracts/generate/${creditId}`);
            if (res.data.success) {
                setContract(res.data.data.contract);
                if (onUpdate) onUpdate();
            }
        } catch (error) {
            alert('Erro ao gerar contrato');
        } finally {
            setGenerating(false);
        }
    };

    const handleSendForSignature = async () => {
        setSending(true);
        try {
            const res = await api.post(`/contracts/${contract._id}/send-for-signature`);
            if (res.data.success) {
                alert('Contrato enviado para assinatura via email/SMS');
                fetchContract();
            }
        } catch (error) {
            alert('Erro ao enviar para assinatura');
        } finally {
            setSending(false);
        }
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 'signed': return { label: 'Assinado', color: '#10b981', icon: <FiCheckCircle /> };
            case 'pending_signature': return { label: 'Aguardando Assinatura', color: '#3b82f6', icon: <FiClock /> };
            case 'canceled': return { label: 'Cancelado', color: '#ef4444', icon: <FiXCircle /> };
            default: return { label: 'Rascunho', color: '#f59e0b', icon: <FiFileText /> };
        }
    };

    const getFullUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        const baseUrl = api.defaults.baseURL.replace('/api', '');
        return `${baseUrl}${url}`;
    };

    if (loading) return <div style={{ color: 'var(--accent)', padding: '1rem' }}>Carregando contrato...</div>;

    if (!contract) {
        return (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <FiFileText style={{ fontSize: '3rem', color: 'rgba(255,255,255,0.1)', marginBottom: '1rem' }} />
                <h3>Nenhum contrato gerado</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>O contrato é gerado automaticamente na aprovação, mas você pode gerá-lo manualmente agora.</p>
                <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="btn-primary"
                    style={{ margin: '0 auto' }}
                >
                    {generating ? 'Gerando...' : 'Gerar Contrato Agora'}
                </button>
            </div>
        );
    }

    const statusInfo = getStatusInfo(contract.status);

    return (
        <div className="card" style={{ padding: '0' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                        <FiFileText fontSize="1.2rem" />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Contrato Digital</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{contract.contractNumber}</p>
                    </div>
                </div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '20px',
                    background: `${statusInfo.color}15`,
                    color: statusInfo.color,
                    fontSize: '0.85rem',
                    fontWeight: 600
                }}>
                    {statusInfo.icon} {statusInfo.label}
                </div>
            </div>

            <div style={{ padding: '1.5rem' }}>
                <div style={{
                    width: '100%',
                    height: '500px',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}>
                    <iframe
                        src={getFullUrl(contract.fileUrl)}
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        title="Contract PDF"
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                    <a
                        href={getFullUrl(contract.fileUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                    >
                        <FiDownload /> Baixar PDF
                    </a>

                    {contract.status === 'draft' && (
                        <button
                            onClick={handleSendForSignature}
                            disabled={sending}
                            className="btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <FiSend /> {sending ? 'Enviando...' : 'Enviar para Assinatura'}
                        </button>
                    )}

                    {contract.status === 'pending_signature' && (
                        <button
                            onClick={handleSendForSignature}
                            disabled={sending}
                            className="btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.8 }}
                        >
                            <FiSend /> Reenviar Pedido
                        </button>
                    )}
                </div>
            </div>

            {contract.status === 'signed' && (
                <div style={{ padding: '1.5rem', background: 'rgba(16, 185, 129, 0.05)', borderTop: '1px solid rgba(16, 185, 129, 0.1)', borderRadius: '0 0 12px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#10b981' }}>
                        <FiCheckCircle fontSize="1.2rem" />
                        <div>
                            <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>Contrato assinado digitalmente</p>
                            <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>Assinado em {new Date(contract.signedAt).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContractViewer;
