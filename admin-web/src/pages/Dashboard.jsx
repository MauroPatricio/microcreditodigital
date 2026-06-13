import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import {
    FiUsers, FiTrendingUp, FiAlertCircle,
    FiCheckCircle, FiDollarSign, FiCreditCard, FiBarChart2, FiArrowRight
} from 'react-icons/fi';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const fmt = (v) => `${new Intl.NumberFormat('pt-MZ').format(v || 0)} MT`;
const fmtNum = (v) => new Intl.NumberFormat('pt-MZ').format(v || 0);

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const now = new Date();
    const [stats, setStats] = useState({
        clients: { total: 0, verified: 0 },
        portfolio: { activeCredits: 0, totalActiveAmount: 0, overdueAmount: 0, par: 0, totalRecovered: 0 },
        performance: { totalRevenue: 0, pendingApprovals: 0, agentPerformance: [] },
        monthly: { creditsIssued: 0, revenue: 0, interestIncome: 0 }
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
                    title="PAR (Portfolio At Risk)"
                    value={`${stats.portfolio.par || 0}%`}
                    icon={FiBarChart2}
                    color={stats.portfolio.par > 5 ? 'var(--danger)' : 'var(--success)'}
                    subtitle="Risco da carteira ativa"
                />
                <StatCard
                    title="Total Recuperado"
                    value={fmt(stats.portfolio.totalRecovered)}
                    icon={FiCheckCircle}
                    color="var(--success)"
                    subtitle="Volume total de reembolsos"
                />
                <StatCard
                    title="Rendimento Juros"
                    value={fmt(stats.monthly.interestIncome)}
                    icon={FiDollarSign}
                    color="var(--blue-highlight)"
                    subtitle="Receita de juros (Mês)"
                    onClick={() => navigate('/cashflow')}
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

                {/* Ranking de Agentes */}
                <div className="card">
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1.5rem' }}>Top Performance: Agentes</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {stats.performance.agentPerformance?.length > 0 ? (
                            stats.performance.agentPerformance.map(agent => (
                                <div key={agent._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <p style={{ fontWeight: 700, fontSize: '0.88rem' }}>{agent.agentName}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{agent.activeLoans} créditos ativos</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontWeight: 800, color: 'var(--accent)' }}>{(agent.recoveryRate * 100).toFixed(1)}%</p>
                                        <div style={{ width: '60px', height: '4px', background: '#333', borderRadius: '2px', marginTop: '0.2rem' }}>
                                            <div style={{ width: `${agent.recoveryRate * 100}%`, height: '100%', background: 'var(--accent)', borderRadius: '2px' }}></div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>Nenhum dado de agente disponível.</p>
                        )}
                    </div>
                </div>

                {/* Gráfico de Produção */}
                <div className="card" style={{ gridColumn: '1 / -1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>Desempenho de Produção</h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Evolução do volume de crédito nos últimos meses</p>
                        </div>
                    </div>
                    <div style={{ height: 300, minHeight: 300, width: '100%' }}>
                        <ResponsiveContainer width="99%" height="100%">
                            <AreaChart data={[
                                { name: 'Jan', valor: Math.max(10000, stats.portfolio.totalActiveAmount * 0.4) },
                                { name: 'Fev', valor: Math.max(15000, stats.portfolio.totalActiveAmount * 0.6) },
                                { name: 'Mar', valor: Math.max(12000, stats.portfolio.totalActiveAmount * 0.5) },
                                { name: 'Abr', valor: Math.max(25000, stats.portfolio.totalActiveAmount * 0.8) },
                                { name: 'Mai', valor: Math.max(28000, stats.portfolio.totalActiveAmount * 0.9) },
                                { name: 'Jun', valor: Math.max(30000, stats.portfolio.totalActiveAmount) }
                            ]}>
                                <defs>
                                    <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                                <Tooltip 
                                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '8px' }}
                                    itemStyle={{ color: 'var(--text-main)', fontWeight: 600 }}
                                />
                                <Area type="monotone" dataKey="valor" stroke="var(--accent)" strokeWidth={3} fillOpacity={1} fill="url(#colorValor)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Painel Administrativo de Gestão (Visível para cargos administrativos) */}
            {['owner', 'admin', 'manager', 'supervisor'].includes(user?.role) && stats.adminMetrics && (
                <div style={{ marginTop: '2.5rem', borderTop: '1px solid var(--border-light)', paddingTop: '2rem' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--text-main)' }}>
                        Painel de Administração & Recursos
                    </h2>
                    
                    {/* Indicadores Administrativos */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                        <div className="card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Utilizadores Gerais</span>
                            <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--text-main)' }}>{stats.adminMetrics.totalUsers}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{stats.adminMetrics.activeUsers} utilizadores ativos</div>
                        </div>
                        <div className="card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Agentes Ativos</span>
                            <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--accent)' }}>{stats.adminMetrics.activeAgents}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Operando no terreno</div>
                        </div>
                        <div className="card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Representantes Ativos</span>
                            <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '0.5rem', color: '#10b981' }}>{stats.adminMetrics.activeRepresentatives}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Gerindo carteiras comerciais</div>
                        </div>
                        <div className="card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Novos Clientes (Mês)</span>
                            <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '0.5rem', color: '#3b82f6' }}>{stats.adminMetrics.newClients}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Registados este mês</div>
                        </div>
                    </div>

                    {/* Produção por Agente e Representante */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        {/* Produção por Agente */}
                        <div className="card">
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1.25rem' }}>Produção por Agente (Volume de Crédito)</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {stats.adminMetrics.agentProduction?.length > 0 ? (
                                    stats.adminMetrics.agentProduction.map((agent, i) => (
                                        <div key={agent._id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.5rem' }}>
                                            <div>
                                                <p style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>{agent.name || 'Agente Sem Nome'}</p>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {agent._id}</p>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <p style={{ fontWeight: 800, color: 'var(--accent)' }}>{fmt(agent.total)}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>Nenhum registo de produção de agentes.</p>
                                )}
                            </div>
                        </div>

                        {/* Produção por Representante */}
                        <div className="card">
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1.25rem' }}>Produção por Representante</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {stats.adminMetrics.representativeProduction?.length > 0 ? (
                                    stats.adminMetrics.representativeProduction.map((rep, i) => (
                                        <div key={rep._id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.5rem' }}>
                                            <div>
                                                <p style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>{rep.name || 'Representante Sem Nome'}</p>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {rep._id}</p>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <p style={{ fontWeight: 800, color: '#10b981' }}>{fmt(rep.total)}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>Nenhum registo de produção de representantes.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
