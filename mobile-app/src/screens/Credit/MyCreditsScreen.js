import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { creditService } from '../../services';

export default function MyCreditsScreen({ navigation }) {
    const [credits, setCredits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadCredits();
    }, []);

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

    const getStatusColor = (status) => {
        const colors = {
            pending: '#f59e0b',
            approved: '#3b82f6',
            active: '#10b981',
            paid: '#6b7280',
            rejected: '#ef4444',
            defaulted: '#dc2626',
        };
        return colors[status] || '#64748b';
    };

    const getStatusText = (status) => {
        const texts = {
            pending: 'Em Análise',
            approved: 'Aprovado',
            active: 'Ativo',
            paid: 'Pago',
            rejected: 'Rejeitado',
            defaulted: 'Inadimplente',
        };
        return texts[status] || status;
    };

    const renderCreditItem = ({ item }) => (
        <TouchableOpacity
            style={styles.c creditCard}
onPress = {() => navigation.navigate('CreditDetails', { creditId: item._id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardAmount}>{item.amount.toLocaleString('pt-MZ')} MT</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Prazo:</Text>
          <Text style={styles.detailValue}>{item.term} meses</Text>
        </View>

        {item.status === 'active' && (
          <>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total a Pagar:</Text>
              <Text style={styles.detailValue}>
                {item.totalPayable.toLocaleString('pt-MZ', {
                  minimumFractionDigits: 2,
                })} MT
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Pago:</Text>
              <Text style={[styles.detailValue, styles.paidValue]}>
                {(item.totalPaid || 0).toLocaleString('pt-MZ', {
                  minimumFractionDigits: 2,
                })} MT
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(((item.totalPaid || 0) / item.totalPayable) * 100, 100)}%`,
                  },
                ]}
              />
            </View>
          </>
        )}

        {item.status === 'pending' && (
          <Text style={styles.pendingText}>Aguardando aprovação...</Text>
        )}

        {item.status === 'rejected' && item.rejectionReason && (
          <Text style={styles.rejectionText}>Motivo: {item.rejectionReason}</Text>
        )}
      </View>

      <Text style={styles.cardDate}>
        Solicitado em {new Date(item.createdAt).toLocaleDateString('pt-MZ')}
      </Text>
    </TouchableOpacity >
  );

if (loading) {
    return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
        </View>
    );
}

if (credits.length === 0) {
    return (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>Nenhum Crédito</Text>
            <Text style={styles.emptyText}>
                Você ainda não solicitou nenhum crédito
            </Text>
            <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.navigate('CreditSimulator')}
            >
                <Text style={styles.emptyButtonText}>Simular Crédito</Text>
            </TouchableOpacity>
        </View>
    );
}

return (
    <View style={styles.container}>
        <FlatList
            data={credits}
            renderItem={renderCreditItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
    </View>
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
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        backgroundColor: '#f5f5f5',
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 24,
    },
    emptyButton: {
        backgroundColor: '#2563eb',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    emptyButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    listContent: {
        padding: 16,
    },
    creditCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardAmount: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    cardDetails: {
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    detailLabel: {
        fontSize: 14,
        color: '#64748b',
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
    },
    paidValue: {
        color: '#10b981',
    },
    progressBar: {
        height: 8,
        backgroundColor: '#e2e8f0',
        borderRadius: 4,
        marginTop: 8,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#10b981',
        borderRadius: 4,
    },
    pendingText: {
        fontSize: 14,
        color: '#f59e0b',
        fontStyle: 'italic',
        marginTop: 8,
    },
    rejectionText: {
        fontSize: 13,
        color: '#ef4444',
        marginTop: 8,
    },
    cardDate: {
        fontSize: 12,
        color: '#94a3b8',
    },
});
