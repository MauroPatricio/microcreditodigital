import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import api from '../api';
import {
    FiSearch, FiUserPlus, FiEdit, FiTrash2, FiCheckCircle, FiXCircle,
    FiX, FiAlertTriangle, FiCheckSquare, FiSquare
} from 'react-icons/fi';
import { Link } from 'react-router-dom';

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [userLimitInfo, setUserLimitInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [feedback, setFeedback] = useState({ type: '', text: '' });

    // Modais de confirmação
    const [batchModal, setBatchModal] = useState({ open: false, isAll: false });
    const [singleDeleteModal, setSingleDeleteModal] = useState({ open: false, user: null });
    const [deleting, setDeleting] = useState(false);

    const { user: currentUser } = useAuth();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/users');
            if (res.data.success) {
                setUsers(res.data.data);
                setUserLimitInfo(res.data.userLimitInfo || null);
            }
        } catch (error) {
            console.error("Error fetching users", error);
            setFeedback({ type: 'error', text: error.response?.data?.message || 'Erro ao carregar utilizadores' });
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Utilizadores elegíveis para seleção (não inclui o utilizador que está autenticado)
    const selectableUsers = filteredUsers.filter(u => u._id !== currentUser?._id);
    const isAllSelected = selectableUsers.length > 0 && selectableUsers.every(u => selectedUserIds.includes(u._id));
    const isSomeSelected = selectedUserIds.length > 0 && !isAllSelected;

    const handleToggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedUserIds([]);
        } else {
            setSelectedUserIds(selectableUsers.map(u => u._id));
        }
    };

    const handleToggleSelect = (id) => {
        if (id === currentUser?._id) return;
        setSelectedUserIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    // Confirmar eliminação de utilizador individual
    const openSingleDeleteModal = (user) => {
        setSingleDeleteModal({ open: true, user });
    };

    const handleConfirmSingleDelete = async () => {
        if (!singleDeleteModal.user) return;
        setDeleting(true);
        setFeedback({ type: '', text: '' });
        try {
            const res = await api.delete(`/users/${singleDeleteModal.user._id}`);
            setFeedback({ type: 'success', text: res.data.message || 'Utilizador eliminado com sucesso!' });
            setSelectedUserIds(prev => prev.filter(id => id !== singleDeleteModal.user._id));
            setSingleDeleteModal({ open: false, user: null });
            await fetchUsers();
        } catch (error) {
            setFeedback({ type: 'error', text: error.response?.data?.message || 'Erro ao eliminar utilizador' });
        } finally {
            setDeleting(false);
        }
    };

    // Confirmar eliminação em lote
    const openBatchDeleteModal = () => {
        if (selectedUserIds.length === 0) return;
        setBatchModal({ open: true, isAll: isAllSelected });
    };

    const handleConfirmBatchDelete = async () => {
        if (selectedUserIds.length === 0) return;
        setDeleting(true);
        setFeedback({ type: '', text: '' });
        try {
            const res = await api.post('/users/batch-delete', { userIds: selectedUserIds });
            setFeedback({
                type: 'success',
                text: res.data.message || `${selectedUserIds.length} utilizador(es) eliminado(s) com sucesso!`
            });
            setSelectedUserIds([]);
            setBatchModal({ open: false, isAll: false });
            await fetchUsers();
        } catch (error) {
            setFeedback({ type: 'error', text: error.response?.data?.message || 'Erro ao eliminar utilizadores selecionados' });
        } finally {
            setDeleting(false);
        }
    };

    const getRoleLabel = (role) => {
        const roles = {
            'owner': 'Proprietário',
            'super_admin': 'Super Admin',
            'admin': 'Administrador',
            'manager': 'Gestor',
            'representative': 'Representante Comercial',
            'supervisor': 'Supervisor',
            'agent': 'Agente',
            'analyst': 'Analista',
            'approver': 'Aprovador',
            'financial': 'Financeiro',
            'collector': 'Cobrador',
            'auditor': 'Auditor',
            'support': 'Suporte',
            'client': 'Cliente'
        };
        return roles[role] || role;
    };

    const limitReached = currentUser?.role !== 'super_admin' &&
        userLimitInfo?.maxUsers > 0 &&
        userLimitInfo.currentUsers >= userLimitInfo.maxUsers;

    const selectedUsersObjects = users.filter(u => selectedUserIds.includes(u._id));

    return (
        <Layout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Gestão de Utilizadores</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Visualize, filtre, selecione e gerencie os utilizadores do sistema.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {userLimitInfo && currentUser?.role !== 'super_admin' && (
                        <div style={{
                            padding: '0.45rem 0.85rem',
                            borderRadius: '8px',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            background: limitReached ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                            color: limitReached ? 'var(--danger)' : 'var(--success)',
                            border: `1px solid ${limitReached ? 'rgba(239, 68, 68, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`,
                        }}>
                            Utilizadores Activos: {userLimitInfo.currentUsers} / {userLimitInfo.maxUsers > 0 ? userLimitInfo.maxUsers : 'Ilimitado'}
                        </div>
                    )}

                    {/* Botão de Eliminação em Lote rápido no Topo se houver seleção */}
                    {['owner', 'admin', 'super_admin'].includes(currentUser?.role) && selectedUserIds.length > 0 && (
                        <button
                            type="button"
                            onClick={openBatchDeleteModal}
                            className="btn-danger"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                background: '#dc2626',
                                color: '#fff',
                                borderColor: '#b91c1c',
                                fontWeight: 700
                            }}
                        >
                            <FiTrash2 /> {isAllSelected ? `Remover Todos (${selectedUserIds.length})` : `Remover Selecionados (${selectedUserIds.length})`}
                        </button>
                    )}

                    {['owner', 'admin', 'super_admin'].includes(currentUser?.role) && (
                        limitReached ? (
                            <Link to="/my-subscription">
                                <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#d97706', borderColor: '#d97706' }}>
                                    <FiUserPlus /> Limite Atingido — Actualizar Pacote
                                </button>
                            </Link>
                        ) : (
                            <Link to="/users/new">
                                <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <FiUserPlus /> Novo Utilizador
                                </button>
                            </Link>
                        )
                    )}
                </div>
            </div>

            {/* Alerta de Feedback */}
            {feedback.text && (
                <div style={{
                    padding: '0.85rem 1.15rem',
                    borderRadius: '8px',
                    marginBottom: '1.25rem',
                    fontSize: '0.9rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: feedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
                    color: feedback.type === 'success' ? '#065f46' : '#991b1b',
                    border: `1px solid ${feedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
                }}>
                    <span>{feedback.text}</span>
                    <button onClick={() => setFeedback({ type: '', text: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, color: 'inherit' }}>✕</button>
                </div>
            )}

            {limitReached && (
                <div style={{
                    marginBottom: '1.25rem',
                    padding: '0.85rem 1.15rem',
                    borderRadius: '10px',
                    background: '#fffbeb',
                    border: '1px solid #f59e0b',
                    color: '#78350f',
                    fontSize: '0.88rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                    flexWrap: 'wrap',
                }}>
                    <span>
                        <strong>Limite de utilizadores do pacote atingido ({userLimitInfo.currentUsers}/{userLimitInfo.maxUsers}).</strong> Para adicionar mais membros da equipa, actualize a subscrição ou solicite ao Super Admin o aumento do limite.
                    </span>
                    <Link to="/my-subscription" style={{ fontWeight: 700, color: '#b45309', textDecoration: 'underline' }}>
                        Ir para Minha Subscrição
                    </Link>
                </div>
            )}

            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                {/* Barra de Pesquisa */}
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-light)', position: 'relative' }}>
                    <FiSearch style={{ position: 'absolute', left: '2.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Buscar por nome, email ou telefone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.75rem 1rem 0.75rem 2.8rem',
                        }}
                    />
                </div>

                {/* Barra de Ações em Lote quando houver utilizadores selecionados */}
                {selectedUserIds.length > 0 && ['owner', 'admin', 'super_admin'].includes(currentUser?.role) && (
                    <div style={{
                        padding: '0.85rem 1.5rem',
                        background: '#fef2f2',
                        borderBottom: '1px solid #fecaca',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.75rem',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{
                                background: '#dc2626',
                                color: '#fff',
                                padding: '0.2rem 0.65rem',
                                borderRadius: '9999px',
                                fontSize: '0.8rem',
                                fontWeight: 800
                            }}>
                                {selectedUserIds.length}
                            </span>
                            <span style={{ fontSize: '0.92rem', color: '#991b1b', fontWeight: 700 }}>
                                {isAllSelected
                                    ? `Todos os ${selectedUserIds.length} utilizadores selecionados`
                                    : `${selectedUserIds.length} utilizador(es) selecionado(s)`}
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <button
                                type="button"
                                onClick={() => setSelectedUserIds([])}
                                className="btn-secondary"
                                style={{
                                    fontSize: '0.82rem',
                                    padding: '0.45rem 0.85rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem'
                                }}
                            >
                                <FiX /> Desmarcar Todos
                            </button>
                            <button
                                type="button"
                                onClick={openBatchDeleteModal}
                                className="btn-danger"
                                style={{
                                    fontSize: '0.82rem',
                                    padding: '0.45rem 1rem',
                                    background: '#dc2626',
                                    color: '#fff',
                                    border: '1px solid #b91c1c',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.45rem',
                                    fontWeight: 700
                                }}
                            >
                                <FiTrash2 /> {isAllSelected ? `Remover Todos (${selectedUserIds.length})` : `Remover Selecionados (${selectedUserIds.length})`}
                            </button>
                        </div>
                    </div>
                )}

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-light)' }}>
                                {/* Checkbox Marcar Todos */}
                                {['owner', 'admin', 'super_admin'].includes(currentUser?.role) && (
                                    <th style={{ width: '48px', padding: '1rem 0.75rem 1rem 1.5rem', textAlign: 'center' }}>
                                        <input
                                            type="checkbox"
                                            checked={isAllSelected}
                                            ref={el => { if (el) el.indeterminate = isSomeSelected; }}
                                            onChange={handleToggleSelectAll}
                                            disabled={selectableUsers.length === 0}
                                            title={isAllSelected ? "Desmarcar todos" : "Marcar todos"}
                                            style={{
                                                width: '18px',
                                                height: '18px',
                                                cursor: selectableUsers.length === 0 ? 'not-allowed' : 'pointer',
                                                accentColor: 'var(--primary)'
                                            }}
                                        />
                                    </th>
                                )}
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>UTILIZADOR</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>PERFIL</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>ESTADO</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>DATA REGISTO</th>
                                <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>AÇÕES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={['owner', 'admin', 'super_admin'].includes(currentUser?.role) ? "6" : "5"} style={{ padding: '3rem', textAlign: 'center', color: 'var(--accent)' }}>Carregando utilizadores...</td>
                                </tr>
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map(user => {
                                    const isSelected = selectedUserIds.includes(user._id);
                                    const isMe = user._id === currentUser?._id;

                                    return (
                                        <tr
                                            key={user._id}
                                            style={{
                                                borderBottom: '1px solid var(--border-light)',
                                                background: isSelected ? 'rgba(2, 132, 199, 0.06)' : 'transparent',
                                                transition: 'var(--transition)'
                                            }}
                                        >
                                            {/* Checkbox de Linha */}
                                            {['owner', 'admin', 'super_admin'].includes(currentUser?.role) && (
                                                <td style={{ width: '48px', padding: '1rem 0.75rem 1rem 1.5rem', textAlign: 'center' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        disabled={isMe}
                                                        onChange={() => handleToggleSelect(user._id)}
                                                        title={isMe ? "Não pode eliminar o seu próprio utilizador" : "Marcar utilizador para remover"}
                                                        style={{
                                                            width: '18px',
                                                            height: '18px',
                                                            cursor: isMe ? 'not-allowed' : 'pointer',
                                                            accentColor: 'var(--primary)'
                                                        }}
                                                    />
                                                </td>
                                            )}
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{
                                                        width: '36px', height: '36px', borderRadius: '10px',
                                                        background: isMe ? 'rgba(16, 185, 129, 0.15)' : 'var(--primary-light)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontWeight: 700, color: isMe ? '#059669' : 'var(--text-heading)'
                                                    }}>
                                                        {user.name?.charAt(0) || 'U'}
                                                    </div>
                                                    <div>
                                                        <p style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                            {user.name}
                                                            {isMe && (
                                                                <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', background: '#dcfce7', color: '#15803d', fontWeight: 700 }}>
                                                                    Você
                                                                </span>
                                                            )}
                                                        </p>
                                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.email || user.phone}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{getRoleLabel(user.role)}</span>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                {!user.isBlocked ? (
                                                    <span className="badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                                        <FiCheckCircle /> Ativo
                                                    </span>
                                                ) : (
                                                    <span style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.7rem',
                                                        borderRadius: '6px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', fontSize: '0.75rem', fontWeight: 600
                                                    }}><FiXCircle /> Inativo</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                                {new Date(user.createdAt).toLocaleDateString('pt-MZ')}
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                                {['owner', 'admin', 'super_admin'].includes(currentUser?.role) && (
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                        <Link to={`/users/${user._id}`}>
                                                            <button style={{ padding: '0.4rem', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--blue-highlight)', borderRadius: '6px' }} title="Editar">
                                                                <FiEdit size={16} />
                                                            </button>
                                                        </Link>
                                                        <button
                                                            onClick={() => openSingleDeleteModal(user)}
                                                            disabled={isMe}
                                                            style={{
                                                                padding: '0.4rem',
                                                                background: isMe ? '#f3f4f6' : 'rgba(239, 68, 68, 0.1)',
                                                                color: isMe ? '#9ca3af' : 'var(--danger)',
                                                                borderRadius: '6px',
                                                                cursor: isMe ? 'not-allowed' : 'pointer'
                                                            }}
                                                            title={isMe ? "Não pode eliminar o seu próprio utilizador" : "Eliminar utilizador"}
                                                        >
                                                            <FiTrash2 size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={['owner', 'admin', 'super_admin'].includes(currentUser?.role) ? "6" : "5"} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum utilizador encontrado.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Confirmação de Eliminação em Lote */}
            <Modal
                isOpen={batchModal.open}
                onClose={() => !deleting && setBatchModal({ open: false, isAll: false })}
                title={`Eliminar ${selectedUserIds.length} Utilizador(es)?`}
                type="error"
            >
                <div style={{ textAlign: 'left', marginTop: '0.5rem' }}>
                    <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        Tem a certeza de que deseja eliminar permanentemente os <strong>{selectedUserIds.length} utilizadores</strong> selecionados?
                        Esta ação removerá o acesso ao sistema e não pode ser desfeita.
                    </p>

                    <div style={{
                        maxHeight: '160px',
                        overflowY: 'auto',
                        padding: '0.75rem',
                        background: 'var(--bg-main)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-light)',
                        marginBottom: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.4rem'
                    }}>
                        {selectedUsersObjects.map(u => (
                            <div key={u._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                                <span style={{ fontWeight: 600 }}>{u.name}</span>
                                <span style={{ color: 'var(--text-muted)' }}>{u.email || u.phone} ({getRoleLabel(u.role)})</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setBatchModal({ open: false, isAll: false })}
                            disabled={deleting}
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            className="btn-danger"
                            onClick={handleConfirmBatchDelete}
                            disabled={deleting}
                            style={{
                                background: '#dc2626',
                                color: '#fff',
                                borderColor: '#b91c1c',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <FiTrash2 /> {deleting ? 'A eliminar...' : `Sim, Eliminar ${selectedUserIds.length} Utilizador(es)`}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Modal de Confirmação de Eliminação Individual */}
            <Modal
                isOpen={singleDeleteModal.open}
                onClose={() => !deleting && setSingleDeleteModal({ open: false, user: null })}
                title="Eliminar Utilizador"
                type="error"
            >
                <div style={{ textAlign: 'left', marginTop: '0.5rem' }}>
                    <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        Tem a certeza de que deseja eliminar o utilizador <strong>{singleDeleteModal.user?.name}</strong> ({singleDeleteModal.user?.email || singleDeleteModal.user?.phone})?
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setSingleDeleteModal({ open: false, user: null })}
                            disabled={deleting}
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            className="btn-danger"
                            onClick={handleConfirmSingleDelete}
                            disabled={deleting}
                            style={{
                                background: '#dc2626',
                                color: '#fff',
                                borderColor: '#b91c1c',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <FiTrash2 /> {deleting ? 'A eliminar...' : 'Sim, Eliminar'}
                        </button>
                    </div>
                </div>
            </Modal>
        </Layout>
    );
};

export default UserList;
