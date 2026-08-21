import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api';
import { FiSave, FiArrowLeft, FiEye, FiEyeOff } from 'react-icons/fi';

const UserForm = () => {
    const { id } = useParams();
    const isEditing = !!id;
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        identityDocument: '',
        role: 'agent',
        isActive: true,
        isPublicServant: false,
        company: '',
        guarantorName: '',
        guarantorDocument: '',
        guarantorPhone: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isEditing) {
            fetchUser();
        }
    }, [id]);

    const fetchUser = async () => {
        try {
            const res = await api.get(`/users/${id}`);
            if (res.data.success) {
                const u = res.data.data;
                setFormData({
                    name: u.name || '',
                    email: u.email || '',
                    phone: u.phone || '',
                    password: '', // Não preencher a senha
                    identityDocument: u.identityDocument || '',
                    role: u.role || 'agent',
                    isActive: !u.isBlocked,
                    isPublicServant: u.professionalInfo?.employmentStatus === 'civil_servant',
                    company: u.professionalInfo?.employer || '',
                    guarantorName: u.guarantor?.name || '',
                    guarantorDocument: u.guarantor?.documentNumber || '',
                    guarantorPhone: u.guarantor?.phone || ''
                });
            }
        } catch (err) {
            setError('Erro ao carregar utilizador.');
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const dataToSubmit = { ...formData, isBlocked: !formData.isActive };

            if (formData.role === 'client') {
                if (!formData.guarantorName || !formData.guarantorDocument || !formData.guarantorPhone) {
                    setError('Para clientes, os dados do garante são obrigatórios.');
                    setLoading(false);
                    return;
                }
                if (formData.isPublicServant && !formData.company) {
                    setError('Por favor, informe a instituição pública/ministério.');
                    setLoading(false);
                    return;
                }

                dataToSubmit.guarantor = {
                    name: formData.guarantorName,
                    documentNumber: formData.guarantorDocument,
                    phone: formData.guarantorPhone,
                    relationship: 'Outro'
                };
                
                dataToSubmit.professionalInfo = {
                    employmentStatus: formData.isPublicServant ? 'civil_servant' : 'employed',
                    employer: formData.company
                };
            }

            if (isEditing) {
                if (!dataToSubmit.password) delete dataToSubmit.password;
                await api.put(`/users/${id}`, dataToSubmit);
            } else {
                await api.post('/users', dataToSubmit);
            }
            navigate('/users');
        } catch (err) {
            setError(err.response?.data?.message || 'Ocorreu um erro ao guardar o utilizador.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate('/users')} style={{ background: 'var(--bg-main)', border: '1px solid var(--border-light)', padding: '0.5rem', borderRadius: '8px', color: 'var(--text-main)' }}>
                    <FiArrowLeft size={20} />
                </button>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
                        {isEditing ? 'Editar Utilizador' : 'Novo Utilizador'}
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>Preencha os dados do utilizador abaixo.</p>
                </div>
            </div>

            <div className="card" style={{ maxWidth: '800px' }}>
                {error && (
                    <div style={{ padding: '1rem', background: 'rgba(220, 38, 38, 0.1)', color: 'var(--danger)', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid rgba(220, 38, 38, 0.2)' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label>Nome Completo</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Nome completo" />
                        </div>
                        <div>
                            <label>Email</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="email@exemplo.com" />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label>Telefone</label>
                            <input type="text" name="phone" value={formData.phone} onChange={handleChange} required placeholder="+258..." />
                        </div>
                        <div>
                            <label>BI ou Documento</label>
                            <input type="text" name="identityDocument" value={formData.identityDocument} onChange={handleChange} required={!isEditing} placeholder="Número do BI" />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label>Perfil de Acesso</label>
                            <select name="role" value={formData.role} onChange={handleChange} required>
                                <option value="admin">Administrador do Sistema</option>
                                <option value="manager">Gestor</option>
                                <option value="representative">Representante Comercial</option>
                                <option value="supervisor">Supervisor</option>
                                <option value="agent">Agente</option>
                                <option value="client">Cliente</option>
                            </select>
                        </div>
                        <div>
                            <label>Palavra-passe {isEditing && '(Opcional)'}</label>
                            <div style={{ position: 'relative' }}>
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    name="password" 
                                    value={formData.password} 
                                    onChange={handleChange} 
                                    required={!isEditing} 
                                    placeholder={isEditing ? 'Preencher para alterar' : 'Senha segura'} 
                                    minLength="6" 
                                    style={{ paddingRight: '3rem', width: '100%' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '0.5rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--text-muted)',
                                        cursor: 'pointer',
                                        padding: '0.5rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        transition: 'color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                                >
                                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {formData.role === 'client' && (
                        <div style={{ marginTop: '1rem', padding: '1.5rem', background: 'var(--bg-main)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)' }}>Dados Adicionais do Cliente</h3>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                <input 
                                    type="checkbox" 
                                    name="isPublicServant" 
                                    checked={formData.isPublicServant} 
                                    onChange={handleChange} 
                                    style={{ width: 'auto', transform: 'scale(1.2)' }} 
                                    id="isPublicServantCheckbox"
                                />
                                <label htmlFor="isPublicServantCheckbox" style={{ margin: 0, textTransform: 'none', letterSpacing: 0, fontSize: '0.9rem', cursor: 'pointer', fontWeight: 600 }}>
                                    É Funcionário Público?
                                </label>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label>{formData.isPublicServant ? 'Instituição / Ministério onde trabalha *' : 'Empresa / Instituição (Opcional)'}</label>
                                <input 
                                    type="text" 
                                    name="company" 
                                    value={formData.company} 
                                    onChange={handleChange} 
                                    placeholder={formData.isPublicServant ? 'Ex: Ministério da Educação' : 'Ex: Empresa Privada'} 
                                    required={formData.isPublicServant}
                                />
                            </div>

                            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--primary)', marginTop: '1.5rem' }}>Dados do Garante *</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem' }}>
                                <div>
                                    <label>Nome do Garante *</label>
                                    <input type="text" name="guarantorName" value={formData.guarantorName} onChange={handleChange} required placeholder="Nome completo" />
                                </div>
                                <div>
                                    <label>Número do BI *</label>
                                    <input type="text" name="guarantorDocument" value={formData.guarantorDocument} onChange={handleChange} required placeholder="Número do documento" />
                                </div>
                            </div>
                            <div>
                                <label>Telemóvel do Garante *</label>
                                <input type="text" name="guarantorPhone" value={formData.guarantorPhone} onChange={handleChange} required placeholder="+258..." />
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <input 
                            type="checkbox" 
                            name="isActive" 
                            checked={formData.isActive} 
                            onChange={handleChange} 
                            style={{ width: 'auto', transform: 'scale(1.2)' }} 
                            id="isActiveCheckbox"
                        />
                        <label htmlFor="isActiveCheckbox" style={{ margin: 0, textTransform: 'none', letterSpacing: 0, fontSize: '0.9rem', cursor: 'pointer' }}>
                            Utilizador Ativo (Permite acesso ao sistema)
                        </label>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem' }}>
                        <button type="submit" className="btn-primary" disabled={loading} style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FiSave /> {loading ? 'A guardar...' : 'Guardar Utilizador'}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
};

export default UserForm;
