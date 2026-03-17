import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, PanResponder } from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { getIntensityColor } from '../utils/intensity';
import { useSwipeLock } from '../contexts/SwipeLockContext';

const TRACK_HEIGHT = 14;
const THUMB_SIZE = 28;
const THUMB_RADIUS = THUMB_SIZE / 2;

interface Props {
  value: number; // 1–100
  onChange: (v: number) => void;
  readOnly?: boolean;
}

export function IntensitySlider({ value, onChange, readOnly = false }: Props) {
  const [trackWidth, setTrackWidth] = useState(0);
  const [thumbPosition, setThumbPosition] = useState(0); // pixels, 0..trackWidth
  const [displayValue, setDisplayValue] = useState(value);
  const { lock, unlock } = useSwipeLock();

  const trackWidthRef = useRef(0);
  const startPositionRef = useRef(0); // thumb x when gesture began
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const readOnlyRef = useRef(readOnly);
  readOnlyRef.current = readOnly;
  const lastHapticValueRef = useRef<number>(-1);
  const lockRef = useRef(lock);
  lockRef.current = lock;
  const unlockRef = useRef(unlock);
  unlockRef.current = unlock;

  // Sync thumb when value prop or trackWidth changes
  useEffect(() => {
    if (trackWidthRef.current > 0) {
      const x = ((value - 1) / 99) * trackWidthRef.current;
      setThumbPosition(x);
      setDisplayValue(value);
    }
  }, [value, trackWidth]);

  const clamp = (x: number) => Math.min(Math.max(0, x), trackWidthRef.current);

  const xToValue = (x: number): number => {
    const w = trackWidthRef.current;
    if (w === 0) return 1;
    return Math.round((clamp(x) / w) * 99) + 1;
  };

  const triggerHapticForValue = async (v: number) => {
    if (v === lastHapticValueRef.current) return;
    lastHapticValueRef.current = v;
    try {
      if (v <= 33) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else if (v <= 66) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
    } catch {
      // ignore
    }
  };

  const applyX = (x: number) => {
    const clamped = clamp(x);
    setThumbPosition(clamped);
    const v = xToValue(clamped);
    setDisplayValue(v);
    onChangeRef.current(v);
    triggerHapticForValue(v);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !readOnlyRef.current,
      onMoveShouldSetPanResponder: () => !readOnlyRef.current,
      // Capture horizontal touches before parent (TabNavigator) can steal them
      onMoveShouldSetPanResponderCapture: () => !readOnlyRef.current,
      onPanResponderGrant: (e) => {
        lockRef.current();
        // Tap anywhere on the track → jump thumb to that position
        const touchX = e.nativeEvent.locationX;
        startPositionRef.current = clamp(touchX);
        applyX(touchX);
      },
      onPanResponderMove: (_, gs) => {
        applyX(startPositionRef.current + gs.dx);
      },
      onPanResponderRelease: () => {
        unlockRef.current();
      },
      onPanResponderTerminate: () => {
        unlockRef.current();
      },
    }),
  ).current;

  const thumbColor = getIntensityColor(displayValue);

  return (
    <View style={styles.container}>
      {/* Gradient track + draggable thumb */}
      <View
        style={styles.trackWrapper}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          trackWidthRef.current = w;
          setTrackWidth(w);
          const initialX = ((value - 1) / 99) * w;
          setThumbPosition(initialX);
          setDisplayValue(value);
        }}
        {...panResponder.panHandlers}
      >
        {trackWidth > 0 && (
          <>
            {/* Gradient SVG track */}
            <Svg width={trackWidth} height={TRACK_HEIGHT} style={styles.svgTrack}>
              <Defs>
                <LinearGradient id="intensityGrad" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor="#7CB342" />
                  <Stop offset="0.33" stopColor="#F9A825" />
                  <Stop offset="0.66" stopColor="#E64A19" />
                  <Stop offset="1" stopColor="#C62828" />
                </LinearGradient>
              </Defs>
              <Rect
                x={0}
                y={0}
                width={trackWidth}
                height={TRACK_HEIGHT}
                rx={TRACK_HEIGHT / 2}
                fill="url(#intensityGrad)"
              />
            </Svg>

            {/* Thumb */}
            <View
              style={[
                styles.thumb,
                {
                  backgroundColor: thumbColor,
                  borderColor: thumbColor,
                  left: thumbPosition - THUMB_RADIUS,
                },
              ]}
              pointerEvents="none"
            />
          </>
        )}
      </View>

      {/* Range labels + current value */}
      <View style={styles.labelRow}>
        <Text style={styles.labelEdge}>1</Text>
        <Text style={[styles.labelCenter, { color: thumbColor }]}>{displayValue}</Text>
        <Text style={styles.labelEdge}>100</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 8,
  },
  trackWrapper: {
    width: '100%',
    height: THUMB_SIZE,
    justifyContent: 'center',
  },
  svgTrack: {
    // centered vertically within trackWrapper
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_RADIUS,
    borderWidth: 3,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 2,
  },
  labelEdge: {
    fontSize: 11,
    color: '#98A398',
  },
  labelCenter: {
    fontSize: 16,
    fontWeight: '700',
  },
});
