import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { FiX, FiCheck, FiRefreshCcw } from 'react-icons/fi';

const SignatureModal = ({ isOpen, onClose, onSave, clientName }) => {
    const sigCanvas = useRef({});
    const [isEmpty, setIsEmpty] = useState(true);

    if (!isOpen) return null;

    const clear = () => {
        sigCanvas.current.clear();
        setIsEmpty(true);
    };

    const save = () => {
        if (sigCanvas.current.isEmpty()) {
            alert('Por favor, recolha a assinatura antes de guardar.');
            return;
        }
        // Returns base64 PNG
        const dataUrl = sigCanvas.current.getCanvas().toDataURL('image/png');
        onSave(dataUrl);
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                background: '#1e293b',
                width: '95%',
                maxWidth: '600px',
                borderRadius: '24px',
                padding: '2rem',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                border: '1px solid #334155'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem'
                }}>
                    <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                            Assinatura do Contrato
                        </h3>
                        <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
                            Cliente: <strong style={{ color: 'var(--text-heading)' }}>{clientName}</strong>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: '0.5rem'
                        }}
                    >
                        <FiX size={24} />
                    </button>
                </div>

                <div style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: '2px dashed #cbd5e1',
                    marginBottom: '1.5rem',
                    overflow: 'hidden'
                }}>
                    <SignatureCanvas
                        ref={sigCanvas}
                        penColor="#0f172a"
                        canvasProps={{
                            width: 500,
                            height: 250,
                            className: 'sigCanvas',
                            style: { width: '100%', height: '250px', cursor: 'crosshair' }
                        }}
                        onBegin={() => setIsEmpty(false)}
                    />
                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <button
                        onClick={clear}
                        style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            border: 'none',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '12px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            cursor: 'pointer'
                        }}
                    >
                        <FiRefreshCcw /> Limpar
                    </button>
                    
                    <button
                        onClick={save}
                        className="btn-primary"
                        style={{
                            background: '#10b981',
                            border: 'none',
                            padding: '0.75rem 2rem',
                            borderRadius: '12px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            cursor: 'pointer'
                        }}
                    >
                        <FiCheck /> Guardar e Assinar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SignatureModal;
