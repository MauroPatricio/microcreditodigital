import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import api from '../api';
import { FiSearch, FiFilter, FiCheckCircle, FiXCircle, FiClock, FiDollarSign } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const LoanList = () => {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');

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
        </Layout>
    );
};

export default LoanList;
