import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { FiFileText, FiCheck, FiX, FiDownload, FiClock, FiSearch, FiMessageSquare } from 'react-icons/fi';
import api from '../api';

const PendingDocuments = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actioning, setActioning] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [previewDoc, setPreviewDoc] = useState(null);

    useEffect(() => {
        fetchPending();
    }, []);

    const fetchPending = async () => {
        try {
            setError(null);
            setLoading(true);
            const response = await api.get('/documents/pending');
            setDocuments(response.data.data || []);
            setLoading(false);
        } catch (err) {
            console.error('Erro ao buscar documentos pendentes:', err);
            setError(err.response?.data?.message || err.message || 'Erro ao carregar documentos');
            setLoading(false);
        }
    };

    const handleVerify = async (id, status, reason = '') => {
        setActioning(true);
        try {
            await api.put(`/documents/${id}/verify`, { status, reason });
            fetchPending();
        } catch (error) {
            alert('Erro ao processar documento: ' + (error.response?.data?.message || error.message));
        } finally {
            setActioning(false);
        }
    };

    const filteredDocs = (documents || []).filter(doc => {
        const clientName = doc.client?.name || '';
        const typeStr = doc.type || '';
        const term = (searchTerm || '').toLowerCase();
        return clientName.toLowerCase().includes(term) || typeStr.toLowerCase().includes(term);
    });

    const docTypeLabels = {
        'bi': 'Bilhete de Identidade',
        'identity_card': 'Documento de Identidade',
        'nuit': 'NUIT',
        'residence_proof': 'Comprovativo de Residência',
        'proof_of_address': 'Comprovativo de Morada',
        'income_proof': 'Comprovativo de Rendimentos',
        'contract': 'Contrato Assinado',
        'selfie': 'Selfie de Verificação'
    };

    const getViewUrl = (doc) => {
        const token = localStorage.getItem('token');
        return `${api.defaults.baseURL}/documents/${doc._id}/view?token=${token}`;
    };

    const getDownloadUrl = (doc) => {
        const token = localStorage.getItem('token');
        return `${api.defaults.baseURL}/documents/${doc._id}/download?token=${token}`;
    };

    return (
        <Layout>
            <div style={{ padding: '2.5rem', maxWidth: '1200px', margin: '0 auto' }}>
                <header style={{ marginBottom: '3.5rem', textAlign: 'center' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '64px',
                        height: '64px',
                        background: 'rgba(0, 255, 0, 0.1)',
                        borderRadius: '20px',
                        marginBottom: '1.5rem',
                        color: 'var(--accent)',
                        border: '1px solid rgba(0, 255, 0, 0.2)'
                    }}>
                        <FiFileText size={32} />
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.75rem', letterSpacing: '-1px' }}>
                        Validação de Documentos
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                        Analise técnica e validação de conformidade da documentação dos clientes
                    </p>
                </header>

                <div className="glass" style={{ padding: '1.5rem', marginBottom: '3rem', borderRadius: '24px', border: '1px solid var(--border-light)' }}>
                    <div style={{ position: 'relative' }}>
                        <FiSearch size={20} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent)', opacity: 0.7 }} />
                        <input
                            type="text"
                            placeholder="Buscar por nome do cliente, tipo de documento ou identificador..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '1.1rem 1.1rem 1.1rem 3.5rem',
                                borderRadius: '16px',
                                border: '1px solid var(--border-light)',
                                background: 'var(--bg-main)',
                                color: 'var(--text-main)',
                                fontSize: '1rem',
                                outline: 'none',
                                transition: 'all 0.3s'
                            }}
                            className="search-input-premium"
                        />
                    </div>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem' }}>
                        <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1.5rem' }}></div>
                        <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Sincronizando documentos...</p>
                    </div>
                ) : error ? (
                    <div className="glass fadeIn" style={{ textAlign: 'center', padding: '4rem 2rem', borderRadius: '32px', border: '1px solid rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.05)' }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--danger)' }}>Aviso</h3>
                        <p style={{ color: 'var(--text-muted)', maxWidth: '450px', margin: '0 auto 1.5rem', fontSize: '1rem' }}>
                            {error}
                        </p>
                        <button className="btn-primary" onClick={fetchPending} style={{ padding: '0.75rem 1.5rem', borderRadius: '12px' }}>
                            Tentar Novamente
                        </button>
                    </div>
                ) : filteredDocs.length === 0 ? (
                    <div className="glass fadeIn" style={{ textAlign: 'center', padding: '6rem 2rem', borderRadius: '32px', border: '1px solid var(--border-light)' }}>
                        <div style={{
                            width: '100px',
                            height: '100px',
                            background: 'rgba(0, 255, 0, 0.1)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 2rem',
                            border: '1px solid rgba(0, 255, 0, 0.2)'
                        }}>
                            <FiCheck size={48} style={{ color: '#00ff00' }} />
                        </div>
                        <h3 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem' }}>Tudo em ordem!</h3>
                        <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto', fontSize: '1.1rem', lineHeight: '1.6' }}>
                            Não há documentos pendentes de validação no momento. Todos os processos estão atualizados.
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '2rem' }}>
                        {filteredDocs.map(doc => (
                            <div key={doc._id} className="glass card-doc-premium fadeIn" style={{
                                padding: '2rem',
                                borderRadius: '28px',
                                border: '1px solid var(--border-light)',
                                display: 'flex',
                                flexDirection: 'column',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', position: 'relative', zIndex: 1 }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        background: 'rgba(0, 255, 0, 0.15)',
                                        borderRadius: '14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'var(--accent)',
                                        border: '1px solid rgba(0, 255, 0, 0.2)'
                                    }}>
                                        <FiFileText size={24} />
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => setPreviewDoc(doc)}
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '12px',
                                                background: 'var(--bg-main)',
                                                border: '1px solid var(--border-light)',
                                                color: 'var(--text-muted)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            title="Preview"
                                            className="btn-download-premium"
                                        >
                                            <FiSearch size={18} />
                                        </button>
                                        <button
                                            onClick={() => window.open(getDownloadUrl(doc), '_blank')}
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '12px',
                                                background: 'var(--bg-main)',
                                                border: '1px solid var(--border-light)',
                                                color: 'var(--text-muted)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            title="Download"
                                            className="btn-download-premium"
                                        >
                                            <FiDownload size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div style={{ position: 'relative', zIndex: 1 }}>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.3px' }}>
                                        {docTypeLabels[doc.type] || doc.type}
                                    </h3>
                                    <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                                        Cliente: <strong style={{ color: 'var(--text-main)', fontWeight: 700 }}>{doc.client?.name}</strong>
                                    </p>

                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.6rem',
                                        fontSize: '0.85rem',
                                        color: 'var(--text-muted)',
                                        background: 'var(--bg-main)',
                                        padding: '0.75rem 1rem',
                                        borderRadius: '12px',
                                        marginBottom: '2rem',
                                        width: 'fit-content'
                                    }}>
                                        <FiClock size={14} color="var(--accent)" />
                                        <span>Enviado em <strong style={{ color: 'var(--text-muted)' }}>{new Date(doc.createdAt).toLocaleDateString('pt-MZ')}</strong></span>
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto' }}>
                                        <button
                                            onClick={() => handleVerify(doc._id, 'approved')}
                                            disabled={actioning}
                                            className="btn-primary"
                                            style={{
                                                flex: 1,
                                                background: '#10b981',
                                                border: 'none',
                                                fontSize: '0.8rem',
                                                fontWeight: 700,
                                                padding: '0.9rem',
                                                borderRadius: '16px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.5rem',
                                                boxShadow: '0 10px 20px -10px rgba(16, 185, 129, 0.4)'
                                            }}
                                        >
                                            <FiCheck size={18} /> Aprovar
                                        </button>
                                        <button
                                            onClick={() => {
                                                const reason = window.prompt('Motivo da rejeição:');
                                                if (reason) handleVerify(doc._id, 'rejected', reason);
                                            }}
                                            disabled={actioning}
                                            style={{
                                                flex: 1,
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                                color: '#ef4444',
                                                fontSize: '0.8rem',
                                                fontWeight: 700,
                                                padding: '0.9rem',
                                                borderRadius: '16px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.5rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            className="btn-reject-premium"
                                        >
                                            <FiX size={18} /> Rejeitar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {previewDoc && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.85)',
                        backdropFilter: 'blur(10px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2000,
                        padding: '2rem'
                    }}
                    onClick={() => setPreviewDoc(null)}
                >
                    <div
                        style={{
                            maxWidth: '900px',
                            width: '100%',
                            maxHeight: '90vh',
                            background: 'var(--bg-card)',
                            borderRadius: '32px',
                            border: '1px solid var(--glass-border)',
                            overflow: 'hidden',
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <h3 style={{ fontWeight: 800, margin: 0 }}>Visualizar: {docTypeLabels[previewDoc.type] || previewDoc.type}</h3>
                                <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Cliente: {previewDoc.client?.name}</p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <button
                                    onClick={() => {
                                        handleVerify(previewDoc._id, 'approved');
                                        setPreviewDoc(null);
                                    }}
                                    style={{ padding: '0.5rem 1rem', borderRadius: '10px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                >
                                    <FiCheck size={16} /> Aprovar
                                </button>
                                <button
                                    onClick={() => {
                                        const reason = window.prompt('Motivo da rejeição:');
                                        if (reason) {
                                            handleVerify(previewDoc._id, 'rejected', reason);
                                            setPreviewDoc(null);
                                        }
                                    }}
                                    style={{ padding: '0.5rem 1rem', borderRadius: '10px', background: 'rgba(239,68,68,0.2)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                >
                                    <FiX size={16} /> Rejeitar
                                </button>
                                <a
                                    href={getDownloadUrl(previewDoc)}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ padding: '0.5rem 1rem', borderRadius: '10px', background: 'var(--accent)', color: '#000', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                >
                                    <FiDownload size={16} /> Descarregar
                                </a>
                                <button
                                    onClick={() => setPreviewDoc(null)}
                                    style={{ background: 'var(--bg-main)', border: 'none', color: 'var(--text-main)', width: '40px', height: '40px', borderRadius: '12px', cursor: 'pointer' }}
                                >
                                    <FiX size={24} />
                                </button>
                            </div>
                        </div>
                        <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', minHeight: '500px' }}>
                            {previewDoc.fileType?.includes('image') || previewDoc.fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                <img
                                    src={getViewUrl(previewDoc)}
                                    alt="Document"
                                    style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain' }}
                                />
                            ) : (
                                <iframe
                                    src={getViewUrl(previewDoc)}
                                    style={{ width: '100%', height: '70vh', border: 'none' }}
                                    title="PDF Preview"
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .fadeIn { animation: fadeIn 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
                
                .search-input-premium:focus {
                    background: rgba(255,255,255,0.05) !important;
                    border-color: var(--accent) !important;
                    box-shadow: 0 0 0 3px rgba(0, 255, 0, 0.05);
                }

                .card-doc-premium:hover {
                    transform: translateY(-4px);
                    border-color: rgba(0, 255, 0, 0.2) !important;
                    background: rgba(255,255,255,0.05) !important;
                    box-shadow: 0 10px 25px -10px rgba(0,0,0,0.3) !important;
                }

                .btn-download-premium:hover {
                    background: var(--accent) !important;
                    color: black !important;
                    border-color: var(--accent) !important;
                    transform: scale(1.1);
                }

                .btn-reject-premium:hover {
                    background: rgba(239, 68, 68, 0.2) !important;
                    transform: translateY(-2px);
                }

                .btn-primary:hover:not(:disabled) {
                    transform: translateY(-1px);
                    box-shadow: 0 8px 15px -5px rgba(16, 185, 129, 0.3) !important;
                }
            `}</style>
        </Layout>
    );
};

export default PendingDocuments;
