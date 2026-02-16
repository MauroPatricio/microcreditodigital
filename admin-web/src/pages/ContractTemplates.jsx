import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { FiFileText, FiPlus, FiSave, FiCode, FiEye, FiX, FiCheckCircle, FiInfo, FiCopy, FiTrendingUp } from 'react-icons/fi';
import api from '../api';
import Modal from '../components/Modal';

const ContractTemplateManager = () => {
    const [templates, setTemplates] = useState([]);
    const [editing, setEditing] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'error' });

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const response = await api.get('/contract-templates');
            setTemplates(response.data.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editing._id) {
                await api.put(`/contract-templates/${editing._id}`, editing);
            } else {
                await api.post('/contract-templates', editing);
            }
            setModal({
                isOpen: true,
                title: 'Sucesso!',
                message: 'O template de contrato foi salvo e publicado com sucesso.',
                type: 'success'
            });
            setEditing(null);
            fetchTemplates();
        } catch (error) {
            setModal({
                isOpen: true,
                title: 'Erro ao Salvar',
                message: 'Não foi possível salvar o template. Verifique os dados e tente novamente.',
                type: 'error'
            });
        }
    };

    const placeholders = [
        { tag: '{{client_name}}', desc: 'Nome do Cliente' },
        { tag: '{{client_id}}', desc: 'Número do BI' },
        { tag: '{{amount}}', desc: 'Valor Aprovado' },
        { tag: '{{term}}', desc: 'Prazo em Meses' },
        { tag: '{{monthly_payment}}', desc: 'Prestação Mensal' },
        { tag: '{{institution_name}}', desc: 'Sua Instituição' },
        { tag: '{{institution_logo}}', desc: 'Logo da Instituição (URL)' }
    ];

    const copyToClipboard = (tag) => {
        navigator.clipboard.writeText(tag);
        // Opcional: Adicionar um toast de feedback
    };

    return (
        <Layout>
            <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
                <header style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '3.5rem',
                    animation: 'fadeInDown 0.5s ease-out'
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                            <div style={{
                                width: '56px',
                                height: '56px',
                                background: 'rgba(59, 130, 246, 0.15)',
                                borderRadius: '16px',
                                color: 'var(--accent)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <FiFileText size={28} />
                            </div>
                            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-1.5px', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Gestão de Contratos
                            </h1>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Formalize seus empréstimos com templates inteligentes e profissionais.</p>
                    </div>
                    {!editing && (
                        <button
                            onClick={() => setEditing({ name: '', title: '', content: '' })}
                            className="btn-primary"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '1.1rem 2.2rem',
                                borderRadius: '18px',
                                fontSize: '1.05rem',
                                fontWeight: 700,
                                boxShadow: '0 15px 30px -5px rgba(59, 130, 246, 0.4)'
                            }}
                        >
                            <FiPlus size={22} /> Novo Template
                        </button>
                    )}
                </header>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: editing ? '1fr 600px' : '1fr',
                    gap: '3rem',
                    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    alignItems: 'start'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Lista de Templates */}
                        {loading ? (
                            <div style={{ gridColumn: '1/-1', display: 'flex', justifyContent: 'center', padding: '5rem' }}>
                                <div className="spinner-large" style={{ width: '50px', height: '50px', border: '4px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                            </div>
                        ) : templates.length === 0 ? (
                            <div className="glass" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '6rem 2rem', borderRadius: '32px' }}>
                                <div style={{ width: '100px', height: '100px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                                    <FiFileText size={48} style={{ color: 'var(--accent)' }} />
                                </div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>Nenhum contrato configurado</h2>
                                <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>Você ainda não criou nenhum modelo de contrato. Comece clicando em "Novo Template".</p>
                            </div>
                        ) : templates.map(t => (
                            <div
                                key={t._id}
                                className={`glass-card ${editing?._id === t._id ? 'active-card' : ''}`}
                                style={{
                                    padding: '2rem',
                                    borderRadius: '28px',
                                    background: editing?._id === t._id ? 'rgba(59, 130, 246, 0.12)' : 'rgba(15, 23, 42, 0.4)',
                                    border: editing?._id === t._id ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.06)',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                                onClick={() => setEditing(t)}
                            >
                                {editing?._id === t._id && (
                                    <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: 'radial-gradient(circle at top right, rgba(59, 130, 246, 0.2), transparent)', zIndex: 0 }} />
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', position: 'relative', zIndex: 1 }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        background: editing?._id === t._id ? 'var(--accent)' : 'rgba(255, 255, 255, 0.04)',
                                        borderRadius: '14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: editing?._id === t._id ? 'white' : 'var(--text-muted)',
                                        transition: 'all 0.3s'
                                    }}>
                                        <FiFileText size={22} />
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                                        {t.isActive && <span style={{ padding: '0.3rem 0.75rem', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.5px' }}>ATIVO</span>}
                                        <span style={{ padding: '0.3rem 0.75rem', background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-muted)', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 900 }}>v{t.version}.0</span>
                                    </div>
                                </div>
                                <h3 style={{ fontWeight: 800, fontSize: '1.3rem', marginBottom: '0.5rem', color: editing?._id === t._id ? 'white' : 'inherit', letterSpacing: '-0.3px', position: 'relative', zIndex: 1 }}>{t.title}</h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '2rem', fontFamily: 'monospace', opacity: 0.7, position: 'relative', zIndex: 1 }}>SLUG: {t.name}</p>

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{new Date(t.updatedAt).toLocaleDateString()}</span>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <button className="btn-icon-premium" onClick={(e) => { e.stopPropagation(); setPreview(t); }} style={{ width: '40px', height: '40px' }}><FiEye size={18} /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Editor / Novo Template */}
                    {editing && (
                        <div
                            className="glass"
                            style={{
                                padding: '3rem 2.5rem',
                                borderRadius: '32px',
                                position: editing ? 'sticky' : 'relative',
                                top: '2rem',
                                border: '1px solid rgba(255,255,255,0.1)',
                                boxShadow: '0 40px 80px -20px rgba(0, 0, 0, 0.6)',
                                animation: 'fadeInRight 0.4s cubic-bezier(0.23, 1, 0.32, 1)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.5px' }}>{editing._id ? 'Ajustar Modelo' : 'Novo Modelo Legal'}</h2>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.25rem' }}>Defina as variáveis e o conteúdo jurídico.</p>
                                </div>
                                <button onClick={() => setEditing(null)} style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'rgba(255,255,255,0.4)', width: '40px', height: '40px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                    <FiX size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div className="form-group">
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>ID Interno (Slug) *</label>
                                        <input
                                            type="text"
                                            value={editing.name}
                                            onChange={e => setEditing({ ...editing, name: e.target.value })}
                                            style={{ width: '100%', padding: '1.1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: 'white', fontSize: '1rem', outline: 'none' }}
                                            placeholder="ex: contrato_consumo"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Título Amigável *</label>
                                        <input
                                            type="text"
                                            value={editing.title}
                                            onChange={e => setEditing({ ...editing, title: e.target.value })}
                                            style={{ width: '100%', padding: '1.1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: 'white', fontSize: '1rem', outline: 'none' }}
                                            placeholder="ex: Contrato de Empréstimo Pessoal"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                        <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Conteúdo Jurídico (Markdown)</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(16, 185, 129, 0.1)', padding: '0.25rem 0.6rem', borderRadius: '8px' }}>
                                            <FiCheckCircle size={14} /> EDITOR SEGURO
                                        </div>
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <textarea
                                            value={editing.content}
                                            onChange={e => setEditing({ ...editing, content: e.target.value })}
                                            rows="12"
                                            style={{
                                                width: '100%',
                                                padding: '1.5rem',
                                                background: 'rgba(255,255,255,0.01)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '20px',
                                                color: 'white',
                                                fontFamily: '"Fira Code", monospace',
                                                fontSize: '0.95rem',
                                                lineHeight: '1.7',
                                                outline: 'none',
                                                resize: 'none'
                                            }}
                                            placeholder="Escreva os termos do contrato..."
                                            required
                                        ></textarea>
                                        <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', opacity: 0.3, color: 'var(--accent)' }}>
                                            <FiCode size={24} />
                                        </div>
                                    </div>
                                </div>

                                <div style={{
                                    background: 'rgba(59, 130, 246, 0.04)',
                                    padding: '1.75rem',
                                    borderRadius: '24px',
                                    border: '1px solid rgba(59, 130, 246, 0.1)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                                        <FiCode color="var(--accent)" size={20} />
                                        <p style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-main)' }}>Variáveis Dinâmicas</p>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                                        {placeholders.map(p => (
                                            <button
                                                key={p.tag}
                                                type="button"
                                                onClick={() => copyToClipboard(p.tag)}
                                                style={{
                                                    fontSize: '0.75rem',
                                                    background: 'rgba(255,255,255,0.03)',
                                                    padding: '0.6rem 0.9rem',
                                                    border: '1px solid rgba(255,255,255,0.08)',
                                                    borderRadius: '12px',
                                                    color: 'white',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                                                title={`Copiar: ${p.desc}`}
                                            >
                                                <FiCopy size={12} color="var(--accent)" />
                                                <code style={{ fontWeight: 700 }}>{p.tag}</code>
                                            </button>
                                        ))}
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <FiInfo size={14} /> Clique em uma tag para copiar instantaneamente.
                                    </p>
                                </div>

                                <div style={{ display: 'flex', gap: '1.25rem', marginTop: '1rem' }}>
                                    <button
                                        type="submit"
                                        className="btn-primary"
                                        style={{
                                            flex: 1.5,
                                            height: '64px',
                                            borderRadius: '20px',
                                            fontSize: '1.1rem',
                                            fontWeight: 800,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.75rem',
                                            boxShadow: '0 20px 40px -10px rgba(59, 130, 246, 0.4)'
                                        }}
                                    >
                                        <FiSave size={22} /> Salvar & Publicar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditing(null)}
                                        style={{
                                            flex: 0.8,
                                            height: '64px',
                                            borderRadius: '20px',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            color: 'white',
                                            fontWeight: 700,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Descartar
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

            {preview && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 2000,
                    background: 'rgba(2, 6, 23, 0.9)',
                    backdropFilter: 'blur(20px)',
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'fadeIn 0.3s ease-out'
                }}>
                    {/* Header do Preview */}
                    <div style={{
                        padding: '1rem 2.5rem',
                        background: 'rgba(15, 23, 42, 0.8)',
                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Visualização do Documento</h2>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{preview.title} (v{preview.version}.0)</p>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={async () => {
                                    const { jsPDF } = await import('jspdf');
                                    const html2canvas = (await import('html2canvas')).default;
                                    const doc = document.getElementById('contract-a4-page');
                                    const canvas = await html2canvas(doc, { scale: 2, useCORS: true });
                                    const imgData = canvas.toDataURL('image/png');
                                    const pdf = new jsPDF('p', 'mm', 'a4');
                                    const imgProps = pdf.getImageProperties(imgData);
                                    const pdfWidth = pdf.internal.pageSize.getWidth();
                                    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                                    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                                    pdf.save(`${preview.name}_preview.pdf`);
                                }}
                                className="btn-primary"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '12px',
                                    fontSize: '0.9rem'
                                }}
                            >
                                <FiSave /> Baixar PDF
                            </button>
                            <button
                                onClick={() => setPreview(null)}
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'white',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    cursor: 'pointer'
                                }}
                            >
                                Fechar
                            </button>
                        </div>
                    </div>

                    {/* Área da Página A4 */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '3rem', display: 'flex', justifyContent: 'center' }}>
                        <div
                            id="contract-a4-page"
                            style={{
                                width: '210mm',
                                minHeight: '297mm',
                                background: 'white',
                                padding: '25mm 20mm',
                                color: '#1a1a1a',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                                fontSize: '12pt',
                                lineHeight: '1.6',
                                borderRadius: '4px'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ width: '60px', height: '60px', background: 'var(--accent)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'white' }}>
                                        <FiTrendingUp size={32} />
                                    </div>
                                    <h1 style={{ fontSize: '18pt', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>{preview.title}</h1>
                                </div>
                            </div>

                            <div style={{ marginBottom: '2rem', borderBottom: '2px solid #eee', paddingBottom: '1rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '10pt', color: '#666' }}>
                                    <div>Ref: {preview.name.toUpperCase()}</div>
                                    <div style={{ textAlign: 'right' }}>Data de Emissão: {new Date().toLocaleDateString()}</div>
                                </div>
                            </div>

                            <div className="contract-body" style={{ whiteSpace: 'pre-line', fontSize: '11pt', textAlign: 'justify' }}>
                                {preview.content
                                    .replace(/{{client_name}}/g, 'MAURO PATRÍCIO DOS SANTOS')
                                    .replace(/{{client_id}}/g, '001234567LA045')
                                    .replace(/{{amount}}/g, '250.000,00 Kz')
                                    .replace(/{{term}}/g, '12 meses')
                                    .replace(/{{monthly_payment}}/g, '25.500,00 Kz')
                                    .replace(/{{institution_name}}/g, 'MICROCRÉDITO DIGITAL HUB')
                                }
                            </div>

                            <div style={{ marginTop: '5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ borderTop: '1px solid #000', paddingTop: '0.5rem' }}>
                                        <p style={{ fontWeight: 700 }}>A INSTITUIÇÃO</p>
                                        <p style={{ fontSize: '9pt' }}>Assinatura e Carimbo</p>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ borderTop: '1px solid #000', paddingTop: '0.5rem' }}>
                                        <p style={{ fontWeight: 700 }}>O CLIENTE</p>
                                        <p style={{ fontSize: '9pt' }}>Assinatura Digital / Manuscrita</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes fadeInDown {
                    from { opacity: 0; transform: translateY(-30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeInRight {
                    from { opacity: 0; transform: translateX(40px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes spin { to { transform: rotate(360deg); } }
                .glass-card:hover {
                    transform: translateY(-5px);
                    background: rgba(59, 130, 246, 0.08) !important;
                    border-color: rgba(59, 130, 246, 0.3) !important;
                }
                .active-card {
                    box-shadow: 0 0 0 3px var(--accent), 0 20px 40px -15px rgba(59, 130, 246, 0.4) !important;
                }
                .btn-icon-premium {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: rgba(255, 255, 255, 0.6);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                .btn-icon-premium:hover {
                    background: var(--accent);
                    color: white;
                    transform: scale(1.1);
                }
                textarea::-webkit-scrollbar { width: 6px; }
                textarea::-webkit-scrollbar-track { background: transparent; }
                textarea::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.2); border-radius: 10px; }
                textarea::-webkit-scrollbar-thumb:hover { background: var(--accent); }
            `}</style>
        </Layout>
    );
};

export default ContractTemplateManager;
