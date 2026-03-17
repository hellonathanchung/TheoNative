import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { useTheme, type ThemeColors } from '../theme';
import { IntensitySlider } from './IntensitySlider';
import { useSwipeLock } from '../contexts/SwipeLockContext';

interface Props {
  onSelect: (intensity: number) => void;
  onSkip: () => void;
}

export const IntensityPicker: React.FC<Props> = ({ onSelect, onSkip }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [value, setValue] = useState(50);
  const { lock, unlock } = useSwipeLock();

  useEffect(() => {
    lock();
    return () => unlock();
  }, [lock, unlock]);

  return (
    <Modal transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>How did that feel?</Text>
          <IntensitySlider value={value} onChange={setValue} />
          <Pressable
            style={styles.confirmButton}
            accessibilityRole="button"
            accessibilityLabel={`Log intensity ${value} out of 100`}
            onPress={() => onSelect(value)}
          >
            <Text style={styles.confirmText}>Log Intensity</Text>
          </Pressable>
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
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  title: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 24,
  },
  confirmButton: {
    marginTop: 20,
    backgroundColor: colors.deepGreen,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
  skipButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
});
