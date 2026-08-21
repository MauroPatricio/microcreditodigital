import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import api from '../api';
import { FiSearch, FiMoreVertical, FiCheckCircle, FiXCircle, FiTrash2, FiClock, FiShield } from 'react-icons/fi';
import Modal from '../components/Modal';

const InstitutionManagement = () => {
    const { user } = useAuth();
    const [institutions, setInstitutions] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('institutions');
    
    // Modal states
    const [statusModal, setStatusModal] = useState({ isOpen: false, inst: null });
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, inst: null });
    const [subModal, setSubModal] = useState({ isOpen: false, inst: null, plan: 'standard', days: 30 });
    const [actionLoading, setActionLoading] = useState(false);

    const fetchInstitutions = async () => {
        try {
            setLoading(true);
            const res = await api.get('/institutions/all');
            const reqRes = await api.get('/institutions/subscription-requests/all');
            if (res.data.success) {
                setInstitutions(res.data.data);
            }
            if (reqRes.data.success) {
                setPendingRequests(reqRes.data.data);
            }
        } catch (error) {
            console.error("Error fetching institutions", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInstitutions();
    }, []);

    const filteredInstitutions = institutions.filter(inst => 
        inst.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        inst.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inst.nuit && inst.nuit.includes(searchTerm))
    );

    const handleToggleStatus = async () => {
        if (!statusModal.inst) return;
        setActionLoading(true);
        try {
            const res = await api.put(`/institutions/${statusModal.inst._id}/status`, {
                isActive: !statusModal.inst.isActive
            });
            if (res.data.success) {
                fetchInstitutions();
                setStatusModal({ isOpen: false, inst: null });
            }
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Erro ao alterar estado');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteModal.inst) return;
        setActionLoading(true);
        try {
            const res = await api.delete(`/institutions/${deleteModal.inst._id}`);
            if (res.data.success) {
                fetchInstitutions();
                setDeleteModal({ isOpen: false, inst: null });
            }
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Erro ao remover');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRenewSub = async () => {
        if (!subModal.inst) return;
        setActionLoading(true);
        try {
            const res = await api.put(`/institutions/${subModal.inst._id}/subscription`, {
                plan: subModal.plan,
                durationDays: parseInt(subModal.days) || 30
            });
            if (res.data.success) {
                fetchInstitutions();
                setSubModal({ isOpen: false, inst: null, plan: 'business', days: 30 });
            }
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Erro ao renovar subscrição');
        } finally {
            setActionLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('pt-MZ');
    };

    const getSubscriptionStatus = (sub) => {
        if (!sub || !sub.expiresAt) return { label: 'Sem Subscrição', color: 'var(--text-muted)' };
        const now = new Date();
        const exp = new Date(sub.expiresAt);
        if (sub.status === 'expired' || exp < now) {
            return { label: 'Expirada', color: 'var(--danger)' };
        }
        return { label: 'Ativa', color: 'var(--success)' };
    };

    const handleApproveRequest = async (reqId) => {
        if (!window.confirm('Tem a certeza que deseja aprovar este pagamento e renovar a subscrição?')) return;
        setActionLoading(true);
        try {
            await api.put(`/institutions/subscription-request/${reqId}/approve`);
            fetchInstitutions();
            alert('Subscrição renovada com sucesso!');
        } catch (error) {
            alert('Erro ao aprovar: ' + (error.response?.data?.message || error.message));
        } finally {
            setActionLoading(false);
        }
    };

    const handleRejectRequest = async (reqId) => {
        const reason = window.prompt('Motivo da rejeição:');
        if (reason === null) return;
        setActionLoading(true);
        try {
            await api.put(`/institutions/subscription-request/${reqId}/reject`, { reviewNotes: reason });
            fetchInstitutions();
            alert('Pedido rejeitado.');
        } catch (error) {
            alert('Erro ao rejeitar: ' + (error.response?.data?.message || error.message));
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <Layout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Gestão de Instituições</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Controlo de subscrições, bloqueios e acessos (Exclusivo Super Admin).</p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                <button 
                    style={{ background: 'none', border: 'none', fontSize: '1rem', fontWeight: activeTab === 'institutions' ? 600 : 400, color: activeTab === 'institutions' ? 'var(--primary-color)' : 'var(--text-muted)', cursor: 'pointer', paddingBottom: '0.5rem', borderBottom: activeTab === 'institutions' ? '2px solid var(--primary-color)' : '2px solid transparent' }}
                    onClick={() => setActiveTab('institutions')}
                >
                    Instituições
                </button>
                <button 
                    style={{ background: 'none', border: 'none', fontSize: '1rem', fontWeight: activeTab === 'requests' ? 600 : 400, color: activeTab === 'requests' ? 'var(--primary-color)' : 'var(--text-muted)', cursor: 'pointer', paddingBottom: '0.5rem', borderBottom: activeTab === 'requests' ? '2px solid var(--primary-color)' : '2px solid transparent' }}
                    onClick={() => setActiveTab('requests')}
                >
                    Pedidos de Renovação ({pendingRequests.length})
                </button>
            </div>

            {activeTab === 'institutions' && (
            <div className="card" style={{ padding: '0' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)', position: 'relative' }}>
                    <FiSearch style={{ position: 'absolute', left: '2.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Buscar instituição por nome, email ou NUIT..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.75rem 1rem 0.75rem 2.8rem',
                            background: 'var(--bg-main)',
                            border: '1px solid var(--border-light)',
                            borderRadius: '12px',
                            color: 'var(--text-main)'
                        }}
                    />
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-main)' }}>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>INSTITUIÇÃO</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>ESTADO</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>SUBSCRIÇÃO</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>EXPIRA EM</th>
                                <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>ACÇÕES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--accent)' }}>Carregando instituições...</td>
                                </tr>
                            ) : filteredInstitutions.length > 0 ? (
                                filteredInstitutions.map(inst => {
                                    const subStatus = getSubscriptionStatus(inst.subscription);
                                    return (
                                    <tr key={inst._id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'var(--transition)' }}>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                {inst.settings?.appearance?.logoUrl ? (
                                                    <img src={`http://localhost:4000/${inst.settings.appearance.logoUrl.replace(/\\/g, '/')}`} alt={inst.name} style={{ width: '36px', height: '36px', borderRadius: '10px', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{
                                                        width: '36px', height: '36px', borderRadius: '10px', background: 'var(--primary-light)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--accent)'
                                                    }}>{inst.name.charAt(0)}</div>
                                                )}
                                                <div>
                                                    <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{inst.name}</p>
                                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>NUIT: {inst.nuit} • {inst.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            {inst.isActive ? (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', fontSize: '0.8rem', fontWeight: 600 }}>
                                                    <FiCheckCircle size={12} /> Activa
                                                </span>
                                            ) : (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '20px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', fontSize: '0.8rem', fontWeight: 600 }}>
                                                    <FiXCircle size={12} /> Bloqueada
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ fontWeight: 600, color: subStatus.color }}>
                                                {subStatus.label} ({inst.subscription?.plan?.toUpperCase() || 'FREE'})
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>
                                            {formatDate(inst.subscription?.expiresAt)}
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                <button 
                                                    className="btn-outline" 
                                                    onClick={() => setSubModal({ isOpen: true, inst, plan: inst.subscription?.plan || 'standard', days: 30 })}
                                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                                >
                                                    <FiClock /> Renovar
                                                </button>
                                                <button 
                                                    className="btn-outline" 
                                                    onClick={() => setStatusModal({ isOpen: true, inst })}
                                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderColor: inst.isActive ? 'var(--danger)' : 'var(--success)', color: inst.isActive ? 'var(--danger)' : 'var(--success)' }}
                                                    title={inst.isActive ? 'Bloquear' : 'Activar'}
                                                >
                                                    {inst.isActive ? <FiXCircle /> : <FiCheckCircle />}
                                                </button>
                                                <button 
                                                    className="btn-outline" 
                                                    onClick={() => setDeleteModal({ isOpen: true, inst })}
                                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderColor: 'var(--danger)', color: 'var(--danger)' }}
                                                    title="Remover Instituição"
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )})
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhuma instituição encontrada.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            )}

            {activeTab === 'requests' && (
                <div className="card">
                    <div className="table-responsive">
                        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-light)', textAlign: 'left', color: 'var(--text-muted)' }}>
                                    <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Instituição</th>
                                    <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Plano Requisitado</th>
                                    <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Valor Pago</th>
                                    <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Comprovativo</th>
                                    <th style={{ padding: '1rem 1.5rem', fontWeight: 600, textAlign: 'right' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingRequests.map(req => (
                                    <tr key={req._id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ fontWeight: 600 }}>{req.institution?.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatDate(req.createdAt)}</div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', textTransform: 'capitalize' }}>
                                            {req.planRequested}
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            {req.amountPaid} MT
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <a href={`http://localhost:4000${req.proofOfPaymentUrl}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}>
                                                Ver Imagem
                                            </a>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                <button className="btn-primary" onClick={() => handleApproveRequest(req._id)} disabled={actionLoading} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                                                    <FiCheckCircle /> Aprovar
                                                </button>
                                                <button className="btn-outline" onClick={() => handleRejectRequest(req._id)} disabled={actionLoading} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                                                    <FiXCircle /> Rejeitar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {pendingRequests.length === 0 && (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Sem pedidos pendentes.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Status Change Modal */}
            <Modal isOpen={statusModal.isOpen} onClose={() => !actionLoading && setStatusModal({ isOpen: false, inst: null })} title="Confirmar Acção">
                {statusModal.inst && (
                    <div>
                        <p style={{ marginBottom: '1.5rem' }}>
                            Tem a certeza que deseja <strong>{statusModal.inst.isActive ? 'bloquear' : 'activar'}</strong> a instituição {statusModal.inst.name}?
                            {statusModal.inst.isActive && " Os utilizadores desta instituição não conseguirão aceder ao sistema."}
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button className="btn-outline" onClick={() => setStatusModal({ isOpen: false, inst: null })} disabled={actionLoading}>Cancelar</button>
                            <button className="btn-primary" onClick={handleToggleStatus} disabled={actionLoading} style={{ background: statusModal.inst.isActive ? 'var(--danger)' : 'var(--success)', borderColor: 'transparent' }}>
                                {actionLoading ? 'A processar...' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Delete Modal */}
            <Modal isOpen={deleteModal.isOpen} onClose={() => !actionLoading && setDeleteModal({ isOpen: false, inst: null })} title="Remover Instituição">
                {deleteModal.inst && (
                    <div>
                        <p style={{ marginBottom: '1.5rem', color: 'var(--danger)' }}>
                            <strong>Atenção:</strong> Está prestes a remover definitivamente a instituição {deleteModal.inst.name}.
                            Esta acção pode deixar dados históricos (clientes, empréstimos) orfãos na base de dados.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button className="btn-outline" onClick={() => setDeleteModal({ isOpen: false, inst: null })} disabled={actionLoading}>Cancelar</button>
                            <button className="btn-primary" onClick={handleDelete} disabled={actionLoading} style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}>
                                {actionLoading ? 'A remover...' : 'Remover Instituição'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Subscription Modal */}
            <Modal isOpen={subModal.isOpen} onClose={() => !actionLoading && setSubModal({ isOpen: false, inst: null, plan: 'standard', days: 30 })} title="Renovar Subscrição">
                {subModal.inst && (
                    <div>
                        <p style={{ marginBottom: '1rem' }}>Gerir subscrição para <strong>{subModal.inst.name}</strong>.</p>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label>Plano</label>
                            <select 
                                className="form-input"
                                value={subModal.plan} 
                                onChange={(e) => setSubModal({...subModal, plan: e.target.value})}
                            >
                                <option value="trial">Trial (Grátis - 3 Dias)</option>
                                <option value="standard">Standard (Web - 3200 MT)</option>
                                <option value="premium">Premium (Web + Mobile - 5000 MT)</option>
                            </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label>Adicionar Dias</label>
                            <input 
                                type="number" 
                                className="form-input" 
                                value={subModal.days} 
                                onChange={(e) => setSubModal({...subModal, days: e.target.value})}
                                min="1"
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button className="btn-outline" onClick={() => setSubModal({ isOpen: false, inst: null, plan: 'standard', days: 30 })} disabled={actionLoading}>Cancelar</button>
                            <button className="btn-primary" onClick={handleRenewSub} disabled={actionLoading}>
                                {actionLoading ? 'A renovar...' : 'Confirmar Subscrição'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </Layout>
    );
};

export default InstitutionManagement;
