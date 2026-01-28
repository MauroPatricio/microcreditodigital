import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { clientService } from '../../services';

export default function RegisterScreen({ navigation }) {
    const { user, register } = useAuth();
    const isAgent = user?.role === 'agent';

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        identityDocument: '',
        dateOfBirth: '',
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleRegister = async () => {
        // Validation
        if (!formData.name || !formData.phone || (!isAgent && !formData.password)) {
            Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios');
            return;
        }

        if (!isAgent && formData.password !== formData.confirmPassword) {
            Alert.alert('Erro', 'As senhas não coincidem');
            return;
        }

        setLoading(true);
        try {
            let result;
            if (isAgent) {
                result = await clientService.create({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    identityDocument: formData.identityDocument,
                    dateOfBirth: formData.dateOfBirth || '1990-01-01',
                    password: formData.password || '123456' // Default password for agent-created clients
                });
            } else {
                result = await register(formData);
            }

            setLoading(false);
            if (result.success) {
                Alert.alert('Sucesso', 'Cliente registrado com sucesso');
                if (isAgent) navigation.goBack();
            } else {
                Alert.alert('Erro', result.message);
            }
        } catch (error) {
            setLoading(false);
            Alert.alert('Erro', 'Falha na comunicação com o servidor');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>Criar Conta</Text>
                    <Text style={styles.subtitle}>Preencha seus dados para começar</Text>
                </View>

                <View style={styles.form}>
                    <Text style={styles.label}>Nome Completo *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="João Silva"
                        value={formData.name}
                        onChangeText={(value) => handleChange('name', value)}
                        autoCapitalize="words"
                    />

                    <Text style={styles.label}>Email *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="seu@email.com"
                        value={formData.email}
                        onChangeText={(value) => handleChange('email', value)}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                    />

                    <Text style={styles.label}>Telefone *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="841234567"
                        value={formData.phone}
                        onChangeText={(value) => handleChange('phone', value)}
                        keyboardType="phone-pad"
                        autoComplete="tel"
                    />

                    <Text style={styles.label}>Número do BI *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="123456789BI"
                        value={formData.identityDocument}
                        onChangeText={(value) => handleChange('identityDocument', value)}
                    />

                    <Text style={styles.label}>Data de Nascimento</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="1990-01-15"
                        value={formData.dateOfBirth}
                        onChangeText={(value) => handleChange('dateOfBirth', value)}
                    />

                    <Text style={styles.label}>Senha *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Mínimo 6 caracteres"
                        value={formData.password}
                        onChangeText={(value) => handleChange('password', value)}
                        secureTextEntry
                    />

                    <Text style={styles.label}>Confirmar Senha *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Repita sua senha"
                        value={formData.confirmPassword}
                        onChangeText={(value) => handleChange('confirmPassword', value)}
                        secureTextEntry
                    />

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Criar Conta</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.linkButton}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <Text style={styles.linkText}>
                            Já tem conta? <Text style={styles.linkTextBold}>Faça login</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContent: {
        flexGrow: 1,
        padding: 20,
        paddingTop: 40,
    },
    header: {
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
    },
    form: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#1e293b',
    },
    button: {
        backgroundColor: '#2563eb',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 24,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    linkButton: {
        marginTop: 20,
        alignItems: 'center',
    },
    linkText: {
        color: '#64748b',
        fontSize: 14,
    },
    linkTextBold: {
        color: '#2563eb',
        fontWeight: '600',
    },
});
