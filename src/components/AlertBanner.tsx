import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme';

interface Props {
  message: string;
  onDismiss: () => void;
}

export const AlertBanner: React.FC<Props> = ({ message, onDismiss }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.message}>{message}</Text>
      <Pressable style={styles.button} onPress={onDismiss}>
        <Text style={styles.buttonText}>OK</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.softCoral,
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    gap: 12,
  },
  message: {
    color: Colors.cream,
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    backgroundColor: Colors.cream,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  buttonText: {
    color: Colors.terracotta,
    fontWeight: '600',
    fontSize: 14,
  },
});
