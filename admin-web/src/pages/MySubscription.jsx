import React, { useState, useEffect } from 'react';
import api from '../api';
import Layout from '../components/Layout';
import { FiCreditCard, FiUploadCloud, FiCheckCircle, FiClock, FiXCircle } from 'react-icons/fi';
import Modal from '../components/Modal';

const MySubscription = () => {
    const [institution, setInstitution] = useState(null);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    
    // Modal state
    const [renewModal, setRenewModal] = useState({ isOpen: false });
    const [feedbackModal, setFeedbackModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
    const [formData, setFormData] = useState({ planRequested: 'standard', amountPaid: 3200, proof: null });
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // First fetch the current user to get their institution details
            const userRes = await api.get('/auth/me');
            const instData = userRes.data.data.activeInstitution || userRes.data.data.institution;
            setInstitution(instData);

            // Fetch request history
            const reqRes = await api.get('/institutions/my-subscription-requests');
            setRequests(reqRes.data.data);
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePlanChange = (e) => {
        const plan = e.target.value;
        const amount = plan === 'premium' ? 5000 : 3200;
        setFormData({ ...formData, planRequested: plan, amountPaid: amount });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, proof: file });
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.proof) {
            setFeedbackModal({
                isOpen: true,
                title: 'Atenção',
                message: 'Por favor, anexe o comprovativo de pagamento antes de submeter.',
                type: 'error'
            });
            return;
        }

        try {
            setActionLoading(true);
            const data = new FormData();
            data.append('planRequested', formData.planRequested);
            data.append('amountPaid', formData.amountPaid);
            data.append('proof', formData.proof);

            await api.post('/institutions/subscription-request', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            setRenewModal({ isOpen: false });
            setFeedbackModal({
                isOpen: true,
                title: 'Sucesso',
                message: 'Pedido submetido com sucesso! O Super Admin irá rever o comprovativo em breve.',
                type: 'success'
            });
            setFormData({ planRequested: 'standard', amountPaid: 3200, proof: null });
            setPreviewUrl(null);
            fetchData();
        } catch (error) {
            setFeedbackModal({
                isOpen: true,
                title: 'Erro ao Submeter',
                message: error.response?.data?.message || error.message || 'Ocorreu um erro ao processar o seu pedido.',
                type: 'error'
            });
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'approved': return <span className="badge badge-success"><FiCheckCircle/> Aprovado</span>;
            case 'pending': return <span className="badge badge-warning"><FiClock/> Pendente</span>;
            case 'rejected': return <span className="badge badge-danger"><FiXCircle/> Rejeitado</span>;
            default: return <span className="badge">{status}</span>;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    if (loading) return <Layout><div className="loading">A carregar...</div></Layout>;

    return (
        <Layout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Minha Subscrição</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Faça a gestão do seu plano, renovações e facturação.</p>
                </div>
                <button 
                    className="btn-primary" 
                    onClick={() => setRenewModal({ isOpen: true })}
                    style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <FiUploadCloud /> Renovar Agora
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {/* Current Status Card */}
                <div className="card glass" style={{ borderLeft: '4px solid var(--primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                        <div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Plano Actual</p>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'capitalize' }}>
                                {institution?.subscription?.plan || 'N/A'}
                            </h2>
                        </div>
                        <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '12px', color: 'var(--primary)' }}>
                            <FiCreditCard size={28} />
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
                        <FiClock style={{ color: 'var(--warning)' }} size={20} />
                        <div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Válido até</p>
                            <p style={{ fontWeight: 600 }}>{formatDate(institution?.subscription?.expiresAt)}</p>
                        </div>
                    </div>
                </div>

                {/* Bank Details Card */}
                <div className="card glass" style={{ borderLeft: '4px solid var(--success)' }}>
                    <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--success)' }}>💸</span> Coordenadas Bancárias
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                        Transfira o valor da renovação para a conta abaixo e anexe o comprovativo clicando em "Renovar Agora".
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '12px' }}>
                        <div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Banco</p>
                            <p style={{ fontWeight: 600 }}>BCI</p>
                        </div>
                        <div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Conta (MZN)</p>
                            <p style={{ fontWeight: 600 }}>26266610710001</p>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>NIB</p>
                            <p style={{ fontWeight: 600, letterSpacing: '1px' }}>0008 0000 6266 6107 1011 3</p>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Titular</p>
                            <p style={{ fontWeight: 600 }}>NHIQUELA SERVICOS & CONSULTORIA, SU LDA</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* History Table */}
            <div className="card">
                <h3 style={{ marginBottom: '1.5rem' }}>Histórico de Pedidos de Renovação</h3>
                <div className="table-responsive">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Data do Pedido</th>
                                <th>Plano Requisitado</th>
                                <th>Valor Pago</th>
                                <th>Estado</th>
                                <th>Notas do Admin</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.length > 0 ? requests.map(req => (
                                <tr key={req._id}>
                                    <td>{formatDate(req.createdAt)}</td>
                                    <td style={{ textTransform: 'capitalize' }}>{req.planRequested}</td>
                                    <td>{req.amountPaid} MT</td>
                                    <td>{getStatusBadge(req.status)}</td>
                                    <td>{req.reviewNotes || '-'}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Nenhum pedido de renovação encontrado.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Renew Modal */}
            <Modal maxWidth="700px" isOpen={renewModal.isOpen} onClose={() => !actionLoading && setRenewModal({ isOpen: false })} title="Renovar Subscrição">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label style={{ marginBottom: '1rem', display: 'block' }}>Seleccione o Pacote</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            {/* Standard Package */}
                            <div 
                                onClick={() => setFormData(prev => ({ ...prev, planRequested: 'standard', amountPaid: 3200 }))}
                                style={{ 
                                    border: formData.planRequested === 'standard' ? '2px solid var(--primary)' : '1px solid var(--border-color)', 
                                    padding: '1.5rem', 
                                    borderRadius: '12px', 
                                    cursor: 'pointer',
                                    position: 'relative',
                                    background: formData.planRequested === 'standard' ? 'rgba(59, 130, 246, 0.05)' : 'var(--bg-secondary)',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {formData.planRequested === 'standard' && (
                                    <FiCheckCircle size={24} color="var(--primary)" style={{ position: 'absolute', top: '1rem', right: '1rem' }} />
                                )}
                                <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text-heading)' }}>Standard</h4>
                                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '1.2rem' }}>3,200 MT <span style={{fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400}}>/ mês</span></p>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    <li><FiCheckCircle style={{ color: 'var(--success)', marginRight: '0.5rem', flexShrink: 0 }}/> Acesso ao Painel Web</li>
                                    <li><FiCheckCircle style={{ color: 'var(--success)', marginRight: '0.5rem', flexShrink: 0 }}/> Gestão Completa de Clientes</li>
                                    <li><FiCheckCircle style={{ color: 'var(--success)', marginRight: '0.5rem', flexShrink: 0 }}/> Relatórios e Estatísticas</li>
                                    <li><FiCheckCircle style={{ color: 'var(--success)', marginRight: '0.5rem', flexShrink: 0 }}/> Cálculo de Juros e Multas</li>
                                    <li><FiCheckCircle style={{ color: 'var(--success)', marginRight: '0.5rem', flexShrink: 0 }}/> Suporte Técnico Laboral</li>
                                </ul>
                            </div>

                            {/* Premium Package */}
                            <div 
                                onClick={() => setFormData(prev => ({ ...prev, planRequested: 'premium', amountPaid: 5000 }))}
                                style={{ 
                                    border: formData.planRequested === 'premium' ? '2px solid var(--primary)' : '1px solid var(--border-color)', 
                                    padding: '1.5rem', 
                                    borderRadius: '12px', 
                                    cursor: 'pointer',
                                    position: 'relative',
                                    background: formData.planRequested === 'premium' ? 'rgba(59, 130, 246, 0.05)' : 'var(--bg-secondary)',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {formData.planRequested === 'premium' && (
                                    <FiCheckCircle size={24} color="var(--primary)" style={{ position: 'absolute', top: '1rem', right: '1rem' }} />
                                )}
                                <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text-heading)' }}>Premium</h4>
                                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '1.2rem' }}>5,000 MT <span style={{fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400}}>/ mês</span></p>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    <li><FiCheckCircle style={{ color: 'var(--success)', marginRight: '0.5rem', flexShrink: 0 }}/> <strong>Todas as Funcionalidades Standard</strong></li>
                                    <li><FiCheckCircle style={{ color: 'var(--success)', marginRight: '0.5rem', flexShrink: 0 }}/> App Mobile para os seus Clientes</li>
                                    <li><FiCheckCircle style={{ color: 'var(--success)', marginRight: '0.5rem', flexShrink: 0 }}/> Assinatura Digital de Contratos</li>
                                    <li><FiCheckCircle style={{ color: 'var(--success)', marginRight: '0.5rem', flexShrink: 0 }}/> Integração Automática com M-Pesa</li>
                                    <li><FiCheckCircle style={{ color: 'var(--success)', marginRight: '0.5rem', flexShrink: 0 }}/> Notificações Ilimitadas (Push/SMS)</li>
                                    <li><FiCheckCircle style={{ color: 'var(--success)', marginRight: '0.5rem', flexShrink: 0 }}/> Gestão Multi-Filial Integrada</li>
                                    <li><FiCheckCircle style={{ color: 'var(--success)', marginRight: '0.5rem', flexShrink: 0 }}/> Suporte Prioritário VIP (24/7)</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="form-group" style={{ marginTop: '1rem' }}>
                        <label>Comprovativo de Pagamento (Imagem/PDF)</label>
                        <div style={{ 
                            border: '2px dashed var(--border-color)', 
                            padding: '2rem', 
                            textAlign: 'center',
                            borderRadius: '8px',
                            backgroundColor: 'var(--bg-secondary)',
                            cursor: 'pointer',
                            marginTop: '0.5rem'
                        }}>
                            <input 
                                type="file" 
                                accept="image/jpeg,image/png,application/pdf"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                                id="proof-upload"
                            />
                            <label htmlFor="proof-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <FiUploadCloud size={40} style={{ color: 'var(--primary-color)', marginBottom: '1rem' }} />
                                <span>{formData.proof ? formData.proof.name : 'Clique para anexar o comprovativo'}</span>
                            </label>
                        </div>
                    </div>

                    {previewUrl && formData.proof.type.startsWith('image/') && (
                        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                            <img src={previewUrl} alt="Comprovativo" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', objectFit: 'contain' }} />
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                        <button type="button" className="btn-outline" onClick={() => setRenewModal({ isOpen: false })} disabled={actionLoading}>Cancelar</button>
                        <button type="submit" className="btn-primary" disabled={actionLoading}>
                            {actionLoading ? 'A enviar...' : 'Submeter Pedido'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Feedback Modal */}
            <Modal 
                isOpen={feedbackModal.isOpen} 
                onClose={() => setFeedbackModal({ ...feedbackModal, isOpen: false })} 
                title={feedbackModal.title}
                type={feedbackModal.type}
            >
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>{feedbackModal.message}</p>
                <button 
                    className="btn-primary" 
                    style={{ marginTop: '2rem', width: '100%' }}
                    onClick={() => setFeedbackModal({ ...feedbackModal, isOpen: false })}
                >
                    Entendido
                </button>
            </Modal>
        </Layout>
    );
};

export default MySubscription;
