import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, type ThemeColors } from '../theme';

interface Props {
  message: string;
  onDismiss: () => void;
}

export const AlertBanner: React.FC<Props> = ({ message, onDismiss }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  return (
    <Animated.View
      style={[
        styles.container,
        { paddingTop: insets.top + 16, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <Text style={styles.message}>{message}</Text>
      <Pressable style={styles.button} onPress={onDismiss}>
        <Text style={styles.buttonText}>OK</Text>
      </Pressable>
    </Animated.View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    backgroundColor: colors.softCoral,
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 12,
  },
  message: {
    color: colors.cream,
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  button: {
    backgroundColor: colors.cream,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  buttonText: {
    color: colors.terracotta,
    fontWeight: '600',
    fontSize: 14,
  },
});
