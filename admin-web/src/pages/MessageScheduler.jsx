import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Layout from '../components/Layout';
import { FiSend, FiUsers, FiMessageSquare, FiCalendar, FiClock, FiCheck, FiX, FiActivity, FiMessageCircle, FiSmartphone } from 'react-icons/fi';

const formatDateDisplay = (dateString) => {
    if (!dateString) return 'DD/MM/AAAA';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-MZ');
};

const MessageScheduler = () => {
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        clientId: '',
        channel: 'whatsapp',
        templateId: '',
        message: '',
        isScheduled: false,
        scheduledFor: '',
        scheduledTime: '',
        priority: 'medium'
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [clientsRes, templatesRes] = await Promise.all([
                    api.get('/clients?limit=1000'),
                    api.get('/communication/templates')
                ]);
                if (clientsRes.data.success) setClients(clientsRes.data.data.clients);
                if (templatesRes.data.success) setTemplates(templatesRes.data.data);
            } catch (error) {
                console.error('Error fetching data', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleTemplateChange = (e) => {
        const tplId = e.target.value;
        const tpl = templates.find(t => t._id === tplId);
        const client = clients.find(c => c._id === formData.clientId);

        let finalMsg = tpl ? tpl.content : '';
        if (tpl && client) {
            // Very basic frontend variable replacement for preview
            finalMsg = finalMsg.replace('{nome}', client.name.split(' ')[0]);
        }

        setFormData({ ...formData, templateId: tplId, message: finalMsg });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSending(true);
        try {
            const endpoint = formData.isScheduled ? '/communication/schedule' : '/communication/send';

            const payload = {
                clientId: formData.clientId,
                channel: formData.channel,
                message: formData.message,
                type: 'manual'
            };

            if (formData.isScheduled) {
                payload.scheduledFor = `${formData.scheduledFor}T${formData.scheduledTime}:00`;
                payload.priority = formData.priority;
            }

            const res = await api.post(endpoint, payload);
            if (res.data.success) {
                alert(formData.isScheduled ? 'Mensagem agendada com sucesso!' : 'Mensagem enviada com sucesso!');
                navigate('/communication/history');
            }
        } catch (error) {
            console.error('Error sending message', error);
            alert('Falha ao processar mensagem: ' + (error.response?.data?.error || error.message));
        } finally {
            setSending(false);
        }
    };

    if (loading) return <Layout><div style={{ color: 'var(--accent)', padding: '2rem' }}>Carregando...</div></Layout>;

    return (
        <Layout>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Enviar Mensagem</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Comunique-se com seus clientes via WhatsApp ou SMS.</p>
                </div>
            </div>

            <div className="grid" style={{ gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                <div className="card">
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Selecionar Cliente</label>
                            <select
                                required
                                value={formData.clientId}
                                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', color: 'var(--text-main)' }}
                            >
                                <option value="">Escolha um cliente...</option>
                                {clients.map(c => (
                                    <option key={c._id} value={c._id}>{c.name} ({c.phone})</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Canal</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {['whatsapp', 'sms'].map(ch => (
                                        <button
                                            key={ch}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, channel: ch })}
                                            style={{
                                                flex: 1, padding: '0.75rem', borderRadius: '10px', border: '1px solid',
                                                borderColor: formData.channel === ch ? (ch === 'whatsapp' ? '#22c55e' : '#3b82f6') : 'var(--border-light)',
                                                background: formData.channel === ch ? (ch === 'whatsapp' ? '#22c55e11' : '#3b82f611') : 'transparent',
                                                color: formData.channel === ch ? (ch === 'whatsapp' ? '#22c55e' : '#3b82f6') : 'var(--text-muted)',
                                                fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                                            }}
                                        >
                                            {ch === 'whatsapp' ? <FiMessageCircle /> : <FiSmartphone />} {ch}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Usar Template (Opcional)</label>
                                <select
                                    value={formData.templateId}
                                    onChange={handleTemplateChange}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', color: 'var(--text-main)' }}
                                >
                                    <option value="">Nenhum - Mensagem Livre</option>
                                    {templates.map(t => (
                                        <option key={t._id} value={t._id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Mensagem Customizada</label>
                            <textarea
                                required
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                placeholder="Digite sua mensagem aqui..."
                                rows={5}
                                style={{ width: '100%', padding: '1rem', borderRadius: '10px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', color: 'var(--text-main)', resize: 'none' }}
                            />
                        </div>

                        <div style={{ marginBottom: '2rem', padding: '1.25rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', marginBottom: formData.isScheduled ? '1rem' : '0' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.isScheduled}
                                    onChange={(e) => setFormData({ ...formData, isScheduled: e.target.checked })}
                                />
                                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Agendar para envio posterior</span>
                            </label>

                            {formData.isScheduled && (
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <div className="date-input-wrapper" data-date={formatDateDisplay(formData.scheduledFor)}>
                                            <input
                                                type="date"
                                                className="premium-date-input"
                                                required
                                                value={formData.scheduledFor}
                                                onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-main)', height: '100%' }}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <input
                                            type="time"
                                            required
                                            value={formData.scheduledTime}
                                            onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-light)', color: 'var(--text-main)' }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={sending}
                            className="btn-primary"
                            style={{ width: '100%', padding: '1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}
                        >
                            {sending ? 'Processando...' : (formData.isScheduled ? <><FiClock /> Agendar Envio</> : <><FiSend /> Enviar Agora</>)}
                        </button>
                    </form>
                </div>

                <div>
                    <div className="card" style={{ border: '1px dashed var(--border-light)', background: 'transparent' }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FiActivity size={14} /> Pré-visualização Mobile
                        </h4>
                        <div style={{
                            width: '240px', height: '420px', margin: '0 auto',
                            background: formData.channel === 'whatsapp' ? '#0b141a' : '#222',
                            borderRadius: '32px', border: '8px solid #333', position: 'relative', overflow: 'hidden'
                        }}>
                            <div style={{ background: formData.channel === 'whatsapp' ? '#075e54' : '#444', height: '40px', padding: '0 1rem', display: 'flex', alignItems: 'center', color: 'white', fontSize: '0.7rem' }}>
                                <strong>{formData.channel === 'whatsapp' ? 'WhatsApp' : 'Mensagens'}</strong>
                            </div>
                            <div style={{ padding: '1rem' }}>
                                {formData.message ? (
                                    <div style={{
                                        background: formData.channel === 'whatsapp' ? '#dcf8c6' : '#ededed',
                                        color: '#333', padding: '0.6rem', borderRadius: '8px', fontSize: '0.75rem',
                                        maxWidth: '85%', marginBottom: '0.5rem', position: 'relative',
                                        boxShadow: '0 1px 1px rgba(0,0,0,0.1)'
                                    }}>
                                        {formData.message}
                                        <div style={{ fontSize: '0.6rem', color: '#999', textAlign: 'right', marginTop: '2px' }}>
                                            12:00
                                        </div>
                                    </div>
                                ) : (
                                    <p style={{ color: '#666', fontSize: '0.7rem', textAlign: 'center', marginTop: '40%' }}>Nenhuma mensagem...</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default MessageScheduler;
