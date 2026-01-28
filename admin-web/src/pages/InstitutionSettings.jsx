import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import api from '../api';
import { FiSave, FiSettings, FiBriefcase, FiPercent, FiGlobe, FiMapPin } from 'react-icons/fi';

const InstitutionSettings = () => {
    const { user } = useAuth();
    const [institution, setInstitution] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        nuit: '',
        address: { street: '', city: '' },
        settings: {
            interestRates: { default: 15, management: 2, late: 10 },
            currency: 'MT'
        }
    });

    useEffect(() => {
        const fetchInstitution = async () => {
            try {
                const res = await api.get('/institutions/my');
                if (res.data.success) {
                    setInstitution(res.data.data);
                    setFormData(res.data.data);
                }
            } catch (error) {
                console.error("Error fetching institution", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInstitution();
    }, []);

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

    const handleRateChange = (rateName, value) => {
        setFormData({
            ...formData,
            settings: {
                ...formData.settings,
                interestRates: {
                    ...formData.settings.interestRates,
                    [rateName]: parseFloat(value)
                }
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await api.put('/institutions/my', formData);
            if (res.data.success) {
                alert('Configurações salvas com sucesso!');
            }
        } catch (error) {
            console.error("Error updating settings", error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Layout><div style={{ color: 'var(--accent)' }}>Carregando configurações...</div></Layout>;

    return (
        <Layout>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Configurações da Instituição</h1>
                <p style={{ color: 'var(--text-muted)' }}>Gerencie as regras de negócio e a identidade da sua firma.</p>
            </div>

            <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* Identidade */}
                        <div className="card">
                            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FiBriefcase style={{ color: 'var(--accent)' }} /> Identidade Corporativa
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Nome da Instituição</label>
                                    <input
                                        type="text" name="name" value={formData.name} onChange={handleChange}
                                        style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>NUIT / Registro</label>
                                        <input
                                            type="text" name="nuit" value={formData.nuit} onChange={handleChange}
                                            style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Telefone</label>
                                        <input
                                            type="text" name="phone" value={formData.phone} onChange={handleChange}
                                            style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Email de Contato</label>
                                    <input
                                        type="email" name="email" value={formData.email} onChange={handleChange}
                                        style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Endereço */}
                        <div className="card">
                            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FiMapPin style={{ color: 'var(--accent)' }} /> Localização
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Endereço / Rua</label>
                                    <input
                                        type="text" name="address.street" value={formData.address?.street} onChange={handleChange}
                                        style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Cidade</label>
                                    <input
                                        type="text" name="address.city" value={formData.address?.city} onChange={handleChange}
                                        style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* Taxas e Regras */}
                        <div className="card">
                            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FiPercent style={{ color: 'var(--accent)' }} /> Taxas e Regras de Negócio
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Taxa de Juros Padrão (%)</label>
                                        <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{formData.settings?.interestRates?.default}%</span>
                                    </div>
                                    <input
                                        type="range" min="1" max="50" step="0.5"
                                        value={formData.settings?.interestRates?.default}
                                        onChange={(e) => handleRateChange('default', e.target.value)}
                                        style={{ width: '100%', accentColor: 'var(--accent)' }}
                                    />
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Aplicada mensalmente sobre o montante aprovado.</p>
                                </div>

                                <div style={{ paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <div>
                                            <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>Taxa de Gestão</p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Custo fixo por contrato</p>
                                        </div>
                                        <input
                                            type="number" value={formData.settings?.interestRates?.management}
                                            onChange={(e) => handleRateChange('management', e.target.value)}
                                            style={{ width: '80px', padding: '0.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'white', textAlign: 'center' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <div>
                                            <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>Multa por Atraso (%)</p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sobre o valor da parcela</p>
                                        </div>
                                        <input
                                            type="number" value={formData.settings?.interestRates?.late}
                                            onChange={(e) => handleRateChange('late', e.target.value)}
                                            style={{ width: '80px', padding: '0.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'white', textAlign: 'center' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Botão Salvar */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                type="submit"
                                disabled={saving}
                                className="btn-primary"
                                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', justifyContent: 'center', padding: '1rem' }}
                            >
                                <FiSave /> {saving ? 'Salvando...' : 'Salvar Configurações'}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </Layout>
    );
};

export default InstitutionSettings;
