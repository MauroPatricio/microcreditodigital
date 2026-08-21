import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { creditService } from '../../services';
import { Calendar, Wallet, History, AlertCircle } from 'lucide-react-native';

export default function CreditDetailsScreen({ route, navigation }) {
    const { creditId } = route.params;
    const [credit, setCredit] = useState(null);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            loadCreditDetails();
        }, [creditId])
    );

    const loadCreditDetails = async () => {
        try {
            const res = await creditService.getCreditDetails(creditId);
            setCredit(res.data.credit);
        } catch (error) {
            console.error('Error loading credit details', error);
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

    if (!credit) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Crédito não encontrado.</Text>
            </View>
        );
    }

    const nextInstallment = credit.installments?.find(inst => inst.status === 'pending' || inst.status === 'overdue' || inst.status === 'partially_paid');
    
    return (
        <ScrollView style={styles.container}>
            <View style={styles.headerCard}>
                <Text style={styles.label}>Valor do Crédito</Text>
                <Text style={styles.amount}>{(credit.approvedAmount || credit.amount).toLocaleString('pt-MZ')} MT</Text>
                
                <View style={styles.row}>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Total Pago</Text>
                        <Text style={[styles.statValue, { color: '#10b981' }]}>{(credit.totalPaid || 0).toLocaleString('pt-MZ')} MT</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Saldo em Dívida</Text>
                        <Text style={[styles.statValue, { color: '#ef4444' }]}>{Math.max(0, credit.totalPayable - (credit.totalPaid || 0)).toLocaleString('pt-MZ')} MT</Text>
                    </View>
                </View>
            </View>

            {/* Período de Pagamento Card */}
            {(credit.startDate || (credit.installments && credit.installments.length > 0)) && (
                <View style={styles.periodCard}>
                    <View style={styles.periodHeader}>
                        <Calendar size={18} color="#3b82f6" />
                        <Text style={styles.periodTitle}>Período de Pagamento</Text>
                    </View>
                    <View style={styles.periodRow}>
                        <View style={styles.periodBox}>
                            <Text style={styles.periodLabel}>Início</Text>
                            <Text style={styles.periodDate}>
                                {credit.startDate 
                                    ? new Date(credit.startDate).toLocaleDateString('pt-MZ') 
                                    : new Date(credit.installments[0].dueDate).toLocaleDateString('pt-MZ')}
                            </Text>
                        </View>
                        <View style={styles.periodDivider} />
                        <View style={styles.periodBox}>
                            <Text style={styles.periodLabel}>Fim (Previsto)</Text>
                            <Text style={styles.periodDate}>
                                {credit.endDate 
                                    ? new Date(credit.endDate).toLocaleDateString('pt-MZ') 
                                    : new Date(credit.installments[credit.installments.length - 1].dueDate).toLocaleDateString('pt-MZ')}
                            </Text>
                        </View>
                    </View>
                </View>
            )}

            {nextInstallment && (
                <View style={styles.nextInstallmentCard}>
                    <Text style={styles.nextLabel}>Próxima Prestação</Text>
                    <View style={styles.nextRow}>
                        <Text style={styles.nextAmount}>{(nextInstallment.totalAmount - nextInstallment.paidAmount).toLocaleString('pt-MZ')} MT</Text>
                        <Text style={styles.nextDate}>Vence: {new Date(nextInstallment.dueDate).toLocaleDateString('pt-MZ')}</Text>
                    </View>
                    <TouchableOpacity 
                        style={styles.payBtn}
                        onPress={() => navigation.navigate('PaymentScreen', { creditId: credit._id, installmentId: nextInstallment._id, amount: (nextInstallment.totalAmount - nextInstallment.paidAmount) })}
                    >
                        <Wallet size={20} color="#fff" style={{marginRight: 8}}/>
                        <Text style={styles.payBtnText}>Pagar Prestação</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.actionsGrid}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('InstallmentsCalendarScreen', { creditId: credit._id })}>
                    <Calendar size={24} color="#3b82f6" />
                    <Text style={styles.actionBtnText}>Calendário</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('PaymentHistoryScreen', { creditId: credit._id })}>
                    <History size={24} color="#3b82f6" />
                    <Text style={styles.actionBtnText}>Histórico</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f7fb', padding: 20 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerCard: { backgroundColor: '#fff', padding: 24, borderRadius: 24, marginBottom: 20, elevation: 2 },
    label: { fontSize: 14, color: '#64748b', marginBottom: 8 },
    amount: { fontSize: 32, fontWeight: '800', color: '#1e293b', marginBottom: 20 },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    statBox: { flex: 1, backgroundColor: '#f8fafc', padding: 16, borderRadius: 16, marginHorizontal: 4 },
    statLabel: { fontSize: 12, color: '#64748b', marginBottom: 4 },
    statValue: { fontSize: 16, fontWeight: '700' },
    
    nextInstallmentCard: { backgroundColor: '#fff', padding: 20, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0' },
    nextLabel: { fontSize: 14, color: '#64748b', marginBottom: 8 },
    nextRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    nextAmount: { fontSize: 24, fontWeight: '700', color: '#1e293b' },
    nextDate: { fontSize: 14, color: '#ef4444', fontWeight: '500' },
    payBtn: { backgroundColor: '#3b82f6', padding: 16, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    payBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },

    actionsGrid: { flexDirection: 'row', gap: 16, marginBottom: 40 },
    actionBtn: { flex: 1, backgroundColor: '#fff', padding: 20, borderRadius: 20, alignItems: 'center', elevation: 2 },
    actionBtnText: { marginTop: 12, fontSize: 14, fontWeight: '600', color: '#1e293b' },
    
    periodCard: { backgroundColor: '#eff6ff', padding: 20, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: '#bfdbfe' },
    periodHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    periodTitle: { fontSize: 15, fontWeight: '700', color: '#1e3a8a' },
    periodRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    periodBox: { flex: 1 },
    periodLabel: { fontSize: 12, color: '#3b82f6', marginBottom: 4, fontWeight: '600' },
    periodDate: { fontSize: 15, fontWeight: '700', color: '#1e40af' },
    periodDivider: { width: 1, height: 30, backgroundColor: '#93c5fd', marginHorizontal: 16 }
});
