import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    Alert
} from 'react-native';
import api from '../../services/api';

export default function CollectionsScreen() {
    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchCollections();
    }, []);

    const fetchCollections = async () => {
        try {
            // Em produção, este endpoint retornaria parcelas vencendo hoje/atrasadas
            const res = await api.get('/credits/overdue');
            setCollections(res.data.data.credits || []);
        } catch (error) {
            console.error('Error fetching collections:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterPayment = (loan) => {
        Alert.alert(
            'Registrar Pagamento',
            `Deseja registrar o pagamento de ${loan.client.name}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar',
                    onPress: async () => {
                        try {
                            // Chamar endpoint de pagamento
                            await api.post('/payments', {
                                creditId: loan._id,
                                amount: loan.amount / loan.term, // Exemplo: valor de uma parcela
                                paymentMethod: 'cash'
                            });
                            Alert.alert('Sucesso', 'Pagamento registrado');
                            fetchCollections();
                        } catch (e) {
                            Alert.alert('Erro', 'Falha ao registrar pagamento');
                        }
                    }
                }
            ]
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
                            <Text style={styles.loanInfo}>{item.amount.toLocaleString()} MT | {item.status}</Text>
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
