import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TextInput,
    Modal,
    Image
} from 'react-native';
import { CreditCard, Smartphone, CheckCircle, AlertCircle, Shield, Camera, Trash2, Plus, X, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { creditService } from '../../services';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function RequestCreditScreen({ route, navigation }) {
    const { user } = useAuth();
    const { amount, term, periodicity } = route.params || {};
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [disbursementMethod, setDisbursementMethod] = useState('mpesa');
    const [accountNumber, setAccountNumber] = useState(user?.phone || '');
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Collateral / Garantia States
    const [includeCollateral, setIncludeCollateral] = useState(false);
    const [collateralType, setCollateralType] = useState('vehicle');
    const [customType, setCustomType] = useState('');
    const [collateralDescription, setCollateralDescription] = useState('');
    const [collateralValue, setCollateralValue] = useState('');
    const [collateralPhotos, setCollateralPhotos] = useState([]);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    const collateralOptions = [
        { id: 'vehicle', label: 'Veículo' },
        { id: 'real_estate', label: 'Imóvel' },
        { id: 'guarantor', label: 'Fiador' },
        { id: 'equipment', label: 'Equipamento' },
        { id: 'other', label: 'Outro' },
    ];

    const handlePickCollateralPhoto = async () => {
        Alert.alert(
            'Foto da Garantia',
            'Como deseja adicionar a foto?',
            [
                {
                    text: 'Tirar Foto (Câmera)',
                    onPress: async () => {
                        try {
                            const permission = await ImagePicker.requestCameraPermissionsAsync();
                            if (!permission.granted) {
                                Alert.alert('Permissão Negada', 'É necessária permissão da câmera para tirar fotos.');
                                return;
                            }
                            const result = await ImagePicker.launchCameraAsync({
                                quality: 0.8,
                                allowsEditing: true,
                            });
                            if (!result.canceled && result.assets && result.assets[0]) {
                                uploadPhoto(result.assets[0]);
                            }
                        } catch (e) {
                            console.error('Camera Picker Error:', e);
                        }
                    }
                },
                {
                    text: 'Escolher da Galeria',
                    onPress: async () => {
                        try {
                            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
                            if (!permission.granted) {
                                Alert.alert('Permissão Negada', 'É necessária permissão da galeria para selecionar fotos.');
                                return;
                            }
                            const result = await ImagePicker.launchImageLibraryAsync({
                                mediaTypes: ImagePicker.MediaTypeOptions ? ImagePicker.MediaTypeOptions.Images : 'Images',
                                quality: 0.8,
                                allowsEditing: true,
                            });
                            if (!result.canceled && result.assets && result.assets[0]) {
                                uploadPhoto(result.assets[0]);
                            }
                        } catch (e) {
                            console.error('Library Picker Error:', e);
                        }
                    }
                },
                { text: 'Cancelar', style: 'cancel' }
            ]
        );
    };

    const uploadPhoto = async (asset) => {
        setUploadingPhoto(true);
        try {
            const res = await creditService.uploadCollateralPhoto(asset);
            if (res.success && res.photoUrl) {
                setCollateralPhotos(prev => [...prev, res.photoUrl]);
            } else {
                Alert.alert('Erro', res.message || 'Falha ao enviar foto da garantia.');
            }
        } catch (err) {
            console.error('Upload collateral photo error:', err.response?.data || err.message);
            Alert.alert('Erro', err.response?.data?.message || 'Falha ao carregar foto para o servidor.');
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleRemovePhoto = (index) => {
        setCollateralPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        setError(null);

        const numStr = String(accountNumber).trim();

        if (!numStr) {
            setError('Por favor, informe o número de conta ou telemóvel para receber o valor.');
            return;
        }

        // Validations for disbursement
        if (disbursementMethod === 'mpesa') {
            if (!numStr.startsWith('84') && !numStr.startsWith('85')) {
                setError('O número M-Pesa deve iniciar com 84 ou 85.');
                return;
            }
        } else if (disbursementMethod === 'emola') {
            if (!numStr.startsWith('86') && !numStr.startsWith('87')) {
                setError('O número e-Mola deve iniciar com 86 ou 87.');
                return;
            }
        } else if (disbursementMethod === 'bank_transfer') {
            if (numStr.startsWith('84') || numStr.startsWith('85') || numStr.startsWith('86') || numStr.startsWith('87')) {
                setError('Número de conta bancária inválido (não pode iniciar com 84, 85, 86 ou 87).');
                return;
            }
        }

        // Validations for Collateral
        if (includeCollateral) {
            if (collateralType === 'other' && !customType.trim()) {
                setError('Por favor, informe qual é a garantia no campo "Especificar Garantia".');
                return;
            }
        }

        setLoading(true);
        try {
            const collateralData = includeCollateral ? [{
                type: collateralType,
                customType: collateralType === 'other' ? customType.trim() : undefined,
                description: collateralDescription.trim(),
                value: parseFloat(collateralValue) || 0,
                photos: collateralPhotos
            }] : [];

            const data = {
                amount: amount,
                term: term,
                periodicity: periodicity || 'monthly',
                purpose: 'Empréstimo Pessoal',
                disbursementMethod: disbursementMethod,
                bankDetails: {
                    bankName: disbursementMethod,
                    accountNumber: numStr
                },
                collateral: collateralData
            };

            const res = await creditService.request(data);
            if (res.success) {
                setShowSuccessModal(true);
            } else {
                setError(res.message || 'Falha ao solicitar crédito.');
            }
        } catch (err) {
            console.error('Request Credit Error:', err.response?.data || err.message);
            setError(err.response?.data?.message || 'Falha na comunicação com o servidor.');
        } finally {
            setLoading(false);
        }
    };

    const PaymentOption = ({ id, title, icon, color }) => {
        const isActive = disbursementMethod === id;
        return (
            <TouchableOpacity
                style={[styles.paymentOption, isActive && { borderColor: color, backgroundColor: `${color}10` }]}
                onPress={() => {
                    setDisbursementMethod(id);
                    setError(null);
                }}
                activeOpacity={0.7}
            >
                <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
                    {icon}
                </View>
                <Text style={[styles.optionTitle, isActive && { color: color, fontWeight: '700' }]}>{title}</Text>
                {isActive && <CheckCircle size={20} color={color} style={styles.checkIcon} />}
            </TouchableOpacity>
        );
    };

    const getFullImageUrl = (photoUrl) => {
        if (!photoUrl) return '';
        if (photoUrl.startsWith('http')) return photoUrl;
        const apiBase = api.defaults.baseURL || 'http://localhost:4000/api';
        const serverBase = apiBase.replace('/api', '');
        return `${serverBase}${photoUrl}`;
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
        >
            <ScrollView
                style={styles.container}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: 150 }]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.pageHeader}>
                    <Text style={styles.pageTitle}>Confirmar Crédito</Text>
                    <Text style={styles.pageSubtitle}>Falta pouco! Escolha como prefere receber o seu dinheiro.</Text>
                </View>

                <View style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Valor Solicitado</Text>
                        <Text style={styles.summaryValueAmount}>{amount} MT</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Prazo de Pagamento</Text>
                        <Text style={styles.summaryValue}>{term} Meses</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Método de Recebimento</Text>

                    <PaymentOption
                        id="mpesa"
                        title="M-Pesa"
                        color="#ef4444"
                        icon={<Smartphone size={24} color="#ef4444" />}
                    />

                    <PaymentOption
                        id="emola"
                        title="E-mola"
                        color="#f59e0b"
                        icon={<Smartphone size={24} color="#f59e0b" />}
                    />

                    <PaymentOption
                        id="bank_transfer"
                        title="Cartão Visa / Bancário"
                        color="#3b82f6"
                        icon={<CreditCard size={24} color="#3b82f6" />}
                    />

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>
                            {disbursementMethod === 'bank_transfer' ? 'Número do Cartão / IBAN' : 'Número de Telemóvel'}
                        </Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder={disbursementMethod === 'bank_transfer' ? '0000 0000 0000 0000' : '840000000 ou 850000000'}
                                keyboardType={disbursementMethod === 'bank_transfer' ? 'default' : 'phone-pad'}
                                value={accountNumber}
                                onChangeText={(text) => {
                                    setAccountNumber(text);
                                    setError(null);
                                }}
                                placeholderTextColor="#94a3b8"
                            />
                        </View>
                    </View>
                </View>

                {/* Section: Collateral / Garantia */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Shield size={22} color="#2563eb" style={{ marginRight: 8 }} />
                            <Text style={styles.sectionTitle}>Garantia do Crédito</Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.toggleBtn, includeCollateral ? styles.toggleBtnActive : styles.toggleBtnInactive]}
                            onPress={() => setIncludeCollateral(!includeCollateral)}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.toggleBtnText, includeCollateral ? styles.toggleBtnTextActive : styles.toggleBtnTextInactive]}>
                                {includeCollateral ? 'Remover' : '+ Adicionar'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {includeCollateral && (
                        <View style={styles.collateralCard}>
                            <Text style={styles.inputLabel}>Tipo de Garantia</Text>
                            <View style={styles.typeGrid}>
                                {collateralOptions.map((opt) => {
                                    const isSelected = collateralType === opt.id;
                                    return (
                                        <TouchableOpacity
                                            key={opt.id}
                                            style={[styles.typeChip, isSelected && styles.typeChipSelected]}
                                            onPress={() => setCollateralType(opt.id)}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={[styles.typeChipText, isSelected && styles.typeChipTextSelected]}>
                                                {opt.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {collateralType === 'other' && (
                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputLabel}>Especificar Garantia *</Text>
                                    <View style={styles.inputWrapper}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Qual é a garantia?"
                                            value={customType}
                                            onChangeText={setCustomType}
                                            placeholderTextColor="#94a3b8"
                                        />
                                    </View>
                                </View>
                            )}

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Descrição da Garantia</Text>
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Detalhes (marca, modelo, estado, etc.)"
                                        value={collateralDescription}
                                        onChangeText={setCollateralDescription}
                                        placeholderTextColor="#94a3b8"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Valor Estimado (MT)</Text>
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Ex: 15000"
                                        keyboardType="numeric"
                                        value={collateralValue}
                                        onChangeText={setCollateralValue}
                                        placeholderTextColor="#94a3b8"
                                    />
                                </View>
                            </View>

                            {/* Collateral Photos */}
                            <View style={{ marginTop: 16 }}>
                                <Text style={styles.inputLabel}>Fotos da Garantia</Text>

                                <View style={styles.photoGrid}>
                                    {collateralPhotos.map((photoUrl, index) => (
                                        <View key={index} style={styles.photoItem}>
                                            <Image
                                                source={{ uri: getFullImageUrl(photoUrl) }}
                                                style={styles.photoThumb}
                                            />
                                            <TouchableOpacity
                                                style={styles.removePhotoBtn}
                                                onPress={() => handleRemovePhoto(index)}
                                            >
                                                <X size={12} color="#fff" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}

                                    <TouchableOpacity
                                        style={styles.addPhotoBtn}
                                        onPress={handlePickCollateralPhoto}
                                        disabled={uploadingPhoto}
                                        activeOpacity={0.7}
                                    >
                                        {uploadingPhoto ? (
                                            <ActivityIndicator size="small" color="#2563eb" />
                                        ) : (
                                            <>
                                                <Camera size={24} color="#2563eb" />
                                                <Text style={styles.addPhotoText}>+ Foto</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}
                </View>

                {error && (
                    <View style={styles.errorContainer}>
                        <AlertCircle size={20} color="#ef4444" style={styles.errorIcon} />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.submitButton, loading && { opacity: 0.7 }]}
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Confirmar e Solicitar Dinheiro</Text>}
                </TouchableOpacity>
            </ScrollView>

            {/* Premium Success Modal */}
            <Modal visible={showSuccessModal} animationType="fade" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.successModalCard}>
                        <View style={styles.successIconWrapper}>
                            <CheckCircle size={48} color="#10b981" />
                        </View>
                        <Text style={styles.modalTitle}>Pedido Enviado!</Text>
                        <Text style={styles.modalSubtitle}>
                            A sua solicitação de crédito foi enviada com sucesso e encontra-se em análise.
                        </Text>
                        <TouchableOpacity
                            style={styles.modalBtn}
                            activeOpacity={0.8}
                            onPress={() => {
                                setShowSuccessModal(false);
                                navigation.navigate('MainTabs', { screen: 'MyCredits' });
                            }}
                        >
                            <Text style={styles.modalBtnText}>Acompanhar Pedido</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f7fb' },
    scrollContent: { padding: 20, paddingBottom: 60, flexGrow: 1 },
    pageHeader: { marginBottom: 24, marginTop: 10 },
    pageTitle: { fontSize: 28, fontWeight: '800', color: '#1e293b', letterSpacing: -0.5 },
    pageSubtitle: { fontSize: 15, color: '#64748b', marginTop: 6, lineHeight: 22 },

    summaryCard: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 24,
        marginBottom: 32,
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 4,
    },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    summaryLabel: { fontSize: 15, color: '#64748b', fontWeight: '500' },
    summaryValueAmount: { fontSize: 24, fontWeight: '800', color: '#10b981' },
    summaryValue: { fontSize: 18, fontWeight: '700', color: '#334155' },
    summaryDivider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 16 },

    section: { marginBottom: 32 },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },

    toggleBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12 },
    toggleBtnInactive: { backgroundColor: '#e0e7ff' },
    toggleBtnActive: { backgroundColor: '#fef2f2' },
    toggleBtnText: { fontSize: 13, fontWeight: '700' },
    toggleBtnTextInactive: { color: '#2563eb' },
    toggleBtnTextActive: { color: '#ef4444' },

    collateralCard: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
    },

    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 },
    typeChip: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    typeChipSelected: {
        backgroundColor: '#2563eb',
        borderColor: '#2563eb',
    },
    typeChipText: { fontSize: 13, fontWeight: '600', color: '#475569' },
    typeChipTextSelected: { color: '#ffffff' },

    photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
    photoItem: { position: 'relative', width: 70, height: 70, borderRadius: 12, overflow: 'hidden' },
    photoThumb: { width: '100%', height: '100%', borderRadius: 12 },
    removePhotoBtn: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(239, 68, 68, 0.9)',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addPhotoBtn: {
        width: 70,
        height: 70,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#2563eb',
        borderStyle: 'dashed',
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addPhotoText: { fontSize: 11, fontWeight: '700', color: '#2563eb', marginTop: 2 },

    paymentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderWidth: 1.5,
        borderColor: '#f1f5f9',
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    optionTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: '#475569' },
    checkIcon: { marginLeft: 'auto' },

    inputContainer: { marginTop: 14 },
    inputLabel: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 6, marginLeft: 4 },
    inputWrapper: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 6,
        elevation: 1,
    },
    input: { padding: 14, fontSize: 15, fontWeight: '600', color: '#1e293b' },

    submitButton: {
        backgroundColor: '#2563eb',
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 6,
        marginTop: 8
    },
    submitBtnText: { color: '#ffffff', fontSize: 17, fontWeight: 'bold', letterSpacing: 0.5 },

    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fef2f2',
        borderWidth: 1,
        borderColor: '#fecaca',
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    errorIcon: { marginRight: 8 },
    errorText: { flex: 1, color: '#ef4444', fontSize: 14, fontWeight: '600' },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    successModalCard: {
        backgroundColor: '#ffffff',
        borderRadius: 28,
        padding: 32,
        width: '100%',
        maxWidth: 340,
        alignItems: 'center',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 30,
        elevation: 15,
    },
    successIconWrapper: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#dcfce7',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#1e293b',
        marginBottom: 12,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 15,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 28,
    },
    modalBtn: {
        backgroundColor: '#10b981',
        width: '100%',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    modalBtnText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '800',
    },
});
