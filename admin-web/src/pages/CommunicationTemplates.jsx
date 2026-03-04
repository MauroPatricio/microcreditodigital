import React, { useState, useEffect } from 'react';
import api from '../api';
import Layout from '../components/Layout';
import { FiPlus, FiEdit3, FiTrash2, FiMessageSquare, FiInfo, FiCode, FiActivity, FiX } from 'react-icons/fi';

const CommunicationTemplates = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        content: '',
        type: 'general',
        category: 'both',
        variables: []
    });

    const categories = [
        { id: 'reminder_pre_due', label: 'Lembrete Antecipado' },
        { id: 'reminder_due', label: 'Vencimento Hoje' },
        { id: 'overdue_notice', label: 'Notificação de Atraso' },
        { id: 'payment_confirmation', label: 'Confirmação de Pagamento' },
        { id: 'general', label: 'Geral / Outros' }
    ];

    const availableVariables = [
        { code: '{nome}', desc: 'Primeiro nome do cliente' },
        { code: '{valor}', desc: 'Valor da parcela ou crédito' },
        { code: '{data}', desc: 'Data de vencimento' },
        { code: '{numero_contrato}', desc: 'Número do contrato' },
        { code: '{multa}', desc: 'Valor da multa acumulada' }
    ];

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const res = await api.get('/communication/templates');
            if (res.data.success) setTemplates(res.data.data);
        } catch (error) {
            console.error('Error fetching templates', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            // Auto-detect variables in content
            const foundVariables = availableVariables
                .filter(v => formData.content.includes(v.code))
                .map(v => v.code.replace('{', '').replace('}', ''));

            const payload = { ...formData, variables: foundVariables };

            if (editingTemplate) {
                await api.put(`/communication/templates/${editingTemplate._id}`, payload);
            } else {
                await api.post('/communication/templates', payload);
            }
            setShowModal(false);
            fetchTemplates();
        } catch (error) {
            alert('Erro ao salvar template: ' + (error.response?.data?.error || error.message));
        }
    };

    const openModal = (tpl = null) => {
        if (tpl) {
            setEditingTemplate(tpl);
            setFormData({
                name: tpl.name,
                content: tpl.content,
                type: tpl.type,
                category: tpl.category || 'both'
            });
        } else {
            setEditingTemplate(null);
            setFormData({ name: '', content: '', type: 'general', category: 'both' });
        }
        setShowModal(true);
    };

    const insertVariable = (v) => {
        setFormData({ ...formData, content: formData.content + v });
    };

    if (loading) return <Layout><div style={{ padding: '2rem', color: 'var(--accent)' }}>Carregando templates...</div></Layout>;

    return (
        <Layout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Modelos de Mensagens</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Gerencie templates para automação e mensagens rápidas.</p>
                </div>
                <button className="btn-primary" onClick={() => openModal()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FiPlus /> Novo Template
                </button>
            </div>

            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {templates.map(tpl => (
                    <div key={tpl._id} className="card glass" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', border: '1px solid var(--border-light)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>{tpl.name}</h3>
                                <div style={{
                                    fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', padding: '2px 8px', borderRadius: '4px',
                                    background: 'rgba(59, 130, 246, 0.1)', color: 'var(--blue-highlight)', display: 'inline-block'
                                }}>
                                    {categories.find(c => c.id === tpl.type)?.label || 'Outros'}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => openModal(tpl)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><FiEdit3 size={16} /></button>
                                <button style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><FiTrash2 size={16} /></button>
                            </div>
                        </div>
                        <div style={{
                            flex: 1, padding: '1rem', background: 'var(--bg-main)', borderRadius: '10px',
                            fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '1.25rem', border: '1px solid var(--border-light)',
                            whiteSpace: 'pre-wrap', minHeight: '100px'
                        }}>
                            {tpl.content}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {tpl.variables?.map(v => (
                                <span key={v} style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--bg-card)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
                                    {`{${v}}`}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Template Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div className="card" style={{ width: '100%', maxWidth: '600px', padding: '2rem', background: 'var(--bg-card)', borderRadius: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 900 }}>{editingTemplate ? 'Editar Template' : 'Novo Template'}</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><FiX size={24} /></button>
                        </div>

                        <form onSubmit={handleSave}>
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>Nome do Modelo</label>
                                <input
                                    className="input-main"
                                    style={{ width: '100%', padding: '0.75rem' }}
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="Ex: Lembrete de Cobrança 1"
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>Tipo de Notificação</label>
                                    <select
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', color: 'var(--text-main)' }}
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>Canal Preferencial</label>
                                    <select
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', color: 'var(--text-main)' }}
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="both">Ambos (Auto)</option>
                                        <option value="whatsapp">WhatsApp apenas</option>
                                        <option value="sms">SMS apenas</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Conteúdo da Mensagem</label>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formData.content.length} caracteres</span>
                                </div>
                                <textarea
                                    style={{ width: '100%', padding: '1rem', minHeight: '150px', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', color: 'var(--text-main)', resize: 'none' }}
                                    value={formData.content}
                                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                                    required
                                    placeholder="Escreva a mensagem aqui..."
                                />
                            </div>

                            <div style={{ marginBottom: '2rem' }}>
                                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <FiCode /> Variáveis Disponíveis (Clique para inserir)
                                </p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {availableVariables.map(v => (
                                        <button
                                            key={v.code}
                                            type="button"
                                            onClick={() => insertVariable(v.code)}
                                            title={v.desc}
                                            style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--bg-main)', color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' }}
                                        >
                                            {v.code}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button className="btn-primary" style={{ width: '100%', padding: '1rem' }}>
                                {editingTemplate ? 'Atualizar Modelo' : 'Criar Modelo'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default CommunicationTemplates;
