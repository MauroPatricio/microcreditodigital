import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

const SystemStatus = () => {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStatus = async () => {
        try {
            const response = await api.get('/health');
            if (response.data.success) {
                setStatus(response.data.data);
                setError(null);
            } else {
                setError('Falha na resposta da API');
            }
        } catch (err) {
            console.error('Erro ao buscar status:', err);
            setError('API Indisponível');
            setStatus(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <Layout>
            <div className="flex items-center justify-center min-h-[80vh] bg-transparent">
                <div
                    className="relative w-full max-w-2xl p-1 rounded-2xl overflow-hidden"
                    style={{
                        background: 'linear-gradient(45deg, #00C853, #1de9b6)', // Green/Teal gradient border
                        boxShadow: '0 0 20px rgba(0, 200, 83, 0.3)'
                    }}
                >
                    <div className="bg-[#0f172a] rounded-xl p-12 text-center relative z-10 h-full flex flex-col items-center justify-center">
                        {/* Rocket Icon */}
                        <div className="text-6xl mb-6 animate-bounce-slow">
                            🚀
                        </div>

                        {/* Title */}
                        <h1 className="text-4xl font-black text-white mb-4 tracking-tight">
                            API Conectada com Sucesso
                        </h1>

                        {/* Subtitle */}
                        <p className="text-gray-400 text-lg mb-8 max-w-lg mx-auto leading-relaxed">
                            Você conseguiu chegar ao servidor. Este endpoint é apenas para fins de verificação.
                        </p>

                        {/* Badges/Buttons */}
                        <div className="flex items-center gap-4 justify-center">
                            {/* Status Badge */}
                            <div className="flex items-center gap-2 px-4 py-2 bg-[#064e3b] rounded-lg border border-[#059669]/30">
                                <span className="text-[#34d399] font-bold">Status:</span>
                                <span className="text-[#34d399] font-bold">
                                    {error ? 'ERRO' : 'OK'}
                                </span>
                            </div>

                            {/* Port Badge */}
                            <div className="flex items-center gap-2 px-4 py-2 bg-[#1e1b4b] rounded-lg border border-[#4f46e5]/30">
                                <span className="text-[#818cf8] font-bold">Porta:</span>
                                <span className="text-[#818cf8] font-bold">
                                    {status?.port || '5000'}
                                </span>
                            </div>
                        </div>

                        {/* Loading/Error State Overlay if needed, or just integrated */}
                        {loading && (
                            <div className="absolute top-4 right-4">
                                <div className="animate-spin h-5 w-5 border-2 border-green-500 rounded-full border-t-transparent"></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(-5%); }
                    50% { transform: translateY(5%); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 3s infinite ease-in-out;
                }
            `}</style>
        </Layout>
    );
};

export default SystemStatus;
