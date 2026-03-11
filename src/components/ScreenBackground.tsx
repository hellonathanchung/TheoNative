import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BackgroundLeaves } from './BackgroundLeaves';
import { Colors } from '../theme';

interface Props {
  children: React.ReactNode;
  backgroundColor?: string;
  style?: object;
}

export function ScreenBackground({ children, backgroundColor = Colors.cream, style }: Props) {
  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      <BackgroundLeaves />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
