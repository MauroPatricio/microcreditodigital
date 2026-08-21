import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { typography, spacing, borderRadius } from '../theme/typography';

const PremiumInput = ({
  label,
  value,
  onChangeText,
  error,
  icon: Icon,
  isPassword = false,
  ...props
}) => {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Simple floating label or highlighted border animation could be added here
  // For now, we'll focus on a premium static look with focus states

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: colors.text.secondary }]}>{label}</Text>}
      
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.status.error : (isFocused ? colors.primary : colors.border),
          },
        ]}
      >
        {Icon && <Icon color={isFocused ? colors.primary : colors.text.muted} size={20} style={styles.icon} />}
        
        <TextInput
          style={[styles.input, { color: colors.text.primary }]}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor={colors.text.muted}
          secureTextEntry={isPassword && !showPassword}
          {...props}
        />

        {isPassword && (
          <TouchableOpacity 
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            {showPassword ? (
              <EyeOff color={colors.text.muted} size={20} />
            ) : (
              <Eye color={colors.text.muted} size={20} />
            )}
          </TouchableOpacity>
        )}
      </View>
      
      {error && <Text style={[styles.errorText, { color: colors.status.error }]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
    width: '100%',
  },
  label: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.sm,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 56, // Touch friendly height
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  icon: {
    marginRight: spacing.sm,
  },
  eyeIcon: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },
  input: {
    flex: 1,
    fontFamily: typography.family.regular,
    fontSize: typography.size.md,
    height: '100%',
  },
  errorText: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
});

export default PremiumInput;
