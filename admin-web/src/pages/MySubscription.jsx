import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import {
    FiCreditCard, FiUploadCloud, FiCheckCircle, FiClock, FiXCircle,
    FiCopy, FiRefreshCw, FiCheck, FiExternalLink, FiInfo
} from 'react-icons/fi';

const MySubscription = () => {
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const [institution, setInstitution] = useState(null);
    const [packages, setPackages] = useState([]);
    const [featuresCatalog, setFeaturesCatalog] = useState([]);
    const [enabledFeatures, setEnabledFeatures] = useState([]);
    const [paymentConfig, setPaymentConfig] = useState(null);
    const [requests, setRequests] = useState([]);
    const [pendingRequest, setPendingRequest] = useState(null);
    const [remainingDays, setRemainingDays] = useState(0);
    const [usage, setUsage] = useState({ currentUsers: 0, maxUsers: 0 });

    // Countdown 30 min quando existe pedido pendente
    const [countdownSeconds, setCountdownSeconds] = useState(null);
    const [copiedKey, setCopiedKey] = useState(null);

    // Modais e formulário
    const [renewModal, setRenewModal] = useState({ isOpen: false });
    const [feedbackModal, setFeedbackModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
    const [selectedPkg, setSelectedPkg] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('Transferência Bancária');
    const [referenceCode, setReferenceCode] = useState('');
    const [notes, setNotes] = useState('');
    const [proofFile, setProofFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const apiOrigin = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');
    const canSubmit = user?.role === 'owner' || user?.role === 'admin';

    const fetchData = async () => {
        try {
            const res = await api.get('/subscriptions/current');
            if (res.data.success && res.data.data) {
                const d = res.data.data;
                setInstitution(d.institution);
                setPackages(d.packages || []);
                setFeaturesCatalog(d.featuresCatalog || []);
                setEnabledFeatures(d.enabledFeatures || []);
                setPaymentConfig(d.paymentConfig || null);
                setRequests(d.requests || []);
                setPendingRequest(d.pendingRequest || null);
                setRemainingDays(d.remainingDays ?? 0);
                setUsage(d.usage || { currentUsers: 0, maxUsers: d.institution?.subscription?.maxUsers ?? 0 });

                if (d.packages && d.packages.length > 0 && !selectedPkg) {
                    const currentSlug = d.institution?.subscription?.plan;
                    const match = d.packages.find((p) => p.slug === currentSlug) || d.packages[0];
                    setSelectedPkg(match);
                }
            }
        } catch (error) {
            console.error('Erro ao buscar dados da subscrição:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (!pendingRequest) {
            setCountdownSeconds(null);
            return;
        }
        const submittedMs = new Date(pendingRequest.createdAt || Date.now()).getTime();
        const deadlineMs = submittedMs + 30 * 60 * 1000;

        const tick = () => {
            const diff = Math.max(0, Math.floor((deadlineMs - Date.now()) / 1000));
            setCountdownSeconds(diff);
        };
        tick();
        const timer = setInterval(tick, 1000);
        return () => clearInterval(timer);
    }, [pendingRequest?._id, pendingRequest?.createdAt]);

    const formatCountdown = (sec) => {
        if (sec === null || sec === undefined) return '30:00';
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const handleCopy = (val, key) => {
        if (!val) return;
        navigator.clipboard.writeText(val);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProofFile(file);
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => setPreviewUrl(reader.result);
                reader.readAsDataURL(file);
            } else {
                setPreviewUrl(null);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (pendingRequest) {
            setFeedbackModal({
                isOpen: true,
                title: 'Pedido Pendente',
                message: 'Já existe um pagamento enviado a aguardar validação da equipa financeira.',
                type: 'error',
            });
            return;
        }
        if (!selectedPkg) {
            setFeedbackModal({
                isOpen: true,
                title: 'Atenção',
                message: 'Selecione um pacote antes de submeter.',
                type: 'error',
            });
            return;
        }
        if (!proofFile) {
            setFeedbackModal({
                isOpen: true,
                title: 'Atenção',
                message: 'Por favor, anexe o comprovativo de pagamento (PDF, JPG ou PNG).',
                type: 'error',
            });
            return;
        }

        try {
            setActionLoading(true);
            const data = new FormData();
            data.append('packageId', selectedPkg._id);
            data.append('planRequested', selectedPkg.slug);
            data.append('amountPaid', selectedPkg.price);
            data.append('paymentMethod', paymentMethod);
            if (referenceCode) data.append('referenceCode', referenceCode);
            if (notes) data.append('notes', notes);
            data.append('proof', proofFile);

            await api.post('/subscriptions/submit', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setRenewModal({ isOpen: false });
            setProofFile(null);
            setPreviewUrl(null);
            setReferenceCode('');
            setNotes('');
            await fetchData();
            if (updateUser) await updateUser();
        } catch (error) {
            setFeedbackModal({
                isOpen: true,
                title: 'Erro ao Submeter',
                message: error.response?.data?.message || error.message || 'Ocorreu um erro ao processar o pedido.',
                type: 'error',
            });
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved':
                return <span className="badge badge-success"><FiCheckCircle /> Aprovado</span>;
            case 'pending':
                return <span className="badge badge-warning"><FiClock /> Pendente</span>;
            case 'rejected':
                return <span className="badge badge-danger"><FiXCircle /> Rejeitado</span>;
            default:
                return <span className="badge">{status}</span>;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    if (loading) {
        return <Layout><div className="card" style={{ textAlign: 'center', padding: '3rem' }}>A carregar dados da subscrição...</div></Layout>;
    }

    const activeAccounts = (paymentConfig?.paymentAccounts || []).filter((a) => a.isActive !== false);
    const subStatus = institution?.subscription?.status || 'active';
    const isExpired = subStatus === 'expired' || subStatus === 'rejected' || remainingDays <= 0;

    return (
        <Layout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Minha Subscrição & Pacotes</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Consulte o tempo de acesso restante, os módulos liberados pelo seu pacote e faça upload de comprovativos.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                    {user?.role === 'super_admin' && (
                        <Link to="/superadmin-subscriptions" className="btn-primary" style={{ textDecoration: 'none' }}>
                            Gestão Global de Subscrições (Super Admin)
                        </Link>
                    )}
                    <button
                        className="btn-secondary"
                        onClick={async () => {
                            await fetchData();
                            if (updateUser) await updateUser();
                        }}
                    >
                        <FiRefreshCw /> Verificar Estado
                    </button>
                    {canSubmit && !pendingRequest && (
                        <button
                            className="btn-primary"
                            onClick={() => setRenewModal({ isOpen: true })}
                        >
                            <FiUploadCloud /> Seleccionar Pacote & Enviar Comprovativo
                        </button>
                    )}
                </div>
            </div>

            {/* Banner se houver pedido pendente com Countdown de 30 Minutos */}
            {pendingRequest && (
                <div className="card" style={{
                    marginBottom: '1.5rem',
                    borderLeft: '6px solid #0284c7',
                    background: '#eff6ff',
                    borderColor: '#bfdbfe',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1.25rem'
                }}>
                    <div style={{ flex: '1 1 420px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e3a8a', marginBottom: '0.35rem' }}>
                            <FiClock size={20} color="#0284c7" />
                            <h3 style={{ fontSize: '1.1rem', color: '#1e3a8a' }}>Pedido Já Enviado — A Aguardar Validação da Equipa Financeira</h3>
                        </div>
                        <p style={{ fontSize: '0.88rem', color: '#1e40af', marginBottom: '0.5rem' }}>
                            O seu comprovativo para o pacote <strong>{pendingRequest.packageId?.name || pendingRequest.packageName || pendingRequest.planRequested}</strong> ({Number(pendingRequest.amountPaid).toLocaleString()} MT) já foi submetido. Não é possível enviar outro pedido enquanto estiver pendente de confirmação.
                        </p>
                        {pendingRequest.proofOfPaymentUrl && (
                            <a
                                href={`${apiOrigin}${pendingRequest.proofOfPaymentUrl}`}
                                target="_blank"
                                rel="noreferrer"
                                className="btn-secondary"
                                style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem', textDecoration: 'none' }}
                            >
                                <FiExternalLink size={13} /> Ver Comprovativo Enviado
                            </a>
                        )}
                    </div>

                    <div style={{
                        background: '#ffffff',
                        border: '1px solid #93c5fd',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.85rem 1.25rem',
                        textAlign: 'center',
                        minWidth: '210px'
                    }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                            Tempo Estimado de Validação
                        </div>
                        <div style={{ fontSize: '1.9rem', fontWeight: 800, fontFamily: 'monospace', color: countdownSeconds === 0 ? '#d97706' : '#0284c7' }}>
                            {formatCountdown(countdownSeconds)}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            {countdownSeconds === 0 ? 'Em fila prioritária financeira' : 'Countdown de 30 minutos'}
                        </div>
                    </div>
                </div>
            )}

            {/* Grid Superior: Estado Actual + Contas da Nhiquela */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                {/* Cartão de Plano & Dias Restantes */}
                <div className="card" style={{ borderLeft: `5px solid ${isExpired ? 'var(--danger)' : 'var(--primary)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                        <div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase' }}>Pacote Actual</p>
                            <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'capitalize' }}>
                                {institution?.subscription?.packageName || institution?.subscription?.plan || 'Trial'}
                            </h2>
                            <div style={{ marginTop: '0.4rem' }}>
                                {isExpired
                                    ? <span className="badge badge-danger">Expirado / Bloqueado</span>
                                    : <span className="badge badge-success">Activo & Regularizado</span>}
                            </div>
                        </div>

                        <div style={{
                            background: isExpired ? '#fef2f2' : remainingDays <= 5 ? '#fffbeb' : '#ecfdf5',
                            border: `1px solid ${isExpired ? '#fecaca' : remainingDays <= 5 ? '#fde68a' : '#a7f3d0'}`,
                            borderRadius: 'var(--radius-md)',
                            padding: '0.65rem 1rem',
                            textAlign: 'center',
                        }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Dias Restantes</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: isExpired ? '#dc2626' : remainingDays <= 5 ? '#d97706' : '#059669' }}>
                                {remainingDays}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <FiClock color="var(--primary)" size={18} />
                            <span>Válido até: <strong>{formatDate(institution?.subscription?.expiresAt)}</strong></span>
                        </div>
                        <div>
                            Utilizadores Activos: <strong>{usage?.currentUsers ?? 0} / {usage?.maxUsers > 0 ? usage.maxUsers : 'Ilimitado'}</strong>
                        </div>
                    </div>

                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                            Funcionalidades Activas no Seu Pacote ({enabledFeatures.length}):
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                            {enabledFeatures.map((fCode) => {
                                const info = featuresCatalog.find((f) => f.code === fCode);
                                return (
                                    <span key={fCode} style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        fontSize: '0.74rem',
                                        padding: '2px 8px',
                                        borderRadius: '9999px',
                                        background: '#ecfdf5',
                                        color: '#059669',
                                        border: '1px solid #a7f3d0',
                                        fontWeight: 600,
                                    }}>
                                        <FiCheck size={11} /> {info?.name || fCode}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Contas Dinâmicas da Nhiquela */}
                <div className="card" style={{ borderLeft: '5px solid var(--success)' }}>
                    <h3 style={{ marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FiCreditCard color="var(--success)" /> Contas Oficiais da Nhiquela
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                        Beneficiário: <strong>{paymentConfig?.companyName || 'NHIQUELA SERVICOS & CONSULTORIA, SU LDA'}</strong>
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {activeAccounts.length > 0 ? activeAccounts.map((acc, idx) => (
                            <div key={acc._id || idx} style={{
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-light)',
                                borderRadius: 'var(--radius-sm)',
                                padding: '0.75rem 1rem',
                                fontSize: '0.85rem'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <strong style={{ color: 'var(--text-heading)' }}>
                                        {acc.label || acc.bankName || acc.type.toUpperCase()} {acc.bankName ? `(${acc.bankName})` : ''}
                                    </strong>
                                    <button
                                        type="button"
                                        onClick={() => handleCopy(acc.nib || acc.accountNumber || acc.phoneNumber, `acc_${idx}`)}
                                        style={{ background: 'transparent', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                    >
                                        <FiCopy size={12} /> {copiedKey === `acc_${idx}` ? 'Copiado!' : 'Copiar'}
                                    </button>
                                </div>
                                {acc.accountNumber && <div>Conta: <strong>{acc.accountNumber}</strong></div>}
                                {acc.nib && <div style={{ fontFamily: 'monospace' }}>NIB: <strong>{acc.nib}</strong></div>}
                                {acc.phoneNumber && <div>Número: <strong>{acc.phoneNumber}</strong></div>}
                            </div>
                        )) : (
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                Nenhuma conta configurada pelo Super Admin.
                            </div>
                        )}
                    </div>

                    {paymentConfig?.instructions && (
                        <div style={{ marginTop: '0.85rem', padding: '0.65rem 0.85rem', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: '#0369a1', display: 'flex', gap: '6px' }}>
                            <FiInfo size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                            <span>{paymentConfig.instructions}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Pacotes Disponíveis (Personalizados pelo Super Admin) */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3>Pacotes Disponíveis</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Escolha o pacote adequado às necessidades da sua instituição
                    </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                    {packages.map((pkg) => {
                        const isCurrent = institution?.subscription?.plan === pkg.slug;
                        return (
                            <div key={pkg._id} style={{
                                border: isCurrent ? '2px solid #d97706' : '1px solid var(--border-light)',
                                borderRadius: 'var(--radius-md)',
                                padding: '1.25rem',
                                background: isCurrent
                                    ? 'linear-gradient(145deg, #fffbeb 0%, #fef3c7 100%)'
                                    : 'var(--bg-secondary)',
                                color: isCurrent ? '#1e293b' : 'var(--text-main)',
                                boxShadow: isCurrent ? '0 8px 20px -4px rgba(217, 119, 6, 0.22)' : 'none',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                            }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                                        <h4 style={{ fontSize: '1.15rem', color: isCurrent ? '#78350f' : 'var(--text-heading)', fontWeight: 800 }}>
                                            {pkg.name}
                                        </h4>
                                        {isCurrent && (
                                            <span style={{
                                                background: '#fde68a',
                                                color: '#78350f',
                                                border: '1px solid #d97706',
                                                padding: '0.2rem 0.65rem',
                                                borderRadius: '9999px',
                                                fontSize: '0.75rem',
                                                fontWeight: 700
                                            }}>
                                                ★ Actual
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '1.45rem', fontWeight: 800, color: isCurrent ? '#b45309' : (pkg.badgeColor || 'var(--primary)'), marginBottom: '0.5rem' }}>
                                        {Number(pkg.price).toLocaleString()} {pkg.currency || 'MT'}
                                        <span style={{ fontSize: '0.78rem', fontWeight: 500, color: isCurrent ? '#92400e' : 'var(--text-muted)' }}> / {pkg.durationDays} dias</span>
                                    </div>
                                    <p style={{ fontSize: '0.84rem', color: isCurrent ? '#78350f' : 'var(--text-muted)', marginBottom: '0.6rem', lineHeight: '1.45' }}>
                                        {pkg.description}
                                    </p>
                                    <div style={{
                                        display: 'inline-block',
                                        marginBottom: '0.85rem',
                                        padding: '0.25rem 0.65rem',
                                        borderRadius: '6px',
                                        fontSize: '0.76rem',
                                        fontWeight: 700,
                                        background: isCurrent ? 'rgba(180, 83, 9, 0.14)' : 'var(--bg-main)',
                                        color: isCurrent ? '#78350f' : 'var(--text-heading)',
                                        border: isCurrent ? '1px solid rgba(180, 83, 9, 0.3)' : '1px solid var(--border-light)',
                                    }}>
                                        Capacidade: {pkg.limits?.maxUsers === 1 ? '1 Utilizador' : pkg.limits?.maxUsers > 0 ? `Até ${pkg.limits.maxUsers} Utilizadores` : 'Utilizadores Ilimitados'}
                                    </div>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.82rem', color: isCurrent ? '#1e293b' : 'var(--text-main)' }}>
                                        {(pkg.features || []).map((fCode) => {
                                            const info = featuresCatalog.find((f) => f.code === fCode);
                                            return (
                                                <li key={fCode} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontWeight: isCurrent ? 500 : 400 }}>
                                                    <FiCheckCircle color={isCurrent ? '#b45309' : '#10b981'} size={14} style={{ flexShrink: 0 }} />
                                                    <span>{info?.name || fCode}</span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                                {canSubmit && !pendingRequest && (
                                    <button
                                        className="btn-primary"
                                        style={{
                                            width: '100%',
                                            background: isCurrent ? 'linear-gradient(135deg, #d97706, #b45309)' : 'var(--primary)',
                                            color: '#ffffff',
                                            borderColor: 'transparent',
                                            fontWeight: 700,
                                        }}
                                        onClick={() => {
                                            setSelectedPkg(pkg);
                                            setRenewModal({ isOpen: true });
                                        }}
                                    >
                                        <FiUploadCloud /> Seleccionar & Pagar
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Histórico de Pedidos */}
            <div className="card">
                <h3 style={{ marginBottom: '1rem' }}>Histórico de Pedidos & Comprovativos</h3>
                <div className="table-responsive">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Pacote</th>
                                <th>Valor</th>
                                <th>Estado</th>
                                <th>Comprovativo</th>
                                <th>Observações / Motivo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.length > 0 ? requests.map((req) => (
                                <tr key={req._id}>
                                    <td>{formatDate(req.createdAt)}</td>
                                    <td><strong>{req.packageId?.name || req.packageName || req.planRequested}</strong></td>
                                    <td>{Number(req.amountPaid).toLocaleString()} MT</td>
                                    <td>{getStatusBadge(req.status)}</td>
                                    <td>
                                        {req.proofOfPaymentUrl ? (
                                            <a
                                                href={`${apiOrigin}${req.proofOfPaymentUrl}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="btn-secondary"
                                                style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', textDecoration: 'none' }}
                                            >
                                                <FiExternalLink size={12} /> Ver Ficheiro
                                            </a>
                                        ) : '-'}
                                    </td>
                                    <td>{req.reviewNotes || '-'}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                        Nenhum pedido de subscrição registado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Submissão de Comprovativo */}
            <Modal
                maxWidth="760px"
                isOpen={renewModal.isOpen}
                onClose={() => !actionLoading && setRenewModal({ isOpen: false })}
                title="Actualizar Subscrição — Upload de Comprovativo"
            >
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label>Pacote Selecionado *</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                            {packages.map((pkg) => {
                                const isSel = selectedPkg?._id === pkg._id;
                                const usersLabel = pkg.limits?.maxUsers === 1
                                    ? '1 utilizador'
                                    : pkg.limits?.maxUsers > 0
                                        ? `Até ${pkg.limits.maxUsers} utilizadores`
                                        : 'Utilizadores ilimitados';
                                return (
                                    <div
                                        key={pkg._id}
                                        onClick={() => setSelectedPkg(pkg)}
                                        style={{
                                            border: isSel ? '2px solid #d97706' : '1px solid var(--border-light)',
                                            borderRadius: 'var(--radius-sm)',
                                            padding: '0.85rem',
                                            cursor: 'pointer',
                                            background: isSel ? 'linear-gradient(145deg, #fffbeb 0%, #fef3c7 100%)' : 'var(--bg-secondary)',
                                            color: isSel ? '#1e293b' : 'var(--text-main)',
                                        }}
                                    >
                                        <div style={{ fontWeight: 700, color: isSel ? '#78350f' : 'var(--text-heading)' }}>{pkg.name}</div>
                                        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: isSel ? '#b45309' : '#38bdf8' }}>
                                            {Number(pkg.price).toLocaleString()} {pkg.currency || 'MT'}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: isSel ? '#92400e' : 'var(--text-muted)', marginTop: '2px' }}>
                                            {pkg.durationDays} dias • {pkg.features?.length || 0} funcionalidades
                                        </div>
                                        <div style={{
                                            display: 'inline-block',
                                            marginTop: '6px',
                                            padding: '2px 8px',
                                            borderRadius: '9999px',
                                            fontSize: '0.72rem',
                                            fontWeight: 700,
                                            background: isSel ? 'rgba(180, 83, 9, 0.14)' : 'rgba(56, 189, 248, 0.14)',
                                            color: isSel ? '#78350f' : '#38bdf8',
                                            border: isSel ? '1px solid rgba(180, 83, 9, 0.28)' : '1px solid rgba(56, 189, 248, 0.28)',
                                        }}>
                                            👥 {usersLabel}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1rem' }}>
                        <div>
                            <label>Método de Pagamento *</label>
                            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} required>
                                <option value="Transferência Bancária">Transferência Bancária</option>
                                <option value="M-Pesa">M-Pesa</option>
                                <option value="e-Mola">e-Mola</option>
                                <option value="Depósito em Numerário">Depósito em Numerário</option>
                            </select>
                        </div>
                        <div>
                            <label>Referência / Nº do Talão</label>
                            <input
                                type="text"
                                placeholder="Ex: BCI-991823"
                                value={referenceCode}
                                onChange={(e) => setReferenceCode(e.target.value)}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label>Comprovativo de Pagamento (PDF, JPG ou PNG) *</label>
                        <input
                            type="file"
                            accept=".pdf,image/png,image/jpeg,image/jpg"
                            onChange={handleFileChange}
                            required
                        />
                        {previewUrl && (
                            <img src={previewUrl} alt="Pré-visualização" style={{ marginTop: '0.75rem', maxHeight: '160px', borderRadius: '8px', border: '1px solid var(--border-light)' }} />
                        )}
                    </div>

                    <div style={{ marginBottom: '1.25rem' }}>
                        <label>Observações (opcional)</label>
                        <input
                            type="text"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Informação adicional para a equipa financeira..."
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                        <button type="button" className="btn-secondary" onClick={() => setRenewModal({ isOpen: false })}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary" disabled={actionLoading}>
                            <FiUploadCloud /> {actionLoading ? 'A enviar...' : 'Enviar Comprovativo para Validação'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={feedbackModal.isOpen}
                onClose={() => setFeedbackModal({ ...feedbackModal, isOpen: false })}
                title={feedbackModal.title}
            >
                <p style={{ marginBottom: '1.25rem' }}>{feedbackModal.message}</p>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn-primary" onClick={() => setFeedbackModal({ ...feedbackModal, isOpen: false })}>OK</button>
                </div>
            </Modal>
        </Layout>
    );
};

export default MySubscription;
