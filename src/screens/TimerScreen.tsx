import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTimer, useTimeSinceLast } from '../hooks/useTimer';
import { formatDuration, formatTime, formatInterval } from '../utils/format';
import { Colors } from '../theme';
import type { Contraction } from '../types';
import type { useContractions } from '../hooks/useContractions';
import { IntensityPicker } from '../components/IntensityPicker';
import { ContractionDetailModal } from '../components/ContractionDetailModal';
import { ScreenBackground } from '../components/ScreenBackground';

interface Props {
  app: ReturnType<typeof useContractions>;
}

export function TimerScreen({ app }: Props) {
  const insets = useSafeAreaInsets();
  const elapsed = useTimer(app.isActive, app.activeStart);
  const lastContraction = app.contractions[app.contractions.length - 1] ?? null;
  const timeSinceLast = useTimeSinceLast(app.isActive, lastContraction?.endTime ?? null);
  const recent = app.contractions.slice(-5).reverse();
  const [selectedContractionId, setSelectedContractionId] = useState<string | null>(null);
  const selectedContraction = selectedContractionId
    ? app.contractions.find((c) => c.id === selectedContractionId) ?? null
    : null;

  const getInterval = (c: Contraction): number | null => {
    const idx = app.contractions.findIndex((a) => a.id === c.id);
    const prev = idx > 0 ? app.contractions[idx - 1] : null;
    return prev?.endTime ? (c.startTime - prev.endTime) / 1000 : null;
  };

  const urgency = app.getUrgencyState();
  const buttonBg =
    urgency === 'approaching'
      ? Colors.softCoral
      : app.isActive
        ? Colors.terracotta
        : Colors.warmAmber;

  // Animated breathing for active button
  const scale = useRef(new Animated.Value(1)).current;
  const animRef = useRef<any>(null);
  const bgOpacity = useRef(new Animated.Value(0)).current;
  const bgLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (app.isActive) {
      // loop between 1.05 and 1.08
      animRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.08, duration: 1000, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        ]),
      );
      animRef.current.start();
    } else {
      animRef.current?.stop?.();
      Animated.timing(scale, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    }
    return () => { animRef.current?.stop?.(); };
  }, [app.isActive, scale]);

  useEffect(() => {
    if (app.isActive) {
      bgLoopRef.current?.stop?.();
      bgOpacity.setValue(0);
      Animated.timing(bgOpacity, { toValue: 0.35, duration: 1200, useNativeDriver: true }).start(() => {
        const loop = Animated.loop(
          Animated.sequence([
            Animated.timing(bgOpacity, { toValue: 0.5, duration: 2500, useNativeDriver: true }),
            Animated.timing(bgOpacity, { toValue: 0.3, duration: 2500, useNativeDriver: true }),
          ]),
        );
        bgLoopRef.current = loop;
        loop.start();
      });
    } else {
      bgLoopRef.current?.stop?.();
      Animated.timing(bgOpacity, { toValue: 0, duration: 500, useNativeDriver: true }).start();
    }
    return () => { bgLoopRef.current?.stop?.(); };
  }, [app.isActive, bgOpacity]);

  return (
    <ScreenBackground>
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: Colors.softGreen, opacity: bgOpacity },
        ]}
      />
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      {/* Counter */}
      {app.contractions.length > 0 && (
        <Text style={styles.counter}>
          {app.contractions.length} contraction{app.contractions.length !== 1 ? 's' : ''}
        </Text>
      )}

      {/* Timer display */}
      <View style={styles.timerSection}>
        <Text style={styles.timerLabel}>
          {app.isActive ? 'CONTRACTION DURATION' : 'TIME SINCE LAST'}
        </Text>
        <Text style={styles.timerValue}>
          {app.isActive
            ? formatDuration(elapsed)
            : lastContraction?.endTime
              ? timeSinceLast >= 3600
                ? formatInterval(timeSinceLast)
                : formatDuration(timeSinceLast)
              : '--:--'}
        </Text>
      </View>

      {/* Recent contractions or empty state */}
      <View style={styles.recentSection}>
        {recent.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Ready when you are</Text>
            <Text style={styles.emptyDesc}>
              Tap the button below when a contraction starts. Theo will track
              the pattern for you.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionHeader}>RECENT</Text>
            <FlatList
              data={recent}
              keyExtractor={(c) => c.id}
              renderItem={({ item, index }) => {
                const interval = getInterval(item);
                return (
                  <Pressable onPress={() => setSelectedContractionId(item.id)}>
                    <View style={styles.row}>
                      <Text style={styles.rowTime}>
                        {formatTime(item.startTime)}
                      </Text>
                      <View style={styles.rowDetail}>
                        <Text style={styles.rowValue}>
                          {item.duration ? formatDuration(item.duration) : '--'}
                        </Text>
                        <Text style={styles.rowLabel}>duration</Text>
                      </View>
                      <View style={styles.rowDetail}>
                        <Text
                          style={[styles.rowValue, { color: Colors.deepGreen }]}
                        >
                          {interval !== null ? formatInterval(interval) : '--'}
                        </Text>
                        <Text style={styles.rowLabel}>apart</Text>
                      </View>
                      {item.intensity && (
                        <View
                          style={[
                            styles.intensityDot,
                            {
                              backgroundColor:
                                item.intensity === 'mild'
                                  ? Colors.intensityMild
                                  : item.intensity === 'moderate'
                                    ? Colors.intensityModerate
                                    : Colors.intensityStrong,
                            },
                          ]}
                        />
                      )}
                    </View>
                  </Pressable>
                );
              }}
              scrollEnabled={false}
            />
          </>
        )}
      </View>

      {/* New Session */}
      {app.contractions.length > 0 && !app.isActive && (
        <View style={styles.newSessionWrapper}>
          <Pressable
            style={styles.newSessionBtn}
            onPress={app.newSession}
          >
            <Text style={styles.newSessionText}>New Session</Text>
          </Pressable>
        </View>
      )}

      {/* Big Start/Stop button */}
      <View style={styles.buttonWrapper}>
        <Animated.View
          style={[
            styles.bigButton,
            {
              backgroundColor: buttonBg,
              shadowColor: app.isActive ? Colors.deepGreen : Colors.warmAmber,
              transform: [{ scale }],
            },
          ]}
        >
          <Pressable
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 80, backgroundColor: 'transparent' }}
            onPress={app.isActive ? app.stopContraction : app.startContraction}
          >
            <Text style={styles.bigButtonLabel}>TAP TO</Text>
            <Text style={styles.bigButtonAction}>
              {app.isActive ? 'Stop' : 'Start'}
            </Text>
          </Pressable>
        </Animated.View>
      </View>

      {/* Intensity picker */}
      {app.pendingIntensityId && (
        <IntensityPicker
          onSelect={(level) => app.setIntensity(app.pendingIntensityId!, level)}
          onSkip={app.dismissIntensityPrompt}
        />
      )}

      {/* Contraction detail modal */}
      <ContractionDetailModal
        contraction={selectedContraction}
        contractions={app.contractions}
        onClose={() => setSelectedContractionId(null)}
        onUpdate={app.updateContraction}
        onDelete={app.deleteContraction}
      />
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 0,
  },
  counter: {
    textAlign: 'center',
    fontSize: 13,
    color: Colors.textMuted,
    letterSpacing: 1,
    paddingBottom: 4,
  },
  timerSection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  timerLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  timerValue: {
    fontSize: 56,
    fontWeight: '200',
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  recentSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 16,
  },
  emptyTitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 20,
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: Colors.cream,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.beige,
    marginBottom: 10,
  },
  rowTime: {
    width: 84,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  rowDetail: {
    flex: 1,
    alignItems: 'center',
  },
  rowValue: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  rowLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
  intensityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 12,
  },
  newSessionWrapper: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  newSessionBtn: {
    width: '100%',
    padding: 12,
    backgroundColor: Colors.beige,
    borderRadius: 12,
    alignItems: 'center',
  },
  newSessionText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  buttonWrapper: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 12,
  },
  bigButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.warmAmber,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  bigButtonLabel: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
    letterSpacing: 1,
  },
  bigButtonAction: {
    fontSize: 28,
    fontWeight: '600',
    color: Colors.white,
    marginTop: 4,
  },
});
