import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { BackgroundLeaves } from './BackgroundLeaves';
import { useTheme } from '../theme';

interface Props {
  children: React.ReactNode;
  backgroundColor?: string;
  active?: boolean;
  activeOverlayColor?: string;
  activeOverlayOpacity?: number;
  style?: object;
}

export function ScreenBackground({
  children,
  backgroundColor,
  active = false,
  activeOverlayColor,
  activeOverlayOpacity = 0.35,
  style,
}: Props) {
  const { colors } = useTheme();
  const overlayOpacity = useRef(
    new Animated.Value(active ? activeOverlayOpacity : 0),
  ).current;
  const baseColor = backgroundColor ?? colors.cream;
  const overlayColor = activeOverlayColor ?? colors.softGreen;

  useEffect(() => {
    Animated.timing(overlayOpacity, {
      toValue: active ? activeOverlayOpacity : 0,
      duration: active ? 800 : 500,
      useNativeDriver: true,
    }).start();
  }, [active, activeOverlayOpacity, overlayOpacity]);

  return (
    <View style={[styles.container, { backgroundColor: baseColor }, style]}>
      <BackgroundLeaves />
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: overlayColor, opacity: overlayOpacity },
        ]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
