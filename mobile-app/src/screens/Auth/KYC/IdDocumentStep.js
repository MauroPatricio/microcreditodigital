import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../../../theme/ThemeContext';
import PremiumInput from '../../../../components/PremiumInput';
import { FileText, Camera, MapPin, Calendar } from 'lucide-react-native';
import { spacing, typography, borderRadius } from '../../../../theme/typography';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function IdDocumentStep({ formData, updateData }) {
  const { colors, isDarkMode } = useTheme();
  
  // Date picker state
  const [showIssueDate, setShowIssueDate] = useState(false);
  const [showExpiryDate, setShowExpiryDate] = useState(false);

  const takePhoto = async (side) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Desculpe, precisamos de permissões de câmara para isto!');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      if (side === 'front') {
        updateData({ documentFrontImage: result.assets[0].uri });
      } else {
        updateData({ documentBackImage: result.assets[0].uri });
      }
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('pt-PT');
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Detalhes do Documento</Text>
      <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
        Selecione e preencha os dados do seu documento de identificação (BI, Passaporte, etc).
      </Text>

      {/* Mock Document Type Dropdown */}
      <View style={styles.dropdownContainer}>
        <Text style={[styles.label, { color: colors.text.secondary }]}>Tipo de Documento</Text>
        <View style={[styles.dropdownBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={{ color: formData.documentType ? colors.text.primary : colors.text.muted }}>
            {formData.documentType || 'Bilhete de Identidade (BI)'}
          </Text>
        </View>
      </View>

      <PremiumInput
        label="Número do Documento"
        placeholder="Ex: 123456789BI"
        value={formData.documentNumber}
        onChangeText={(text) => updateData({ documentNumber: text })}
        icon={FileText}
      />

      <PremiumInput
        label="Local de Emissão"
        placeholder="Ex: Maputo"
        value={formData.documentLocation}
        onChangeText={(text) => updateData({ documentLocation: text })}
        icon={MapPin}
      />

      {/* Issue Date */}
      <View style={styles.datePickerContainer}>
        <Text style={[styles.label, { color: colors.text.secondary }]}>Data de Emissão</Text>
        <TouchableOpacity 
          style={[styles.datePickerBox, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setShowIssueDate(true)}
        >
          <Calendar color={colors.text.muted} size={20} style={{ marginRight: spacing.sm }} />
          <Text style={{ color: formData.documentIssueDate ? colors.text.primary : colors.text.muted }}>
            {formData.documentIssueDate ? formatDate(formData.documentIssueDate) : 'DD/MM/AAAA'}
          </Text>
        </TouchableOpacity>
        {showIssueDate && (
          <DateTimePicker
            value={formData.documentIssueDate || new Date()}
            mode="date"
            display="default"
            onChange={(e, date) => {
              setShowIssueDate(Platform.OS === 'ios');
              if (date) updateData({ documentIssueDate: date });
            }}
          />
        )}
      </View>

      {/* Expiry Date */}
      <View style={styles.datePickerContainer}>
        <Text style={[styles.label, { color: colors.text.secondary }]}>Data de Validade</Text>
        <TouchableOpacity 
          style={[styles.datePickerBox, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setShowExpiryDate(true)}
        >
          <Calendar color={colors.text.muted} size={20} style={{ marginRight: spacing.sm }} />
          <Text style={{ color: formData.documentExpiryDate ? colors.text.primary : colors.text.muted }}>
            {formData.documentExpiryDate ? formatDate(formData.documentExpiryDate) : 'DD/MM/AAAA'}
          </Text>
        </TouchableOpacity>
        {showExpiryDate && (
          <DateTimePicker
            value={formData.documentExpiryDate || new Date()}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={(e, date) => {
              setShowExpiryDate(Platform.OS === 'ios');
              if (date) updateData({ documentExpiryDate: date });
            }}
          />
        )}
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text.primary, marginTop: spacing.lg }]}>Fotografias do Documento</Text>

      <View style={styles.photoSection}>
        <TouchableOpacity 
          style={[
            styles.photoCard, 
            { backgroundColor: colors.surface, borderColor: formData.documentFrontImage ? colors.primary : colors.border }
          ]}
          onPress={() => takePhoto('front')}
        >
          {formData.documentFrontImage ? (
            <Image source={{ uri: formData.documentFrontImage }} style={styles.photoImage} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Camera color={colors.primary} size={32} />
              <Text style={[styles.photoText, { color: colors.text.primary }]}>Frente do BI</Text>
              <Text style={[styles.photoSubText, { color: colors.text.muted }]}>Toque para fotografar</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.photoCard, 
            { backgroundColor: colors.surface, borderColor: formData.documentBackImage ? colors.primary : colors.border }
          ]}
          onPress={() => takePhoto('back')}
        >
          {formData.documentBackImage ? (
            <Image source={{ uri: formData.documentBackImage }} style={styles.photoImage} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Camera color={colors.primary} size={32} />
              <Text style={[styles.photoText, { color: colors.text.primary }]}>Verso do BI</Text>
              <Text style={[styles.photoSubText, { color: colors.text.muted }]}>Toque para fotografar</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

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
  datePickerContainer: {
    marginVertical: spacing.sm,
    width: '100%',
  },
  datePickerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 56,
  },
  photoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  photoCard: {
    width: '48%',
    height: 140,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.sm,
  },
  photoText: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.sm,
    marginTop: spacing.sm,
  },
  photoSubText: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});
