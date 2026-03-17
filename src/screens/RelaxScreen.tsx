import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTimer } from '../hooks/useTimer';
import { formatDuration } from '../utils/format';
import { useTheme, type ThemeColors } from '../theme';
import type { useContractions } from '../hooks/useContractions';
import { FunFacts } from '../components/FunFacts';
import { DinoGame } from '../components/DinoGame';
import { BubbleGame } from '../components/BubbleGame';
import { DifficultySelector } from '../components/DifficultySelector';
import { DINO_CONFIGS, BUBBLE_CONFIGS } from '../utils/gameConfig';
import type { GameDifficulty } from '../types';
import { useSwipeLock } from '../contexts/SwipeLockContext';

interface Props {
  app: ReturnType<typeof useContractions>;
}

export function RelaxScreen({ app }: Props) {
  const { colors } = useTheme();
  const s = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const elapsed = useTimer(app.isActive, app.activeStart);
  const dinoConfig = DINO_CONFIGS[app.settings.dinoDifficulty] ?? DINO_CONFIGS.normal;
  const bubbleConfig = BUBBLE_CONFIGS[app.settings.bubbleDifficulty] ?? BUBBLE_CONFIGS.normal;
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const swipeLock = useSwipeLock();

  return (
    <View style={[s.container, { paddingTop: insets.top + 16 }]}>
        {/* Title */}
        <Text style={s.title}>Relax</Text>

      {/* Compact contraction timer bar */}
      <View style={s.timerBar}>
        <View style={s.timerBarLeft}>
          {app.isActive ? (
            <>
              <View style={s.liveDot} />
              <Text style={s.timerBarTextActive}>{formatDuration(elapsed)}</Text>
            </>
          ) : (
            <Text style={s.timerBarTextIdle}>
              {app.contractions.length > 0
                ? `${app.contractions.length} contraction${app.contractions.length !== 1 ? 's' : ''}`
                : 'No contractions yet'}
            </Text>
          )}
        </View>
        <Pressable
          style={[
            s.timerBarButton,
            { backgroundColor: app.isActive ? colors.danger : colors.terracotta },
          ]}
          onPress={app.isActive ? app.stopContraction : app.startContraction}
        >
          <Text style={s.timerBarButtonText}>
            {app.isActive ? 'Stop' : 'Start'}
          </Text>
        </Pressable>
      </View>

      {/* Scrollable content */}
      <ScrollView
        style={s.scrollView}
        contentContainerStyle={[s.scrollContent, { paddingBottom: 24 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        scrollEnabled={scrollEnabled}
      >
        <FunFacts
          onSwipeStart={() => { setScrollEnabled(false); swipeLock.lock(); }}
          onSwipeEnd={() => { setScrollEnabled(true); swipeLock.unlock(); }}
        />

        <View style={s.divider} />

        <GameErrorBoundary label="Sprout Jump" styles={s}>
          <DinoGame
            config={dinoConfig}
            headerExtra={
              <DifficultySelector
                value={app.settings.dinoDifficulty}
                onChange={(d: GameDifficulty) => app.updateSettings({ dinoDifficulty: d })}
              />
            }
          />
        </GameErrorBoundary>

        <View style={s.divider} />

        <GameErrorBoundary label="Bubble Pop" styles={s}>
          <BubbleGame
            config={bubbleConfig}
            headerExtra={
              <DifficultySelector
                value={app.settings.bubbleDifficulty}
                onChange={(d: GameDifficulty) => app.updateSettings({ bubbleDifficulty: d })}
              />
            }
          />
        </GameErrorBoundary>

        <Text style={s.footer}>
          Take a deep breath. You're doing amazing. 🌿
        </Text>
      </ScrollView>
    </View>
  );
}

class GameErrorBoundary extends React.Component<{ label: string; styles: ReturnType<typeof createStyles>; children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { label: string; styles: ReturnType<typeof createStyles>; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    // Intentionally empty: we just show a fallback view.
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={this.props.styles.gameFallback}>
        <Text style={this.props.styles.gameFallbackTitle}>{this.props.label} is unavailable</Text>
        <Text style={this.props.styles.gameFallbackBody}>
          {Platform.OS === 'web'
            ? 'Unable to load the game renderer. Check your browser supports WebAssembly.'
            : 'If you are running Expo Go, build a dev client to enable Skia.'}
        </Text>
      </View>
    );
  }
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  timerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.beige,
    marginHorizontal: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 12,
  },
  timerBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
  timerBarTextActive: {
    fontSize: 22,
    fontWeight: '500',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  timerBarTextIdle: {
    fontSize: 13,
    color: colors.textMuted,
  },
  timerBarButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  timerBarButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  divider: {
    height: 1,
    backgroundColor: colors.beige,
    marginTop: 8,
    marginBottom: 16,
  },
  gameFallback: {
    backgroundColor: colors.beige,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  gameFallbackTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  gameFallbackBody: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  footer: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    paddingTop: 16,
    paddingBottom: 24,
    lineHeight: 22,
  },
});
