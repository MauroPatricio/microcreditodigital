import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import Slider from '@react-native-community/slider';
import { creditService } from '../../services';
import { Calculator, Calendar, ArrowRight, DollarSign, Activity, Percent, PieChart, CheckCircle2 } from 'lucide-react-native';
import { useAlert } from '../../context/AlertContext';

export default function CreditSimulatorScreen({ navigation }) {
    const { showAlert } = useAlert();
    const [amount, setAmount] = useState('10000');
    const [periodicity, setPeriodicity] = useState('monthly');
    const [term, setTerm] = useState(12);
    const [simulation, setSimulation] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleAmountChange = (text) => {
        const cleanText = text.replace(/^0+(?=\d)/, '');
        setAmount(cleanText);
    };

    const handleSimulate = async () => {
        const amountValue = parseFloat(amount);

        if (!amountValue || amountValue < 1000) {
            showAlert('Atenção', 'O valor mínimo é 1.000 MT', undefined, 'warning');
            return;
        }

        setLoading(true);
        try {
            const response = await creditService.simulate(amountValue, term, periodicity);
            setSimulation(response.data);
        } catch (error) {
            showAlert('Erro', error.response?.data?.message || 'Erro ao simular crédito');
        } finally {
            setLoading(false);
        }
    };

    const handleRequestCredit = () => {
        if (!simulation) {
            showAlert('Erro', 'Por favor, simule o crédito primeiro', undefined, 'warning');
            return;
        }

        navigation.navigate('RequestCredit', {
            amount: simulation.amount,
            term: simulation.term,
            periodicity: periodicity
        });
    };

    return (
        <KeyboardAvoidingView 
            style={{ flex: 1 }} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
        >
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.pageHeader}>
                    <Text style={styles.pageTitle}>Simulador</Text>
                    <Text style={styles.pageSubtitle}>Simule e descubra a sua mensalidade na hora.</Text>
                </View>

                <View style={styles.formCard}>
                    <Text style={styles.label}>Valor Desejado</Text>
                    <View style={styles.inputWrapper}>
                        <DollarSign size={20} color="#94a3b8" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: 10000"
                            value={amount}
                            onChangeText={handleAmountChange}
                            keyboardType="numeric"
                            placeholderTextColor="#cbd5e1"
                        />
                        <Text style={styles.currencySuffix}>MT</Text>
                    </View>

                    <View style={styles.sliderHeader}>
                        <Text style={styles.label}>Prazo de Pagamento</Text>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity 
                                style={[styles.periodicityToggle, periodicity === 'monthly' && styles.periodicityToggleActive]}
                                onPress={() => { setPeriodicity('monthly'); setTerm(12); }}
                            >
                                <Text style={[styles.periodicityToggleText, periodicity === 'monthly' && styles.periodicityToggleTextActive]}>Meses</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.periodicityToggle, periodicity === 'daily' && styles.periodicityToggleActive]}
                                onPress={() => { setPeriodicity('daily'); setTerm(30); }}
                            >
                                <Text style={[styles.periodicityToggleText, periodicity === 'daily' && styles.periodicityToggleTextActive]}>Dias</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.termBadge}>
                            <Calendar size={14} color="#3b82f6" />
                            <Text style={styles.termText}>{term} {periodicity === 'monthly' ? 'meses' : 'dias'}</Text>
                        </View>
                    </View>
                    
                    <View style={styles.sliderContainer}>
                        <Slider
                            style={styles.slider}
                            minimumValue={1}
                            maximumValue={periodicity === 'monthly' ? 36 : 90}
                            step={1}
                            value={term}
                            onValueChange={setTerm}
                            minimumTrackTintColor="#3b82f6"
                            maximumTrackTintColor="#e2e8f0"
                            thumbTintColor="#3b82f6"
                        />
                        <View style={styles.sliderScale}>
                            <Text style={styles.scaleText}>1{periodicity === 'monthly' ? 'm' : 'd'}</Text>
                            <Text style={styles.scaleText}>{periodicity === 'monthly' ? '36m' : '90d'}</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.simulateBtn, loading && { opacity: 0.7 }]}
                        onPress={handleSimulate}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : (
                            <>
                                <Text style={styles.simulateBtnText}>Calcular Simulação</Text>
                                <ArrowRight size={20} color="#fff" />
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {simulation && (
                    <View style={styles.resultsCard}>
                        <View style={styles.resultsHeader}>
                            <PieChart size={24} color="#10b981" />
                            <Text style={styles.resultsTitle}>Resumo da Simulação</Text>
                        </View>

                        <View style={styles.resultGrid}>
                            <View style={styles.gridItem}>
                                <Text style={styles.gridLabel}>Crédito</Text>
                                <Text style={styles.gridValue}>{(simulation.amount || 0).toLocaleString('pt-MZ')} MT</Text>
                            </View>
                            <View style={styles.gridItem}>
                                <Text style={styles.gridLabel}>Taxa Juro</Text>
                                <Text style={styles.gridValue}>{simulation.interestRate}%</Text>
                            </View>
                        </View>

                        <View style={styles.highlightBox}>
                            <View>
                                <Text style={styles.highlightLabel}>Parcela Mensal</Text>
                                <Text style={styles.highlightValue}>
                                    {(simulation.monthlyPayment || 0).toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT
                                </Text>
                            </View>
                            <View style={styles.highlightIconBox}>
                                <Activity size={24} color="#3b82f6" />
                            </View>
                        </View>

                        <View style={styles.resultList}>
                            <View style={styles.resultRow}>
                                <Text style={styles.rowLabel}>Prazo de Pagamento</Text>
                                <Text style={styles.rowValue}>{simulation.term} {periodicity === 'monthly' ? 'Meses' : 'Dias'}</Text>
                            </View>
                            <View style={styles.resultRow}>
                                <Text style={styles.rowLabel}>Total de Juros</Text>
                                <Text style={styles.rowValue}>
                                    {(simulation.totalInterest || 0).toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT
                                </Text>
                            </View>
                            <View style={[styles.resultRow, { borderBottomWidth: 0, marginBottom: 0 }]}>
                                <Text style={styles.rowLabelTotal}>Total a Pagar</Text>
                                <Text style={styles.rowValueTotal}>
                                    {(simulation.totalPayable || 0).toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity 
                            style={styles.requestBtn} 
                            onPress={handleRequestCredit}
                            activeOpacity={0.8}
                        >
                            <CheckCircle2 size={20} color="#fff" />
                            <Text style={styles.requestBtnText}>Avançar com Pedido</Text>
                        </TouchableOpacity>

                        <Text style={styles.disclaimer}>
                            * Esta simulação é meramente indicativa. Sujeito a aprovação de crédito.
                        </Text>
                    </View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f7fb' },
    scrollContent: { padding: 20, paddingBottom: 120 },
    
    pageHeader: { marginBottom: 16, marginTop: 10 },
    pageTitle: { fontSize: 28, fontWeight: '800', color: '#1e293b', letterSpacing: -0.5 },
    pageSubtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
    
    imageCard: {
        backgroundColor: '#2563eb',
        borderRadius: 24,
        padding: 30,
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 6,
    },
    iconBox: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    
    formCard: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 5,
    },
    label: { fontSize: 14, fontWeight: '700', color: '#334155', marginBottom: 10 },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        borderRadius: 16,
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, paddingVertical: 16, fontSize: 20, fontWeight: '700', color: '#1e293b' },
    currencySuffix: { fontSize: 16, fontWeight: '700', color: '#94a3b8', marginLeft: 10 },
    
    sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
    termBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 6 },
    termText: { color: '#3b82f6', fontWeight: '700', fontSize: 13 },
    periodicityToggle: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
    periodicityToggleActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
    periodicityToggleText: { color: '#64748b', fontWeight: '600', fontSize: 13 },
    periodicityToggleTextActive: { color: '#ffffff' },
    
    sliderContainer: { marginTop: 10, marginBottom: 30 },
    slider: { width: '100%', height: 40 },
    sliderScale: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10, marginTop: -5 },
    scaleText: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
    
    simulateBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1e293b',
        padding: 18,
        borderRadius: 16,
        gap: 10,
        shadowColor: '#1e293b',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 6,
    },
    simulateBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
    
    resultsCard: {
        backgroundColor: '#ffffff',
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 4,
    },
    resultsHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
    resultsTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
    
    resultGrid: { flexDirection: 'row', gap: 16, marginBottom: 20 },
    gridItem: { flex: 1, backgroundColor: '#f8fafc', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9' },
    gridLabel: { fontSize: 13, color: '#64748b', fontWeight: '600', marginBottom: 4 },
    gridValue: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
    
    highlightBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#eff6ff',
        padding: 20,
        borderRadius: 16,
        marginBottom: 20,
    },
    highlightLabel: { fontSize: 14, fontWeight: '600', color: '#3b82f6', marginBottom: 4 },
    highlightValue: { fontSize: 26, fontWeight: '900', color: '#1e40af' },
    highlightIconBox: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 2 },
    
    resultList: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, marginBottom: 24 },
    resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    rowLabel: { fontSize: 14, color: '#64748b', fontWeight: '500' },
    rowValue: { fontSize: 15, fontWeight: '700', color: '#334155' },
    rowLabelTotal: { fontSize: 15, color: '#1e293b', fontWeight: '800' },
    rowValueTotal: { fontSize: 18, fontWeight: '900', color: '#10b981' },
    
    requestBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#10b981',
        padding: 18,
        borderRadius: 16,
        gap: 10,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 6,
    },
    requestBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
    
    disclaimer: { fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 16, fontWeight: '500' }
});
