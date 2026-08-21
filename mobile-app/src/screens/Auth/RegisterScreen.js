import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
    Modal,
    FlatList,
    TextInput,
    Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { User, Mail, Phone, Calendar, Lock, FileText, Building, Search, X, ChevronRight, AlertCircle, CheckCircle, Wallet } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { clientService, institutionService } from '../../services';
import PremiumInput from '../../components/PremiumInput';
import PremiumButton from '../../components/PremiumButton';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, typography, borderRadius } from '../../theme/typography';

export default function RegisterScreen({ navigation }) {
    const { user, register } = useAuth();
    const { colors } = useTheme();
    const isAgent = user?.role === 'agent';

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        identityDocument: '',
        dateOfBirth: '',
        institutionId: null,
        company: '',
        role: '',
        salary: '',
        referenceName: '',
        referencePhone: '',
        isPublicServant: false,
        guarantorName: '',
        guarantorDocument: '',
        guarantorPhone: ''
    });
    const [loading, setLoading] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    
    // Institution selection state
    const [institutions, setInstitutions] = useState([]);
    const [filteredInstitutions, setFilteredInstitutions] = useState([]);
    const [showInstitutionModal, setShowInstitutionModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedInstitutionName, setSelectedInstitutionName] = useState('');
    const [loadingInstitutions, setLoadingInstitutions] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    React.useEffect(() => {
        if (!isAgent) {
            loadInstitutions();
        }
    }, [isAgent]);

    const loadInstitutions = async () => {
        try {
            setLoadingInstitutions(true);
            const res = await institutionService.getPublicInstitutions();
            if (res?.success) {
                setInstitutions(res.data);
                setFilteredInstitutions(res.data);
            }
        } catch (error) {
            console.error('Error loading institutions:', error);
        } finally {
            setLoadingInstitutions(false);
        }
    };

    const handleSearch = (text) => {
        setSearchQuery(text);
        if (text) {
            const filtered = institutions.filter(inst => 
                inst.name.toLowerCase().includes(text.toLowerCase())
            );
            setFilteredInstitutions(filtered);
        } else {
            setFilteredInstitutions(institutions);
        }
    };

    const selectInstitution = (institution) => {
        handleChange('institutionId', institution._id);
        setSelectedInstitutionName(institution.name);
        setShowInstitutionModal(false);
        setSearchQuery('');
        setFilteredInstitutions(institutions);
    };

    const handleChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };

    const togglePublicServant = () => {
        setFormData({ ...formData, isPublicServant: !formData.isPublicServant });
    };

    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            handleChange('dateOfBirth', selectedDate);
        }
    };

    const displayDate = (date) => {
        if (!date) return '';
        return date.toLocaleDateString('pt-PT');
    };

    const handleRegister = async () => {
        setErrorMsg('');
        setSuccessMsg('');
        
        // Validation
        if (!formData.name || !formData.phone || (!isAgent && !formData.password)) {
            setErrorMsg('Por favor, preencha todos os campos obrigatórios (Nome, Telefone, Senha)');
            return;
        }

        if (!isAgent && formData.password !== formData.confirmPassword) {
            setErrorMsg('As senhas não coincidem');
            return;
        }

        if (!isAgent && !formData.institutionId) {
            setErrorMsg('Por favor, selecione uma instituição (empresa/escola)');
            return;
        }

        if (!formData.guarantorName || !formData.guarantorDocument || !formData.guarantorPhone) {
            setErrorMsg('Os dados do garante são obrigatórios');
            return;
        }

        if (formData.isPublicServant && !formData.company) {
            setErrorMsg('Por favor, informe a instituição pública onde trabalha');
            return;
        }

        setLoading(true);
        try {
            const professionalInfo = {
                employmentStatus: formData.isPublicServant ? 'civil_servant' : 'employed',
                employer: formData.company,
                profession: formData.role,
                monthlyIncome: formData.salary ? parseFloat(formData.salary) : 0
            };
            const references = formData.referenceName ? [{
                name: formData.referenceName,
                phone: formData.referencePhone,
                relationship: 'Amigo/Colega',
                hasConsent: true
            }] : [];
            
            const guarantor = {
                name: formData.guarantorName,
                documentNumber: formData.guarantorDocument,
                phone: formData.guarantorPhone,
                relationship: 'Outro'
            };

            let result;
            if (isAgent) {
                result = await clientService.create({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    identityDocument: formData.identityDocument,
                    dateOfBirth: formData.dateOfBirth ? formData.dateOfBirth.toISOString() : '1990-01-01',
                    password: formData.password || '123456',
                    professionalInfo,
                    references,
                    guarantor
                });
                
                if (result.data?.success) {
                    setSuccessMsg('Cliente registrado com sucesso');
                    setTimeout(() => navigation.goBack(), 1500);
                } else {
                    setErrorMsg('Falha ao registrar cliente');
                }
            } else {
                const registerData = {
                    ...formData,
                    dateOfBirth: formData.dateOfBirth ? formData.dateOfBirth.toISOString() : undefined,
                    professionalInfo,
                    references,
                    guarantor
                };
                result = await register(registerData);
                
                if (result.success) {
                    setSuccessMsg('Conta criada com sucesso');
                } else {
                    setErrorMsg(result.message);
                }
            }
        } catch (error) {
            setLoading(false);
            
            let errorMessage = 'Falha na comunicação com o servidor';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.data?.error && typeof error.response.data.error === 'string') {
                errorMessage = error.response.data.error;
            } else if (error.response?.data?.errors && error.response.data.errors.length > 0) {
                errorMessage = error.response.data.errors[0].msg;
            }
            
            setErrorMsg(errorMessage);
        }
        setLoading(false);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.primary }]}>{isAgent ? 'Novo Cliente' : 'Criar Conta'}</Text>
                    <Text style={[styles.subtitle, { color: colors.text.secondary }]}>Preencha os dados para começar</Text>
                </View>

                <View style={[styles.form, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
                    
                    {errorMsg ? (
                        <View style={[styles.errorContainer, { backgroundColor: `${colors.status.error}15`, borderColor: colors.status.error }]}>
                            <AlertCircle color={colors.status.error} size={20} style={{ marginRight: spacing.sm }} />
                            <Text style={[styles.errorText, { color: colors.status.error }]}>{errorMsg}</Text>
                        </View>
                    ) : null}

                    {successMsg ? (
                        <View style={[styles.errorContainer, { backgroundColor: `${colors.status.success}15`, borderColor: colors.status.success }]}>
                            <CheckCircle color={colors.status.success} size={20} style={{ marginRight: spacing.sm }} />
                            <Text style={[styles.errorText, { color: colors.status.success }]}>{successMsg}</Text>
                        </View>
                    ) : null}

                    <PremiumInput
                        label="Nome Completo *"
                        placeholder="João Silva"
                        value={formData.name}
                        onChangeText={(value) => handleChange('name', value)}
                        autoCapitalize="words"
                        icon={User}
                    />

                    {!isAgent && (
                        <View style={styles.datePickerContainer}>
                            <Text style={[styles.label, { color: colors.text.secondary }]}>Instituição *</Text>
                            <TouchableOpacity
                                style={[styles.datePickerBox, { backgroundColor: colors.background, borderColor: colors.border }]}
                                onPress={() => setShowInstitutionModal(true)}
                            >
                                <Building color={colors.text.muted} size={20} style={{ marginRight: spacing.sm }} />
                                <Text style={{ flex: 1, color: selectedInstitutionName ? colors.text.primary : colors.text.muted }} numberOfLines={1}>
                                    {selectedInstitutionName || 'Selecione a instituição'}
                                </Text>
                                <ChevronRight color={colors.text.muted} size={20} />
                            </TouchableOpacity>
                        </View>
                    )}

                    <PremiumInput
                        label="Email"
                        placeholder="seu@email.com"
                        value={formData.email}
                        onChangeText={(value) => handleChange('email', value)}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        icon={Mail}
                    />

                    <PremiumInput
                        label="Telefone *"
                        placeholder="841234567"
                        value={formData.phone}
                        onChangeText={(value) => handleChange('phone', value)}
                        keyboardType="phone-pad"
                        icon={Phone}
                    />

                    <PremiumInput
                        label="Número do BI"
                        placeholder="123456789BI"
                        value={formData.identityDocument}
                        onChangeText={(value) => handleChange('identityDocument', value)}
                        icon={FileText}
                    />

                    <View style={styles.datePickerContainer}>
                        <Text style={[styles.label, { color: colors.text.secondary }]}>Data de Nascimento</Text>
                        <TouchableOpacity
                            style={[styles.datePickerBox, { backgroundColor: colors.background, borderColor: colors.border }]}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Calendar color={colors.text.muted} size={20} style={{ marginRight: spacing.sm }} />
                            <Text style={{ color: formData.dateOfBirth ? colors.text.primary : colors.text.muted }}>
                                {formData.dateOfBirth ? displayDate(formData.dateOfBirth) : 'DD/MM/AAAA'}
                            </Text>
                        </TouchableOpacity>
                        
                        {showDatePicker && (
                            <DateTimePicker
                                value={formData.dateOfBirth || new Date()}
                                mode="date"
                                display="default"
                                onChange={handleDateChange}
                                maximumDate={new Date()}
                            />
                        )}
                    </View>

                    <View style={styles.switchContainer}>
                        <Text style={[styles.switchLabel, { color: colors.text.primary }]}>É Funcionário Público?</Text>
                        <Switch
                            value={formData.isPublicServant}
                            onValueChange={togglePublicServant}
                            trackColor={{ false: '#cbd5e1', true: colors.primary }}
                            thumbColor="#ffffff"
                        />
                    </View>

                    {formData.isPublicServant ? (
                        <PremiumInput
                            label="Instituição / Ministério onde trabalha *"
                            placeholder="Ex: Ministério da Saúde"
                            value={formData.company}
                            onChangeText={(value) => handleChange('company', value)}
                            icon={Building}
                        />
                    ) : (
                        <PremiumInput
                            label="Empresa / Instituição (Opcional)"
                            placeholder="Ex: Empresa Privada Lda"
                            value={formData.company}
                            onChangeText={(value) => handleChange('company', value)}
                            icon={Building}
                        />
                    )}

                    <PremiumInput
                        label="Profissão / Cargo (Opcional)"
                        placeholder="Ex: Professor"
                        value={formData.role}
                        onChangeText={(value) => handleChange('role', value)}
                        icon={FileText}
                    />

                    <PremiumInput
                        label="Rendimento Mensal (Opcional)"
                        placeholder="Ex: 25000"
                        value={formData.salary}
                        onChangeText={(value) => handleChange('salary', value)}
                        keyboardType="numeric"
                        icon={Wallet}
                    />

                    <Text style={[styles.sectionTitle, { color: colors.primary, marginTop: spacing.md, marginBottom: spacing.sm, fontFamily: typography.family.bold }]}>Pessoa de Referência (Opcional)</Text>
                    
                    <PremiumInput
                        label="Nome da Referência"
                        placeholder="Nome completo"
                        value={formData.referenceName}
                        onChangeText={(value) => handleChange('referenceName', value)}
                        icon={User}
                    />

                    <PremiumInput
                        label="Telefone da Referência"
                        placeholder="Ex: 841112223"
                        value={formData.referencePhone}
                        onChangeText={(value) => handleChange('referencePhone', value)}
                        keyboardType="phone-pad"
                        icon={Phone}
                    />

                    <Text style={[styles.sectionTitle, { color: colors.primary, marginTop: spacing.md, marginBottom: spacing.sm, fontFamily: typography.family.bold }]}>Dados do Garante *</Text>
                    
                    <PremiumInput
                        label="Nome do Garante *"
                        placeholder="Nome completo do garante"
                        value={formData.guarantorName}
                        onChangeText={(value) => handleChange('guarantorName', value)}
                        icon={User}
                    />

                    <PremiumInput
                        label="Número de BI do Garante *"
                        placeholder="Ex: 123456789BI"
                        value={formData.guarantorDocument}
                        onChangeText={(value) => handleChange('guarantorDocument', value)}
                        icon={FileText}
                    />
                    
                    <PremiumInput
                        label="Telemóvel do Garante *"
                        placeholder="Ex: 841234567"
                        value={formData.guarantorPhone}
                        onChangeText={(value) => handleChange('guarantorPhone', value)}
                        keyboardType="phone-pad"
                        icon={Phone}
                    />

                    {!isAgent && (
                        <>
                            <PremiumInput
                                label="Senha *"
                                placeholder="Mínimo 6 caracteres"
                                value={formData.password}
                                onChangeText={(value) => handleChange('password', value)}
                                isPassword={true}
                                icon={Lock}
                            />

                            <PremiumInput
                                label="Confirmar Senha *"
                                placeholder="Repita sua senha"
                                value={formData.confirmPassword}
                                onChangeText={(value) => handleChange('confirmPassword', value)}
                                isPassword={true}
                                icon={Lock}
                            />
                        </>
                    )}

                    <View style={styles.buttonContainer}>
                        <PremiumButton
                            title={isAgent ? 'Registrar Cliente' : 'Criar Conta'}
                            onPress={handleRegister}
                            loading={loading}
                        />
                    </View>

                    {!isAgent && (
                        <TouchableOpacity
                            style={styles.linkButton}
                            onPress={() => navigation.navigate('Login')}
                        >
                            <Text style={[styles.linkText, { color: colors.text.secondary }]}>
                                Já tem conta? <Text style={[styles.linkTextBold, { color: colors.primary }]}>Faça login</Text>
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>

            {/* Institution Search Modal */}
            <Modal
                visible={showInstitutionModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowInstitutionModal(false)}
            >
                <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowInstitutionModal(false)} style={styles.modalCloseButton}>
                            <X color={colors.text.primary} size={24} />
                        </TouchableOpacity>
                        <Text style={[styles.modalTitle, { color: colors.text.primary }]}>Selecionar Instituição</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Search color={colors.text.muted} size={20} />
                        <TextInput
                            style={[styles.searchInput, { color: colors.text.primary }]}
                            placeholder="Buscar instituição..."
                            placeholderTextColor={colors.text.muted}
                            value={searchQuery}
                            onChangeText={handleSearch}
                        />
                    </View>

                    <FlatList
                        data={filteredInstitutions}
                        keyExtractor={(item) => item._id}
                        contentContainerStyle={styles.institutionList}
                        renderItem={({ item }) => (
                            <View style={styles.institutionItemWrapper}>
                                <TouchableOpacity 
                                    style={[styles.institutionItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                    onPress={() => selectInstitution(item)}
                                >
                                    <View style={[styles.institutionIconContainer, { backgroundColor: colors.background }]}>
                                        <Building color={colors.primary} size={24} />
                                    </View>
                                    <Text style={[styles.institutionName, { color: colors.text.primary }]}>{item.name}</Text>
                                    <ChevronRight color={colors.text.muted} size={20} />
                                </TouchableOpacity>
                            </View>
                        )}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={[styles.emptyText, { color: colors.text.muted }]}>
                                    Nenhuma instituição encontrada
                                </Text>
                            </View>
                        }
                    />
                </SafeAreaView>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: spacing.lg,
        paddingTop: Platform.OS === 'ios' ? 60 : spacing.xxl,
    },
    header: {
        marginBottom: spacing.xxl,
    },
    title: {
        fontFamily: typography.family.bold,
        fontSize: typography.size.xxxl,
        marginBottom: spacing.xs,
    },
    subtitle: {
        fontFamily: typography.family.regular,
        fontSize: typography.size.md,
    },
    form: {
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        elevation: 3,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    datePickerContainer: {
        marginVertical: spacing.sm,
    },
    label: {
        fontFamily: typography.family.medium,
        fontSize: typography.size.sm,
        marginBottom: spacing.xs,
        marginLeft: spacing.xs,
    },
    datePickerBox: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        height: 56,
    },
    sectionTitle: {
        fontFamily: typography.family.bold,
        fontSize: typography.size.md,
    },
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        marginBottom: spacing.md,
    },
    switchLabel: {
        fontFamily: typography.family.medium,
        fontSize: typography.size.md,
    },
    buttonContainer: {
        marginTop: spacing.lg,
    },
    linkButton: {
        marginTop: spacing.md,
        alignItems: 'center',
    },
    linkText: {
        fontFamily: typography.family.regular,
        fontSize: typography.size.sm,
    },
    linkTextBold: {
        fontFamily: typography.family.bold,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        marginBottom: spacing.md,
    },
    errorText: {
        fontFamily: typography.family.medium,
        fontSize: typography.size.sm,
        flex: 1,
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    modalCloseButton: {
        padding: spacing.xs,
    },
    modalTitle: {
        fontFamily: typography.family.bold,
        fontSize: typography.size.lg,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: spacing.lg,
        paddingHorizontal: spacing.md,
        height: 50,
        borderRadius: borderRadius.md,
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        height: '100%',
        marginLeft: spacing.sm,
        fontFamily: typography.family.regular,
        fontSize: typography.size.md,
    },
    institutionList: {
        padding: spacing.md,
    },
    institutionItemWrapper: {
        marginBottom: spacing.md,
    },
    institutionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
    },
    institutionIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    institutionName: {
        flex: 1,
        fontFamily: typography.family.medium,
        fontSize: typography.size.md,
    },
    emptyContainer: {
        padding: spacing.xl,
        alignItems: 'center',
    },
    emptyText: {
        fontFamily: typography.family.regular,
        fontSize: typography.size.md,
    },
});
