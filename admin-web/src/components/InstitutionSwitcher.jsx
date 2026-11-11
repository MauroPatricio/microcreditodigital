import React, { useState, useEffect } from 'react';
import { FiRepeat, FiCheck, FiChevronDown, FiPlus } from 'react-icons/fi';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const InstitutionSwitcher = () => {
    const { user, login } = useAuth(); // Usando bypass/refresh se necessário
    const [institutions, setInstitutions] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user?.role === 'owner' || user?.role === 'super_admin') {
            fetchInstitutions();
        }
    }, [user]);

    const fetchInstitutions = async () => {
        try {
            const response = await api.get('/institutions/all');
            setInstitutions(response.data.data);
        } catch (error) {
            console.error('Erro ao buscar instituições:', error);
        }
    };

    const handleSwitch = async (id) => {
        setLoading(true);
        try {
            await api.post(`/institutions/switch/${id}`);
            // Recarregar a página ou atualizar o contexto de auth para refletir a nova instituição
            window.location.reload();
        } catch (error) {
            console.error('Erro ao alternar instituição:', error);
            setLoading(false);
        }
    };

    if (user?.role !== 'owner' && user?.role !== 'super_admin') return null;

    const activeInst = institutions.find(i => i._id === (user.activeInstitution?._id || user.activeInstitution));

    return (
        <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 0.85rem',
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.45)',
                    borderRadius: '10px',
                    color: '#ffffff',
                    cursor: 'pointer'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                    <div style={{
                        width: '34px',
                        height: '34px',
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        overflow: 'hidden',
                        color: '#ffffff',
                        fontWeight: 'bold'
                    }}>
                        {activeInst?.settings?.appearance?.logoUrl ? (
                            <img
                                src={`${api.defaults.baseURL.replace('/api', '')}${activeInst.settings.appearance.logoUrl}`}
                                alt="Logo"
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                        ) : (
                            <span style={{ color: '#ffffff', fontWeight: 800, fontSize: '0.9rem' }}>
                                {(activeInst?.name || 'I').charAt(0).toUpperCase()}
                            </span>
                        )}
                    </div>
                    <div style={{ textAlign: 'left', overflow: 'hidden' }}>
                        <p style={{ fontSize: '0.68rem', color: '#fbbf24', marginBottom: '1px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Instituição Ativa
                        </p>
                        <p style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {activeInst?.name || 'Selecionar...'}
                        </p>
                    </div>
                </div>
                <FiChevronDown size={18} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: '0.2s', color: '#fbbf24', flexShrink: 0 }} />
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 0.5rem)',
                    left: '0',
                    right: '0',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    zIndex: 1100,
                    boxShadow: '0 16px 28px rgba(0, 0, 0, 0.5)',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    padding: '0.5rem'
                }}>
                    <div style={{ paddingBottom: '0.5rem' }}>
                        {institutions.map(inst => (
                            <button
                                key={inst._id}
                                onClick={() => handleSwitch(inst._id)}
                                disabled={inst._id === activeInst?._id}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '0.65rem 0.85rem',
                                    background: inst._id === activeInst?._id ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                                    border: '1px solid ' + (inst._id === activeInst?._id ? '#f59e0b' : 'transparent'),
                                    borderRadius: '8px',
                                    color: inst._id === activeInst?._id ? '#fbbf24' : '#f8fafc',
                                    cursor: inst._id === activeInst?._id ? 'default' : 'pointer',
                                    textAlign: 'left',
                                    marginBottom: '4px',
                                    fontWeight: inst._id === activeInst?._id ? 700 : 500
                                }}
                                onMouseEnter={(e) => {
                                    if (inst._id !== activeInst?._id) {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (inst._id !== activeInst?._id) {
                                        e.currentTarget.style.background = 'transparent';
                                    }
                                }}
                            >
                                <span style={{ fontSize: '0.85rem' }}>{inst.name}</span>
                                {inst._id === activeInst?._id && <FiCheck size={16} />}
                            </button>
                        ))}
                    </div>
                    <div style={{
                        paddingTop: '0.5rem',
                        borderTop: '1px solid #334155'
                    }}>
                        <button
                            onClick={() => window.location.href = '/institutions/new'}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                padding: '0.65rem',
                                background: 'transparent',
                                border: '1px dashed #64748b',
                                borderRadius: '8px',
                                color: '#f8fafc',
                                cursor: 'pointer',
                                fontSize: '0.82rem',
                                fontWeight: 600
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(245, 158, 11, 0.15)';
                                e.currentTarget.style.borderColor = '#f59e0b';
                                e.currentTarget.style.color = '#fbbf24';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.borderColor = '#64748b';
                                e.currentTarget.style.color = '#f8fafc';
                            }}
                        >
                            <FiPlus /> Criar Nova Instituição
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InstitutionSwitcher;
