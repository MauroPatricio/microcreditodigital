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
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    color: '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
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
                        color: '#000',
                        fontWeight: 'bold'
                    }}>
                        <FiRepeat size={16} />
                    </div>
                    <div style={{ textAlign: 'left', overflow: 'hidden' }}>
                        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', marginBottom: '2px', fontWeight: 500 }}>Instituição Ativa</p>
                        <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {activeInst?.name || 'Selecionar...'}
                        </p>
                    </div>
                </div>
                <FiChevronDown size={20} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: '0.2s', color: 'rgba(255,255,255,0.7)' }} />
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 0.5rem)',
                    left: '0',
                    right: '0',
                    background: '#0f172a',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    zIndex: 1100,
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
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
                                    padding: '0.75rem 1rem',
                                    background: inst._id === activeInst?._id ? 'rgba(34, 197, 94, 0.15)' : 'transparent',
                                    border: '1px solid ' + (inst._id === activeInst?._id ? 'rgba(34, 197, 94, 0.3)' : 'transparent'),
                                    borderRadius: '8px',
                                    color: inst._id === activeInst?._id ? '#4ade80' : '#f8fafc',
                                    cursor: inst._id === activeInst?._id ? 'default' : 'pointer',
                                    textAlign: 'left',
                                    marginBottom: '4px',
                                    fontWeight: inst._id === activeInst?._id ? 700 : 500
                                }}
                                onMouseEnter={(e) => {
                                    if (inst._id !== activeInst?._id) {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
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
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
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
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px dashed rgba(255, 255, 255, 0.2)',
                                borderRadius: '8px',
                                color: '#white',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                                e.currentTarget.style.borderColor = 'white';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
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
