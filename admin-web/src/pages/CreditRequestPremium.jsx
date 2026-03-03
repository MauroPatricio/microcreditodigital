import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import FinancialSimulator from '../components/FinancialSimulator';
import api from '../api';
import {
    FiDollarSign, FiCalendar, FiTarget, FiShield,
    FiTrendingUp, FiInfo, FiCheckCircle, FiPlus, FiTrash2
} from 'react-icons/fi';

const CreditRequestPremium = () => {
    const { clientId } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [requestData, setRequestData] = useState({
        amount: 5000,
        term: 6,
        purpose: 'Desenvolvimento de Negócio',
        collateral: []
    });

    const [simulation, setSimulation] = useState(null);

    useEffect(() => {
        const fetchClient = async () => {
            try {
                const res = await api.get(`/clients/${clientId}`);
                setClient(res.data.data.client);
            } catch (error) {
                console.error("Erro ao buscar cliente", error);
            } finally {
                setLoading(false);
            }
        };
        fetchClient();
    }, [clientId]);

    useEffect(() => {
        const simulate = async () => {
            if (requestData.amount >= 1000 && requestData.term >= 1) {
                try {
                    const res = await api.post('/credits/simulate', {
                        amount: requestData.amount,
                        term: requestData.term
                    });
                    setSimulation(res.data.data);
                } catch (error) {
                    console.error("Erro na simulação", error);
                }
            }
        };
        const timer = setTimeout(simulate, 300);
        return () => clearTimeout(timer);
    }, [requestData.amount, requestData.term]);

    const handleAddCollateral = () => {
        setRequestData({
            ...requestData,
            collateral: [...requestData.collateral, { type: 'vehicle', description: '', value: 0 }]
        });
    };

    const handleRemoveCollateral = (index) => {
        const newCollateral = requestData.collateral.filter((_, i) => i !== index);
        setRequestData({ ...requestData, collateral: newCollateral });
    };

    const handleCollateralChange = (index, field, value) => {
        const newCollateral = [...requestData.collateral];
        newCollateral[index][field] = value;
        setRequestData({ ...requestData, collateral: newCollateral });
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            // No backend real, o `req.user` seria o cliente se ele estivesse logado, 
            // mas aqui o agente está solicitando PARA o cliente. 
            // Precisamos ajustar a rota de request para aceitar clientId opcional se for agente.
            const res = await api.post('/credits/request', {
                ...requestData,
                clientId
            });
            if (res.data.success) {
                navigate(`/credits/${res.data.data.credit._id}`);
            }
        } catch (error) {
            alert("Erro ao solicitar crédito: " + (error.response?.data?.message || error.message));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <Layout><div className="loader">Carregando dados...</div></Layout>;

    return (
        <Layout>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 0' }}>
                <header style={{ marginBottom: '3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <div style={{ padding: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', color: 'var(--accent)' }}>
                            <FiDollarSign size={24} />
                        </div>
                        <h1 style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-1px' }}>Nova Solicitação de Crédito</h1>
                    </div>
                    <p style={{ color: 'var(--text-muted)' }}>Cliente: <strong>{client?.name}</strong> • Score: <span style={{ color: 'var(--accent)', fontWeight: 800 }}>{(typeof client?.creditScore === 'object' ? client.creditScore.score : client?.creditScore) || 500}</span></p>
                </header>

                <div style={{ marginBottom: '2rem' }}>
                    <FinancialSimulator
                        initialAmount={requestData.amount}
                        onSimulationComplete={(data) => {
                            setRequestData(prev => ({
                                ...prev,
                                amount: data.amount,
                                term: data.term,
                                periodicity: data.periodicity, // Sync periodicity
                                interestRate: data.interestRate // Sync interest rate
                            }));
                            setSimulation(data);
                        }}
                    />
                </div>

                <div className="card glass" style={{ padding: '2rem', marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FiTarget color="var(--accent)" /> Detalhes do Crédito
                    </h3>

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label>Finalidade do Crédito</label>
                        <textarea
                            rows="3"
                            value={requestData.purpose}
                            onChange={(e) => setRequestData({ ...requestData, purpose: e.target.value })}
                            placeholder="Descreva como o valor será utilizado..."
                            style={{ width: '100%', padding: '1rem', background: 'var(--bg-main)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'var(--text-main)' }}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FiShield color="var(--accent)" /> Garantias Adicionais
                        </h3>
                        <button className="btn-secondary" onClick={handleAddCollateral} style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>
                            <FiPlus /> Adicionar
                        </button>
                    </div>

                    {requestData.collateral.length === 0 ? (
                        <p style={{ textAlign: 'center', padding: '2rem', border: '2px dashed rgba(255,255,255,0.05)', borderRadius: '12px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            Nenhuma garantia física adicionada.
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {requestData.collateral.map((item, idx) => (
                                <div key={idx} className="glass" style={{ padding: '1rem', display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr auto', gap: '1rem', alignItems: 'center' }}>
                                    <select value={item.type} onChange={(e) => handleCollateralChange(idx, 'type', e.target.value)} style={{ padding: '0.5rem', borderRadius: '8px', background: 'var(--bg-card)', color: 'var(--text-main)', border: 'none' }}>
                                        <option value="vehicle">Veículo</option>
                                        <option value="real_estate">Imóvel</option>
                                        <option value="guarantor">Fiador</option>
                                        <option value="equipment">Equipamento</option>
                                    </select>
                                    <input type="text" placeholder="Descrição" value={item.description} onChange={(e) => handleCollateralChange(idx, 'description', e.target.value)} style={{ padding: '0.5rem', borderRadius: '8px', background: 'var(--bg-card)', color: 'var(--text-main)', border: 'none' }} />
                                    <input type="number" placeholder="Valor Est." value={item.value} onChange={(e) => handleCollateralChange(idx, 'value', parseFloat(e.target.value))} style={{ padding: '0.5rem', borderRadius: '8px', background: 'var(--bg-card)', color: 'var(--text-main)', border: 'none' }} />
                                    <button onClick={() => handleRemoveCollateral(idx)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}><FiTrash2 /></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="btn-primary"
                    style={{
                        width: '100%',
                        padding: '1rem',
                        fontSize: '1.2rem',
                        fontWeight: 800,
                        background: 'var(--accent)',
                        boxShadow: '0 0 30px rgba(0, 255, 0, 0.4)',
                        position: 'relative',
                        overflow: 'hidden',
                        borderRadius: '12px'
                    }}
                >
                    {submitting ? 'Processando...' : 'Submeter Solicitação'}
                </button>
            </div>

            <style>{`
                .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
                .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
                .form-group label { font-size: 0.85rem; font-weight: 600; color: var(--text-muted); }
                .form-group input { padding: 0.75rem 1rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; color: white; outline: none; }
                .form-group input:focus { border-color: var(--accent); }
            `}</style>
        </Layout>
    );
};

export default CreditRequestPremium;
