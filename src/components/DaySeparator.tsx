import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme, type ThemeColors } from '../theme';

interface Props {
  label: string;
}

export function DaySeparator({ label }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <Text style={styles.label}>{label}</Text>
      <View style={styles.line} />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
      marginBottom: 8,
    },
    line: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.beige,
    },
    label: {
      fontSize: 11,
      color: colors.textMuted,
      letterSpacing: 1.5,
      paddingHorizontal: 10,
    },
  });
