import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api';

import {
    FiUsers, FiTrendingUp, FiAlertCircle,
    FiCheckCircle, FiDollarSign
} from 'react-icons/fi';

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        clients: { total: 0, verified: 0 },
        portfolio: { activeCredits: 0, totalActiveAmount: 0, overdueAmount: 0 },
        performance: { totalRevenue: 0, pendingApprovals: 0 }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/analytics/dashboard');
                if (res.data.success) {
                    setStats(res.data.data);
                }
            } catch (error) {
                console.error("Error fetching dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const StatCard = ({ title, value, icon, color, subtitle }) => (
        <div className="card" style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>{title}</span>
                <span style={{ color: color, fontSize: '1.2rem' }}>{icon}</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>{value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{subtitle}</div>
        </div>
    );

    if (loading) return <div style={{ color: 'var(--accent)' }}>Carregando métricas...</div>;

    return (
        <div>
            <div style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Olá, {user?.name.split(' ')[0]}! 👋</h1>
                <p style={{ color: 'var(--text-muted)' }}>Bem-vindo ao painel de controle da <strong>{user?.institution?.name}</strong>.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <StatCard
                    title="Total Emprestado"
                    value={`${stats.portfolio.totalActiveAmount.toLocaleString()} MT`}
                    icon={<FiTrendingUp />}
                    color="var(--accent)"
                    subtitle="Capital ativo no mercado"
                />
                <StatCard
                    title="Valor em Atraso"
                    value={`${stats.portfolio.overdueAmount.toLocaleString()} MT`}
                    icon={<FiAlertCircle />}
                    color="var(--danger)"
                    subtitle="Risco de inadimplência"
                />
                <StatCard
                    title="Receita (Juros)"
                    value={`${stats.performance.totalRevenue.toLocaleString()} MT`}
                    icon={<FiDollarSign />}
                    color="var(--success)"
                    subtitle="Total recuperado"
                />
                <StatCard
                    title="Clientes Ativos"
                    value={stats.clients.total}
                    icon={<FiUsers />}
                    color="var(--warning)"
                    subtitle={`${stats.clients.verified} verificados`}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Solicitações Pendentes</h3>
                        <button style={{ color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 600, background: 'none' }}>Ver tudo</button>
                    </div>
                    {stats.performance.pendingApprovals > 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <div style={{ fontSize: '2.5rem', color: 'var(--warning)', marginBottom: '1rem' }}><FiAlertCircle /></div>
                            <p>Existem <strong>{stats.performance.pendingApprovals}</strong> pedidos aguardando sua revisão.</p>
                            <button className="btn-primary" style={{ marginTop: '1rem' }}>Analisar Pedidos</button>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                            <FiCheckCircle style={{ fontSize: '2.5rem', color: 'var(--success)', marginBottom: '1rem' }} />
                            <p>Não há solicitações pendentes no momento.</p>
                        </div>
                    )}
                </div>

                <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '20px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                        color: 'var(--accent)',
                        marginBottom: '1rem'
                    }}>
                        <FiTrendingUp />
                    </div>
                    <h3 style={{ marginBottom: '0.5rem' }}>Scale Insight</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                        Sua carteira cresceu 12% este mês. Recomendamos avaliar o aumento do limite para clientes Premium.
                    </p>
                    <button style={{
                        padding: '0.6rem 1.2rem',
                        borderRadius: '8px',
                        border: '1px solid var(--accent)',
                        color: 'var(--accent)',
                        background: 'none',
                        fontSize: '0.85rem',
                        fontWeight: 600
                    }}>Ver Relatórios</button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
