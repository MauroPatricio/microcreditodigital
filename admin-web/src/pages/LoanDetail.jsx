import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import api from '../api';
import {
    FiArrowLeft, FiCheckCircle, FiXCircle, FiDollarSign,
    FiCalendar, FiClock, FiFileText, FiInfo, FiShield,
    FiActivity, FiTarget, FiUser, FiMoreVertical, FiAlertCircle
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import ContractViewer from '../components/ContractViewer';

const LoanDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loan, setLoan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'success' });

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
                setModal({
                    isOpen: true,
                    title: 'Crédito Aprovado!',
                    message: 'A solicitação foi aprovada com sucesso e as parcelas foram geradas.',
                    type: 'success'
                });
            }
        } catch (error) {
            console.error("Error approving loan", error);
            setModal({
                isOpen: true,
                title: 'Erro na Aprovação',
                message: error.response?.data?.message || 'Ocorreu um erro ao aprovar o crédito.',
                type: 'error'
            });
        }
    };

    const handleReject = async () => {
        const reason = window.prompt("Por favor, indique o motivo da rejeição:");
        if (reason === null) return; // Cancelou

        try {
            const res = await api.put(`/credits/${id}/reject`, { reason });
            if (res.data.success) {
                setLoan(res.data.data.credit);
                setModal({
                    isOpen: true,
                    title: 'Crédito Rejeitado',
                    message: 'A solicitação foi rejeitada e o cliente será notificado.',
                    type: 'success'
                });
            }
        } catch (error) {
            console.error("Error rejecting loan", error);
            setModal({
                isOpen: true,
                title: 'Erro na Rejeição',
                message: error.response?.data?.message || 'Ocorreu um erro ao rejeitar o crédito.',
                type: 'error'
            });
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
            <div style={{ marginBottom: '2.5rem' }}>
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
                        <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.25rem' }}>Detalhes da Solicitação</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Protocolo: <span style={{ color: 'white', fontWeight: 600 }}>#{loan._id.toUpperCase()}</span></p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        {loan.status === 'pending' && (
                            <>
                                <button className="btn-primary" onClick={handleApprove} style={{ background: 'var(--success)' }}>Aprovar Crédito</button>
                                <button
                                    onClick={handleReject}
                                    style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid var(--danger)', color: 'var(--danger)', background: 'none', fontWeight: 700, cursor: 'pointer' }}
                                >
                                    REJEITAR
                                </button>
                            </>
                        )}
                        {loan.status === 'approved' && (
                            <button className="btn-primary" style={{ background: 'var(--accent)' }} onClick={handleDisburse}>Efetuar Desembolso</button>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Resumo Financeiro Premium */}
                    <div className="card glass" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', padding: '2rem' }}>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', fontWeight: 700 }}>Valor Solicitado</p>
                            <p style={{ fontSize: '1.8rem', fontWeight: 900 }}>{loan.amount.toLocaleString()} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>MT</span></p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', fontWeight: 700 }}>Total a Pagar</p>
                            <p style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--warning)' }}>{loan.totalPayable?.toLocaleString() || '---'} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>MT</span></p>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', fontWeight: 700 }}>Estado Atual</p>
                            <span style={{
                                display: 'inline-flex', padding: '0.4rem 1rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 800,
                                background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent)', textTransform: 'uppercase'
                            }}>{loan.status}</span>
                        </div>
                    </div>

                    {/* Scoring & Risk Analysis */}
                    {loan.scoring && (
                        <div className="card glass" style={{ padding: '2rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <FiActivity color="var(--accent)" /> Análise de Scoring & Risco
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '3rem', alignItems: 'center' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '3.5rem', fontWeight: 900, color: 'var(--accent)' }}>{loan.scoring.score}</div>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Score Consolidado</p>
                                </div>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontWeight: 700 }}>Risco: {loan.scoring.riskLevel?.toUpperCase()}</span>
                                        <span style={{ color: 'var(--text-muted)' }}>{loan.scoring.score}/1000</span>
                                    </div>
                                    <div style={{ height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${(loan.scoring.score / 1000) * 100}%`,
                                            height: '100%',
                                            background: loan.scoring.riskLevel === 'low' ? 'var(--success)' : loan.scoring.riskLevel === 'medium' ? 'var(--warning)' : 'var(--danger)'
                                        }}></div>
                                    </div>
                                    <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                                        {loan.scoring.findings?.length > 0 ? loan.scoring.findings[0] : 'Perfil de crédito analisado automaticamente pelo motor de risco.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Workflow History */}
                    {loan.workflowHistory?.length > 0 && (
                        <div className="card" style={{ padding: '2rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '2rem' }}>Fluxo de Aprovação</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {loan.workflowHistory.map((step, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '1.5rem', position: 'relative' }}>
                                        {idx !== loan.workflowHistory.length - 1 && (
                                            <div style={{ position: 'absolute', left: '11px', top: '24px', bottom: '-24px', width: '2px', background: 'rgba(255,255,255,0.05)' }}></div>
                                        )}
                                        <div style={{
                                            width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1
                                        }}>
                                            <FiCheckCircle size={14} color="white" />
                                        </div>
                                        <div style={{ flexGrow: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                                <span style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.85rem' }}>{step.stage} - {step.action}</span>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(step.timestamp).toLocaleString()}</span>
                                            </div>
                                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{step.comment}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Collateral / Garantias */}
                    {loan.collateral?.length > 0 && (
                        <div className="card">
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FiShield color="var(--accent)" /> Garantias Registradas
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                                {loan.collateral.map((item, idx) => (
                                    <div key={idx} className="glass" style={{ padding: '1.25rem', borderRadius: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', color: 'var(--accent)' }}>{item.type}</span>
                                            <span style={{ fontWeight: 800 }}>{item.value.toLocaleString()} MT</span>
                                        </div>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{item.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Contract Viewer */}
                    {(loan.status === 'approved' || loan.status === 'active' || loan.status === 'paid') && (
                        <ContractViewer creditId={loan._id} onUpdate={() => { }} />
                    )}

                    {/* Parcelas */}
                    {(loan.status === 'approved' || loan.status === 'active' || loan.status === 'paid') && (
                        <div className="card">
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.5rem' }}>Plano de Amortização</h3>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                            <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.8rem' }}>Nº</th>
                                            <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.8rem' }}>VENCIMENTO</th>
                                            <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.8rem' }}>VALOR</th>
                                            <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.8rem' }}>STATUS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loan.installments?.map(inst => (
                                            <tr key={inst._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{inst.installmentNumber}</td>
                                                <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{new Date(inst.dueDate).toLocaleDateString()}</td>
                                                <td style={{ padding: '1rem', fontSize: '0.9rem', fontWeight: 700 }}>{inst.totalAmount.toLocaleString()} MT</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{
                                                        fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase',
                                                        padding: '0.2rem 0.5rem', borderRadius: '4px',
                                                        background: inst.status === 'paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                        color: inst.status === 'paid' ? 'var(--success)' : 'var(--warning)'
                                                    }}>{inst.status}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Client Info Card */}
                    <div className="card glass" style={{ padding: '2rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '2rem' }}>Informações do Cliente</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2rem' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent)' }}>
                                {loan.client?.name?.charAt(0)}
                            </div>
                            <div>
                                <p style={{ fontWeight: 800, fontSize: '1.1rem' }}>{loan.client?.name}</p>
                                <Link to={`/clients/${loan.client?._id}`} style={{ color: 'var(--accent)', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 600 }}>Ver Perfil Completo</Link>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Telefone:</span>
                                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{loan.client?.phone}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Documento BI:</span>
                                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{loan.client?.identityDocument}</span>
                            </div>
                        </div>
                    </div>

                    {/* Conditions Card */}
                    <div className="card" style={{ padding: '2rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '2rem' }}>Condições Contratuais</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ padding: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '10px', color: 'var(--accent)' }}>
                                    <FiTarget size={20} />
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Taxa de Juros</p>
                                    <p style={{ fontWeight: 700 }}>{loan.interestRate}% <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mensal</span></p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ padding: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '10px', color: 'var(--accent)' }}>
                                    <FiCalendar size={20} />
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Prazo de Pagamento</p>
                                    <p style={{ fontWeight: 700 }}>{loan.term} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Meses</span></p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ padding: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '10px', color: 'var(--accent)' }}>
                                    <FiFileText size={20} />
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Finalidade</p>
                                    <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{loan.purpose}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
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

export default LoanDetail;
