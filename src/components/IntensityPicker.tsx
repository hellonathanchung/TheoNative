import React from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { Colors } from '../theme';
import type { Intensity } from '../types';

interface Props {
  onSelect: (intensity: Intensity) => void;
  onSkip: () => void;
}

const intensityOptions: { value: Intensity; label: string; dotColor: string; dotCount: number }[] = [
  { value: 'mild', label: 'Mild', dotColor: Colors.warmAmber, dotCount: 1 },
  { value: 'moderate', label: 'Moderate', dotColor: Colors.softCoral, dotCount: 2 },
  { value: 'strong', label: 'Strong', dotColor: Colors.terracotta, dotCount: 3 },
];

export const IntensityPicker: React.FC<Props> = ({ onSelect, onSkip }) => {
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
          <Pressable style={styles.skipButton} onPress={onSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.cream,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  title: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 20,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  option: {
    flex: 1,
    backgroundColor: Colors.beige,
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  skipButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
});
