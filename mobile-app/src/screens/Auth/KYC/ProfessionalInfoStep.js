import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../../../theme/ThemeContext';
import PremiumInput from '../../../../components/PremiumInput';
import { Briefcase, Building, DollarSign, FileText, Camera } from 'lucide-react-native';
import { spacing, typography, borderRadius } from '../../../../theme/typography';

export default function ProfessionalInfoStep({ formData, updateData }) {
  const { colors, isDarkMode } = useTheme();

  // For simplicity we use a basic switch between the two main states the user asked for
  const isSelfEmployed = formData.employmentStatus === 'Conta Própria / Empresário';

  const uploadDocument = async (field) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Precisamos de acesso à galeria para o documento.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      updateData({ [field]: result.assets[0].uri });
    }
  };

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

  const toggleEmploymentStatus = () => {
    updateData({ 
      employmentStatus: isSelfEmployed ? 'Conta de Outrem' : 'Conta Própria / Empresário' 
    });
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Situação Profissional</Text>
      <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
        Toque abaixo para alternar entre Trabalhador por Conta de Outrem e Trabalhador por Conta Própria.
      </Text>

      <DropdownSim 
        label="Situação Atual" 
        value={formData.employmentStatus || 'Conta de Outrem'} 
        onPress={toggleEmploymentStatus}
      />

      {!isSelfEmployed ? (
        <View style={styles.dynamicSection}>
          <PremiumInput
            label="Empresa"
            placeholder="Nome da empresa"
            value={formData.companyName}
            onChangeText={(text) => updateData({ companyName: text })}
            icon={Building}
          />
          <PremiumInput
            label="Cargo"
            placeholder="Seu cargo atual"
            value={formData.jobTitle}
            onChangeText={(text) => updateData({ jobTitle: text })}
            icon={Briefcase}
          />
          
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: spacing.xs }}>
              <PremiumInput
                label="Salário Mensal"
                placeholder="Ex: 15000"
                keyboardType="numeric"
                value={formData.monthlySalary}
                onChangeText={(text) => updateData({ monthlySalary: text })}
                icon={DollarSign}
              />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.xs }}>
              <DropdownSim label="Tipo Contrato" value={formData.contractType || 'Efetivo'} />
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text.primary, marginTop: spacing.lg }]}>Declaração / Recibo de Salário</Text>
          <TouchableOpacity 
            style={[
              styles.uploadCard, 
              { backgroundColor: colors.surface, borderColor: formData.salarySlipImage ? colors.primary : colors.border }
            ]}
            onPress={() => uploadDocument('salarySlipImage')}
          >
            {formData.salarySlipImage ? (
              <Image source={{ uri: formData.salarySlipImage }} style={styles.uploadImage} />
            ) : (
              <View style={styles.placeholder}>
                <FileText color={colors.primary} size={32} />
                <Text style={[styles.uploadText, { color: colors.text.primary }]}>Carregar Recibo</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.dynamicSection}>
          <PremiumInput
            label="Nome do Negócio"
            placeholder="Ex: Mercearia do João"
            value={formData.businessName}
            onChangeText={(text) => updateData({ businessName: text })}
            icon={Building}
          />
          <PremiumInput
            label="Tipo de Actividade"
            placeholder="Ex: Comércio"
            value={formData.businessType}
            onChangeText={(text) => updateData({ businessType: text })}
            icon={Briefcase}
          />
          
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: spacing.xs }}>
              <PremiumInput
                label="Rendimento Médio"
                placeholder="Ex: 30000"
                keyboardType="numeric"
                value={formData.averageIncome}
                onChangeText={(text) => updateData({ averageIncome: text })}
                icon={DollarSign}
              />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.xs }}>
              <PremiumInput
                label="Lucro Médio"
                placeholder="Ex: 10000"
                keyboardType="numeric"
                value={formData.averageProfit}
                onChangeText={(text) => updateData({ averageProfit: text })}
              />
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text.primary, marginTop: spacing.lg }]}>Alvará ou Licença</Text>
          <TouchableOpacity 
            style={[
              styles.uploadCard, 
              { backgroundColor: colors.surface, borderColor: formData.businessLicenseImage ? colors.primary : colors.border }
            ]}
            onPress={() => uploadDocument('businessLicenseImage')}
          >
            {formData.businessLicenseImage ? (
              <Image source={{ uri: formData.businessLicenseImage }} style={styles.uploadImage} />
            ) : (
              <View style={styles.placeholder}>
                <FileText color={colors.primary} size={32} />
                <Text style={[styles.uploadText, { color: colors.text.primary }]}>Carregar Alvará</Text>
              </View>
            )}
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
  row: {
    flexDirection: 'row',
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
  dynamicSection: {
    marginTop: spacing.md,
  },
  uploadCard: {
    width: '100%',
    height: 160,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  placeholder: {
    alignItems: 'center',
  },
  uploadText: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.sm,
    marginTop: spacing.sm,
  },
  uploadImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});
