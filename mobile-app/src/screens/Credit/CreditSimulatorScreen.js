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
} from 'react-native';
import Slider from '@react-native-community/slider';
import { creditService } from '../../services';

export default function CreditSimulatorScreen({ navigation }) {
    const [amount, setAmount] = useState('10000');
    const [term, setTerm] = useState(12);
    const [simulation, setSimulation] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSimulate = async () => {
        const amountValue = parseFloat(amount);

        if (!amountValue || amountValue < 1000) {
            Alert.alert('Erro', 'O valor mínimo é 1.000 MT');
            return;
        }

        setLoading(true);
        try {
            const response = await creditService.simulate(amountValue, term);
            setSimulation(response.data);
        } catch (error) {
            Alert.alert('Erro', error.response?.data?.message || 'Erro ao simular crédito');
        } finally {
            setLoading(false);
        }
    };

    const handleRequestCredit = () => {
        if (!simulation) {
            Alert.alert('Erro', 'Por favor, simule o crédito primeiro');
            return;
        }

        navigation.navigate('RequestCredit', {
            amount: simulation.amount,
            term: simulation.term,
        });
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>💰 Simulador de Crédito</Text>
                <Text style={styles.subtitle}>
                    Calcule quanto você vai pagar mensalmente
                </Text>
            </View>

            <View style={styles.form}>
                <Text style={styles.label}>Valor Desejado (MT)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ex: 10000"
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                />

                <Text style={styles.label}>Prazo (meses)</Text>
                <View style={styles.sliderContainer}>
                    <Slider
                        style={styles.slider}
                        minimumValue={1}
                        maximumValue={36}
                        step={1}
                        value={term}
                        onValueChange={setTerm}
                        minimumTrackTintColor="#2563eb"
                        maximumTrackTintColor="#cbd5e1"
                        thumbTintColor="#2563eb"
                    />
                    <Text style={styles.sliderValue}>{term} meses</Text>
                </View>

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleSimulate}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Simular</Text>
                    )}
                </TouchableOpacity>
            </View>

            {simulation && (
                <View style={styles.results}>
                    <View style={styles.resultsHeader}>
                        <Text style={styles.resultsIcon}>📊</Text>
                        <Text style={styles.resultsTitle}>Resultado da Simulação</Text>
                    </View>

                    <View style={styles.resultItem}>
                        <Text style={styles.resultLabel}>Valor do Crédito</Text>
                        <Text style={styles.resultValue}>
                            {simulation.amount.toLocaleString('pt-MZ')} MT
                        </Text>
                    </View>

                    <View style={styles.resultItem}>
                        <Text style={styles.resultLabel}>Taxa de Juros</Text>
                        <Text style={styles.resultValue}>{simulation.interestRate}% ao ano</Text>
                    </View>

                    <View style={styles.resultItem}>
                        <Text style={styles.resultLabel}>Prazo</Text>
                        <Text style={styles.resultValue}>{simulation.term} meses</Text>
                    </View>

                    <View style={[styles.resultItem, styles.highlightItem]}>
                        <Text style={styles.highlightLabel}>Parcela Mensal</Text>
                        <Text style={styles.highlightValue}>
                            {simulation.monthlyPayment.toLocaleString('pt-MZ', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}{' '}
                            MT
                        </Text>
                    </View>

                    <View style={styles.resultItem}>
                        <Text style={styles.resultLabel}>Total a Pagar</Text>
                        <Text style={[styles.resultValue, styles.totalValue]}>
                            {simulation.totalPayable.toLocaleString('pt-MZ', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}{' '}
                            MT
                        </Text>
                    </View>

                    <View style={styles.resultItem}>
                        <Text style={styles.resultLabel}>Total de Juros</Text>
                        <Text style={styles.resultValue}>
                            {simulation.totalInterest.toLocaleString('pt-MZ', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}{' '}
                            MT
                        </Text>
                    </View>

                    <TouchableOpacity style={styles.requestButton} onPress={handleRequestCredit}>
                        <Text style={styles.requestButtonText}>Solicitar Este Crédito</Text>
                    </TouchableOpacity>

                    <Text style={styles.disclaimer}>
                        * Valores aproximados. A aprovação está sujeita a análise de crédito.
                    </Text>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#2563eb',
        padding: 24,
        paddingTop: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#bfdbfe',
    },
    form: {
        backgroundColor: '#fff',
        margin: 16,
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        padding: 12,
        fontSize: 18,
        fontWeight: '600',
        color: '#1e293b',
    },
    sliderContainer: {
        marginTop: 8,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    sliderValue: {
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2563eb',
        marginTop: 4,
    },
    button: {
        backgroundColor: '#2563eb',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 24,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    results: {
        backgroundColor: '#fff',
        margin: 16,
        marginTop: 0,
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    resultsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 2,
        borderBottomColor: '#f1f5f9',
    },
    resultsIcon: {
        fontSize: 28,
        marginRight: 12,
    },
    resultsTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    resultItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    resultLabel: {
        fontSize: 14,
        color: '#64748b',
    },
    resultValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
    },
    highlightItem: {
        backgroundColor: '#dbeafe',
        marginHorizontal: -20,
        paddingHorizontal: 20,
        paddingVertical: 16,
        marginVertical: 8,
        borderRadius: 8,
        borderBottomWidth: 0,
    },
    highlightLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e40af',
    },
    highlightValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e40af',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2563eb',
    },
    requestButton: {
        backgroundColor: '#10b981',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 24,
    },
    requestButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    disclaimer: {
        fontSize: 12,
        color: '#94a3b8',
        textAlign: 'center',
        marginTop: 16,
        fontStyle: 'italic',
    },
});
