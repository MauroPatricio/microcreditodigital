import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import api from '../api';
import {
    FiUser, FiTrendingUp, FiCheckCircle,
    FiAlertCircle, FiUsers, FiBriefcase, FiPieChart
} from 'react-icons/fi';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';

const AgentPerformance = () => {
    const { user } = useAuth();
    const [agents, setAgents] = useState([]);
    const [selectedAgent, setSelectedAgent] = useState('');
    const [performance, setPerformance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fetchingPerf, setFetchingPerf] = useState(false);

    useEffect(() => {
        fetchAgents();
    }, []);

    const fetchAgents = async () => {
        try {
            // No sistema atual, agentes são usuários com role 'agent'
            const res = await api.get('/auth/users?role=agent');
            if (res.data.success) {
                setAgents(res.data.data);
                if (res.data.data.length > 0) {
                    setSelectedAgent(res.data.data[0]._id);
                    fetchAgentPerformance(res.data.data[0]._id);
                }
            }
        } catch (error) {
            console.error("Error fetching agents", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAgentPerformance = async (agentId) => {
        setFetchingPerf(true);
        try {
            const res = await api.get(`/commissions/agent/${agentId}/performance`);
            if (res.data.success) {
                setPerformance(res.data.data);
            }
        } catch (error) {
            console.error("Error fetching performance", error);
        } finally {
            setFetchingPerf(false);
        }
    };

    const handleAgentChange = (e) => {
        const id = e.target.value;
        setSelectedAgent(id);
        fetchAgentPerformance(id);
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(value);
    };

    if (loading) return <Layout><div style={{ color: 'var(--accent)' }}>Carregando agentes...</div></Layout>;

    return (
        <Layout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Performance de Agentes</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Métricas e evolução de comissões e captação.</p>
                </div>
                <div>
                    <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '8px' }}>
                        <FiUser style={{ color: 'var(--accent)' }} />
                        <select
                            value={selectedAgent}
                            onChange={handleAgentChange}
                            style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: '1rem', cursor: 'pointer' }}
                        >
                            {agents.map(a => (
                                <option key={a._id} value={a._id} style={{ background: '#1a1a2e' }}>{a.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {fetchingPerf ? (
                <div style={{ color: 'var(--accent)', textAlign: 'center', padding: '5rem' }}>Buscando métricas...</div>
            ) : performance && (
                <>
                    {/* Key Metrics */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontSize: '1.5rem' }}>
                                <FiUsers />
                            </div>
                            <div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Clientes Registrados</p>
                                <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{performance.metrics.clientsRegistered}</p>
                            </div>
                        </div>
                        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontSize: '1.5rem' }}>
                                <FiCheckCircle />
                            </div>
                            <div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Créditos Aprovados</p>
                                <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{performance.metrics.creditsApproved}</p>
                            </div>
                        </div>
                        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', fontSize: '1.5rem' }}>
                                <FiBriefcase />
                            </div>
                            <div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Desembolsado</p>
                                <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{formatCurrency(performance.metrics.totalDisbursed)}</p>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                        {/* Monthly Evolution Chart */}
                        <div className="card">
                            <h3 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FiTrendingUp style={{ color: 'var(--accent)' }} /> Evolução Mensal de Comissões
                            </h3>
                            <div style={{ height: '300px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={performance.monthlyEvolution}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="_id" stroke="var(--text-muted)" fontSize={12} />
                                        <YAxis stroke="var(--text-muted)" fontSize={12} />
                                        <Tooltip
                                            contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                            itemStyle={{ color: 'var(--accent)' }}
                                        />
                                        <Line type="monotone" dataKey="total" stroke="var(--accent)" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Commission Status Breakdown */}
                        <div className="card">
                            <h3 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FiPieChart style={{ color: 'var(--accent)' }} /> Status das Comissões
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Liquidado</span>
                                        <span style={{ fontWeight: 700, color: '#10b981' }}>{formatCurrency(performance.commissions.paid)}</span>
                                    </div>
                                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${(performance.commissions.paid / performance.commissions.total * 100) || 0}%`,
                                            height: '100%',
                                            background: '#10b981'
                                        }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Aprovado</span>
                                        <span style={{ fontWeight: 700, color: '#3b82f6' }}>{formatCurrency(performance.commissions.approved)}</span>
                                    </div>
                                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${(performance.commissions.approved / performance.commissions.total * 100) || 0}%`,
                                            height: '100%',
                                            background: '#3b82f6'
                                        }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Pendente</span>
                                        <span style={{ fontWeight: 700, color: '#f59e0b' }}>{formatCurrency(performance.commissions.pending)}</span>
                                    </div>
                                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${(performance.commissions.pending / performance.commissions.total * 100) || 0}%`,
                                            height: '100%',
                                            background: '#f59e0b'
                                        }}></div>
                                    </div>
                                </div>
                                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontWeight: 600 }}>Total Acumulado</span>
                                    <span style={{ fontWeight: 800, color: 'var(--accent)' }}>{formatCurrency(performance.commissions.total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </Layout>
    );
};

export default AgentPerformance;
