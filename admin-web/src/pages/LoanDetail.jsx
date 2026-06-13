import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import api from '../api';
import {
    FiArrowLeft, FiCheckCircle, FiXCircle, FiDollarSign,
    FiCalendar, FiClock, FiFileText, FiInfo, FiShield,
    FiActivity, FiTarget, FiUser, FiMoreVertical, FiAlertCircle,
    FiHash, FiMessageSquare, FiTrendingDown, FiPrinter
} from 'react-icons/fi';
import ContractViewer from '../components/ContractViewer.jsx';
import ConfidenceIndicator from '../components/ConfidenceIndicator.jsx';
import Modal from '../components/Modal.jsx';

const LoanDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loan, setLoan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'success' });
    const [paymentModal, setPaymentModal] = useState({ isOpen: false, installment: null, amount: '', method: 'mpesa', processing: false });

    const fetchLoanDetails = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            // Adicionado cache-buster para evitar dados obsoletos do status
            const res = await api.get(`/credits/${id}?_t=${Date.now()}`);
            if (res.data.success) {
                setLoan(res.data.data.credit);
            }
        } catch (error) {
            console.error("Error fetching loan details", error);
        } finally {
            if (!silent) setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchLoanDetails();
    }, [fetchLoanDetails]);

    const handleApprove = async () => {
        const confirm = window.confirm("Deseja realmente aprovar este crédito?");
        if (!confirm) return;

        try {
            const res = await api.put(`/credits/${id}/approve`);
            if (res.data.success) {
                setLoan(res.data.data.credit);
                setModal({
                    isOpen: true,
                    title: 'Crédito Aprovado!',
                    message: 'A solicitação foi aprovada e as parcelas foram geradas.',
                    type: 'success'
                });
            }
        } catch (error) {
            console.error("Error approving loan", error);
            const errorMsg = error.response?.data?.message || 'Erro ao aprovar.';

            // Se o erro for 400 (provavelmente já aprovado), recarregamos os dados
            if (error.response?.status === 400) {
                setModal({
                    isOpen: true,
                    title: 'Processo Concluído ou em Curso',
                    message: `${errorMsg}. O sistema irá atualizar os dados para refletir o estado real.`,
                    type: 'info'
                });
                setTimeout(() => fetchLoanDetails(), 1000);
            } else {
                setModal({
                    isOpen: true,
                    title: 'Erro na Aprovação',
                    message: errorMsg,
                    type: 'error'
                });
            }
        }
    };

    const handleReject = async () => {
        const reason = window.prompt("Motivo da rejeição:");
        if (reason === null) return;

        try {
            const res = await api.put(`/credits/${id}/reject`, { reason });
            if (res.data.success) {
                setLoan(res.data.data.credit);
                setModal({
                    isOpen: true,
                    title: 'Crédito Rejeitado',
                    message: 'A solicitação foi rejeitada.',
                    type: 'success'
                });
            }
        } catch (error) {
            setModal({
                isOpen: true,
                title: 'Erro na Rejeição',
                message: error.response?.data?.message || 'Erro ao rejeitar.',
                type: 'error'
            });
            fetchLoanDetails();
        }
    };

    const handleDisburse = async () => {
        try {
            const res = await api.put(`/credits/${id}/disburse`, { disbursementMethod: 'mpesa' });
            if (res.data.success) {
                setLoan(res.data.data.credit);
                setModal({
                    isOpen: true,
                    title: 'Desembolso Efetuado',
                    message: 'O valor foi creditado ao cliente com sucesso.',
                    type: 'success'
                });
            }
        } catch (error) {
            setModal({
                isOpen: true,
                title: 'Erro no Desembolso',
                message: error.response?.data?.message || 'Erro ao desembolsar.',
                type: 'error'
            });
        }
    };

    const handleToggleStatus = async (inst) => {
        try {
            const res = await api.put(`/credits/${id}/installments/${inst._id}/toggle-status`);
            if (res.data.success) {
                setLoan(res.data.data.credit);
                setModal({
                    isOpen: true,
                    title: 'Status Atualizado',
                    message: res.data.message,
                    type: 'success'
                });
            }
        } catch (error) {
            console.error("Error toggling status", error);
            setModal({
                isOpen: true,
                title: 'Erro de Atualização',
                message: error.response?.data?.message || 'Erro ao alternar status.',
                type: 'error'
            });
        }
    };

    const handleRestructure = () => {
        const confirm = window.confirm("Deseja iniciar o processo de reestruturação deste crédito? Isso permitirá alterar prazos e condições.");
        if (!confirm) return;
        // Navegar para uma página de edição/reestruturação ou abrir modal especializado
        alert("Funcionalidade de Reestruturação em desenvolvimento. Redirecionando para suporte.");
    };

    const handleEarlyLiquidation = async () => {
        const balance = loan.totalPayable - loan.totalPaid;
        const confirm = window.confirm(`Deseja efetuar a liquidação antecipada? O saldo devedor atual é de ${balance.toLocaleString()} MT.`);
        if (!confirm) return;

        try {
            setLoading(true);
            const res = await api.put(`/credits/${id}/liquidate`);
            if (res.data.success) {
                setLoan(res.data.data.credit);
                setModal({
                    isOpen: true,
                    title: 'Crédito Liquidado',
                    message: 'O empréstimo foi encerrado com sucesso por liquidação antecipada.',
                    type: 'success'
                });
            }
        } catch (error) {
            console.error("Error liquidating loan", error);
            alert(error.response?.data?.message || 'Erro ao liquidar antecipadamente.');
        } finally {
            setLoading(false);
        }
    };

    const openPaymentModal = (inst) => {
        setPaymentModal({
            isOpen: true,
            installment: inst,
            amount: inst.totalAmount - inst.paidAmount,
            method: 'mpesa',
            processing: false
        });
    };

    const handleProcessPayment = async (e) => {
        e.preventDefault();
        setPaymentModal(prev => ({ ...prev, processing: true }));

        try {
            const res = await api.post('/payments', {
                creditId: id,
                installmentId: paymentModal.installment?._id,
                amount: parseFloat(paymentModal.amount),
                paymentMethod: paymentModal.method,
                transactionId: `ADM-${Date.now()}`
            });

            if (res.data.success) {
                setPaymentModal({ isOpen: false, installment: null, amount: '', method: 'mpesa', processing: false });
                setModal({
                    isOpen: true,
                    title: 'Pagamento Registado',
                    message: 'O pagamento foi processado e o saldo atualizado.',
                    type: 'success'
                });
                fetchLoanDetails(true);
            }
        } catch (error) {
            console.error("Error processing payment", error);
            alert(error.response?.data?.message || 'Erro ao processar pagamento.');
        } finally {
            setPaymentModal(prev => ({ ...prev, processing: false }));
        }
    };

    if (loading) return <Layout><div style={{ color: 'var(--accent)', padding: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}><FiActivity className="spin" /> Carregando detalhes do crédito...</div></Layout>;
    if (!loan) return <Layout><div style={{ padding: '2rem' }}>Crédito não encontrado.</div></Layout>;

    const hasPopulatedInstallments = loan.installments && loan.installments.length > 0 && typeof loan.installments[0] === 'object';

    return (
        <Layout>
            <>
                {/* Header com Navegação e Ações Principais */}
                <div style={{ marginBottom: '2.5rem' }}>
                    <button
                        onClick={() => navigate('/loans')}
                        style={{
                            background: 'none', border: 'none', color: 'var(--text-muted)',
                            display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem',
                            fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer'
                        }}
                    >
                        <FiArrowLeft /> Voltar para lista
                    </button>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                <span style={{
                                    padding: '0.2rem 0.6rem', background: 'var(--primary-dark)', color: 'var(--accent)',
                                    borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase'
                                }}>
                                    {loan.periodicity === 'monthly' ? 'Mensal' : loan.periodicity}
                                </span>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>ID: {loan._id}</span>
                            </div>
                            <h1 style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
                                Protocolo #<span style={{ color: 'var(--accent)' }}>{loan._id.substring(loan._id.length - 8).toUpperCase()}</span>
                            </h1>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            {loan.status === 'pending' && (
                                <>
                                    <button className="btn-primary" onClick={handleApprove} style={{ background: 'var(--success)', color: 'white' }}>
                                        <FiCheckCircle style={{ marginRight: '0.5rem' }} /> APROVAR CRÉDITO
                                    </button>
                                    <button
                                        onClick={handleReject}
                                        style={{
                                            padding: '0.75rem 1.25rem', borderRadius: '10px', border: '1px solid var(--danger)',
                                            color: 'var(--danger)', background: 'rgba(220, 38, 38, 0.05)', fontWeight: 700,
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
                                        }}
                                    >
                                        <FiXCircle /> REJEITAR
                                    </button>
                                </>
                            )}
                            {loan.status === 'approved' && (
                                <button className="btn-primary" style={{ background: 'var(--accent)' }} onClick={handleDisburse}>
                                    <FiDollarSign style={{ marginRight: '0.5rem' }} /> EFETUAR DESEMBOLSO
                                </button>
                            )}
                            {(loan.status === 'active' || loan.status === 'overdue') && (
                                <>
                                    <button className="btn-secondary" onClick={handleRestructure} style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <FiActivity /> REESTRUTURAR
                                    </button>
                                    <button className="btn-secondary" onClick={handleEarlyLiquidation} style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', border: '1px solid var(--success)' }}>
                                        <FiCheckCircle /> LIQUIDAÇÃO ANTECIPADA
                                    </button>
                                </>
                            )}
                            <button className="btn-secondary" style={{ padding: '0.75rem' }} title="Imprimir Detalhes">
                                <FiPrinter size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.9fr 1.1fr', gap: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                        {/* Cards de Resumo Rápido */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
                            <div className="card glass" style={{ padding: '1.5rem' }}>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 700 }}>Valor do Crédito</p>
                                <p style={{ fontSize: '1.6rem', fontWeight: 900 }}>{loan.amount.toLocaleString()} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>MT</span></p>
                                {loan.approvedAmount > 0 && loan.approvedAmount !== loan.amount && (
                                    <p style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.25rem' }}>Aprovado: {loan.approvedAmount.toLocaleString()} MT</p>
                                )}
                            </div>
                            <div className="card glass" style={{ padding: '1.5rem' }}>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 700 }}>Total a Pagar</p>
                                <p style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--warning)' }}>{loan.totalPayable?.toLocaleString() || '---'} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>MT</span></p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Juros incluídos</p>
                            </div>
                            <div className="card glass" style={{ padding: '1.5rem' }}>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 700 }}>Data de Término</p>
                                <p style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)' }}>
                                    {loan.endDate ? new Date(loan.endDate).toLocaleDateString('pt-MZ') :
                                        hasPopulatedInstallments ? new Date(loan.installments[loan.installments.length - 1].dueDate).toLocaleDateString('pt-MZ') :
                                            '---'}
                                </p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Previsão de Liquidação</p>
                            </div>
                            <div className="card glass" style={{ padding: '1.5rem' }}>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 700 }}>Estado do Processo</p>
                                <span className="badge-green" style={{
                                    display: 'inline-flex', padding: '0.3rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase'
                                }}>{loan.status}</span>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>Fase: {loan.currentStage}</p>
                            </div>
                        </div>

                        {/* Plano de Amortização (Parcelas) */}
                        {hasPopulatedInstallments && (
                            <div className="card" style={{ padding: '2rem' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.5rem' }}>Plano de Amortização</h3>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                        <thead>
                                            <tr style={{ background: 'var(--bg-main)' }}>
                                                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.8rem' }}>Nº</th>
                                                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.8rem' }}>VENCIMENTO</th>
                                                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.8rem' }}>VALOR PARCELA</th>
                                                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.8rem' }}>CAPITAL / JUROS</th>
                                                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.8rem' }}>STATUS</th>
                                                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.8rem' }}>AÇÕES</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loan.installments.map(inst => {
                                                if (!inst || typeof inst === 'string') return null;
                                                return (
                                                    <tr key={inst._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <td style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: 700 }}>{inst.installmentNumber}</td>
                                                        <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{new Date(inst.dueDate).toLocaleDateString('pt-MZ')}</td>
                                                        <td style={{ padding: '1rem', fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent)' }}>{inst.totalAmount?.toLocaleString()} MT</td>
                                                        <td style={{ padding: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                            {inst.principal?.toLocaleString()} / {inst.interest?.toLocaleString()}
                                                        </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <button
                                                            onClick={() => handleToggleStatus(inst)}
                                                            style={{
                                                                fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase',
                                                                padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer',
                                                                background: inst.status === 'paid' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.1)',
                                                                color: inst.status === 'paid' ? 'var(--success)' : 'var(--warning)',
                                                                border: `1px solid ${inst.status === 'paid' ? 'var(--success)' : 'var(--warning)'}`,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.4rem',
                                                                width: 'fit-content'
                                                            }}
                                                            title="Clique para alternar status"
                                                        >
                                                            {inst.status === 'paid' ? <><FiCheckCircle /> PAGO</> : <><FiClock /> PENDENTE</>}
                                                        </button>
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        {inst.status !== 'paid' && loan.status === 'active' && (
                                                            <button
                                                                onClick={() => openPaymentModal(inst)}
                                                                style={{
                                                                    padding: '0.4rem 0.8rem', borderRadius: '6px', background: 'var(--accent)',
                                                                    color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 800,
                                                                    display: 'flex', alignItems: 'center', gap: '0.4rem'
                                                                }}
                                                            >
                                                                <FiDollarSign size={12} /> Pagar
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Finalidade & Descrição */}
                        <div className="card" style={{ padding: '2rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <FiFileText color="var(--accent)" /> Finalidade do Crédito
                            </h3>
                            <p style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-main)', lineHeight: '1.5' }}>
                                {loan.purpose}
                            </p>
                            {loan.notes && (
                                <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-main)', borderRadius: '10px', fontSize: '0.9rem', borderLeft: '3px solid var(--accent)' }}>
                                    <strong>Observações:</strong> {loan.notes}
                                </div>
                            )}
                            {loan.status === 'rejected' && loan.rejectionReason && (
                                <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(220, 38, 38, 0.05)', borderRadius: '10px', fontSize: '0.9rem', border: '1px dashed var(--danger)', color: 'var(--danger)' }}>
                                    <strong>Motivo da Rejeição:</strong> {loan.rejectionReason}
                                </div>
                            )}
                        </div>

                        {/* Análise de Confiança & Risco */}
                        <div className="card glass" style={{ padding: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <FiActivity color="var(--accent)" /> Análise de Risco Fintech
                                </h3>
                                <span style={{
                                    padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase',
                                    background: loan.riskCategory === 'high' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                    color: loan.riskCategory === 'high' ? 'var(--danger)' : 'var(--success)',
                                    border: `1px solid ${loan.riskCategory === 'high' ? 'var(--danger)' : 'var(--success)'}`
                                }}>
                                    Risco: {loan.riskCategory || 'Baixo'}
                                </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
                                <div>
                                    <ConfidenceIndicator
                                        level={loan.confidenceAnalysis?.level || 3}
                                        label={loan.confidenceAnalysis?.label || 'Moderado'}
                                        percentage={loan.confidenceAnalysis?.percentage || 60}
                                    />
                                    <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-main)', borderRadius: '12px' }}>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Score de Performance</p>
                                        <p style={{ fontSize: '1.5rem', fontWeight: 900 }}>{loan.paymentPerformanceScore || 100} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>/ 100</span></p>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    <div style={{ padding: '1rem', background: 'var(--bg-main)', borderRadius: '12px', borderLeft: '4px solid var(--warning)' }}>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Atrasos Registrados</p>
                                        <p style={{ fontSize: '1.2rem', fontWeight: 800 }}>{loan.timesLate || 0} vezes</p>
                                    </div>
                                    <div style={{ padding: '1rem', background: 'var(--bg-main)', borderRadius: '12px', borderLeft: '4px solid var(--accent)' }}>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Dias em Atraso (Atual)</p>
                                        <p style={{ fontSize: '1.2rem', fontWeight: 800 }}>{loan.overdueDays || 0} dias</p>
                                    </div>
                                    {loan.defaultFlag && (
                                        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', border: '1px dashed var(--danger)', color: 'var(--danger)' }}>
                                            <p style={{ fontSize: '0.75rem', fontWeight: 800 }}>⚠️ ALERTA DE INADIMPLÊNCIA</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Garantias (Collateral) */}
                        {loan.collateral?.length > 0 && (
                            <div className="card" style={{ padding: '2rem' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <FiShield color="var(--accent)" /> Garantias do Crédito
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                                    {loan.collateral.map((item, idx) => (
                                        <div key={idx} style={{
                                            padding: '1.25rem', background: 'var(--bg-main)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                        }}>
                                            <div>
                                                <p style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase' }}>{item.type}</p>
                                                <p style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.25rem' }}>{item.description}</p>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <p style={{ fontSize: '1.1rem', fontWeight: 900 }}>{item.value?.toLocaleString()} MT</p>
                                                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Valor Estimado</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Sidebar com Detalhes Adicionais */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                        {/* Informações do Cliente Sidebar */}
                        <div className="card glass" style={{ padding: '2rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '2rem' }}>Perfil do Requerente</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2rem', padding: '1rem', background: 'var(--bg-main)', borderRadius: '16px' }}>
                                <div style={{
                                    width: '56px', height: '56px', borderRadius: '12px', background: 'var(--primary-light)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: 900, color: 'var(--accent)'
                                }}>
                                    {loan.client?.name?.charAt(0)}
                                </div>
                                <div>
                                    <p style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.25rem' }}>{loan.client?.name}</p>
                                    <Link to={`/clients/${loan.client?._id}`} style={{ color: 'var(--accent)', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <FiUser size={12} /> Ver Perfil Completo
                                    </Link>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.4rem' }}>Documento de Identidade</p>
                                    <p style={{ fontSize: '0.9rem', fontWeight: 700 }}>{loan.client?.identityDocument || 'N/A'}</p>
                                </div>
                                <div>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.4rem' }}>Contacto Principal</p>
                                    <p style={{ fontSize: '0.9rem', fontWeight: 700 }}>{loan.client?.phone}</p>
                                </div>
                            </div>
                        </div>

                        {/* Condições Contratuais Sidebar */}
                        <div className="card" style={{ padding: '2rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '2rem' }}>Termos do Contrato</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ padding: '0.6rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '10px', color: 'var(--accent)' }}>
                                        <FiTarget size={20} />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Taxa de Juros</p>
                                        <p style={{ fontWeight: 800 }}>{loan.interestRate}% <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>ao período</span></p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ padding: '0.6rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '10px', color: 'var(--accent)' }}>
                                        <FiCalendar size={20} />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Prazo Total</p>
                                        <p style={{ fontWeight: 800 }}>{loan.term} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{loan.periodicity === 'monthly' ? 'Meses' : 'Períodos'}</span></p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ padding: '0.6rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '10px', color: 'var(--accent)' }}>
                                        <FiClock size={20} />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Data da Solicitação</p>
                                        <p style={{ fontWeight: 800 }}>{new Date(loan.requestedAt || loan.createdAt).toLocaleDateString('pt-MZ')}</p>
                                    </div>
                                </div>
                                {loan.installments?.length > 0 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ padding: '0.6rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '10px', color: 'var(--success)' }}>
                                            <FiCalendar size={20} />
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Vencimento Final</p>
                                            <p style={{ fontWeight: 800 }}>{new Date(loan.installments[loan.installments.length - 1].dueDate).toLocaleDateString('pt-MZ')}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Histórico do Workflow (Compacto) */}
                        <div className="card" style={{ padding: '2rem' }}>
                            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '1.5rem' }}>Linha do Tempo</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                {loan.workflowHistory?.slice().reverse().map((step, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', marginTop: '6px' }} />
                                        <div>
                                            <p style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-main)' }}>{step.action}</p>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(step.timestamp).toLocaleString('pt-MZ')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Contract Viewer Section */}
                        {(loan.status === 'approved' || loan.status === 'active' || loan.status === 'paid') && (
                            <div style={{ marginTop: '1rem' }}>
                                <ContractViewer creditId={loan._id} onUpdate={() => fetchLoanDetails(true)} />
                            </div>
                        )}
                    </div>
                </div>

                <Modal
                    isOpen={modal.isOpen}
                    onClose={() => setModal({ ...modal, isOpen: false })}
                    title={modal.title}
                    message={modal.message}
                    type={modal.type}
                />

                {/* Payment Modal */}
                {
                    paymentModal.isOpen && (
                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                            <div className="card glass" style={{ width: '90%', maxWidth: '400px', padding: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: 900 }}>Registar Pagamento</h2>
                                    <button onClick={() => setPaymentModal({ ...paymentModal, isOpen: false })} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><FiXCircle size={24} /></button>
                                </div>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                                    A pagar a parcela <strong>#{paymentModal.installment?.installmentNumber}</strong> do crédito <strong>{loan._id.toString().slice(-6).toUpperCase()}</strong>.
                                </p>
                                <form onSubmit={handleProcessPayment}>
                                    <div style={{ marginBottom: '1.25rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Montante (MT)</label>
                                        <input
                                            type="number"
                                            value={paymentModal.amount}
                                            onChange={(e) => setPaymentModal({ ...paymentModal, amount: e.target.value })}
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'var(--bg-main)', border: '1px solid #333', color: 'white', fontSize: '1rem', fontWeight: 700 }}
                                            required
                                        />
                                    </div>
                                    <div style={{ marginBottom: '2rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Método de Pagamento</label>
                                        <select
                                            value={paymentModal.method}
                                            onChange={(e) => setPaymentModal({ ...paymentModal, method: e.target.value })}
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'var(--bg-main)', border: '1px solid #333', color: 'white' }}
                                        >
                                            <option value="mpesa">M-Pesa</option>
                                            <option value="emola">e-Mola</option>
                                            <option value="bank_transfer">Transferência Bancária</option>
                                            <option value="cash">Dinheiro (Cash)</option>
                                        </select>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={paymentModal.processing}
                                        className="btn-primary"
                                        style={{ width: '100%', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}
                                    >
                                        {paymentModal.processing ? 'Processando...' : <><FiDollarSign /> Confirmar Pagamento</>}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )
                }
            </>
        </Layout>
    );
};

export default LoanDetail;
