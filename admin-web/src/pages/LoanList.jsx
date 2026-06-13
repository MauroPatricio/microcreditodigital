import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import api from '../api';
import { FiSearch, FiFilter, FiCheckCircle, FiXCircle, FiClock, FiDollarSign, FiPlus, FiUser, FiArrowRight, FiX, FiActivity, FiDownload, FiFileText } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import ConfidenceIndicator from '../components/ConfidenceIndicator';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const LoanList = () => {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [riskFilter, setRiskFilter] = useState('');
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
                const res = await api.get('/credits', {
                    params: {
                        status: statusFilter,
                        riskCategory: riskFilter
                    }
                });
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
    }, [statusFilter, riskFilter]);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'active': return { bg: 'rgba(59, 130, 246, 1)', color: 'white', label: 'Ativo' };
            case 'paid': return { bg: 'rgba(16, 185, 129, 1)', color: 'white', label: 'Liquidado' };
            case 'pending': return { bg: 'rgba(245, 158, 11, 1)', color: 'white', label: 'Pendente' };
            case 'rejected': return { bg: 'rgba(239, 68, 68, 1)', color: 'white', label: 'Rejeitado' };
            case 'overdue': return { bg: '#ef4444', color: 'white', label: 'Em Atraso' };
            default: return { bg: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-muted)', label: status };
        }
    };

    const exportToExcel = () => {
        const data = loans.map(l => ({
            'ID': l._id,
            'Nº': l.loanNumber || 'N/A',
            'Cliente': l.client?.name,
            'Valor': l.amount,
            'Saldo Devedor': l.remainingBalance || (l.totalPayable - l.totalPaid),
            'Status': l.status,
            'Confiança': l.riskProfile?.label || 'N/A',
            'Data': new Date(l.createdAt).toLocaleDateString()
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Empréstimos");
        XLSX.writeFile(wb, "Relatorio_Emprestimos.xlsx");
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text("Relatório de Empréstimos - Fintech Digital", 14, 15);
        const tableColumn = ["ID", "Cliente", "Valor", "Saldo", "Status", "Data"];
        const tableRows = loans.map(l => [
            l.loanNumber || l._id.substring(0, 8),
            l.client?.name,
            `${l.amount.toLocaleString()} MT`,
            `${(l.remainingBalance || (l.totalPayable - l.totalPaid)).toLocaleString()} MT`,
            l.status.toUpperCase(),
            new Date(l.createdAt).toLocaleDateString()
        ]);
        doc.autoTable(tableColumn, tableRows, { startY: 20 });
        doc.save("Relatorio_Emprestimos.pdf");
    };

    return (
        <Layout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Gestão de Empréstimos</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Acompanhe solicitações, aprovações e o status da carteira.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <FiFilter style={{ position: 'absolute', left: '0.75rem', color: 'var(--text-muted)' }} />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{
                                padding: '0.75rem 0.75rem 0.75rem 2.2rem',
                                background: 'var(--bg-card)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                color: 'var(--text-main)',
                                fontSize: '0.85rem'
                            }}
                        >
                            <option value="">Status: Todos</option>
                            <option value="pending">Pendentes</option>
                            <option value="approved">Aprovados</option>
                            <option value="active">Ativos</option>
                            <option value="paid">Liquidados</option>
                            <option value="overdue">Em Atraso</option>
                        </select>
                    </div>
                    <select
                        value={riskFilter}
                        onChange={(e) => setRiskFilter(e.target.value)}
                        style={{
                            padding: '0.75rem',
                            background: 'var(--bg-card)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: 'var(--text-main)',
                            fontSize: '0.85rem'
                        }}
                    >
                        <option value="">Risco: Todos</option>
                        <option value="low">Baixo</option>
                        <option value="medium">Médio</option>
                        <option value="high">Alto</option>
                    </select>

                    <button onClick={exportToExcel} className="btn-secondary" style={{ padding: '0.75rem', display: 'flex', alignItems: 'center' }} title="Exportar Excel">
                        <FiDownload />
                    </button>
                    <button onClick={exportToPDF} className="btn-secondary" style={{ padding: '0.75rem', display: 'flex', alignItems: 'center' }} title="Exportar PDF">
                        <FiFileText />
                    </button>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
                    >
                        <FiPlus /> Novo
                    </button>
                </div>
            </div>

            <div className="card" style={{ padding: '0' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-main)' }}>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Protocolo / Cliente</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Vl. Original</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Saldo Devedor</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Status / Risco</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Atraso / Prox. Pv</th>
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
                                                    width: '36px', height: '36px', borderRadius: '10px', background: 'var(--bg-main)', border: '1px solid rgba(255,255,255,0.1)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', color: 'var(--accent)'
                                                }}>{loan.client?.name?.charAt(0)}</div>
                                                <div>
                                                    <p style={{ fontWeight: 800, fontSize: '0.9rem' }}>{loan.client?.name}</p>
                                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>#{loan.loanNumber || loan._id.substring(loan._id.length - 8).toUpperCase()}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <p style={{ fontWeight: 800, fontSize: '0.9rem' }}>{loan.amount.toLocaleString()} MT</p>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{loan.term} meses</p>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <p style={{ fontWeight: 900, fontSize: '0.95rem', color: loan.status === 'overdue' ? 'var(--danger)' : 'var(--text-main)' }}>
                                                {(loan.remainingBalance || (loan.totalPayable - loan.totalPaid)).toLocaleString()} <span style={{ fontSize: '0.7rem' }}>MT</span>
                                            </p>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--success)', marginTop: '0.2rem', fontWeight: 600 }}>Pago: {loan.totalPaid?.toLocaleString() || 0} MT</p>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                <span style={{
                                                    display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 900, width: 'fit-content',
                                                    background: getStatusStyle(loan.status).bg, color: getStatusStyle(loan.status).color, textTransform: 'uppercase'
                                                }}>{getStatusStyle(loan.status).label}</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: loan.riskProfile?.confidenceLevel > 3 ? 'var(--success)' : 'var(--warning)' }}></div>
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>{loan.riskProfile?.label || 'Moderado'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            {loan.status === 'overdue' ? (
                                                <p style={{ color: 'var(--danger)', fontWeight: 800, fontSize: '0.85rem' }}>{loan.overdueDays || 0} dias atraso</p>
                                            ) : (
                                                <p style={{ fontSize: '0.85rem', fontWeight: 700 }}>{loan.nextDueDate ? new Date(loan.nextDueDate).toLocaleDateString('pt-MZ') : new Date(loan.createdAt).toLocaleDateString('pt-MZ')}</p>
                                            )}
                                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Término: {loan.endDate ? new Date(loan.endDate).toLocaleDateString('pt-MZ') : '---'}</p>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Agente: {loan.agent?.name || 'Sistema'}</p>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                            <button
                                                onClick={() => navigate(`/credits/${loan._id}`)}
                                                className="btn-secondary"
                                                style={{ padding: '0.5rem', borderRadius: '8px' }}
                                            >
                                                <FiArrowRight />
                                            </button>
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
                                        background: 'var(--bg-main)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        color: 'var(--text-main)',
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
                                                background: 'var(--bg-main)'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', fontWeight: 800, fontSize: '0.8rem' }}>
                                                    {client.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{client.name}</p>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                        <FiActivity size={12} /> Confiança: {client.confidenceAnalysis?.label || 'Moderado'}
                                                    </p>
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

                        <div style={{ padding: '1.25rem', background: 'var(--bg-main)', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
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
