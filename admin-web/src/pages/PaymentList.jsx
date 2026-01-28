import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import api from '../api';
import { FiSearch, FiDownload, FiCheckCircle, FiClock, FiDollarSign } from 'react-icons/fi';

const PaymentList = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPayments = async () => {
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

        fetchPayments();
    }, []);

    return (
        <Layout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Gestão de Cobranças</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Histórico completo de pagamentos e recuperações.</p>
                </div>
                <button style={{
                    padding: '0.75rem 1.25rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.02)', color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}>
                    <FiDownload /> Exportar CSV
                </button>
            </div>

            <div className="card" style={{ padding: '0' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>ID TRANSACÇÃO</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>CLIENTE</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>VALOR</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>MÉTODO</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>DATA</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>STATUS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--accent)' }}>Carregando pagamentos...</td>
                                </tr>
                            ) : payments.length > 0 ? (
                                payments.map(payment => (
                                    <tr key={payment._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'var(--transition)' }}>
                                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--accent)' }}>
                                            {payment.transactionId}
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{payment.client?.name}</p>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--success)' }}>+{payment.amount.toLocaleString()} MT</p>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <span style={{
                                                fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)',
                                                textTransform: 'uppercase', background: 'rgba(255,255,255,0.03)', padding: '0.2rem 0.5rem', borderRadius: '4px'
                                            }}>{payment.paymentMethod}</span>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            {new Date(payment.createdAt).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 700,
                                                color: payment.status === 'completed' ? 'var(--success)' : 'var(--warning)'
                                            }}><FiCheckCircle /> {payment.status.toUpperCase()}</span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhuma cobrança registrada.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};

export default PaymentList;
