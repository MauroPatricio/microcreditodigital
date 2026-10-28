import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    TextInput
} from 'react-native';
import api from '../../services/api';
import { useAlert } from '../../context/AlertContext';

export default function CollectionsScreen() {
    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { showAlert } = useAlert();

    useEffect(() => {
        fetchCollections();
    }, []);

    const fetchCollections = async () => {
        try {
            // Créditos com prestações vencidas ou a vencer hoje
            const res = await api.get('/credits/overdue');
            setCollections(res.data.data.credits || []);
        } catch (error) {
            console.error('Error fetching collections:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterPayment = (loan) => {
        showAlert(
            'Registrar Pagamento',
            `Deseja registrar o pagamento de ${(loan.amountDue || 0).toLocaleString()} MT de ${loan.client?.name}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar',
                    onPress: async () => {
                        try {
                            // Chamar endpoint de pagamento
                            await api.post('/payments', {
                                creditId: loan._id,
                                installmentId: loan.nextInstallmentId,
                                amount: loan.amountDue ?? (loan.amount / loan.term),
                                paymentMethod: 'cash'
                            });
                            showAlert('Sucesso', 'Pagamento registrado');
                            fetchCollections();
                        } catch (e) {
                            showAlert('Erro', 'Falha ao registrar pagamento');
                        }
                    }
                }
            ],
            'warning'
        );
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>;

    return (
        <View style={styles.container}>
            <View style={styles.searchBar}>
                <TextInput
                    style={styles.input}
                    placeholder="Buscar cliente..."
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                />
            </View>

            <FlatList
                data={collections}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View>
                            <Text style={styles.clientName}>{item.client?.name}</Text>
                            <Text style={styles.loanInfo}>Em dívida: {(item.amountDue || 0).toLocaleString()} MT</Text>
                            <Text style={styles.loanInfo}>{item.overdueInstallments || 0} prestação(ões) | {item.daysPastDue || 0} dia(s) de atraso</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.payButton}
                            onPress={() => handleRegisterPayment(item)}
                        >
                            <Text style={styles.payButtonText}>Receber</Text>
                        </TouchableOpacity>
                    </View>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma cobrança pendente para hoje.</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5', padding: 15 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    searchBar: { marginBottom: 15 },
    input: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
    card: {
        backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4
    },
    clientName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
    loanInfo: { fontSize: 13, color: '#64748b', marginTop: 4 },
    payButton: { backgroundColor: '#2563eb', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 6 },
    payButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    emptyText: { textAlign: 'center', marginTop: 50, color: '#94a3b8' }
});
