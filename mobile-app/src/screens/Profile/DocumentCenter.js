import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, ActivityIndicator, Modal, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import api from '../../services/api';
import { useAlert } from '../../context/AlertContext';

const DocumentCenter = () => {
    const [documents, setDocuments] = useState([
        { type: 'identity_card', label: 'Bilhete de Identidade', status: 'pending', file: null, rejectionReason: null },
        { type: 'nuit', label: 'NUIT', status: 'pending', file: null, rejectionReason: null },
        { type: 'residence_proof', label: 'Comprovativo de Residência', status: 'pending', file: null, rejectionReason: null },
        { type: 'income_proof', label: 'Extrato Bancário (3 Meses)', status: 'pending', file: null, rejectionReason: null, isPdfAllowed: true },
        { type: 'selfie', label: 'Selfie de Verificação', status: 'pending', file: null, rejectionReason: null },
    ]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [cameraVisible, setCameraVisible] = useState(false);
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef(null);

    // Novo estado para o Modal de seleção premium
    const [pickerModalVisible, setPickerModalVisible] = useState(false);
    const [activeDocIndex, setActiveDocIndex] = useState(null);
    const { showAlert } = useAlert();

    useEffect(() => {
        fetchDocs();
    }, []);

    const fetchDocs = async () => {
        try {
            const res = await api.get('/auth/me'); 
            const userDocs = res.data.data.documents || [];

            const updatedDocs = documents.map(doc => {
                const found = userDocs.find(d => d.type === doc.type);
                if (found) {
                    return {
                        ...doc,
                        status: found.isVerified ? 'verified' : (found.rejectionReason ? 'rejected' : 'uploaded'),
                        rejectionReason: found.rejectionReason,
                        id: found._id
                    };
                }
                return doc;
            });
            setDocuments(updatedDocs);
        } catch (error) {
            console.error('Erro ao buscar documentos:', error);
        } finally {
            setFetching(false);
        }
    };

    const takeSelfie = async () => {
        if (!permission?.granted) {
            const result = await requestPermission();
            if (!result.granted) return showAlert('Permissão', 'Acesso à câmera é necessário.');
        }
        setCameraVisible(true);
    };

    const captureSelfiePhoto = async () => {
        if (cameraRef.current) {
            const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
            const newDocs = [...documents];
            const selfieIndex = documents.findIndex(d => d.type === 'selfie');
            newDocs[selfieIndex].file = photo.uri;
            newDocs[selfieIndex].fileName = 'selfie.jpg';
            newDocs[selfieIndex].mimeType = 'image/jpeg';
            setDocuments(newDocs);
            setCameraVisible(false);
        }
    };

    const pickImage = async (index) => {
        if (documents[index].type === 'selfie') {
            return takeSelfie();
        }

        if (documents[index].isPdfAllowed) {
            setActiveDocIndex(index);
            setPickerModalVisible(true);
        } else {
            openImagePicker(index);
        }
    };

    const openImagePicker = async (index) => {
        setPickerModalVisible(false);
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
        });

        if (!result.canceled) {
            const newDocs = [...documents];
            newDocs[index].file = result.assets[0].uri;
            newDocs[index].fileName = `doc_${newDocs[index].type}.jpg`;
            newDocs[index].mimeType = 'image/jpeg';
            newDocs[index].status = 'pending';
            setDocuments(newDocs);
        }
    };

    const openDocumentPicker = async (index) => {
        setPickerModalVisible(false);
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                const newDocs = [...documents];
                newDocs[index].file = asset.uri;
                newDocs[index].fileName = asset.name || `doc_${newDocs[index].type}.pdf`;
                newDocs[index].mimeType = asset.mimeType || 'application/pdf';
                newDocs[index].status = 'pending';
                setDocuments(newDocs);
            }
        } catch (error) {
            console.error('Erro ao escolher PDF:', error);
        }
    };

    const uploadDoc = async (doc, index) => {
        if (!doc.file) return;

        setLoading(true);
        try {
            // Capturar localização
            const { status } = await Location.requestForegroundPermissionsAsync();
            let locationData = null;
            if (status === 'granted') {
                const loc = await Location.getCurrentPositionAsync({});
                locationData = JSON.stringify({
                    lat: loc.coords.latitude,
                    lng: loc.coords.longitude,
                    accuracy: loc.coords.accuracy
                });
            }

            const formData = new FormData();
            formData.append('document', {
                uri: Platform.OS === 'ios' ? doc.file.replace('file://', '') : doc.file,
                name: doc.fileName || `doc_${doc.type}.jpg`,
                type: doc.mimeType || 'image/jpeg',
            });
            formData.append('type', doc.type);
            if (locationData) {
                formData.append('location', locationData);
            }

            await api.post('/clients/documents/me', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            showAlert('Sucesso', 'Documento enviado para análise!');
            fetchDocs(); // Recarregar statuses
        } catch (error) {
            showAlert('Erro', 'Não foi possível enviar o documento.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Centro de Documentação</Text>
                <Text style={styles.subtitle}>Gerencie os documentos para a aprovação do seu crédito premium.</Text>
            </View>

            <View style={styles.docList}>
                {documents.map((doc, index) => (
                    <View key={doc.type} style={[styles.docCard, doc.status === 'rejected' && styles.rejectedCard]}>
                        <View style={styles.docHeader}>
                            <View style={[styles.iconBox, { backgroundColor: getStatusColor(doc.status, true) }]}>
                                <Feather
                                    name={doc.type === 'selfie' ? 'user' : 'file-text'}
                                    size={20}
                                    color={getStatusColor(doc.status)}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.docLabel}>{doc.label}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(doc.status) }]} />
                                    <Text style={[styles.statusText, { color: getStatusColor(doc.status) }]}>
                                        {getStatusLabel(doc.status)}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {doc.status === 'rejected' && (
                            <View style={styles.rejectionBox}>
                                <Feather name="alert-circle" size={14} color="#ef4444" />
                                <Text style={styles.rejectionText}>{doc.rejectionReason || 'Documento ilegível ou inválido.'}</Text>
                            </View>
                        )}

                        {doc.file || doc.status === 'uploaded' || doc.status === 'verified' || doc.status === 'rejected' ? (
                            <View style={styles.actionArea}>
                                {doc.file && (
                                    <View style={styles.previewBox}>
                                        {doc.mimeType === 'application/pdf' ? (
                                            <View style={[styles.preview, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#e2e8f0' }]}>
                                                <Feather name="file-text" size={28} color="#64748b" />
                                            </View>
                                        ) : (
                                            <Image source={{ uri: doc.file }} style={styles.preview} />
                                        )}
                                        <TouchableOpacity onPress={() => uploadDoc(doc, index)} disabled={loading} style={styles.uploadBtn}>
                                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Enviar Novo</Text>}
                                        </TouchableOpacity>
                                    </View>
                                )}
                                {(doc.status === 'rejected' && !doc.file) && (
                                    <TouchableOpacity onPress={() => pickImage(index)} style={styles.rePickBtn}>
                                        <Feather name="refresh-cw" size={16} color="#fff" />
                                        <Text style={styles.btnText}>Corrigir e Reenviar</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ) : (
                            <TouchableOpacity onPress={() => pickImage(index)} style={styles.pickBtn}>
                                <Feather name={doc.type === 'selfie' ? 'camera' : 'upload-cloud'} size={18} color="#3b82f6" />
                                <Text style={styles.pickText}>{doc.type === 'selfie' ? 'Tirar Selfie' : 'Carregar Documento'}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ))}
            </View>

            {/* Selfie Camera Modal */}
            <Modal visible={cameraVisible} animationType="slide">
                <CameraView style={{ flex: 1 }} facing="front" ref={cameraRef}>
                    <View style={styles.cameraOverlay}>
                        <TouchableOpacity onPress={() => setCameraVisible(false)} style={styles.closeCamera}>
                            <Feather name="x" size={28} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.faceGuide} />
                        <View style={styles.cameraControls}>
                            <TouchableOpacity onPress={captureSelfiePhoto} style={styles.captureBtn}>
                                <View style={styles.captureBtnInner} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </CameraView>
            </Modal>

            {/* Premium File Type Picker Modal */}
            <Modal visible={pickerModalVisible} animationType="fade" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.premiumModalCard}>
                        <View style={styles.modalHeaderRow}>
                            <Text style={styles.modalTitle}>Tipo de Ficheiro</Text>
                            <TouchableOpacity onPress={() => setPickerModalVisible(false)} style={styles.modalCloseBtn}>
                                <Feather name="x" size={24} color="#94a3b8" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.modalSubtitle}>Como pretende carregar este documento?</Text>
                        
                        <View style={styles.modalOptionsContainer}>
                            <TouchableOpacity 
                                style={[styles.premiumOptionCard, { borderColor: '#3b82f6', backgroundColor: '#eff6ff' }]} 
                                onPress={() => openImagePicker(activeDocIndex)}
                                activeOpacity={0.8}
                            >
                                <View style={[styles.optionIconWrapper, { backgroundColor: '#dbeafe' }]}>
                                    <Feather name="image" size={24} color="#3b82f6" />
                                </View>
                                <View style={styles.optionTextContainer}>
                                    <Text style={[styles.optionTitle, { color: '#1d4ed8' }]}>Fotografia</Text>
                                    <Text style={styles.optionDescription}>Escolha uma imagem da sua galeria.</Text>
                                </View>
                                <Feather name="chevron-right" size={20} color="#3b82f6" />
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[styles.premiumOptionCard, { borderColor: '#10b981', backgroundColor: '#f0fdf4', marginTop: 14 }]} 
                                onPress={() => openDocumentPicker(activeDocIndex)}
                                activeOpacity={0.8}
                            >
                                <View style={[styles.optionIconWrapper, { backgroundColor: '#dcfce7' }]}>
                                    <Feather name="file-text" size={24} color="#10b981" />
                                </View>
                                <View style={styles.optionTextContainer}>
                                    <Text style={[styles.optionTitle, { color: '#047857' }]}>Documento PDF</Text>
                                    <Text style={styles.optionDescription}>Selecione um ficheiro PDF do seu telemóvel.</Text>
                                </View>
                                <Feather name="chevron-right" size={20} color="#10b981" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};

const getStatusColor = (status, light = false) => {
    switch (status) {
        case 'verified': return light ? '#d1fae5' : '#059669'; // Darker green
        case 'rejected': return light ? '#fee2e2' : '#b91c1c'; // Darker red
        case 'uploaded': return light ? '#dcfce7' : '#10b981'; // Green
        default: return light ? '#fee2e2' : '#ef4444'; // Red for pending
    }
};

const getStatusLabel = (status) => {
    switch (status) {
        case 'verified': return 'Aprovado';
        case 'rejected': return 'Rejeitado';
        case 'uploaded': return 'Em Análise';
        default: return 'Pendente';
    }
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fcfcfc' },
    header: { padding: 28, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    title: { fontSize: 26, fontWeight: '900', color: '#0f172a', marginBottom: 6 },
    subtitle: { fontSize: 14, color: '#64748b', lineHeight: 20 },
    docList: { padding: 20 },
    docHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
    docCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 24,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 3
    },
    rejectedCard: { borderColor: '#fee2e2', backgroundColor: '#fffafb' },
    iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    docLabel: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusText: { fontSize: 13, fontWeight: '600' },
    rejectionBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#fff1f2',
        padding: 12,
        borderRadius: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#fecdd3'
    },
    rejectionText: { color: '#be123c', fontSize: 13, fontWeight: '600', flex: 1 },
    pickBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 16,
        borderRadius: 16,
        borderStyle: 'dashed',
        borderWidth: 1.5,
        borderColor: '#3b82f6',
        backgroundColor: '#eff6ff'
    },
    rePickBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 16,
        borderRadius: 16,
        backgroundColor: '#ef4444',
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8
    },
    pickText: { color: '#3b82f6', fontWeight: '800', fontSize: 15 },
    actionArea: { marginTop: 4 },
    previewBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f8fafc',
        padding: 12,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    preview: { width: 68, height: 68, borderRadius: 14 },
    uploadBtn: {
        backgroundColor: '#3b82f6',
        paddingVertical: 12,
        paddingHorizontal: 22,
        borderRadius: 14,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8
    },
    btnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
    cameraOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'space-between', alignItems: 'center', padding: 40 },
    faceGuide: {
        width: 280,
        height: 380,
        borderWidth: 2,
        borderColor: '#fff',
        borderRadius: 140,
        borderStyle: 'dashed',
        marginTop: 40
    },
    cameraControls: { width: '100%', alignItems: 'center', marginBottom: 20 },
    captureBtn: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#fff'
    },
    captureBtnInner: { width: 66, height: 66, borderRadius: 33, backgroundColor: '#fff' },
    closeCamera: { alignSelf: 'flex-end', marginTop: 10 },
    
    // Modal premium styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        justifyContent: 'flex-end',
    },
    premiumModalCard: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 28,
        paddingBottom: Platform.OS === 'ios' ? 40 : 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    modalHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#1e293b',
        letterSpacing: -0.5,
    },
    modalCloseBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalSubtitle: {
        fontSize: 15,
        color: '#64748b',
        marginBottom: 24,
        lineHeight: 22,
    },
    modalOptionsContainer: {
        width: '100%',
    },
    premiumOptionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 20,
        borderWidth: 2,
    },
    optionIconWrapper: {
        width: 52,
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    optionTextContainer: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 17,
        fontWeight: '800',
        marginBottom: 4,
    },
    optionDescription: {
        fontSize: 13,
        color: '#64748b',
    },
});

export default DocumentCenter;
