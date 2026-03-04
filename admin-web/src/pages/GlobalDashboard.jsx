import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { FiTrendingUp, FiBriefcase, FiAlertCircle, FiCheckCircle, FiGlobe, FiActivity } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import api from '../api';

const GlobalDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGlobalStats = async () => {
            try {
                const response = await api.get('/institutions/stats/global');
                setStats(response.data.data);
            } catch (error) {
                console.error('Erro ao buscar stats globais:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchGlobalStats();
    }, []);

    if (loading) return (
        <Layout>
            <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                <div className="loader">Carregando visão global...</div>
            </div>
        </Layout>
    );

    const data = stats?.institutions.map(inst => ({
        name: inst.name,
        value: 100 // Mock value for visualization
    })) || [];

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    return (
        <Layout>
            <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', animation: 'fadeIn 0.5s ease-out' }}>
                <header style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    marginBottom: '3rem'
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <div style={{ padding: '0.5rem', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '12px', color: 'var(--accent)' }}>
                                <FiGlobe size={24} />
                            </div>
                            <h1 style={{ fontSize: '2.4rem', fontWeight: 900, letterSpacing: '-1px' }}>Dashboard Global</h1>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Controle centralizado e métricas agregadas de todas as instituições.</p>
                    </div>
                </header>

                {/* Main Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
                    <div className="card glass" style={{ padding: '2rem', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                            <div style={{ width: '56px', height: '56px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: 'var(--accent)' }}>
                                <FiBriefcase />
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Instituições Totais</p>
                                <h2 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-1px' }}>{stats?.totalInstitutions || 0}</h2>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--success)', fontWeight: 700 }}>
                            <FiTrendingUp /> <span>+1 este mês</span>
                        </div>
                        {/* Subtle background decoration */}
                        <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', opacity: 0.05, transform: 'rotate(-15deg)' }}>
                            <FiBriefcase size={120} />
                        </div>
                    </div>

                    <div className="card glass" style={{ padding: '2rem', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                            <div style={{ width: '56px', height: '56px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: 'var(--success)' }}>
                                <FiCheckCircle />
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Status Operacional</p>
                                <h2 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-1px' }}>{stats?.activeInstitutions || 0}</h2>
                            </div>
                        </div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.8rem', borderRadius: '30px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', animation: 'pulse 2s infinite' }}></div>
                            Tudo operacional
                        </div>
                        <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', opacity: 0.05, transform: 'rotate(-15deg)' }}>
                            <FiActivity size={120} />
                        </div>
                    </div>

                    <div className="card glass" style={{ padding: '2rem', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                            <div style={{ width: '56px', height: '56px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: 'var(--danger)' }}>
                                <FiAlertCircle />
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Alertas Críticos</p>
                                <h2 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-1px' }}>0</h2>
                            </div>
                        </div>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>Nenhuma anomalia detectada no sistema.</p>
                        <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', opacity: 0.05, transform: 'rotate(-15deg)' }}>
                            <FiAlertCircle size={120} />
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '2rem' }}>
                    <div className="card glass" style={{ padding: '2.5rem', borderRadius: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.5px' }}>Performance por Instituição</h3>
                                <p style={{ color: 'var(--text-muted)' }}>Métricas de adesão e volume financeiro comparado.</p>
                            </div>
                        </div>

                        <div style={{ height: '350px', width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                    <defs>
                                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.2} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'var(--text-muted)', fontSize: 13, fontWeight: 500 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'var(--text-muted)', fontSize: 13, fontWeight: 500 }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="glass" style={{ padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}>
                                                        <p style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.25rem' }}>{payload[0].payload.name}</p>
                                                        <p style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--accent)' }}>Confiança: {payload[0].value}%</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={40}>
                                        {data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={0.8} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="card glass" style={{ padding: '2.5rem', borderRadius: '24px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '2rem' }}>Distribuição de Carteira</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {[
                                { label: 'Nível 5 — Muito Confiável', val: 15, color: '#16A34A' },
                                { label: 'Nível 4 — Confiável', val: 25, color: '#2563EB' },
                                { label: 'Nível 3 — Moderado', val: 30, color: '#EAB308' },
                                { label: 'Nível 2 — Arriscado', val: 18, color: '#F97316' },
                                { label: 'Nível 1 — Muito Arriscado', val: 12, color: '#DC2626' }
                            ].map((item, idx) => (
                                <div key={idx}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.label}</span>
                                        <span style={{ fontWeight: 800, color: item.color }}>{item.val}%</span>
                                    </div>
                                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ width: `${item.val}%`, height: '100%', background: item.color, borderRadius: '4px' }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 0.8; }
                    50% { transform: scale(1.5); opacity: 0.3; }
                    100% { transform: scale(1); opacity: 0.8; }
                }
            `}</style>
        </Layout>
    );
};

export default GlobalDashboard;
