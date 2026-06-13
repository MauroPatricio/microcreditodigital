import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import api from '../api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
    FiArrowLeft, FiUser, FiPhone, FiMail, FiMapPin,
    FiCalendar, FiTrendingUp, FiShield, FiFileText,
    FiCheckCircle, FiXCircle, FiPlus, FiDownload, FiActivity,
    FiUserCheck, FiBriefcase, FiDollarSign,
    FiEdit3, FiFile, FiFolder, FiLayers, FiAlertCircle
} from 'react-icons/fi';
import ConfidenceIndicator from '../components/ConfidenceIndicator';

const ClientProfile = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [credits, setCredits] = useState([]);
    const [simulations, setSimulations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [docType, setDocType] = useState('identity_card');
    const [generatingReport, setGeneratingReport] = useState(false);
    const clientRef = useRef(null);

    const handleGenerateReport = async () => {
        if (!clientRef.current) return;
        setGeneratingReport(true);
        try {
            const canvas = await html2canvas(clientRef.current, {
                backgroundColor: '#0f172a',
                scale: 2
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            const dateStr = new Date().toLocaleDateString('pt-MZ').replace(/\//g, '-');
            pdf.save(`relatorio-cliente-${client.name.replace(/\s+/g, '-')}-${dateStr}.pdf`);
        } catch (error) {
            console.error('Erro ao exportar PDF:', error);
            alert('Erro ao gerar relatório PDF.');
        } finally {
            setGeneratingReport(false);
        }
    };

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

                // Buscar simulações
                const simRes = await api.get(`/simulations?clientId=${id}`);
                if (simRes.data.success) {
                    setSimulations(simRes.data.data);
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
                <div ref={clientRef} style={{ padding: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
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
                            <button 
                                onClick={handleGenerateReport}
                                disabled={generatingReport}
                                style={{
                                padding: '0.75rem 1.25rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
                                background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: generatingReport ? 'not-allowed' : 'pointer'
                            }}>
                                {generatingReport ? <FiActivity className="spin" /> : <FiDownload />} {t('client_profile.generate_report')}
                            </button>
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
                                    <p style={{ fontWeight: 600 }}>{new Date(client.dateOfBirth).toLocaleDateString('pt-MZ')}</p>
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
                        <div style={{ padding: '1rem 0' }}>
                            <ConfidenceIndicator
                                level={client.confidenceAnalysis?.level || 3}
                                label={client.confidenceAnalysis?.label}
                                percentage={client.confidenceAnalysis?.percentage || 50}
                            />
                            <p style={{ marginTop: '1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                                {t('client_profile.score_range')}
                            </p>
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
                                        padding: '1rem', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid rgba(255,255,255,0.05)',
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
                                            }}>{t('client_profile.contract')}: {(() => {
                                                const key = `client_profile.contract_status.${credit.contractStatus}`;
                                                const translated = t(key);
                                                // Se a chave não existir, i18next devolve a própria chave — mostrar legível
                                                if (translated === key || translated.includes('.')) {
                                                    return credit.contractStatus
                                                        ?.split('_')
                                                        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                                                        .join(' ') || '—';
                                                }
                                                return translated;
                                            })()}</span>
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

                    {/* Simulações Recentes */}
                    <div className="card">
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FiActivity style={{ color: 'var(--accent)' }} /> Simulações Realizadas
                        </h3>
                        {simulations.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {simulations.map(sim => (
                                    <div key={sim._id} style={{
                                        padding: '1rem', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid rgba(255,255,255,0.05)',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                    }}>
                                        <div>
                                            <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent)' }}>{sim.simulationNumber}</p>
                                            <p style={{ fontWeight: 700, fontSize: '1rem' }}>{sim.amount.toLocaleString()} MT</p>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{sim.term} {sim.periodicity} | {new Date(sim.createdAt).toLocaleDateString('pt-MZ')}</p>
                                        </div>
                                        <button
                                            onClick={() => window.open(`${api.defaults.baseURL}/simulations/${sim._id}/pdf`, '_blank')}
                                            className="btn-icon"
                                            style={{
                                                width: '36px', height: '36px', borderRadius: '10px',
                                                background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-main)',
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
                                <p style={{ fontSize: '0.85rem' }}>Nenhuma simulação registrada para este cliente.</p>
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
                                    title={t('client_profile.upload_manual')}
                                    onClick={() => document.getElementById('doc-upload').click()}
                                    disabled={uploading}
                                    style={{
                                        width: '42px',
                                        height: '42px',
                                        borderRadius: '12px',
                                        background: 'linear-gradient(135deg, var(--accent) 0%, var(--primary-light) 100%)',
                                        color: '#000',
                                        border: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 4px 15px rgba(0, 255, 0, 0.3)',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 255, 0, 0.5)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 255, 0, 0.3)';
                                    }}
                                >
                                    <FiPlus size={22} strokeWidth={3} />
                                </button>
                            </div>
                        </div>
                        {client.documents?.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                {client.documents.map(doc => (
                                    <div key={doc._id} style={{
                                        padding: '1rem', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid rgba(255,255,255,0.05)',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{
                                                width: '52px', height: '52px', borderRadius: '14px',
                                                background: 'var(--bg-main)',
                                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                boxShadow: 'inset 0 0 12px rgba(255, 255, 255, 0.02)'
                                            }}>
                                                {getDocIcon(doc.type)}
                                            </div>
                                            <div>
                                                <p style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>{t(`client_profile.doc_types.${doc.type}`)}</p>
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
                                                background: 'var(--bg-main)', color: 'var(--text-main)',
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
            </div>
            </div>

            {/* Modal de Upload */}
            {
                showUploadModal && (
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
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-main)' }}
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
                )
            }
        </Layout >
    );
};

export default ClientProfile;
