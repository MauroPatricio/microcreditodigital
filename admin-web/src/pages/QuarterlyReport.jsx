import React, { useState, useEffect, useRef } from 'react';
import {
    FiDownload, FiCalendar, FiTrendingUp, FiTrendingDown,
    FiUsers, FiDollarSign, FiCheckCircle, FiAlertCircle, FiAward
} from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../api';
import Layout from '../components/Layout';

const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const QUARTER_NAMES = { 1: '1º Trimestre (Jan-Mar)', 2: '2º Trimestre (Abr-Jun)', 3: '3º Trimestre (Jul-Set)', 4: '4º Trimestre (Out-Dez)' };
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];
const fmt = (v) => new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(v || 0);
const fmtNum = (v) => new Intl.NumberFormat('pt-MZ').format(v || 0);

const QuarterlyReport = () => {
    const now = new Date();
    const [quarter, setQuarter] = useState(Math.ceil((now.getMonth() + 1) / 3));
    const [year, setYear] = useState(now.getFullYear());
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const reportRef = useRef(null);

    useEffect(() => { loadReport(); }, [quarter, year]);

    const loadReport = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/reports/quarterly?quarter=${quarter}&year=${year}`);
            if (res.data.success) setData(res.data.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const exportPDF = async () => {
        if (!reportRef.current) return;
        try {
            const canvas = await html2canvas(reportRef.current, { backgroundColor: '#0f172a', scale: 1.5 });
            const img = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const w = pdf.internal.pageSize.getWidth();
            const h = (canvas.height * w) / canvas.width;
            pdf.addImage(img, 'PNG', 0, 0, w, h);
            pdf.save(`relatorio-trimestral-Q${quarter}-${year}.pdf`);
        } catch (e) { console.error(e); }
    };

    const KPI = ({ label, value, icon: Icon, color, sub }) => (
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '14px', borderLeft: `4px solid ${color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
                <Icon size={18} style={{ color }} />
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color }}>{value}</div>
            {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>{sub}</div>}
        </div>
    );

    return (
        <Layout>
            <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem' }}>📆 Relatório Trimestral</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Análise consolidada de 3 meses com comparativo e tendências</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div className="glass" style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '12px', alignItems: 'center' }}>
                            <FiCalendar size={16} style={{ color: 'var(--accent)' }} />
                            <select value={quarter} onChange={e => setQuarter(Number(e.target.value))} style={selStyle}>
                                {[1, 2, 3, 4].map(q => <option key={q} value={q}>{QUARTER_NAMES[q]}</option>)}
                            </select>
                            <select value={year} onChange={e => setYear(Number(e.target.value))} style={selStyle}>
                                {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <button onClick={exportPDF} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1rem', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                            <FiDownload size={15} /> PDF
                        </button>
                    </div>
                </div>

                {loading && <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Carregando relatório trimestral...</div>}

                {data && (
                    <div ref={reportRef}>
                        {/* Period Banner */}
                        <div className="glass" style={{ padding: '1rem 1.5rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #f59e0b', flexWrap: 'wrap' }}>
                            <FiCalendar size={20} style={{ color: '#f59e0b' }} />
                            <span style={{ fontWeight: 700 }}>{QUARTER_NAMES[quarter]} — {year}</span>
                            <div style={{ marginLeft: 'auto', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>vs {QUARTER_NAMES[data.previousQuarter.quarter]} {data.previousQuarter.year}</span>
                                <span style={{ fontWeight: 700, color: data.crescimentoVolume !== 'N/A' && parseFloat(data.crescimentoVolume) >= 0 ? '#10b981' : '#ef4444' }}>
                                    {data.crescimentoVolume !== 'N/A' ? `${data.crescimentoVolume > 0 ? '+' : ''}${data.crescimentoVolume}%` : 'N/A'} crescimento
                                </span>
                            </div>
                        </div>

                        {/* KPIs */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                            <KPI label="Créditos Concedidos" value={fmtNum(data.totals.creditsConceded)} icon={FiTrendingUp} color="#3b82f6" sub={fmt(data.totals.volumeConceded)} />
                            <KPI label="Total Arrecadado" value={fmt(data.totals.collected)} icon={FiDollarSign} color="#10b981" sub="pagamentos recebidos" />
                            <KPI label="Juros Arrecadados" value={fmt(data.totals.juros)} icon={FiTrendingUp} color="#f59e0b" sub="receita financeira" />
                            <KPI label="Multas Aplicadas" value={fmt(data.totals.multas)} icon={FiAlertCircle} color="#ef4444" sub="penalidades cobradas" />
                        </div>

                        {/* Monthly Breakdown Chart */}
                        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            <div className="glass" style={{ padding: '1.5rem', borderRadius: '16px' }}>
                                <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '1rem' }}>📊 Evolução Mensal do Trimestre</h3>
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={data.monthlyBreakdown.map(m => ({ ...m, name: MONTH_NAMES[m.month - 1].slice(0, 3) }))}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                                        <YAxis stroke="#64748b" fontSize={11} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
                                        <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px' }} formatter={v => fmt(v)} />
                                        <Bar dataKey="volumeConceded" fill="#3b82f6" name="Volume Concedido" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="collected" fill="#10b981" name="Arrecadado" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Credit by type */}
                            {data.creditsByType.length > 0 && (
                                <div className="glass" style={{ padding: '1.5rem', borderRadius: '16px' }}>
                                    <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '1rem' }}>🥧 Por Tipo de Crédito</h3>
                                    <ResponsiveContainer width="100%" height={220}>
                                        <PieChart>
                                            <Pie data={data.creditsByType.map(ct => ({ name: ct._id || 'outros', value: ct.valor }))} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={2}>
                                                {data.creditsByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip formatter={v => fmt(v)} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px' }} />
                                            <Legend iconType="circle" wrapperStyle={{ fontSize: '0.78rem' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>

                        {/* Monthly Detail Table */}
                        <div className="glass" style={{ borderRadius: '16px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>📋 Detalhe por Mês</h3>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                        {['Mês', 'Créditos Concedidos', 'Volume', 'Arrecadado', 'Em Atraso'].map(h => (
                                            <th key={h} style={{ padding: '0.85rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.monthlyBreakdown.map(m => (
                                        <tr key={m.month} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                            <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700 }}>{MONTH_NAMES[m.month - 1]}</td>
                                            <td style={{ padding: '0.85rem 1.25rem', color: '#3b82f6', fontWeight: 700 }}>{fmtNum(m.creditsConceded)}</td>
                                            <td style={{ padding: '0.85rem 1.25rem' }}>{fmt(m.volumeConceded)}</td>
                                            <td style={{ padding: '0.85rem 1.25rem', color: '#10b981', fontWeight: 700 }}>{fmt(m.collected)}</td>
                                            <td style={{ padding: '0.85rem 1.25rem', color: m.overdue > 0 ? '#ef4444' : 'var(--text-muted)', fontWeight: m.overdue > 0 ? 700 : 400 }}>{fmtNum(m.overdue)}</td>
                                        </tr>
                                    ))}
                                    <tr style={{ background: 'rgba(255,255,255,0.03)', fontWeight: 800 }}>
                                        <td style={{ padding: '0.85rem 1.25rem' }}>TOTAL</td>
                                        <td style={{ padding: '0.85rem 1.25rem', color: '#3b82f6' }}>{fmtNum(data.totals.creditsConceded)}</td>
                                        <td style={{ padding: '0.85rem 1.25rem' }}>{fmt(data.totals.volumeConceded)}</td>
                                        <td style={{ padding: '0.85rem 1.25rem', color: '#10b981' }}>{fmt(data.totals.collected)}</td>
                                        <td style={{ padding: '0.85rem 1.25rem' }}>—</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Agent Performance */}
                        {data.agentPerformance.length > 0 && (
                            <div className="glass" style={{ padding: '1.5rem', borderRadius: '16px' }}>
                                <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '1rem' }}>🏆 Performance por Agente</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {data.agentPerformance.map((a, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: COLORS[i % COLORS.length] + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, color: COLORS[i % COLORS.length] }}>{i + 1}</div>
                                                <span style={{ fontWeight: 600 }}>{a.name}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '2rem', fontSize: '0.875rem' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>{fmtNum(a.creditCount)} créditos</span>
                                                <span style={{ fontWeight: 700, color: '#10b981' }}>{fmt(a.totalVolume)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Comparison with prev quarter */}
                        <div className="glass" style={{ padding: '1.5rem', borderRadius: '16px', marginTop: '1.5rem', borderLeft: '4px solid #8b5cf6' }}>
                            <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '1rem' }}>⚖️ Comparativo com Trimestre Anterior</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', textAlign: 'center' }}>
                                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.5rem' }}>PERÍODO ANTERIOR</div>
                                    <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{QUARTER_NAMES[data.previousQuarter.quarter]} {data.previousQuarter.year}</div>
                                    <div style={{ color: '#3b82f6', fontWeight: 800 }}>{fmt(data.previousQuarter.volumeConceded)}</div>
                                </div>
                                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.5rem' }}>CRESCIMENTO</div>
                                    <div style={{ fontSize: '2rem', fontWeight: 800, color: data.crescimentoVolume !== 'N/A' && parseFloat(data.crescimentoVolume) >= 0 ? '#10b981' : '#ef4444' }}>
                                        {data.crescimentoVolume !== 'N/A' ? `${parseFloat(data.crescimentoVolume) >= 0 ? '+' : ''}${data.crescimentoVolume}%` : 'N/A'}
                                    </div>
                                </div>
                                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.5rem' }}>PERÍODO ATUAL</div>
                                    <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{QUARTER_NAMES[quarter]} {year}</div>
                                    <div style={{ color: '#3b82f6', fontWeight: 800 }}>{fmt(data.totals.volumeConceded)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

const selStyle = { background: 'transparent', border: 'none', color: 'white', fontSize: '0.9rem', outline: 'none', cursor: 'pointer' };
export default QuarterlyReport;
