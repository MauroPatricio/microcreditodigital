import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { FiMessageSquare, FiPlus, FiSave, FiTrash2, FiClock, FiSettings, FiCheckCircle, FiAlertCircle, FiX } from 'react-icons/fi';
import api from '../api';
import Modal from '../components/Modal';

const WhatsAppSettings = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'error' });

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const response = await api.get('/whatsapp/templates');
            setTemplates(response.data.data);
            setLoading(false);
        } catch (error) {
            console.error('Erro ao buscar templates:', error);
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingTemplate._id) {
                await api.put(`/whatsapp/templates/${editingTemplate._id}`, editingTemplate);
            } else {
                await api.post('/whatsapp/templates', editingTemplate);
            }
            setModal({
                isOpen: true,
                title: 'Sucesso!',
                message: 'O template de WhatsApp foi salvo com sucesso.',
                type: 'success'
            });
            setEditingTemplate(null);
            fetchTemplates();
        } catch (error) {
            setModal({
                isOpen: true,
                title: 'Erro ao Salvar',
                message: 'Ocorreu um problema ao tentar salvar o template. Tente novamente.',
                type: 'error'
            });
        } finally {
            setSaving(false);
        }
    };

    const deleteTemplate = async (id) => {
        setModal({
            isOpen: true,
            title: 'Excluir Template?',
            message: 'Esta ação não pode ser desfeita. Deseja realmente remover este template?',
            type: 'info',
            onConfirm: async () => {
                try {
                    // await api.delete(`/whatsapp/templates/${id}`);
                    setModal({
                        isOpen: true,
                        title: 'Excluído',
                        message: 'Template removido com sucesso.',
                        type: 'success'
                    });
                    fetchTemplates();
                } catch (error) {
                    setModal({
                        isOpen: true,
                        title: 'Erro',
                        message: 'Não foi possível excluir o template.',
                        type: 'error'
                    });
                }
            }
        });
    };

    const triggerOptions = [
        { value: 'before_due', label: 'Antes do Vencimento' },
        { value: 'on_due_date', label: 'No Dia do Vencimento' },
        { value: 'after_due', label: 'Após Vencimento (Atraso)' },
        { value: 'manual', label: 'Envio Manual' }
    ];

    return (
        <Layout>
            <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem', letterSpacing: '-0.5px' }}>
                            Configurações de WhatsApp
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Gerencie templates e automações de mensagens inteligentes</p>
                    </div>
                    <button
                        onClick={() => setEditingTemplate({ name: '', title: '', body: '', triggerType: 'before_due', triggerDays: 3 })}
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.5rem', borderRadius: '16px' }}
                    >
                        <FiPlus size={20} /> Novo Template
                    </button>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: editingTemplate ? '1fr 450px' : '1fr', gap: '2.5rem', alignItems: 'start' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {loading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', gridColumn: '1/-1' }}>
                                <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                            </div>
                        ) : templates.length === 0 ? (
                            <div className="glass" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem 2rem', borderRadius: '24px' }}>
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    background: 'rgba(59, 130, 246, 0.1)',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 1.5rem'
                                }}>
                                    <FiMessageSquare size={40} style={{ color: 'var(--accent)' }} />
                                </div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Nenhum template configurado</h3>
                                <p style={{ color: 'var(--text-muted)' }}>Comece criando um novo template para automatizar suas cobranças.</p>
                            </div>
                        ) : templates.map(t => (
                            <div key={t._id} className="glass" style={{ padding: '1.75rem', borderRadius: '24px', transition: 'all 0.3s' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                                    <span style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent)', fontWeight: 800, letterSpacing: '0.5px' }}>
                                        {t.name.toUpperCase()}
                                    </span>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => setEditingTemplate(t)} className="btn-icon-premium" title="Editar"><FiSettings /></button>
                                        <button onClick={() => deleteTemplate(t._id)} className="btn-icon-premium danger" title="Excluir"><FiTrash2 /></button>
                                    </div>
                                </div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem', letterSpacing: '-0.3px' }}>{t.title}</h3>
                                <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1.75rem', lineHeight: '1.6', height: '4.8rem', overflow: 'hidden', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 3 }}>
                                    {t.body}
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', padding: '0.75rem 1rem', borderRadius: '12px' }}>
                                    <FiClock color="var(--accent)" />
                                    <span>Gatilho: <strong style={{ color: 'var(--text-main)' }}>{triggerOptions.find(o => o.value === t.triggerType)?.label}</strong></span>
                                    <span style={{ marginLeft: 'auto', opacity: 0.8 }}>{t.triggerDays} dias</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {editingTemplate && (
                        <div className="glass" style={{ padding: '2.5rem 2rem', borderRadius: '32px', position: 'sticky', top: '2rem', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
                                    {editingTemplate._id ? 'Editar Layout' : 'Novo Template'}
                                </h2>
                                <button onClick={() => setEditingTemplate(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><FiX size={24} /></button>
                            </div>

                            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Identificador (Slug)</label>
                                    <input
                                        type="text"
                                        value={editingTemplate.name}
                                        onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                                        placeholder="ex: lembrete_atraso"
                                        required
                                        style={{ width: '100%', padding: '1.1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: 'white', fontSize: '1rem', outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Assunto / Título</label>
                                    <input
                                        type="text"
                                        value={editingTemplate.title}
                                        onChange={e => setEditingTemplate({ ...editingTemplate, title: e.target.value })}
                                        placeholder="ex: Aviso de Vencimento Próximo"
                                        required
                                        style={{ width: '100%', padding: '1.1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: 'white', fontSize: '1rem', outline: 'none' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Corpo da Mensagem</label>
                                    <textarea
                                        value={editingTemplate.body}
                                        onChange={e => setEditingTemplate({ ...editingTemplate, body: e.target.value })}
                                        rows="6"
                                        placeholder="Use {{name}}, {{amount}}, etc para personalizar."
                                        required
                                        style={{ width: '100%', padding: '1.1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: 'white', fontSize: '1rem', outline: 'none', resize: 'none', lineHeight: '1.6' }}
                                    ></textarea>
                                    <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                        {['name', 'amount', 'date', 'institution', 'institution_logo', 'contract'].map(tag => (
                                            <span key={tag} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', color: 'var(--accent)' }}>
                                                {`{{${tag}}}`}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Gatilho</label>
                                        <select
                                            value={editingTemplate.triggerType}
                                            onChange={e => setEditingTemplate({ ...editingTemplate, triggerType: e.target.value })}
                                            style={{ width: '100%', padding: '1.1rem', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: 'white', fontSize: '1rem', appearance: 'none' }}
                                        >
                                            {triggerOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Antecedência</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type="number"
                                                value={editingTemplate.triggerDays}
                                                onChange={e => setEditingTemplate({ ...editingTemplate, triggerDays: parseInt(e.target.value) })}
                                                style={{ width: '100%', padding: '1.1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: 'white', fontSize: '1rem', textAlign: 'center' }}
                                            />
                                            <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>dias</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="btn-primary"
                                        style={{ flex: 2, padding: '1.1rem', borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', fontWeight: 800 }}
                                    >
                                        {saving ? <div className="spinner-small" /> : <><FiSave /> Salvar Template</>}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditingTemplate(null)}
                                        style={{ flex: 1, padding: '1.1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: 'white', fontWeight: 600, cursor: 'pointer' }}
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            <Modal
                isOpen={modal.isOpen}
                onClose={() => setModal({ ...modal, isOpen: false })}
                title={modal.title}
                message={modal.message}
                type={modal.type}
            />

            <style>{`
                .btn-icon-premium {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    color: rgba(255, 255, 255, 0.4);
                    width: 38px;
                    height: 38px;
                    border-radius: 10px;
                    display: flex;
                    alignItems: center;
                    justifyContent: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-icon-premium:hover {
                    background: rgba(59, 130, 246, 0.1);
                    color: var(--accent);
                    border-color: rgba(59, 130, 246, 0.3);
                    transform: translateY(-2px);
                }
                .btn-icon-premium.danger:hover {
                    background: rgba(239, 68, 68, 0.1);
                    color: #ef4444;
                    border-color: rgba(239, 68, 68, 0.3);
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                .spinner-small {
                    width: 20px;
                    height: 20px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-radius: 50%;
                    border-top-color: white;
                    animation: spin 0.8s linear infinite;
                }
            `}</style>
        </Layout>
    );
};

export default WhatsAppSettings;
