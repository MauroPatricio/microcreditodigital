import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { creditService, notificationService } from '../../services';

export default function HomeScreen({ navigation }) {
    const { user } = useAuth();
    const [credits, setCredits] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [creditsResponse, notificationsResponse] = await Promise.all([
                creditService.getMyCredits(),
                notificationService.getNotifications(),
            ]);

            setCredits(creditsResponse.data.credits || []);
            setNotifications(notificationsResponse.data.notifications || []);
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

    const activeCredit = credits.find((c) => c.status === 'active');
    const pendingCredit = credits.find((c) => c.status === 'pending');
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Olá,</Text>
                    <Text style={styles.userName}>{user?.name}</Text>
                </View>
                <TouchableOpacity
                    style={styles.notificationButton}
                    onPress={() => navigation.navigate('Notifications')}
                >
                    <Text style={styles.notificationIcon}>🔔</Text>
                    {unreadCount > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{unreadCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() => navigation.navigate('CreditSimulator')}
                >
                    <Text style={styles.actionIcon}>💰</Text>
                    <Text style={styles.actionTitle}>Simular Crédito</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() => navigation.navigate('MyCredits')}
                >
                    <Text style={styles.actionIcon}>📊</Text>
                    <Text style={styles.actionTitle}>Meus Créditos</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() => navigation.navigate('Payments')}
                >
                    <Text style={styles.actionIcon}>💳</Text>
                    <Text style={styles.actionTitle}>Pagamentos</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() => navigation.navigate('Profile')}
                >
                    <Text style={styles.actionIcon}>👤</Text>
                    <Text style={styles.actionTitle}>Perfil</Text>
                </TouchableOpacity>
            </View>

            {/* Status Cards */}
            {pendingCredit && (
                <View style={[styles.statusCard, styles.pendingCard]}>
                    <Text style={styles.statusIcon}>⏳</Text>
                    <View style={styles.statusContent}>
                        <Text style={styles.statusTitle}>Crédito em Análise</Text>
                        <Text style={styles.statusText}>
                            Valor: {pendingCredit.amount.toFixed(2)} MT
                        </Text>
                        <Text style={styles.statusSubtext}>Aguardando aprovação</Text>
                    </View>
                </View>
            )}

            {activeCredit && (
                <View style={[styles.statusCard, styles.activeCard]}>
                    <Text style={styles.statusIcon}>✅</Text>
                    <View style={styles.statusContent}>
                        <Text style={styles.statusTitle}>Crédito Ativo</Text>
                        <Text style={styles.statusText}>
                            Total pago: {activeCredit.totalPaid?.toFixed(2) || '0.00'} MT
                        </Text>
                        <Text style={styles.statusSubtext}>
                            de {activeCredit.totalPayable.toFixed(2)} MT
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.detailsButton}
                        onPress={() => navigation.navigate('CreditDetails', { creditId: activeCredit._id })}
                    >
                        <Text style={styles.detailsButtonText}>Ver Detalhes</Text>
                    </TouchableOpacity>
                </View>
            )}

            {!activeCredit && !pendingCredit && user?.isVerified && (
                <View style={[styles.statusCard, styles.infoCard]}>
                    <Text style={styles.statusIcon}>🎉</Text>
                    <View style={styles.statusContent}>
                        <Text style={styles.statusTitle}>Pronto para Solicitar!</Text>
                        <Text style={styles.statusText}>
                            Você está verificado e pode solicitar um crédito
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => navigation.navigate('CreditSimulator')}
                    >
                        <Text style={styles.primaryButtonText}>Simular Agora</Text>
                    </TouchableOpacity>
                </View>
            )}

            {!user?.isVerified && (
                <View style={[styles.statusCard, styles.warningCard]}>
                    <Text style={styles.statusIcon}>⚠️</Text>
                    <View style={styles.statusContent}>
                        <Text style={styles.statusTitle}>Conta Não Verificada</Text>
                        <Text style={styles.statusText}>
                            Complete seu perfil e envie seus documentos
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => navigation.navigate('Profile')}
                    >
                        <Text style={styles.secondaryButtonText}>Completar Perfil</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Recent Notifications */}
            {notifications.length > 0 && (
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Notificações Recentes</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
                            <Text style={styles.seeAllText}>Ver todas</Text>
                        </TouchableOpacity>
                    </View>
                    {notifications.slice(0, 3).map((notification) => (
                        <View key={notification._id} style={styles.notificationItem}>
                            <View style={[styles.notificationDot, !notification.isRead && styles.unreadDot]} />
                            <View style={styles.notificationContent}>
                                <Text style={styles.notificationTitle}>{notification.title}</Text>
                                <Text style={styles.notificationMessage} numberOfLines={2}>
                                    {notification.message}
                                </Text>
                            </View>
                        </View>
                    ))}
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 40,
        backgroundColor: '#fff',
    },
    greeting: {
        fontSize: 14,
        color: '#64748b',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    notificationButton: {
        position: 'relative',
        padding: 8,
    },
    notificationIcon: {
        fontSize: 24,
    },
    badge: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: '#ef4444',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    quickActions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 10,
        backgroundColor: '#fff',
    },
    actionCard: {
        width: '48%',
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 20,
        margin: '1%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    actionIcon: {
        fontSize: 36,
        marginBottom: 8,
    },
    actionTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#334155',
        textAlign: 'center',
    },
    statusCard: {
        margin: 16,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    pendingCard: {
        backgroundColor: '#fef3c7',
        borderLeftWidth: 4,
        borderLeftColor: '#f59e0b',
    },
    activeCard: {
        backgroundColor: '#d1fae5',
        borderLeftWidth: 4,
        borderLeftColor: '#10b981',
    },
    infoCard: {
        backgroundColor: '#dbeafe',
        borderLeftWidth: 4,
        borderLeftColor: '#2563eb',
    },
    warningCard: {
        backgroundColor: '#fee2e2',
        borderLeftWidth: 4,
        borderLeftColor: '#ef4444',
    },
    statusIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    statusContent: {
        marginBottom: 12,
    },
    statusTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
    },
    statusText: {
        fontSize: 16,
        color: '#334155',
        marginBottom: 2,
    },
    statusSubtext: {
        fontSize: 14,
        color: '#64748b',
    },
    detailsButton: {
        backgroundColor: '#10b981',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    detailsButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    primaryButton: {
        backgroundColor: '#2563eb',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    secondaryButton: {
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#ef4444',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: '#ef4444',
        fontWeight: '600',
    },
    section: {
        margin: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    seeAllText: {
        color: '#2563eb',
        fontSize: 14,
        fontWeight: '600',
    },
    notificationItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    notificationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#cbd5e1',
        marginRight: 12,
        marginTop: 6,
    },
    unreadDot: {
        backgroundColor: '#2563eb',
    },
    notificationContent: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
    },
    notificationMessage: {
        fontSize: 13,
        color: '#64748b',
    },
});
