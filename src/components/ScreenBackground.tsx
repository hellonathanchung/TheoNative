import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { BackgroundLeaves } from './BackgroundLeaves';
import { Colors } from '../theme';

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
  backgroundColor = Colors.cream,
  active = false,
  activeOverlayColor = Colors.softGreen,
  activeOverlayOpacity = 0.35,
  style,
}: Props) {
  const overlayOpacity = useRef(
    new Animated.Value(active ? activeOverlayOpacity : 0),
  ).current;

  useEffect(() => {
    Animated.timing(overlayOpacity, {
      toValue: active ? activeOverlayOpacity : 0,
      duration: active ? 800 : 500,
      useNativeDriver: true,
    }).start();
  }, [active, activeOverlayOpacity, overlayOpacity]);

  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      <BackgroundLeaves />
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: activeOverlayColor, opacity: overlayOpacity },
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
