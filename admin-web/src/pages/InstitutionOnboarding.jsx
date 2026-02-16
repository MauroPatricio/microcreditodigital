import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api';
import { FiBriefcase, FiMail, FiPhone, FiFileText, FiMapPin, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';

const InstitutionOnboarding = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        nuit: '',
        address: {
            street: '',
            city: '',
            province: '',
            country: 'Moçambique'
        }
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData({
                ...formData,
                [parent]: { ...formData[parent], [child]: value }
            });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await api.post('/institutions', formData);
            if (res.data.success) {
                setSuccess(true);
                // Automaticaly switch to the new institution
                await api.post(`/institutions/switch/${res.data.data._id}`);

                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 2000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Erro ao criar instituição');
            setLoading(false);
        }
    };

    if (success) {
        return (
            <Layout>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '60vh',
                    textAlign: 'center'
                }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        background: 'var(--success)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2.5rem',
                        color: 'white',
                        marginBottom: '1.5rem',
                        boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)'
                    }}>
                        <FiCheckCircle />
                    </div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>Instituição Criada!</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                        A instituição <strong>{formData.name}</strong> foi configurada com sucesso.
                        <br />
                        Redirecionando para o novo ambiente...
                    </p>
                </div>
            </Layout>
        );
    }

    const inputStyle = {
        width: '100%',
        padding: '0.875rem 1rem 0.875rem 3rem',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        color: 'white',
        fontSize: '0.95rem',
        outline: 'none',
        transition: 'all 0.2s'
    };

    const iconStyle = {
        position: 'absolute',
        left: '1rem',
        top: '50%',
        transform: 'translateY(-50%)',
        color: 'var(--text-muted)'
    };

    return (
        <Layout>
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 0' }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '2rem',
                        cursor: 'pointer',
                        fontWeight: 600
                    }}
                >
                    <FiArrowLeft /> Voltar
                </button>

                <div className="card glass" style={{ padding: '3rem' }}>
                    <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
                        <div style={{
                            width: '60px',
                            height: '60px',
                            background: 'var(--accent)',
                            borderRadius: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.8rem',
                            color: 'white',
                            margin: '0 auto 1.5rem'
                        }}>
                            <FiBriefcase />
                        </div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>Nova Instituição de Microcrédito</h1>
                        <p style={{ color: 'var(--text-muted)' }}>Preencha os dados abaixo para configurar sua nova entidade no sistema.</p>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div style={{ gridColumn: '1 / -1', position: 'relative' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Nome da Instituição</label>
                            <div style={{ position: 'relative' }}>
                                <FiBriefcase style={iconStyle} />
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Ex: Microcrédito Digital Sucursal A"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        <div style={{ position: 'relative' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Email Institucional</label>
                            <div style={{ position: 'relative' }}>
                                <FiMail style={iconStyle} />
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="contato@microcredito.co.mz"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        <div style={{ position: 'relative' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Telefone</label>
                            <div style={{ position: 'relative' }}>
                                <FiPhone style={iconStyle} />
                                <input
                                    type="tel"
                                    name="phone"
                                    placeholder="+258 8X XXX XXXX"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        <div style={{ position: 'relative' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>NUIT</label>
                            <div style={{ position: 'relative' }}>
                                <FiFileText style={iconStyle} />
                                <input
                                    type="text"
                                    name="nuit"
                                    placeholder="Número de Identificação Tributária"
                                    value={formData.nuit}
                                    onChange={handleChange}
                                    required
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        <div style={{ position: 'relative' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Cidade</label>
                            <div style={{ position: 'relative' }}>
                                <FiMapPin style={iconStyle} />
                                <input
                                    type="text"
                                    name="address.city"
                                    placeholder="Ex: Maputo"
                                    value={formData.address.city}
                                    onChange={handleChange}
                                    required
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        <div style={{ gridColumn: '1 / -1', position: 'relative' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Endereço Completo</label>
                            <div style={{ position: 'relative' }}>
                                <FiMapPin style={iconStyle} />
                                <input
                                    type="text"
                                    name="address.street"
                                    placeholder="Rua, Bairro, Nº"
                                    value={formData.address.street}
                                    onChange={handleChange}
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        {error && (
                            <div style={{
                                gridColumn: '1 / -1',
                                padding: '1rem',
                                background: 'rgba(239, 68, 68, 0.1)',
                                color: 'var(--danger)',
                                borderRadius: '10px',
                                fontSize: '0.9rem',
                                fontWeight: 500,
                                border: '1px solid rgba(239, 68, 68, 0.2)'
                            }}>
                                ⚠️ {error}
                            </div>
                        )}

                        <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary"
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.75rem'
                                }}
                            >
                                {loading ? 'Criando Estrutura...' : 'Criar Instituição e Abrir Painel'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <style>{`
                input:focus {
                    border-color: var(--accent) !important;
                    background: rgba(255,255,255,0.06) !important;
                    box-shadow: 0 0 0 4px rgba(0, 255, 0, 0.05);
                }
            `}</style>
        </Layout>
    );
};

export default InstitutionOnboarding;
