import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Image,
    Platform,
    Modal,
    FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useAlert } from '../../context/AlertContext';
import { Bell, UserPlus, Receipt, AlertCircle, FileSignature, Wallet, CheckCircle2, ShieldCheck, ChevronRight, Activity, Timer, X, Check } from 'lucide-react-native';

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

export default function HomeScreen({ navigation }) {
    const { user } = useAuth();
    const [data, setData] = useState({ credits: [], notifications: [], collections: [] });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [markingAll, setMarkingAll] = useState(false);
    const { showAlert } = useAlert();

    const handleMarkAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setData(prev => ({
                ...prev,
                notifications: prev.notifications.map(n => n._id === id ? { ...n, isRead: true } : n)
            }));
        } catch (e) {
            console.error('Erro ao marcar notificação como lida:', e);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            setMarkingAll(true);
            await api.put('/notifications/mark-all-read');
            setData(prev => ({
                ...prev,
                notifications: prev.notifications.map(n => ({ ...n, isRead: true }))
            }));
        } catch (e) {
            console.error('Erro ao marcar todas as notificações:', e);
        } finally {
            setMarkingAll(false);
        }
    };

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
            loadData();
        }, [])
    );

    const loadData = async () => {
        try {
            if (user?.role === 'agent') {
                const [creditsRes, notificationsRes] = await Promise.all([
                    api.get('/credits'),
                    api.get('/notifications'),
                ]);
                setData({
                    credits: creditsRes.data.data.credits || [],
                    notifications: notificationsRes.data.data.notifications || [],
                    collections: []
                });
            } else {
                const [creditsRes, notificationsRes] = await Promise.all([
                    api.get('/credits'),
                    api.get('/notifications'),
                ]);
                setData({
                    credits: creditsRes.data.data.credits || [],
                    notifications: notificationsRes.data.data.notifications || []
                });
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const unreadCount = data.notifications.filter((n) => !n.isRead).length;

    const getLogoUrl = () => {
        if (user?.institution?.settings?.appearance?.logoUrl) {
            const baseUrl = api.defaults.baseURL.replace('/api', '');
            return `${baseUrl}/${user.institution.settings.appearance.logoUrl}`;
        }
        return null;
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    const renderAgentHome = () => (
        <>
            <View style={styles.header}>
                <View style={styles.headerTitleBox}>
                    {getLogoUrl() ? (
                        <Image source={{ uri: getLogoUrl() }} style={styles.headerLogo} />
                    ) : (
                        <View style={[styles.headerLogo, styles.placeholderLogo]}>
                            <Text style={styles.placeholderLogoText}>TM</Text>
                        </View>
                    )}
                    <View>
                        <Text style={styles.greeting}>Olá, {user?.name.split(' ')[0]}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.userName}>{user?.institution?.settings?.appearance?.headerTitle || 'Agente TaquiMola'}</Text>
                            {user?.isVerified && (
                                <ShieldCheck size={18} color="#10b981" />
                            )}
                        </View>
                    </View>
                </View>
                <TouchableOpacity 
                    style={styles.notificationBtn} 
                    activeOpacity={0.7}
                    onPress={() => setModalVisible(true)}
                >
                    <Bell size={24} color="#1e293b" />
                    {unreadCount > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{unreadCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.quickActions}>
                <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('AddClient')} activeOpacity={0.7}>
                    <View style={[styles.actionIconBox, { backgroundColor: '#dbeafe' }]}>
                        <UserPlus size={24} color="#3b82f6" />
                    </View>
                    <Text style={styles.actionTitle}>Novo Cliente</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionCard} activeOpacity={0.7}>
                    <View style={[styles.actionIconBox, { backgroundColor: '#d1fae5' }]}>
                        <Receipt size={24} color="#10b981" />
                    </View>
                    <Text style={styles.actionTitle}>Registrar Cobrança</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Métricas do Dia</Text>
                <View style={styles.metricsGrid}>
                    <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Visitas Feitas</Text>
                        <Text style={styles.metricValue}>0</Text>
                    </View>
                    <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Valor Cobrado</Text>
                        <Text style={[styles.metricValue, { color: '#10b981' }]}>0,00 MT</Text>
                    </View>
                </View>
            </View>
        </>
    );

    const renderClientHome = () => {
        const activeCredit = data.credits.find((c) => c.status === 'active');
        const pendingCredit = data.credits.find((c) => c.status === 'pending');

        return (
            <>
                <View style={styles.header}>
                    <View style={styles.headerTitleBox}>
                        {getLogoUrl() ? (
                            <Image source={{ uri: getLogoUrl() }} style={styles.headerLogo} />
                        ) : (
                            <View style={[styles.headerLogo, styles.placeholderLogo]}>
                                <Text style={styles.placeholderLogoText}>CS</Text>
                            </View>
                        )}
                        <View>
                            <Text style={styles.greeting}>Bem-vindo de volta,</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={styles.userName}>{user?.name.split(' ')[0]}</Text>
                                {user?.isVerified && (
                                    <ShieldCheck size={18} color="#10b981" />
                                )}
                            </View>
                            {user?.institution?.name && (
                                <Text style={styles.instName}>{user.institution.name}</Text>
                            )}
                        </View>
                    </View>
                    <TouchableOpacity 
                        style={styles.notificationBtn} 
                        activeOpacity={0.7}
                        onPress={() => setModalVisible(true)}
                    >
                        <Bell size={24} color="#1e293b" />
                        {unreadCount > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{unreadCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.mainContent}>
                    {/* Pendências Críticas */}
                    {(!user?.documents || user.documents.length === 0) && !user?.isVerified && (
                        <TouchableOpacity
                            style={[styles.statusCard, styles.warningCard]}
                            onPress={() => navigation.navigate('DocumentCenter')}
                            activeOpacity={0.8}
                        >
                            <View style={styles.cardIconBoxRed}>
                                <AlertCircle size={24} color="#ef4444" />
                            </View>
                            <View style={styles.cardTextBox}>
                                <Text style={[styles.statusTitle, { color: '#b91c1c' }]}>Documentação Pendente</Text>
                                <Text style={[styles.statusText, { color: '#dc2626' }]}>Complete seu perfil para liberar novos créditos.</Text>
                                <View style={styles.cardActionRow}>
                                    <Text style={[styles.cardActionText, { color: '#ef4444' }]}>Resolver Agora</Text>
                                    <ChevronRight size={16} color="#ef4444" />
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}

                    {data.credits.some(c => c.contractStatus === 'pending_signature') && (
                        <TouchableOpacity
                            style={[styles.statusCard, styles.infoCard]}
                            onPress={() => {
                                const credit = data.credits.find(c => c.contractStatus === 'pending_signature');
                                navigation.navigate('ContractSigner', { creditId: credit._id });
                            }}
                            activeOpacity={0.8}
                        >
                            <View style={styles.cardIconBoxBlue}>
                                <FileSignature size={24} color="#3b82f6" />
                            </View>
                            <View style={styles.cardTextBox}>
                                <Text style={[styles.statusTitle, { color: '#1d4ed8' }]}>Contrato Disponível</Text>
                                <Text style={[styles.statusText, { color: '#2563eb' }]}>O seu crédito foi aprovado! Assine o contrato.</Text>
                                <View style={styles.cardActionRow}>
                                    <Text style={[styles.cardActionText, { color: '#3b82f6' }]}>Assinar Digitalmente</Text>
                                    <ChevronRight size={16} color="#3b82f6" />
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}

                    {activeCredit ? (
                        <View style={[styles.statusCard, styles.successCard]}>
                            <View style={styles.cardIconBoxGreen}>
                                <CheckCircle2 size={24} color="#10b981" />
                            </View>
                            <View style={styles.cardTextBox}>
                                <Text style={[styles.statusTitle, { color: '#047857' }]}>Crédito Ativo</Text>
                                <Text style={styles.creditAmountText}>{(activeCredit.amount || 0).toLocaleString()} MT</Text>
                                <TouchableOpacity style={styles.detailsBtn} activeOpacity={0.8}>
                                    <Text style={styles.detailsBtnText}>Ver Parcelas</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : pendingCredit ? (
                        <View style={[styles.statusCard, styles.pendingCard]}>
                            <View style={styles.cardIconBoxOrange}>
                                <Activity size={24} color="#f59e0b" />
                            </View>
                            <View style={styles.cardTextBox}>
                                <Text style={[styles.statusTitle, { color: '#b45309' }]}>Em Análise</Text>
                                <Text style={[styles.statusText, { color: '#d97706' }]}>Sua solicitação está sendo cuidadosamente revisada.</Text>
                                <CountdownTimer credit={pendingCredit} onInsist={handleInsist} />
                            </View>
                        </View>
                    ) : (
                        <View style={[styles.statusCard, styles.neutralCard]}>
                            <View style={styles.cardIconBoxBlue}>
                                <Wallet size={24} color="#3b82f6" />
                            </View>
                            <View style={styles.cardTextBox}>
                                <Text style={styles.statusTitle}>Simular Novo Crédito</Text>
                                <Text style={styles.statusText}>Tem projetos em mente? Descubra o quanto pode receber.</Text>
                                <TouchableOpacity 
                                    style={styles.primaryBtn} 
                                    onPress={() => navigation.navigate('CreditSimulator')}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.primaryBtnText}>Simular Agora</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            </>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
            >
                {user?.role === 'agent' ? renderAgentHome() : renderClientHome()}
            </ScrollView>

            {/* Modal de Notificações */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={styles.modalTitle}>Notificações</Text>
                                {unreadCount > 0 && (
                                    <View style={styles.modalBadge}>
                                        <Text style={styles.modalBadgeText}>{unreadCount}</Text>
                                    </View>
                                )}
                            </View>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                                <X size={20} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        {unreadCount > 0 && (
                            <TouchableOpacity 
                                style={styles.markAllBtn} 
                                onPress={handleMarkAllAsRead}
                                disabled={markingAll}
                            >
                                <Check size={14} color="#3b82f6" />
                                <Text style={styles.markAllText}>Marcar todas como lidas</Text>
                            </TouchableOpacity>
                        )}

                        <FlatList
                            data={data.notifications}
                            keyExtractor={(item) => item._id}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingVertical: 10 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.notificationItem,
                                        !item.isRead && styles.unreadNotificationItem
                                    ]}
                                    activeOpacity={0.7}
                                    onPress={() => !item.isRead && handleMarkAsRead(item._id)}
                                >
                                    <View style={[styles.notifIconBox, !item.isRead ? { backgroundColor: '#dbeafe' } : { backgroundColor: '#f1f5f9' }]}>
                                        <Bell size={18} color={!item.isRead ? '#3b82f6' : '#94a3b8'} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Text style={[styles.notifTitle, !item.isRead && styles.unreadNotifTitle]}>
                                                {item.title}
                                            </Text>
                                            {!item.isRead && <View style={styles.notifDot} />}
                                        </View>
                                        <Text style={styles.notifMessage}>{item.message}</Text>
                                        <Text style={styles.notifDate}>
                                            {new Date(item.createdAt).toLocaleDateString('pt-MZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Bell size={40} color="#cbd5e1" style={{ marginBottom: 12 }} />
                                    <Text style={styles.emptyText}>Não tem notificações no momento.</Text>
                                </View>
                            }
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f4f7fb' },
    container: { flex: 1, backgroundColor: '#f4f7fb' },
    scrollContent: { paddingBottom: 40 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f7fb' },
    
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 20 : 40,
        paddingBottom: 20,
    },
    headerTitleBox: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    headerLogo: { width: 52, height: 52, borderRadius: 16 },
    placeholderLogo: { backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' },
    placeholderLogoText: { color: '#fff', fontWeight: '900', fontSize: 18 },
    greeting: { fontSize: 14, color: '#64748b', fontWeight: '500', marginBottom: 2 },
    userName: { fontSize: 22, fontWeight: '800', color: '#1e293b', letterSpacing: -0.5 },
    instName: { fontSize: 12, color: '#3b82f6', fontWeight: '700', marginTop: 2 },
    
    notificationBtn: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    badge: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: '#ef4444',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#ffffff',
    },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    
    mainContent: { paddingHorizontal: 20, paddingTop: 10 },
    
    statusCard: {
        flexDirection: 'row',
        padding: 20,
        borderRadius: 24,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 4,
    },
    cardTextBox: { flex: 1, paddingLeft: 16 },
    
    warningCard: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' },
    infoCard: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' },
    successCard: { backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#a7f3d0' },
    pendingCard: { backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a' },
    neutralCard: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#f1f5f9' },
    
    cardIconBoxRed: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center' },
    cardIconBoxBlue: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#dbeafe', justifyContent: 'center', alignItems: 'center' },
    cardIconBoxGreen: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#d1fae5', justifyContent: 'center', alignItems: 'center' },
    cardIconBoxOrange: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#fef3c7', justifyContent: 'center', alignItems: 'center' },
    
    statusTitle: { fontSize: 17, fontWeight: '800', color: '#1e293b', marginBottom: 6 },
    statusText: { fontSize: 14, color: '#475569', lineHeight: 20, marginBottom: 10 },
    creditAmountText: { fontSize: 26, fontWeight: '900', color: '#047857', marginBottom: 12 },
    
    cardActionRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    cardActionText: { fontSize: 13, fontWeight: '700', marginRight: 4 },
    
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
    
    primaryBtn: { backgroundColor: '#3b82f6', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, alignSelf: 'flex-start' },
    primaryBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
    
    detailsBtn: { backgroundColor: '#10b981', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, alignSelf: 'flex-start', shadowColor: '#10b981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    detailsBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
    
    quickActions: { flexDirection: 'row', gap: 16, paddingHorizontal: 20, marginTop: 10 },
    actionCard: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
        elevation: 3,
    },
    actionIconBox: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    actionTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b', textAlign: 'center' },
    
    section: { marginTop: 30, paddingHorizontal: 20 },
    sectionTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginBottom: 16 },
    metricsGrid: { flexDirection: 'row', gap: 16 },
    metricItem: {
        flex: 1,
        backgroundColor: '#ffffff',
        padding: 20,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
        elevation: 3,
    },
    metricLabel: { fontSize: 13, color: '#64748b', fontWeight: '600', marginBottom: 8 },
    metricValue: { fontSize: 22, fontWeight: '900', color: '#1e293b' },

    /* Modal de Notificações */
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 25,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1e293b',
    },
    modalBadge: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    modalBadgeText: {
        color: '#3b82f6',
        fontSize: 12,
        fontWeight: '700',
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    markAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-end',
        paddingVertical: 10,
    },
    markAllText: {
        color: '#3b82f6',
        fontSize: 13,
        fontWeight: '600',
    },
    notificationItem: {
        flexDirection: 'row',
        padding: 14,
        borderRadius: 16,
        backgroundColor: '#f8fafc',
        marginBottom: 10,
        gap: 12,
        alignItems: 'flex-start',
    },
    unreadNotificationItem: {
        backgroundColor: '#eff6ff',
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    notifIconBox: {
        width: 38,
        height: 38,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    notifTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
    },
    unreadNotifTitle: {
        fontWeight: '800',
        color: '#1e293b',
    },
    notifDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#3b82f6',
    },
    notifMessage: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 4,
        lineHeight: 18,
    },
    notifDate: {
        fontSize: 11,
        color: '#94a3b8',
        marginTop: 6,
    },
    emptyContainer: {
        paddingVertical: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: '500',
    },
});
