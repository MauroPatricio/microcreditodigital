import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import api from '../api';
import {
    FiArrowLeft, FiCheckCircle, FiXCircle, FiDollarSign,
    FiCalendar, FiClock, FiFileText, FiInfo
} from 'react-icons/fi';

const LoanDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loan, setLoan] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLoanDetails = async () => {
            try {
                const res = await api.get(`/credits/${id}`);
                if (res.data.success) {
                    setLoan(res.data.data.credit);
                }
            } catch (error) {
                console.error("Error fetching loan details", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLoanDetails();
    }, [id]);

    const handleApprove = async () => {
        try {
            const res = await api.put(`/credits/${id}/approve`);
            if (res.data.success) {
                setLoan(res.data.data.credit);
            }
        } catch (error) {
            console.error("Error approving loan", error);
        }
    };

    const handleDisburse = async () => {
        try {
            const res = await api.put(`/credits/${id}/disburse`, { disbursementMethod: 'mpesa' });
            if (res.data.success) {
                setLoan(res.data.data.credit);
            }
        } catch (error) {
            console.error("Error disbursing loan", error);
        }
    };

    if (loading) return <Layout><div style={{ color: 'var(--accent)' }}>Carregando detalhes do crédito...</div></Layout>;
    if (!loan) return <Layout><div>Crédito não encontrado.</div></Layout>;

    return (
        <Layout>
            <div style={{ marginBottom: '2rem' }}>
                <button
                    onClick={() => navigate('/loans')}
                    style={{
                        background: 'none', border: 'none', color: 'var(--text-muted)',
                        display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem',
                        fontSize: '0.9rem', fontWeight: 600
                    }}
                >
                    <FiArrowLeft /> Voltar para lista
                </button>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Gestão de Crédito</h1>
                        <p style={{ color: 'var(--text-muted)' }}>Contrato: {loan._id.toUpperCase()}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        {loan.status === 'pending' && (
                            <>
                                <button className="btn-primary" onClick={handleApprove}>Aprovar Crédito</button>
                                <button style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid var(--danger)', color: 'var(--danger)', background: 'none', fontWeight: 600 }}>Rejeitar</button>
                            </>
                        )}
                        {loan.status === 'approved' && (
                            <button className="btn-primary" style={{ background: 'var(--success)' }} onClick={handleDisburse}>Efetuar Desembolso</button>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Resumo Financeiro */}
                    <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                        <div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Valor do Crédito</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>{loan.amount.toLocaleString()} MT</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total a Pagar</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--warning)' }}>{loan.totalPayable.toLocaleString()} MT</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Status Atual</p>
                            <span style={{
                                display: 'inline-block', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 800,
                                background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent)', textTransform: 'uppercase'
                            }}>{loan.status}</span>
                        </div>
                    </div>

                    {/* Parcelas */}
                    <div className="card">
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Plano de Amortização</h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                        <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.8rem' }}>Nº</th>
                                        <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.8rem' }}>DATA VENC.</th>
                                        <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.8rem' }}>VALOR</th>
                                        <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.8rem' }}>PAGO</th>
                                        <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.8rem' }}>STATUS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loan.installments?.length > 0 ? (
                                        loan.installments.map(inst => (
                                            <tr key={inst._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{inst.installmentNumber}</td>
                                                <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{new Date(inst.dueDate).toLocaleDateString()}</td>
                                                <td style={{ padding: '1rem', fontSize: '0.9rem', fontWeight: 600 }}>{inst.totalAmount.toLocaleString()} MT</td>
                                                <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{inst.paidAmount.toLocaleString()} MT</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{
                                                        fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                                                        color: inst.status === 'paid' ? 'var(--success)' : inst.status === 'overdue' ? 'var(--danger)' : 'var(--warning)'
                                                    }}>{inst.status}</span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Plano de pagamento pendente de aprovação.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="card">
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Informações do Cliente</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                                {loan.client?.name?.charAt(0)}
                            </div>
                            <div>
                                <p style={{ fontWeight: 700 }}>{loan.client?.name}</p>
                                <Link to={`/clients/${loan.client?._id}`} style={{ color: 'var(--accent)', fontSize: '0.8rem', textDecoration: 'none' }}>Ver Perfil Completo</Link>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Telefone:</span>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{loan.client?.phone}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Score de Crédito:</span>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent)' }}>{loan.client?.creditScore}</span>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Condições</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <FiInfo style={{ color: 'var(--accent)' }} />
                                <div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Taxa de Juros</p>
                                    <p style={{ fontWeight: 600 }}>{loan.interestRate}% Mensal</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <FiCalendar style={{ color: 'var(--accent)' }} />
                                <div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Prazo do Empréstimo</p>
                                    <p style={{ fontWeight: 600 }}>{loan.term} Meses</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <FiFileText style={{ color: 'var(--accent)' }} />
                                <div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Finalidade</p>
                                    <p style={{ fontWeight: 600 }}>{loan.purpose}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default LoanDetail;
