import React from 'react';

const ConfidenceIndicator = ({ level, label, percentage, showScore = true, animated = true }) => {
    // Configurações de Nível
    const configs = {
        1: { color: '#DC2626', bars: 1, label: 'Muito Arriscado' },
        2: { color: '#F97316', bars: 2, label: 'Arriscado' },
        3: { color: '#EAB308', bars: 3, label: 'Moderado' },
        4: { color: '#2563EB', bars: 4, label: 'Confiável' },
        5: { color: '#16A34A', bars: 5, label: 'Muito Confiável' }
    };

    const current = configs[level] || configs[3];
    const displayLabel = label || current.label;

    return (
        <div className="confidence-indicator" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    color: current.color,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                }}>
                    <span style={{ fontSize: '1.1rem' }}>
                        {level === 1 && '🔴'}
                        {level === 2 && '🟠'}
                        {level === 3 && '🟡'}
                        {level === 4 && '🔵'}
                        {level === 5 && '🟢'}
                    </span>
                    {displayLabel.toUpperCase()}
                </span>
                {showScore && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
                        {percentage}%
                    </span>
                )}
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '6px',
                height: '8px'
            }}>
                {[1, 2, 3, 4, 5].map((bar) => (
                    <div
                        key={bar}
                        className={animated ? 'progress-bar-animated' : ''}
                        style={{
                            height: '100%',
                            borderRadius: '4px',
                            background: bar <= level ? current.color : 'rgba(255,255,255,0.05)',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: bar <= level ? `0 0 10px ${current.color}44` : 'none'
                        }}
                    />
                ))}
            </div>

            <style>{`
                @keyframes progressShimmer {
                    0% { opacity: 0.6; }
                    50% { opacity: 1; }
                    100% { opacity: 0.6; }
                }
                .progress-bar-animated {
                    animation: progressShimmer 2s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
};

export default ConfidenceIndicator;
