import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import api from '../api';
import { FiSearch, FiFilter, FiCheckCircle, FiXCircle, FiClock, FiDollarSign, FiPlus, FiUser, FiArrowRight, FiX } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';

const LoanList = () => {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [clientSearch, setClientSearch] = useState('');
    const [clients, setClients] = useState([]);
    const [searchingClients, setSearchingClients] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchClients = async () => {
            if (!isModalOpen) return;
            setSearchingClients(true);
            try {
                const res = await api.get('/clients', { params: { search: clientSearch, limit: 5 } });
                if (res.data.success) {
                    setClients(res.data.data.clients);
                }
            } catch (error) {
                console.error("Error fetching clients", error);
            } finally {
                setSearchingClients(false);
            }
        };

        const timer = setTimeout(fetchClients, 300);
        return () => clearTimeout(timer);
    }, [clientSearch, isModalOpen]);

    useEffect(() => {
        const fetchLoans = async () => {
            try {
                const res = await api.get('/credits', { params: { status: statusFilter } });
                if (res.data.success) {
                    setLoans(res.data.data.credits);
                }
            } catch (error) {
                console.error("Error fetching loans", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLoans();
    }, [statusFilter]);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'active': return { bg: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent)' };
            case 'paid': return { bg: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' };
            case 'pending': return { bg: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' };
            case 'rejected': return { bg: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' };
            case 'overdue': return { bg: 'rgba(239, 68, 68, 0.2)', color: '#ff4444' };
            default: return { bg: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)' };
        }
    };

    return (
        <Layout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Gestão de Empréstimos</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Acompanhe solicitações, aprovações e o status da carteira.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{
                            padding: '0.75rem 1rem',
                            background: 'var(--bg-card)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '0.9rem'
                        }}
                    >
                        <option value="">Todos os Status</option>
                        <option value="pending">Pendentes</option>
                        <option value="approved">Aprovados</option>
                        <option value="active">Ativos</option>
                        <option value="paid">Liquidados</option>
                        <option value="overdue">Em Atraso</option>
                        <option value="rejected">Rejeitados</option>
                    </select>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
                    >
                        <FiPlus /> Novo Empréstimo
                    </button>
                </div>
            </div>

            <div className="card" style={{ padding: '0' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>CLIENTE</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>VALOR</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>PRAZO</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>STATUS</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>DATA</th>
                                <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--accent)' }}>Carregando empréstimos...</td>
                                </tr>
                            ) : loans.length > 0 ? (
                                loans.map(loan => (
                                    <tr key={loan._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'var(--transition)' }}>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{
                                                    width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary-light)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem'
                                                }}>{loan.client?.name?.charAt(0)}</div>
                                                <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{loan.client?.name}</p>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>{loan.amount.toLocaleString()} MT</p>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem' }}>
                                            {loan.term} meses
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <span style={{
                                                display: 'inline-block', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800,
                                                background: getStatusStyle(loan.status).bg, color: getStatusStyle(loan.status).color, textTransform: 'uppercase'
                                            }}>{loan.status}</span>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            {new Date(loan.createdAt).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                            <Link to={`/credits/${loan._id}`} style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>Gerenciar</Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum empréstimo encontrado.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Client Selection Modal */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 2000,
                    background: 'rgba(2, 6, 23, 0.8)',
                    backdropFilter: 'blur(12px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.5rem',
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <div className="glass" style={{
                        width: '100%',
                        maxWidth: '500px',
                        background: 'var(--bg-card)',
                        borderRadius: '24px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Selecionar Cliente</h3>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <FiX size={20} />
                            </button>
                        </div>

                        <div style={{ padding: '1.5rem' }}>
                            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                                <FiSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    placeholder="Buscar cliente por nome ou NUIT..."
                                    value={clientSearch}
                                    onChange={(e) => setClientSearch(e.target.value)}
                                    autoFocus
                                    style={{
                                        width: '100%',
                                        padding: '0.85rem 1rem 0.85rem 2.8rem',
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        color: 'white',
                                        outline: 'none'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                                {searchingClients ? (
                                    <p style={{ textAlign: 'center', padding: '1rem', color: 'var(--accent)', fontSize: '0.9rem' }}>Buscando...</p>
                                ) : clients.length > 0 ? (
                                    clients.map(client => (
                                        <div
                                            key={client._id}
                                            onClick={() => navigate(`/clients/${client._id}/request-credit`)}
                                            className="client-item-hover"
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '1rem',
                                                borderRadius: '12px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                background: 'rgba(255,255,255,0.02)'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '0.8rem' }}>
                                                    {client.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{client.name}</p>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Score: {client.creditScore}</p>
                                                </div>
                                            </div>
                                            <FiArrowRight size={16} color="var(--accent)" />
                                        </div>
                                    ))
                                ) : clientSearch.length > 0 ? (
                                    <p style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nenhum cliente encontrado.</p>
                                ) : (
                                    <p style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Digite para buscar um cliente...</p>
                                )}
                            </div>
                        </div>

                        <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                Não encontrou o cliente? <Link to="/clients/new" style={{ color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}>Cadastrar Novo</Link>
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .client-item-hover:hover {
                    background: rgba(59, 130, 246, 0.1) !important;
                    transform: translateX(5px);
                }
            `}</style>
        </Layout>
    );
};

export default LoanList;
