import React, { useState, useEffect } from 'react';
import {
    FiPieChart, FiDownload, FiCheckCircle, FiShare2, FiTrendingUp, FiCreditCard, FiArrowRight
} from 'react-icons/fi';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api';

const FinancialSimulator = ({ onSimulationComplete, initialAmount = 5000, template = 'corporate', clientId = null }) => {
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

    const CustomDateInput = ({ value, onChange, label, style, labelStyle }) => {
        const displayDate = value ? value.split('-').reverse().join('/') : '';

        return (
            <div style={{ position: 'relative', width: '100%', ...style }}>
                {label && <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '0.5rem', ...labelStyle }}>{label}</label>}
                <div style={{ position: 'relative' }}>
                    <input
                        type="text"
                        readOnly
                        value={displayDate}
                        placeholder="dd/mm/aaaa"
                        style={{
                            width: '100%',
                            padding: '0.875rem 1.25rem',
                            background: 'var(--bg-main)',
                            border: '1px solid var(--border-light)',
                            borderRadius: '8px',
                            color: 'var(--text-main)',
                            outline: 'none',
                            fontSize: '0.95rem',
                            fontFamily: 'inherit',
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
            const saveResponse = await api.post('/simulations', {
                amount,
                term,
                rate: interestRate,
                period: periodicity,
                start: startDate,
                clientName,
                identityDocument,
                phone,
                client: clientId,
                amortizationType,
                riskProfile: confidence
            });

            if (saveResponse.data.success) {
                const simulationId = saveResponse.data.data._id;
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
                const sendResponse = await api.post(`/simulations/${simulationId}/send`);

                if (sendResponse.data.success) {
                    alert('Simulação enviada com sucesso ao WhatsApp do cliente!');
                }
            }
        } catch (error) {
            console.error("Erro ao enviar via WhatsApp:", error);
            alert("Erro ao enviar WhatsApp. Verifique se o telefone está correto e o serviço está ativo.");

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
        if (interestRate <= 7) return { label: 'Baixo', color: 'var(--success)' };
        if (interestRate <= 15) return { label: 'Médio', color: 'var(--warning)' };
        return { label: 'Alto', color: 'var(--danger)' };
    };

    const risk = getRiskLabel();

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-main)' }}>
                    <FiPieChart className="text-accent" /> Simulador de Crédito
                </h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span style={{ padding: '0.25rem 0.75rem', borderRadius: '6px', background: 'var(--bg-main)', border: `1px solid ${risk.color}`, color: risk.color, fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <FiCheckCircle size={12} /> Risco: {risk.label}
                    </span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    {/* Valor e Taxa */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                        <div>
                            <label>Valor Pretendido (MT)</label>
                            <input 
                                type="number" 
                                value={amount} 
                                onChange={(e) => setAmount(Number(e.target.value))} 
                                style={{ fontWeight: 600, fontSize: '1.1rem' }} 
                            />
                        </div>
                        <div>
                            <label>Taxa de Juros (%)</label>
                            <input 
                                type="number" 
                                value={interestRate} 
                                onChange={(e) => setInterestRate(Math.max(0, Number(e.target.value)))} 
                                style={{ fontWeight: 600, fontSize: '1.1rem', textAlign: 'center' }} 
                            />
                        </div>
                    </div>

                    {/* Periodicidade e Prazo */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label>Periodicidade</label>
                            <select value={periodicity} onChange={(e) => setPeriodicity(e.target.value)}>
                                <option value="daily">Diário</option>
                                <option value="weekly">Semanal</option>
                                <option value="biweekly">Quinzenal</option>
                                <option value="monthly">Mensal</option>
                            </select>
                        </div>
                        <div>
                            <label>Prazo em {periodLabels[periodicity]}</label>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <button onClick={() => setTerm(Math.max(1, term - 1))} style={{ width: '40px', padding: '0.875rem', background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: '8px 0 0 8px', color: 'var(--text-main)' }}>-</button>
                                <input type="number" value={term} onChange={(e) => setTerm(Math.max(1, Number(e.target.value)))} style={{ borderRadius: 0, borderLeft: 'none', borderRight: 'none', textAlign: 'center', fontWeight: 600 }} />
                                <button onClick={() => setTerm(term + 1)} style={{ width: '40px', padding: '0.875rem', background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: '0 8px 8px 0', color: 'var(--text-main)' }}>+</button>
                            </div>
                        </div>
                    </div>

                    {/* Tipo de Amortização */}
                    <div>
                        <label>Tipo de Amortização</label>
                        <select value={amortizationType} onChange={(e) => setAmortizationType(e.target.value)}>
                            <option value="price">Price (Parcelas Fixas)</option>
                            <option value="sac">SAC (Amortização Constante)</option>
                            <option value="flat">Flat (Juros sobre capital original)</option>
                            <option value="simples">Simples (Juros no fim)</option>
                            <option value="composto">Composto (Balloon)</option>
                        </select>
                    </div>

                    {/* Datas */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <CustomDateInput
                            label="Data Início"
                            value={startDate}
                            onChange={setStartDate}
                        />
                        <CustomDateInput
                            label="Data Fim"
                            value={endDate}
                            onChange={handleEndDateChange}
                        />
                    </div>
                </div>

                {/* Painel de Resultados */}
                <div style={{ background: 'var(--bg-main)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', border: '1px solid var(--border-light)' }}>
                    {loading ? <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Sincronizando...</div> : simulation ? (
                        <>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Prestação Estimada</p>
                                <h3 style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--accent)' }}>{simulation.paymentAmount?.toLocaleString()} MT <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ {periodicity === 'monthly' ? 'mês' : 'período'}</span></h3>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', margin: '1rem 0' }}>
                                <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                                    <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total a pagar</p>
                                    <p style={{ fontSize: '1.15rem', fontWeight: 700 }}>{simulation.totalPayable?.toLocaleString()} MT</p>
                                </div>
                                <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                                    <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--warning)', textTransform: 'uppercase' }}>Juros Totais</p>
                                    <p style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--warning)' }}>{simulation.totalInterest?.toLocaleString()} MT</p>
                                </div>
                            </div>
                            <div style={{ flex: 1, minHeight: '120px', margin: '1rem 0' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-main)' }} cursor={false} />
                                        <Area type="monotone" dataKey="balance" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.1} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1rem' }}>
                                <button onClick={handleWhatsAppShare} className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}><FiShare2 /> Enviar Proposta</button>
                                <button onClick={handleDownloadPDF} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}><FiDownload /> Baixar PDF</button>
                            </div>
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default FinancialSimulator;
