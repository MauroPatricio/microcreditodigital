import React from 'react';
import { StyleSheet, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { typography, spacing, borderRadius } from '../theme/typography';

const PremiumButton = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary', // 'primary', 'secondary', 'outline'
  style,
  textStyle,
  icon: Icon,
}) => {
  const { colors } = useTheme();

  const getBackgroundColor = () => {
    if (disabled) return [colors.border, colors.border];
    if (variant === 'primary') return [colors.primary, colors.primaryLight];
    if (variant === 'secondary') return [colors.secondary, colors.secondary];
    return ['transparent', 'transparent'];
  };

  const getTextColor = () => {
    if (disabled) return colors.text.muted;
    if (variant === 'outline') return colors.primary;
    return colors.text.inverse;
  };

  const getBorderColor = () => {
    if (variant === 'outline') return colors.primary;
    return 'transparent';
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={disabled || loading ? null : onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={getBackgroundColor()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradient,
          {
            borderColor: getBorderColor(),
            borderWidth: variant === 'outline' ? 1.5 : 0,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={getTextColor()} />
        ) : (
          <>
            {Icon && <Icon color={getTextColor()} size={20} style={styles.icon} />}
            <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
              {title}
            </Text>
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  gradient: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    textAlign: 'center',
  },
  icon: {
    marginRight: spacing.sm,
  },
});

export default PremiumButton;
