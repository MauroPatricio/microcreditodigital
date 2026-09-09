import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { Mail, Lock, AlertCircle } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import PremiumInput from '../../components/PremiumInput';
import PremiumButton from '../../components/PremiumButton';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, typography, borderRadius } from '../../theme/typography';

export default function LoginScreen({ navigation }) {
    const { login } = useAuth();
    const { colors } = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleLogin = async () => {
        setErrorMsg('');
        if (!email || !password) {
            setErrorMsg('Por favor, preencha todos os campos.');
            return;
        }

        setLoading(true);
        const result = await login(email, password);
        setLoading(false);

        if (!result.success) {
            setErrorMsg(result.message || 'Falha ao iniciar sessão.');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.logo}>💰</Text>
                    <Text style={[styles.title, { color: colors.primary }]}>TaquiMola</Text>
                    <Text style={[styles.subtitle, { color: colors.text.secondary }]}>O seu crédito inteligente</Text>
                </View>

                <View style={[styles.form, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
                    
                    {errorMsg ? (
                        <View style={[styles.errorContainer, { backgroundColor: `${colors.status.error}15`, borderColor: colors.status.error }]}>
                            <AlertCircle color={colors.status.error} size={20} />
                            <Text style={[styles.errorText, { color: colors.status.error }]}>{errorMsg}</Text>
                        </View>
                    ) : null}

                    <PremiumInput
                        label="Email ou Telefone"
                        placeholder="seu@email.com ou 84..."
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="default"
                        autoCapitalize="none"
                        autoComplete="email"
                        icon={Mail}
                    />

                    <PremiumInput
                        label="Senha"
                        placeholder="Sua senha"
                        value={password}
                        onChangeText={setPassword}
                        autoComplete="password"
                        isPassword={true}
                        icon={Lock}
                    />

                    <View style={styles.buttonContainer}>
                        <PremiumButton
                            title="Entrar"
                            onPress={handleLogin}
                            loading={loading}
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.linkButton}
                        onPress={() => navigation.navigate('Register')}
                    >
                        <Text style={[styles.linkText, { color: colors.text.secondary }]}>
                            Não tem conta? <Text style={[styles.linkTextBold, { color: colors.primary }]}>Registre-se</Text>
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
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: spacing.lg,
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.xxl,
    },
    logo: {
        fontSize: 60,
        marginBottom: spacing.sm,
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
        marginLeft: spacing.sm,
        flex: 1,
    },
});
