import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTimer } from '../hooks/useTimer';
import { formatDuration } from '../utils/format';
import { Colors } from '../theme';
import type { useContractions } from '../hooks/useContractions';
import { FunFacts } from '../components/FunFacts';
import { DinoGame } from '../components/DinoGame';
import { BubbleGame } from '../components/BubbleGame';
import { DifficultySelector } from '../components/DifficultySelector';
import { DINO_CONFIGS, BUBBLE_CONFIGS } from '../utils/gameConfig';
import type { GameDifficulty } from '../types';

interface Props {
  app: ReturnType<typeof useContractions>;
}

export function RelaxScreen({ app }: Props) {
  const insets = useSafeAreaInsets();
  const elapsed = useTimer(app.isActive, app.activeStart);

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
            { backgroundColor: app.isActive ? Colors.danger : Colors.terracotta },
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
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <FunFacts />

        <View style={s.divider} />

        <DinoGame
          config={DINO_CONFIGS[app.settings.dinoDifficulty]}
          headerExtra={
            <DifficultySelector
              value={app.settings.dinoDifficulty}
              onChange={(d: GameDifficulty) => app.updateSettings({ dinoDifficulty: d })}
            />
          }
        />

        <View style={s.divider} />

        <BubbleGame
          config={BUBBLE_CONFIGS[app.settings.bubbleDifficulty]}
          headerExtra={
            <DifficultySelector
              value={app.settings.bubbleDifficulty}
              onChange={(d: GameDifficulty) => app.updateSettings({ bubbleDifficulty: d })}
            />
          }
        />

        <Text style={s.footer}>
          Take a deep breath. You're doing amazing. 🌿
        </Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  timerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.beige,
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
    backgroundColor: Colors.danger,
  },
  timerBarTextActive: {
    fontSize: 22,
    fontWeight: '500',
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  timerBarTextIdle: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  timerBarButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  timerBarButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
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
    backgroundColor: Colors.beige,
    marginTop: 8,
    marginBottom: 16,
  },
  footer: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingTop: 16,
    paddingBottom: 24,
    lineHeight: 22,
  },
});
