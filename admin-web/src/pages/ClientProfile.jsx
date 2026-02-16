import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import api from '../api';
import {
    FiArrowLeft, FiUser, FiPhone, FiMail, FiMapPin,
    FiCalendar, FiTrendingUp, FiShield, FiFileText,
    FiCheckCircle, FiXCircle, FiPlus, FiDownload, FiActivity,
    FiUserCheck, FiBriefcase, FiDollarSign,
    FiEdit3, FiFile, FiFolder, FiLayers, FiAlertCircle
} from 'react-icons/fi';

const ClientProfile = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [credits, setCredits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [docType, setDocType] = useState('identity_card');

    const getDocIcon = (type) => {
        const iconStyle = { color: 'var(--accent)', filter: 'drop-shadow(0 0 3px rgba(0, 255, 0, 0.2))' };
        switch (type) {
            case 'identity_card': return <FiShield size={22} style={iconStyle} />;
            case 'proof_of_address': return <FiMapPin size={22} style={iconStyle} />;
            case 'income_proof': return <FiDollarSign size={22} style={iconStyle} />;
            case 'contract': return <FiEdit3 size={22} style={iconStyle} />;
            default: return <FiFile size={22} style={iconStyle} />;
        }
    };

    useEffect(() => {
        const fetchClientData = async () => {
            try {
                const res = await api.get(`/clients/${id}`);
                if (res.data.success) {
                    setClient(res.data.data.client);
                    setCredits(res.data.data.credits);
                }
            } catch (error) {
                console.error("Error fetching client details", error);
            } finally {
                setLoading(false);
            }
        };

        fetchClientData();
    }, [id]);

    const handleVerify = async () => {
        try {
            const res = await api.put(`/clients/${id}/verify`);
            if (res.data.success) {
                setClient({ ...client, isVerified: true });
            }
        } catch (error) {
            console.error("Error verifying client", error);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
            setShowUploadModal(true);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('document', selectedFile);
        formData.append('type', docType);

        try {
            const res = await api.post(`/clients/${id}/documents`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                // Atualizar estado local com o novo documento
                setClient({
                    ...client,
                    documents: [...(client.documents || []), res.data.data.document]
                });
                setShowUploadModal(false);
                setSelectedFile(null);
            }
        } catch (error) {
            console.error("Error uploading document:", error);
            alert(t('client_profile.upload_error') + ": " + (error.response?.data?.message || error.message));
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <Layout><div style={{ color: 'var(--accent)' }}>{t('common.loading')}</div></Layout>;
    if (!client) return <Layout><div>{t('client_profile.no_client')}</div></Layout>;

    return (
        <Layout>
            <div style={{ marginBottom: '2rem' }}>
                <button
                    onClick={() => navigate('/clients')}
                    style={{
                        background: 'none', border: 'none', color: 'var(--text-muted)',
                        display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem',
                        fontSize: '0.9rem', fontWeight: 600
                    }}
                >
                    <FiArrowLeft /> {t('common.back')}
                </button>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '24px', background: 'var(--primary-light)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 800, color: 'var(--accent)'
                        }}>{client.name?.charAt(0)}</div>
                        <div>
                            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.25rem' }}>{client.name}</h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{t('client_profile.id')}: {client._id.slice(-8).toUpperCase()}</span>
                                {client.isVerified ? (
                                    <span style={{ color: 'var(--success)', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <FiCheckCircle /> {t('client_profile.verified')}
                                    </span>
                                ) : (
                                    <button onClick={handleVerify} style={{
                                        background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent)', border: 'none', padding: '0.25rem 0.75rem',
                                        borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700
                                    }}>{t('client_profile.verify_now')}</button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Link to={`/clients/${id}/request-credit`}>
                            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FiPlus /> {t('client_profile.new_loan')}
                            </button>
                        </Link>
                        <button style={{
                            padding: '0.75rem 1.25rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(255,255,255,0.02)', color: 'white', fontWeight: 600
                        }}>{t('client_profile.generate_report')}</button>
                        <button
                            onClick={() => navigate(`/clients/${id}/request-credit`)}
                            className="btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <FiPlus /> Solicitar Empréstimo
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                {/* Lado Esquerdo - Info Pessoal */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="card">
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FiUser style={{ color: 'var(--accent)' }} /> {t('client_profile.personal_info')}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <FiPhone style={{ color: 'var(--text-muted)' }} />
                                <div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('client_profile.phone')}</p>
                                    <p style={{ fontWeight: 600 }}>{client.phone}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <FiMail style={{ color: 'var(--text-muted)' }} />
                                <div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('client_profile.email')}</p>
                                    <p style={{ fontWeight: 600 }}>{client.email}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <FiShield style={{ color: 'var(--text-muted)' }} />
                                <div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('client_profile.identity')}</p>
                                    <p style={{ fontWeight: 600 }}>{client.identityDocument}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <FiCalendar style={{ color: 'var(--text-muted)' }} />
                                <div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('client_profile.birth_date')}</p>
                                    <p style={{ fontWeight: 600 }}>{new Date(client.dateOfBirth).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <FiMapPin style={{ color: 'var(--text-muted)' }} />
                                <div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('client_profile.address')}</p>
                                    <p style={{ fontWeight: 600 }}>{client.address?.street}, {client.address?.city}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ background: 'linear-gradient(180deg, var(--bg-card) 0%, rgba(59, 130, 246, 0.05) 100%)' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FiTrendingUp style={{ color: 'var(--accent)' }} /> {t('client_profile.risk_profile')}
                        </h3>
                        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                            <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--accent)', marginBottom: '0.5rem' }}>{client.creditScore}</div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{t('client_profile.credit_score')} {t('client_profile.score_range')}</p>
                            <div style={{
                                padding: '0.5rem', borderRadius: '8px',
                                background: client.riskProfile === 'low' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                color: client.riskProfile === 'low' ? 'var(--success)' : 'var(--warning)',
                                fontWeight: 700, fontSize: '0.85rem'
                            }}>
                                {t('client_profile.risk')}: {client.riskProfile?.toUpperCase()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lado Direito - Finanças e Documentos */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="card">
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FiBriefcase style={{ color: 'var(--accent)' }} /> {t('client_profile.loan_history')}
                        </h3>
                        {credits.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {credits.map(credit => (
                                    <div key={credit._id} style={{
                                        padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                    }}>
                                        <div>
                                            <p style={{ fontWeight: 700, fontSize: '1rem' }}>{credit.amount.toLocaleString()} MT</p>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{credit.term} meses | {credit.purpose}</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{
                                                display: 'block', fontSize: '0.75rem', fontWeight: 700,
                                                color: credit.contractStatus === 'signed' ? 'var(--success)' : 'var(--warning)',
                                                textTransform: 'uppercase', marginBottom: '0.25rem'
                                            }}>{t('client_profile.contract')}: {t(`client_profile.contract_status.${credit.contractStatus}`)}</span>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const res = await api.post(`/credits/${credit._id}/generate-contract`, { templateName: 'standard_loan' });
                                                        if (res.data.success) {
                                                            alert(t('client_profile.contract_success'));
                                                            window.location.reload();
                                                        }
                                                    } catch (err) {
                                                        alert(t('common.error') + ': ' + (err.response?.data?.message || err.message));
                                                    }
                                                }}
                                                style={{ fontSize: '0.7rem', color: 'var(--accent)', background: 'none', border: 'none', padding: 0, textDecoration: 'underline', cursor: 'pointer' }}
                                            >
                                                {credit.contractStatus === 'draft' ? t('client_profile.generate_and_send') : t('client_profile.resend')}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                <FiLayers style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.3 }} />
                                <p>{t('client_profile.no_loans')}</p>
                            </div>
                        )}
                    </div>

                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <FiFolder style={{ color: 'var(--accent)', opacity: 0.8 }} /> {t('client_profile.documentation')}
                            </h3>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="file"
                                    id="doc-upload"
                                    style={{ display: 'none' }}
                                    onChange={handleFileChange}
                                    accept=".pdf,.jpg,.jpeg,.png"
                                />
                                <button
                                    className="btn-icon"
                                    title={t('client_profile.upload_manual')}
                                    onClick={() => document.getElementById('doc-upload').click()}
                                    disabled={uploading}
                                >
                                    <FiPlus />
                                </button>
                            </div>
                        </div>
                        {client.documents?.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                {client.documents.map(doc => (
                                    <div key={doc._id} style={{
                                        padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{
                                                width: '52px', height: '52px', borderRadius: '14px',
                                                background: 'rgba(255, 255, 255, 0.03)',
                                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                boxShadow: 'inset 0 0 12px rgba(255, 255, 255, 0.02)'
                                            }}>
                                                {getDocIcon(doc.type)}
                                            </div>
                                            <div>
                                                <p style={{ fontSize: '0.95rem', fontWeight: 800, color: 'white' }}>{t(`client_profile.doc_types.${doc.type}`)}</p>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                                                    {doc.isVerified ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--success)', fontSize: '0.75rem', fontWeight: 700 }}>
                                                            <FiCheckCircle size={14} /> <span>{t('client_profile.doc_status.verified')}</span>
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--warning)', fontSize: '0.75rem', fontWeight: 700 }}>
                                                            <FiAlertCircle size={14} /> <span>{t('client_profile.doc_status.pending')}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => window.open(`${api.defaults.baseURL}/documents/${doc._id}/download`, '_blank')}
                                            className="btn-icon"
                                            style={{
                                                width: '36px', height: '36px', borderRadius: '10px',
                                                background: 'rgba(255, 255, 255, 0.05)', color: 'white',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}
                                        >
                                            <FiDownload size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                <FiFileText style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.3 }} />
                                <p>{t('client_profile.no_documents')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de Upload */}
            {showUploadModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, backdropFilter: 'blur(10px)'
                }}>
                    <div className="card glass" style={{ width: '400px', padding: '2rem' }}>
                        <h3 style={{ marginBottom: '1.5rem', fontWeight: 800 }}>{t('client_profile.upload_title')}</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                            {t('client_profile.file')}: <strong>{selectedFile?.name}</strong>
                        </p>

                        <div className="form-group" style={{ marginBottom: '2rem' }}>
                            <label>{t('client_profile.doc_type')}</label>
                            <select
                                value={docType}
                                onChange={(e) => setDocType(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                            >
                                {Object.keys(t('client_profile.doc_types', { returnObjects: true })).map(key => (
                                    <option key={key} value={key}>{t(`client_profile.doc_types.${key}`)}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                className="btn-secondary"
                                style={{ flex: 1 }}
                                onClick={() => setShowUploadModal(false)}
                                disabled={uploading}
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                className="btn-primary"
                                style={{ flex: 1 }}
                                onClick={handleUpload}
                                disabled={uploading}
                            >
                                {uploading ? t('client_profile.uploading') : t('common.confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default ClientProfile;
