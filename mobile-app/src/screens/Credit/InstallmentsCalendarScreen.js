import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { creditService } from '../../services';
import { CheckCircle, Clock, AlertTriangle, ArrowRight } from 'lucide-react-native';

export default function InstallmentsCalendarScreen({ route, navigation }) {
    const { creditId } = route.params;
    const [installments, setInstallments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [creditId]);

    const loadData = async () => {
        try {
            const res = await creditService.getCreditDetails(creditId);
            setInstallments(res.data.credit.installments || []);
        } catch (error) {
            console.error('Error loading installments', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusConfig = (status) => {
        const configs = {
            pending: { color: '#f59e0b', bg: '#fef3c7', text: 'Pendente', icon: <Clock size={16} color="#f59e0b" /> },
            in_analysis: { color: '#3b82f6', bg: '#dbeafe', text: 'Em Análise', icon: <Clock size={16} color="#3b82f6" /> },
            paid: { color: '#10b981', bg: '#d1fae5', text: 'Pago', icon: <CheckCircle size={16} color="#10b981" /> },
            overdue: { color: '#dc2626', bg: '#fee2e2', text: 'Em Atraso', icon: <AlertTriangle size={16} color="#dc2626" /> },
        };
        return configs[status] || { color: '#64748b', bg: '#f1f5f9', text: status, icon: <Clock size={16} color="#64748b" /> };
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={installments}
                keyExtractor={(item) => item._id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => {
                    const config = getStatusConfig(item.status);
                    const isPayable = item.status === 'pending' || item.status === 'overdue' || item.status === 'partially_paid';

                    return (
                        <View style={styles.card}>
                            <View style={styles.header}>
                                <Text style={styles.installmentNumber}>Parcela {item.installmentNumber}</Text>
                                <View style={[styles.badge, { backgroundColor: config.bg }]}>
                                    {config.icon}
                                    <Text style={[styles.badgeText, { color: config.color }]}>{config.text}</Text>
                                </View>
                            </View>
                            
                            <View style={styles.detailsRow}>
                                <View style={styles.detailItem}>
                                    <Text style={styles.label}>Valor</Text>
                                    <Text style={styles.value}>{item.totalAmount.toLocaleString('pt-MZ')} MT</Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={styles.label}>Vencimento</Text>
                                    <Text style={styles.value}>{new Date(item.dueDate).toLocaleDateString('pt-MZ')}</Text>
                                </View>
                            </View>

                            {isPayable && (
                                <TouchableOpacity 
                                    style={styles.payBtn}
                                    onPress={() => navigation.navigate('PaymentScreen', { creditId, installmentId: item._id, amount: item.totalAmount - (item.paidAmount || 0) })}
                                >
                                    <Text style={styles.payBtnText}>Pagar Agora</Text>
                                    <ArrowRight size={16} color="#3b82f6" />
                                </TouchableOpacity>
                            )}
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
    listContent: { padding: 20 },
    card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, elevation: 2 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    installmentNumber: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
    badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4 },
    badgeText: { fontSize: 12, fontWeight: '600' },
    
    detailsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    detailItem: { flex: 1 },
    label: { fontSize: 12, color: '#64748b', marginBottom: 4 },
    value: { fontSize: 16, fontWeight: '600', color: '#1e293b' },

    payBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: '#eff6ff', padding: 14, borderRadius: 12 },
    payBtnText: { color: '#3b82f6', fontSize: 14, fontWeight: '600' }
});
