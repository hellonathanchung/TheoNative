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
              <Text style={s.timerBarText}>{formatDuration(elapsed)}</Text>
            </>
          ) : (
            <Text style={s.timerBarText}>
              {app.contractions.length} contraction
              {app.contractions.length !== 1 ? 's' : ''}
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

        <DinoGame />

        <View style={s.divider} />

        <BubbleGame />

        <Text style={s.footer}>
          Take a deep breath. You're doing amazing.
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
    fontSize: 22,
    fontWeight: '600',
    color: Colors.textPrimary,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  timerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.beige,
    marginHorizontal: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 16,
  },
  timerBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.danger,
  },
  timerBarText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
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
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.beige,
    marginVertical: 20,
  },
  footer: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 24,
    fontStyle: 'italic',
  },
});
