import React, { useState, useEffect } from 'react';
import { FiDollarSign, FiCalendar, FiPieChart, FiDownload, FiCheckCircle, FiInfo, FiTrendingUp } from 'react-icons/fi';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api';

const FinancialSimulator = ({ onSimulationComplete, initialAmount = 5000 }) => {
    const [amount, setAmount] = useState(initialAmount);
    const [term, setTerm] = useState(1);
    const [periodicity, setPeriodicity] = useState('monthly');
    const [loading, setLoading] = useState(false);
    const [simulation, setSimulation] = useState(null);
    const [schedule, setSchedule] = useState([]);

    // Debounce simulation fetch
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchSimulation();
        }, 500);
        return () => clearTimeout(timer);
    }, [amount, term, periodicity]);

    const fetchSimulation = async () => {
        setLoading(true);
        try {
            const response = await api.post('/credits/simulate', {
                amount,
                term,
                periodicity
            });
            if (response.data.success) {
                setSimulation(response.data.data);
                setSchedule(response.data.schedule);
                if (onSimulationComplete) {
                    onSimulationComplete(response.data.data); // Pass data up
                }
            }
        } catch (error) {
            console.error("Erro na simulação:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        try {
            const response = await api.post('/credits/simulate/pdf', {
                amount,
                term,
                periodicity
            }, {
                responseType: 'arraybuffer'
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `simulacao-${periodicity}-${Date.now()}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Erro ao baixar PDF:", error);
        }
    };

    const getPeriodicityLabel = (p) => {
        switch (p) {
            case 'daily': return 'Dias';
            case 'weekly': return 'Semanas';
            case 'biweekly': return 'Quinzenas';
            case 'monthly': return 'Meses';
            default: return 'Períodos';
        }
    };

    const chartData = schedule.map(item => ({
        name: item.number,
        balance: item.balance,
        principal: item.principal,
        interest: item.interest
    }));

    return (
        <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <FiPieChart className="text-accent" /> Simulador Avançado
                </h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '20px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#10b981',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                    }}>
                        <FiCheckCircle size={12} /> IA Risk: Baixo
                    </span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Amount Input */}
                    <div>
                        <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>Valor Pretendido</span>
                            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{amount.toLocaleString()} MT</span>
                        </label>
                        <input
                            type="range"
                            min="1000"
                            max="500000"
                            step="500"
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--accent)' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            <span>1.000 MT</span>
                            <span>500.000 MT</span>
                        </div>
                    </div>

                    {/* Periodicity Selector */}
                    <div>
                        <label>Periodicidade de Pagamento</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginTop: '0.5rem' }}>
                            {['daily', 'weekly', 'biweekly', 'monthly'].map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPeriodicity(p)}
                                    style={{
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        background: periodicity === p ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                                        color: periodicity === p ? 'white' : 'var(--text-muted)',
                                        border: '1px solid ' + (periodicity === p ? 'var(--accent)' : 'rgba(255,255,255,0.1)'),
                                        fontWeight: 600,
                                        fontSize: '0.85rem',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {p === 'daily' ? 'Diário' : p === 'weekly' ? 'Semanal' : p === 'biweekly' ? 'Quinzenal' : 'Mensal'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Term Input */}
                    <div>
                        <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>Prazo ({getPeriodicityLabel(periodicity)})</span>
                            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{term} {getPeriodicityLabel(periodicity)}</span>
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button
                                onClick={() => setTerm(Math.max(1, term - 1))}
                                style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', fontWeight: 800 }}
                            >-</button>
                            <input
                                type="number"
                                value={term}
                                onChange={(e) => setTerm(Math.max(1, Number(e.target.value)))}
                                style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.2rem', background: 'transparent', border: 'none', color: 'white', width: '60px' }}
                            />
                            <button
                                onClick={() => setTerm(term + 1)}
                                style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', fontWeight: 800 }}
                            >+</button>
                        </div>
                    </div>
                </div>

                {/* Summary & Chart */}
                <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                    {loading ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Calculando...</div>
                    ) : simulation ? (
                        <>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Sua parcela estimada</p>
                                <h3 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>
                                    {simulation.monthlyPayment?.toLocaleString()} MT
                                    <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '0.5rem' }}>/ {periodicity === 'monthly' ? 'mês' : periodicity === 'weekly' ? 'sem' : 'dia'}</span>
                                </h3>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px' }}>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total a Pagar</p>
                                    <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>{simulation.totalPayable?.toLocaleString()} MT</p>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px' }}>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Juros</p>
                                    <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f59e0b' }}>{simulation.totalInterest?.toLocaleString()} MT</p>
                                </div>
                            </div>

                            <div style={{ flex: 1, minHeight: '150px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <Tooltip
                                            contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                        <Area type="monotone" dataKey="balance" stroke="#8884d8" fillOpacity={1} fill="url(#colorBalance)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button
                                    onClick={handleDownloadPDF}
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        background: 'rgba(255,255,255,0.05)',
                                        color: 'white',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        fontWeight: 600,
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    <FiDownload /> Baixar PDF
                                </button>
                            </div>
                        </>
                    ) : (
                        <div>Selecione os parâmetros</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FinancialSimulator;
