import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import api from '../api';
import {
    FiArrowLeft, FiUser, FiPhone, FiMail, FiMapPin,
    FiCalendar, FiCreditCard, FiShield, FiFileText,
    FiCheckCircle, FiXCircle, FiPlus
} from 'react-icons/fi';

const ClientProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [credits, setCredits] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClientData = async () => {
            try {
                const res = await api.get(`/clients/${id}`);
                if (res.data.success) {
                    setClient(res.data.data.client);
                    setCredits(res.data.data.credits);
                }
            } catch (error) {
                console.error("Error fetching client details", error);
            } finally {
                setLoading(false);
            }
        };

        fetchClientData();
    }, [id]);

    const handleVerify = async () => {
        try {
            const res = await api.put(`/clients/${id}/verify`);
            if (res.data.success) {
                setClient({ ...client, isVerified: true });
            }
        } catch (error) {
            console.error("Error verifying client", error);
        }
    };

    if (loading) return <Layout><div style={{ color: 'var(--accent)' }}>Carregando dados do perfil...</div></Layout>;
    if (!client) return <Layout><div>Cliente não encontrado.</div></Layout>;

    return (
        <Layout>
            <div style={{ marginBottom: '2rem' }}>
                <button
                    onClick={() => navigate('/clients')}
                    style={{
                        background: 'none', border: 'none', color: 'var(--text-muted)',
                        display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem',
                        fontSize: '0.9rem', fontWeight: 600
                    }}
                >
                    <FiArrowLeft /> Voltar para lista
                </button>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '24px', background: 'var(--primary-light)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 800, color: 'var(--accent)'
                        }}>{client.name.charAt(0)}</div>
                        <div>
                            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.25rem' }}>{client.name}</h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>ID: {client._id.slice(-8).toUpperCase()}</span>
                                {client.isVerified ? (
                                    <span style={{ color: 'var(--success)', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <FiCheckCircle /> VERIFICADO
                                    </span>
                                ) : (
                                    <button onClick={handleVerify} style={{
                                        background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent)', border: 'none', padding: '0.25rem 0.75rem',
                                        borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700
                                    }}>VERIFICAR AGORA</button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FiPlus /> Novo Empréstimo
                        </button>
                        <button style={{
                            padding: '0.75rem 1.25rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(255,255,255,0.02)', color: 'white', fontWeight: 600
                        }}>Gerar Relatório</button>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                {/* Lado Esquerdo - Info Pessoal */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="card">
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FiUser style={{ color: 'var(--accent)' }} /> Informações Pessoais
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <FiPhone style={{ color: 'var(--text-muted)' }} />
                                <div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Telefone</p>
                                    <p style={{ fontWeight: 600 }}>{client.phone}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <FiMail style={{ color: 'var(--text-muted)' }} />
                                <div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email</p>
                                    <p style={{ fontWeight: 600 }}>{client.email}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <FiShield style={{ color: 'var(--text-muted)' }} />
                                <div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>BI / NUIT</p>
                                    <p style={{ fontWeight: 600 }}>{client.identityDocument}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <FiCalendar style={{ color: 'var(--text-muted)' }} />
                                <div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Data de Nascimento</p>
                                    <p style={{ fontWeight: 600 }}>{new Date(client.dateOfBirth).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <FiMapPin style={{ color: 'var(--text-muted)' }} />
                                <div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Endereço</p>
                                    <p style={{ fontWeight: 600 }}>{client.address?.street}, {client.address?.city}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ background: 'linear-gradient(180deg, var(--bg-card) 0%, rgba(59, 130, 246, 0.05) 100%)' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FiTrendingUp style={{ color: 'var(--accent)' }} /> Perfil de Risco
                        </h3>
                        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                            <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--accent)', marginBottom: '0.5rem' }}>{client.creditScore}</div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Score Atual (0 - 1000)</p>
                            <div style={{
                                padding: '0.5rem', borderRadius: '8px',
                                background: client.riskProfile === 'low' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                color: client.riskProfile === 'low' ? 'var(--success)' : 'var(--warning)',
                                fontWeight: 700, fontSize: '0.85rem'
                            }}>
                                RISCO: {client.riskProfile?.toUpperCase()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lado Direito - Finanças e Documentos */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="card">
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FiCreditCard style={{ color: 'var(--accent)' }} /> Histórico de Empréstimos
                        </h3>
                        {credits.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {credits.map(credit => (
                                    <div key={credit._id} style={{
                                        padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                    }}>
                                        <div>
                                            <p style={{ fontWeight: 700, fontSize: '1rem' }}>{credit.amount.toLocaleString()} MT</p>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{credit.term} meses | {credit.purpose}</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{
                                                display: 'block', fontSize: '0.75rem', fontWeight: 700,
                                                color: credit.status === 'active' ? 'var(--accent)' : credit.status === 'paid' ? 'var(--success)' : 'var(--warning)',
                                                textTransform: 'uppercase', marginBottom: '0.25rem'
                                            }}>{credit.status}</span>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(credit.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                <FiFileText style={{ fontSize: '2rem', marginBottom: '1rem' }} />
                                <p>Nenhum empréstimo registrado para este cliente.</p>
                            </div>
                        )}
                    </div>

                    <div className="card">
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FiFileText style={{ color: 'var(--accent)' }} /> Documentos Anexos
                        </h3>
                        {client.documents?.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                {client.documents.map(doc => (
                                    <div key={doc._id} style={{
                                        padding: '0.75rem', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                                        display: 'flex', alignItems: 'center', gap: '0.75rem'
                                    }}>
                                        <FiFileText style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }} />
                                        <div style={{ overflow: 'hidden' }}>
                                            <p style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.fileName}</p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{doc.type.replace('_', ' ')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                <p>Nenhum documento anexado.</p>
                                <button style={{ marginTop: '1rem', color: 'var(--accent)', background: 'none', border: 'none', fontWeight: 600 }}>+ Fazer Upload</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ClientProfile;
