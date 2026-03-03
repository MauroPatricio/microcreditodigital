import React, { useState, useEffect, useRef } from 'react';
import { FiTrendingUp, FiAlertCircle, FiDollarSign, FiUsers, FiCheckCircle, FiCalendar, FiDownload, FiCreditCard, FiArrowRight } from 'react-icons/fi';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../api';
import Layout from '../components/Layout';

const Reports = () => {
    const navigate = useNavigate();
    const [activeReport, setActiveReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });

    const reports = [
        {
            id: 'credit-performance',
            title: 'Performance de Créditos',
            description: 'Volume, crescimento e distribuição',
            icon: FiTrendingUp,
            color: '#3b82f6'
        },
        {
            id: 'default-analysis',
            title: 'Análise de Inadimplência',
            description: 'Taxas de atraso e clientes inadimplentes',
            icon: FiAlertCircle,
            color: '#ef4444'
        },
        {
            id: 'financial-summary',
            title: 'Resumo Financeiro',
            description: 'Receitas, empréstimos e juros',
            icon: FiDollarSign,
            color: '#10b981'
        },
        {
            id: 'client-statistics',
            title: 'Estatísticas de Clientes',
            description: 'Novos clientes e scores',
            icon: FiUsers,
            color: '#8b5cf6'
        },
        {
            id: 'approval-metrics',
            title: 'Métricas de Aprovação',
            description: 'Taxa de aprovação e tempos',
            icon: FiCheckCircle,
            color: '#f59e0b'
        },
        {
            id: 'onboarding-funnel',
            title: 'Funil de Onboarding',
            description: 'Conversão desde o cadastro ao desembolso',
            icon: FiTrendingUp,
            color: '#06b6d4'
        },
        {
            id: 'agent-performance',
            title: 'Performance de Agentes',
            description: 'Ranking de onboardings e volume por agente',
            icon: FiUsers,
            color: '#ec4899'
        }
    ];

    const loadReport = async (reportId) => {
        setLoading(true);
        setActiveReport(reportId);

        try {
            const params = dateRange.startDate && dateRange.endDate
                ? `?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
                : '';

            const res = await api.get(`/reports/${reportId}${params}`);
            setReportData(res.data.data);
        } catch (error) {
            console.error('Erro ao carregar relatório:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-MZ', {
            style: 'currency',
            currency: 'MZN'
        }).format(value || 0);
    };

    const formatNumber = (value) => {
        return new Intl.NumberFormat('pt-MZ').format(value || 0);
    };

    return (
        <Layout>
            <div style={{
                padding: '2rem',
                maxWidth: '1400px',
                margin: '0 auto'
            }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                        📊 Relatórios e Análises
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                        Insights e métricas premium para gestão de microcrédito
                    </p>
                </div>

                {/* Quick Access Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
                    {[
                        { label: 'Gestão de Caixa', desc: 'Entradas, saídas e saldo diário', icon: FiCreditCard, color: '#8b5cf6', path: '/cashflow' },
                        { label: 'Relatório Mensal', desc: 'Resumo completo com export Excel/PDF', icon: FiCalendar, color: '#3b82f6', path: '/reports/monthly' },
                        { label: 'Relatório Trimestral', desc: 'Consolidado 3 meses + comparativo', icon: FiTrendingUp, color: '#f59e0b', path: '/reports/quarterly' },
                        { label: 'Relatório BdM', desc: 'Formato Banco de Moçambique oficial', icon: FiCheckCircle, color: '#e63946', path: '/reports/bom' }
                    ].map(card => (
                        <button key={card.path} onClick={() => navigate(card.path)} style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                            <div className="glass" style={{ padding: '1.4rem', borderRadius: '14px', borderTop: `3px solid ${card.color}`, transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '100%' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                                onMouseLeave={e => e.currentTarget.style.background = ''}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ width: 38, height: 38, borderRadius: '10px', background: `${card.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <card.icon size={18} style={{ color: card.color }} />
                                    </div>
                                    <FiArrowRight size={15} style={{ color: 'var(--text-muted)' }} />
                                </div>
                                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{card.label}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{card.desc}</div>
                            </div>
                        </button>
                    ))}
                </div>

                <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Relatórios Analíticos</div>

                <div className="glass" style={{
                    padding: '1.5rem',
                    borderRadius: '16px',
                    marginBottom: '2rem',
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'center',
                    flexWrap: 'wrap'
                }}>
                    <FiCalendar size={20} style={{ color: 'var(--accent)' }} />
                    <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        Período:
                    </label>
                    <input
                        type="date"
                        value={dateRange.startDate}
                        onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'var(--bg-main)',
                            color: 'var(--text-main)',
                            fontSize: '0.9rem'
                        }}
                    />
                    <span style={{ color: 'var(--text-muted)' }}>até</span>
                    <input
                        type="date"
                        value={dateRange.endDate}
                        onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'var(--bg-main)',
                            color: 'var(--text-main)',
                            fontSize: '0.9rem'
                        }}
                    />
                    {activeReport && (
                        <button
                            onClick={() => loadReport(activeReport)}
                            className="btn-primary"
                            style={{
                                marginLeft: 'auto',
                                padding: '0.5rem 1rem',
                                fontSize: '0.9rem'
                            }}
                        >
                            Aplicar Filtro
                        </button>
                    )}
                </div>

                {!activeReport && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '1.5rem',
                        marginBottom: '2rem'
                    }}>
                        {reports.map((report) => (
                            <div
                                key={report.id}
                                className="glass"
                                onClick={() => loadReport(report.id)}
                                style={{
                                    padding: '2rem',
                                    borderRadius: '16px',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    borderLeft: `4px solid ${report.color}`
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = `0 8px 24px ${report.color}33`;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    background: `${report.color}22`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '1rem'
                                }}>
                                    <report.icon size={24} style={{ color: report.color }} />
                                </div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                                    {report.title}
                                </h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    {report.description}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                {activeReport && (
                    <div>
                        <button
                            onClick={() => {
                                setActiveReport(null);
                                setReportData(null);
                            }}
                            className="btn-primary"
                            style={{
                                marginBottom: '1.5rem',
                                background: 'var(--bg-main)',
                                padding: '0.5rem 1rem'
                            }}
                        >
                            ← Voltar aos Relatórios
                        </button>

                        {loading ? (
                            <div className="glass" style={{
                                padding: '4rem',
                                borderRadius: '16px',
                                textAlign: 'center'
                            }}>
                                <p style={{ color: 'var(--text-muted)' }}>Carregando relatório...</p>
                            </div>
                        ) : reportData && (
                            <ReportContent
                                reportId={activeReport}
                                data={reportData}
                                formatCurrency={formatCurrency}
                                formatNumber={formatNumber}
                            />
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
};

const ReportContent = ({ reportId, data, formatCurrency, formatNumber }) => {
    const reportRef = useRef(null);

    const reportConfig = {
        'credit-performance': {
            title: 'Performance de Créditos',
            color: '#3b82f6'
        },
        'default-analysis': {
            title: 'Análise de Inadimplência',
            color: '#ef4444'
        },
        'financial-summary': {
            title: 'Resumo Financeiro',
            color: '#10b981'
        },
        'client-statistics': {
            title: 'Estatísticas de Clientes',
            color: '#8b5cf6'
        },
        'approval-metrics': {
            title: 'Métricas de Aprovação',
            color: '#f59e0b'
        },
        'onboarding-funnel': {
            title: 'Funil de Conversão de Onboarding',
            color: '#06b6d4'
        },
        'agent-performance': {
            title: 'Performance de Agentes',
            color: '#ec4899'
        }
    };

    const config = reportConfig[reportId];

    const exportToPDF = async () => {
        if (!reportRef.current) return;

        try {
            const canvas = await html2canvas(reportRef.current, {
                backgroundColor: '#0f172a',
                scale: 2
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`relatorio-${reportId}-${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('Erro ao exportar PDF:', error);
        }
    };

    const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

    return (
        <div ref={reportRef}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem'
            }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                    {config.title}
                </h2>
                <button
                    onClick={exportToPDF}
                    className="btn-primary"
                    style={{ padding: '0.5rem 1rem' }}
                >
                    <FiDownload size={16} style={{ marginRight: '0.5rem' }} />
                    Exportar PDF
                </button>
            </div>

            {/* Credit Performance */}
            {reportId === 'credit-performance' && (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1rem'
                    }}>
                        <MetricCard
                            title="Total de Créditos"
                            value={formatNumber(data.volume.totalCredits)}
                            color={config.color}
                        />
                        <MetricCard
                            title="Valor Total"
                            value={formatCurrency(data.volume.totalAmount)}
                            color={config.color}
                        />
                        <MetricCard
                            title="Valor Médio"
                            value={formatCurrency(data.volume.avgAmount)}
                            color={config.color}
                        />
                    </div>

                    {/* Line Chart */}
                    <div className="glass" style={{ padding: '2rem', borderRadius: '16px', minWidth: 0 }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>
                            Evolução ao Longo do Tempo
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={data.timeline.map(t => ({
                                name: `${t._id.month}/${t._id.year}`,
                                creditos: t.count,
                                valor: t.amount / 1000000
                            }))}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="name" stroke="#fff" />
                                <YAxis stroke="#fff" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="creditos" stroke={config.color} strokeWidth={2} name="Créditos" />
                                <Line type="monotone" dataKey="valor" stroke="#10b981" strokeWidth={2} name="Valor (M MT)" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Bar Chart por Status */}
                    <div className="glass" style={{ padding: '2rem', borderRadius: '16px', minWidth: 0 }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>
                            Distribuição por Status
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={data.byStatus.map(s => ({
                                name: s._id,
                                quantidade: s.count,
                                valor: s.totalAmount / 1000000
                            }))}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="name" stroke="#fff" />
                                <YAxis stroke="#fff" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="quantidade" fill={config.color} name="Quantidade" />
                                <Bar dataKey="valor" fill="#10b981" name="Valor (M MT)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Default Analysis */}
            {reportId === 'default-analysis' && (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1rem'
                    }}>
                        <MetricCard
                            title="Taxa de Inadimplência"
                            value={`${data.defaultRate}%`}
                            color={config.color}
                        />
                        <MetricCard
                            title="Valor em Atraso"
                            value={formatCurrency(data.totalOverdueAmount)}
                            color={config.color}
                        />
                        <MetricCard
                            title="Créditos Atrasados"
                            value={formatNumber(data.overdueCredits.length)}
                            color={config.color}
                        />
                    </div>

                    {/* Bar Chart - Dias de Atraso */}
                    <div className="glass" style={{ padding: '2rem', borderRadius: '16px', minWidth: 0 }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>
                            Distribuição por Dias de Atraso
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={Object.entries(data.distribution).map(([range, count]) => ({
                                range,
                                total: count
                            }))}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="range" stroke="#fff" />
                                <YAxis stroke="#fff" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="total" fill={config.color} name="Créditos Atrasados" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Financial Summary */}
            {reportId === 'financial-summary' && (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1rem'
                    }}>
                        <MetricCard
                            title="Total Emprestado"
                            value={formatCurrency(data.totalLent)}
                            color={config.color}
                        />
                        <MetricCard
                            title="Total Recebido"
                            value={formatCurrency(data.totalReceived)}
                            color={config.color}
                        />
                        <MetricCard
                            title="Receita de Juros"
                            value={formatCurrency(data.interestRevenue)}
                            color={config.color}
                        />
                    </div>

                    {/* Pie Chart - Métodos de Pagamento */}
                    <div className="glass" style={{ padding: '2rem', borderRadius: '16px', minWidth: 0 }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>
                            Métodos de Pagamento
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={data.paymentMethods.map((method, idx) => ({
                                        name: method._id || 'N/A',
                                        value: method.amount
                                    }))}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={(entry) => `${entry.name}: ${((entry.value / data.paymentMethods.reduce((sum, m) => sum + m.amount, 0)) * 100).toFixed(1)}%`}
                                    outerRadius={100}
                                    fill={config.color}
                                    dataKey="value"
                                >
                                    {data.paymentMethods.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px'
                                    }}
                                    formatter={(value) => formatCurrency(value)}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Client Statistics */}
            {reportId === 'client-statistics' && (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1rem'
                    }}>
                        <MetricCard
                            title="Total de Clientes"
                            value={formatNumber(data.totalClients)}
                            color={config.color}
                        />
                        <MetricCard
                            title="Novos (Último Mês)"
                            value={formatNumber(data.newClients)}
                            color={config.color}
                        />
                        <MetricCard
                            title="Clientes Ativos"
                            value={formatNumber(data.activeClients)}
                            color={config.color}
                        />
                    </div>

                    {/* Bar Chart - Score Distribution */}
                    {data.scoreDistribution && data.scoreDistribution.length > 0 && (
                        <div className="glass" style={{ padding: '2rem', borderRadius: '16px', minWidth: 0 }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>
                                Distribuição por Score de Crédito
                            </h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={data.scoreDistribution.map(s => ({
                                    range: `${s._id}-${s._id + 200}`,
                                    clientes: s.count
                                }))}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis dataKey="range" stroke="#fff" />
                                    <YAxis stroke="#fff" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1e293b',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Legend />
                                    <Bar dataKey="clientes" fill={config.color} name="Clientes" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            )}

            {/* Onboarding Funnel */}
            {reportId === 'onboarding-funnel' && (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div className="glass" style={{ padding: '2rem', borderRadius: '16px', minWidth: 0 }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>
                            Fluxo de Conversão
                        </h3>
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart
                                layout="vertical"
                                data={data.steps}
                                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis type="number" stroke="#fff" />
                                <YAxis dataKey="name" type="category" stroke="#fff" width={100} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Bar dataKey="count" fill={config.color} radius={[0, 4, 4, 0]} name="Volume" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1rem'
                    }}>
                        {data.steps.map((step, idx) => (
                            <MetricCard
                                key={idx}
                                title={step.name}
                                value={formatNumber(step.count)}
                                color={config.color}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Agent Performance */}
            {reportId === 'agent-performance' && (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div className="glass" style={{ padding: '2rem', borderRadius: '16px', overflow: 'hidden' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>
                            Ranking de Performance por Agente
                        </h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Agente</th>
                                        <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Cadastros</th>
                                        <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Créditos</th>
                                        <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Volume Total</th>
                                        <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Conversão</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((agent, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '1rem', fontWeight: 600 }}>{agent.name}</td>
                                            <td style={{ padding: '1rem' }}>{formatNumber(agent.clientCount)}</td>
                                            <td style={{ padding: '1rem' }}>{formatNumber(agent.creditCount)}</td>
                                            <td style={{ padding: '1rem', color: 'var(--accent)' }}>{formatCurrency(agent.totalVolume)}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
                                                        <div style={{
                                                            height: '100%',
                                                            width: `${(agent.creditCount / (agent.clientCount || 1) * 100)}%`,
                                                            background: config.color,
                                                            borderRadius: '3px'
                                                        }} />
                                                    </div>
                                                    <span style={{ fontSize: '0.8rem' }}>
                                                        {((agent.creditCount / (agent.clientCount || 1)) * 100).toFixed(1)}%
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Approval Metrics */}
            {reportId === 'approval-metrics' && (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1rem'
                    }}>
                        <MetricCard
                            title="Total de Solicitações"
                            value={formatNumber(data.totalRequests)}
                            color={config.color}
                        />
                        <MetricCard
                            title="Taxa de Aprovação"
                            value={`${data.approvalRate}%`}
                            color={config.color}
                        />
                        <MetricCard
                            title="Tempo Médio Análise"
                            value={`${data.avgAnalysisTime}h`}
                            color={config.color}
                        />
                    </div>

                    {/* Pie Chart - Status Breakdown */}
                    <div className="glass" style={{ padding: '2rem', borderRadius: '16px', minWidth: 0 }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>
                            Breakdown por Status
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={data.statusBreakdown.map(s => ({
                                        name: s._id,
                                        value: s.count
                                    }))}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={(entry) => `${entry.name}: ${entry.value}`}
                                    outerRadius={100}
                                    fill={config.color}
                                    dataKey="value"
                                >
                                    {data.statusBreakdown.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
};

const MetricCard = ({ title, value, color }) => (
    <div className="glass" style={{
        padding: '1.5rem',
        borderRadius: '12px',
        borderLeft: `4px solid ${color}`
    }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            {title}
        </div>
        <div style={{ fontSize: '1.8rem', fontWeight: 700, color }}>
            {value}
        </div>
    </div>
);

export default Reports;
