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
        <div style={{ position: 'relative', marginBottom: '1rem', padding: '0 0.75rem' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem',
                    background: 'var(--sidebar-hover-bg)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '12px',
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    transition: 'var(--theme-transition)',
                    boxShadow: 'var(--card-shadow)'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        background: 'var(--accent)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        overflow: 'hidden',
                        color: 'white',
                        fontWeight: 'bold'
                    }}>
                        {activeInst?.settings?.appearance?.logoUrl ? (
                            <img
                                src={`${api.defaults.baseURL.replace('/api', '')}${activeInst.settings.appearance.logoUrl}`}
                                alt="Logo"
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                        ) : (
                            <span style={{ color: 'white', fontWeight: 700, fontSize: '0.85rem' }}>
                                {(activeInst?.name || 'I').charAt(0).toUpperCase()}
                            </span>
                        )}
                    </div>
                    <div style={{ textAlign: 'left', overflow: 'hidden' }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px', fontWeight: 500, transition: 'var(--theme-transition)' }}>Instituição Ativa</p>
                        <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', transition: 'var(--theme-transition)' }}>
                            {activeInst?.name || 'Selecionar...'}
                        </p>
                    </div>
                </div>
                <FiChevronDown size={20} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: '0.2s', color: 'var(--text-muted)' }} />
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 0.5rem)',
                    left: '0',
                    right: '0',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '12px',
                    zIndex: 1100,
                    boxShadow: 'var(--card-shadow)',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    padding: '0.5rem',
                    transition: 'var(--theme-transition)'
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
                                    padding: '0.75rem 1rem',
                                    background: inst._id === activeInst?._id ? 'var(--sidebar-active-bg)' : 'transparent',
                                    border: '1px solid ' + (inst._id === activeInst?._id ? 'var(--primary-light)' : 'transparent'),
                                    borderRadius: '8px',
                                    color: inst._id === activeInst?._id ? 'var(--primary)' : 'var(--text-main)',
                                    cursor: inst._id === activeInst?._id ? 'default' : 'pointer',
                                    textAlign: 'left',
                                    marginBottom: '4px',
                                    fontWeight: inst._id === activeInst?._id ? 700 : 500,
                                    transition: 'var(--theme-transition)'
                                }}
                                onMouseEnter={(e) => {
                                    if (inst._id !== activeInst?._id) {
                                        e.currentTarget.style.background = 'var(--sidebar-hover-bg)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (inst._id !== activeInst?._id) {
                                        e.currentTarget.style.background = 'transparent';
                                    }
                                }}
                            >
                                <span style={{ fontSize: '0.9rem' }}>{inst.name}</span>
                                {inst._id === activeInst?._id && <FiCheck size={18} />}
                            </button>
                        ))}
                    </div>
                    <div style={{
                        paddingTop: '0.5rem',
                        borderTop: '1px solid var(--border-light)'
                    }}>
                        <button
                            onClick={() => window.location.href = '/institutions/new'}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                padding: '0.75rem',
                                background: 'transparent',
                                border: '1px dashed var(--text-muted)',
                                borderRadius: '8px',
                                color: 'var(--text-main)',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                transition: 'var(--theme-transition)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'var(--sidebar-hover-bg)';
                                e.currentTarget.style.borderColor = 'var(--text-main)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.borderColor = 'var(--text-muted)';
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
