import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import api from '../api';
import {
    FiDollarSign, FiCalendar, FiFilter,
    FiCheckCircle, FiClock, FiTarget, FiTrendingUp
} from 'react-icons/fi';

const MyCommissions = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [commissions, setCommissions] = useState([]);
    const [totals, setTotals] = useState({ pending: 0, approved: 0, paid: 0, total: 0 });
    const [target, setTarget] = useState(null);
    const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));

    useEffect(() => {
        fetchData();
    }, [period]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [commRes, targetRes] = await Promise.all([
                api.get(`/commissions/my-commissions?period=${period}`),
                api.get('/commissions/targets/my-targets')
            ]);

            if (commRes.data.success) {
                setCommissions(commRes.data.data.commissions);
                setTotals(commRes.data.data.totals);
            }
            if (targetRes.data.success) {
                setTarget(targetRes.data.data);
            }
        } catch (error) {
            console.error("Error fetching agent data", error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(value);
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'paid': return { color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' };
            case 'approved': return { color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)' };
            default: return { color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)' };
        }
    };

    if (loading) return <Layout><div style={{ color: 'var(--accent)' }}>Carregando seus dados...</div></Layout>;

    return (
        <Layout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Minhas Comissões</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Acompanhe seus ganhos e progresso de metas.</p>
                </div>
                <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '8px' }}>
                    <FiCalendar style={{ color: 'var(--accent)' }} />
                    <input
                        type="month"
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none' }}
                    />
                </div>
            </div>

            {/* Target Progress */}
            {target && (
                <div className="card" style={{ marginBottom: '2.5rem', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FiTarget style={{ color: 'var(--accent)' }} /> Suas Metas do Mês
                        </h3>
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent)' }}>
                            {Math.round(target.completionPercentage)}% concluído
                        </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Novos Clientes</p>
                            <p style={{ fontWeight: 700 }}>{target.target.achieved.newClients} / {target.target.targets.newClients}</p>
                            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginTop: '0.5rem' }}>
                                <div style={{ width: `${Math.min(target.target.achieved.newClients / target.target.targets.newClients * 100, 100)}%`, height: '100%', background: 'var(--accent)', borderRadius: '2px' }}></div>
                            </div>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Créditos Aprovados</p>
                            <p style={{ fontWeight: 700 }}>{target.target.achieved.creditsApproved} / {target.target.targets.creditsApproved}</p>
                            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginTop: '0.5rem' }}>
                                <div style={{ width: `${Math.min(target.target.achieved.creditsApproved / target.target.targets.creditsApproved * 100, 100)}%`, height: '100%', background: '#10b981', borderRadius: '2px' }}></div>
                            </div>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Montante Total</p>
                            <p style={{ fontWeight: 700 }}>{formatCurrency(target.target.achieved.totalDisbursed)} / {formatCurrency(target.target.targets.totalDisbursed)}</p>
                            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginTop: '0.5rem' }}>
                                <div style={{ width: `${Math.min(target.target.achieved.totalDisbursed / target.target.targets.totalDisbursed * 100, 100)}%`, height: '100%', background: '#f59e0b', borderRadius: '2px' }}></div>
                            </div>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Taxa de Cobrança</p>
                            <p style={{ fontWeight: 700 }}>{target.target.achieved.collectionRate}% / {target.target.targets.collectionRate}%</p>
                            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginTop: '0.5rem' }}>
                                <div style={{ width: `${Math.min(target.target.achieved.collectionRate / target.target.targets.collectionRate * 100, 100)}%`, height: '100%', background: '#ef4444', borderRadius: '2px' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* My Earning Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontSize: '1.5rem' }}>
                        <FiTrendingUp />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ganhos Totais</p>
                        <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>{formatCurrency(totals.total)}</p>
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontSize: '1.5rem' }}>
                        <FiCheckCircle />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Recebido</p>
                        <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>{formatCurrency(totals.paid)}</p>
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', fontSize: '1.5rem' }}>
                        <FiCheckCircle />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Aprovado</p>
                        <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>{formatCurrency(totals.approved)}</p>
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', fontSize: '1.5rem' }}>
                        <FiClock />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pendente</p>
                        <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>{formatCurrency(totals.pending)}</p>
                    </div>
                </div>
            </div>

            {/* Commissions Table */}
            <div className="card" style={{ padding: 0 }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Histórico de Comissões</h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Período: </span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent)' }}>{formatCurrency(totals.total)}</span>
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'left' }}>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Data</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Cliente / Crédito</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Base (Aprovado)</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Comissão</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {commissions.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        Nenhuma comissão registrada para este período.
                                    </td>
                                </tr>
                            ) : (
                                commissions.map((comm) => (
                                    <tr key={comm._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            {new Date(comm.createdAt).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontWeight: 600 }}>{comm.credit?.client?.name}</span>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {comm.credit?._id.slice(-8)}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>
                                            {formatCurrency(comm.baseAmount)} ({comm.rate}%)
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', fontWeight: 700, color: 'var(--accent)' }}>
                                            {formatCurrency(comm.amount)}
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '20px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                ...getStatusStyle(comm.status)
                                            }}>
                                                {comm.status === 'paid' ? 'RECEBIDO' : comm.status.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};

export default MyCommissions;
