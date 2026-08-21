import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { creditService } from '../../services';
import api from '../../services/api';
import { useAlert } from '../../context/AlertContext';
import { FileText, Clock, CheckCircle, XCircle, AlertTriangle, ArrowRight, Wallet, Timer, AlertCircle } from 'lucide-react-native';

const CountdownTimer = ({ credit, onInsist }) => {
    const [timeLeft, setTimeLeft] = useState('');
    const [isZero, setIsZero] = useState(false);
    const [insisting, setInsisting] = useState(false);

    useEffect(() => {
        if (!credit || !credit.createdAt) return;
        const calculateTimeLeft = () => {
            const targetTime = new Date(credit.createdAt).getTime() + 30 * 60000;
            const now = new Date().getTime();
            const diff = targetTime - now;

            if (diff <= 0) {
                setIsZero(true);
                return '00:00';
            }

            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        };

        setTimeLeft(calculateTimeLeft());
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearInterval(timer);
    }, [credit]);

    if (isZero) {
        return (
            <TouchableOpacity 
                style={{ backgroundColor: '#f59e0b', padding: 8, borderRadius: 8, marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                onPress={async () => {
                    setInsisting(true);
                    if (onInsist) await onInsist(credit._id);
                    setInsisting(false);
                }}
                disabled={insisting}
            >
                {insisting ? <ActivityIndicator color="#fff" size="small" /> : (
                    <>
                        <AlertCircle size={16} color="#fff" style={{ marginRight: 6 }} />
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>Alertar Finanças</Text>
                    </>
                )}
            </TouchableOpacity>
        );
    }

    return (
        <View style={styles.countdownWrapper}>
            <Timer size={14} color="#059669" style={{ marginRight: 6 }} />
            <Text style={styles.countdownText}>
                Desembolso em {timeLeft}
            </Text>
        </View>
    );
};

export default function MyCreditsScreen({ navigation }) {
    const [credits, setCredits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { showAlert } = useAlert();

    const handleInsist = async (creditId) => {
        try {
            await api.post(`/credits/request/${creditId}/insist`);
            showAlert('Sucesso', 'Equipa de finanças foi alertada com sucesso!', 'success');
        } catch (error) {
            showAlert('Erro', 'Não foi possível enviar o alerta.', 'error');
        }
    };

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            loadCredits();
        }, [])
    );

    const loadCredits = async () => {
        try {
            const response = await creditService.getMyCredits();
            setCredits(response.data.credits || []);
        } catch (error) {
            console.error('Error loading credits:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadCredits();
    };

    const getStatusConfig = (status) => {
        const configs = {
            pending: { color: '#f59e0b', bg: '#fef3c7', text: 'Em Análise', icon: <Clock size={16} color="#f59e0b" /> },
            approved: { color: '#3b82f6', bg: '#dbeafe', text: 'Aprovado', icon: <CheckCircle size={16} color="#3b82f6" /> },
            active: { color: '#10b981', bg: '#d1fae5', text: 'Ativo', icon: <CheckCircle size={16} color="#10b981" /> },
            paid: { color: '#64748b', bg: '#f1f5f9', text: 'Liquidado', icon: <CheckCircle size={16} color="#64748b" /> },
            rejected: { color: '#ef4444', bg: '#fee2e2', text: 'Rejeitado', icon: <XCircle size={16} color="#ef4444" /> },
            defaulted: { color: '#dc2626', bg: '#fee2e2', text: 'Em Atraso', icon: <AlertTriangle size={16} color="#dc2626" /> },
        };
        return configs[status] || { color: '#64748b', bg: '#f1f5f9', text: status, icon: <Clock size={16} color="#64748b" /> };
    };

    const renderCreditItem = ({ item }) => {
        const config = getStatusConfig(item.status);
        const progress = item.status === 'active' || item.status === 'paid'
            ? Math.min(((item.totalPaid || 0) / (item.totalPayable || 1)) * 100, 100)
            : 0;

        return (
            <TouchableOpacity
                style={[styles.creditCard, { borderColor: config.bg, borderWidth: 1.5 }]}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('CreditDetails', { creditId: item._id })}
            >
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.cardAmount}>{(item.amount || 0).toLocaleString('pt-MZ')} MT</Text>
                        <Text style={styles.cardDate}>Solicitado em {new Date(item.createdAt).toLocaleDateString('pt-MZ')}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
                        {config.icon}
                        <Text style={[styles.statusText, { color: config.color }]}>{config.text}</Text>
                    </View>
                </View>

                <View style={styles.cardDetails}>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Prazo</Text>
                        <Text style={styles.detailValue}>{item.term} meses</Text>
                    </View>

                    {item.status === 'active' && (
                        <>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Pago</Text>
                                <Text style={[styles.detailValue, { color: '#10b981' }]}>
                                    {(item.totalPaid || 0).toLocaleString('pt-MZ')} MT
                                </Text>
                            </View>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Falta</Text>
                                <Text style={styles.detailValue}>
                                    {((item.totalPayable || 0) - (item.totalPaid || 0)).toLocaleString('pt-MZ')} MT
                                </Text>
                            </View>
                        </>
                    )}
                </View>

                {item.status === 'active' && (
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${progress}%` }]} />
                        </View>
                        <Text style={styles.progressText}>{Math.round(progress)}% pago</Text>
                    </View>
                )}

                {item.status === 'pending' && (
                    <View style={styles.infoBox}>
                        <Clock size={16} color="#f59e0b" style={{ marginRight: 10, marginTop: 2 }} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.infoText}>O seu pedido está sob análise da nossa equipa.</Text>
                            <CountdownTimer credit={item} onInsist={handleInsist} />
                        </View>
                    </View>
                )}

                {item.status === 'rejected' && item.rejectionReason && (
                    <View style={[styles.infoBox, { backgroundColor: '#fef2f2' }]}>
                        <XCircle size={16} color="#ef4444" style={{ marginRight: 6 }} />
                        <Text style={[styles.infoText, { color: '#ef4444' }]}>{item.rejectionReason}</Text>
                    </View>
                )}

                <View style={styles.cardFooter}>
                    <Text style={styles.footerText}>Ver detalhes</Text>
                    <ArrowRight size={16} color="#3b82f6" />
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    if (credits.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <View style={styles.emptyIconBox}>
                    <FileText size={48} color="#94a3b8" />
                </View>
                <Text style={styles.emptyTitle}>Sem Histórico</Text>
                <Text style={styles.emptyText}>
                    Ainda não efetuou nenhuma solicitação de crédito connosco.
                </Text>
                <TouchableOpacity
                    style={styles.emptyButton}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('CreditSimulator')}
                >
                    <Text style={styles.emptyButtonText}>Simular Primeiro Crédito</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.pageHeader}>
                <Text style={styles.pageTitle}>Meus Créditos</Text>
                <Text style={styles.pageSubtitle}>Acompanhe o estado de todos os seus pedidos.</Text>
            </View>
            <FlatList
                data={credits}
                renderItem={renderCreditItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f4f7fb' },
    
    pageHeader: { marginBottom: 16, marginTop: 10, paddingHorizontal: 20 },
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
    
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f7fb' },
    
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: '#f4f7fb' },
    emptyIconBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 2 },
    emptyTitle: { fontSize: 22, fontWeight: '800', color: '#1e293b', marginBottom: 8 },
    emptyText: { fontSize: 15, color: '#64748b', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
    emptyButton: { backgroundColor: '#3b82f6', paddingHorizontal: 28, paddingVertical: 16, borderRadius: 16, shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 6 },
    emptyButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
    
    listContent: { padding: 20, paddingBottom: 100 },
    
    creditCard: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 24,
        marginBottom: 20,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.08,
        shadowRadius: 30,
        elevation: 8,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
    cardAmount: { fontSize: 26, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 },
    cardDate: { fontSize: 13, color: '#64748b', marginTop: 4, fontWeight: '500' },
    
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, gap: 6 },
    statusText: { fontSize: 13, fontWeight: '800' },
    
    cardDetails: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: 20, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: '#f1f5f9' },
    detailItem: { flex: 1 },
    detailLabel: { fontSize: 13, color: '#64748b', marginBottom: 6, fontWeight: '600' },
    detailValue: { fontSize: 17, fontWeight: '800', color: '#1e293b' },
    
    progressContainer: { marginBottom: 20 },
    progressBar: { height: 10, backgroundColor: '#e2e8f0', borderRadius: 5, overflow: 'hidden', marginBottom: 6 },
    progressFill: { height: '100%', backgroundColor: '#10b981', borderRadius: 5 },
    progressText: { fontSize: 12, color: '#64748b', textAlign: 'right', fontWeight: '600' },
    
    infoBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fffbeb', padding: 14, borderRadius: 12, marginBottom: 16 },
    infoText: { flex: 1, fontSize: 13, color: '#b45309', fontWeight: '500', lineHeight: 18 },
    
    countdownWrapper: {
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#dcfce7', 
        paddingHorizontal: 10, 
        paddingVertical: 6, 
        borderRadius: 8, 
        alignSelf: 'flex-start', 
        marginTop: 10
    },
    countdownText: { color: '#059669', fontWeight: '800', fontSize: 13 },
    
    cardFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 6, paddingTop: 18, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    footerText: { fontSize: 14, fontWeight: '700', color: '#3b82f6' }
});
