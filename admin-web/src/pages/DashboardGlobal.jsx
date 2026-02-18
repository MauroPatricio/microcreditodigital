import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api';
import { FiGlobe, FiTrendingUp, FiDollarSign, FiUsers, FiAlertTriangle, FiPieChart } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const DashboardGlobal = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGlobalData = async () => {
            try {
                const res = await api.get('/analytics/global');
                if (res.data.success) {
                    setData(res.data.data);
                }
            } catch (error) {
                console.error("Error fetching global analytics", error);
            } finally {
                setLoading(false);
            }
        };

        fetchGlobalData();
    }, []);

    if (loading) return <Layout><div className="spinner"></div></Layout>;
    if (!data) return <Layout><p>Não foi possível carregar os dados.</p></Layout>;

    const { aggregate, breakdown } = data;

    return (
        <Layout>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <FiGlobe style={{ color: 'var(--accent)' }} /> Visão Global (Multi-Filial)
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>
                    Resumo consolidado de todas as suas {aggregate.totalBranches} instituições.
                </p>
            </div>

            {/* Global Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card glass">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Receita Total</p>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0.5rem 0' }}>
                                {aggregate.totalRevenue.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' })}
                            </h2>
                        </div>
                        <div style={{ padding: '0.8rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                            <FiDollarSign size={24} />
                        </div>
                    </div>
                </div>

                <div className="card glass">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Carteira Ativa</p>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0.5rem 0' }}>
                                {aggregate.totalActiveValue.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' })}
                            </h2>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{aggregate.totalActiveLoans} empréstimos ativos</p>
                        </div>
                        <div style={{ padding: '0.8rem', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                            <FiTrendingUp size={24} />
                        </div>
                    </div>
                </div>

                <div className="card glass">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Inadimplência Global</p>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0.5rem 0', color: aggregate.globalDefaultRate > 5 ? 'var(--error)' : 'var(--success)' }}>
                                {aggregate.globalDefaultRate}%
                            </h2>
                        </div>
                        <div style={{ padding: '0.8rem', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                            <FiAlertTriangle size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Comparison Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                {/* Revenue Chart */}
                <div className="card glass">
                    <h3 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>Receita por Filial</h3>
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={breakdown} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                <XAxis type="number" stroke="var(--text-muted)" tickFormatter={(val) => `MT ${val / 1000}k`} />
                                <YAxis dataKey="name" type="category" stroke="var(--text-muted)" width={100} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                    formatter={(value) => value.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' })}
                                />
                                <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                                    {breakdown.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'var(--accent)' : 'var(--primary-light)'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Branch Breakdown List */}
                <div className="card glass">
                    <h3 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>Detalhes das Filiais</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '300px', overflowY: 'auto' }}>
                        {breakdown.map((branch) => (
                            <div key={branch.id} style={{
                                padding: '1rem',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: '12px',
                                borderLeft: `4px solid ${branch.defaultRate > 10 ? 'var(--error)' : 'var(--success)'}`
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <h4 style={{ fontWeight: 600 }}>{branch.name}</h4>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{branch.clients} Clientes</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Inadimplência:</span>
                                    <span style={{ fontWeight: 700, color: branch.defaultRate > 5 ? 'var(--error)' : 'var(--success)' }}>
                                        {branch.defaultRate.toFixed(1)}%
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Ativo:</span>
                                    <span style={{ fontWeight: 700 }}>
                                        {branch.activeValue.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' })}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default DashboardGlobal;
