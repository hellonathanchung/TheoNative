import React, { useEffect } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const LEAF_COLOR = '#5B9A5B';

function LeafA({ size = 1, opacity = 0.1 }: { size?: number; opacity?: number }) {
  return (
    <Svg width={80 * size} height={140 * size} viewBox="0 0 80 140" fill="none">
      <Path
        d="M40 8C40 8 12 30 8 65C4 100 30 125 40 130C50 125 76 100 72 65C68 30 40 8 40 8Z"
        fill={LEAF_COLOR}
        opacity={opacity}
      />
      <Path
        d="M40 12C40 40 40 90 40 130"
        stroke={LEAF_COLOR}
        strokeWidth="0.8"
        opacity={opacity * 0.6}
      />
      <Path d="M40 35C32 42 22 50 16 55" stroke={LEAF_COLOR} strokeWidth="0.4" opacity={opacity * 0.4} />
      <Path d="M40 35C48 42 58 50 64 55" stroke={LEAF_COLOR} strokeWidth="0.4" opacity={opacity * 0.4} />
      <Path d="M40 55C30 62 20 72 14 78" stroke={LEAF_COLOR} strokeWidth="0.4" opacity={opacity * 0.4} />
      <Path d="M40 55C50 62 60 72 66 78" stroke={LEAF_COLOR} strokeWidth="0.4" opacity={opacity * 0.4} />
      <Path d="M40 75C32 82 24 90 18 96" stroke={LEAF_COLOR} strokeWidth="0.4" opacity={opacity * 0.4} />
      <Path d="M40 75C48 82 56 90 62 96" stroke={LEAF_COLOR} strokeWidth="0.4" opacity={opacity * 0.4} />
      <Path d="M40 130L40 140" stroke={LEAF_COLOR} strokeWidth="1" opacity={opacity * 0.7} />
    </Svg>
  );
}

function LeafB({ size = 1, opacity = 0.1 }: { size?: number; opacity?: number }) {
  return (
    <Svg width={50 * size} height={130 * size} viewBox="0 0 50 130" fill="none">
      <Path
        d="M25 5C25 5 8 25 5 55C2 85 18 110 25 120C32 110 48 85 45 55C42 25 25 5 25 5Z"
        fill={LEAF_COLOR}
        opacity={opacity}
      />
      <Path d="M25 8C25 35 25 80 25 120" stroke={LEAF_COLOR} strokeWidth="0.6" opacity={opacity * 0.5} />
      <Path d="M25 30C19 38 12 46 8 50" stroke={LEAF_COLOR} strokeWidth="0.3" opacity={opacity * 0.35} />
      <Path d="M25 30C31 38 38 46 42 50" stroke={LEAF_COLOR} strokeWidth="0.3" opacity={opacity * 0.35} />
      <Path d="M25 55C18 63 12 72 8 78" stroke={LEAF_COLOR} strokeWidth="0.3" opacity={opacity * 0.35} />
      <Path d="M25 55C32 63 38 72 42 78" stroke={LEAF_COLOR} strokeWidth="0.3" opacity={opacity * 0.35} />
      <Path d="M25 120L25 130" stroke={LEAF_COLOR} strokeWidth="0.8" opacity={opacity * 0.6} />
    </Svg>
  );
}

function Branch({ size = 1, opacity = 0.08 }: { size?: number; opacity?: number }) {
  return (
    <Svg width={100 * size} height={160 * size} viewBox="0 0 100 160" fill="none">
      <Path d="M50 0C48 30 46 80 50 160" stroke={LEAF_COLOR} strokeWidth="1.2" opacity={opacity * 0.7} />
      <Path d="M48 20C40 12 28 10 25 14C22 18 30 26 40 28C46 24 48 20 48 20Z" fill={LEAF_COLOR} opacity={opacity} />
      <Path d="M50 40C58 30 70 26 74 30C78 34 68 44 58 44C52 42 50 40 50 40Z" fill={LEAF_COLOR} opacity={opacity} />
      <Path d="M48 65C38 56 26 54 22 58C18 62 28 72 38 72C44 68 48 65 48 65Z" fill={LEAF_COLOR} opacity={opacity} />
      <Path d="M50 90C60 80 72 76 76 80C80 84 70 94 60 94C54 92 50 90 50 90Z" fill={LEAF_COLOR} opacity={opacity} />
      <Path d="M48 115C38 106 26 104 22 108C18 112 28 122 38 122C44 118 48 115 48 115Z" fill={LEAF_COLOR} opacity={opacity} />
    </Svg>
  );
}

interface LeafConfig {
  leaf: 'A' | 'B' | 'branch';
  size: number;
  opacity: number;
  top?: number | string;
  bottom?: number;
  left?: number | string;
  right?: number | string;
  rotate: number;
  swayDuration: number;
  swayRotation: number;
  swayTranslateX: number;
  swayTranslateY: number;
}

const LEAVES: LeafConfig[] = [
  // TOP ZONE
  { leaf: 'A', size: 1.3, opacity: 0.09, top: -30, left: -10, rotate: -25, swayDuration: 8000, swayRotation: 2, swayTranslateX: 3, swayTranslateY: 0 },
  { leaf: 'B', size: 0.85, opacity: 0.07, top: 25, left: 45, rotate: 18, swayDuration: 11000, swayRotation: 2, swayTranslateX: 0, swayTranslateY: 4 },
  { leaf: 'B', size: 0.6, opacity: 0.045, top: 5, left: '28%', rotate: -40, swayDuration: 14000, swayRotation: 3, swayTranslateX: 2, swayTranslateY: 3 },
  { leaf: 'A', size: 1.2, opacity: 0.09, top: -25, right: -5, rotate: 22, swayDuration: 9000, swayRotation: 2, swayTranslateX: 0, swayTranslateY: 4 },
  { leaf: 'B', size: 0.8, opacity: 0.06, top: 40, right: 30, rotate: -12, swayDuration: 12000, swayRotation: 3, swayTranslateX: 2, swayTranslateY: 3 },
  { leaf: 'B', size: 0.55, opacity: 0.04, top: 10, right: '25%', rotate: 35, swayDuration: 13000, swayRotation: 2, swayTranslateX: 3, swayTranslateY: 0 },
  // UPPER-MID ZONE
  { leaf: 'branch', size: 0.75, opacity: 0.055, top: '22%', left: -20, rotate: 8, swayDuration: 14000, swayRotation: 2, swayTranslateX: 3, swayTranslateY: 0 },
  { leaf: 'A', size: 0.7, opacity: 0.05, top: '20%', right: -8, rotate: -30, swayDuration: 10000, swayRotation: 2, swayTranslateX: 0, swayTranslateY: 4 },
  // MID ZONE
  { leaf: 'A', size: 0.85, opacity: 0.06, top: '40%', left: -12, rotate: 10, swayDuration: 15000, swayRotation: 3, swayTranslateX: 2, swayTranslateY: 3 },
  { leaf: 'branch', size: 0.7, opacity: 0.05, top: '42%', right: -22, rotate: -5, swayDuration: 13000, swayRotation: 2, swayTranslateX: 3, swayTranslateY: 0 },
  { leaf: 'B', size: 0.45, opacity: 0.035, top: '35%', left: '15%', rotate: -55, swayDuration: 16000, swayRotation: 2, swayTranslateX: 0, swayTranslateY: 4 },
  { leaf: 'B', size: 0.4, opacity: 0.03, top: '48%', right: '12%', rotate: 50, swayDuration: 17000, swayRotation: 3, swayTranslateX: 2, swayTranslateY: 3 },
  // LOWER-MID ZONE
  { leaf: 'B', size: 0.75, opacity: 0.055, top: '60%', left: -5, rotate: -15, swayDuration: 12000, swayRotation: 2, swayTranslateX: 0, swayTranslateY: 4 },
  { leaf: 'A', size: 0.8, opacity: 0.06, top: '62%', right: -10, rotate: 18, swayDuration: 11000, swayRotation: 2, swayTranslateX: 3, swayTranslateY: 0 },
  // BOTTOM ZONE
  { leaf: 'A', size: 1.15, opacity: 0.08, bottom: 50, left: -8, rotate: 175, swayDuration: 10000, swayRotation: 3, swayTranslateX: 2, swayTranslateY: 3 },
  { leaf: 'B', size: 0.75, opacity: 0.06, bottom: 120, left: 40, rotate: 155, swayDuration: 12000, swayRotation: 2, swayTranslateX: 0, swayTranslateY: 4 },
  { leaf: 'B', size: 0.5, opacity: 0.04, bottom: 30, left: '22%', rotate: 130, swayDuration: 15000, swayRotation: 2, swayTranslateX: 3, swayTranslateY: 0 },
  { leaf: 'A', size: 1.1, opacity: 0.08, bottom: 40, right: -5, rotate: -170, swayDuration: 13000, swayRotation: 2, swayTranslateX: 3, swayTranslateY: 0 },
  { leaf: 'B', size: 0.7, opacity: 0.055, bottom: 130, right: 30, rotate: -148, swayDuration: 11000, swayRotation: 3, swayTranslateX: 2, swayTranslateY: 3 },
  { leaf: 'B', size: 0.5, opacity: 0.04, bottom: 20, right: '20%', rotate: -135, swayDuration: 14000, swayRotation: 2, swayTranslateX: 0, swayTranslateY: 4 },
  { leaf: 'branch', size: 0.6, opacity: 0.04, bottom: -20, left: '38%', rotate: 180, swayDuration: 16000, swayRotation: 3, swayTranslateX: 2, swayTranslateY: 3 },
];

function SwayingLeaf({ config }: { config: LeafConfig }) {
  const rotation = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    const dur = config.swayDuration / 4;
    const easing = Easing.inOut(Easing.sin);

    rotation.value = withRepeat(
      withSequence(
        withTiming(config.swayRotation, { duration: dur, easing }),
        withTiming(-config.swayRotation * 0.75, { duration: dur, easing }),
        withTiming(0, { duration: dur, easing }),
      ),
      -1,
      true,
    );

    if (config.swayTranslateX) {
      translateX.value = withRepeat(
        withSequence(
          withTiming(config.swayTranslateX, { duration: dur, easing }),
          withTiming(-config.swayTranslateX * 0.67, { duration: dur, easing }),
          withTiming(0, { duration: dur, easing }),
        ),
        -1,
        true,
      );
    }

    if (config.swayTranslateY) {
      translateY.value = withRepeat(
        withSequence(
          withTiming(config.swayTranslateY, { duration: dur, easing }),
          withTiming(-config.swayTranslateY * 0.5, { duration: dur, easing }),
          withTiming(0, { duration: dur, easing }),
        ),
        -1,
        true,
      );
    }
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const posStyle: any = {
    position: 'absolute' as const,
    transform: [{ rotate: `${config.rotate}deg` }],
  };
  if (config.top !== undefined) posStyle.top = config.top;
  if (config.bottom !== undefined) posStyle.bottom = config.bottom;
  if (config.left !== undefined) posStyle.left = config.left;
  if (config.right !== undefined) posStyle.right = config.right;

  const LeafComponent =
    config.leaf === 'A' ? LeafA : config.leaf === 'B' ? LeafB : Branch;

  return (
    <Animated.View style={posStyle}>
      <Animated.View style={animStyle}>
        <LeafComponent size={config.size} opacity={config.opacity} />
      </Animated.View>
    </Animated.View>
  );
}

export function BackgroundLeaves() {
  return (
    <Animated.View style={styles.wrapper} pointerEvents="none">
      {LEAVES.map((config, i) => (
        <SwayingLeaf key={i} config={config} />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
});
