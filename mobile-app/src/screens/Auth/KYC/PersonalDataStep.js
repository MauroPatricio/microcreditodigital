import React, { useState } from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../../../theme/ThemeContext';
import PremiumInput from '../../../../components/PremiumInput';
import { User, Calendar, Phone, Mail, FileText } from 'lucide-react-native';
import { spacing, typography, borderRadius } from '../../../../theme/typography';
import { Picker } from '@react-native-picker/picker'; // Need to ensure @react-native-picker/picker is installed, or build a custom select. I'll use a simple styled view for now.

export default function PersonalDataStep({ formData, updateData }) {
  const { colors, isDarkMode } = useTheme();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      updateData({ birthDate: selectedDate });
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('pt-PT');
  };

  // Helper for mock dropdowns until picker is fully integrated
  const DropdownSim = ({ label, value, options }) => (
    <View style={styles.dropdownContainer}>
      <Text style={[styles.label, { color: colors.text.secondary }]}>{label}</Text>
      <View style={[styles.dropdownBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={{ color: value ? colors.text.primary : colors.text.muted }}>
          {value || 'Selecione uma opção...'}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Informações Básicas</Text>
      
      <PremiumInput
        label="Nome Completo"
        placeholder="Primeiro, Meio e Apelido"
        value={formData.fullName}
        onChangeText={(text) => updateData({ fullName: text })}
        icon={User}
      />

      <View style={styles.dropdownContainer}>
        <Text style={[styles.label, { color: colors.text.secondary }]}>Data de Nascimento</Text>
        <View 
          style={[styles.dropdownBox, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onTouchEnd={() => setShowDatePicker(true)}
        >
          <Calendar color={colors.text.muted} size={20} style={{ marginRight: spacing.sm }} />
          <Text style={{ color: formData.birthDate ? colors.text.primary : colors.text.muted }}>
            {formData.birthDate ? formatDate(formData.birthDate) : 'DD/MM/AAAA'}
          </Text>
        </View>
        {showDatePicker && (
          <DateTimePicker
            value={formData.birthDate || new Date()}
            mode="date"
            display="default"
            onChange={onChangeDate}
            maximumDate={new Date()}
          />
        )}
      </View>

      <DropdownSim label="Sexo" value={formData.gender} />
      <DropdownSim label="Estado Civil" value={formData.maritalStatus} />
      <DropdownSim label="Nacionalidade" value={formData.nationality} />

      <Text style={[styles.sectionTitle, { color: colors.text.primary, marginTop: spacing.lg }]}>Contactos e Documentação</Text>

      <PremiumInput
        label="NUIT"
        placeholder="Número Único de Identificação Tributária"
        value={formData.nuit}
        onChangeText={(text) => updateData({ nuit: text })}
        keyboardType="numeric"
        icon={FileText}
      />

      <PremiumInput
        label="Número de Telefone"
        placeholder="+258 8X XXX XXXX"
        value={formData.phone}
        onChangeText={(text) => updateData({ phone: text })}
        keyboardType="phone-pad"
        icon={Phone}
      />

      <PremiumInput
        label="E-mail (Opcional)"
        placeholder="seu@email.com"
        value={formData.email}
        onChangeText={(text) => updateData({ email: text })}
        keyboardType="email-address"
        autoCapitalize="none"
        icon={Mail}
      />
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
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 56,
  },
});
