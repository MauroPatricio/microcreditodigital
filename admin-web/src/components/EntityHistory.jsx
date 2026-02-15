import React, { useState, useEffect } from 'react';
import api from '../api';
import { FiClock, FiUser, FiActivity, FiTag, FiAlertCircle } from 'react-icons/fi';

const EntityHistory = ({ entityType, entityId }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/audit/entity/${entityType}/${entityId}`);
                if (res.data.success) {
                    setLogs(res.data.data);
                }
            } catch (error) {
                console.error("Error fetching entity history", error);
            } finally {
                setLoading(false);
            }
        };

        if (entityId) fetchHistory();
    }, [entityType, entityId]);

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical': return '#ef4444';
            case 'high': return '#f97316';
            case 'medium': return '#f59e0b';
            case 'low': return '#10b981';
            default: return 'var(--text-muted)';
        }
    };

    const getActionLabel = (action) => {
        const actions = {
            'request': 'Solicitação',
            'approve': 'Aprovação',
            'disburse': 'Desembolso',
            'create': 'Criação',
            'update': 'Atualização',
            'delete': 'Exclusão',
            'create_client': 'Cadastro de Cliente'
        };
        return actions[action] || action;
    };

    if (loading) return <div style={{ color: 'var(--accent)', padding: '1rem' }}>Carregando histórico...</div>;

    if (logs.length === 0) {
        return (
            <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Nenhuma ação registrada para esta entidade.
            </div>
        );
    }

    return (
        <div className="card" style={{ padding: '0' }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FiActivity color="var(--accent)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Histórico de Auditoria</h3>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {logs.map((log, index) => (
                    <div key={log._id} style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
                        {/* Timeline line */}
                        {index !== logs.length - 1 && (
                            <div style={{
                                position: 'absolute',
                                left: '7px',
                                top: '20px',
                                bottom: '-20px',
                                width: '1px',
                                background: 'rgba(255,255,255,0.1)'
                            }} />
                        )}

                        {/* Dot */}
                        <div style={{
                            width: '15px',
                            height: '15px',
                            borderRadius: '50%',
                            background: getSeverityColor(log.severity),
                            border: '3px solid var(--bg-card)',
                            zIndex: 1,
                            marginTop: '2px'
                        }} />

                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{getActionLabel(log.action)}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <FiClock /> {new Date(log.timestamp).toLocaleString()}
                                </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <div style={{
                                    width: '24px', height: '24px', borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.05)', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem'
                                }}>
                                    <FiUser />
                                </div>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    {log.user?.name}
                                    <span style={{ marginLeft: '0.4rem', fontSize: '0.75rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}>
                                        {log.user?.role}
                                    </span>
                                </span>
                            </div>

                            {log.metadata?.ipAddress && (
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', opacity: 0.7 }}>
                                    Origem: {log.metadata.ipAddress} • {log.metadata.method} {log.metadata.path}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EntityHistory;
