import React, { useState, useEffect, useRef } from 'react';
import { FiDownload, FiCalendar, FiTrendingUp, FiDollarSign, FiAlertCircle, FiUsers } from 'react-icons/fi';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../api';
import Layout from '../components/Layout';

const fmt = (v) => new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(v || 0);
const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const MonthlyReport = () => {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const reportRef = useRef(null);

    useEffect(() => { loadReport(); }, [month, year]);

    const loadReport = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/reports/monthly?month=${month}&year=${year}`);
            if (res.data.success) setData(res.data.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const exportExcel = async () => {
        try {
            const res = await api.get(`/reports/monthly/excel?month=${month}&year=${year}`, { responseType: 'blob' });
            const url = URL.createObjectURL(res.data);
            const a = document.createElement('a');
            a.href = url; a.download = `relatorio-mensal-${String(month).padStart(2, '0')}-${year}.xlsx`; a.click();
        } catch (e) { console.error(e); }
    };

    const exportPDF = async () => {
        if (!reportRef.current) return;
        const canvas = await html2canvas(reportRef.current, { backgroundColor: '#0f172a', scale: 1.2 });
        const img = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const w = pdf.internal.pageSize.getWidth();
        const h = (canvas.height * w) / canvas.width;
        pdf.addImage(img, 'PNG', 0, 0, w, h);
        pdf.save(`relatorio-mensal-${String(month).padStart(2, '0')}-${year}.pdf`);
    };

    const selStyle = { background: 'transparent', border: 'none', color: 'white', fontSize: '0.9rem', outline: 'none', cursor: 'pointer' };

    return (
        <Layout>
            <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem' }}>📅 Relatório Mensal</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Resumo financeiro completo do mês selecionado</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div className="glass" style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '12px', alignItems: 'center' }}>
                            <FiCalendar size={16} style={{ color: 'var(--accent)' }} />
                            <select value={month} onChange={e => setMonth(Number(e.target.value))} style={selStyle}>
                                {MONTH_NAMES.map((n, i) => <option key={i} value={i + 1}>{n}</option>)}
                            </select>
                            <select value={year} onChange={e => setYear(Number(e.target.value))} style={selStyle}>
                                {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <button onClick={exportExcel} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1rem', borderRadius: '10px', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                            <FiDownload size={15} /> Excel
                        </button>
                        <button onClick={exportPDF} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1rem', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                            <FiDownload size={15} /> PDF
                        </button>
                    </div>
                </div>

                {loading && <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Carregando relatório...</div>}

                {data && (
                    <div ref={reportRef}>
                        {/* KPI Cards — mapped to correct backend field names */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                            {[
                                {
                                    label: 'Total Desembolsado',
                                    value: fmt(data.creditosDoMes?.valor),
                                    icon: FiTrendingUp,
                                    color: 'var(--accent)',
                                    sub: `${data.creditosAtivos?.total || 0} créditos ativos`
                                },
                                {
                                    label: 'Total Arrecadado',
                                    value: fmt(data.pagamentos?.totalArrecadado),
                                    icon: FiDollarSign,
                                    color: '#10b981',
                                    sub: `${data.pagamentos?.count || 0} pagamentos`
                                },
                                {
                                    label: 'Em Atraso',
                                    value: fmt(data.creditosEmAtraso?.valor),
                                    icon: FiAlertCircle,
                                    color: '#ef4444',
                                    sub: `Taxa: ${data.taxaInadimplencia || 0}%`
                                },
                                {
                                    label: 'Novos Clientes',
                                    value: data.clientes?.novos || 0,
                                    icon: FiUsers,
                                    color: '#8b5cf6',
                                    sub: `${data.clientes?.total || 0} total ativos`
                                },
                                {
                                    label: 'Lucro Bruto',
                                    value: fmt(data.lucroBruto),
                                    icon: FiDollarSign,
                                    color: '#f59e0b',
                                    sub: 'Juros + multas'
                                },
                            ].map(kpi => (
                                <div key={kpi.label} className="glass" style={{ padding: '1.4rem', borderRadius: '14px', borderTop: `3px solid ${kpi.color}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{kpi.label}</span>
                                        <div style={{ width: 32, height: 32, borderRadius: '9px', background: `${kpi.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <kpi.icon size={15} style={{ color: kpi.color }} />
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.2rem' }}>{kpi.value}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{kpi.sub}</div>
                                </div>
                            ))}
                        </div>

                        {/* Financial Summary row */}
                        <div className="glass" style={{ padding: '1.5rem', borderRadius: '16px', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>💰 Resumo Financeiro</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                {[
                                    { label: 'Juros Recebidos', value: fmt(data.pagamentos?.totalJuros), color: '#10b981' },
                                    { label: 'Multas Cobradas', value: fmt(data.pagamentos?.totalMultas), color: '#f59e0b' },
                                    { label: 'Créditos Concedidos', value: data.creditosDoMes?.total || 0, color: '#3b82f6', isNum: true },
                                    { label: 'Clientes Inadimplentes', value: data.clientes?.inadimplentes || 0, color: '#ef4444', isNum: true },
                                ].map(cf => (
                                    <div key={cf.label} style={{ textAlign: 'center', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase' }}>{cf.label}</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: cf.color }}>{cf.isNum ? cf.value : cf.value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Best Payers */}
                        {data.melhoresPagadores && data.melhoresPagadores.length > 0 && (
                            <div className="glass" style={{ borderRadius: '16px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    <h3 style={{ fontWeight: 700, fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🏆 Melhores Pagadores do Mês</h3>
                                </div>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                                    <thead>
                                        <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                                            {['#', 'Cliente', 'Nº Pagamentos', 'Valor Pago'].map(h =>
                                                <th key={h} style={{ padding: '0.85rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.melhoresPagadores.map((p, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                <td style={{ padding: '0.85rem 1.25rem', fontWeight: 800, color: i === 0 ? '#f59e0b' : i === 1 ? '#9ca3af' : i === 2 ? '#b45309' : 'var(--text-muted)' }}>
                                                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`}
                                                </td>
                                                <td style={{ padding: '0.85rem 1.25rem', fontWeight: 600 }}>{p.nome}</td>
                                                {/* Backend returns numeroPagamentos */}
                                                <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-muted)' }}>{p.numeroPagamentos}</td>
                                                <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: '#10b981' }}>{fmt(p.totalPago)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Credit Status Breakdown */}
                        <div className="glass" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                <h3 style={{ fontWeight: 700, fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📊 Estado da Carteira</h3>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                                        {['Categoria', 'Qtd', 'Valor'].map(h =>
                                            <th key={h} style={{ padding: '0.85rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { label: 'Concedidos no Mês', qtd: data.creditosDoMes?.total, val: data.creditosDoMes?.valor, color: '#3b82f6' },
                                        { label: 'Ativos', qtd: data.creditosAtivos?.total, val: data.creditosAtivos?.valor, color: '#10b981' },
                                        { label: 'Liquidados no Mês', qtd: data.creditosLiquidados?.total, val: data.creditosLiquidados?.valor, color: '#8b5cf6' },
                                        { label: 'Em Atraso', qtd: data.creditosEmAtraso?.total, val: data.creditosEmAtraso?.valor, color: '#ef4444' },
                                    ].map(row => (
                                        <tr key={row.label} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                            <td style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: row.color }}>{row.label}</td>
                                            <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-muted)' }}>{row.qtd || 0}</td>
                                            <td style={{ padding: '0.85rem 1.25rem', fontWeight: 700 }}>{fmt(row.val)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default MonthlyReport;
