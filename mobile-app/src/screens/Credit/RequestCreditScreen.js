import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TextInput,
    Modal
} from 'react-native';
import { CreditCard, Smartphone, CheckCircle, AlertCircle } from 'lucide-react-native';
import { creditService } from '../../services';
import { useAuth } from '../../context/AuthContext';

export default function RequestCreditScreen({ route, navigation }) {
    const { user } = useAuth();
    const { amount, term, periodicity } = route.params || {};
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [disbursementMethod, setDisbursementMethod] = useState('mpesa');
    const [accountNumber, setAccountNumber] = useState(user?.phone || '');
    const [showSuccessModal, setShowSuccessModal] = useState(false);


        const handleSubmit = async () => {
            setError(null);
            
            const numStr = String(accountNumber).trim();
            
            if (!numStr) {
                setError('Por favor, informe o número de conta ou telemóvel para receber o valor.');
                return;
            }

            // Validations
            if (disbursementMethod === 'mpesa') {
                if (!numStr.startsWith('84') && !numStr.startsWith('85')) {
                    setError('O número M-Pesa deve iniciar com 84 ou 85.');
                    return;
                }
            } else if (disbursementMethod === 'emola') {
                if (!numStr.startsWith('86') && !numStr.startsWith('87')) {
                    setError('O número e-Mola deve iniciar com 86 ou 87.');
                    return;
                }
            } else if (disbursementMethod === 'bank') {
                if (numStr.startsWith('84') || numStr.startsWith('85') || numStr.startsWith('86') || numStr.startsWith('87')) {
                    setError('Número de conta bancária inválido (não pode iniciar com 84, 85, 86 ou 87).');
                    return;
                }
            }

            setLoading(true);
            try {
                const data = {
                    amount: amount, 
                    term: term,
                    periodicity: periodicity || 'monthly',
                    purpose: 'Empréstimo Pessoal', // Required field
                    disbursementMethod: disbursementMethod,
                    bankDetails: {
                        bankName: disbursementMethod,
                        accountNumber: numStr
                    }
                };
                
                const res = await creditService.request(data);
                if (res.success) {
                    setShowSuccessModal(true);
                } else {
                    setError(res.message || 'Falha ao solicitar crédito.');
                }
            } catch (err) {
                console.error('Request Credit Error:', err.response?.data || err.message);
                setError(err.response?.data?.message || 'Falha na comunicação com o servidor.');
            } finally {
                setLoading(false);
            }
        };

    const PaymentOption = ({ id, title, icon, color }) => {
        const isActive = disbursementMethod === id;
        return (
            <TouchableOpacity 
                style={[styles.paymentOption, isActive && { borderColor: color, backgroundColor: `${color}10` }]} 
                onPress={() => {
                    setDisbursementMethod(id);
                    setError(null);
                }}
                activeOpacity={0.7}
            >
                <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
                    {icon}
                </View>
                <Text style={[styles.optionTitle, isActive && { color: color, fontWeight: '700' }]}>{title}</Text>
                {isActive && <CheckCircle size={20} color={color} style={styles.checkIcon} />}
            </TouchableOpacity>
        );
    };

    return (
        <KeyboardAvoidingView 
            style={{ flex: 1 }} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
        >
            <ScrollView 
                style={styles.container}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: 150 }]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.pageHeader}>
                    <Text style={styles.pageTitle}>Confirmar Crédito</Text>
                    <Text style={styles.pageSubtitle}>Falta pouco! Escolha como prefere receber o seu dinheiro.</Text>
                </View>

                <View style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Valor Solicitado</Text>
                        <Text style={styles.summaryValueAmount}>{amount} MT</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Prazo de Pagamento</Text>
                        <Text style={styles.summaryValue}>{term} Meses</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Método de Recebimento</Text>
                    
                    <PaymentOption 
                        id="mpesa" 
                        title="M-Pesa" 
                        color="#ef4444" 
                        icon={<Smartphone size={24} color="#ef4444" />} 
                    />
                    
                    <PaymentOption 
                        id="emola" 
                        title="E-mola" 
                        color="#f59e0b" 
                        icon={<Smartphone size={24} color="#f59e0b" />} 
                    />
                    
                    <PaymentOption 
                        id="bank_transfer" 
                        title="Cartão Visa" 
                        color="#3b82f6" 
                        icon={<CreditCard size={24} color="#3b82f6" />} 
                    />

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>
                            {disbursementMethod === 'bank_transfer' ? 'Número do Cartão / IBAN' : 'Número de Telemóvel'}
                        </Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder={disbursementMethod === 'bank_transfer' ? '0000 0000 0000 0000' : '840000000 ou 850000000'}
                                keyboardType={disbursementMethod === 'bank_transfer' ? 'default' : 'phone-pad'}
                                value={accountNumber}
                                onChangeText={(text) => {
                                    setAccountNumber(text);
                                    setError(null);
                                }}
                                placeholderTextColor="#94a3b8"
                            />
                        </View>
                    </View>
                </View>

                {error && (
                    <View style={styles.errorContainer}>
                        <AlertCircle size={20} color="#ef4444" style={styles.errorIcon} />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}


                <TouchableOpacity 
                    style={[styles.submitButton, loading && { opacity: 0.7 }]} 
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Confirmar e Solicitar Dinheiro</Text>}
                </TouchableOpacity>
            </ScrollView>

            {/* Premium Success Modal */}
            <Modal visible={showSuccessModal} animationType="fade" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.successModalCard}>
                        <View style={styles.successIconWrapper}>
                            <CheckCircle size={48} color="#10b981" />
                        </View>
                        <Text style={styles.modalTitle}>Pedido Enviado!</Text>
                        <Text style={styles.modalSubtitle}>
                            A sua solicitação de crédito foi enviada com sucesso e encontra-se em análise.
                        </Text>
                        <TouchableOpacity 
                            style={styles.modalBtn}
                            activeOpacity={0.8}
                            onPress={() => {
                                setShowSuccessModal(false);
                                navigation.navigate('MainTabs', { screen: 'MyCredits' });
                            }}
                        >
                            <Text style={styles.modalBtnText}>Acompanhar Pedido</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f7fb' },
    scrollContent: { padding: 20, paddingBottom: 60, flexGrow: 1 },
    header: { marginBottom: 24, marginTop: 10 },
    title: { fontSize: 28, fontWeight: '800', color: '#1e293b', letterSpacing: -0.5 },
    subtitle: { fontSize: 15, color: '#64748b', marginTop: 6, lineHeight: 22 },
    
    summaryCard: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 24,
        marginBottom: 32,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 4,
    },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    summaryLabel: { fontSize: 15, color: '#64748b', fontWeight: '500' },
    summaryValueAmount: { fontSize: 24, fontWeight: '800', color: '#10b981' },
    summaryValue: { fontSize: 18, fontWeight: '700', color: '#334155' },
    summaryDivider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 16 },
    
    section: { marginBottom: 32 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 16 },
    
    paymentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderWidth: 1.5,
        borderColor: '#f1f5f9',
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    optionTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: '#475569' },
    checkIcon: { marginLeft: 'auto' },
    
    inputContainer: { marginTop: 16 },
    inputLabel: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8, marginLeft: 4 },
    inputWrapper: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 8,
        elevation: 1,
    },
    input: { padding: 16, fontSize: 16, fontWeight: '600', color: '#1e293b' },
    
    submitButton: {
        backgroundColor: '#2563eb',
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 6,
        marginTop: 8
    },
    submitBtnText: { color: '#ffffff', fontSize: 17, fontWeight: 'bold', letterSpacing: 0.5 },
    
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef2f2',
        borderWidth: 1,
        borderColor: '#fecaca',
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    errorIcon: { marginRight: 8 },
    errorText: { flex: 1, color: '#ef4444', fontSize: 14, fontWeight: '600' },

    // Modal Premium Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    successModalCard: {
        backgroundColor: '#ffffff',
        borderRadius: 28,
        padding: 32,
        width: '100%',
        maxWidth: 340,
        alignItems: 'center',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 30,
        elevation: 15,
    },
    successIconWrapper: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#dcfce7',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#1e293b',
        marginBottom: 12,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 15,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 28,
    },
    modalBtn: {
        backgroundColor: '#10b981',
        width: '100%',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    modalBtnText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '800',
    },
});
