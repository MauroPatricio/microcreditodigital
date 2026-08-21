import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../theme/ThemeContext';
import StepProgress from '../../../components/StepProgress';
import PremiumButton from '../../../components/PremiumButton';
import { spacing, typography } from '../../../theme/typography';
import PersonalDataStep from './PersonalDataStep';
import IdDocumentStep from './IdDocumentStep';
import LivenessStep from './LivenessStep';
import AddressStep from './AddressStep';
import ProfessionalInfoStep from './ProfessionalInfoStep';
import FinancialInfoStep from './FinancialInfoStep';
import BankAndSignatureStep from './BankAndSignatureStep';

// Placeholder steps until we create them
// const PersonalDataStep = () => <Text style={{margin: 20}}>Passo 1: Dados Pessoais</Text>;
// const IdDocumentStep = () => <Text style={{margin: 20}}>Passo 2: Documento de Identificação</Text>;
// const LivenessStep = () => <Text style={{margin: 20}}>Passo 3: Prova de Vida</Text>;
// const AddressStep = () => <Text style={{margin: 20}}>Passo 4: Morada do Cliente</Text>;
// const ProfessionalInfoStep = () => <Text style={{margin: 20}}>Passo 5: Informação Profissional</Text>;
// const FinancialInfoStep = () => <Text style={{margin: 20}}>Passo 6: Situação Financeira</Text>;
// const BankAndSignatureStep = () => <Text style={{margin: 20}}>Passo 7: Extrato e Assinatura</Text>;

const STEPS = [
  { id: 1, component: PersonalDataStep, title: 'Dados Pessoais' },
  { id: 2, component: IdDocumentStep, title: 'Documento' },
  { id: 3, component: LivenessStep, title: 'Prova de Vida' },
  { id: 4, component: AddressStep, title: 'Localização' },
  { id: 5, component: ProfessionalInfoStep, title: 'Profissão' },
  { id: 6, component: FinancialInfoStep, title: 'Finanças' },
  { id: 7, component: BankAndSignatureStep, title: 'Submissão' },
];

export default function KYCFlowScreen({ navigation }) {
  const { colors, isDarkMode } = useTheme();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({}); // Master form data state
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final submission logic
      console.log('Submitting data:', formData);
      navigation.navigate('Login'); // Go back to login or dashboard
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const CurrentComponent = STEPS[currentStep - 1].component;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            {STEPS[currentStep - 1].title}
          </Text>
          <StepProgress currentStep={currentStep} totalSteps={STEPS.length} />
        </View>

        <ScrollView contentContainerStyle={styles.content} scrollEnabled={scrollEnabled}>
          <CurrentComponent 
            formData={formData} 
            updateData={(data) => setFormData({ ...formData, ...data })} 
            setScrollEnabled={setScrollEnabled}
          />
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <View style={styles.buttonRow}>
            <View style={{ flex: 1, marginRight: spacing.sm }}>
              <PremiumButton 
                title={currentStep === 1 ? 'Cancelar' : 'Voltar'} 
                variant="outline" 
                onPress={handleBack} 
              />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <PremiumButton 
                title={currentStep === STEPS.length ? 'Submeter' : 'Próximo'} 
                onPress={handleNext} 
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  headerTitle: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.xl,
    marginBottom: spacing.sm,
  },
  content: {
    flexGrow: 1,
    padding: spacing.md,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
