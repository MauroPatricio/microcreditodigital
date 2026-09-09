import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { FiShield, FiPlus, FiEdit2, FiTrash2, FiCheck, FiX, FiInfo, FiLock, FiAlertCircle } from 'react-icons/fi';

const RolesManagement = () => {
    const { hasPermission } = useAuth();
    const [roles, setRoles] = useState([]);
    const [catalog, setCatalog] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        approvalLimit: 0,
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
                setRoles(rolesRes.data.data);
            }
            if (catalogRes.data.success) {
                setCatalog(catalogRes.data.catalog);
            }
        } catch (error) {
            console.error('Erro ao carregar roles e catálogo:', error);
            setErrorMsg('Erro ao carregar dados dos perfis.');
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
                name: roleToEdit.name,
                description: roleToEdit.description || '',
                approvalLimit: roleToEdit.approvalLimit || 0,
                permissions: roleToEdit.permissions || []
            });
        } else {
            setEditingRole(null);
            setFormData({
                name: '',
                description: '',
                approvalLimit: 0,
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
                    setSuccessMsg('Perfil atualizado com sucesso!');
                    setShowModal(false);
                    fetchRolesAndCatalog();
                }
            } else {
                const res = await api.post('/roles', formData);
                if (res.data.success) {
                    setSuccessMsg('Perfil criado com sucesso!');
                    setShowModal(false);
                    fetchRolesAndCatalog();
                }
            }
        } catch (error) {
            setErrorMsg(error.response?.data?.message || 'Erro ao guardar perfil');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteRole = async (roleId) => {
        if (!window.confirm('Tem a certeza que deseja eliminar este perfil personalizado?')) return;
        try {
            const res = await api.delete(`/roles/${roleId}`);
            if (res.data.success) {
                setSuccessMsg('Perfil eliminado com sucesso');
                fetchRolesAndCatalog();
            }
        } catch (error) {
            setErrorMsg(error.response?.data?.message || 'Erro ao eliminar perfil');
        }
    };

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-heading, #0f172a)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FiShield color="var(--primary, #10b981)" /> Gestão de Perfis & Permissões (RBAC)
                    </h1>
                    <p style={{ color: '#64748b', marginTop: '4px', fontSize: '14px' }}>
                        Configure roles personalizadas, matrizes de acesso granulares e limites de aprovação de crédito.
                    </p>
                </div>

                {hasPermission('roles.manage') && (
                    <button
                        onClick={() => handleOpenModal()}
                        style={{
                            backgroundColor: '#10b981',
                            color: '#ffffff',
                            padding: '10px 18px',
                            borderRadius: '8px',
                            fontWeight: '600',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <FiPlus size={18} /> Criar Novo Perfil
                    </button>
                )}
            </div>

            {errorMsg && (
                <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FiAlertCircle size={20} />
                    <span>{errorMsg}</span>
                </div>
            )}

            {successMsg && (
                <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FiCheck size={20} />
                    <span>{successMsg}</span>
                </div>
            )}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Carregando perfis e permissões...</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                    {roles.map((role) => (
                        <div
                            key={role._id || role.slug}
                            style={{
                                backgroundColor: '#ffffff',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                padding: '20px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between'
                            }}
                        >
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>{role.name}</h3>
                                        <span style={{
                                            fontSize: '11px',
                                            fontWeight: '700',
                                            padding: '2px 8px',
                                            borderRadius: '12px',
                                            textTransform: 'uppercase',
                                            backgroundColor: role.isSystem ? '#e0f2fe' : '#f0fdf4',
                                            color: role.isSystem ? '#0369a1' : '#15803d',
                                            marginTop: '6px',
                                            display: 'inline-block'
                                        }}>
                                            {role.isSystem ? 'Perfil Nativo' : 'Perfil Personalizado'}
                                        </span>
                                    </div>
                                    {!role.isSystem && hasPermission('roles.manage') && (
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <button
                                                onClick={() => handleOpenModal(role)}
                                                style={{ border: 'none', background: '#f1f5f9', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', color: '#334155' }}
                                                title="Editar Perfil"
                                            >
                                                <FiEdit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteRole(role._id)}
                                                style={{ border: 'none', background: '#fef2f2', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer', color: '#ef4444' }}
                                                title="Eliminar Perfil"
                                            >
                                                <FiTrash2 size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px', lineHeight: '1.4' }}>
                                    {role.description || 'Sem descrição cadastrada.'}
                                </p>

                                <div style={{ fontSize: '12px', backgroundColor: '#f8fafc', padding: '10px 12px', borderRadius: '8px', marginBottom: '14px', border: '1px solid #f1f5f9' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{ color: '#475569', fontWeight: '600' }}>Limite de Aprovação:</span>
                                        <span style={{ color: '#0f172a', fontWeight: '700' }}>
                                            {role.approvalLimit && role.approvalLimit > 0
                                                ? `${role.approvalLimit.toLocaleString()} MT`
                                                : (role.slug === 'super_admin' || role.slug === 'owner' ? 'Sem Limite' : 'Não Autorizado')}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#475569', fontWeight: '600' }}>Total de Permissões:</span>
                                        <span style={{ color: '#0f172a', fontWeight: '700' }}>
                                            {role.permissions?.includes('*') ? 'Acesso Total (*)' : `${role.permissions?.length || 0} ativas`}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de Criação / Edição de Perfil */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px'
                }}>
                    <div style={{
                        backgroundColor: '#ffffff', borderRadius: '16px', maxWidth: '750px', width: '100%',
                        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        padding: '24px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', pb: '12px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                                {editingRole ? `Editar Perfil: ${editingRole.name}` : 'Criar Perfil Personalizado'}
                            </h2>
                            <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}>
                                <FiX size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveRole}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Nome do Perfil *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Ex: Gestor Regional, Analista Sénior"
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Limite de Aprovação (MT)</label>
                                    <input
                                        type="number"
                                        value={formData.approvalLimit}
                                        onChange={(e) => setFormData({ ...formData, approvalLimit: Number(e.target.value) })}
                                        placeholder="Ex: 50000 (0 = Sem limite)"
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Descrição</label>
                                <textarea
                                    rows="2"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Descrição das responsabilidades deste perfil..."
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                                />
                            </div>

                            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                                Matriz de Permissões por Módulo
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                                {catalog.map((mod) => {
                                    const allActionCodes = mod.actions.map(a => a.code);
                                    const isAllSelected = allActionCodes.every(code => formData.permissions.includes(code));

                                    return (
                                        <div key={mod.module} style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                <span style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>{mod.name}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleModule(mod.actions)}
                                                    style={{ border: 'none', background: 'transparent', color: '#10b981', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                                                >
                                                    {isAllSelected ? 'Desmarcar Todos' : 'Selecionar Todos'}
                                                </button>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
                                                {mod.actions.map((act) => {
                                                    const checked = formData.permissions.includes(act.code);
                                                    return (
                                                        <label
                                                            key={act.code}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '8px',
                                                                fontSize: '13px',
                                                                color: '#334155',
                                                                cursor: 'pointer',
                                                                padding: '6px',
                                                                backgroundColor: checked ? '#ffffff' : 'transparent',
                                                                borderRadius: '6px',
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

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#10b981', color: '#ffffff', fontWeight: '600', cursor: 'pointer' }}
                                >
                                    {saving ? 'Guardando...' : 'Guardar Perfil'}
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
