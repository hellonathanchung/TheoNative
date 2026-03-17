import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { getIntensityColor } from '../utils/intensity';

const TRACK_HEIGHT = 14;
const THUMB_SIZE = 28;

interface Props {
  value: number; // 1–50
  onChange: (v: number) => void;
  readOnly?: boolean;
}

export function IntensitySlider({ value, onChange, readOnly = false }: Props) {
  const [trackWidth, setTrackWidth] = useState(0);
  const trackWidthSV = useSharedValue(0);
  const thumbX = useSharedValue(0);
  const startX = useSharedValue(0);
  const [displayValue, setDisplayValue] = useState(value);

  // Sync thumb position when value or trackWidth changes
  useEffect(() => {
    if (trackWidth > 0) {
      thumbX.value = ((value - 1) / 49) * trackWidth;
      setDisplayValue(value);
    }
  }, [value, trackWidth]);

  const clampedX = (x: number) => Math.min(Math.max(0, x), trackWidthSV.value);

  const xToValue = (x: number): number => {
    'worklet';
    const w = trackWidthSV.value;
    if (w === 0) return 1;
    return Math.round((Math.min(Math.max(0, x), w) / w) * 49) + 1;
  };

  const updateDisplay = (v: number) => {
    setDisplayValue(v);
    onChange(v);
  };

  const pan = Gesture.Pan()
    .enabled(!readOnly)
    .onBegin(() => {
      startX.value = thumbX.value;
    })
    .onUpdate((e) => {
      const newX = clampedX(startX.value + e.translationX);
      thumbX.value = newX;
      const newValue = xToValue(newX);
      runOnJS(updateDisplay)(newValue);
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX.value - THUMB_SIZE / 2 }],
  }));

  const thumbColor = getIntensityColor(displayValue);

  return (
    <View
      style={styles.container}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        setTrackWidth(w);
        trackWidthSV.value = w;
        thumbX.value = ((value - 1) / 49) * w;
      }}
    >
      {trackWidth > 0 && (
        <>
          {/* Gradient track */}
          <Svg
            width={trackWidth}
            height={TRACK_HEIGHT}
            style={styles.track}
          >
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

          {/* Draggable thumb */}
          <GestureDetector gesture={pan}>
            <Animated.View
              style={[
                styles.thumb,
                { backgroundColor: thumbColor, borderColor: thumbColor },
                thumbStyle,
              ]}
            />
          </GestureDetector>
        </>
      )}

      {/* Value label */}
      <View style={styles.labelRow}>
        <Text style={styles.labelText}>1</Text>
        <Text style={[styles.currentValue, { color: thumbColor }]}>
          {displayValue}
        </Text>
        <Text style={styles.labelText}>50</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 8,
  },
  track: {
    marginVertical: (THUMB_SIZE - TRACK_HEIGHT) / 2,
  },
  thumb: {
    position: 'absolute',
    top: 0,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
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
  },
  labelText: {
    fontSize: 11,
    color: '#98A398',
  },
  currentValue: {
    fontSize: 20,
    fontWeight: '700',
  },
});
