import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import api from '../api';
import { FiSave, FiSettings, FiBriefcase, FiPercent, FiGlobe, FiMapPin, FiUpload, FiImage, FiUser, FiPhone, FiMail } from 'react-icons/fi';
import Modal from '../components/Modal';
import WhatsAppConnect from '../components/WhatsAppConnect';

const InstitutionSettings = () => {
    const { user, updateUser } = useAuth();
    const [institution, setInstitution] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [logoPreview, setLogoPreview] = useState(null);
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'error' });
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
    const [ownerData, setOwnerData] = useState({ name: '', email: '', phone: '' });

    useEffect(() => {
        const fetchInstitution = async () => {
            try {
                const res = await api.get('/institutions/my');
                if (res.data.success) {
                    setInstitution(res.data.data);
                    setFormData(res.data.data);
                }
                // Fetch owner/representative profile
                const userRes = await api.get('/auth/me');
                if (userRes.data.success) {
                    const u = userRes.data.data.user;
                    setOwnerData({ name: u.name || '', email: u.email || '', phone: u.phone || '' });
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

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Preview local
        const reader = new FileReader();
        reader.onloadend = () => {
            setLogoPreview(reader.result);
        };
        reader.readAsDataURL(file);

        const formDataFile = new FormData();
        formDataFile.append('logo', file);

        setUploadingLogo(true);
        try {
            const res = await api.post('/institutions/my/logo', formDataFile, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.success) {
                // Atualizar o estado global ou o formData se necessário
                setFormData(prev => ({
                    ...prev,
                    settings: {
                        ...prev.settings,
                        appearance: {
                            ...prev.settings?.appearance,
                            logoUrl: res.data.data.logoUrl
                        }
                    }
                }));
                // Atualizar dados globais do usuário para atualizar Sidebar, etc.
                updateUser();
            }
        } catch (error) {
            console.error("Error uploading logo", error);
            setModal({
                isOpen: true,
                title: 'Erro de Upload',
                message: 'Não foi possível enviar o logo. Verifique se o arquivo é uma imagem válida e tem menos de 2MB.',
                type: 'error'
            });
        } finally {
            setUploadingLogo(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await api.put('/institutions/my', formData);
            if (res.data.success) {
                setModal({
                    isOpen: true,
                    title: 'Sucesso!',
                    message: 'As configurações da instituição foram atualizadas com sucesso.',
                    type: 'success'
                });
                updateUser(); // Refrescar dados do topo/sidebar
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
                            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: 700 }}>
                                <FiBriefcase style={{ color: 'var(--accent)' }} /> Identidade Corporativa
                            </h3>

                            {/* Logo Upload — Large Centered Square */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.75rem' }}>
                                <input type="file" id="logo-settings-upload" hidden accept="image/*" onChange={handleLogoUpload} disabled={uploadingLogo} />
                                <label
                                    htmlFor="logo-settings-upload"
                                    style={{
                                        width: '140px',
                                        height: '140px',
                                        borderRadius: '16px',
                                        background: 'var(--bg-main)',
                                        border: '2px dashed rgba(255,255,255,0.12)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: uploadingLogo ? 'not-allowed' : 'pointer',
                                        overflow: 'hidden',
                                        position: 'relative',
                                        transition: 'border-color 0.2s',
                                        color: 'var(--text-muted)'
                                    }}
                                    onMouseEnter={(e) => { if (!uploadingLogo) e.currentTarget.style.borderColor = 'var(--accent)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                                >
                                    {(logoPreview || formData.settings?.appearance?.logoUrl) ? (
                                        <img
                                            src={logoPreview || `${api.defaults.baseURL.replace('/api', '')}${formData.settings?.appearance?.logoUrl}`}
                                            alt="Logo"
                                            style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '0.75rem' }}
                                        />
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem' }}>
                                            <FiImage size={30} />
                                            <span style={{ fontSize: '0.75rem', textAlign: 'center', fontWeight: 500 }}>Clique para
uplodar logo</span>
                                        </div>
                                    )}
                                    {uploadingLogo && (
                                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <div style={{ width: '20px', height: '20px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                                        </div>
                                    )}
                                </label>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem', textAlign: 'center' }}>PNG ou JPEG, máx 2MB. Recomendado 400×400px.</p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Nome da Instituição</label>
                                    <input
                                        type="text" name="name" value={formData.name} onChange={handleChange}
                                        style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-main)' }}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>NUIT / Registro</label>
                                        <input
                                            type="text" name="nuit" value={formData.nuit} onChange={handleChange}
                                            style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-main)' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Telefone</label>
                                        <input
                                            type="text" name="phone" value={formData.phone} onChange={handleChange}
                                            style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-main)' }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Email de Contato</label>
                                    <input
                                        type="email" name="email" value={formData.email} onChange={handleChange}
                                        style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-main)' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Personalização Visual */}
                        <div className="card">
                            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FiImage style={{ color: 'var(--accent)' }} /> Identidade Visual
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Cor Primária do Sistema</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <input
                                            type="color"
                                            name="settings.appearance.primaryColor"
                                            value={formData.settings?.appearance?.primaryColor || '#00FF00'}
                                            onChange={(e) => {
                                                setFormData({
                                                    ...formData,
                                                    settings: {
                                                        ...formData.settings,
                                                        appearance: {
                                                            ...formData.settings?.appearance,
                                                            primaryColor: e.target.value
                                                        }
                                                    }
                                                });
                                            }}
                                            style={{
                                                width: '50px',
                                                height: '50px',
                                                padding: '0',
                                                border: 'none',
                                                borderRadius: '8px',
                                                background: 'none',
                                                cursor: 'pointer'
                                            }}
                                        />
                                        <div>
                                            <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{formData.settings?.appearance?.primaryColor || '#0A2540'}</p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Esta cor será usada em botões, ícones e destaques.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Dados do Representante */}
                        <div className="card">
                            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: 700 }}>
                                <FiUser style={{ color: 'var(--accent)' }} /> Dados do Representante
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label>Nome Completo</label>
                                    <div style={{ position: 'relative' }}>
                                        <FiUser style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.9rem' }} />
                                        <input type="text" value={ownerData.name} onChange={(e) => setOwnerData({ ...ownerData, name: e.target.value })} style={{ paddingLeft: '2.5rem' }} placeholder="Nome do representante" />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label>Email</label>
                                        <div style={{ position: 'relative' }}>
                                            <FiMail style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.9rem' }} />
                                            <input type="email" value={ownerData.email} onChange={(e) => setOwnerData({ ...ownerData, email: e.target.value })} style={{ paddingLeft: '2.5rem' }} placeholder="email@empresa.com" />
                                        </div>
                                    </div>
                                    <div>
                                        <label>Telefone</label>
                                        <div style={{ position: 'relative' }}>
                                            <FiPhone style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.9rem' }} />
                                            <input type="text" value={ownerData.phone} onChange={(e) => setOwnerData({ ...ownerData, phone: e.target.value })} style={{ paddingLeft: '2.5rem' }} placeholder="+258 8x xxx xxxx" />
                                        </div>
                                    </div>
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
                                        style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-main)' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Cidade</label>
                                    <input
                                        type="text" name="address.city" value={formData.address?.city} onChange={handleChange}
                                        style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-main)' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* Taxas e Regras */}

                        {/* Taxas e Regras */}
                        <div className="card">
                            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FiPercent style={{ color: 'var(--accent)' }} /> Taxas e Regras de Negócio
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                        <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>Taxa de Juros Padrão (%)</label>
                                        <span style={{
                                            color: '#fff',
                                            fontWeight: 800,
                                            fontSize: '1.2rem',
                                            background: 'linear-gradient(135deg, var(--accent) 0%, var(--primary-light) 100%)',
                                            padding: '0.25rem 0.8rem',
                                            borderRadius: '8px',
                                            minWidth: '70px',
                                            textAlign: 'center',
                                            boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                                        }}>{formData.settings?.interestRates?.default || 0}%</span>
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
                                            style={{ width: '80px', padding: '0.5rem', background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: '6px', color: 'var(--text-main)', textAlign: 'center' }}
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
                                            style={{ width: '80px', padding: '0.5rem', background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: '6px', color: 'var(--text-main)', textAlign: 'center' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Integração WhatsApp */}
                        <WhatsAppConnect />

                        {/* Botão Salvar */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                            <button
                                type="submit"
                                disabled={saving}
                                className="btn-primary"
                                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', justifyContent: 'center', padding: '1rem', fontWeight: 800, fontSize: '1.1rem' }}
                            >
                                <FiSave /> {saving ? 'Salvando...' : 'Salvar Tudo'}
                            </button>
                        </div>
                    </div>
                </div>
            </form>

            <Modal
                isOpen={modal.isOpen}
                onClose={() => setModal({ ...modal, isOpen: false })}
                title={modal.title}
                message={modal.message}
                type={modal.type}
            />
        </Layout>
    );
};

export default InstitutionSettings;
