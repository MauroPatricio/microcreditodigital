import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    RefreshControl,
    ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { creditService, paymentService } from '../../services';
import {
    CheckCircle2,
    Clock,
    XCircle,
    ArrowUpRight,
    Wallet,
    CreditCard,
    FileText,
    Calendar,
    Filter,
    Receipt,
    ChevronRight,
    AlertCircle
} from 'lucide-react-native';

const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return num.toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MT';
};

const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return 'N/A';
        const date = d.toLocaleDateString('pt-MZ');
        const time = d.toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' });
        return `${date} às ${time}`;
    } catch {
        return 'N/A';
    }
};

const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return 'N/A';
        return d.toLocaleDateString('pt-MZ');
    } catch {
        return 'N/A';
    }
};

const getMethodLabel = (method) => {
    switch (method) {
        case 'mpesa':
            return 'M-Pesa';
        case 'emola':
            return 'e-Mola';
        case 'bank_transfer':
            return 'Transferência Bancária';
        case 'cash':
            return 'Dinheiro em Mão';
        default:
            return method ? method.toUpperCase() : 'Outro';
    }
};

export default function PaymentHistoryScreen({ route, navigation }) {
    const routeCreditId = route?.params?.creditId || null;
    const [selectedCreditId, setSelectedCreditId] = useState(routeCreditId);
    const [statusFilter, setStatusFilter] = useState('all'); // all, confirmed, pending, rejected
    const [payments, setPayments] = useState([]);
    const [credits, setCredits] = useState([]);
    const [creditDetails, setCreditDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        try {
            // Carregar lista de pagamentos e créditos em paralelo
            const [paymentsRes, creditsRes] = await Promise.all([
                paymentService.getPaymentHistory(selectedCreditId ? { creditId: selectedCreditId } : {}),
                creditService.getMyCredits()
            ]);

            const paymentsList = paymentsRes?.data?.payments || [];
            setPayments(paymentsList);

            const userCredits = creditsRes?.data?.credits || [];
            setCredits(userCredits);

            if (selectedCreditId) {
                const found = userCredits.find(c => c._id === selectedCreditId);
                if (found) {
                    setCreditDetails(found);
                } else {
                    const detailRes = await creditService.getCreditDetails(selectedCreditId);
                    setCreditDetails(detailRes?.data?.credit || null);
                }
            } else {
                setCreditDetails(null);
            }
        } catch (error) {
            console.error('Erro ao carregar histórico de pagamentos:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedCreditId]);

    useEffect(() => {
        setLoading(true);
        loadData();
    }, [loadData]);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    // Filtrar pagamentos conforme statusFilter
    const filteredPayments = useMemo(() => {
        if (statusFilter === 'all') return payments;
        return payments.filter(p => p.status === statusFilter);
    }, [payments, statusFilter]);

    // Totais calculados
    const stats = useMemo(() => {
        const confirmedPayments = payments.filter(p => p.status === 'confirmed');
        const totalPaid = confirmedPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
        const pendingCount = payments.filter(p => p.status === 'pending').length;
        const rejectedCount = payments.filter(p => p.status === 'rejected').length;

        return {
            totalPaid,
            confirmedCount: confirmedPayments.length,
            pendingCount,
            rejectedCount,
            totalCount: payments.length
        };
    }, [payments]);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'confirmed':
                return {
                    bg: '#d1fae5',
                    text: '#047857',
                    label: 'Confirmado',
                    icon: <CheckCircle2 size={14} color="#047857" />
                };
            case 'pending':
                return {
                    bg: '#fef3c7',
                    text: '#b45309',
                    label: 'Em Análise',
                    icon: <Clock size={14} color="#b45309" />
                };
            case 'rejected':
                return {
                    bg: '#fee2e2',
                    text: '#b91c1c',
                    label: 'Rejeitado',
                    icon: <XCircle size={14} color="#b91c1c" />
                };
            default:
                return {
                    bg: '#f1f5f9',
                    text: '#64748b',
                    label: status || 'Desconhecido',
                    icon: <Clock size={14} color="#64748b" />
                };
        }
    };

    const renderPaymentItem = ({ item }) => {
        const badge = getStatusBadge(item.status);
        const loanNumber = item.credit?.loanNumber || (item.credit?._id ? `EMP-${item.credit._id.slice(-6).toUpperCase()}` : 'Crédito');
        const installmentNum = item.installment?.installmentNumber;

        return (
            <View style={styles.paymentCard}>
                <View style={styles.cardTopRow}>
                    <View style={styles.cardHeaderLeft}>
                        <View style={styles.paymentIconBox}>
                            <ArrowUpRight size={20} color="#10b981" />
                        </View>
                        <View>
                            <Text style={styles.paymentAmount}>{formatCurrency(item.amount)}</Text>
                            <Text style={styles.paymentMethod}>
                                {getMethodLabel(item.paymentMethod)} • {item.transactionId || 'Sem Ref'}
                            </Text>
                        </View>
                    </View>
                    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                        {badge.icon}
                        <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.cardInfoGrid}>
                    <View style={styles.infoCol}>
                        <Text style={styles.infoLabel}>Data do Pagamento</Text>
                        <Text style={styles.infoValue}>{formatDateTime(item.createdAt)}</Text>
                    </View>

                    {item.status === 'confirmed' && item.confirmedAt && (
                        <View style={styles.infoCol}>
                            <Text style={styles.infoLabel}>Confirmado em</Text>
                            <Text style={[styles.infoValue, { color: '#047857' }]}>{formatDateTime(item.confirmedAt)}</Text>
                        </View>
                    )}

                    {installmentNum && (
                        <View style={styles.infoCol}>
                            <Text style={styles.infoLabel}>Prestação</Text>
                            <Text style={styles.infoValue}>Parcela nº {installmentNum}</Text>
                        </View>
                    )}

                    <View style={styles.infoCol}>
                        <Text style={styles.infoLabel}>Empréstimo</Text>
                        <Text style={styles.infoValue}>{loanNumber}</Text>
                    </View>
                </View>

                {item.status === 'rejected' && item.rejectionReason && (
                    <View style={styles.rejectionBox}>
                        <AlertCircle size={15} color="#b91c1c" style={{ marginRight: 6 }} />
                        <Text style={styles.rejectionText}>
                            Motivo da Rejeição: {item.rejectionReason}
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.loadingText}>A carregar histórico de pagamentos...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Histórico de Pagamentos</Text>
                    <Text style={styles.headerSubtitle}>
                        Consulte quanto e quando pagou em cada empréstimo.
                    </Text>
                </View>
            </View>

            {/* Seletor de Empréstimos (quando existem múltiplos ou o utilizador quer ver todos) */}
            {credits.length > 0 && (
                <View style={styles.creditFilterContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.creditFilterScroll}>
                        <TouchableOpacity
                            style={[
                                styles.creditPill,
                                selectedCreditId === null && styles.creditPillActive
                            ]}
                            onPress={() => setSelectedCreditId(null)}
                        >
                            <CreditCard size={14} color={selectedCreditId === null ? '#fff' : '#475569'} style={{ marginRight: 6 }} />
                            <Text style={[
                                styles.creditPillText,
                                selectedCreditId === null && styles.creditPillTextActive
                            ]}>
                                Todos os Empréstimos ({credits.length})
                            </Text>
                        </TouchableOpacity>

                        {credits.map(credit => {
                            const isSelected = selectedCreditId === credit._id;
                            const label = credit.loanNumber || `EMP-${credit._id.slice(-6).toUpperCase()}`;
                            return (
                                <TouchableOpacity
                                    key={credit._id}
                                    style={[
                                        styles.creditPill,
                                        isSelected && styles.creditPillActive
                                    ]}
                                    onPress={() => setSelectedCreditId(credit._id)}
                                >
                                    <Receipt size={14} color={isSelected ? '#fff' : '#475569'} style={{ marginRight: 6 }} />
                                    <Text style={[
                                        styles.creditPillText,
                                        isSelected && styles.creditPillTextActive
                                    ]}>
                                        {label} ({formatCurrency(credit.amount)})
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            )}

            {/* Sumário do Crédito Selecionado ou Geral */}
            <View style={styles.summaryContainer}>
                {creditDetails ? (
                    <View style={styles.creditSummaryCard}>
                        <View style={styles.summaryHeader}>
                            <View>
                                <Text style={styles.summaryLoanNumber}>
                                    {creditDetails.loanNumber || `EMP-${creditDetails._id.slice(-6).toUpperCase()}`}
                                </Text>
                                <Text style={styles.summaryDate}>
                                    Solicitado em {formatDate(creditDetails.createdAt)}
                                </Text>
                            </View>
                            <View style={styles.statusMiniBadge}>
                                <Text style={styles.statusMiniText}>{creditDetails.status?.toUpperCase()}</Text>
                            </View>
                        </View>

                        <View style={styles.summaryStatsRow}>
                            <View style={styles.statBox}>
                                <Text style={styles.statLabel}>Valor Financiado</Text>
                                <Text style={styles.statValue}>
                                    {formatCurrency(creditDetails.approvedAmount || creditDetails.amount)}
                                </Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text style={styles.statLabel}>Total Pago</Text>
                                <Text style={[styles.statValue, { color: '#059669' }]}>
                                    {formatCurrency(creditDetails.totalPaid || stats.totalPaid)}
                                </Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text style={styles.statLabel}>Saldo em Dívida</Text>
                                <Text style={[styles.statValue, { color: '#dc2626' }]}>
                                    {formatCurrency(Math.max(0, (creditDetails.totalPayable || creditDetails.amount) - (creditDetails.totalPaid || 0)))}
                                </Text>
                            </View>
                        </View>
                    </View>
                ) : (
                    <View style={styles.generalSummaryCard}>
                        <View style={styles.generalSummaryRow}>
                            <View style={styles.generalSummaryBox}>
                                <Text style={styles.generalLabel}>Total Pago Confirmado</Text>
                                <Text style={styles.generalAmount}>{formatCurrency(stats.totalPaid)}</Text>
                            </View>
                            <View style={styles.generalStatCol}>
                                <View style={styles.miniStatItem}>
                                    <Text style={styles.miniStatNumber}>{stats.confirmedCount}</Text>
                                    <Text style={styles.miniStatText}>Confirmados</Text>
                                </View>
                                {stats.pendingCount > 0 && (
                                    <View style={[styles.miniStatItem, { backgroundColor: '#fef3c7' }]}>
                                        <Text style={[styles.miniStatNumber, { color: '#b45309' }]}>{stats.pendingCount}</Text>
                                        <Text style={[styles.miniStatText, { color: '#b45309' }]}>Em análise</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                )}
            </View>

            {/* Filtros de Status (Todos, Confirmados, Em Análise, Rejeitados) */}
            <View style={styles.statusFilterContainer}>
                <TouchableOpacity
                    style={[styles.statusFilterBtn, statusFilter === 'all' && styles.statusFilterBtnActive]}
                    onPress={() => setStatusFilter('all')}
                >
                    <Text style={[styles.statusFilterText, statusFilter === 'all' && styles.statusFilterTextActive]}>
                        Todos ({payments.length})
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.statusFilterBtn, statusFilter === 'confirmed' && styles.statusFilterBtnActive]}
                    onPress={() => setStatusFilter('confirmed')}
                >
                    <Text style={[styles.statusFilterText, statusFilter === 'confirmed' && styles.statusFilterTextActive]}>
                        Confirmados ({stats.confirmedCount})
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.statusFilterBtn, statusFilter === 'pending' && styles.statusFilterBtnActive]}
                    onPress={() => setStatusFilter('pending')}
                >
                    <Text style={[styles.statusFilterText, statusFilter === 'pending' && styles.statusFilterTextActive]}>
                        Em Análise ({stats.pendingCount})
                    </Text>
                </TouchableOpacity>

                {stats.rejectedCount > 0 && (
                    <TouchableOpacity
                        style={[styles.statusFilterBtn, statusFilter === 'rejected' && styles.statusFilterBtnActive]}
                        onPress={() => setStatusFilter('rejected')}
                    >
                        <Text style={[styles.statusFilterText, statusFilter === 'rejected' && styles.statusFilterTextActive]}>
                            Rejeitados ({stats.rejectedCount})
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Lista de Pagamentos */}
            <FlatList
                data={filteredPayments}
                keyExtractor={(item) => item._id}
                renderItem={renderPaymentItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconBox}>
                            <Receipt size={40} color="#94a3b8" />
                        </View>
                        <Text style={styles.emptyTitle}>Nenhum Pagamento Encontrado</Text>
                        <Text style={styles.emptySubtitle}>
                            {statusFilter !== 'all'
                                ? `Não existem pagamentos no estado "${statusFilter}".`
                                : selectedCreditId
                                ? 'Ainda não foram submetidos pagamentos para este empréstimo.'
                                : 'Ainda não registou pagamentos no sistema.'}
                        </Text>
                        {selectedCreditId && (
                            <TouchableOpacity
                                style={styles.emptyActionBtn}
                                onPress={() => navigation.navigate('CreditDetails', { creditId: selectedCreditId })}
                            >
                                <Text style={styles.emptyActionBtnText}>Voltar ao Empréstimo</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f8fafc'
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 8,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9'
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0f172a'
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 2
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        padding: 20
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500'
    },
    creditFilterContainer: {
        backgroundColor: '#fff',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0'
    },
    creditFilterScroll: {
        paddingHorizontal: 16,
        gap: 8
    },
    creditPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    creditPillActive: {
        backgroundColor: '#3b82f6',
        borderColor: '#2563eb'
    },
    creditPillText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#475569'
    },
    creditPillTextActive: {
        color: '#fff'
    },
    summaryContainer: {
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 6
    },
    creditSummaryCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        elevation: 2,
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    summaryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
    },
    summaryLoanNumber: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0f172a'
    },
    summaryDate: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2
    },
    statusMiniBadge: {
        backgroundColor: '#eff6ff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8
    },
    statusMiniText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#2563eb'
    },
    summaryStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8
    },
    statBox: {
        flex: 1,
        backgroundColor: '#f8fafc',
        padding: 10,
        borderRadius: 10,
        alignItems: 'center'
    },
    statLabel: {
        fontSize: 11,
        color: '#64748b',
        fontWeight: '500',
        marginBottom: 4
    },
    statValue: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0f172a'
    },
    generalSummaryCard: {
        backgroundColor: '#0f172a',
        borderRadius: 18,
        padding: 18,
        elevation: 3
    },
    generalSummaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    generalSummaryBox: {
        flex: 1
    },
    generalLabel: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '600'
    },
    generalAmount: {
        fontSize: 24,
        fontWeight: '800',
        color: '#34d399',
        marginTop: 4
    },
    generalStatCol: {
        flexDirection: 'row',
        gap: 8
    },
    miniStatItem: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        alignItems: 'center'
    },
    miniStatNumber: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700'
    },
    miniStatText: {
        color: '#cbd5e1',
        fontSize: 10,
        fontWeight: '500'
    },
    statusFilterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 8
    },
    statusFilterBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: '#e2e8f0'
    },
    statusFilterBtnActive: {
        backgroundColor: '#0f172a'
    },
    statusFilterText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#475569'
    },
    statusFilterTextActive: {
        color: '#fff'
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 40
    },
    paymentCard: {
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: '#edf2f7'
    },
    cardTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    cardHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    paymentIconBox: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: '#ecfdf5',
        justifyContent: 'center',
        alignItems: 'center'
    },
    paymentAmount: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0f172a'
    },
    paymentMethod: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700'
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginVertical: 12
    },
    cardInfoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        rowGap: 10
    },
    infoCol: {
        width: '50%'
    },
    infoLabel: {
        fontSize: 11,
        color: '#94a3b8',
        fontWeight: '500',
        marginBottom: 2
    },
    infoValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#334155'
    },
    rejectionBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef2f2',
        padding: 10,
        borderRadius: 10,
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#fecaca'
    },
    rejectionText: {
        fontSize: 12,
        color: '#b91c1c',
        fontWeight: '500',
        flex: 1
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 50,
        paddingHorizontal: 20
    },
    emptyIconBox: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 6
    },
    emptySubtitle: {
        fontSize: 13,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 20
    },
    emptyActionBtn: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12
    },
    emptyActionBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600'
    }
});
