import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import api from '../api';
import { FiSearch, FiUserPlus, FiEdit, FiTrash2, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
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
            }
        } catch (error) {
            console.error("Error fetching users", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Tem certeza que deseja eliminar este utilizador?")) {
            try {
                await api.delete(`/users/${id}`);
                fetchUsers();
            } catch (error) {
                alert(error.response?.data?.message || 'Erro ao eliminar utilizador');
            }
        }
    };

    const filteredUsers = users.filter(user => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleLabel = (role) => {
        const roles = {
            'owner': 'Proprietário',
            'super_admin': 'Super Admin',
            'admin': 'Administrador',
            'manager': 'Gestor',
            'representative': 'Representante Comercial',
            'supervisor': 'Supervisor',
            'agent': 'Agente',
            'client': 'Cliente'
        };
        return roles[role] || role;
    };

    return (
        <Layout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Gestão de Utilizadores</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Visualize e gerencie os utilizadores do sistema.</p>
                </div>
                {['owner', 'admin', 'super_admin'].includes(currentUser?.role) && (
                    <Link to="/users/new">
                        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FiUserPlus /> Novo Utilizador
                        </button>
                    </Link>
                )}
            </div>

            <div className="card" style={{ padding: '0' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)', position: 'relative' }}>
                    <FiSearch style={{ position: 'absolute', left: '2.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.75rem 1rem 0.75rem 2.8rem',
                        }}
                    />
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-main)' }}>
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
                                    <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--accent)' }}>Carregando utilizadores...</td>
                                </tr>
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map(user => (
                                    <tr key={user._id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'var(--transition)' }}>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{
                                                    width: '36px', height: '36px', borderRadius: '10px', background: 'var(--primary-light)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white'
                                                }}>{user.name?.charAt(0)}</div>
                                                <div>
                                                    <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{user.name}</p>
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
                                                    <button onClick={() => handleDelete(user._id)} style={{ padding: '0.4rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '6px' }} title="Eliminar">
                                                        <FiTrash2 size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum utilizador encontrado.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};

export default UserList;
