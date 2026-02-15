import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import api from '../api';
import {
    FiPercent, FiCalculator, FiCheckCircle,
    FiCalendar, FiUser, FiDollarSign, FiFilter
} from 'react-icons/fi';

const CommissionSettings = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState(null);
    const [commissions, setCommissions] = useState([]);
    const [calculating, setCalculating] = useState(false);
    const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [stats, setStats] = useState({ pending: 0, approved: 0, paid: 0 });

    useEffect(() => {
        fetchData();
    }, [period]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [summaryRes, listRes] = await Promise.all([
                api.get(`/commissions/summary/${period}`),
                api.get(`/commissions?period=${period}`)
            ]);

            if (summaryRes.data.success) {
                setSummary(summaryRes.data.data);
                setStats(summaryRes.data.data.summary);
            }
            if (listRes.data.success) {
                setCommissions(listRes.data.data.commissions);
            }
        } catch (error) {
            console.error("Error fetching commissions", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCalculate = async () => {
        setCalculating(true);
        try {
            const res = await api.post(`/commissions/calculate/${period}`, { rate: 2.5 });
            if (res.data.success) {
                alert(res.data.message);
                fetchData();
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Erro ao calcular comissões');
        } finally {
            setCalculating(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            const res = await api.put(`/commissions/${id}/approve`);
            if (res.data.success) {
                fetchData();
            }
        } catch (error) {
            alert('Erro ao aprovar comissão');
        }
    };

    const handlePay = async (id) => {
        try {
            const res = await api.put(`/commissions/${id}/pay`);
            if (res.data.success) {
                fetchData();
            }
        } catch (error) {
            alert('Erro ao marcar como paga');
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

    return (
        <Layout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Gestão de Comissões</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Gerencie e liquide comissões dos agentes por período.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '8px' }}>
                        <FiCalendar style={{ color: 'var(--accent)' }} />
                        <input
                            type="month"
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none' }}
                        />
                    </div>
                    <button
                        onClick={handleCalculate}
                        disabled={calculating}
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <FiCalculator /> {calculating ? 'Calculando...' : 'Calcular Período'}
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontSize: '1.5rem' }}>
                        <FiDollarSign />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Período</p>
                        <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>{formatCurrency(stats.total)}</p>
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', fontSize: '1.5rem' }}>
                        <FiFilter />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pendente</p>
                        <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>{formatCurrency(stats.pending)}</p>
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', fontSize: '1.5rem' }}>
                        <FiCheckCircle />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Aprovado</p>
                        <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>{formatCurrency(stats.approved)}</p>
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontSize: '1.5rem' }}>
                        <FiDollarSign />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pago</p>
                        <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>{formatCurrency(stats.paid)}</p>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '1.5rem' }}>
                {/* Detailed Table */}
                <div className="card" style={{ padding: 0 }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Lista de Comissões</h3>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'left' }}>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Agente</th>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Crédito</th>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Montante</th>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Status</th>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {commissions.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                            Nenhuma comissão encontrada para este período.
                                        </td>
                                    </tr>
                                ) : (
                                    commissions.map((comm) => (
                                        <tr key={comm._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
                                                        {comm.agent?.name?.charAt(0)}
                                                    </div>
                                                    <span>{comm.agent?.name}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                    {formatCurrency(comm.credit?.approvedAmount || 0)}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>
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
                                                    {comm.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                {comm.status === 'pending' && user.role !== 'agent' && (
                                                    <button
                                                        onClick={() => handleApprove(comm._id)}
                                                        style={{ color: 'var(--accent)', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                                                    >
                                                        Aprovar
                                                    </button>
                                                )}
                                                {comm.status === 'approved' && user.role === 'owner' && (
                                                    <button
                                                        onClick={() => handlePay(comm._id)}
                                                        style={{ color: '#10b981', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                                                    >
                                                        Liquidar
                                                    </button>
                                                )}
                                                {comm.status === 'paid' && (
                                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Concluído</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Summary by Agent */}
                <div className="card">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Por Agente</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {summary?.byAgent?.length === 0 ? (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Sem dados.</p>
                        ) : (
                            summary?.byAgent?.map((item) => (
                                <div key={item.agent._id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontWeight: 600 }}>{item.agent.name}</span>
                                        <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{formatCurrency(item.total)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>{item.count} comissões</span>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <span style={{ color: '#f59e0b' }}>P: {formatCurrency(item.pending)}</span>
                                            <span style={{ color: '#10b981' }}>L: {formatCurrency(item.paid)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default CommissionSettings;
