import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import api from '../../services/api';

const ContractSigner = ({ route, navigation }) => {
    const { creditId, contractUrl } = route.params || {};
    const [signed, setSigned] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSign = async () => {
        setLoading(true);
        try {
            await api.post(`/credits/${creditId}/sign-contract`, {
                method: 'digital_confirmation',
                timestamp: new Date().toISOString()
            });
            setSigned(true);
            Alert.alert('Sucesso', 'Contrato assinado digitalmente!');
            setTimeout(() => navigation.goBack(), 1500);
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível processar a assinatura.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Assinatura Digital</Text>
                <Text style={styles.subtitle}>Leia atentamente o contrato antes de proceder com a assinatura.</Text>
            </View>

            <ScrollView style={styles.contractView} contentContainerStyle={styles.contractContent}>
                <Text style={styles.contractText}>
                    CONTRATO DE MÚTUO FINANCEIRO {"\n\n"}
                    Pelo presente instrumento, o MUTUÁRIO declara ter recebido da INSTITUIÇÃO o valor aprovado, obrigando-se a restituí-lo nas condições estabelecidas... {"\n\n"}
                    1. DO VALOR E ENCARGOS {"\n"}
                    O crédito concedido será acrescido de taxa de juros conforme acordado, incidindo sobre o saldo devedor... {"\n\n"}
                    2. DO PAGAMENTO {"\n"}
                    O pagamento será efetuado em parcelas mensais sucessivas... {"\n\n"}
                    3. DA ASSINATURA {"\n"}
                    Ao clicar em 'Assinar Agora', você confirma estar de acordo com todos os termos acima.
                </Text>
            </ScrollView>

            <View style={styles.footer}>
                <View style={styles.auditInfo}>
                    <Feather name="shield" size={14} color="#64748b" />
                    <Text style={styles.auditText}>Sua assinatura será vinculada ao seu IP e dispositivo.</Text>
                </View>

                <TouchableOpacity
                    style={[styles.signBtn, signed && styles.successBtn]}
                    onPress={handleSign}
                    disabled={loading || signed}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Text style={styles.signBtnText}>{signed ? 'ASSINADO' : 'ASSINAR AGORA'}</Text>
                            {!signed && <Feather name="edit-3" size={18} color="#fff" />}
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { padding: 24, backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    title: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
    subtitle: { fontSize: 13, color: '#64748b' },
    contractView: { flex: 1, padding: 20 },
    contractContent: { paddingBottom: 40 },
    contractText: { fontSize: 14, color: '#334155', lineHeight: 22 },
    footer: { padding: 24, borderTopWidth: 1, borderTopColor: '#f1f5f9', backgroundColor: '#fff' },
    auditInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16, alignSelf: 'center' },
    auditText: { fontSize: 11, color: '#64748b' },
    signBtn: { height: 56, backgroundColor: '#0f172a', borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    successBtn: { backgroundColor: '#10b981' },
    signBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
});

export default ContractSigner;
