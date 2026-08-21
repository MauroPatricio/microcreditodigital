import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import api from '../api';
import { FiSearch, FiDownload, FiCheckCircle, FiClock, FiDollarSign, FiXCircle, FiEye, FiX } from 'react-icons/fi';
import Modal from '../components/Modal';

const PaymentList = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'error' });

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const res = await api.get('/payments');
            if (res.data.success) {
                setPayments(res.data.data.payments);
            }
        } catch (error) {
            console.error("Error fetching payments", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    const handleReviewPayment = async (status) => {
        if (!selectedPayment) return;
        setProcessing(true);
        try {
            const res = await api.post(`/payments/${selectedPayment._id}/confirm`, {
                status,
                notes: status === 'rejected' ? 'Comprovativo inválido.' : 'Pagamento confirmado com sucesso.'
            });

            if (res.data.success) {
                setModal({
                    isOpen: true,
                    title: 'Sucesso',
                    message: `Pagamento ${status === 'completed' ? 'aprovado' : 'rejeitado'} com sucesso!`,
                    type: 'success'
                });
                setSelectedPayment(null);
                fetchPayments();
            }
        } catch (error) {
            console.error("Error confirming payment", error);
            setModal({
                isOpen: true,
                title: 'Erro',
                message: error.response?.data?.message || 'Erro ao processar o pagamento.',
                type: 'error'
            });
        } finally {
            setProcessing(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed': return <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}><FiCheckCircle /> CONFIRMADO</span>;
            case 'pending': return <span style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}><FiClock /> EM ANÁLISE</span>;
            case 'rejected': return <span style={{ color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}><FiXCircle /> REJEITADO</span>;
            default: return <span>{status}</span>;
        }
    };

    return (
        <Layout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Gestão de Cobranças</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Aprove ou rejeite pagamentos submetidos pelos clientes.</p>
                </div>
                <button style={{
                    padding: '0.75rem 1.25rem', borderRadius: '8px', border: '1px solid var(--border-light)',
                    background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}>
                    <FiDownload /> Exportar CSV
                </button>
            </div>

            <div className="card" style={{ padding: '0' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-main)' }}>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>ID TRANSACÇÃO</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>CLIENTE</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>VALOR</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>MÉTODO</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>DATA</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>STATUS</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>AÇÃO</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--accent)' }}>Carregando pagamentos...</td>
                                </tr>
                            ) : payments.length > 0 ? (
                                payments.map(payment => (
                                    <tr key={payment._id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'var(--transition)' }}>
                                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--accent)' }}>
                                            {payment.transactionId}
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{payment.client?.name || 'Cliente Desconhecido'}</p>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--success)' }}>+{payment.amount?.toLocaleString()} MT</p>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <span style={{
                                                fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)',
                                                textTransform: 'uppercase', background: 'var(--bg-main)', padding: '0.2rem 0.5rem', borderRadius: '4px'
                                            }}>{payment.paymentMethod}</span>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            {new Date(payment.createdAt).toLocaleDateString('pt-MZ')}
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            {getStatusBadge(payment.status)}
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            {payment.status === 'pending' ? (
                                                <button 
                                                    onClick={() => setSelectedPayment(payment)}
                                                    style={{ background: 'var(--accent)', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 600 }}
                                                >
                                                    <FiEye /> Rever
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => setSelectedPayment(payment)}
                                                    style={{ background: 'var(--bg-main)', color: 'var(--text-muted)', border: '1px solid var(--border-light)', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 600 }}
                                                >
                                                    <FiEye /> Detalhes
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhuma cobrança registrada.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Review Payment Modal */}
            {selectedPayment && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
                    <div style={{ background: 'var(--bg-panel)', width: '100%', maxWidth: '600px', borderRadius: '16px', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--border-light)' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Rever Pagamento</h2>
                            <button onClick={() => setSelectedPayment(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <FiX size={24} />
                            </button>
                        </div>
                        <div style={{ padding: '1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Cliente</p>
                                    <p style={{ fontWeight: 600 }}>{selectedPayment.client?.name}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Valor</p>
                                    <p style={{ fontWeight: 700, color: 'var(--success)' }}>{selectedPayment.amount?.toLocaleString()} MT</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Referência / ID</p>
                                    <p style={{ fontWeight: 600, fontFamily: 'monospace' }}>{selectedPayment.transactionId}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Método</p>
                                    <p style={{ fontWeight: 600, textTransform: 'uppercase' }}>{selectedPayment.paymentMethod}</p>
                                </div>
                            </div>
                            
                            {selectedPayment.receiptUrl && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Comprovativo em Anexo:</p>
                                    <img 
                                        src={`${api.defaults.baseURL.replace('/api', '')}${selectedPayment.receiptUrl}`} 
                                        alt="Comprovativo" 
                                        style={{ width: '100%', borderRadius: '12px', border: '1px solid var(--border-light)', maxHeight: '300px', objectFit: 'contain', background: '#000' }}
                                    />
                                </div>
                            )}

                            {selectedPayment.status === 'pending' && (
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                    <button 
                                        onClick={() => handleReviewPayment('rejected')}
                                        disabled={processing}
                                        style={{ flex: 1, padding: '1rem', borderRadius: '12px', border: 'none', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', fontWeight: 700, cursor: 'pointer' }}
                                    >
                                        {processing ? 'Processando...' : 'Rejeitar Inválido'}
                                    </button>
                                    <button 
                                        onClick={() => handleReviewPayment('completed')}
                                        disabled={processing}
                                        style={{ flex: 1, padding: '1rem', borderRadius: '12px', border: 'none', background: 'var(--success)', color: 'white', fontWeight: 700, cursor: 'pointer' }}
                                    >
                                        {processing ? 'Processando...' : 'Aprovar Pagamento'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <Modal
                isOpen={modal.isOpen}
                onClose={() => setModal({ ...modal, isOpen: false })}
                title={modal.title}
                message={modal.message}
                type={modal.type}
            />
        </Layout>
    );
};

export default PaymentList;
