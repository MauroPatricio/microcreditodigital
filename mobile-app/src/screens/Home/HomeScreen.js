import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api'; // Certifique-se que o api está disponível

export default function HomeScreen({ navigation }) {
    const { user } = useAuth();
    const [data, setData] = useState({ credits: [], notifications: [], collections: [] });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            if (user?.role === 'agent') {
                const [creditsRes, notificationsRes] = await Promise.all([
                    api.get('/credits'), // Endpoints I implemented are already scoped
                    api.get('/notifications'),
                ]);
                setData({
                    credits: creditsRes.data.data.credits || [],
                    notifications: notificationsRes.data.data.notifications || [],
                    collections: [] // In production, call /payments today
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
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    const renderAgentHome = () => (
        <>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    {getLogoUrl() ? (
                        <Image source={{ uri: getLogoUrl() }} style={styles.headerLogo} />
                    ) : (
                        <View style={[styles.headerLogo, { backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' }]}>
                            <Text style={{ color: '#fff', fontWeight: 'bold' }}>CS</Text>
                        </View>
                    )}
                    <View>
                        <Text style={styles.greeting}>{user?.institution?.settings?.appearance?.headerTitle || 'CrediSmart+'}</Text>
                        <Text style={styles.userName}>{user?.name.split(' ')[0]}</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.notificationButton}>
                    <Text style={styles.notificationIcon}>🔔</Text>
                    {unreadCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount}</Text></View>}
                </TouchableOpacity>
            </View>

            <View style={styles.quickActions}>
                <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('AddClient')}>
                    <Text style={styles.actionIcon}>👥</Text>
                    <Text style={styles.actionTitle}>Novo Cliente</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionCard}>
                    <Text style={styles.actionIcon}>💵</Text>
                    <Text style={styles.actionTitle}>Registrar Cobrança</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Métricas do Dia</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 }}>
                    <View style={styles.metricItem}>
                        <Text style={styles.metricValue}>0</Text>
                        <Text style={styles.metricLabel}>Visitas</Text>
                    </View>
                    <View style={styles.metricItem}>
                        <Text style={styles.metricValue}>0,00 MT</Text>
                        <Text style={styles.metricLabel}>Cobrado</Text>
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
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        {getLogoUrl() ? (
                            <Image source={{ uri: getLogoUrl() }} style={styles.headerLogo} />
                        ) : (
                            <View style={[styles.headerLogo, { backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' }]}>
                                <Text style={{ color: '#fff', fontWeight: 'bold' }}>CS</Text>
                            </View>
                        )}
                        <View>
                            <Text style={styles.greeting}>{user?.institution?.settings?.appearance?.headerTitle || 'CrediSmart+'}</Text>
                            <Text style={styles.userName}>{user?.name.split(' ')[0]}</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.notificationButton}>
                        <Text style={styles.notificationIcon}>🔔</Text>
                        {unreadCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount}</Text></View>}
                    </TouchableOpacity>
                </View>

                {/* Pendências Críticas */}
                {!user?.isVerified && (
                    <TouchableOpacity
                        style={[styles.statusCard, styles.warningCard]}
                        onPress={() => navigation.navigate('DocumentCenter')}
                    >
                        <Text style={styles.statusTitle}>Documentação Pendente</Text>
                        <Text style={styles.statusText}>Complete seu perfil para liberar novos créditos.</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                            <Text style={{ color: '#ef4444', fontWeight: '700' }}>Resolver Agora</Text>
                            <Text style={{ marginLeft: 5 }}>➔</Text>
                        </View>
                    </TouchableOpacity>
                )}

                {data.credits.some(c => c.contractStatus === 'pending_signature') && (
                    <TouchableOpacity
                        style={[styles.statusCard, { backgroundColor: '#e0f2fe', borderLeftColor: '#0ea5e9', borderLeftWidth: 4 }]}
                        onPress={() => {
                            const credit = data.credits.find(c => c.contractStatus === 'pending_signature');
                            navigation.navigate('ContractSigner', { creditId: credit._id });
                        }}
                    >
                        <Text style={[styles.statusTitle, { color: '#0369a1' }]}>Contrato Disponível</Text>
                        <Text style={styles.statusText}>Seu crédito foi aprovado! Assine o contrato para receber o valor.</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                            <Text style={{ color: '#0ea5e9', fontWeight: '700' }}>Assinar Digitalmente</Text>
                            <Text style={{ marginLeft: 5 }}>➔</Text>
                        </View>
                    </TouchableOpacity>
                )}

                {activeCredit ? (
                    <View style={[styles.statusCard, styles.activeCard]}>
                        <Text style={styles.statusTitle}>Crédito Ativo</Text>
                        <Text style={styles.statusText}>{activeCredit.amount.toLocaleString()} MT</Text>
                        <TouchableOpacity style={styles.detailsButton}>
                            <Text style={styles.detailsButtonText}>Ver Parcelas</Text>
                        </TouchableOpacity>
                    </View>
                ) : pendingCredit ? (
                    <View style={[styles.statusCard, styles.pendingCard]}>
                        <Text style={styles.statusTitle}>Em Análise</Text>
                        <Text style={styles.statusText}>Sua solicitação está sendo revisada.</Text>
                    </View>
                ) : (
                    <View style={[styles.statusCard, styles.infoCard]}>
                        <Text style={styles.statusTitle}>Novo Crédito</Text>
                        <Text style={styles.statusText}>Simule e solicite agora.</Text>
                        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('CreditSimulator')}>
                            <Text style={styles.primaryButtonText}>Simular</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </>
        );
    };

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {user?.role === 'agent' ? renderAgentHome() : renderClientHome()}
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
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9'
    },
    headerLogo: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#f8fafc'
    },
    greeting: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '600',
        textTransform: 'uppercase'
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
