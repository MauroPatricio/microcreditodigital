import React, { useState, useEffect, useMemo } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import {
    FiShield,
    FiPlus,
    FiEdit2,
    FiTrash2,
    FiCheck,
    FiX,
    FiInfo,
    FiLock,
    FiAlertCircle,
    FiSearch,
    FiFilter,
    FiUsers,
    FiCheckCircle,
    FiLayers
} from 'react-icons/fi';

const RolesManagement = () => {
    const { user, hasPermission } = useAuth();
    const isSuperAdmin = user?.role === 'super_admin';

    const [roles, setRoles] = useState([]);
    const [catalog, setCatalog] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Filtros e busca
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all'); // all, system, custom

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        approvalLimit: 0,
        isSystem: false,
        permissions: []
    });

    useEffect(() => {
        fetchRolesAndCatalog();
    }, []);

    const fetchRolesAndCatalog = async () => {
        setLoading(true);
        try {
            const [rolesRes, catalogRes] = await Promise.all([
                api.get('/roles'),
                api.get('/roles/permissions-catalog')
            ]);

            if (rolesRes.data.success) {
                setRoles(rolesRes.data.data || []);
            }
            if (catalogRes.data.success) {
                setCatalog(catalogRes.data.catalog || []);
            }
        } catch (error) {
            console.error('Erro ao carregar roles e catálogo:', error);
            setErrorMsg('Erro ao carregar dados dos perfis de acesso.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (roleToEdit = null) => {
        setErrorMsg('');
        setSuccessMsg('');
        if (roleToEdit) {
            setEditingRole(roleToEdit);
            setFormData({
                name: roleToEdit.name || '',
                description: roleToEdit.description || '',
                approvalLimit: roleToEdit.approvalLimit || 0,
                isSystem: Boolean(roleToEdit.isSystem),
                permissions: roleToEdit.permissions || []
            });
        } else {
            setEditingRole(null);
            setFormData({
                name: '',
                description: '',
                approvalLimit: 0,
                isSystem: false,
                permissions: []
            });
        }
        setShowModal(true);
    };

    const handleTogglePermission = (permCode) => {
        setFormData(prev => {
            const current = [...prev.permissions];
            if (current.includes(permCode)) {
                return { ...prev, permissions: current.filter(p => p !== permCode) };
            } else {
                return { ...prev, permissions: [...current, permCode] };
            }
        });
    };

    const handleToggleModule = (moduleActions) => {
        const actionCodes = moduleActions.map(a => a.code);
        const allSelected = actionCodes.every(code => formData.permissions.includes(code));

        setFormData(prev => {
            let current = [...prev.permissions];
            if (allSelected) {
                current = current.filter(code => !actionCodes.includes(code));
            } else {
                actionCodes.forEach(code => {
                    if (!current.includes(code)) current.push(code);
                });
            }
            return { ...prev, permissions: current };
        });
    };

    const handleSaveRole = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            if (editingRole) {
                const res = await api.put(`/roles/${editingRole._id}`, formData);
                if (res.data.success) {
                    setSuccessMsg(`Perfil "${formData.name}" e respetiva descrição atualizados com sucesso!`);
                    setShowModal(false);
                    fetchRolesAndCatalog();
                }
            } else {
                const res = await api.post('/roles', formData);
                if (res.data.success) {
                    setSuccessMsg(`Perfil "${formData.name}" adicionado com sucesso ao sistema!`);
                    setShowModal(false);
                    fetchRolesAndCatalog();
                }
            }
        } catch (error) {
            setErrorMsg(error.response?.data?.message || 'Erro ao guardar perfil.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteRole = async (role) => {
        if (role.slug === 'super_admin') {
            alert('O perfil de Super Administrador é o núcleo do sistema e não pode ser removido.');
            return;
        }

        const confirmMsg = role.isSystem
            ? `ATENÇÃO (Super Admin): Deseja remover o perfil nativo de sistema "${role.name}"? Esta ação eliminará o perfil da plataforma.`
            : `Tem certeza que deseja eliminar o perfil personalizado "${role.name}"?`;

        if (!window.confirm(confirmMsg)) return;

        setDeletingId(role._id);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const res = await api.delete(`/roles/${role._id}`);
            if (res.data.success) {
                setSuccessMsg(res.data.message || `Perfil "${role.name}" eliminado com sucesso!`);
                fetchRolesAndCatalog();
            }
        } catch (error) {
            setErrorMsg(error.response?.data?.message || 'Erro ao eliminar perfil.');
        } finally {
            setDeletingId(null);
        }
    };

    // Filtragem em memória
    const filteredRoles = useMemo(() => {
        return roles.filter(role => {
            const matchesSearch =
                (role.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (role.slug || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (role.description || '').toLowerCase().includes(searchTerm.toLowerCase());

            if (!matchesSearch) return false;

            if (typeFilter === 'system') return role.isSystem;
            if (typeFilter === 'custom') return !role.isSystem;
            return true;
        });
    }, [roles, searchTerm, typeFilter]);

    const systemCount = roles.filter(r => r.isSystem).length;
    const customCount = roles.filter(r => !r.isSystem).length;

    return (
        <div style={{ padding: '24px', maxWidth: '1300px', margin: '0 auto' }}>
            {/* Header Principal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-heading, #0f172a)', display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
                        <FiShield size={28} color="#10b981" /> Gestão de Perfis de Acesso & Permissões (RBAC)
                    </h1>
                    <p style={{ color: '#64748b', marginTop: '6px', fontSize: '14px', lineHeight: '1.5' }}>
                        Descreva as funções e responsabilidades de cada perfil, consulte a matriz de permissões e faça a gestão completa de acessos.
                    </p>
                </div>

                {(isSuperAdmin || hasPermission('roles.manage')) && (
                    <button
                        onClick={() => handleOpenModal()}
                        style={{
                            backgroundColor: '#10b981',
                            color: '#ffffff',
                            padding: '12px 20px',
                            borderRadius: '10px',
                            fontWeight: '700',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <FiPlus size={20} /> Adicionar Novo Perfil
                    </button>
                )}
            </div>

            {/* Banner Exclusivo para o Super Administrador */}
            {isSuperAdmin && (
                <div style={{
                    backgroundColor: '#0f172a',
                    borderRadius: '16px',
                    padding: '20px 24px',
                    color: '#ffffff',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px',
                    border: '1px solid #1e293b',
                    boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.15)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#10b981'
                        }}>
                            <FiShield size={26} />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '16px', fontWeight: '800', color: '#f8fafc' }}>
                                    Painel de Governança Global — Super Admin
                                </span>
                                <span style={{
                                    backgroundColor: '#10b981',
                                    color: '#ffffff',
                                    fontSize: '11px',
                                    fontWeight: '800',
                                    padding: '2px 8px',
                                    borderRadius: '10px',
                                    textTransform: 'uppercase'
                                }}>
                                    Acesso Exclusivo
                                </span>
                            </div>
                            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8', lineHeight: '1.4' }}>
                                Como Super Administrador, tem autorização para <strong>descrever o que cada perfil faz</strong>, ajustar limites e permissões, <strong>adicionar novos perfis</strong> à plataforma e <strong>remover perfis</strong>.
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', padding: '8px 14px', borderRadius: '10px', textAlign: 'center' }}>
                            <div style={{ fontSize: '18px', fontWeight: '800', color: '#38bdf8' }}>{systemCount}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>Perfis de Sistema</div>
                        </div>
                        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', padding: '8px 14px', borderRadius: '10px', textAlign: 'center' }}>
                            <div style={{ fontSize: '18px', fontWeight: '800', color: '#4ade80' }}>{customCount}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>Personalizados</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Alertas de Sucesso e Erro */}
            {errorMsg && (
                <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '14px 18px', borderRadius: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FiAlertCircle size={20} />
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>{errorMsg}</span>
                </div>
            )}

            {successMsg && (
                <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '14px 18px', borderRadius: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FiCheck size={20} />
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>{successMsg}</span>
                </div>
            )}

            {/* Barra de Filtros e Pesquisa */}
            <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '14px',
                padding: '16px 20px',
                marginBottom: '24px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1', minWidth: '260px' }}>
                    <FiSearch size={18} color="#94a3b8" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Pesquisar por perfil, identificador ou funções..."
                        style={{
                            width: '100%',
                            border: 'none',
                            outline: 'none',
                            fontSize: '14px',
                            color: '#1e293b'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiFilter size={16} color="#64748b" style={{ marginRight: '4px' }} />
                    <button
                        onClick={() => setTypeFilter('all')}
                        style={{
                            padding: '6px 14px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '700',
                            border: '1px solid',
                            borderColor: typeFilter === 'all' ? '#10b981' : '#e2e8f0',
                            backgroundColor: typeFilter === 'all' ? '#ecfdf5' : '#ffffff',
                            color: typeFilter === 'all' ? '#047857' : '#64748b',
                            cursor: 'pointer'
                        }}
                    >
                        Todos ({roles.length})
                    </button>
                    <button
                        onClick={() => setTypeFilter('system')}
                        style={{
                            padding: '6px 14px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '700',
                            border: '1px solid',
                            borderColor: typeFilter === 'system' ? '#0284c7' : '#e2e8f0',
                            backgroundColor: typeFilter === 'system' ? '#f0f9ff' : '#ffffff',
                            color: typeFilter === 'system' ? '#0369a1' : '#64748b',
                            cursor: 'pointer'
                        }}
                    >
                        Nativos ({systemCount})
                    </button>
                    <button
                        onClick={() => setTypeFilter('custom')}
                        style={{
                            padding: '6px 14px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '700',
                            border: '1px solid',
                            borderColor: typeFilter === 'custom' ? '#10b981' : '#e2e8f0',
                            backgroundColor: typeFilter === 'custom' ? '#ecfdf5' : '#ffffff',
                            color: typeFilter === 'custom' ? '#047857' : '#64748b',
                            cursor: 'pointer'
                        }}
                    >
                        Personalizados ({customCount})
                    </button>
                </div>
            </div>

            {/* Listagem de Perfis em Grade */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                    <FiLayers size={36} color="#94a3b8" style={{ marginBottom: '12px', animation: 'spin 2s linear infinite' }} />
                    <div style={{ fontSize: '15px', fontWeight: '600' }}>Carregando perfis e catálogo de permissões...</div>
                </div>
            ) : filteredRoles.length === 0 ? (
                <div style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    padding: '50px 20px',
                    textAlign: 'center',
                    border: '1px solid #e2e8f0'
                }}>
                    <FiShield size={44} color="#cbd5e1" style={{ marginBottom: '12px' }} />
                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: '0 0 6px 0' }}>
                        Nenhum perfil encontrado
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 20px 0' }}>
                        {searchTerm ? 'Nenhum resultado corresponde à sua pesquisa.' : 'Ainda não existem perfis cadastrados nesta categoria.'}
                    </p>
                    {isSuperAdmin && (
                        <button
                            onClick={() => handleOpenModal()}
                            style={{
                                backgroundColor: '#10b981',
                                color: '#ffffff',
                                padding: '10px 18px',
                                borderRadius: '8px',
                                fontWeight: '700',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            Criar Primeiro Perfil
                        </button>
                    )}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(370px, 1fr))', gap: '22px' }}>
                    {filteredRoles.map((role) => {
                        const canEdit = isSuperAdmin || (!role.isSystem && hasPermission('roles.manage'));
                        const canDelete = (isSuperAdmin && role.slug !== 'super_admin') || (!role.isSystem && hasPermission('roles.manage'));

                        return (
                            <div
                                key={role._id || role.slug}
                                style={{
                                    backgroundColor: '#ffffff',
                                    borderRadius: '16px',
                                    border: '1px solid #e2e8f0',
                                    padding: '22px',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                                }}
                            >
                                <div>
                                    {/* Topo do Cartão com Badges e Ações */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                                                    {role.name}
                                                </h3>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                                                <span style={{
                                                    fontSize: '11px',
                                                    fontWeight: '700',
                                                    padding: '3px 8px',
                                                    borderRadius: '8px',
                                                    textTransform: 'uppercase',
                                                    backgroundColor: role.isSystem ? '#f0f9ff' : '#ecfdf5',
                                                    color: role.isSystem ? '#0284c7' : '#047857',
                                                    border: `1px solid ${role.isSystem ? '#bae6fd' : '#a7f3d0'}`
                                                }}>
                                                    {role.isSystem ? 'Sistema / Global' : 'Personalizado'}
                                                </span>
                                                <span style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>
                                                    #{role.slug}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Botões de Ação para Super Admin ou Gestores Autorizados */}
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {canEdit && (
                                                <button
                                                    onClick={() => handleOpenModal(role)}
                                                    style={{
                                                        border: '1px solid #e2e8f0',
                                                        background: '#f8fafc',
                                                        padding: '7px 10px',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        color: '#334155',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        fontSize: '12px',
                                                        fontWeight: '600'
                                                    }}
                                                    title={isSuperAdmin ? 'Editar Descrição & Permissões (Super Admin)' : 'Editar Perfil'}
                                                >
                                                    <FiEdit2 size={14} color="#0284c7" />
                                                    <span>Editar</span>
                                                </button>
                                            )}

                                            {canDelete && (
                                                <button
                                                    onClick={() => handleDeleteRole(role)}
                                                    disabled={deletingId === role._id}
                                                    style={{
                                                        border: '1px solid #fecaca',
                                                        background: '#fef2f2',
                                                        padding: '7px 10px',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        color: '#dc2626',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        fontSize: '12px',
                                                        fontWeight: '600'
                                                    }}
                                                    title="Remover Perfil"
                                                >
                                                    <FiTrash2 size={14} color="#dc2626" />
                                                    <span>{deletingId === role._id ? 'Removendo...' : 'Remover'}</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Bloco: O QUE ESTE PERFIL FAZ */}
                                    <div style={{
                                        backgroundColor: '#f8fafc',
                                        borderRadius: '12px',
                                        padding: '12px 14px',
                                        border: '1px solid #f1f5f9',
                                        marginBottom: '16px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                            <FiInfo size={14} color="#0284c7" />
                                            <span style={{ fontSize: '11px', fontWeight: '800', color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                                O que este perfil faz
                                            </span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '13px', color: '#334155', lineHeight: '1.5' }}>
                                            {role.description || (
                                                <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                                                    Sem descrição detalhada. {isSuperAdmin && 'Clique em "Editar" para descrever as responsabilidades.'}
                                                </span>
                                            )}
                                        </p>
                                    </div>

                                    {/* Métricas e Alçadas */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '10px',
                                        fontSize: '12px',
                                        paddingTop: '6px',
                                        marginBottom: '10px'
                                    }}>
                                        <div style={{ backgroundColor: '#ffffff', padding: '10px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                                            <span style={{ color: '#64748b', display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '2px' }}>
                                                Alçada de Aprovação
                                            </span>
                                            <span style={{ color: '#0f172a', fontWeight: '800', fontSize: '13px' }}>
                                                {role.approvalLimit && role.approvalLimit > 0
                                                    ? `${role.approvalLimit.toLocaleString('pt-MZ')} MT`
                                                    : (role.slug === 'super_admin' || role.slug === 'owner' ? 'Ilimitado / Total' : 'Sem Alçada')}
                                            </span>
                                        </div>

                                        <div style={{ backgroundColor: '#ffffff', padding: '10px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                                            <span style={{ color: '#64748b', display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '2px' }}>
                                                Matriz de Acesso
                                            </span>
                                            <span style={{ color: '#0f172a', fontWeight: '800', fontSize: '13px' }}>
                                                {role.permissions?.includes('*')
                                                    ? 'Acesso Global (*)'
                                                    : `${role.permissions?.length || 0} permissões ativas`}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal de Adicionar / Editar Perfil */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.65)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000,
                    padding: '20px'
                }}>
                    <div style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '18px',
                        maxWidth: '800px',
                        width: '100%',
                        maxHeight: '92vh',
                        overflowY: 'auto',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        padding: '28px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
                            <div>
                                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                                    {editingRole ? `Editar Perfil: ${editingRole.name}` : 'Adicionar Novo Perfil de Acesso'}
                                </h2>
                                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                                    {isSuperAdmin
                                        ? 'Como Super Admin, pode descrever as funções, limites e permissões atribuídas a este perfil.'
                                        : 'Configure os dados do perfil personalizado da sua instituição.'}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}
                            >
                                <FiX size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveRole}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                                        Nome do Perfil *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Ex: Gestor de Risco Sénior, Auditor Regional"
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                                        Limite de Aprovação (MT)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.approvalLimit}
                                        onChange={(e) => setFormData({ ...formData, approvalLimit: Number(e.target.value) })}
                                        placeholder="Ex: 50000 (0 = Sem alçada)"
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                                    />
                                </div>
                            </div>

                            {/* Campo de Descrição Detalhada: O que este perfil faz */}
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                                    O que este perfil faz (Descrição de Funções & Responsabilidades) *
                                </label>
                                <textarea
                                    rows="3"
                                    required
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Descreva detalhadamente o escopo de atuação, responsabilidades no fluxo de crédito (ex: triagem, parecer, aprovação, cobrança), obrigações de compliance e limites deste cargo..."
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', lineHeight: '1.4' }}
                                />
                                <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                                    Esta descrição é visível para os gestores e orienta as equipas sobre o escopo de atuação do perfil.
                                </span>
                            </div>

                            {/* Opção Super Admin: Definir como perfil de sistema / global */}
                            {isSuperAdmin && !editingRole && (
                                <div style={{
                                    backgroundColor: '#f0f9ff',
                                    border: '1px solid #bae6fd',
                                    padding: '12px 16px',
                                    borderRadius: '10px',
                                    marginBottom: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}>
                                    <input
                                        type="checkbox"
                                        id="isSystemRoleCheck"
                                        checked={formData.isSystem}
                                        onChange={(e) => setFormData({ ...formData, isSystem: e.target.checked })}
                                        style={{ width: '16px', height: '16px', accentColor: '#0284c7' }}
                                    />
                                    <label htmlFor="isSystemRoleCheck" style={{ fontSize: '13px', color: '#0369a1', fontWeight: '700', cursor: 'pointer' }}>
                                        Registar como Perfil Nativo Global do Sistema (Disponível para todas as instituições)
                                    </label>
                                </div>
                            )}

                            {/* Matriz de Permissões */}
                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                    <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                                        Matriz de Permissões por Módulo
                                    </h3>
                                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                                        {formData.permissions.length} permissões selecionadas
                                    </span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
                                    {catalog.map((mod) => {
                                        const allActionCodes = mod.actions.map(a => a.code);
                                        const isAllSelected = allActionCodes.every(code => formData.permissions.includes(code));

                                        return (
                                            <div
                                                key={mod.module}
                                                style={{
                                                    backgroundColor: '#f8fafc',
                                                    padding: '14px',
                                                    borderRadius: '12px',
                                                    border: '1px solid #e2e8f0'
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                    <span style={{ fontWeight: '800', fontSize: '13px', color: '#0f172a' }}>
                                                        {mod.name}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleModule(mod.actions)}
                                                        style={{
                                                            border: 'none',
                                                            background: 'transparent',
                                                            color: '#10b981',
                                                            fontSize: '12px',
                                                            fontWeight: '700',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        {isAllSelected ? 'Desmarcar Todos' : 'Selecionar Todos'}
                                                    </button>
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '8px' }}>
                                                    {mod.actions.map((act) => {
                                                        const checked = formData.permissions.includes(act.code);
                                                        return (
                                                            <label
                                                                key={act.code}
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '8px',
                                                                    fontSize: '12px',
                                                                    color: checked ? '#0f172a' : '#475569',
                                                                    fontWeight: checked ? '700' : '500',
                                                                    cursor: 'pointer',
                                                                    padding: '7px 10px',
                                                                    backgroundColor: checked ? '#ffffff' : 'transparent',
                                                                    borderRadius: '8px',
                                                                    border: checked ? '1px solid #cbd5e1' : '1px solid transparent'
                                                                }}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={checked}
                                                                    onChange={() => handleTogglePermission(act.code)}
                                                                    style={{ accentColor: '#10b981' }}
                                                                />
                                                                {act.name}
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Botões de Ação do Modal */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '18px', borderTop: '1px solid #e2e8f0' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    style={{
                                        padding: '10px 18px',
                                        borderRadius: '10px',
                                        border: '1px solid #cbd5e1',
                                        background: '#ffffff',
                                        color: '#475569',
                                        fontWeight: '700',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    style={{
                                        padding: '10px 22px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: '#10b981',
                                        color: '#ffffff',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)'
                                    }}
                                >
                                    {saving ? 'Guardando...' : (editingRole ? 'Guardar Alterações' : 'Criar Perfil')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RolesManagement;
