import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { creditService } from '../../services';
import { CheckCircle, Clock, XCircle } from 'lucide-react-native';

export default function PaymentHistoryScreen({ route }) {
    const { creditId } = route.params;
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [creditId]);

    const loadData = async () => {
        try {
            // Se existisse um endpoint direto para payments, chamariamos aqui.
            // Para simplificar, vou filtrar dos detalhes do crédito.
            const res = await creditService.getCreditDetails(creditId);
            const installments = res.data.credit.installments || [];
            
            // Aqui estamos mockando a listagem de pagamentos. Na realidade, teríamos um endpoint /payments/:creditId
            // Como criámos o Payment.js no backend, deveríamos ter o endpoint. Vamos assumir que a API devolve
            // ou mapeamos das parcelas que já estão pagas ou em análise.
            const history = installments.filter(i => i.status === 'paid' || i.status === 'in_analysis');
            setPayments(history);
        } catch (error) {
            console.error('Error loading history', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    if (payments.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.emptyText}>Nenhum pagamento registado ainda.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={payments}
                keyExtractor={(item) => item._id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => {
                    return (
                        <View style={styles.card}>
                            <View style={styles.header}>
                                <Text style={styles.title}>Parcela {item.installmentNumber}</Text>
                                <View style={styles.statusBox}>
                                    {item.status === 'paid' ? <CheckCircle size={16} color="#10b981" /> : <Clock size={16} color="#f59e0b" />}
                                    <Text style={[styles.statusText, { color: item.status === 'paid' ? '#10b981' : '#f59e0b' }]}>
                                        {item.status === 'paid' ? 'Confirmado' : 'Em Análise'}
                                    </Text>
                                </View>
                            </View>
                            
                            <View style={styles.detailsRow}>
                                <View style={styles.detailItem}>
                                    <Text style={styles.label}>Valor Pago</Text>
                                    <Text style={styles.value}>{(item.paidAmount || item.totalAmount).toLocaleString('pt-MZ')} MT</Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={styles.label}>Data Prevista</Text>
                                    <Text style={styles.value}>{new Date(item.dueDate).toLocaleDateString('pt-MZ')}</Text>
                                </View>
                            </View>
                        </View>
                    );
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f7fb' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontSize: 16, color: '#64748b' },
    listContent: { padding: 20 },
    card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, elevation: 2 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    title: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
    
    statusBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statusText: { fontSize: 14, fontWeight: '600' },
    
    detailsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    detailItem: { flex: 1 },
    label: { fontSize: 12, color: '#64748b', marginBottom: 4 },
    value: { fontSize: 16, fontWeight: '600', color: '#1e293b' }
});
