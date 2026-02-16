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
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                    <div style={{
                        width: '28px',
                        height: '28px',
                        background: 'var(--accent)',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <FiRepeat size={14} />
                    </div>
                    <div style={{ textAlign: 'left', overflow: 'hidden' }}>
                        <p style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: '2px' }}>Instituição Ativa</p>
                        <p style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {activeInst?.name || 'Selecionar...'}
                        </p>
                    </div>
                </div>
                <FiChevronDown style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: '0.75rem',
                    right: '0.75rem',
                    background: '#1e293b',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    marginTop: '0.5rem',
                    zIndex: 1100,
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                    maxHeight: '300px',
                    overflowY: 'auto'
                }}>
                    <div style={{ padding: '0.5rem' }}>
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
                                    padding: '0.75rem',
                                    background: inst._id === activeInst?._id ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: inst._id === activeInst?._id ? 'var(--accent)' : '#cbd5e1',
                                    cursor: inst._id === activeInst?._id ? 'default' : 'pointer',
                                    textAlign: 'left',
                                    marginBottom: '2px'
                                }}
                            >
                                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{inst.name}</span>
                                {inst._id === activeInst?._id && <FiCheck />}
                            </button>
                        ))}
                    </div>
                    <div style={{
                        padding: '0.5rem',
                        borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                        <button
                            onClick={() => window.location.href = '/institutions/new'}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.75rem',
                                background: 'transparent',
                                border: 'none',
                                borderRadius: '8px',
                                color: 'var(--accent)',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: 600
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
