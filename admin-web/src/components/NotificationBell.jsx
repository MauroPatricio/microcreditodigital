import React, { useState, useEffect, useRef } from 'react';
import { FiBell, FiCheck, FiCheckCircle, FiAlertCircle, FiDollarSign, FiFileText } from 'react-icons/fi';
import api from '../api';

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications?limit=15');
            if (res.data?.success) {
                setNotifications(res.data.data.notifications || []);
                setUnreadCount(res.data.data.unreadCount || 0);
            }
        } catch (err) {
            console.error('Erro ao buscar notificações:', err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Polling a cada 45 segundos
        const interval = setInterval(fetchNotifications, 45000);
        return () => clearInterval(interval);
    }, []);

    // Fechar ao clicar fora
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Erro ao marcar como lida:', err);
        }
    };

    const markAllAsRead = async () => {
        try {
            setLoading(true);
            await api.put('/notifications/mark-all-read');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Erro ao marcar todas como lidas:', err);
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (type) => {
        if (type?.includes('payment')) return <FiDollarSign color="#10B981" />;
        if (type?.includes('document')) return <FiFileText color="#3B82F6" />;
        return <FiAlertCircle color="#F59E0B" />;
    };

    return (
        <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                }}
                title="Notificações"
            >
                <FiBell size={18} />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        background: '#EF4444',
                        color: 'white',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        borderRadius: '10px',
                        padding: '2px 6px',
                        minWidth: '18px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 6px rgba(239,68,68,0.5)'
                    }}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '50px',
                    right: 0,
                    width: '360px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    zIndex: 1050,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <div style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--border-light)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'var(--bg-card-hover, rgba(0,0,0,0.02))'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)' }}>
                                Notificações
                            </span>
                            {unreadCount > 0 && (
                                <span style={{
                                    fontSize: '11px',
                                    background: 'rgba(59, 130, 246, 0.1)',
                                    color: '#3B82F6',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontWeight: 600
                                }}>
                                    {unreadCount} nova(s)
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                disabled={loading}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#3B82F6',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}
                            >
                                <FiCheckCircle size={13} /> Marcar todas
                            </button>
                        )}
                    </div>

                    <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <FiBell size={28} style={{ opacity: 0.3, marginBottom: '8px' }} />
                                <p style={{ margin: 0, fontSize: '13px' }}>Nenhuma notificação encontrada.</p>
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n._id}
                                    onClick={() => !n.isRead && markAsRead(n._id)}
                                    style={{
                                        padding: '12px 16px',
                                        borderBottom: '1px solid var(--border-light)',
                                        background: n.isRead ? 'transparent' : 'rgba(59, 130, 246, 0.05)',
                                        cursor: n.isRead ? 'default' : 'pointer',
                                        transition: 'background 0.2s ease',
                                        display: 'flex',
                                        gap: '12px',
                                        alignItems: 'flex-start'
                                    }}
                                >
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '8px',
                                        background: 'var(--bg-main)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        marginTop: '2px'
                                    }}>
                                        {getIcon(n.type)}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                                            <h4 style={{
                                                margin: 0,
                                                fontSize: '13px',
                                                fontWeight: n.isRead ? 600 : 700,
                                                color: 'var(--text-main)'
                                            }}>
                                                {n.title}
                                            </h4>
                                            {!n.isRead && (
                                                <span style={{
                                                    width: '6px',
                                                    height: '6px',
                                                    borderRadius: '50%',
                                                    background: '#3B82F6',
                                                    display: 'inline-block'
                                                }} />
                                            )}
                                        </div>
                                        <p style={{
                                            margin: '0 0 6px 0',
                                            fontSize: '12px',
                                            color: 'var(--text-muted)',
                                            lineHeight: 1.4
                                        }}>
                                            {n.message}
                                        </p>
                                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', opacity: 0.8 }}>
                                            {new Date(n.createdAt).toLocaleDateString('pt-MZ', {
                                                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
