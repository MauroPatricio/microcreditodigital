import React, { useRef, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image, ScrollView, Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import SignatureScreen from 'react-native-signature-canvas';
import { useTheme } from '../../../../theme/ThemeContext';
import PremiumInput from '../../../../components/PremiumInput';
import PremiumButton from '../../../../components/PremiumButton';
import { FileText, Smartphone, Building, CheckSquare, Square, PenTool } from 'lucide-react-native';
import { spacing, typography, borderRadius } from '../../../../theme/typography';

export default function BankAndSignatureStep({ formData, updateData, setScrollEnabled }) {
  const { colors, isDarkMode } = useTheme();
  const signatureRef = useRef();
  const [showSignaturePad, setShowSignaturePad] = useState(false);

  // Helper for mock dropdowns
  const DropdownSim = ({ label, value, onPress }) => (
    <View style={styles.dropdownContainer}>
      <Text style={[styles.label, { color: colors.text.secondary }]}>{label}</Text>
      <TouchableOpacity 
        style={[styles.dropdownBox, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={onPress}
      >
        <Text style={{ color: value ? colors.text.primary : colors.text.muted }}>
          {value || 'Selecione...'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const uploadStatement = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true
      });
      if (!result.canceled) {
        updateData({ bankStatementFile: result.assets[0].uri, bankStatementName: result.assets[0].name });
      }
    } catch (error) {
      alert('Erro ao selecionar extrato');
    }
  };

  const toggleCheckbox = (field) => {
    updateData({ [field]: !formData[field] });
  };

  const handleSignature = (signature) => {
    updateData({ signatureData: signature });
    setShowSignaturePad(false);
    if (setScrollEnabled) setScrollEnabled(true);
  };

  const handleClearSignature = () => {
    signatureRef.current.clearSignature();
  };

  const handleConfirmSignature = () => {
    signatureRef.current.readSignature();
  };

  const isBank = formData.receiveMethod === 'Conta Bancária';

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Extrato Bancário</Text>
      <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
        Carregue o seu extrato dos últimos 3 meses (PDF ou Imagem). Utilizado exclusivamente para análise de crédito.
      </Text>

      <TouchableOpacity 
        style={[styles.uploadCard, { backgroundColor: colors.surface, borderColor: formData.bankStatementFile ? colors.primary : colors.border }]}
        onPress={uploadStatement}
      >
        <FileText color={colors.primary} size={32} />
        <Text style={[styles.uploadText, { color: colors.text.primary }]}>
          {formData.bankStatementName ? formData.bankStatementName : 'Carregar Extrato'}
        </Text>
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { color: colors.text.primary, marginTop: spacing.xl }]}>Recebimento do Crédito</Text>
      
      <DropdownSim 
        label="Método de Recebimento" 
        value={formData.receiveMethod || 'M-Pesa'} 
        onPress={() => updateData({ receiveMethod: isBank ? 'M-Pesa' : 'Conta Bancária' })}
      />

      {isBank ? (
        <View style={styles.dynamicSection}>
          <PremiumInput label="Banco" placeholder="Nome do Banco" value={formData.bankName} onChangeText={(t) => updateData({ bankName: t })} icon={Building} />
          <PremiumInput label="Titular da Conta" placeholder="Seu Nome Completo" value={formData.bankHolderName} onChangeText={(t) => updateData({ bankHolderName: t })} />
          <PremiumInput label="Número da Conta" placeholder="Número" keyboardType="numeric" value={formData.bankAccountNumber} onChangeText={(t) => updateData({ bankAccountNumber: t })} />
          <PremiumInput label="NIB / IBAN" placeholder="NIB ou IBAN" keyboardType="numeric" value={formData.bankNIB} onChangeText={(t) => updateData({ bankNIB: t })} />
        </View>
      ) : (
        <View style={styles.dynamicSection}>
          <DropdownSim label="Operadora" value={formData.mobileWalletOperator || 'Vodacom'} onPress={() => updateData({ mobileWalletOperator: formData.mobileWalletOperator === 'Vodacom' ? 'Movitel' : 'Vodacom' })} />
          <PremiumInput label="Número de Telefone" placeholder="841234567" keyboardType="phone-pad" value={formData.walletNumber} onChangeText={(t) => updateData({ walletNumber: t })} icon={Smartphone} />
          <PremiumInput label="Titular da Carteira" placeholder="Seu Nome Completo" value={formData.walletHolderName} onChangeText={(t) => updateData({ walletHolderName: t })} />
        </View>
      )}

      <Text style={[styles.sectionTitle, { color: colors.text.primary, marginTop: spacing.xl }]}>Declarações Obrigatórias</Text>
      
      {[
        { field: 'termsAccepted', text: 'Li e aceito os Termos e Condições.' },
        { field: 'privacyAccepted', text: 'Li e aceito a Política de Privacidade.' },
        { field: 'dataAccepted', text: 'Autorizo o tratamento dos meus dados para efeitos de cadastro, análise e gestão do pedido.' },
        { field: 'truthAccepted', text: 'Declaro que as informações fornecidas são verdadeiras, completas e actualizadas.' },
        { field: 'analysisAccepted', text: 'Autorizo a instituição a realizar as verificações necessárias para avaliar a minha elegibilidade.' },
      ].map((item, index) => (
        <TouchableOpacity key={index} style={styles.checkboxRow} onPress={() => toggleCheckbox(item.field)}>
          {formData[item.field] ? (
            <CheckSquare color={colors.primary} size={24} />
          ) : (
            <Square color={colors.border} size={24} />
          )}
          <Text style={[styles.checkboxText, { color: colors.text.primary }]}>{item.text}</Text>
        </TouchableOpacity>
      ))}

      <Text style={[styles.sectionTitle, { color: colors.text.primary, marginTop: spacing.xl }]}>Assinatura Digital</Text>
      <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
        Assine abaixo para finalizar o seu cadastro.
      </Text>

      {!showSignaturePad && !formData.signatureData && (
        <PremiumButton 
          title="Abrir Tela de Assinatura" 
          icon={PenTool} 
          variant="outline" 
          onPress={() => {
            setShowSignaturePad(true);
            if (setScrollEnabled) setScrollEnabled(false);
          }} 
        />
      )}

      {showSignaturePad && (
        <View style={styles.signatureContainer}>
          <SignatureScreen
            ref={signatureRef}
            onOK={handleSignature}
            descriptionText="Assine aqui"
            clearText="Limpar"
            confirmText="Salvar"
            webStyle={`
              .m-signature-pad { box-shadow: none; border: none; }
              .m-signature-pad--body { border: 1px solid ${colors.border}; border-radius: 8px; }
            `}
          />
          <View style={styles.signatureActions}>
            <TouchableOpacity onPress={handleClearSignature} style={styles.sigBtn}><Text style={{color: colors.status.error}}>Limpar</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => { setShowSignaturePad(false); if (setScrollEnabled) setScrollEnabled(true); }} style={styles.sigBtn}><Text style={{color: colors.text.secondary}}>Cancelar</Text></TouchableOpacity>
            <TouchableOpacity onPress={handleConfirmSignature} style={styles.sigBtn}><Text style={{color: colors.primary, fontWeight: 'bold'}}>Salvar Assinatura</Text></TouchableOpacity>
          </View>
        </View>
      )}

      {formData.signatureData && !showSignaturePad && (
        <View style={styles.signaturePreview}>
          <Image source={{ uri: formData.signatureData }} style={{ width: '100%', height: 120, resizeMode: 'contain' }} />
          <TouchableOpacity onPress={() => { setShowSignaturePad(true); if (setScrollEnabled) setScrollEnabled(false); }} style={{ marginTop: spacing.sm }}>
            <Text style={{ textAlign: 'center', color: colors.primary, fontWeight: 'bold' }}>Refazer Assinatura</Text>
          </TouchableOpacity>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.xxl,
  },
  sectionTitle: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.lg,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    marginBottom: spacing.md,
  },
  dropdownContainer: {
    marginVertical: spacing.sm,
    width: '100%',
  },
  label: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.sm,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  dropdownBox: {
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 56,
  },
  uploadCard: {
    width: '100%',
    height: 100,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.sm,
    marginTop: spacing.sm,
  },
  dynamicSection: {
    marginTop: spacing.sm,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: spacing.sm,
    paddingRight: spacing.lg,
  },
  checkboxText: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    marginLeft: spacing.sm,
    lineHeight: 20,
    flex: 1,
  },
  signatureContainer: {
    height: 300,
    marginTop: spacing.md,
  },
  signatureActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: '#f8f9fa',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  sigBtn: {
    padding: spacing.sm,
  },
  signaturePreview: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    backgroundColor: '#fff',
    marginTop: spacing.sm,
  },
});
