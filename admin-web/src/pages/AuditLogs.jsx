import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api';
import {
    FiActivity, FiSearch, FiFilter, FiUser,
    FiAlertTriangle, FiCheckCircle, FiInfo, FiLayers
} from 'react-icons/fi';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({ severity: '', action: '', entityType: '' });

    useEffect(() => {
        fetchLogs();
    }, [page, filters]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page,
                ...filters
            }).toString();
            const res = await api.get(`/audit/logs?${queryParams}`);
            if (res.data.success) {
                setLogs(res.data.data.logs);
                setTotalPages(res.data.data.totalPages);
            }
        } catch (error) {
            console.error("Error fetching audit logs", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPage(1);
    };

    const getSeverityBadge = (severity) => {
        const styles = {
            critical: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', icon: <FiAlertTriangle /> },
            high: { color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)', icon: <FiAlertTriangle /> },
            medium: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', icon: <FiInfo /> },
            low: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', icon: <FiCheckCircle /> }
        };
        const style = styles[severity] || styles.low;
        return (
            <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.7rem',
                fontWeight: 800, color: style.color, background: style.bg,
                textTransform: 'uppercase'
            }}>
                {style.icon} {severity}
            </span>
        );
    };

    return (
        <Layout>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Rastreabilidade e Auditoria</h1>
                <p style={{ color: 'var(--text-muted)' }}>Monitoramento completo de todas as ações críticas realizadas no sistema.</p>
            </div>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Nível de Gravidade</label>
                        <select name="severity" value={filters.severity} onChange={handleFilterChange} className="glass-select" style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-main)' }}>
                            <option value="">Todos</option>
                            <option value="critical">Crítico</option>
                            <option value="high">Alto</option>
                            <option value="medium">Médio</option>
                            <option value="low">Baixo</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Tipo de Entidade</label>
                        <select name="entityType" value={filters.entityType} onChange={handleFilterChange} className="glass-select" style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-main)' }}>
                            <option value="">Todas</option>
                            <option value="Credit">Créditos</option>
                            <option value="User">Utilizadores/Clientes</option>
                            <option value="Payment">Pagamentos</option>
                            <option value="Institution">Instituição</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Ação</label>
                        <select name="action" value={filters.action} onChange={handleFilterChange} className="glass-select" style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-main)' }}>
                            <option value="">Todas</option>
                            <option value="approve">Aprovação</option>
                            <option value="disburse">Desembolso</option>
                            <option value="request">Solicitação</option>
                            <option value="create_client">Cadastro Cliente</option>
                            <option value="create">Criação</option>
                            <option value="login">Login</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <button onClick={fetchLogs} className="btn-primary" style={{ width: '100%', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <FiSearch /> Atualizar
                        </button>
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: 0 }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'left' }}>
                                <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Timestamp</th>
                                <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Utilizador</th>
                                <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Ação / Entidade</th>
                                <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Gravidade</th>
                                <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Origem (IP)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center' }}>Carregando logs...</td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum log de auditoria encontrado.</td></tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <td style={{ padding: '1.25rem 1.5rem', whiteSpace: 'nowrap' }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{new Date(log.timestamp).toLocaleDateString()}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleTimeString()}</div>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
                                                    {log.user?.name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{log.user?.name}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{log.user?.role?.toUpperCase()}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', fontWeight: 700, fontSize: '0.85rem' }}>
                                                <FiLayers /> {log.action.toUpperCase()}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.entityType} ID: {log.entityId}</div>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            {getSeverityBadge(log.severity)}
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <div style={{ fontSize: '0.85rem' }}>{log.metadata?.ipAddress}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.metadata?.userAgent}</div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'center', gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <button disabled={page === 1} onClick={() => setPage(page - 1)} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>Anterior</button>
                        <span style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', fontSize: '0.9rem' }}>Página {page} de {totalPages}</span>
                        <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>Próxima</button>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default AuditLogs;
