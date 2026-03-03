import React, { useState, useEffect, useRef } from 'react';
import { FiDownload, FiCalendar, FiPrinter } from 'react-icons/fi';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../api';
import Layout from '../components/Layout';

const fmt = (v) => new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(v || 0);
const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const BomReport = () => {
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
            const res = await api.get(`/reports/bom?month=${month}&year=${year}`);
            if (res.data.success) setData(res.data.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const exportExcel = async () => {
        try {
            const res = await api.get(`/reports/bom/excel?month=${month}&year=${year}`, { responseType: 'blob' });
            const url = URL.createObjectURL(res.data);
            const a = document.createElement('a');
            a.href = url;
            a.download = `reporte-bdm-${String(month).padStart(2, '0')}-${year}.xlsx`;
            a.click();
        } catch (e) { console.error(e); }
    };

    const exportPDF = async () => {
        if (!reportRef.current) return;
        try {
            const canvas = await html2canvas(reportRef.current, { backgroundColor: '#0f172a', scale: 1.2 });
            const img = canvas.toDataURL('image/png');
            const pdf = new jsPDF('l', 'mm', 'a4'); // landscape for wide table
            const w = pdf.internal.pageSize.getWidth();
            const h = (canvas.height * w) / canvas.width;
            pdf.addImage(img, 'PNG', 0, 0, w, h);
            pdf.save(`reporte-bdm-${String(month).padStart(2, '0')}-${year}.pdf`);
        } catch (e) { console.error(e); }
    };

    const selStyle = { background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none', cursor: 'pointer' };

    return (
        <Layout>
            <div style={{ padding: '2rem', maxWidth: '100%', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem' }}>📋 Relatório BdM</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Banco de Moçambique — Reporte Periódico de Informações</p>
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
                            <FiDownload size={15} /> Excel BdM
                        </button>
                        <button onClick={exportPDF} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1rem', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                            <FiDownload size={15} /> PDF BdM
                        </button>
                    </div>
                </div>

                {loading && <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Carregando relatório BdM...</div>}

                {data && (
                    <div ref={reportRef}>
                        {/* BdM Official Header */}
                        <div className="glass" style={{ padding: '2rem', borderRadius: '16px', marginBottom: '1.5rem', textAlign: 'center', borderTop: '4px solid #e63946' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e63946', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>BANCO DE MOÇAMBIQUE</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>DEPARTAMENTO DE SUPERVISÃO PRUDENCIAL</div>
                            <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.35rem' }}>REPORTE PERIÓDICO DE INFORMAÇÕES DE</div>
                            <div style={{ fontSize: '1rem', fontWeight: 700 }}>INSTITUIÇÕES SUJEITAS À MONITORIZAÇÃO</div>
                            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '2rem', fontSize: '0.875rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                                <span><strong style={{ color: 'var(--text-main)' }}>Período de Reporte:</strong> {data.period.label}</span>
                                <span><strong style={{ color: 'var(--text-main)' }}>Data:</strong> {new Date().toLocaleDateString('pt-MZ')}</span>
                            </div>
                        </div>

                        {/* Section 1: Institution ID */}
                        <div className="glass" style={{ padding: '1.5rem', borderRadius: '16px', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#e63946' }}>1. Identificação da Instituição</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                                {[
                                    { label: 'Denominação', value: data.institution.name },
                                    { label: 'Endereço', value: data.institution.address },
                                    { label: 'Província', value: data.institution.province },
                                    { label: 'Telefone', value: data.institution.phone },
                                    { label: 'E-mail', value: data.institution.email },
                                    { label: 'Nº de Trabalhadores', value: data.institution.workers },
                                    { label: 'Data de Início das Actividades', value: data.institution.startDate ? new Date(data.institution.startDate).toLocaleDateString('pt-MZ') : '—' },
                                    { label: 'Nome do Responsável pela Gestão', value: data.institution.manager }
                                ].map(f => (
                                    <div key={f.label} style={{ padding: '0.6rem 0.9rem', background: 'var(--bg-main)', borderRadius: '8px', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, minWidth: '140px', paddingTop: '0.1rem', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{f.label}:</span>
                                        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{f.value || '—'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Section 2: Operations Table */}
                        <div className="glass" style={{ borderRadius: '16px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                <h3 style={{ fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#e63946' }}>2. Tabela de Operações de Crédito</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>{data.totals.totalOperacoes} operações no período {data.period.label}</p>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                    <thead>
                                        <tr style={{ background: 'rgba(230,57,70,0.08)' }}>
                                            {[
                                                { label: 'Nº Op. (1)', width: '60px' },
                                                { label: 'Nome do Cliente (2)', width: '160px' },
                                                { label: 'Data Desembolso (3)', width: '110px' },
                                                { label: 'Montante Desemb. (4)', width: '120px' },
                                                { label: 'Finalidade (5)', width: '100px' },
                                                { label: 'Val. Prestação (6)', width: '110px' },
                                                { label: 'Periodicidade (7)', width: '100px' },
                                                { label: 'Prazo (8)', width: '80px' },
                                                { label: 'Taxa Juro (9)', width: '90px' },
                                                { label: 'Créd. em Dívida (10)', width: '120px' },
                                                { label: 'Créd. em Atraso (11)', width: '120px' },
                                                { label: 'Dias Atraso (12)', width: '100px' },
                                                { label: 'PPEs (13)', width: '70px' }
                                            ].map(col => (
                                                <th key={col.label} style={{ padding: '0.75rem 0.6rem', textAlign: 'left', fontSize: '0.68rem', fontWeight: 700, color: '#e63946', borderBottom: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap', minWidth: col.width }}>
                                                    {col.label}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.operations.length === 0 ? (
                                            <tr><td colSpan={13} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhuma operação no período selecionado.</td></tr>
                                        ) : data.operations.map(op => (
                                            <tr key={op.numero} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                                                <td style={{ padding: '0.65rem 0.6rem', fontWeight: 700, color: 'var(--accent)' }}>{op.numero}</td>
                                                <td style={{ padding: '0.65rem 0.6rem', fontWeight: 600 }}>{op.nomeCliente}</td>
                                                <td style={{ padding: '0.65rem 0.6rem', color: 'var(--text-muted)' }}>{new Date(op.dataDesembolso).toLocaleDateString('pt-MZ')}</td>
                                                <td style={{ padding: '0.65rem 0.6rem', fontWeight: 700 }}>{fmt(op.montanteDesembolso)}</td>
                                                <td style={{ padding: '0.65rem 0.6rem', color: 'var(--text-muted)' }}>{op.finalidade}</td>
                                                <td style={{ padding: '0.65rem 0.6rem' }}>{fmt(op.valorPrestacao)}</td>
                                                <td style={{ padding: '0.65rem 0.6rem', color: 'var(--text-muted)' }}>{op.periodicidade}</td>
                                                <td style={{ padding: '0.65rem 0.6rem', color: 'var(--text-muted)' }}>{op.prazoReembolso} meses</td>
                                                <td style={{ padding: '0.65rem 0.6rem', fontWeight: 700 }}>{op.taxaJuro}%</td>
                                                <td style={{ padding: '0.65rem 0.6rem', fontWeight: 700 }}>{fmt(op.creditoEmDivida)}</td>
                                                <td style={{ padding: '0.65rem 0.6rem', fontWeight: 700, color: op.creditoEmAtraso > 0 ? '#ef4444' : 'var(--text-muted)' }}>{fmt(op.creditoEmAtraso)}</td>
                                                <td style={{ padding: '0.65rem 0.6rem', color: op.diasAtraso > 0 ? '#f59e0b' : 'var(--text-muted)', fontWeight: op.diasAtraso > 0 ? 700 : 400 }}>{op.diasAtraso}</td>
                                                <td style={{ padding: '0.65rem 0.6rem', color: 'var(--text-muted)' }}>{op.ppes}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    {/* Totals row */}
                                    {data.operations.length > 0 && (
                                        <tfoot>
                                            <tr style={{ background: 'var(--bg-main)', fontWeight: 800, borderTop: '2px solid rgba(255,255,255,0.1)' }}>
                                                <td colSpan={3} style={{ padding: '0.85rem 0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>TOTAIS ({data.totals.totalOperacoes} op.)</td>
                                                <td style={{ padding: '0.85rem 0.6rem' }}>{fmt(data.totals.totalDesembolsado)}</td>
                                                <td colSpan={5}></td>
                                                <td style={{ padding: '0.85rem 0.6rem' }}>{fmt(data.totals.totalEmDivida)}</td>
                                                <td style={{ padding: '0.85rem 0.6rem', color: '#ef4444' }}>{fmt(data.totals.totalEmAtraso)}</td>
                                                <td colSpan={2}></td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="glass" style={{ padding: '1.5rem', borderRadius: '16px', borderTop: '3px solid rgba(255,255,255,0.06)' }}>
                            <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Notas Explicativas</h3>
                            <ol style={{ paddingLeft: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                {[
                                    'Número da operação de crédito',
                                    'Nome do cliente',
                                    'Data do desembolso inicial',
                                    'Valor do crédito concedido',
                                    'Finalidade do crédito desembolsado, designadamente para empresa, consumo ou habitação.',
                                    'Montante da prestação periódica para amortização do crédito',
                                    'Forma de pagamento, acordada, designadamente diário, semanal, mensal ou anual.',
                                    'Data de vencimento do crédito desembolsado',
                                    'Percentagem da taxa juro aplicada ao crédito',
                                    'Montante do crédito desembolsado que falta pagar, excluindo prestação em atraso.',
                                    'Montante da prestação em atraso incluindo capital e juros.',
                                    'Dias em atraso do pagamento da prestação.',
                                    'Crédito concedido por razão politicamente exposta.'
                                ].map((note, i) => (
                                    <li key={i} style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '0.1rem' }}>{note}</li>
                                ))}
                            </ol>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default BomReport;
