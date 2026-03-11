import React, { useMemo, useState, useRef } from 'react';
import { View, Text, Pressable, ScrollView, Dimensions, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, type ThemeColors } from '../theme';
import type { Preset } from '../types';

interface Props {
  onComplete: (preset: Preset) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PRESETS: { id: Exclude<Preset, 'custom'>; label: string; desc: string }[] = [
  {
    id: '5-1-1',
    label: '5-1-1',
    desc: 'Contractions 5 min apart, lasting 1 min, for 1 hour. Most common guideline for first-time parents.',
  },
  {
    id: '4-1-1',
    label: '4-1-1',
    desc: 'Contractions 4 min apart, lasting 1 min, for 1 hour. Often recommended for second+ pregnancies.',
  },
  {
    id: '3-1-1',
    label: '3-1-1',
    desc: 'Contractions 3 min apart, lasting 1 min, for 1 hour. Used when your provider advises closer monitoring.',
  },
];

export function Onboarding({ onComplete }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const s = useMemo(() => createStyles(colors), [colors]);
  const [step, setStep] = useState(0);
  const [selectedPreset, setSelectedPreset] = useState<Exclude<Preset, 'custom'>>('5-1-1');
  const scrollRef = useRef<ScrollView>(null);

  const goTo = (idx: number) => {
    setStep(idx);
    scrollRef.current?.scrollTo({ x: idx * SCREEN_WIDTH, animated: true });
  };

  const next = () => {
    if (step < 2) goTo(step + 1);
    else onComplete(selectedPreset);
  };

  const skip = () => onComplete(selectedPreset);

  return (
    <View style={[s.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={s.viewport}
      >
        {/* Screen 1: Welcome */}
        <View style={[s.screen, { width: SCREEN_WIDTH }]}>
          <View style={s.screenContent}>
            <Text style={s.welcomeEmoji}>{'\uD83C\uDF3F'}</Text>
            <Text style={s.appName}>Theo</Text>
            <Text style={s.tagline}>A calm contraction timer for your journey</Text>
            <View style={{ height: 32 }} />
            <Text style={s.disclaimer}>
              Theo is an informational tool, not a medical device. Always follow your care provider's guidance.
            </Text>
          </View>
        </View>

        {/* Screen 2: Choose Rule */}
        <View style={[s.screen, { width: SCREEN_WIDTH }]}>
          <View style={s.screenContent}>
            <Text style={s.screenTitle}>Choose an alert rule</Text>
            <Text style={s.screenSubtitle}>
              Your provider may recommend one. You can always change this later in Settings.
            </Text>
            <View style={s.presetList}>
              {PRESETS.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => setSelectedPreset(p.id)}
                  style={[
                    s.presetCard,
                    {
                      backgroundColor: selectedPreset === p.id ? colors.terracotta : colors.warmBeige,
                    },
                  ]}
                >
                  <Text style={[
                    s.presetLabel,
                    { color: selectedPreset === p.id ? colors.cream : colors.textPrimary },
                  ]}>
                    {p.label}
                  </Text>
                  <Text style={[
                    s.presetDesc,
                    { color: selectedPreset === p.id ? 'rgba(245,250,245,0.85)' : colors.textSecondary },
                  ]}>
                    {p.desc}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Screen 3: How It Works */}
        <View style={[s.screen, { width: SCREEN_WIDTH }]}>
          <View style={s.screenContent}>
            <Text style={s.screenTitle}>How it works</Text>
            <View style={s.stepsContainer}>
              {[
                { num: '1', title: 'Tap Start', desc: 'when a contraction begins' },
                { num: '2', title: 'Tap Stop', desc: 'when it ends' },
                { num: '3', title: 'Theo tracks the pattern', desc: 'and alerts you when it\'s time to go' },
              ].map((item) => (
                <View key={item.num} style={s.stepItem}>
                  <View style={s.stepNum}>
                    <Text style={s.stepNumText}>{item.num}</Text>
                  </View>
                  <View>
                    <Text style={s.stepTitle}>{item.title}</Text>
                    <Text style={s.stepDesc}>{item.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom controls */}
      <View style={s.bottomBar}>
        <View style={s.dotsRow}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                s.dot,
                {
                  backgroundColor: step === i ? colors.terracotta : colors.warmBeige,
                  width: step === i ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        <View style={s.btnRow}>
          {step < 2 && (
            <Pressable onPress={skip} style={s.skipBtn}>
              <Text style={s.skipText}>Skip</Text>
            </Pressable>
          )}
          <Pressable onPress={next} style={s.nextBtn}>
            <Text style={s.nextText}>{step === 2 ? 'Get Started' : 'Next'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  viewport: { flex: 1 },
  screen: { height: '100%', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  screenContent: { alignItems: 'center', width: '100%', maxWidth: 340 },
  welcomeEmoji: { fontSize: 48, marginBottom: 8 },
  appName: { fontSize: 40, fontWeight: '300', color: colors.textPrimary, letterSpacing: 2, marginBottom: 8 },
  tagline: { fontSize: 16, color: colors.textSecondary, lineHeight: 24, textAlign: 'center' },
  disclaimer: { fontSize: 12, color: colors.textMuted, lineHeight: 18, textAlign: 'center', paddingHorizontal: 16 },
  screenTitle: { fontSize: 22, fontWeight: '600', color: colors.textPrimary, marginBottom: 8, textAlign: 'center' },
  screenSubtitle: { fontSize: 14, color: colors.textMuted, lineHeight: 22, textAlign: 'center', marginBottom: 24 },
  presetList: { width: '100%', gap: 12 },
  presetCard: { padding: 16, borderRadius: 16, gap: 4 },
  presetLabel: { fontSize: 18, fontWeight: '600' },
  presetDesc: { fontSize: 13, lineHeight: 20 },
  stepsContainer: { width: '100%', gap: 20, marginTop: 16 },
  stepItem: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  stepNum: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.terracotta, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontSize: 16, fontWeight: '600', color: colors.cream },
  stepTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginTop: 4 },
  stepDesc: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  bottomBar: { paddingHorizontal: 24, paddingBottom: 32 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 20 },
  dot: { height: 8, borderRadius: 4 },
  btnRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  skipBtn: { padding: 14 },
  skipText: { fontSize: 15, color: colors.textMuted },
  nextBtn: { flex: 1, padding: 14, backgroundColor: colors.terracotta, borderRadius: 12, alignItems: 'center' },
  nextText: { fontSize: 16, fontWeight: '600', color: colors.cream },
});
