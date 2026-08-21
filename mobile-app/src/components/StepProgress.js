import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';
import { borderRadius, spacing, typography } from '../theme/typography';

const StepProgress = ({ currentStep, totalSteps }) => {
  const { colors } = useTheme();

  const progressStyle = useAnimatedStyle(() => {
    const progress = (currentStep / totalSteps) * 100;
    return {
      width: withTiming(`${progress}%`, { duration: 300 }),
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.stepText, { color: colors.text.secondary }]}>
          Passo {currentStep} de {totalSteps}
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <Animated.View style={[styles.fill, { backgroundColor: colors.primary }, progressStyle]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.xs,
  },
  stepText: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.sm,
  },
  track: {
    height: 6,
    borderRadius: borderRadius.round,
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: borderRadius.round,
  },
});

export default StepProgress;
