import React, { useState, useEffect } from 'react';
import api from '../api';
import Layout from '../components/Layout';
import { FiSearch, FiFilter, FiCheckCircle, FiXCircle, FiClock, FiSmartphone, FiMessageCircle, FiChevronLeft, FiChevronRight, FiActivity } from 'react-icons/fi';

const CommunicationHistory = ({ status: initialStatus }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({
        status: initialStatus || '',
        channel: '',
        type: ''
    });

    useEffect(() => {
        fetchHistory();
    }, [page, filters, initialStatus]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await api.get('/communication/history', {
                params: { ...filters, page, limit: 15 }
            });
            if (res.data.success) {
                setHistory(res.data.data.history);
                setTotalPages(res.data.data.totalPages);
            }
        } catch (error) {
            console.error('Error fetching history', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'sent': return <span style={{ color: 'var(--success)', background: 'rgba(34, 197, 94, 0.1)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800 }}>🟢 ENVIADO</span>;
            case 'pending': return <span style={{ color: 'var(--warning)', background: 'rgba(234, 179, 8, 0.1)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800 }}>🟡 PENDENTE</span>;
            case 'failed': return <span style={{ color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800 }}>🔴 FALHOU</span>;
            case 'cancelled': return <span style={{ color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.05)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>CANCELADO</span>;
            default: return status;
        }
    };

    return (
        <Layout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{initialStatus === 'pending' ? 'Agendamentos' : 'Histórico de Comunicação'}</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Métricas detalhadas e logs de envios para clientes.</p>
                </div>
            </div>

            <div className="card" style={{ padding: '0' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {!initialStatus && (
                        <select
                            className="input-main"
                            style={{ padding: '0.5rem 1rem', width: 'auto' }}
                            value={filters.status}
                            onChange={e => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}
                        >
                            <option value="">Todos Status</option>
                            <option value="sent">Enviados</option>
                            <option value="failed">Falhas</option>
                            <option value="pending">Pendentes</option>
                        </select>
                    )}
                    <select
                        className="input-main"
                        style={{ padding: '0.5rem 1rem', width: 'auto' }}
                        value={filters.channel}
                        onChange={e => { setFilters({ ...filters, channel: e.target.value }); setPage(1); }}
                    >
                        <option value="">Todos Canais</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="sms">SMS</option>
                    </select>
                    <select
                        className="input-main"
                        style={{ padding: '0.5rem 1rem', width: 'auto' }}
                        value={filters.type}
                        onChange={e => { setFilters({ ...filters, type: e.target.value }); setPage(1); }}
                    >
                        <option value="">Todas Tipos</option>
                        <option value="manual">Manual</option>
                        <option value="auto_reminder">Lembrete Auto</option>
                        <option value="campaign">Campanha</option>
                    </select>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-light)' }}>
                                <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>DATA/HORA</th>
                                <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>CLIENTE</th>
                                <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>CANAL</th>
                                <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>MENSAGEM</th>
                                <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>STATUS</th>
                                <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>TIPO</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && history.length === 0 ? (
                                <tr><td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--accent)' }}>Carregando histórico...</td></tr>
                            ) : history.length === 0 ? (
                                <tr><td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum log encontrado.</td></tr>
                            ) : (
                                history.map(item => (
                                    <tr key={item._id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem' }}>
                                            <div style={{ fontWeight: 600 }}>{new Date(item.scheduledFor || item.createdAt).toLocaleDateString('pt-MZ')}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(item.scheduledFor || item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.client?.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.client?.phone}</div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                                {item.channel === 'whatsapp' ? <FiMessageCircle style={{ color: '#22c55e' }} /> : <FiSmartphone style={{ color: '#3b82f6' }} />}
                                                <span style={{ textTransform: 'capitalize' }}>{item.channel}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', maxWidth: '300px' }}>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.message}>{item.message}</p>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            {getStatusBadge(item.status)}
                                            {item.status === 'failed' && (
                                                <div style={{ fontSize: '0.65rem', color: 'var(--danger)', marginTop: '4px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.error}</div>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{
                                                fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px',
                                                background: 'var(--bg-main)', border: '1px solid var(--border-light)', display: 'inline-block'
                                            }}>
                                                {item.type === 'auto_reminder' ? 'AUTOMAÇÃO' : item.type.toUpperCase()}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-light)' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Página {page} de {totalPages}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            disabled={page <= 1}
                            onClick={() => setPage(page - 1)}
                            className="btn-outline"
                            style={{ padding: '0.5rem', border: '1px solid var(--border-light)' }}
                        >
                            <FiChevronLeft />
                        </button>
                        <button
                            disabled={page >= totalPages}
                            onClick={() => setPage(page + 1)}
                            className="btn-outline"
                            style={{ padding: '0.5rem', border: '1px solid var(--border-light)' }}
                        >
                            <FiChevronRight />
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default CommunicationHistory;
