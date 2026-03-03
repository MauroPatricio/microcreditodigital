import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import api from '../api';
import {
    FiMail, FiFilter, FiCheckCircle, FiXCircle,
    FiSend, FiBarChart2, FiSmartphone, FiClock
} from 'react-icons/fi';

const SmsLogs = () => {
    const { user } = useAuth();
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ type: '', status: '', recipient: '' });
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchData();
    }, [page, filters]);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page,
                ...filters
            }).toString();
            const res = await api.get(`/sms/logs?${queryParams}`);
            if (res.data.success) {
                setLogs(res.data.data.logs);
                setTotalPages(res.data.data.totalPages);
            }
        } catch (error) {
            console.error("Error fetching SMS logs", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await api.get('/sms/stats');
            if (res.data.success) {
                setStats(res.data.data);
            }
        } catch (error) {
            console.error("Error fetching stats", error);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPage(1);
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'delivered': return { color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' };
            case 'sent': return { color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)' };
            case 'failed': return { color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)' };
            default: return { color: 'var(--text-muted)', background: 'var(--bg-main)' };
        }
    };

    const getTypeLabel = (type) => {
        const types = {
            'approval': 'Aprovação',
            'rejection': 'Rejeição',
            'disbursement': 'Desembolso',
            'payment': 'Pagamento',
            'reminder': 'Lembrete',
            'overdue': 'Atraso',
            'otp': 'Código/OTP'
        };
        return types[type] || type;
    };

    return (
        <Layout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Logs de Comunicação</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Histórico de SMS enviados automaticamente pelo sistema.</p>
                </div>
            </div>

            {/* Quick Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontSize: '1.5rem' }}>
                        <FiSmartphone />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Enviados</p>
                        <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>{stats.reduce((acc, curr) => acc + curr.count, 0)}</p>
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontSize: '1.5rem' }}>
                        <FiCheckCircle />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sucesso</p>
                        <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>{stats.reduce((acc, curr) => acc + curr.sent, 0)}</p>
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontSize: '1.5rem' }}>
                        <FiXCircle />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Falhas</p>
                        <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>{stats.reduce((acc, curr) => acc + curr.failed, 0)}</p>
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', fontSize: '1.5rem' }}>
                        <FiClock />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tipos Ativos</p>
                        <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>{stats.length}</p>
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Destinatário</label>
                        <div className="glass" style={{ display: 'flex', alignItems: 'center', padding: '0.5rem 1rem', borderRadius: '8px' }}>
                            <FiSmartphone style={{ color: 'var(--accent)', marginRight: '0.5rem' }} />
                            <input
                                type="text"
                                name="recipient"
                                placeholder="Telefone..."
                                value={filters.recipient}
                                onChange={handleFilterChange}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', width: '100%', outline: 'none' }}
                            />
                        </div>
                    </div>
                    <div style={{ width: '200px' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Tipo</label>
                        <select
                            name="type"
                            value={filters.type}
                            onChange={handleFilterChange}
                            style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-main)', outline: 'none' }}
                        >
                            <option value="">Todos</option>
                            <option value="approval">Aprovação</option>
                            <option value="rejection">Rejeição</option>
                            <option value="reminder">Lembrete</option>
                            <option value="payment">Pagamento</option>
                            <option value="disbursement">Desembolso</option>
                        </select>
                    </div>
                    <div style={{ width: '200px' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Status</label>
                        <select
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-main)', outline: 'none' }}
                        >
                            <option value="">Todos</option>
                            <option value="sent">Enviado</option>
                            <option value="failed">Falhou</option>
                            <option value="delivered">Entregue</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: 0 }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'left' }}>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Destinatário</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Tipo</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Mensagem</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Data</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center' }}>Carregando...</td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum log encontrado.</td></tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <span style={{ fontWeight: 600 }}>{log.recipient}</span>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 600 }}>{getTypeLabel(log.type)}</span>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <p style={{ fontSize: '0.85rem', maxWidth: '400px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={log.message}>
                                                {log.message}
                                            </p>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                            {new Date(log.sentAt).toLocaleString()}
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '20px',
                                                fontSize: '0.7rem',
                                                fontWeight: 800,
                                                ...getStatusStyle(log.status)
                                            }}>
                                                {log.status.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'center', gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        {[...Array(totalPages)].map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setPage(i + 1)}
                                style={{
                                    width: '32px', height: '32px', borderRadius: '8px',
                                    background: page === i + 1 ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                                    color: 'var(--text-main)', border: 'none', cursor: 'pointer'
                                }}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default SmsLogs;
