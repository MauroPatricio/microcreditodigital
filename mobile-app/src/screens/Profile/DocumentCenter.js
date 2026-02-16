import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, ActivityIndicator, Alert, Modal, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import api from '../../services/api';

const DocumentCenter = () => {
    const [documents, setDocuments] = useState([
        { type: 'identity_card', label: 'Bilhete de Identidade', status: 'pending', file: null, rejectionReason: null },
        { type: 'nuit', label: 'NUIT', status: 'pending', file: null, rejectionReason: null },
        { type: 'residence_proof', label: 'Comprovativo de Residência', status: 'pending', file: null, rejectionReason: null },
        { type: 'selfie', label: 'Selfie de Verificação', status: 'pending', file: null, rejectionReason: null },
    ]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [cameraVisible, setCameraVisible] = useState(false);
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef(null);

    useEffect(() => {
        fetchDocs();
    }, []);

    const fetchDocs = async () => {
        try {
            const res = await api.get('/auth/me'); // Ou rota específica de documentos
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
        if (!permission.granted) {
            const result = await requestPermission();
            if (!result.granted) return Alert.alert('Permissão', 'Acesso à câmera é necessário.');
        }
        setCameraVisible(true);
    };

    const captureSelfiePhoto = async () => {
        if (cameraRef.current) {
            const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
            const newDocs = [...documents];
            const selfieIndex = documents.findIndex(d => d.type === 'selfie');
            newDocs[selfieIndex].file = photo.uri;
            setDocuments(newDocs);
            setCameraVisible(false);
        }
    };

    const pickImage = async (index) => {
        if (documents[index].type === 'selfie') {
            return takeSelfie();
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
        });

        if (!result.canceled) {
            const newDocs = [...documents];
            newDocs[index].file = result.assets[0].uri;
            newDocs[index].status = 'pending'; // Reset status if picking new file
            setDocuments(newDocs);
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
                name: `doc_${doc.type}.jpg`,
                type: 'image/jpeg',
            });
            formData.append('type', doc.type);
            if (locationData) {
                formData.append('location', locationData);
            }

            // Rota atualizada para o próprio perfil do cliente
            await api.post('/clients/documents/me', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            Alert.alert('Sucesso', 'Documento enviado para análise!');
            fetchDocs(); // Recarregar statuses
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível enviar o documento.');
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
                                        <Image source={{ uri: doc.file }} style={styles.preview} />
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
        </ScrollView>
    );
};

const getStatusColor = (status, light = false) => {
    switch (status) {
        case 'verified': return light ? '#dcfce7' : '#10b981';
        case 'rejected': return light ? '#fee2e2' : '#ef4444';
        case 'uploaded': return light ? '#e0f2fe' : '#3b82f6';
        default: return light ? '#f1f5f9' : '#64748b';
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
    closeCamera: { alignSelf: 'flex-end', marginTop: 10 }
});

export default DocumentCenter;
