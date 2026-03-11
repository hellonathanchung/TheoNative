import React, { useMemo } from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { useTheme, type ThemeColors } from '../theme';
import type { Intensity } from '../types';

interface Props {
  onSelect: (intensity: Intensity) => void;
  onSkip: () => void;
}

export const IntensityPicker: React.FC<Props> = ({ onSelect, onSkip }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const intensityOptions: {
    value: Intensity;
    label: string;
    dotColor: string;
    dotCount: number;
  }[] = useMemo(
    () => [
      { value: 'mild', label: 'Mild', dotColor: colors.intensityMild, dotCount: 1 },
      { value: 'moderate', label: 'Moderate', dotColor: colors.intensityModerate, dotCount: 2 },
      { value: 'strong', label: 'Strong', dotColor: colors.intensityStrong, dotCount: 3 },
    ],
    [colors],
  );
  return (
    <Modal transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>How did that feel?</Text>
          <View style={styles.optionsRow}>
            {intensityOptions.map((option) => (
              <Pressable
                key={option.value}
                style={styles.option}
                accessibilityRole="button"
                accessibilityLabel={`Mark contraction intensity as ${option.label}`}
                onPress={() => onSelect(option.value)}
              >
                <View style={styles.dotsContainer}>
                  {Array.from({ length: option.dotCount }).map((_, i) => (
                    <View
                      key={i}
                      style={[styles.dot, { backgroundColor: option.dotColor }]}
                    />
                  ))}
                </View>
                <Text style={styles.optionLabel}>{option.label}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            style={styles.skipButton}
            accessibilityRole="button"
            accessibilityLabel="Skip intensity selection"
            onPress={onSkip}
          >
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  title: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 20,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  option: {
    flex: 1,
    backgroundColor: colors.beige,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 8,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 4,
    height: 12,
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  skipButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
});
