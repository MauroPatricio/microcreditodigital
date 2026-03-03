import React, { useState, useEffect } from 'react';
import {
    FiArrowUpCircle, FiArrowDownCircle, FiDollarSign, FiPlus,
    FiFilter, FiRefreshCw, FiX, FiEdit2, FiTrash2, FiTrendingUp
} from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api';
import Layout from '../components/Layout';

const CATEGORIES = {
    entrada: [
        { value: 'parcela', label: 'Pagamento de Parcela' },
        { value: 'juros', label: 'Juros Recebidos' },
        { value: 'multa', label: 'Multa Recebida' },
        { value: 'outro', label: 'Outro (Entrada)' }
    ],
    saida: [
        { value: 'emprestimo_desembolso', label: 'Desembolso de Empréstimo' },
        { value: 'despesa_operacional', label: 'Despesa Operacional' },
        { value: 'outro', label: 'Outro (Saída)' }
    ]
};

const PAYMENT_METHODS = ['dinheiro', 'mpesa', 'emola', 'transferencia', 'outro'];

const formatMT = (v) => new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(v || 0);
const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const CashFlow = () => {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [summary, setSummary] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [dailyData, setDailyData] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [filterType, setFilterType] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editTx, setEditTx] = useState(null);
    const [form, setForm] = useState({ type: 'entrada', category: 'parcela', amount: '', description: '', paymentMethod: 'dinheiro', date: new Date().toISOString().split('T')[0], reference: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => { load(); }, [month, year, filterType, page]);

    const load = async () => {
        setLoading(true);
        try {
            const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
            const lastDay = new Date(year, month, 0).getDate();
            const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

            const [sumRes, txRes, dailyRes] = await Promise.all([
                api.get(`/cashflow/summary?month=${month}&year=${year}`),
                api.get(`/cashflow/transactions?page=${page}&limit=20&type=${filterType}&startDate=${startDate}&endDate=${endDate}`),
                api.get(`/cashflow/daily-balance?startDate=${startDate}&endDate=${endDate}`)
            ]);
            if (sumRes.data.success) setSummary(sumRes.data.data);
            if (txRes.data.success) { setTransactions(txRes.data.data.transactions); setTotal(txRes.data.data.total); }
            if (dailyRes.data.success) {
                setDailyData(dailyRes.data.data.map(d => ({
                    name: `${d._id.day}/${d._id.month}`,
                    entradas: d.entradas,
                    saidas: d.saidas,
                    saldo: d.entradas - d.saidas
                })));
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const openCreate = () => {
        setEditTx(null);
        setForm({ type: 'entrada', category: 'parcela', amount: '', description: '', paymentMethod: 'dinheiro', date: new Date().toISOString().split('T')[0], reference: '' });
        setShowModal(true);
    };
    const openEdit = (tx) => {
        setEditTx(tx);
        setForm({ type: tx.type, category: tx.category, amount: tx.amount, description: tx.description || '', paymentMethod: tx.paymentMethod || 'dinheiro', date: tx.date?.split('T')[0] || '', reference: tx.reference || '' });
        setShowModal(true);
    };
    const handleDelete = async (id) => {
        if (!window.confirm('Eliminar esta transação?')) return;
        try { await api.delete(`/cashflow/transaction/${id}`); load(); } catch (e) { console.error(e); }
    };
    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editTx) { await api.put(`/cashflow/transaction/${editTx._id}`, form); }
            else { await api.post('/cashflow/transaction', form); }
            setShowModal(false);
            load();
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const SummaryCard = ({ label, value, icon: Icon, color, sub }) => (
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '16px', borderTop: `3px solid ${color}`, flex: 1, minWidth: '200px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
                <div style={{ width: 36, height: 36, borderRadius: '10px', background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={18} style={{ color }} />
                </div>
            </div>
            <div style={{ fontSize: '1.7rem', fontWeight: 800, color }}>{value}</div>
            {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{sub}</div>}
        </div>
    );

    return (
        <Layout>
            <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem' }}>🏦 Gestão de Caixa</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Controlo financeiro — entradas, saídas e saldo</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <select value={month} onChange={e => setMonth(Number(e.target.value))} style={inputStyle}>
                            {monthNames.map((n, i) => <option key={i} value={i + 1}>{n}</option>)}
                        </select>
                        <select value={year} onChange={e => setYear(Number(e.target.value))} style={inputStyle}>
                            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <button onClick={load} style={{ ...btnStyle, background: 'var(--sidebar-hover-bg)' }}><FiRefreshCw size={16} /></button>
                        <button onClick={openCreate} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem' }}>
                            <FiPlus size={16} /> Nova Transação
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                {summary && (
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                        <SummaryCard label="Saldo Inicial" value={formatMT(summary.saldoInicial)} icon={FiDollarSign} color="#8b5cf6" />
                        <SummaryCard label="Total Entradas" value={formatMT(summary.totalEntradas)} icon={FiArrowUpCircle} color="#10b981" sub={`${summary.entradasByCategory?.length || 0} categorias`} />
                        <SummaryCard label="Total Saídas" value={formatMT(summary.totalSaidas)} icon={FiArrowDownCircle} color="#ef4444" sub={`${summary.saidasByCategory?.length || 0} categorias`} />
                        <SummaryCard label="Saldo Final" value={formatMT(summary.saldoFinal)} icon={FiTrendingUp} color={summary.saldoFinal >= 0 ? '#10b981' : '#ef4444'} sub={monthNames[month - 1] + ' ' + year} />
                    </div>
                )}

                {/* Daily Chart */}
                {dailyData.length > 0 && (
                    <div className="glass" style={{ padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem' }}>
                        <h3 style={{ fontWeight: 700, marginBottom: '1.5rem', fontSize: '1rem' }}>📈 Evolução Diária — {monthNames[month - 1]} {year}</h3>
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={dailyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                                <YAxis stroke="#64748b" fontSize={11} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
                                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} formatter={(v) => formatMT(v)} />
                                <Line type="monotone" dataKey="entradas" stroke="#10b981" strokeWidth={2} dot={false} name="Entradas" />
                                <Line type="monotone" dataKey="saidas" stroke="#ef4444" strokeWidth={2} dot={false} name="Saídas" />
                                <Line type="monotone" dataKey="saldo" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Saldo" strokeDasharray="4 2" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Transactions Table */}
                <div className="glass" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                    <div style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Listagem de Transações ({total})</h3>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => setFilterType('')} style={{ ...btnStyle, background: !filterType ? 'rgba(255,255,255,0.1)' : 'transparent' }}>Todas</button>
                            <button onClick={() => setFilterType('entrada')} style={{ ...btnStyle, background: filterType === 'entrada' ? 'rgba(16,185,129,0.15)' : 'transparent', color: filterType === 'entrada' ? '#10b981' : '' }}>Entradas</button>
                            <button onClick={() => setFilterType('saida')} style={{ ...btnStyle, background: filterType === 'saida' ? 'rgba(239,68,68,0.15)' : 'transparent', color: filterType === 'saida' ? '#ef4444' : '' }}>Saídas</button>
                        </div>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-main)' }}>
                                    {['Tipo', 'Categoria', 'Descrição', 'Método', 'Valor', 'Data', 'Ações'].map(h => (
                                        <th key={h} style={{ padding: '0.9rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Carregando...</td></tr>
                                ) : transactions.length === 0 ? (
                                    <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhuma transação para este período.</td></tr>
                                ) : transactions.map(tx => (
                                    <tr key={tx._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                                        <td style={{ padding: '0.8rem 1rem' }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, background: tx.type === 'entrada' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: tx.type === 'entrada' ? '#10b981' : '#ef4444' }}>
                                                {tx.type === 'entrada' ? <FiArrowUpCircle size={12} /> : <FiArrowDownCircle size={12} />}
                                                {tx.type === 'entrada' ? 'Entrada' : 'Saída'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.8rem 1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{tx.category}</td>
                                        <td style={{ padding: '0.8rem 1rem', fontSize: '0.85rem' }}>{tx.description || '—'}</td>
                                        <td style={{ padding: '0.8rem 1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{tx.paymentMethod}</td>
                                        <td style={{ padding: '0.8rem 1rem', fontWeight: 700, color: tx.type === 'entrada' ? '#10b981' : '#ef4444' }}>{tx.type === 'saida' ? '-' : '+'}{formatMT(tx.amount)}</td>
                                        <td style={{ padding: '0.8rem 1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(tx.date).toLocaleDateString('pt-MZ')}</td>
                                        <td style={{ padding: '0.8rem 1rem' }}>
                                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                <button onClick={() => openEdit(tx)} style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: 'none', padding: '0.35rem', borderRadius: '6px', cursor: 'pointer' }}><FiEdit2 size={13} /></button>
                                                <button onClick={() => handleDelete(tx._id)} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', padding: '0.35rem', borderRadius: '6px', cursor: 'pointer' }}><FiTrash2 size={13} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination */}
                    {total > 20 && (
                        <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={btnStyle}>← Anterior</button>
                            <span style={{ padding: '0.5rem 1rem', color: 'var(--text-muted)' }}>{page} / {Math.ceil(total / 20)}</span>
                            <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)} style={btnStyle}>Próxima →</button>
                        </div>
                    )}
                </div>

                {/* Modal */}
                {showModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="glass" style={{ width: '90%', maxWidth: '500px', padding: '2rem', borderRadius: '20px', position: 'relative' }}>
                            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><FiX size={20} /></button>
                            <h2 style={{ fontWeight: 800, marginBottom: '1.5rem' }}>{editTx ? 'Editar Transação' : 'Nova Transação'}</h2>
                            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={labelStyle}>Tipo</label>
                                        <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value, category: e.target.value === 'entrada' ? 'parcela' : 'emprestimo_desembolso' })} style={inputStyle}>
                                            <option value="entrada">Entrada</option>
                                            <option value="saida">Saída</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Categoria</label>
                                        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inputStyle}>
                                            {CATEGORIES[form.type].map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label style={labelStyle}>Montante (MT)</label>
                                    <input type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required style={inputStyle} placeholder="0.00" />
                                </div>
                                <div>
                                    <label style={labelStyle}>Descrição</label>
                                    <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={inputStyle} placeholder="Descrição opcional" />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={labelStyle}>Método de Pagamento</label>
                                        <select value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })} style={inputStyle}>
                                            {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Data</label>
                                        <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required style={inputStyle} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                    <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', background: 'var(--bg-main)', color: 'var(--text-muted)', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
                                    <button type="submit" className="btn-primary" style={{ flex: 2, padding: '0.75rem' }} disabled={saving}>{saving ? 'Guardando...' : editTx ? 'Guardar Alterações' : 'Registar Transação'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

const inputStyle = { width: '100%', padding: '0.65rem 0.9rem', borderRadius: '10px', border: '1px solid var(--border-light)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.9rem', boxSizing: 'border-box' };
const labelStyle = { display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.4px' };
const btnStyle = { padding: '0.5rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 };

export default CashFlow;
