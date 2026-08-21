import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ScrollView,
    Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import { FileText, LogOut, Trash2, PenTool, ChevronRight, ShieldAlert, Building2 } from 'lucide-react-native';

export default function ProfileScreen({ navigation }) {
    const { user, logout, deleteAccount } = useAuth();
    const { showAlert } = useAlert();
    const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);

    const handleLogout = () => {
        showAlert(
            'Terminar Sessão',
            'Tem a certeza que deseja sair da sua conta?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Sair', style: 'destructive', onPress: logout }
            ],
            'warning'
        );
    };

    const handleDeleteAccount = () => {
        setDeleteModalVisible(true);
    };

    const ProfileOption = ({ icon, title, subtitle, onPress, destructive }) => (
        <TouchableOpacity 
            style={styles.optionBtn} 
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[styles.iconBox, destructive && { backgroundColor: '#fee2e2' }]}>
                {icon}
            </View>
            <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, destructive && { color: '#ef4444' }]}>{title}</Text>
                {subtitle && <Text style={styles.optionSubtitle}>{subtitle}</Text>}
            </View>
            <ChevronRight size={20} color={destructive ? '#ef4444' : '#cbd5e1'} />
        </TouchableOpacity>
    );

    const institutionName = user?.activeInstitution?.name || user?.institution?.name || 'Sem Instituição';

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Meu Perfil</Text>
                </View>

                <View style={styles.profileCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </Text>
                    </View>
                    <Text style={styles.userName}>{user?.name || 'Utilizador'}</Text>
                    
                    <View style={styles.institutionContainer}>
                        <Text style={styles.institutionText}>{institutionName}</Text>
                    </View>

                    <Text style={styles.userContact}>{user?.email || 'Sem email'}</Text>
                    <Text style={styles.userContact}>{user?.phone || 'Sem telefone'}</Text>
                    
                    <View style={styles.badgeContainer}>
                        <ShieldAlert size={14} color="#10b981" />
                        <Text style={styles.badgeText}>Conta Verificada</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Gestão e Documentos</Text>
                    
                    <ProfileOption 
                        icon={<FileText size={22} color="#3b82f6" />}
                        title="Centro de Documentos"
                        subtitle="Gerir BI, NUIT, Comprovativos"
                        onPress={() => navigation.navigate('DocumentCenter')}
                    />
                    
                    <ProfileOption 
                        icon={<PenTool size={22} color="#8b5cf6" />}
                        title="Assinar Contrato"
                        subtitle="Ver contratos pendentes"
                        onPress={() => navigation.navigate('ContractSigner')}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Opções de Conta</Text>
                    
                    <ProfileOption 
                        icon={<LogOut size={22} color="#64748b" />}
                        title="Terminar Sessão"
                        onPress={handleLogout}
                    />
                    
                    <ProfileOption 
                        icon={<Trash2 size={22} color="#ef4444" />}
                        title="Apagar Conta"
                        subtitle="Desativar conta permanentemente"
                        destructive={true}
                        onPress={handleDeleteAccount}
                    />
                </View>

            </ScrollView>

            <Modal
                visible={isDeleteModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setDeleteModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalIconBox}>
                            <Trash2 size={36} color="#ef4444" />
                        </View>
                        <Text style={styles.modalTitle}>Apagar Conta</Text>
                        <Text style={styles.modalText}>
                            Esta ação irá desativar a sua conta permanentemente e todos os seus dados serão removidos.
                        </Text>
                        <Text style={styles.modalTextBold}>
                            Deseja mesmo continuar? Ação irreversível.
                        </Text>
                        
                        <View style={styles.modalActions}>
                            <TouchableOpacity 
                                style={styles.modalBtnCancel} 
                                onPress={() => setDeleteModalVisible(false)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={styles.modalBtnDelete} 
                                onPress={() => {
                                    setDeleteModalVisible(false);
                                    deleteAccount();
                                }}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.modalBtnDeleteText}>Sim, Apagar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f4f7fb' },
    container: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 100 },
    
    header: { marginBottom: 24, marginTop: 10 },
    headerTitle: { fontSize: 28, fontWeight: '800', color: '#1e293b', letterSpacing: -0.5 },
    
    profileCard: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 30,
        alignItems: 'center',
        marginBottom: 32,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 5,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 4,
    },
    avatarText: { fontSize: 32, fontWeight: '800', color: '#ffffff' },
    userName: { fontSize: 22, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
    institutionContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    institutionIcon: { marginRight: 4 },
    institutionText: { fontSize: 15, fontWeight: '600', color: '#64748b' },
    userContact: { fontSize: 14, color: '#64748b', marginBottom: 2 },
    badgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#d1fae5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginTop: 12,
    },
    badgeText: { color: '#10b981', fontSize: 12, fontWeight: '700', marginLeft: 4 },
    
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#475569', marginBottom: 12, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
    
    optionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 8,
        elevation: 1,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    optionTextContainer: { flex: 1 },
    optionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 2 },
    optionSubtitle: { fontSize: 13, color: '#94a3b8' },
    
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderRadius: 28,
        padding: 32,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 24 },
        shadowOpacity: 0.15,
        shadowRadius: 32,
        elevation: 10,
    },
    modalIconBox: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#fef2f2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    modalText: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 12,
        lineHeight: 24,
    },
    modalTextBold: {
        fontSize: 15,
        color: '#ef4444',
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 36,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    modalBtnCancel: {
        flex: 1,
        backgroundColor: '#f1f5f9',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
    },
    modalBtnCancelText: {
        color: '#475569',
        fontSize: 16,
        fontWeight: '700',
    },
    modalBtnDelete: {
        flex: 1,
        backgroundColor: '#ef4444',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 5,
    },
    modalBtnDeleteText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
});
