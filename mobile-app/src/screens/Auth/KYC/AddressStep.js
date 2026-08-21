import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../../../theme/ThemeContext';
import PremiumInput from '../../../../components/PremiumInput';
import PremiumButton from '../../../../components/PremiumButton';
import { MapPin, Map, Navigation, FileText, Camera } from 'lucide-react-native';
import { spacing, typography, borderRadius } from '../../../../theme/typography';

export default function AddressStep({ formData, updateData }) {
  const { colors, isDarkMode } = useTheme();
  const [loadingLocation, setLoadingLocation] = useState(false);

  const requestLocation = async () => {
    setLoadingLocation(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permissão de localização foi negada.');
        setLoadingLocation(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      updateData({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      alert('Erro ao obter localização. Verifique se o GPS está ligado.');
    }
    setLoadingLocation(false);
  };

  const uploadProof = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Precisamos de acesso à galeria para o comprovativo.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      updateData({ addressProofImage: result.assets[0].uri });
    }
  };

  // Helper for mock dropdowns
  const DropdownSim = ({ label, value }) => (
    <View style={styles.dropdownContainer}>
      <Text style={[styles.label, { color: colors.text.secondary }]}>{label}</Text>
      <View style={[styles.dropdownBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={{ color: value ? colors.text.primary : colors.text.muted }}>
          {value || 'Selecione...'}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Morada do Cliente</Text>
      
      <DropdownSim label="Província" value={formData.province} />
      <PremiumInput
        label="Distrito / Cidade"
        placeholder="Insira o seu distrito ou cidade"
        value={formData.district}
        onChangeText={(text) => updateData({ district: text })}
        icon={Map}
      />
      <PremiumInput
        label="Bairro"
        placeholder="Nome do Bairro"
        value={formData.neighborhood}
        onChangeText={(text) => updateData({ neighborhood: text })}
        icon={MapPin}
      />
      
      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: spacing.xs }}>
          <PremiumInput
            label="Quarteirão"
            placeholder="Q."
            value={formData.block}
            onChangeText={(text) => updateData({ block: text })}
          />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.xs }}>
          <PremiumInput
            label="Nº da Casa"
            placeholder="Nº"
            value={formData.houseNumber}
            onChangeText={(text) => updateData({ houseNumber: text })}
          />
        </View>
      </View>

      <PremiumInput
        label="Ponto de Referência"
        placeholder="Ex: Próximo à Escola Secundária"
        value={formData.reference}
        onChangeText={(text) => updateData({ reference: text })}
      />

      <DropdownSim label="Tipo de Residência" value={formData.residenceType} />
      <DropdownSim label="Tempo na Residência" value={formData.residenceTime} />

      <Text style={[styles.sectionTitle, { color: colors.text.primary, marginTop: spacing.lg }]}>Localização GPS</Text>
      <PremiumButton
        title={formData.latitude ? "Localização Obtida" : "Obter a minha localização atual"}
        icon={Navigation}
        onPress={requestLocation}
        loading={loadingLocation}
        variant={formData.latitude ? "secondary" : "outline"}
      />
      {formData.latitude && (
        <Text style={[styles.gpsText, { color: colors.text.secondary }]}>
          Lat: {formData.latitude.toFixed(5)}, Long: {formData.longitude.toFixed(5)}
        </Text>
      )}

      <Text style={[styles.sectionTitle, { color: colors.text.primary, marginTop: spacing.lg }]}>Comprovativo de Residência</Text>
      <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
        Fatura de água, energia, telefone ou declaração do bairro.
      </Text>

      <TouchableOpacity 
        style={[
          styles.uploadCard, 
          { backgroundColor: colors.surface, borderColor: formData.addressProofImage ? colors.primary : colors.border }
        ]}
        onPress={uploadProof}
      >
        {formData.addressProofImage ? (
          <Image source={{ uri: formData.addressProofImage }} style={styles.uploadImage} />
        ) : (
          <View style={styles.placeholder}>
            <FileText color={colors.primary} size={32} />
            <Text style={[styles.uploadText, { color: colors.text.primary }]}>Carregar Comprovativo</Text>
          </View>
        )}
      </TouchableOpacity>
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
    marginBottom: spacing.sm,
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
  gpsText: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    textAlign: 'center',
    marginTop: spacing.xs,
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
