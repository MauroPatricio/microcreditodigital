import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Layout from '../components/Layout';
import {
    FiMessageSquare, FiSend, FiClock, FiAlertCircle,
    FiCheckCircle, FiBarChart2, FiArrowRight, FiSmartphone, FiMessageCircle
} from 'react-icons/fi';

const CommunicationDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalSentToday: 0,
        failedToday: 0,
        pending: 0,
        channelStats: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/communication/stats');
                if (res.data.success) {
                    setStats(res.data.data);
                }
            } catch (error) {
                console.error('Error fetching communication stats', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const StatCard = ({ title, value, icon: Icon, color, subtitle, onClick }) => (
        <div className="card glass" style={{ flex: 1, cursor: onClick ? 'pointer' : 'default', transition: 'transform 0.15s' }}
            onClick={onClick}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{title}</span>
                <div style={{ width: 34, height: 34, borderRadius: '10px', background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={16} style={{ color }} />
                </div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem', color: 'var(--text-main)' }}>{value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{subtitle}</div>
        </div>
    );

    if (loading) return <Layout><div style={{ color: 'var(--accent)', padding: '2rem' }}>Carregando métricas...</div></Layout>;

    const totalSent = stats.channelStats.reduce((acc, curr) => acc + curr.count, 0);
    const whatsappCount = stats.channelStats.find(s => s._id === 'whatsapp')?.count || 0;
    const smsCount = stats.channelStats.find(s => s._id === 'sms')?.count || 0;

    return (
        <Layout>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>Painel de Comunicação</h1>
                <p style={{ color: 'var(--text-muted)' }}>Métricas e controle de notificações (WhatsApp e SMS).</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <StatCard
                    title="Enviadas Hoje"
                    value={stats.totalSentToday}
                    icon={FiSend}
                    color="var(--success)"
                    subtitle="Mensagens processadas hoje"
                    onClick={() => navigate('/communication/history')}
                />
                <StatCard
                    title="Falhas Hoje"
                    value={stats.failedToday}
                    icon={FiAlertCircle}
                    color="var(--danger)"
                    subtitle="Mensagens não entregues"
                    onClick={() => navigate('/communication/history?status=failed')}
                />
                <StatCard
                    title="Fila Pendente"
                    value={stats.pending}
                    icon={FiClock}
                    color="var(--warning)"
                    subtitle="Aguardando horário de envio"
                    onClick={() => navigate('/communication/schedules')}
                />
                <StatCard
                    title="Total de Sempre"
                    value={totalSent}
                    icon={FiBarChart2}
                    color="var(--accent)"
                    subtitle={`${whatsappCount} Zap | ${smsCount} SMS`}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
                <div className="card">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Ações Rápidas</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <button
                            className="btn-primary"
                            style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', height: 'auto' }}
                            onClick={() => navigate('/communication/send')}
                        >
                            <FiSend size={24} />
                            <span>Enviar Nova Mensagem</span>
                        </button>
                        <button
                            className="btn-outline"
                            style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', height: 'auto', border: '1px solid var(--border-light)' }}
                            onClick={() => navigate('/communication/templates')}
                        >
                            <FiMessageSquare size={24} />
                            <span>Gerenciar Templates</span>
                        </button>
                    </div>
                </div>

                <div className="card">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Status dos Canais</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(34, 197, 94, 0.05)', borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.1)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#22c55e22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FiMessageCircle style={{ color: '#22c55e' }} />
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>WhatsApp Web</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Conectado e Operacional</p>
                                </div>
                            </div>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 10px #22c55e' }}></div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#3b82f622', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FiSmartphone style={{ color: '#3b82f6' }} />
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>Provedor SMS</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--blue-highlight)' }}>Simulado (Modo Local)</p>
                                </div>
                            </div>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 10px #3b82f6' }}></div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default CommunicationDashboard;
