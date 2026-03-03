import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import {
    FiUsers, FiTrendingUp, FiAlertCircle,
    FiCheckCircle, FiDollarSign, FiCreditCard, FiBarChart2, FiArrowRight
} from 'react-icons/fi';

const fmt = (v) => new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(v || 0);
const fmtNum = (v) => new Intl.NumberFormat('pt-MZ').format(v || 0);

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const now = new Date();
    const [stats, setStats] = useState({
        clients: { total: 0, verified: 0 },
        portfolio: { activeCredits: 0, totalActiveAmount: 0, overdueAmount: 0 },
        performance: { totalRevenue: 0, pendingApprovals: 0 }
    });
    const [monthlyData, setMonthlyData] = useState(null);
    const [cashSummary, setCashSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [dashRes, monthlyRes, cashRes] = await Promise.allSettled([
                    api.get('/analytics/dashboard'),
                    api.get(`/reports/monthly?month=${now.getMonth() + 1}&year=${now.getFullYear()}`),
                    api.get(`/cashflow/summary?month=${now.getMonth() + 1}&year=${now.getFullYear()}`)
                ]);
                if (dashRes.status === 'fulfilled' && dashRes.value.data.success) setStats(dashRes.value.data.data);
                if (monthlyRes.status === 'fulfilled' && monthlyRes.value.data.success) setMonthlyData(monthlyRes.value.data.data);
                if (cashRes.status === 'fulfilled' && cashRes.value.data.success) setCashSummary(cashRes.value.data.data);
            } catch (error) {
                console.error('Dashboard error', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    const StatCard = ({ title, value, icon: Icon, color, subtitle, onClick }) => (
        <div className="card" style={{ flex: 1, cursor: onClick ? 'pointer' : 'default', transition: 'transform 0.15s' }}
            onClick={onClick}
            onMouseEnter={e => { if (onClick) e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { if (onClick) e.currentTarget.style.transform = ''; }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{title}</span>
                <div style={{ width: 34, height: 34, borderRadius: '10px', background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={16} style={{ color }} />
                </div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem', color: 'var(--text-main)' }}>{value}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{subtitle}</div>
        </div>
    );

    if (loading) return <div style={{ color: 'var(--accent)', padding: '2rem' }}>Carregando métricas...</div>;

    const taxaInadimplencia = monthlyData?.taxaInadimplencia || '0.00';
    const lucroBruto = monthlyData?.lucroBruto || 0;

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                    Olá, {user?.name?.split(' ')[0]}! 👋
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Bem-vindo ao painel — <strong style={{ color: 'var(--text-main)' }}>{user?.institution?.name}</strong>
                </p>
            </div>

            {/* KPI Row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <StatCard
                    title="Capital em Carteira"
                    value={fmt(stats.portfolio.totalActiveAmount)}
                    icon={FiTrendingUp}
                    color="var(--blue-highlight)"
                    subtitle={`${fmtNum(stats.portfolio.activeCredits)} créditos ativos`}
                    onClick={() => navigate('/loans')}
                />
                <StatCard
                    title="Valor em Atraso"
                    value={fmt(stats.portfolio.overdueAmount)}
                    icon={FiAlertCircle}
                    color="var(--danger)"
                    subtitle="Risco de inadimplência"
                    onClick={() => navigate('/loans')}
                />
                <StatCard
                    title="Taxa Inadimplência"
                    value={`${taxaInadimplencia}%`}
                    icon={FiBarChart2}
                    color={parseFloat(taxaInadimplencia) > 10 ? 'var(--danger)' : 'var(--success)'}
                    subtitle="Créditos em atraso / ativos"
                />
                <StatCard
                    title="Lucro Bruto (Mês)"
                    value={fmt(lucroBruto)}
                    icon={FiDollarSign}
                    color="var(--success)"
                    subtitle="Juros + multas arrecadadas"
                    onClick={() => navigate('/reports/monthly')}
                />
                <StatCard
                    title="Clientes Ativos"
                    value={fmtNum(stats.clients.total)}
                    icon={FiUsers}
                    color="#8b5cf6"
                    subtitle={`${fmtNum(stats.clients.verified)} verificados`}
                    onClick={() => navigate('/clients')}
                />
                {cashSummary && (
                    <StatCard
                        title="Saldo de Caixa"
                        value={fmt(cashSummary.saldoFinal)}
                        icon={FiCreditCard}
                        color={cashSummary.saldoFinal >= 0 ? 'var(--success)' : 'var(--danger)'}
                        subtitle="Saldo atual do mês"
                        onClick={() => navigate('/cashflow')}
                    />
                )}
            </div>

            {/* Second row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                {/* Pending Approvals */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>Solicitações Pendentes</h3>
                        <button onClick={() => navigate('/loans')} style={{ color: 'var(--blue-highlight)', fontSize: '0.82rem', fontWeight: 600, background: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', border: 'none' }}>
                            Ver tudo <FiArrowRight size={13} />
                        </button>
                    </div>
                    {stats.performance.pendingApprovals > 0 ? (
                        <div style={{ textAlign: 'center', padding: '1.5rem' }}>
                            <div style={{ fontSize: '2.5rem', color: 'var(--warning)', marginBottom: '1rem' }}><FiAlertCircle /></div>
                            <p style={{ color: 'var(--text-main)' }}>Existem <strong style={{ color: 'var(--blue-highlight)' }}>{stats.performance.pendingApprovals}</strong> pedidos aguardando revisão.</p>
                            <button className="btn-primary" onClick={() => navigate('/loans')} style={{ marginTop: '1rem' }}>Analisar Pedidos</button>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                            <FiCheckCircle style={{ fontSize: '2.5rem', color: 'var(--success)', marginBottom: '1rem' }} />
                            <p>Não há solicitações pendentes.</p>
                        </div>
                    )}
                </div>

                {/* Quick links + monthly summary */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[
                        { label: 'Rel. Mensal', icon: FiBarChart2, color: '#3b82f6', path: '/reports/monthly', sub: monthlyData ? `${fmt(monthlyData.pagamentos?.totalArrecadado)} arrecadado` : 'Ver detalhes' },
                        { label: 'Gestão de Caixa', icon: FiCreditCard, color: '#8b5cf6', path: '/cashflow', sub: cashSummary ? `Saldo: ${fmt(cashSummary.saldoFinal)}` : 'Ver saldo' },
                        { label: 'Relatório BdM', icon: FiCheckCircle, color: '#e63946', path: '/reports/bom', sub: 'Formato oficial BdM' }
                    ].map(lnk => (
                        <div key={lnk.path} className="card" onClick={() => navigate(lnk.path)} style={{ cursor: 'pointer', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem', transition: 'all 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateX(2px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = ''}>
                            <div style={{ width: 36, height: 36, borderRadius: '10px', background: `${lnk.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <lnk.icon size={16} style={{ color: lnk.color }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>{lnk.label}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lnk.sub}</div>
                            </div>
                            <FiArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
