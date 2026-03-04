import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api';
import {
    FiUser, FiBriefcase, FiMapPin, FiUsers,
    FiPieChart, FiCheckCircle, FiChevronRight,
    FiChevronLeft, FiShield, FiActivity
} from 'react-icons/fi';
import Modal from '../components/Modal';

const steps = [
    { id: 1, title: 'Pessoal', icon: <FiUser /> },
    { id: 2, title: 'Profissional', icon: <FiBriefcase /> },
    { id: 3, title: 'Negócio', icon: <FiMapPin /> },
    { id: 4, title: 'Referências', icon: <FiUsers /> },
    { id: 5, title: 'Financeiro', icon: <FiPieChart /> },
    { id: 6, title: 'Revisão', icon: <FiShield /> }
];

const formatDateDisplay = (dateString) => {
    if (!dateString) return 'DD/MM/AAAA';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-MZ');
};

const ClientOnboarding = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'error' });
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        identityDocument: '',
        nuit: '',
        dateOfBirth: '',
        address: {
            street: '',
            city: '',
            province: 'Maputo'
        },
        professionalInfo: {
            employmentStatus: 'employed',
            employerName: '',
            monthlyIncome: 0,
            position: ''
        },
        businessInfo: {
            name: '',
            type: '',
            yearsInOperation: 0,
            monthlyRevenue: 0
        },
        references: [
            { name: '', relationship: '', phone: '' },
            { name: '', relationship: '', phone: '' }
        ],
        password: 'ChangeMe123!' // Default password for new clients
    });

    const handleChange = (e, section = null, index = null) => {
        const { name, value } = e.target;

        if (section) {
            if (index !== null) {
                const newSection = [...formData[section]];
                newSection[index][name] = value;
                setFormData({ ...formData, [section]: newSection });
            } else {
                setFormData({
                    ...formData,
                    [section]: { ...formData[section], [name]: value }
                });
            }
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleNext = () => {
        if (currentStep < 6) setCurrentStep(currentStep + 1);
    };

    const handlePrev = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await api.post('/clients', formData);
            if (res.data.success) {
                navigate(`/clients/${res.data.data.client._id}`);
            }
        } catch (error) {
            console.error("Erro ao cadastrar cliente:", error);
            setModal({
                isOpen: true,
                title: 'Ops! Algo deu errado',
                message: error.response?.data?.message || "Ocorreu um erro ao realizar o cadastro. Verifique os dados e tente novamente.",
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="step-content fadeIn">
                        <h3 className="step-title">Dados Pessoais</h3>
                        <div className="grid-2">
                            <div className="form-group">
                                <label>Nome Completo</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Ex: João Silva" required />
                            </div>
                            <div className="form-group">
                                <label>Email (Opcional)</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="exemplo@email.com" />
                            </div>
                            <div className="form-group">
                                <label>Telefone</label>
                                <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="84XXXXXXX" required />
                            </div>
                            <div className="form-group">
                                <label>Nº BI</label>
                                <input type="text" name="identityDocument" value={formData.identityDocument} onChange={handleChange} placeholder="12XXXXXXXXXX" required />
                            </div>
                            <div className="form-group">
                                <label>Nº NUIT</label>
                                <input type="text" name="nuit" value={formData.nuit} onChange={handleChange} placeholder="1XXXXXXXX" />
                            </div>
                            <div className="form-group">
                                <label>Data de Nascimento</label>
                                <div className="date-input-wrapper" data-date={formatDateDisplay(formData.dateOfBirth)}>
                                    <input
                                        type="date"
                                        name="dateOfBirth"
                                        className="premium-date-input"
                                        value={formData.dateOfBirth}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="step-content fadeIn">
                        <h3 className="step-title">Informação Profissional</h3>
                        <div className="grid-2">
                            <div className="form-group">
                                <label>Status de Emprego</label>
                                <select name="employmentStatus" value={formData.professionalInfo.employmentStatus} onChange={(e) => handleChange(e, 'professionalInfo')}>
                                    <option value="employed">Empregado</option>
                                    <option value="self_employed">Conta Própria / Empreendedor</option>
                                    <option value="unemployed">Desempregado</option>
                                    <option value="retired">Reformado</option>
                                    <option value="civil_servant">Funcionário Público</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Nome do Empregador / Empresa</label>
                                <input type="text" name="employerName" value={formData.professionalInfo.employerName} onChange={(e) => handleChange(e, 'professionalInfo')} />
                            </div>
                            <div className="form-group">
                                <label>Cargo / Função</label>
                                <input type="text" name="position" value={formData.professionalInfo.position} onChange={(e) => handleChange(e, 'professionalInfo')} />
                            </div>
                            <div className="form-group">
                                <label>Renda Mensal (MT)</label>
                                <input type="number" name="monthlyIncome" value={formData.professionalInfo.monthlyIncome} onChange={(e) => handleChange(e, 'professionalInfo')} />
                            </div>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="step-content fadeIn">
                        <h3 className="step-title">Detalhes do Negócio (Se aplicável)</h3>
                        <div className="grid-2">
                            <div className="form-group">
                                <label>Nome do Negócio</label>
                                <input type="text" name="name" value={formData.businessInfo.name} onChange={(e) => handleChange(e, 'businessInfo')} />
                            </div>
                            <div className="form-group">
                                <label>Tipo de Negócio</label>
                                <input type="text" name="type" value={formData.businessInfo.type} onChange={(e) => handleChange(e, 'businessInfo')} placeholder="Ex: Comércio, Agro" />
                            </div>
                            <div className="form-group">
                                <label>Anos de Trabalho</label>
                                <input type="number" name="yearsInOperation" value={formData.businessInfo.yearsInOperation} onChange={(e) => handleChange(e, 'businessInfo')} />
                            </div>
                            <div className="form-group">
                                <label>Faturamento Mensal Médio (MT)</label>
                                <input type="number" name="monthlyRevenue" value={formData.businessInfo.monthlyRevenue} onChange={(e) => handleChange(e, 'businessInfo')} />
                            </div>
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="step-content fadeIn">
                        <h3 className="step-title">Referências Pessoais</h3>
                        {formData.references.map((ref, idx) => (
                            <div key={idx} style={{ marginBottom: '2rem', padding: '1.5rem', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <h4 style={{ marginBottom: '1rem', color: 'var(--accent)', fontSize: '0.9rem', fontWeight: 700 }}>Referência #{idx + 1}</h4>
                                <div className="grid-2">
                                    <div className="form-group">
                                        <label>Nome Completo</label>
                                        <input type="text" name="name" value={ref.name} onChange={(e) => handleChange(e, 'references', idx)} />
                                    </div>
                                    <div className="form-group">
                                        <label>Relação</label>
                                        <input type="text" name="relationship" value={ref.relationship} onChange={(e) => handleChange(e, 'references', idx)} placeholder="Ex: Primo, Amigo" />
                                    </div>
                                    <div className="form-group">
                                        <label>Contactos</label>
                                        <input type="text" name="phone" value={ref.phone} onChange={(e) => handleChange(e, 'references', idx)} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 5:
                return (
                    <div className="step-content fadeIn">
                        <h3 className="step-title">Informações Financeiras & Morada</h3>
                        <div className="grid-2">
                            <div className="form-group">
                                <label>Província</label>
                                <select name="province" value={formData.address.province} onChange={(e) => handleChange(e, 'address')}>
                                    <option value="Maputo">Maputo</option>
                                    <option value="Gaza">Gaza</option>
                                    <option value="Inhambane">Inhambane</option>
                                    <option value="Sofala">Sofala</option>
                                    <option value="Tete">Tete</option>
                                    <option value="Manica">Manica</option>
                                    <option value="Zambézia">Zambézia</option>
                                    <option value="Nampula">Nampula</option>
                                    <option value="Cabo Delgado">Cabo Delgado</option>
                                    <option value="Niassa">Niassa</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Cidade / Distrito</label>
                                <input type="text" name="city" value={formData.address.city} onChange={(e) => handleChange(e, 'address')} />
                            </div>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label>Morada Detalhada</label>
                                <input type="text" name="street" value={formData.address.street} onChange={(e) => handleChange(e, 'address')} placeholder="Bairro, quarteirão, casa nº" />
                            </div>
                        </div>

                        <div className="confidence-preview glass" style={{ marginTop: '2rem', padding: '1.5rem', textAlign: 'center' }}>
                            <FiActivity size={32} color="var(--accent)" style={{ marginBottom: '1rem' }} />
                            <h4 style={{ fontWeight: 800 }}>Simulação de Confiança Inicial</h4>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Com base nos dados fornecidos, o sistema estima um perfil de confiança médio.</p>
                            <div style={{ marginTop: '1rem', fontSize: '2rem', fontWeight: 900, color: 'var(--accent)' }}>50%</div>
                        </div>
                    </div>
                );
            case 6:
                return (
                    <div className="step-content fadeIn" style={{ textAlign: 'center' }}>
                        <div className="success-icon" style={{ fontSize: '4rem', color: 'var(--success)', marginBottom: '1.5rem' }}>
                            <FiCheckCircle />
                        </div>
                        <h3 className="step-title">Tudo Pronto!</h3>
                        <p style={{ marginBottom: '2rem', color: 'var(--text-muted)' }}>
                            Revise os dados abaixo e clique em finalizar para criar o perfil do cliente e iniciar o processo de validação de documentos.
                        </p>
                        <div className="glass" style={{ textAlign: 'left', padding: '1.5rem', marginBottom: '2.5rem' }}>
                            <p><strong>Nome:</strong> {formData.name}</p>
                            <p><strong>Telefone:</strong> {formData.phone}</p>
                            <p><strong>Renda Declarada:</strong> {formData.professionalInfo.monthlyIncome} MT</p>
                            <p><strong>Status de Emprego:</strong> {{
                                employed: 'Empregado',
                                self_employed: 'Conta Própria / Empreendedor',
                                unemployed: 'Desempregado',
                                retired: 'Reformado',
                                civil_servant: 'Funcionário Público',
                                student: 'Estudante'
                            }[formData.professionalInfo.employmentStatus] || formData.professionalInfo.employmentStatus}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            <input type="checkbox" checked readOnly />
                            <span>Declaro que os dados fornecidos são verdadeiros e autorizo a consulta de crédito.</span>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <Layout>
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 0' }}>
                <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-1px', marginBottom: '0.5rem' }}>
                        Onboarding
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>Siga os passos para cadastrar um novo cliente com validação inteligente.</p>
                </header>

                {/* Step Progress Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4rem', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '24px', left: '5%', right: '5%', height: '2px', background: 'var(--bg-main)', zIndex: 0 }}>
                        <div style={{ width: `${((currentStep - 1) / 5) * 100}%`, height: '100%', background: 'var(--accent)', transition: '0.3s' }}></div>
                    </div>
                    {steps.map(step => (
                        <div key={step.id} style={{ zIndex: 1, textAlign: 'center', width: '60px' }}>
                            <div className={`step-circle ${currentStep >= step.id ? 'active' : ''}`} style={{
                                width: '48px', height: '48px', borderRadius: '50%', margin: '0 auto 0.75rem',
                                background: currentStep >= step.id ? 'var(--accent)' : 'var(--bg-card)',
                                border: currentStep >= step.id ? 'none' : '2px solid rgba(255,255,255,0.05)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: '0.3s', color: currentStep >= step.id ? 'white' : 'var(--text-muted)'
                            }}>
                                {currentStep > step.id ? <FiCheckCircle /> : step.icon}
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: currentStep >= step.id ? 'white' : 'var(--text-muted)' }}>{step.title}</span>
                        </div>
                    ))}
                </div>

                <div className="card glass" style={{ padding: '3rem', minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ flexGrow: 1 }}>
                        {renderStep()}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2rem' }}>
                        <button
                            className="btn-secondary"
                            onClick={handlePrev}
                            disabled={currentStep === 1}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <FiChevronLeft /> Anterior
                        </button>

                        {currentStep === 6 ? (
                            <button
                                className="btn-primary"
                                onClick={handleSubmit}
                                disabled={loading}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 2.5rem' }}
                            >
                                {loading ? 'Processando...' : 'Finalizar Cadastro'} <FiCheckCircle />
                            </button>
                        ) : (
                            <button
                                className="btn-primary"
                                onClick={handleNext}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 2.5rem' }}
                            >
                                Próximo <FiChevronRight />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <Modal
                isOpen={modal.isOpen}
                onClose={() => setModal({ ...modal, isOpen: false })}
                title={modal.title}
                message={modal.message}
                type={modal.type}
            />

            <style>{`
                .grid-2 {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1.5rem;
                }
                .step-title {
                    font-size: 1.75rem;
                    font-weight: 900;
                    margin-bottom: 2.5rem;
                    letter-spacing: -0.5px;
                }
                .step-circle {
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                }
                .step-circle.active {
                    box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
                }
                .fadeIn {
                    animation: fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .confidence-preview {
                    border: 1px solid rgba(59, 130, 246, 0.2);
                }
            `}</style>
        </Layout>
    );
};

export default ClientOnboarding;
