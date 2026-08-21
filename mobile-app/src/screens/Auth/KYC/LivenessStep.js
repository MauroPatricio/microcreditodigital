import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../../../theme/ThemeContext';
import { Camera, ShieldCheck } from 'lucide-react-native';
import { spacing, typography, borderRadius } from '../../../../theme/typography';

export default function LivenessStep({ formData, updateData }) {
  const { colors } = useTheme();

  const takeSelfie = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Desculpe, precisamos de permissões de câmara para validar a sua identidade!');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      cameraType: 'front', // Força a câmara frontal
    });

    if (!result.canceled) {
      updateData({ selfieImage: result.assets[0].uri });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Prova de Vida</Text>
      <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
        Para garantir a sua segurança, precisamos de confirmar que é você mesmo. Por favor, tire uma selfie nítida do seu rosto.
      </Text>

      <View style={styles.instructionsContainer}>
        <View style={styles.instructionRow}>
          <Text style={[styles.instructionDot, { color: colors.primary }]}>•</Text>
          <Text style={[styles.instructionText, { color: colors.text.primary }]}>Olhe diretamente para a câmara</Text>
        </View>
        <View style={styles.instructionRow}>
          <Text style={[styles.instructionDot, { color: colors.primary }]}>•</Text>
          <Text style={[styles.instructionText, { color: colors.text.primary }]}>Retire óculos escuros, máscara ou chapéu</Text>
        </View>
        <View style={styles.instructionRow}>
          <Text style={[styles.instructionDot, { color: colors.primary }]}>•</Text>
          <Text style={[styles.instructionText, { color: colors.text.primary }]}>Assegure boa iluminação no rosto</Text>
        </View>
      </View>

      <View style={styles.cameraContainer}>
        <TouchableOpacity 
          style={[
            styles.selfieButton, 
            { 
              backgroundColor: colors.surface, 
              borderColor: formData.selfieImage ? colors.status.success : colors.primary 
            }
          ]}
          onPress={takeSelfie}
        >
          {formData.selfieImage ? (
            <Image source={{ uri: formData.selfieImage }} style={styles.selfieImage} />
          ) : (
            <View style={styles.placeholder}>
              <Camera color={colors.primary} size={48} />
              <Text style={[styles.placeholderText, { color: colors.primary }]}>Tirar Selfie</Text>
            </View>
          )}
        </TouchableOpacity>

        {formData.selfieImage && (
          <View style={[styles.successBadge, { backgroundColor: colors.status.success }]}>
            <ShieldCheck color="#fff" size={16} />
            <Text style={styles.successText}>Identidade validada localmente</Text>
          </View>
        )}
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
  instructionsContainer: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  instructionDot: {
    fontSize: typography.size.xl,
    marginRight: spacing.sm,
  },
  instructionText: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.md,
  },
  cameraContainer: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  selfieButton: {
    width: 200,
    height: 200,
    borderRadius: 100, // Make it a circle
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  placeholder: {
    alignItems: 'center',
  },
  placeholderText: {
    fontFamily: typography.family.semibold,
    fontSize: typography.size.md,
    marginTop: spacing.sm,
  },
  selfieImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.round,
    marginTop: spacing.lg,
  },
  successText: {
    color: '#fff',
    fontFamily: typography.family.semibold,
    fontSize: typography.size.sm,
    marginLeft: spacing.xs,
  },
});
