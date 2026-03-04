import React, { useState, useEffect } from 'react';
import {
    FiDollarSign, FiCalendar, FiPieChart, FiDownload,
    FiCheckCircle, FiInfo, FiTrendingUp, FiSettings,
    FiShare2, FiUser, FiClock, FiCreditCard, FiArrowRight
} from 'react-icons/fi';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api';

const FinancialSimulator = ({ onSimulationComplete, initialAmount = 5000, template = 'neon', clientId = null }) => {
    const [amount, setAmount] = useState(initialAmount);
    const [interestRate, setInterestRate] = useState(10);
    const [term, setTerm] = useState(1);
    const [periodicity, setPeriodicity] = useState('monthly');
    const [loading, setLoading] = useState(false);
    const [simulation, setSimulation] = useState(null);
    const [schedule, setSchedule] = useState([]);
    const [isCustomRate, setIsCustomRate] = useState(false);
    const [clientName, setClientName] = useState('');
    const [identityDocument, setIdentityDocument] = useState('');
    const [phone, setPhone] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState('');
    const [amortizationType, setAmortizationType] = useState('price');
    const [confidence, setConfidence] = useState({
        score: 500,
        confidenceLevel: 3,
        label: 'Moderado'
    });
    useEffect(() => {
        const fetchClientData = async () => {
            if (clientId) {
                try {
                    const res = await api.get(`/clients/${clientId}`);
                    const client = res.data.data.client;
                    if (client) {
                        setClientName(client.name || '');
                        setIdentityDocument(client.identityDocument || '');
                        setPhone(client.phone || '');
                        if (client.riskProfile) {
                            setConfidence({
                                score: client.riskProfile.score || 500,
                                confidenceLevel: client.riskProfile.confidenceLevel || 3,
                                label: client.riskProfile.label || 'Moderado'
                            });
                        }
                    }
                } catch (error) {
                    console.error("Erro ao buscar dados do cliente:", error);
                }
            }
        };
        fetchClientData();
    }, [clientId]);

    const presets = [
        { label: 'Baixa', rate: 5, color: '#10b981' },
        { label: 'Normal', rate: 10, color: '#3b82f6' },
        { label: 'Risco', rate: 25, color: '#ef4444' }
    ];

    // Debounce simulation fetch
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchSimulation();
        }, 500);
        return () => clearTimeout(timer);
    }, [amount, term, periodicity, interestRate, amortizationType]);

    const fetchSimulation = async () => {
        setLoading(true);
        try {
            const response = await api.post('/credits/simulate', {
                amount,
                term,
                interestRate,
                periodicity,
                startDate,
                amortizationType
            });
            if (response.data.success) {
                setSimulation(response.data.data);
                setSchedule(response.data.schedule);

                // Update calculated end date from simulation result if it changed
                if (response.data.data.summary?.formattedEndDate) {
                    const [d, m, y] = response.data.data.summary.formattedEndDate.split('/');
                    setEndDate(`${y}-${m}-${d}`);
                }

                if (onSimulationComplete) {
                    onSimulationComplete(response.data.data);
                }
            }
        } catch (error) {
            console.error("Erro na simulação:", error);
        } finally {
            setLoading(false);
        }
    };

    // Helper to calculate term when end date is manualy picked
    const calculateTermFromDates = (start, end, period) => {
        const d1 = new Date(start);
        const d2 = new Date(end);
        const diffTime = Math.abs(d2 - d1);

        switch (period) {
            case 'daily': return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            case 'weekly': return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
            case 'biweekly': return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 14));
            case 'monthly':
                return (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
            default: return 1;
        }
    };

    const handleEndDateChange = (val) => {
        setEndDate(val);
        const newTerm = calculateTermFromDates(startDate, val, periodicity);
        if (newTerm > 0) setTerm(newTerm);
    };

    // Helper para exibir data em dd/mm/yyyy
    const CustomDateInput = ({ value, onChange, label, style, labelStyle }) => {
        const displayDate = value ? value.split('-').reverse().join('/') : '';

        return (
            <div style={{ position: 'relative', width: '100%', ...style }}>
                {label && <label style={{ display: 'block', fontSize: '0.7rem', opacity: 0.8, marginBottom: '0.4rem', ...labelStyle }}>{label}</label>}
                <div style={{ position: 'relative' }}>
                    <input
                        type="text"
                        readOnly
                        value={displayDate}
                        placeholder="dd/mm/aaaa"
                        style={{
                            width: '100%',
                            height: '40px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'white',
                            padding: '0 0.75rem',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            ...style
                        }}
                        onClick={(e) => e.target.nextSibling.showPicker()}
                    />
                    <input
                        type="date"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            opacity: 0,
                            pointerEvents: 'none'
                        }}
                    />
                </div>
            </div>
        );
    };

    const handleDownloadPDF = async () => {
        setLoading(true);
        try {
            // 1. Salvar a simulação primeiro para ter um ID e número sequencial
            const saveResponse = await api.post('/simulations', {
                amount,
                term,
                rate: interestRate,
                period: periodicity,
                start: startDate,
                clientName,
                identityDocument,
                phone,
                client: clientId, // Link para o cliente se fornecido
                amortizationType,
                riskProfile: confidence
            });

            if (saveResponse.data.success) {
                const simulationId = saveResponse.data.data._id;

                // 2. Baixar o PDF usando o ID da simulação salva
                const pdfResponse = await api.get(`/simulations/${simulationId}/pdf`, {
                    responseType: 'arraybuffer'
                });

                const blob = new Blob([pdfResponse.data], { type: 'application/pdf' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `Simulacao_${saveResponse.data.data.simulationNumber}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.remove();
            }
        } catch (error) {
            console.error("Erro ao gerar/baixar PDF Profissional:", error);
            alert("Erro ao gerar PDF. Certifique-se que os dados estão corretos.");
        } finally {
            setLoading(false);
        }
    };

    const handleWhatsAppShare = async () => {
        setLoading(true);
        try {
            // 1. Salvar ou obter a simulação
            const saveResponse = await api.post('/simulations', {
                amount,
                term,
                rate: interestRate,
                period: periodicity,
                start: startDate,
                clientName,
                identityDocument,
                phone,
                amortizationType,
                riskProfile: confidence
            });

            if (saveResponse.data.success) {
                const simulationId = saveResponse.data.data._id;

                // 2. Solicitar ao backend para enviar o PDF via WhatsApp
                const sendResponse = await api.post(`/simulations/${simulationId}/send`);

                if (sendResponse.data.success) {
                    alert('Simulação enviada com sucesso ao WhatsApp do cliente!');
                }
            }
        } catch (error) {
            console.error("Erro ao enviar via WhatsApp:", error);
            alert("Erro ao enviar WhatsApp. Verifique se o telefone está correto e o serviço está ativo.");

            // Fallback para o link manual se o serviço falhar
            const message = `Olá ${clientName},\n\nAqui está a sua simulação de ${amount.toLocaleString()} MT.\nPrestação: ${simulation?.paymentAmount?.toLocaleString()} MT`;
            const url = `https://wa.me/${phone?.replace(/\s/g, '') || ''}?text=${encodeURIComponent(message)}`;
            window.open(url, '_blank');
        } finally {
            setLoading(false);
        }
    };

    const periodLabels = {
        daily: 'Dias',
        weekly: 'Semanas',
        biweekly: 'Quinzenas',
        monthly: 'Meses'
    };

    const chartData = schedule.map(item => ({
        name: item.number,
        balance: item.balance,
        principal: item.principal,
        interest: item.interest
    }));

    const getRiskLabel = () => {
        if (interestRate <= 7) return { label: 'Baixo', color: '#10b981' };
        if (interestRate <= 15) return { label: 'Médio', color: 'var(--warning)' };
        return { label: 'Alto', color: 'var(--danger)' };
    };

    const risk = getRiskLabel();

    // ==========================================
    // TEMPLATE RENDERERS
    // ==========================================

    const renderNeon = () => (
        <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <FiPieChart className="text-accent" /> Simulador de crédito
                </h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span style={{ padding: '0.25rem 0.75rem', borderRadius: '20px', background: `${risk.color}20`, color: risk.color, fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <FiCheckCircle size={12} /> Risco: {risk.label}
                    </span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <label>Valor Pretendido</label>
                            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--accent)', borderRadius: '8px', padding: '0.2rem 0.75rem' }}>
                                <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} style={{ width: '120px', background: 'transparent', border: 'none', color: 'var(--accent)', fontWeight: 800, fontSize: '1.2rem', textAlign: 'right', outline: 'none' }} />
                                <span style={{ marginLeft: '0.5rem', fontWeight: 800, color: 'var(--accent)' }}>MT</span>
                            </div>
                        </div>
                        <input type="range" min="500" max="500000" step="500" value={amount} onChange={(e) => setAmount(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent)' }} />
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <label>Taxa de Juros (%)</label>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                {presets.map(p => (
                                    <button key={p.label} onClick={() => { setInterestRate(p.rate); setIsCustomRate(false); }} style={{ background: interestRate === p.rate && !isCustomRate ? p.color : 'rgba(255,255,255,0.05)', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.65rem' }}>{p.label}</button>
                                ))}
                            </div>
                        </div>
                        <input type="number" value={interestRate} onChange={(e) => { setInterestRate(Math.max(0, Number(e.target.value))); setIsCustomRate(true); }} style={{ width: '100px', padding: '0.6rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--accent)', borderRadius: '8px', color: 'white', fontWeight: 'bold', textAlign: 'center' }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div>
                            <label style={{ fontSize: '0.7rem', opacity: 0.8 }}>Periodicidade</label>
                            <select value={periodicity} onChange={(e) => setPeriodicity(e.target.value)} style={{ marginTop: '0.4rem', height: '48px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <option value="daily">Diário (Corridos)</option><option value="weekly">Semanal</option><option value="biweekly">Quinzenal</option><option value="monthly">Mensal</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.7rem', opacity: 0.8 }}>Prazo em {periodLabels[periodicity]}</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.4rem' }}>
                                <button onClick={() => setTerm(Math.max(1, term - 1))} style={{ width: '48px', height: '48px', borderRadius: '8px 0 0 8px', background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>-</button>
                                <input type="number" value={term} onChange={(e) => setTerm(Math.max(1, Number(e.target.value)))} style={{ textAlign: 'center', fontWeight: 800, fontSize: '1.4rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--accent)', width: '100%', height: '48px' }} />
                                <button onClick={() => setTerm(term + 1)} style={{ width: '48px', height: '48px', borderRadius: '0 8px 8px 0', background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>+</button>
                            </div>
                        </div>
                    </div>

                    {/* Tipo de Amortização */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <label style={{ fontSize: '0.7rem', opacity: 0.8, display: 'block', marginBottom: '0.75rem' }}>Tipo de Amortização</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.4rem' }}>
                            {[
                                { id: 'price', label: 'Price', desc: 'Fixas' },
                                { id: 'sac', label: 'SAC', desc: 'Decrescente' },
                                { id: 'flat', label: 'Flat', desc: 'Capital orig.' },
                                { id: 'simples', label: 'Simples', desc: 'Juros no fim' },
                                { id: 'composto', label: 'Composto', desc: 'Balloon' },
                            ].map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setAmortizationType(t.id)}
                                    style={{
                                        padding: '0.55rem 0.3rem',
                                        borderRadius: '10px',
                                        border: amortizationType === t.id ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.1)',
                                        background: amortizationType === t.id ? 'rgba(0,230,118,0.12)' : 'rgba(255,255,255,0.04)',
                                        color: amortizationType === t.id ? 'var(--accent)' : 'rgba(255,255,255,0.7)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        textAlign: 'center'
                                    }}
                                >
                                    <div style={{ fontSize: '0.68rem', fontWeight: 700 }}>{t.label}</div>
                                    <div style={{ fontSize: '0.58rem', opacity: 0.7, marginTop: '0.1rem' }}>{t.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <CustomDateInput
                            label="Data Início"
                            value={startDate}
                            onChange={setStartDate}
                        />
                        <CustomDateInput
                            label="Data Fim (Opcional)"
                            value={endDate}
                            onChange={handleEndDateChange}
                        />
                    </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '16px', padding: '1.75rem', display: 'flex', flexDirection: 'column', border: '1px solid rgba(255,255,255,0.05)' }}>
                    {loading ? <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Sincronizando...</div> : simulation ? (
                        <>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Prestação Estimada</p>
                                <h3 style={{ fontSize: '2.8rem', fontWeight: 900, color: 'var(--accent)' }}>{simulation.paymentAmount?.toLocaleString()} MT <span style={{ fontSize: '0.9rem' }}>/ {periodicity === 'monthly' ? 'mês' : 'período'}</span></h3>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', margin: '1.5rem 0' }}>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px' }}>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total a pagar</p>
                                    <p style={{ fontSize: '1.15rem', fontWeight: 800 }}>{simulation.totalPayable?.toLocaleString()} MT</p>
                                </div>
                                <div style={{ background: 'rgba(0,255,0,0.03)', padding: '1rem', borderRadius: '12px' }}>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>Juros</p>
                                    <p style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f59e0b' }}>{simulation.totalInterest?.toLocaleString()} MT</p>
                                </div>
                            </div>
                            <div style={{ flex: 1, minHeight: '130px', margin: '0 -1rem' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px' }} cursor={false} />
                                        <Area type="monotone" dataKey="balance" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.1} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <button onClick={handleDownloadPDF} className="btn-primary" style={{ marginTop: '1.5rem', width: '100%' }}><FiDownload /> Baixar PDF</button>
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    );

    const renderInstitutional = () => (
        <div style={{ background: 'white', borderRadius: '12px', padding: '2.5rem', color: '#1e293b', boxShadow: '0 4px 25px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
            <header style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '1.5rem', marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: '#0f172a', padding: '0.75rem', borderRadius: '8px', color: 'white' }}><FiCreditCard size={24} /></div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Simulador Institucional</h2>
                </div>
            </header>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '4rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="form-group-inst">
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 650, color: '#475569', marginBottom: '0.75rem' }}>Valor Solicitado (MT)</label>
                        <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '1.1rem' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="form-group-inst">
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 650, color: '#475569', marginBottom: '0.75rem' }}>Taxa (%)</label>
                            <input type="number" value={interestRate} onChange={(e) => setInterestRate(Number(e.target.value))} style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1.5px solid #cbd5e1' }} />
                        </div>
                        <div className="form-group-inst">
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 650, color: '#475569', marginBottom: '0.75rem' }}>Freq.</label>
                            <select value={periodicity} onChange={(e) => setPeriodicity(e.target.value)} style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1.5px solid #cbd5e1' }}>
                                <option value="monthly">Mensal</option><option value="weekly">Semanal</option>
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <CustomDateInput
                            label="Data Início"
                            labelStyle={{ color: '#475569', fontWeight: 650, fontSize: '0.85rem' }}
                            value={startDate}
                            onChange={setStartDate}
                            style={{ background: 'white', border: '1.5px solid #cbd5e1', color: '#1e293b' }}
                        />
                        <CustomDateInput
                            label="Data Fim"
                            labelStyle={{ color: '#475569', fontWeight: 650, fontSize: '0.85rem' }}
                            value={endDate}
                            onChange={handleEndDateChange}
                            style={{ background: 'white', border: '1.5px solid #cbd5e1', color: '#1e293b' }}
                        />
                    </div>
                </div>
                <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '1.5rem' }}>Resumo</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}><span>Parcela:</span><span style={{ fontWeight: 700 }}>{simulation?.paymentAmount?.toLocaleString()} MT</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}><span>Juros:</span><span style={{ fontWeight: 700 }}>{simulation?.totalInterest?.toLocaleString()} MT</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}><span>Total:</span><span style={{ fontWeight: 800, color: '#2563eb' }}>{simulation?.totalPayable?.toLocaleString()} MT</span></div>
                    </div>
                    <button onClick={handleDownloadPDF} style={{ width: '100%', marginTop: '2.5rem', padding: '1rem', background: '#0f172a', color: 'white', borderRadius: '8px', fontWeight: 700, border: 'none' }}>Gerar PDF</button>
                </div>
            </div>
        </div>
    );

    const renderMobile = () => (
        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '32px', color: '#0f172a', maxWidth: '420px', margin: '0 auto', boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}>
            <header style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 900 }}>Simular meu Crédito</h2>
                <div style={{ width: '40px', height: '4px', background: '#3b82f6', margin: '8px auto', borderRadius: '2px' }}></div>
            </header>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}><span>Quanto precisa?</span><span style={{ color: '#3b82f6', fontWeight: 900 }}>{amount.toLocaleString()} MT</span></div>
                    <input type="range" min="1000" max="250000" step="1000" value={amount} onChange={(e) => setAmount(Number(e.target.value))} style={{ width: '100%' }} />
                </div>
                <div>
                    <span style={{ fontWeight: 700, display: 'block', marginBottom: '1rem' }}>Prazo</span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                        {[7, 15, 30, 60].map(d => (
                            <button key={d} onClick={() => { setTerm(d); setPeriodicity('daily'); }} style={{ padding: '0.85rem 0', borderRadius: '16px', background: term === d && periodicity === 'daily' ? '#3b82f6' : 'white', color: term === d && periodicity === 'daily' ? 'white' : '#64748b', border: '1.5px solid' + (term === d && periodicity === 'daily' ? '#3b82f6' : '#e2e8f0'), fontWeight: 800 }}>{d}d</button>
                        ))}
                    </div>
                </div>
                <div style={{ background: 'white', borderRadius: '24px', padding: '2rem', textAlign: 'center', boxShadow: '0 15px 35px rgba(59, 130, 246, 0.1)' }}>
                    <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Vai pagar apenas</p>
                    <h3 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#3b82f6' }}>{simulation?.totalPayable?.toLocaleString()} MT</h3>
                    <div style={{ marginTop: '1rem' }}>Parcela: <strong>{simulation?.paymentAmount?.toLocaleString()} MT</strong></div>
                </div>
                <button style={{ width: '100%', padding: '1.4rem', background: '#0f172a', color: 'white', borderRadius: '20px', fontWeight: 900, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>Pedir Crédito Agora <FiArrowRight /></button>
            </div>
        </div>
    );

    const renderAgent = () => (
        <div style={{ background: '#0f172a', borderRadius: '24px', padding: '2.5rem', color: 'white', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div style={{ background: '#3b82f6', padding: '0.85rem', borderRadius: '16px' }}><FiTrendingUp size={28} /></div>
                <div><h2 style={{ fontSize: '1.3rem', fontWeight: 900 }}>Simulador Agente</h2><p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Proposta Rápida</p></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: '3rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                    <div className="form-group">
                        <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Cliente</label>
                        <input type="text" placeholder="Nome do Cliente" value={clientName} onChange={(e) => setClientName(e.target.value)} style={{ width: '100%', padding: '0.85rem', background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
                        <div><label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Valor</label><input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} style={{ width: '100%', padding: '0.85rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white' }} /></div>
                        <div><label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Taxa (%)</label><input type="number" value={interestRate} onChange={(e) => setInterestRate(Number(e.target.value))} style={{ width: '100%', padding: '0.85rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', textAlign: 'center' }} /></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <CustomDateInput
                            label="Início"
                            value={startDate}
                            onChange={setStartDate}
                            style={{ border: '1.5px solid rgba(255,255,255,0.1)' }}
                        />
                        <CustomDateInput
                            label="Fim"
                            value={endDate}
                            onChange={handleEndDateChange}
                            style={{ border: '1.5px solid rgba(255,255,255,0.1)' }}
                        />
                    </div>
                </div>
                <div style={{ background: 'rgba(59, 130, 246, 0.04)', borderRadius: '24px', padding: '2rem', border: '1px solid rgba(59, 130, 246, 0.1)', textAlign: 'center' }}>
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Parcela</p>
                    <h3 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#3b82f6', marginBottom: '1.5rem' }}>{simulation?.paymentAmount?.toLocaleString()} MT</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <button onClick={handleWhatsAppShare} style={{ width: '100%', padding: '1rem', background: '#22c55e', color: 'white', borderRadius: '16px', fontWeight: 800, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><FiShare2 /> WhatsApp</button>
                        <button onClick={handleDownloadPDF} style={{ width: '100%', padding: '1rem', background: 'rgba(255,255,255,0.1)', color: 'white', borderRadius: '16px', fontWeight: 800, border: 'none' }}>Gerar PDF</button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderPremium = () => (
        <div style={{
            background: '#ffffff',
            padding: '4rem',
            color: '#000',
            fontFamily: "'Inter', sans-serif",
            border: '2px solid #000',
            maxWidth: '900px',
            margin: '0 auto'
        }}>
            <header style={{ textAlign: 'center', marginBottom: '3rem', borderBottom: '2px solid #000', paddingBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>Simulação de Crédito</h1>
                <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>FINTECH PREMIUM – DOCUMENTO OFICIAL</p>
            </header>

            <div style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ background: '#f1f5f9', padding: '8px 12px', fontSize: '0.9rem', fontWeight: 800, border: '1px solid #000', marginBottom: '0' }}>1. IDENTIFICAÇÃO DO CLIENTE</h3>
                <div style={{ border: '1px solid #000', borderTop: 'none', padding: '1.5rem', display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '1.5rem' }}>
                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', color: '#64748b' }}>NOME COMPLETO</label>
                        <input
                            type="text"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            style={{ width: '100%', border: 'none', borderBottom: '1px solid #000', padding: '5px 0', fontSize: '1rem', fontWeight: 600, outline: 'none' }}
                            placeholder="Ex: João Silva"
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', color: '#64748b' }}>BI / NUIT</label>
                        <input
                            type="text"
                            value={identityDocument}
                            onChange={(e) => setIdentityDocument(e.target.value)}
                            style={{ width: '100%', border: 'none', borderBottom: '1px solid #000', padding: '5px 0', fontSize: '1rem', fontWeight: 600, outline: 'none' }}
                            placeholder="Documento"
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', color: '#64748b' }}>CONTACTO</label>
                        <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            style={{ width: '100%', border: 'none', borderBottom: '1px solid #000', padding: '5px 0', fontSize: '1rem', fontWeight: 600, outline: 'none' }}
                            placeholder="84/85/82/87..."
                        />
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ background: '#f1f5f9', padding: '8px 12px', fontSize: '0.9rem', fontWeight: 800, border: '1px solid #000', marginBottom: '0' }}>2. CONDIÇÕES DO EMPRÉSTIMO</h3>
                <div style={{ border: '1px solid #000', borderTop: 'none', padding: '0' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                            <tr>
                                <td style={{ padding: '1rem', borderRight: '1px solid #000', width: '50%' }}>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>VALOR DO CAPITAL (MT)</label>
                                    <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} style={{ width: '100%', border: 'none', fontSize: '1.2rem', fontWeight: 800, outline: 'none' }} />
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>TAXA DE JUROS (%)</label>
                                    <input type="number" value={interestRate} onChange={(e) => setInterestRate(Number(e.target.value))} style={{ width: '100%', border: 'none', fontSize: '1.2rem', fontWeight: 800, outline: 'none' }} />
                                </td>
                            </tr>
                            <tr style={{ borderTop: '1px solid #000' }}>
                                <td style={{ padding: '1rem', borderRight: '1px solid #000' }}>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>PRAZO ({periodLabels[periodicity]})</label>
                                    <input type="number" value={term} onChange={(e) => setTerm(Number(e.target.value))} style={{ width: '100%', border: 'none', fontSize: '1.2rem', fontWeight: 800, outline: 'none' }} />
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>PERIODICIDADE</label>
                                    <select value={periodicity} onChange={(e) => setPeriodicity(e.target.value)} style={{ width: '100%', border: 'none', fontSize: '1.1rem', fontWeight: 700, background: 'transparent', outline: 'none' }}>
                                        <option value="daily">Pagamentos Diários</option>
                                        <option value="weekly">Pagamentos Semanais</option>
                                        <option value="biweekly">Pagamentos Quinzenais</option>
                                        <option value="monthly">Pagamentos Mensais</option>
                                    </select>
                                </td>
                            </tr>
                            <tr style={{ borderTop: '1px solid #000' }}>
                                <td style={{ padding: '1rem', borderRight: '1px solid #000' }}>
                                    <CustomDateInput
                                        label="DATA INÍCIO"
                                        labelStyle={{ color: '#64748b', fontWeight: 700 }}
                                        value={startDate}
                                        onChange={setStartDate}
                                        style={{ background: 'transparent', border: 'none', color: '#000', fontWeight: 700, height: 'auto', padding: 0 }}
                                    />
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <CustomDateInput
                                        label="DATA FIM (PERSONALIZADA)"
                                        labelStyle={{ color: '#64748b', fontWeight: 700 }}
                                        value={endDate}
                                        onChange={handleEndDateChange}
                                        style={{ background: 'transparent', border: 'none', color: '#000', fontWeight: 700, height: 'auto', padding: 0 }}
                                    />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div style={{ marginBottom: '3rem' }}>
                <h3 style={{ background: '#f1f5f9', padding: '8px 12px', fontSize: '0.9rem', fontWeight: 800, border: '1px solid #000', marginBottom: '0' }}>3. RESUMO DOS PAGAMENTOS</h3>
                <div style={{ border: '1px solid #000', borderTop: 'none', padding: '2rem', background: '#fafafa' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '3rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                                <span style={{ fontWeight: 600 }}>Total de Juros:</span>
                                <span style={{ fontWeight: 700 }}>{simulation?.totalInterest?.toLocaleString()} MT</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                                <span style={{ fontWeight: 600 }}>Data Final:</span>
                                <span style={{ fontWeight: 700 }}>{simulation?.formattedEndDate}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                                <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>TOTAL A PAGAR:</span>
                                <span style={{ fontSize: '1.3rem', fontWeight: 900 }}>{simulation?.totalPayable?.toLocaleString()} MT</span>
                            </div>
                        </div>
                        <div style={{ background: '#000', color: '#fff', padding: '1.5rem', borderRadius: '4px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <p style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: '0.5rem' }}>VALOR DA PRESTAÇÃO</p>
                            <h2 style={{ fontSize: '2rem', fontWeight: 900, margin: 0 }}>{simulation?.paymentAmount?.toLocaleString()} <span style={{ fontSize: '1rem' }}>MT</span></h2>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', marginTop: '4rem', paddingTop: '2rem' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderBottom: '1px solid #000', height: '40px', marginBottom: '10px' }}></div>
                    <p style={{ fontSize: '0.8rem', fontWeight: 700 }}>ASSINATURA DO CLIENTE</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderBottom: '1px solid #000', height: '40px', marginBottom: '10px' }}></div>
                    <p style={{ fontSize: '0.8rem', fontWeight: 700 }}>PELO MICROCRÉDITO (CARIMBO)</p>
                </div>
            </div>

            <div className="no-print" style={{ marginTop: '3rem', display: 'flex', justifyContent: 'center', gap: '1rem', borderTop: '1px dashed #cbd5e1', paddingTop: '2rem' }}>
                <button
                    disabled={loading}
                    onClick={handleWhatsAppShare}
                    style={{ padding: '0.8rem 2rem', background: '#22c55e', color: 'white', borderRadius: '8px', fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: loading ? 0.7 : 1 }}
                >
                    <FiShare2 /> WhatsApp
                </button>
                <button
                    disabled={loading}
                    onClick={handleDownloadPDF}
                    style={{ padding: '0.8rem 2rem', background: '#000', color: 'white', borderRadius: '8px', fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: loading ? 0.7 : 1 }}
                >
                    <FiDownload /> {loading ? 'Gerando...' : 'Baixar PDF Profissional'}
                </button>
            </div>
        </div>
    );

    switch (template) {
        case 'institutional': return renderInstitutional();
        case 'mobile': return renderMobile();
        case 'premium': return renderPremium();
        case 'agent': return renderAgent();
        case 'neon': default: return renderNeon();
    }
};

export default FinancialSimulator;
