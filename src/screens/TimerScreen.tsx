import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet, Animated, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTimer, useTimeSinceLast } from '../hooks/useTimer';
import { formatDuration, formatTime, formatInterval, groupWithDaySeparators } from '../utils/format';
import { useTheme, type ThemeColors } from '../theme';
import { DaySeparator } from '../components/DaySeparator';
import type { Contraction } from '../types';
import type { useContractions } from '../hooks/useContractions';
import { getIntensityBorderStyle } from '../utils/intensity';
import { IntensityPicker } from '../components/IntensityPicker';
import { ContractionDetailModal } from '../components/ContractionDetailModal';
import { useSharing, type MergedContraction } from '../contexts/SharingContext';

interface Props {
  app: ReturnType<typeof useContractions>;
}

export function TimerScreen({ app }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const elapsed = useTimer(app.isActive, app.activeStart);
  const sharing = useSharing();
  const merged = sharing.mergedContractions;
  const lastContraction = merged[merged.length - 1] ?? null;
  const timeSinceLast = useTimeSinceLast(app.isActive, lastContraction?.endTime ?? null);
  const recent = useMemo(
    () => groupWithDaySeparators(merged.slice(-5).reverse()),
    [merged],
  );
  const partnerInitial = sharing.partner?.email?.[0]?.toUpperCase() ?? 'P';
  const [selectedContractionId, setSelectedContractionId] = useState<string | null>(null);
  const [selectedIsPartner, setSelectedIsPartner] = useState(false);
  const [showAutoPause, setShowAutoPause] = useState(false);
  const selectedContraction = selectedContractionId
    ? merged.find((c) => c.id === selectedContractionId) ?? null
    : null;

  const getInterval = (c: Contraction): number | null => {
    const idx = merged.findIndex((a) => a.id === c.id);
    const prev = idx > 0 ? merged[idx - 1] : null;
    return prev?.endTime ? (c.startTime - prev.endTime) / 1000 : null;
  };

  const urgency = app.getUrgencyState();
  const buttonTone = useRef(new Animated.Value(0)).current;
  const targetTone = app.isActive ? 2 : urgency === 'approaching' ? 1 : 0;
  const buttonBg = buttonTone.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [colors.warmAmber, colors.softCoral, colors.terracotta],
  });
  const buttonShadow = app.isActive ? colors.deepGreen : colors.warmAmber;

  // Animated breathing for active button
  const scale = useRef(new Animated.Value(1)).current;
  const animRef = useRef<any>(null);
  const autoPauseShownFor = useRef<number | null>(null);

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
    Animated.timing(buttonTone, {
      toValue: targetTone,
      duration: 320,
      useNativeDriver: false,
    }).start();
  }, [buttonTone, targetTone]);

  useEffect(() => {
    if (!app.isActive) {
      setShowAutoPause(false);
      autoPauseShownFor.current = null;
      return;
    }
    const autoPauseThreshold = 5 * 60;
    if (
      app.activeStart &&
      elapsed >= autoPauseThreshold &&
      autoPauseShownFor.current !== app.activeStart
    ) {
      autoPauseShownFor.current = app.activeStart;
      setShowAutoPause(true);
    }
  }, [app.isActive, app.activeStart, elapsed]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      {/* Counter */}
      {merged.length > 0 && (
        <Text style={styles.counter}>
          {merged.length} contraction{merged.length !== 1 ? 's' : ''}
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
              keyExtractor={(item) => item.key}
              renderItem={({ item }) => {
                if (item.type === 'separator') {
                  return <DaySeparator label={item.label} />;
                }
                const c = item.contraction as MergedContraction;
                const interval = getInterval(c);
                const durationLabel = c.duration
                  ? formatDuration(c.duration)
                  : '--';
                const intervalLabel =
                  interval !== null ? formatInterval(interval) : '--';
                const borderStyle = c.intensity != null
                  ? getIntensityBorderStyle(c.intensity)
                  : { borderColor: colors.beige, borderWidth: 1 };
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Contraction at ${formatTime(
                      c.startTime,
                    )}, duration ${durationLabel}, ${intervalLabel} apart.`}
                    onPress={() => {
                      setSelectedContractionId(c.id);
                      setSelectedIsPartner(c.isPartner);
                    }}
                  >
                    <View style={[styles.row, borderStyle]}>
                      {c.isPartner && (
                        <View style={styles.partnerBadge}>
                          <Text style={styles.partnerBadgeText}>{partnerInitial}</Text>
                        </View>
                      )}
                      <Text style={styles.rowTime}>
                        {formatTime(c.startTime)}
                      </Text>
                      <View style={styles.rowDetail}>
                        <Text style={styles.rowValue}>
                          {durationLabel}
                        </Text>
                        <Text style={styles.rowLabel}>duration</Text>
                      </View>
                      <View style={styles.rowDetail}>
                        <Text
                          style={[styles.rowValue, { color: colors.deepGreen }]}
                        >
                          {intervalLabel}
                        </Text>
                        <Text style={styles.rowLabel}>apart</Text>
                      </View>
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
            accessibilityRole="button"
            accessibilityLabel="Start a new contraction session"
            onPress={app.newSession}
          >
            <Text style={styles.newSessionText}>New Session</Text>
          </Pressable>
        </View>
      )}

      {/* Big Start/Stop button */}
      <View style={styles.buttonWrapper}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Animated.View
            style={[
              styles.bigButton,
              {
                backgroundColor: buttonBg,
                shadowColor: buttonShadow,
              },
            ]}
          >
            <Pressable
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 80, backgroundColor: 'transparent' }}
              accessibilityRole="button"
              accessibilityLabel={app.isActive ? 'Stop contraction' : 'Start contraction'}
              onPress={app.isActive ? app.stopContraction : app.startContraction}
            >
              <Text style={styles.bigButtonLabel}>TAP TO</Text>
              <Text style={styles.bigButtonAction}>
                {app.isActive ? 'Stop' : 'Start'}
              </Text>
            </Pressable>
          </Animated.View>
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
        contractions={merged}
        onClose={() => { setSelectedContractionId(null); setSelectedIsPartner(false); }}
        onUpdate={app.updateContraction}
        onDelete={app.deleteContraction}
        readOnly={selectedIsPartner}
      />

      <Modal visible={showAutoPause} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Still contracting?</Text>
            <Text style={styles.modalBody}>
              This contraction has been running for a while. Would you like to
              stop it now?
            </Text>
            <Pressable
              style={styles.modalPrimaryBtn}
              onPress={() => {
                setShowAutoPause(false);
                app.stopContraction();
              }}
            >
              <Text style={styles.modalPrimaryText}>Stop Contraction</Text>
            </Pressable>
            <Pressable
              style={styles.modalSecondaryBtn}
              onPress={() => setShowAutoPause(false)}
            >
              <Text style={styles.modalSecondaryText}>Still Going</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 0,
  },
  counter: {
    textAlign: 'center',
    fontSize: 13,
    color: colors.textMuted,
    letterSpacing: 1,
    paddingBottom: 4,
  },
  timerSection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  timerLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  timerValue: {
    fontSize: 56,
    fontWeight: '200',
    color: colors.textPrimary,
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
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 20,
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.cream,
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'visible' as const,
  },
  rowTime: {
    width: 84,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  rowDetail: {
    flex: 1,
    alignItems: 'center',
  },
  rowValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  rowLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },
  partnerBadge: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.deepGreen,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  partnerBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.cream,
  },
  newSessionWrapper: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  newSessionBtn: {
    width: '100%',
    padding: 12,
    backgroundColor: colors.beige,
    borderRadius: 12,
    alignItems: 'center',
  },
  newSessionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
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
    shadowColor: colors.warmAmber,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  bigButtonLabel: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
    letterSpacing: 1,
  },
  bigButtonAction: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.white,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(46, 59, 46, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: colors.cream,
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  modalBody: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 18,
  },
  modalPrimaryBtn: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.terracotta,
    alignItems: 'center',
    marginBottom: 10,
  },
  modalPrimaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
  modalSecondaryBtn: {
    width: '100%',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSecondaryText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMuted,
  },
});
