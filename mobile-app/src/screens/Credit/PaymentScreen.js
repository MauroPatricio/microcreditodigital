import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { paymentService } from '../../services';
import { Upload, Camera, FileText } from 'lucide-react-native';
import { useAlert } from '../../context/AlertContext';

export default function PaymentScreen({ route, navigation }) {
    const { creditId, installmentId, amount } = route.params;
    const { showAlert } = useAlert();
    const [amountToPay, setAmountToPay] = useState(amount.toString());
    const [paymentMethod, setPaymentMethod] = useState('mpesa');
    const [loading, setLoading] = useState(false);
    
    // Na prática seria integrado com expo-image-picker
    const [receiptUri, setReceiptUri] = useState(null);

    const handleSelectReceipt = () => {
        // Mocking para o exercício: na vida real abre ImagePicker
        setReceiptUri('mock-image-uri.jpg');
        showAlert('Simulação', 'Comprovativo selecionado (Mock)');
    };

    const handleSubmit = async () => {
        if (!amountToPay) {
            showAlert('Erro', 'Por favor preencha o valor a pagar.');
            return;
        }

        setLoading(true);
        try {
            // Se receiptUri estivesse preenchido com ficheiro real, construiria o formData.
            // Para simplificar, vou mandar o payload como o serviço espera (o formData será feito no service se necessário).
            
            const formData = new FormData();
            formData.append('creditId', creditId);
            formData.append('installmentId', installmentId);
            formData.append('amount', amountToPay);
            formData.append('paymentMethod', paymentMethod);
            
            if (receiptUri) {
                formData.append('receipt', {
                    uri: receiptUri,
                    name: 'receipt.jpg',
                    type: 'image/jpeg'
                });
            }

            await paymentService.submitPayment(formData);
            
            showAlert('Sucesso', 'Comprovativo enviado com sucesso! Está em análise.', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            showAlert('Erro', 'Falha ao enviar comprovativo.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Submeter Comprovativo</Text>
                <Text style={styles.subtitle}>Envie os dados do seu pagamento para verificação.</Text>
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Valor Pago (MT)</Text>
                <TextInput
                    style={styles.input}
                    value={amountToPay}
                    onChangeText={setAmountToPay}
                    keyboardType="numeric"
                    placeholder="Ex: 5000"
                />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Método de Pagamento</Text>
                <View style={styles.methodContainer}>
                    <TouchableOpacity 
                        style={[styles.methodBtn, paymentMethod === 'mpesa' && styles.methodBtnActive]}
                        onPress={() => setPaymentMethod('mpesa')}
                    >
                        <Text style={[styles.methodText, paymentMethod === 'mpesa' && styles.methodTextActive]}>M-Pesa</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.methodBtn, paymentMethod === 'emola' && styles.methodBtnActive]}
                        onPress={() => setPaymentMethod('emola')}
                    >
                        <Text style={[styles.methodText, paymentMethod === 'emola' && styles.methodTextActive]}>e-Mola</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.methodBtn, paymentMethod === 'bank_transfer' && styles.methodBtnActive]}
                        onPress={() => setPaymentMethod('bank_transfer')}
                    >
                        <Text style={[styles.methodText, paymentMethod === 'bank_transfer' && styles.methodTextActive]}>Bancário</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Comprovativo (Opcional)</Text>
                <TouchableOpacity style={styles.uploadBtn} onPress={handleSelectReceipt}>
                    {receiptUri ? (
                        <View style={{alignItems: 'center'}}>
                            <FileText size={32} color="#10b981" />
                            <Text style={styles.uploadBtnText}>Comprovativo anexado</Text>
                        </View>
                    ) : (
                        <View style={{alignItems: 'center'}}>
                            <Upload size={32} color="#94a3b8" />
                            <Text style={styles.uploadBtnText}>Carregar Imagem/PDF</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <TouchableOpacity 
                style={styles.submitBtn} 
                onPress={handleSubmit} 
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.submitBtnText}>Enviar Pagamento</Text>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f7fb', padding: 20 },
    header: { marginBottom: 24 },
    title: { fontSize: 24, fontWeight: '800', color: '#1e293b' },
    subtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
    
    formGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
    input: { backgroundColor: '#fff', padding: 16, borderRadius: 16, fontSize: 16, color: '#1e293b', elevation: 1 },
    
    methodContainer: { flexDirection: 'row', gap: 10 },
    methodBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', elevation: 1, borderWidth: 1, borderColor: 'transparent' },
    methodBtnActive: { borderColor: '#3b82f6', backgroundColor: '#eff6ff' },
    methodText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
    methodTextActive: { color: '#3b82f6' },

    uploadBtn: { backgroundColor: '#fff', borderStyle: 'dashed', borderWidth: 2, borderColor: '#cbd5e1', padding: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    uploadBtnText: { marginTop: 12, fontSize: 14, color: '#64748b', fontWeight: '500' },

    submitBtn: { backgroundColor: '#3b82f6', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 10, marginBottom: 40 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});
