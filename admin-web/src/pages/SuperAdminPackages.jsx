import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import api from '../api';
import {
    FiPackage, FiPlus, FiEdit2, FiTrash2, FiCheckCircle, FiXCircle,
    FiClock, FiCreditCard, FiShield, FiSave, FiExternalLink, FiRefreshCw,
    FiCheck, FiLayers, FiUsers, FiSearch, FiPauseCircle, FiPlayCircle, FiMail
} from 'react-icons/fi';

const SuperAdminPackages = ({ initialTab = 'packages' }) => {
    const [activeTab, setActiveTab] = useState(initialTab); // 'packages', 'subscriptions', 'accounts', 'requests', 'rbac'
    const [loading, setLoading] = useState(true);
    const [packages, setPackages] = useState([]);
    const [featuresCatalog, setFeaturesCatalog] = useState([]);
    const [requests, setRequests] = useState([]);
    const [institutionsSubs, setInstitutionsSubs] = useState([]);
    const [subSearch, setSubSearch] = useState('');
    const [subStatusFilter, setSubStatusFilter] = useState('all');
    const [reqFilter, setReqFilter] = useState('pending');
    const [feedback, setFeedback] = useState({ type: '', text: '' });

    const [subModal, setSubModal] = useState({
        open: false,
        inst: null,
        plan: 'standard',
        durationDays: 30,
        maxUsers: 0,
        status: 'active',
    });
    const [savingSub, setSavingSub] = useState(false);

    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    // Modal Criar / Editar Pacote
    const [pkgModal, setPkgModal] = useState({ open: false, editingId: null });
    const [pkgForm, setPkgForm] = useState({
        name: '',
        description: '',
        price: 2500,
        durationDays: 30,
        badgeColor: '#0284c7',
        isFeatured: false,
        isActive: true,
        displayOrder: 0,
        features: ['dashboard', 'clients', 'loans', 'payments'],
        limits: { maxUsers: 0, maxClients: 0, maxActiveLoans: 0 },
    });
    const [savingPkg, setSavingPkg] = useState(false);

    // Configurações & Contas da Nhiquela
    const [configForm, setConfigForm] = useState({
        companyName: 'NHIQUELA SERVICOS & CONSULTORIA, SU LDA',
        nuit: '',
        supportEmail: '',
        supportPhone: '',
        instructions: '',
        paymentAccounts: [],
        emailSettings: {
            smtpHost: '',
            smtpPort: 587,
            smtpSecure: false,
            smtpUser: '',
            smtpPassword: '',
            hasSmtpPassword: false,
            fromName: 'Nhiquela Microcrédito Digital',
            fromEmail: '',
            notificationEmails: [],
            notifyOnSubscriptionPayment: true,
            notifyOnNewInstitution: true,
        },
    });
    const [notificationEmailsText, setNotificationEmailsText] = useState('');
    const [testEmailTarget, setTestEmailTarget] = useState('');
    const [testingEmail, setTestingEmail] = useState(false);
    const [savingConfig, setSavingConfig] = useState(false);

    // Emails por utilizador (configurável pelo Super Admin)
    const [usersList, setUsersList] = useState([]);
    const [userEmailSearch, setUserEmailSearch] = useState('');
    const [savingUserEmailId, setSavingUserEmailId] = useState(null);

    // Modal Rejeição de Pagamento
    const [rejectModal, setRejectModal] = useState({ open: false, reqId: null, reason: '' });
    const [processingReq, setProcessingReq] = useState(false);

    const apiOrigin = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');

    const fetchAll = async () => {
        try {
            setLoading(true);
            const [pkgSettled, cfgSettled, reqSettled, instSettled, usersSettled] = await Promise.allSettled([
                api.get('/subscriptions/admin/packages'),
                api.get('/subscriptions/admin/config'),
                api.get('/subscriptions/admin/requests'),
                api.get('/subscriptions/admin/institutions'),
                api.get('/users'),
            ]);

            if (pkgSettled.status === 'fulfilled' && pkgSettled.value.data.success) {
                setPackages(pkgSettled.value.data.data || []);
                setFeaturesCatalog(pkgSettled.value.data.featuresCatalog || []);
            }
            if (cfgSettled.status === 'fulfilled' && cfgSettled.value.data.success && cfgSettled.value.data.data) {
                const c = cfgSettled.value.data.data;
                const es = c.emailSettings || {};
                setConfigForm({
                    companyName: c.companyName || '',
                    nuit: c.nuit || '',
                    supportEmail: c.supportEmail || '',
                    supportPhone: c.supportPhone || '',
                    instructions: c.instructions || '',
                    paymentAccounts: c.paymentAccounts || [],
                    emailSettings: {
                        smtpHost: es.smtpHost || '',
                        smtpPort: es.smtpPort || 587,
                        smtpSecure: Boolean(es.smtpSecure),
                        smtpUser: es.smtpUser || '',
                        smtpPassword: '',
                        hasSmtpPassword: Boolean(es.hasSmtpPassword),
                        fromName: es.fromName || 'Nhiquela Microcrédito Digital',
                        fromEmail: es.fromEmail || '',
                        notificationEmails: Array.isArray(es.notificationEmails) ? es.notificationEmails : [],
                        notifyOnSubscriptionPayment: es.notifyOnSubscriptionPayment !== false,
                        notifyOnNewInstitution: es.notifyOnNewInstitution !== false,
                    },
                });
                setNotificationEmailsText(Array.isArray(es.notificationEmails) ? es.notificationEmails.join(', ') : '');
            }
            if (reqSettled.status === 'fulfilled' && reqSettled.value.data.success) {
                setRequests(reqSettled.value.data.data || []);
            }
            if (usersSettled.status === 'fulfilled' && usersSettled.value.data.success) {
                setUsersList(
                    (usersSettled.value.data.data || [])
                        .filter((u) => u.role !== 'client')
                        .map((u) => ({
                            ...u,
                            _draftEmail: u.paymentNotificationEmail || '',
                            _draftReceive: u.receivePaymentEmails !== false,
                        }))
                );
            }
            if (instSettled.status === 'fulfilled' && instSettled.value.data.success) {
                setInstitutionsSubs(instSettled.value.data.data || []);
            } else {
                // Fallback seguro caso o backend ainda esteja a reiniciar
                try {
                    const fallbackRes = await api.get('/institutions/all');
                    if (fallbackRes.data?.success) {
                        const now = Date.now();
                        const mapped = (fallbackRes.data.data || []).map((inst) => {
                            const sub = inst.subscription || {};
                            const exp = sub.expiresAt ? new Date(sub.expiresAt) : null;
                            const rem = exp ? Math.max(0, Math.ceil((exp.getTime() - now) / 86400000)) : 0;
                            const expired = sub.status === 'expired' || (exp ? exp.getTime() < now : false);
                            return {
                                ...inst,
                                subscriptionSummary: {
                                    plan: sub.plan || 'trial',
                                    packageName: sub.packageName || sub.plan || 'Trial',
                                    status: sub.status || 'active',
                                    effectiveStatus: expired ? 'expired' : (sub.plan === 'trial' ? 'trial' : 'active'),
                                    expiresAt: exp,
                                    remainingDays: rem,
                                    isExpired: expired,
                                    currentUsers: 0,
                                    maxUsers: sub.maxUsers ?? 0,
                                },
                            };
                        });
                        setInstitutionsSubs(mapped);
                    }
                } catch (_) {}
            }
        } catch (err) {
            setFeedback({ type: 'error', text: err.response?.data?.message || 'Erro ao carregar central Nhiquela.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, []);

    // Abrir Modal de Pacote
    const openCreatePkg = () => {
        setPkgForm({
            name: '',
            description: '',
            price: 2500,
            durationDays: 30,
            badgeColor: '#0284c7',
            isFeatured: false,
            isActive: true,
            displayOrder: packages.length + 1,
            features: ['dashboard', 'clients', 'loans', 'payments'],
            limits: { maxUsers: 0, maxClients: 0, maxActiveLoans: 0 },
        });
        setPkgModal({ open: true, editingId: null });
    };

    const openEditPkg = (pkg) => {
        setPkgForm({
            name: pkg.name,
            description: pkg.description || '',
            price: pkg.price,
            durationDays: pkg.durationDays || 30,
            badgeColor: pkg.badgeColor || '#0284c7',
            isFeatured: Boolean(pkg.isFeatured),
            isActive: pkg.isActive !== false,
            displayOrder: pkg.displayOrder || 0,
            features: pkg.features || [],
            limits: {
                maxUsers: pkg.limits?.maxUsers || 0,
                maxClients: pkg.limits?.maxClients || 0,
                maxActiveLoans: pkg.limits?.maxActiveLoans || 0,
            },
        });
        setPkgModal({ open: true, editingId: pkg._id });
    };

    const toggleFeature = (code) => {
        setPkgForm((prev) => {
            const exists = prev.features.includes(code);
            return {
                ...prev,
                features: exists ? prev.features.filter((f) => f !== code) : [...prev.features, code],
            };
        });
    };

    const handleSavePackage = async (e) => {
        e.preventDefault();
        setSavingPkg(true);
        setFeedback({ type: '', text: '' });
        try {
            if (pkgModal.editingId) {
                const res = await api.put(`/subscriptions/admin/packages/${pkgModal.editingId}`, {
                    ...pkgForm,
                    syncInstitutions: true,
                });
                setFeedback({ type: 'success', text: res.data.message || 'Pacote actualizado!' });
            } else {
                const res = await api.post('/subscriptions/admin/packages', pkgForm);
                setFeedback({ type: 'success', text: res.data.message || 'Pacote criado com sucesso!' });
            }
            setPkgModal({ open: false, editingId: null });
            await fetchAll();
        } catch (err) {
            setFeedback({ type: 'error', text: err.response?.data?.message || 'Erro ao guardar pacote.' });
        } finally {
            setSavingPkg(false);
        }
    };

    const handleDeletePackage = async (pkg) => {
        if (!window.confirm(`Tem certeza que deseja remover o pacote "${pkg.name}"?`)) return;
        try {
            const res = await api.delete(`/subscriptions/admin/packages/${pkg._id}`);
            setFeedback({ type: 'success', text: res.data.message || 'Pacote removido.' });
            await fetchAll();
        } catch (err) {
            setFeedback({ type: 'error', text: err.response?.data?.message || 'Erro ao remover pacote.' });
        }
    };

    // Contas da Nhiquela
    const addPaymentAccount = () => {
        setConfigForm((prev) => ({
            ...prev,
            paymentAccounts: [
                ...prev.paymentAccounts,
                {
                    label: 'Nova Conta',
                    type: 'bank',
                    bankName: '',
                    accountHolder: prev.companyName || 'NHIQUELA SERVICOS & CONSULTORIA, SU LDA',
                    accountNumber: '',
                    nib: '',
                    phoneNumber: '',
                    isPrimary: prev.paymentAccounts.length === 0,
                    isActive: true,
                },
            ],
        }));
    };

    const updateAccountField = (idx, field, value) => {
        setConfigForm((prev) => {
            const updated = [...prev.paymentAccounts];
            updated[idx] = { ...updated[idx], [field]: value };
            return { ...prev, paymentAccounts: updated };
        });
    };

    const removePaymentAccount = (idx) => {
        setConfigForm((prev) => ({
            ...prev,
            paymentAccounts: prev.paymentAccounts.filter((_, i) => i !== idx),
        }));
    };

    const handleSaveConfig = async (e) => {
        e.preventDefault();
        setSavingConfig(true);
        setFeedback({ type: '', text: '' });
        try {
            const parsedEmails = notificationEmailsText
                .split(/[,;\s]+/)
                .map((s) => s.trim())
                .filter(Boolean);
            const payload = {
                ...configForm,
                emailSettings: {
                    ...(configForm.emailSettings || {}),
                    notificationEmails: parsedEmails,
                },
            };
            const res = await api.put('/subscriptions/admin/config', payload);
            setFeedback({ type: 'success', text: res.data.message || 'Contas da Nhiquela guardadas!' });
            await fetchAll();
        } catch (err) {
            setFeedback({ type: 'error', text: err.response?.data?.message || 'Erro ao guardar configurações.' });
        } finally {
            setSavingConfig(false);
        }
    };

    const handleTestPlatformEmail = async () => {
        setTestingEmail(true);
        setFeedback({ type: '', text: '' });
        try {
            const parsedEmails = notificationEmailsText
                .split(/[,;\s]+/)
                .map((s) => s.trim())
                .filter(Boolean);
            const res = await api.post('/subscriptions/admin/config/test-email', {
                to: testEmailTarget.trim() || undefined,
                emailSettings: {
                    ...(configForm.emailSettings || {}),
                    notificationEmails: parsedEmails,
                },
            });
            setFeedback({ type: 'success', text: res.data.message || 'Email de teste enviado!' });
        } catch (err) {
            setFeedback({ type: 'error', text: err.response?.data?.message || 'Erro ao enviar email de teste.' });
        } finally {
            setTestingEmail(false);
        }
    };

    const handleSaveUserPaymentEmail = async (u) => {
        setSavingUserEmailId(u._id);
        setFeedback({ type: '', text: '' });
        try {
            const res = await api.put(`/users/${u._id}`, {
                paymentNotificationEmail: (u._draftEmail || '').trim(),
                receivePaymentEmails: u._draftReceive !== false,
            });
            if (res.data?.success) {
                setUsersList((prev) =>
                    prev.map((item) =>
                        item._id === u._id
                            ? { ...item, paymentNotificationEmail: res.data.data.paymentNotificationEmail || '', receivePaymentEmails: res.data.data.receivePaymentEmails !== false }
                            : item
                    )
                );
                setFeedback({ type: 'success', text: `Email de pagamentos actualizado para ${u.name}!` });
            }
        } catch (err) {
            setFeedback({ type: 'error', text: err.response?.data?.message || 'Erro ao guardar email do utilizador.' });
        } finally {
            setSavingUserEmailId(null);
        }
    };

    // Aprovar / Rejeitar Pedidos
    const handleApprove = async (reqId) => {
        if (!window.confirm('Confirmar recebimento e activar o pacote + funcionalidades desta instituição?')) return;
        setProcessingReq(true);
        try {
            const res = await api.put(`/subscriptions/admin/requests/${reqId}/approve`);
            setFeedback({ type: 'success', text: res.data.message || 'Pedido aprovado!' });
            await fetchAll();
            window.dispatchEvent(new Event('badges:refresh'));
        } catch (err) {
            setFeedback({ type: 'error', text: err.response?.data?.message || 'Erro ao aprovar.' });
        } finally {
            setProcessingReq(false);
        }
    };

    const handleReject = async (e) => {
        e.preventDefault();
        if (!rejectModal.reason.trim()) return;
        setProcessingReq(true);
        try {
            const res = await api.put(`/subscriptions/admin/requests/${rejectModal.reqId}/reject`, {
                reviewNotes: rejectModal.reason.trim(),
            });
            setFeedback({ type: 'success', text: res.data.message || 'Pedido rejeitado.' });
            setRejectModal({ open: false, reqId: null, reason: '' });
            await fetchAll();
            window.dispatchEvent(new Event('badges:refresh'));
        } catch (err) {
            setFeedback({ type: 'error', text: err.response?.data?.message || 'Erro ao rejeitar.' });
        } finally {
            setProcessingReq(false);
        }
    };

    const openSubModal = (inst) => {
        const sub = inst.subscription || {};
        const summary = inst.subscriptionSummary || {};
        setSubModal({
            open: true,
            inst,
            plan: sub.plan || 'trial',
            durationDays: sub.plan === 'trial' ? 7 : 30,
            maxUsers: summary.maxUsers ?? sub.maxUsers ?? 0,
            status: summary.isExpired ? 'active' : (sub.status || 'active'),
        });
    };

    const handleSaveInstSub = async (e) => {
        e.preventDefault();
        if (!subModal.inst) return;
        setSavingSub(true);
        setFeedback({ type: '', text: '' });
        try {
            const res = await api.put(`/institutions/${subModal.inst._id}/subscription`, {
                plan: subModal.plan,
                durationDays: Number(subModal.durationDays) || 30,
                maxUsers: Math.max(0, parseInt(subModal.maxUsers, 10) || 0),
                status: subModal.status,
            });
            setFeedback({ type: 'success', text: res.data.message || 'Subscrição da instituição actualizada!' });
            setSubModal({ open: false, inst: null, plan: 'standard', durationDays: 30, maxUsers: 0, status: 'active' });
            await fetchAll();
        } catch (err) {
            setFeedback({ type: 'error', text: err.response?.data?.message || 'Erro ao actualizar subscrição.' });
        } finally {
            setSavingSub(false);
        }
    };

    const handleQuickExpireToggle = async (inst) => {
        const summary = inst.subscriptionSummary || {};
        const nextStatus = summary.isExpired ? 'active' : 'expired';
        const actionLabel = nextStatus === 'expired' ? 'suspender/expirar' : 'reactivar por 30 dias';
        if (!window.confirm(`Tem certeza que deseja ${actionLabel} a subscrição de "${inst.name}"?`)) return;
        setSavingSub(true);
        try {
            const res = await api.put(`/institutions/${inst._id}/subscription`, {
                plan: inst.subscription?.plan || 'standard',
                durationDays: nextStatus === 'active' ? 30 : 1,
                maxUsers: summary.maxUsers ?? 0,
                status: nextStatus,
            });
            setFeedback({ type: 'success', text: res.data.message || 'Estado da subscrição actualizado!' });
            await fetchAll();
        } catch (err) {
            setFeedback({ type: 'error', text: err.response?.data?.message || 'Erro ao actualizar estado.' });
        } finally {
            setSavingSub(false);
        }
    };

    // Agrupar catálogo de funcionalidades por categoria
    const featuresByCategory = featuresCatalog.reduce((acc, feat) => {
        const cat = feat.category || 'Geral';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(feat);
        return acc;
    }, {});

    const pendingCount = requests.filter((r) => r.status === 'pending').length;
    const filteredRequests = reqFilter === 'all' ? requests : requests.filter((r) => r.status === reqFilter);

    const filteredInstitutionsSubs = institutionsSubs.filter((inst) => {
        const s = inst.subscriptionSummary || {};
        const matchesStatus = subStatusFilter === 'all' || s.effectiveStatus === subStatusFilter;
        const q = subSearch.trim().toLowerCase();
        const matchesSearch = !q ||
            inst.name?.toLowerCase().includes(q) ||
            inst.email?.toLowerCase().includes(q) ||
            inst.nuit?.toLowerCase().includes(q) ||
            s.packageName?.toLowerCase().includes(q);
        return matchesStatus && matchesSearch;
    });

    const subStats = {
        total: institutionsSubs.length,
        active: institutionsSubs.filter((i) => i.subscriptionSummary?.effectiveStatus === 'active').length,
        trial: institutionsSubs.filter((i) => i.subscriptionSummary?.effectiveStatus === 'trial').length,
        expired: institutionsSubs.filter((i) => i.subscriptionSummary?.effectiveStatus === 'expired').length,
    };

    return (
        <Layout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Central Nhiquela — Pacotes, Contas & Subscrições</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Crie pacotes personalizados, ajuste preços, defina funcionalidades por plano e configure as contas da Nhiquela.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-secondary" onClick={fetchAll} disabled={loading}>
                        <FiRefreshCw /> Actualizar
                    </button>
                    {activeTab === 'packages' && (
                        <button className="btn-primary" onClick={openCreatePkg}>
                            <FiPlus /> Novo Pacote Personalizado
                        </button>
                    )}
                </div>
            </div>

            {feedback.text && (
                <div style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-sm)',
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
                    <button onClick={() => setFeedback({ type: '', text: '' })} style={{ background: 'none', fontWeight: 700 }}>✕</button>
                </div>
            )}

            {/* Abas */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
                <button
                    className={activeTab === 'subscriptions' ? 'btn-primary' : 'btn-secondary'}
                    onClick={() => setActiveTab('subscriptions')}
                >
                    <FiUsers /> Subscrições das Instituições ({institutionsSubs.length})
                </button>
                <button
                    className={activeTab === 'packages' ? 'btn-primary' : 'btn-secondary'}
                    onClick={() => setActiveTab('packages')}
                >
                    <FiPackage /> Pacotes & Funcionalidades ({packages.length})
                </button>
                <button
                    className={activeTab === 'accounts' ? 'btn-primary' : 'btn-secondary'}
                    onClick={() => setActiveTab('accounts')}
                >
                    <FiCreditCard /> Contas da Nhiquela ({configForm.paymentAccounts.length})
                </button>
                <button
                    className={activeTab === 'emails' ? 'btn-primary' : 'btn-secondary'}
                    onClick={() => setActiveTab('emails')}
                >
                    <FiMail /> Emails de Pagamento
                </button>
                <button
                    className={activeTab === 'requests' ? 'btn-primary' : 'btn-secondary'}
                    onClick={() => setActiveTab('requests')}
                >
                    <FiClock /> Validação de Pagamentos
                    {pendingCount > 0 && (
                        <span style={{ background: '#ef4444', color: '#fff', borderRadius: '9999px', padding: '1px 7px', fontSize: '0.72rem', fontWeight: 700 }}>
                            {pendingCount}
                        </span>
                    )}
                </button>
                <button
                    className={activeTab === 'rbac' ? 'btn-primary' : 'btn-secondary'}
                    onClick={() => setActiveTab('rbac')}
                >
                    <FiShield /> Matriz RBAC & Perfis
                </button>
            </div>

            {loading ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    A carregar configurações da plataforma Nhiquela...
                </div>
            ) : (
                <>
                    {/* ABA: GESTÃO GLOBAL DE SUBSCRIÇÕES DAS INSTITUIÇÕES */}
                    {activeTab === 'subscriptions' && (
                        <div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                                <div className="card" style={{ borderLeft: '4px solid #0284c7' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Instituições</div>
                                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-heading)' }}>{subStats.total}</div>
                                </div>
                                <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pacotes Activos</div>
                                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981' }}>{subStats.active}</div>
                                </div>
                                <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Em Trial (7 Dias)</div>
                                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b' }}>{subStats.trial}</div>
                                </div>
                                <div className="card" style={{ borderLeft: '4px solid #ef4444' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Expiradas / Suspensas</div>
                                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ef4444' }}>{subStats.expired}</div>
                                </div>
                            </div>

                            <div className="card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                                    <div style={{ position: 'relative', flex: '1 1 280px' }}>
                                        <FiSearch style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input
                                            type="text"
                                            placeholder="Pesquisar instituição, NUIT, email ou pacote..."
                                            value={subSearch}
                                            onChange={(e) => setSubSearch(e.target.value)}
                                            style={{ paddingLeft: '2.4rem' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                        {[
                                            { k: 'all', l: `Todas (${subStats.total})` },
                                            { k: 'active', l: `Activas (${subStats.active})` },
                                            { k: 'trial', l: `Trial (${subStats.trial})` },
                                            { k: 'expired', l: `Expiradas (${subStats.expired})` },
                                            { k: 'pending', l: 'Pendentes' },
                                        ].map((f) => (
                                            <button
                                                key={f.k}
                                                className={subStatusFilter === f.k ? 'btn-primary' : 'btn-secondary'}
                                                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                                                onClick={() => setSubStatusFilter(f.k)}
                                            >
                                                {f.l}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="table-responsive">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Instituição</th>
                                                <th>Pacote / Plano</th>
                                                <th>Estado & Dias</th>
                                                <th>Utilizadores</th>
                                                <th>Expira em</th>
                                                <th style={{ textAlign: 'right' }}>Gestão de Subscrição</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredInstitutionsSubs.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                                                        Nenhuma instituição encontrada com os filtros seleccionados.
                                                    </td>
                                                </tr>
                                            ) : filteredInstitutionsSubs.map((inst) => {
                                                const s = inst.subscriptionSummary || {};
                                                const quotaFull = s.maxUsers > 0 && s.currentUsers >= s.maxUsers;
                                                return (
                                                    <tr key={inst._id}>
                                                        <td>
                                                            <strong>{inst.name}</strong>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                                NUIT: {inst.nuit || 'N/A'} • {inst.email}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <strong style={{ color: '#38bdf8' }}>{s.packageName || s.plan}</strong>
                                                            <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                                                                slug: <code>{s.plan}</code>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            {s.effectiveStatus === 'active' && (
                                                                <span className="badge badge-success">Activa • {s.remainingDays}d</span>
                                                            )}
                                                            {s.effectiveStatus === 'trial' && (
                                                                <span className="badge badge-warning">Trial • {s.remainingDays}d</span>
                                                            )}
                                                            {s.effectiveStatus === 'pending' && (
                                                                <span className="badge badge-warning">Pendente • {s.remainingDays}d</span>
                                                            )}
                                                            {s.effectiveStatus === 'expired' && (
                                                                <span className="badge badge-danger">Expirada</span>
                                                            )}
                                                            {s.pendingRequest && (
                                                                <div style={{ fontSize: '0.72rem', color: '#f59e0b', marginTop: '3px', fontWeight: 600 }}>
                                                                    Comprovativo pendente
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <span style={{ fontWeight: 700, color: quotaFull ? '#ef4444' : 'var(--text-main)' }}>
                                                                {s.currentUsers ?? 0} / {s.maxUsers > 0 ? s.maxUsers : 'Ilimitado'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {s.expiresAt ? new Date(s.expiresAt).toLocaleDateString('pt-PT') : 'N/A'}
                                                        </td>
                                                        <td style={{ textAlign: 'right' }}>
                                                            <div style={{ display: 'inline-flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                                                <button
                                                                    className="btn-primary"
                                                                    style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem' }}
                                                                    onClick={() => openSubModal(inst)}
                                                                    disabled={savingSub}
                                                                >
                                                                    <FiEdit2 size={12} /> Alterar / Renovar
                                                                </button>
                                                                <button
                                                                    className={s.isExpired ? 'btn-primary' : 'btn-danger'}
                                                                    style={{
                                                                        padding: '0.35rem 0.7rem',
                                                                        fontSize: '0.75rem',
                                                                        ...(s.isExpired ? { background: '#10b981', borderColor: '#10b981' } : {}),
                                                                    }}
                                                                    onClick={() => handleQuickExpireToggle(inst)}
                                                                    disabled={savingSub}
                                                                    title={s.isExpired ? 'Reactivar 30 dias' : 'Suspender / Expirar subscrição'}
                                                                >
                                                                    {s.isExpired ? <FiPlayCircle size={12} /> : <FiPauseCircle size={12} />}
                                                                    {s.isExpired ? 'Reactivar' : 'Suspender'}
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ABA 1: PACOTES PERSONALIZADOS */}
                    {activeTab === 'packages' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                            {packages.map((pkg) => (
                                <div key={pkg._id} className="card" style={{
                                    borderTop: `4px solid ${pkg.badgeColor || '#0284c7'}`,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    opacity: pkg.isActive ? 1 : 0.65,
                                }}>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <h3 style={{ fontSize: '1.2rem' }}>{pkg.name}</h3>
                                                    {pkg.isFeatured && (
                                                        <span className="badge badge-success">Recomendado</span>
                                                    )}
                                                    {!pkg.isActive && (
                                                        <span className="badge badge-danger">Inactivo</span>
                                                    )}
                                                </div>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>slug: {pkg.slug}</span>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: pkg.badgeColor || 'var(--primary)' }}>
                                                    {Number(pkg.price).toLocaleString()} {pkg.currency || 'MT'}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    por {pkg.durationDays || 30} dias
                                                </div>
                                            </div>
                                        </div>

                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                            {pkg.description || 'Sem descrição'}
                                        </p>

                                        {/* Limites */}
                                        <div style={{
                                            display: 'flex',
                                            gap: '0.5rem',
                                            flexWrap: 'wrap',
                                            marginBottom: '1rem',
                                            fontSize: '0.75rem',
                                            color: 'var(--text-main)',
                                        }}>
                                            <span style={{ background: 'var(--bg-secondary)', padding: '3px 8px', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                                                Utilizadores: <strong>{pkg.limits?.maxUsers === 1 ? '1 Utilizador' : pkg.limits?.maxUsers > 0 ? `Até ${pkg.limits.maxUsers} Utilizadores` : 'Ilimitados'}</strong>
                                            </span>
                                            <span style={{ background: 'var(--bg-secondary)', padding: '3px 8px', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                                                Clientes: <strong>{pkg.limits?.maxClients > 0 ? pkg.limits.maxClients : 'Ilimitado'}</strong>
                                            </span>
                                        </div>

                                        {/* Funcionalidades incluídas */}
                                        <div style={{ marginBottom: '1.25rem' }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                                                Funcionalidades Liberadas ({pkg.features?.length || 0}):
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                                {(pkg.features || []).map((fCode) => {
                                                    const fInfo = featuresCatalog.find((item) => item.code === fCode);
                                                    return (
                                                        <span key={fCode} style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            fontSize: '0.74rem',
                                                            padding: '2px 8px',
                                                            borderRadius: '9999px',
                                                            background: '#f0f9ff',
                                                            color: '#0369a1',
                                                            border: '1px solid #bae6fd',
                                                            fontWeight: 600,
                                                        }}>
                                                            <FiCheck size={11} /> {fInfo?.name || fCode}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-light)', paddingTop: '0.85rem' }}>
                                        <button className="btn-secondary" style={{ flex: 1 }} onClick={() => openEditPkg(pkg)}>
                                            <FiEdit2 size={14} /> Editar Preço & Funcionalidades
                                        </button>
                                        <button className="btn-danger" onClick={() => handleDeletePackage(pkg)} title="Remover pacote">
                                            <FiTrash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ABA 2: CONTAS DA NHIQUELA */}
                    {activeTab === 'accounts' && (
                        <form onSubmit={handleSaveConfig} className="card" style={{ maxWidth: '960px' }}>
                            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.35rem' }}>Contas Bancárias, M-Pesa & Dados da Nhiquela</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                                Estas contas são apresentadas às instituições de microcrédito quando vão efectuar o pagamento de qualquer pacote.
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                                <div>
                                    <label>Empresa / Beneficiário Oficial *</label>
                                    <input
                                        type="text"
                                        value={configForm.companyName}
                                        onChange={(e) => setConfigForm({ ...configForm, companyName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label>NUIT da Nhiquela</label>
                                    <input
                                        type="text"
                                        value={configForm.nuit}
                                        onChange={(e) => setConfigForm({ ...configForm, nuit: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label>Email de Suporte</label>
                                    <input
                                        type="email"
                                        value={configForm.supportEmail}
                                        onChange={(e) => setConfigForm({ ...configForm, supportEmail: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label>Telefone / WhatsApp Suporte</label>
                                    <input
                                        type="text"
                                        value={configForm.supportPhone}
                                        onChange={(e) => setConfigForm({ ...configForm, supportPhone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label>Instruções de Pagamento para as Instituições</label>
                                <textarea
                                    rows={2}
                                    value={configForm.instructions}
                                    onChange={(e) => setConfigForm({ ...configForm, instructions: e.target.value })}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                                <h4 style={{ fontSize: '1rem' }}>Contas Configuradas ({configForm.paymentAccounts.length})</h4>
                                <button type="button" className="btn-secondary" onClick={addPaymentAccount}>
                                    <FiPlus /> Adicionar Conta Bancária / Móvel
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                                {configForm.paymentAccounts.map((acc, idx) => (
                                    <div key={idx} style={{
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-light)',
                                        borderRadius: 'var(--radius-sm)',
                                        padding: '1rem',
                                    }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1.2fr 1.5fr auto', gap: '0.75rem', alignItems: 'end', marginBottom: '0.75rem' }}>
                                            <div>
                                                <label>Tipo</label>
                                                <select value={acc.type} onChange={(e) => updateAccountField(idx, 'type', e.target.value)}>
                                                    <option value="bank">Banco</option>
                                                    <option value="mpesa">M-Pesa</option>
                                                    <option value="emola">e-Mola</option>
                                                    <option value="mkesh">mKesh</option>
                                                    <option value="other">Outro</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label>Rótulo / Descrição</label>
                                                <input type="text" value={acc.label} onChange={(e) => updateAccountField(idx, 'label', e.target.value)} placeholder="Ex: Conta BCI" />
                                            </div>
                                            <div>
                                                <label>Banco / Operadora</label>
                                                <input type="text" value={acc.bankName} onChange={(e) => updateAccountField(idx, 'bankName', e.target.value)} placeholder="Ex: BCI / BIM" />
                                            </div>
                                            <div>
                                                <label>Titular</label>
                                                <input type="text" value={acc.accountHolder} onChange={(e) => updateAccountField(idx, 'accountHolder', e.target.value)} />
                                            </div>
                                            <button type="button" className="btn-danger" onClick={() => removePaymentAccount(idx)}>
                                                <FiTrash2 />
                                            </button>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr auto', gap: '0.75rem', alignItems: 'center' }}>
                                            <div>
                                                <label>Nº Conta</label>
                                                <input type="text" value={acc.accountNumber} onChange={(e) => updateAccountField(idx, 'accountNumber', e.target.value)} />
                                            </div>
                                            <div>
                                                <label>NIB / IBAN</label>
                                                <input type="text" value={acc.nib} onChange={(e) => updateAccountField(idx, 'nib', e.target.value)} />
                                            </div>
                                            <div>
                                                <label>Telefone (Carteiras Móveis)</label>
                                                <input type="text" value={acc.phoneNumber} onChange={(e) => updateAccountField(idx, 'phoneNumber', e.target.value)} placeholder="+258 84..." />
                                            </div>
                                            <div style={{ display: 'flex', gap: '1rem', paddingTop: '1.25rem' }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', margin: 0, cursor: 'pointer' }}>
                                                    <input type="checkbox" checked={acc.isActive !== false} onChange={(e) => updateAccountField(idx, 'isActive', e.target.checked)} style={{ width: 'auto' }} />
                                                    Activa
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{
                                marginBottom: '1.25rem',
                                padding: '0.85rem 1rem',
                                borderRadius: '8px',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-light)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '1rem',
                                flexWrap: 'wrap',
                            }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                                    Configure os emails de recepção, servidor SMTP e preferências por utilizador na aba <strong>Emails de Pagamento</strong>.
                                </span>
                                <button type="button" className="btn-secondary" onClick={() => setActiveTab('emails')}>
                                    <FiMail /> Ir para Emails de Pagamento →
                                </button>
                            </div>

                            <button type="submit" className="btn-primary" disabled={savingConfig}>
                                <FiSave /> {savingConfig ? 'A guardar...' : 'Guardar Contas da Nhiquela'}
                            </button>
                        </form>
                    )}

                    {/* ABA DEDICADA: EMAILS DE PAGAMENTO (PLATAFORMA + POR UTILIZADOR) */}
                    {activeTab === 'emails' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <form onSubmit={handleSaveConfig} className="card">
                                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FiMail color="#0284c7" /> Emails de Envio (SMTP) & Recepção de Pagamentos da Plataforma
                                </h3>
                                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                    Defina os emails que recebem notificações ao entrar um pagamento de subscrição e o servidor SMTP usado para enviar os alertas.
                                </p>

                                <div style={{ marginBottom: '1rem' }}>
                                    <label>Emails para Recepção de Alertas de Pagamentos (separados por vírgula)</label>
                                    <input
                                        type="text"
                                        placeholder="ex: financeiro@nhiquela.co.mz, mauro.patricio1@gmail.com"
                                        value={notificationEmailsText}
                                        onChange={(e) => setNotificationEmailsText(e.target.value)}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0, cursor: 'pointer', fontSize: '0.84rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={configForm.emailSettings?.notifyOnSubscriptionPayment !== false}
                                            onChange={(e) => setConfigForm({
                                                ...configForm,
                                                emailSettings: { ...(configForm.emailSettings || {}), notifyOnSubscriptionPayment: e.target.checked },
                                            })}
                                            style={{ width: 'auto' }}
                                        />
                                        Notificar por email ao receber pagamento de subscrição
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0, cursor: 'pointer', fontSize: '0.84rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={configForm.emailSettings?.smtpSecure === true}
                                            onChange={(e) => setConfigForm({
                                                ...configForm,
                                                emailSettings: { ...(configForm.emailSettings || {}), smtpSecure: e.target.checked },
                                            })}
                                            style={{ width: 'auto' }}
                                        />
                                        Ligação SSL/TLS (porta 465)
                                    </label>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', marginBottom: '1rem' }}>
                                    <div>
                                        <label>Nome do Remetente</label>
                                        <input
                                            type="text"
                                            value={configForm.emailSettings?.fromName || ''}
                                            onChange={(e) => setConfigForm({
                                                ...configForm,
                                                emailSettings: { ...(configForm.emailSettings || {}), fromName: e.target.value },
                                            })}
                                        />
                                    </div>
                                    <div>
                                        <label>Email Remetente (From)</label>
                                        <input
                                            type="email"
                                            placeholder="notificacoes@nhiquela.co.mz"
                                            value={configForm.emailSettings?.fromEmail || ''}
                                            onChange={(e) => setConfigForm({
                                                ...configForm,
                                                emailSettings: { ...(configForm.emailSettings || {}), fromEmail: e.target.value },
                                            })}
                                        />
                                    </div>
                                    <div>
                                        <label>Servidor SMTP (Host)</label>
                                        <input
                                            type="text"
                                            placeholder="smtp.gmail.com"
                                            value={configForm.emailSettings?.smtpHost || ''}
                                            onChange={(e) => setConfigForm({
                                                ...configForm,
                                                emailSettings: { ...(configForm.emailSettings || {}), smtpHost: e.target.value },
                                            })}
                                        />
                                    </div>
                                    <div>
                                        <label>Porta SMTP</label>
                                        <input
                                            type="number"
                                            value={configForm.emailSettings?.smtpPort || 587}
                                            onChange={(e) => setConfigForm({
                                                ...configForm,
                                                emailSettings: { ...(configForm.emailSettings || {}), smtpPort: Number(e.target.value) },
                                            })}
                                        />
                                    </div>
                                    <div>
                                        <label>Utilizador SMTP</label>
                                        <input
                                            type="text"
                                            placeholder="nhiquelaservicos@gmail.com"
                                            value={configForm.emailSettings?.smtpUser || ''}
                                            onChange={(e) => setConfigForm({
                                                ...configForm,
                                                emailSettings: { ...(configForm.emailSettings || {}), smtpUser: e.target.value },
                                            })}
                                        />
                                    </div>
                                    <div>
                                        <label>Senha / App Password SMTP {configForm.emailSettings?.hasSmtpPassword ? '(configurada)' : ''}</label>
                                        <input
                                            type="password"
                                            placeholder="Deixe vazio para manter a actual"
                                            value={configForm.emailSettings?.smtpPassword || ''}
                                            onChange={(e) => setConfigForm({
                                                ...configForm,
                                                emailSettings: { ...(configForm.emailSettings || {}), smtpPassword: e.target.value },
                                            })}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
                                    <input
                                        type="email"
                                        placeholder="Email de teste (opcional — se vazio usa os configurados)"
                                        value={testEmailTarget}
                                        onChange={(e) => setTestEmailTarget(e.target.value)}
                                        style={{ flex: '1 1 240px' }}
                                    />
                                    <button type="button" className="btn-secondary" onClick={handleTestPlatformEmail} disabled={testingEmail}>
                                        <FiMail /> {testingEmail ? 'A testar...' : 'Enviar Email de Teste'}
                                    </button>
                                </div>

                                <button type="submit" className="btn-primary" disabled={savingConfig}>
                                    <FiSave /> {savingConfig ? 'A guardar...' : 'Guardar Configurações de Email'}
                                </button>
                            </form>

                            <div className="card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>Configurar Email de Pagamentos por Utilizador</h3>
                                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                            Defina ou altere o endereço de email onde cada utilizador (Super Admin, Proprietário, Admin, Gestor, Financeiro) recebe alertas de pagamentos.
                                        </p>
                                    </div>
                                    <div style={{ position: 'relative', minWidth: '240px' }}>
                                        <FiSearch style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input
                                            type="text"
                                            placeholder="Filtrar utilizador ou email..."
                                            value={userEmailSearch}
                                            onChange={(e) => setUserEmailSearch(e.target.value)}
                                            style={{ paddingLeft: '2.3rem' }}
                                        />
                                    </div>
                                </div>

                                <div className="table-responsive">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Utilizador</th>
                                                <th>Perfil</th>
                                                <th>Email de Recepção de Pagamentos</th>
                                                <th>Receber Alertas</th>
                                                <th style={{ textAlign: 'right' }}>Acção</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {usersList
                                                .filter((u) => {
                                                    const q = userEmailSearch.trim().toLowerCase();
                                                    if (!q) return true;
                                                    return (
                                                        u.name?.toLowerCase().includes(q) ||
                                                        u.email?.toLowerCase().includes(q) ||
                                                        u.role?.toLowerCase().includes(q) ||
                                                        (u._draftEmail || '').toLowerCase().includes(q)
                                                    );
                                                })
                                                .map((u) => (
                                                    <tr key={u._id}>
                                                        <td>
                                                            <strong>{u.name}</strong>
                                                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Login: {u.email || u.phone}</div>
                                                        </td>
                                                        <td>
                                                            <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>{u.role}</span>
                                                        </td>
                                                        <td style={{ minWidth: '240px' }}>
                                                            <input
                                                                type="email"
                                                                placeholder={u.email || 'email@empresa.co.mz'}
                                                                value={u._draftEmail}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    setUsersList((prev) => prev.map((it) => it._id === u._id ? { ...it, _draftEmail: val } : it));
                                                                }}
                                                            />
                                                        </td>
                                                        <td>
                                                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0, cursor: 'pointer', fontSize: '0.82rem' }}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={u._draftReceive}
                                                                    onChange={(e) => {
                                                                        const checked = e.target.checked;
                                                                        setUsersList((prev) => prev.map((it) => it._id === u._id ? { ...it, _draftReceive: checked } : it));
                                                                    }}
                                                                    style={{ width: 'auto' }}
                                                                />
                                                                Activo
                                                            </label>
                                                        </td>
                                                        <td style={{ textAlign: 'right' }}>
                                                            <button
                                                                type="button"
                                                                className="btn-primary"
                                                                style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                                                                disabled={savingUserEmailId === u._id}
                                                                onClick={() => handleSaveUserPaymentEmail(u)}
                                                            >
                                                                <FiSave size={13} /> {savingUserEmailId === u._id ? 'A guardar...' : 'Guardar'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ABA 3: VALIDAÇÃO DE PAGAMENTOS */}
                    {activeTab === 'requests' && (
                        <div className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                                <h3>Pedidos de Subscrição & Comprovativos</h3>
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                    {[
                                        { k: 'pending', l: `Pendentes (${pendingCount})` },
                                        { k: 'approved', l: 'Aprovados' },
                                        { k: 'rejected', l: 'Rejeitados' },
                                        { k: 'all', l: `Todos (${requests.length})` },
                                    ].map((f) => (
                                        <button
                                            key={f.k}
                                            className={reqFilter === f.k ? 'btn-primary' : 'btn-secondary'}
                                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                                            onClick={() => setReqFilter(f.k)}
                                        >
                                            {f.l}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="table-responsive">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Instituição</th>
                                            <th>Pacote Solicitado</th>
                                            <th>Valor Pago</th>
                                            <th>Método / Ref</th>
                                            <th>Data</th>
                                            <th>Comprovativo</th>
                                            <th>Estado</th>
                                            <th style={{ textAlign: 'right' }}>Decisão</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredRequests.length === 0 ? (
                                            <tr>
                                                <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                                                    Nenhum pedido encontrado neste filtro.
                                                </td>
                                            </tr>
                                        ) : filteredRequests.map((r) => (
                                            <tr key={r._id}>
                                                <td>
                                                    <strong>{r.institution?.name || 'Instituição'}</strong>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                        {r.requestedBy?.name} ({r.requestedBy?.email})
                                                    </div>
                                                </td>
                                                <td>
                                                    <strong style={{ color: 'var(--primary)' }}>
                                                        {r.packageId?.name || r.packageName || r.planRequested}
                                                    </strong>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                        {r.durationDays || 30} dias • {r.packageId?.features?.length || 0} módulos • {r.packageId?.limits?.maxUsers === 1 ? '1 utilizador' : r.packageId?.limits?.maxUsers > 0 ? `${r.packageId.limits.maxUsers} utilizadores` : 'Utilizadores ilimitados'}
                                                    </div>
                                                </td>
                                                <td><strong>{Number(r.amountPaid).toLocaleString()} MT</strong></td>
                                                <td>
                                                    <div>{r.paymentMethod || 'Transferência'}</div>
                                                    {r.referenceCode && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ref: {r.referenceCode}</div>}
                                                </td>
                                                <td>{new Date(r.createdAt).toLocaleDateString('pt-PT')}</td>
                                                <td>
                                                    {r.proofOfPaymentUrl ? (
                                                        <a
                                                            href={`${apiOrigin}${r.proofOfPaymentUrl}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="btn-secondary"
                                                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', textDecoration: 'none' }}
                                                        >
                                                            <FiExternalLink size={12} /> Ver Ficheiro
                                                        </a>
                                                    ) : '-'}
                                                </td>
                                                <td>
                                                    {r.status === 'approved' && <span className="badge badge-success">Aprovado</span>}
                                                    {r.status === 'pending' && <span className="badge badge-warning">Pendente</span>}
                                                    {r.status === 'rejected' && (
                                                        <div>
                                                            <span className="badge badge-danger">Rejeitado</span>
                                                            {r.reviewNotes && <div style={{ fontSize: '0.72rem', color: '#dc2626', marginTop: '3px' }}>{r.reviewNotes}</div>}
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                                                        {r.status !== 'approved' && (
                                                            <button
                                                                className="btn-primary"
                                                                disabled={processingReq}
                                                                onClick={() => handleApprove(r._id)}
                                                                style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem', background: '#10b981' }}
                                                            >
                                                                <FiCheckCircle size={13} /> Aprovar
                                                            </button>
                                                        )}
                                                        {r.status !== 'rejected' && (
                                                            <button
                                                                className="btn-danger"
                                                                disabled={processingReq}
                                                                onClick={() => setRejectModal({ open: true, reqId: r._id, reason: '' })}
                                                                style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem' }}
                                                            >
                                                                <FiXCircle size={13} /> Rejeitar
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ABA 4: MATRIZ RBAC INSPIRADA NO DDJLAW */}
                    {activeTab === 'rbac' && (
                        <div className="card">
                            <h3 style={{ marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FiShield color="#10b981" /> Matriz de Controlo de Acesso (RBAC + Pacotes)
                            </h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                                O acesso efectivo de cada utilizador combina <strong>dois níveis</strong>: (1) as funcionalidades liberadas pelo <strong>Pacote pago pela Instituição</strong> e (2) as permissões granulares do seu <strong>Perfil RBAC</strong>.
                            </p>

                            <div className="table-responsive">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Perfil / Função</th>
                                            <th>Clientes & KYC</th>
                                            <th>Créditos & Análise</th>
                                            <th>Aprovar / Rejeitar</th>
                                            <th>Desembolso & Caixa</th>
                                            <th>Cobranças</th>
                                            <th>Utilizadores & RBAC</th>
                                            <th>Subscrição</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[
                                            { role: '👑 Super Admin (Nhiquela)', c: 'Global', cr: 'Global', ap: 'Override', cx: 'Global', cb: 'Global', rb: 'Total + Pacotes', sub: 'Gere Pacotes & Contas' },
                                            { role: '🏛️ Proprietário (Owner)', c: 'Sim', cr: 'Sim', ap: 'Sim (Ilimitado)', cx: 'Sim', cb: 'Sim', rb: 'Sim (Cria Perfis)', sub: 'Submete Comprovativos' },
                                            { role: '🛡️ Administrador (Admin)', c: 'Sim', cr: 'Sim', ap: 'Sim', cx: 'Sim', cb: 'Sim', rb: 'Sim', sub: 'Submete Comprovativos' },
                                            { role: '🛠️ Gestor (Manager)', c: 'Sim', cr: 'Sim', ap: 'Sim (Até Limite)', cx: 'Sim', cb: 'Sim', rb: 'Não', sub: 'Consulta' },
                                            { role: '🔎 Analista (Analyst)', c: 'Ver/Histórico', cr: 'Analisar/Recomendar', ap: 'Não', cx: 'Não', cb: 'Não', rb: 'Não', sub: 'Não' },
                                            { role: '💰 Tesoureiro (Financial)', c: 'Não', cr: 'Desembolso', ap: 'Não', cx: 'Sim', cb: 'Não', rb: 'Não', sub: 'Não' },
                                            { role: '📞 Cobrador (Collector)', c: 'Ver/Histórico', cr: 'Ver', ap: 'Não', cx: 'Não', cb: 'Sim', rb: 'Não', sub: 'Não' },
                                            { role: '🤝 Agente / Representante', c: 'Criar/Editar', cr: 'Criar Solicitação', ap: 'Não', cx: 'Não', cb: 'Não', rb: 'Não', sub: 'Não' },
                                            { role: '📋 Auditor', c: 'Leitura', cr: 'Leitura', ap: 'Não', cx: 'Leitura', cb: 'Leitura', rb: 'Ver Logs/Perfis', sub: 'Não' },
                                        ].map((row) => (
                                            <tr key={row.role}>
                                                <td style={{ fontWeight: 700 }}>{row.role}</td>
                                                <td>{row.c}</td>
                                                <td>{row.cr}</td>
                                                <td>{row.ap}</td>
                                                <td>{row.cx}</td>
                                                <td>{row.cb}</td>
                                                <td>{row.rb}</td>
                                                <td>{row.sub}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Modal Criar / Editar Pacote Personalizado */}
            <Modal
                maxWidth="820px"
                isOpen={pkgModal.open}
                onClose={() => !savingPkg && setPkgModal({ open: false, editingId: null })}
                title={pkgModal.editingId ? 'Editar Pacote & Funcionalidades' : 'Criar Novo Pacote Personalizado'}
            >
                <form onSubmit={handleSavePackage}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '0.85rem', marginBottom: '1rem' }}>
                        <div>
                            <label>Nome do Pacote *</label>
                            <input
                                type="text"
                                placeholder="Ex: Corporativo Ouro"
                                value={pkgForm.name}
                                onChange={(e) => setPkgForm({ ...pkgForm, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label>Preço (MT) *</label>
                            <input
                                type="number"
                                min="0"
                                value={pkgForm.price}
                                onChange={(e) => setPkgForm({ ...pkgForm, price: Number(e.target.value) })}
                                required
                            />
                        </div>
                        <div>
                            <label>Duração (Dias) *</label>
                            <input
                                type="number"
                                min="1"
                                value={pkgForm.durationDays}
                                onChange={(e) => setPkgForm({ ...pkgForm, durationDays: Number(e.target.value) })}
                                required
                            />
                        </div>
                        <div>
                            <label>Cor Destaque</label>
                            <input
                                type="color"
                                value={pkgForm.badgeColor}
                                onChange={(e) => setPkgForm({ ...pkgForm, badgeColor: e.target.value })}
                                style={{ height: '40px', padding: '4px' }}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label>Descrição do Pacote</label>
                        <input
                            type="text"
                            placeholder="Resumo comercial apresentado às instituições..."
                            value={pkgForm.description}
                            onChange={(e) => setPkgForm({ ...pkgForm, description: e.target.value })}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0.85rem', marginBottom: '1.25rem', alignItems: 'center' }}>
                        <div>
                            <label>Máx. Utilizadores (0 = Ilimitado)</label>
                            <input
                                type="number"
                                min="0"
                                value={pkgForm.limits.maxUsers}
                                onChange={(e) => setPkgForm({ ...pkgForm, limits: { ...pkgForm.limits, maxUsers: Number(e.target.value) } })}
                            />
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                                {[
                                    { label: '1 Util.', value: 1 },
                                    { label: '3 Util.', value: 3 },
                                    { label: '5 Util.', value: 5 },
                                    { label: '10 Util.', value: 10 },
                                    { label: 'Ilimitado', value: 0 },
                                ].map((preset) => {
                                    const active = Number(pkgForm.limits.maxUsers) === preset.value;
                                    return (
                                        <button
                                            key={preset.value}
                                            type="button"
                                            onClick={() => setPkgForm({ ...pkgForm, limits: { ...pkgForm.limits, maxUsers: preset.value } })}
                                            style={{
                                                padding: '2px 7px',
                                                fontSize: '0.72rem',
                                                fontWeight: 600,
                                                borderRadius: '6px',
                                                border: active ? '1px solid #0284c7' : '1px solid var(--border-light)',
                                                background: active ? '#e0f2fe' : 'var(--bg-secondary)',
                                                color: active ? '#0369a1' : 'var(--text-main)',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            {preset.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div>
                            <label>Máx. Clientes (0 = Ilimitado)</label>
                            <input
                                type="number"
                                min="0"
                                value={pkgForm.limits.maxClients}
                                onChange={(e) => setPkgForm({ ...pkgForm, limits: { ...pkgForm.limits, maxClients: Number(e.target.value) } })}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', paddingTop: '1.25rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0, cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={pkgForm.isActive}
                                    onChange={(e) => setPkgForm({ ...pkgForm, isActive: e.target.checked })}
                                    style={{ width: 'auto' }}
                                />
                                Activo
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0, cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={pkgForm.isFeatured}
                                    onChange={(e) => setPkgForm({ ...pkgForm, isFeatured: e.target.checked })}
                                    style={{ width: 'auto' }}
                                />
                                Recomendado
                            </label>
                        </div>
                    </div>

                    {/* Seletor de Funcionalidades Liberadas pelo Pacote */}
                    <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem', marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <FiLayers color="#0284c7" /> Funcionalidades Incluídas neste Pacote ({pkgForm.features.length}/{featuresCatalog.length})
                            </span>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                                    onClick={() => setPkgForm({ ...pkgForm, features: featuresCatalog.map((f) => f.code) })}
                                >
                                    Selecionar Todas
                                </button>
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                                    onClick={() => setPkgForm({ ...pkgForm, features: ['dashboard'] })}
                                >
                                    Mínimo (Só Dashboard)
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
                            {Object.entries(featuresByCategory).map(([category, items]) => (
                                <div key={category} style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#0284c7', marginBottom: '0.5rem' }}>
                                        {category}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                                        {items.map((feat) => {
                                            const checked = pkgForm.features.includes(feat.code);
                                            return (
                                                <label
                                                    key={feat.code}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'flex-start',
                                                        gap: '8px',
                                                        margin: 0,
                                                        cursor: 'pointer',
                                                        fontWeight: checked ? 600 : 400,
                                                        color: 'var(--text-main)',
                                                        fontSize: '0.82rem',
                                                    }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => toggleFeature(feat.code)}
                                                        style={{ width: 'auto', marginTop: '3px' }}
                                                    />
                                                    <div>
                                                        <div>{feat.name}</div>
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>{feat.description}</div>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                        <button type="button" className="btn-secondary" onClick={() => setPkgModal({ open: false, editingId: null })}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-primary" disabled={savingPkg}>
                            <FiSave /> {savingPkg ? 'A guardar...' : 'Guardar Pacote'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal Rejeição de Comprovativo */}
            <Modal
                maxWidth="460px"
                isOpen={rejectModal.open}
                onClose={() => !processingReq && setRejectModal({ open: false, reqId: null, reason: '' })}
                title="Rejeitar Comprovativo de Pagamento"
            >
                <form onSubmit={handleReject}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label>Motivo da Rejeição (Obrigatório) *</label>
                        <textarea
                            rows={4}
                            placeholder="Indique o motivo (ex: Comprovativo ilegível ou valor divergente)"
                            value={rejectModal.reason}
                            onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                            required
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
                        <button type="button" className="btn-secondary" onClick={() => setRejectModal({ open: false, reqId: null, reason: '' })}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-danger" disabled={processingReq}>
                            <FiXCircle /> Confirmar Rejeição
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal Gestão / Alteração de Subscrição da Instituição */}
            <Modal
                maxWidth="540px"
                isOpen={subModal.open}
                onClose={() => !savingSub && setSubModal({ open: false, inst: null, plan: 'standard', durationDays: 30, maxUsers: 0, status: 'active' })}
                title="Gerir Subscrição da Instituição"
            >
                {subModal.inst && (
                    <form onSubmit={handleSaveInstSub}>
                        <p style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
                            Instituição: <strong>{subModal.inst.name}</strong>
                        </p>

                        <div style={{ marginBottom: '1rem' }}>
                            <label>Pacote / Plano *</label>
                            <select
                                value={subModal.plan}
                                onChange={(e) => {
                                    const chosenSlug = e.target.value;
                                    const pkgObj = packages.find((p) => p.slug === chosenSlug);
                                    setSubModal({
                                        ...subModal,
                                        plan: chosenSlug,
                                        durationDays: chosenSlug === 'trial' ? 7 : (pkgObj?.durationDays || 30),
                                        maxUsers: chosenSlug === 'trial' ? 0 : (pkgObj?.limits?.maxUsers ?? 0),
                                    });
                                }}
                            >
                                <option value="trial">Período Experimental (Trial - 7 Dias)</option>
                                {packages.map((pkg) => (
                                    <option key={pkg._id} value={pkg.slug}>
                                        {pkg.name} ({Number(pkg.price).toLocaleString()} {pkg.currency || 'MT'} • {pkg.durationDays}d • {pkg.limits?.maxUsers > 0 ? `${pkg.limits.maxUsers} util.` : 'Ilimitado'})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1rem' }}>
                            <div>
                                <label>Duração a Conceder (Dias) *</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={subModal.durationDays}
                                    onChange={(e) => setSubModal({ ...subModal, durationDays: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label>Estado da Subscrição *</label>
                                <select
                                    value={subModal.status}
                                    onChange={(e) => setSubModal({ ...subModal, status: e.target.value })}
                                >
                                    <option value="active">Activa</option>
                                    <option value="expired">Expirada / Suspensa</option>
                                    <option value="pending">Pendente</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.25rem' }}>
                            <label>Limite de Utilizadores Activos (0 = Ilimitado)</label>
                            <input
                                type="number"
                                min="0"
                                value={subModal.maxUsers}
                                onChange={(e) => setSubModal({ ...subModal, maxUsers: e.target.value })}
                            />
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '6px' }}>
                                {[
                                    { label: '1 Utilizador', value: 1 },
                                    { label: '3 Utilizadores', value: 3 },
                                    { label: '5 Utilizadores', value: 5 },
                                    { label: '10 Utilizadores', value: 10 },
                                    { label: 'Ilimitado (0)', value: 0 },
                                ].map((preset) => {
                                    const isActivePreset = Number(subModal.maxUsers) === preset.value;
                                    return (
                                        <button
                                            key={preset.value}
                                            type="button"
                                            onClick={() => setSubModal({ ...subModal, maxUsers: preset.value })}
                                            style={{
                                                padding: '3px 8px',
                                                fontSize: '0.74rem',
                                                fontWeight: 600,
                                                borderRadius: '6px',
                                                border: isActivePreset ? '1px solid #0284c7' : '1px solid var(--border-light)',
                                                background: isActivePreset ? '#e0f2fe' : 'var(--bg-secondary)',
                                                color: isActivePreset ? '#0369a1' : 'var(--text-main)',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            {preset.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => setSubModal({ open: false, inst: null, plan: 'standard', durationDays: 30, maxUsers: 0, status: 'active' })}
                                disabled={savingSub}
                            >
                                Cancelar
                            </button>
                            <button type="submit" className="btn-primary" disabled={savingSub}>
                                <FiSave /> {savingSub ? 'A guardar...' : 'Guardar Subscrição'}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
        </Layout>
    );
};

export default SuperAdminPackages;

