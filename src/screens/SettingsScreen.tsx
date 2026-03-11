import React, { useState } from 'react';
import { View, Text, Pressable, Switch, ScrollView, Modal, Linking, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { Colors } from '../theme';
import type { Preset } from '../types';
import type { useContractions } from '../hooks/useContractions';
import { ScreenBackground } from '../components/ScreenBackground';

interface Props {
  app: ReturnType<typeof useContractions>;
}

const PRESETS: { id: Preset; label: string; shortDesc: string; longDesc: string; freq: number; dur: number; window: number }[] = [
  {
    id: '5-1-1', label: '5-1-1', shortDesc: '5m / 1m / 1hr',
    longDesc: 'Contractions 5 minutes apart, lasting 1 minute, for 1 hour. Most common guideline for first-time parents.',
    freq: 5, dur: 60, window: 60,
  },
  {
    id: '4-1-1', label: '4-1-1', shortDesc: '4m / 1m / 1hr',
    longDesc: 'Contractions 4 minutes apart, lasting 1 minute, for 1 hour. Often recommended for second+ pregnancies.',
    freq: 4, dur: 60, window: 60,
  },
  {
    id: '3-1-1', label: '3-1-1', shortDesc: '3m / 1m / 1hr',
    longDesc: 'Contractions 3 minutes apart, lasting 1 minute, for 1 hour. Used when your healthcare provider advises closer monitoring.',
    freq: 3, dur: 60, window: 60,
  },
  {
    id: 'custom', label: 'Custom', shortDesc: 'Your rules',
    longDesc: 'Adjust each threshold below to match your care provider\'s guidance.',
    freq: 0, dur: 0, window: 0,
  },
];

export function SettingsScreen({ app }: Props) {
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = app;
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const selectPreset = (p: typeof PRESETS[number]) => {
    if (p.id === 'custom') {
      updateSettings({ preset: 'custom' });
    } else {
      updateSettings({
        preset: p.id,
        frequencyMinutes: p.freq,
        durationSeconds: p.dur,
        timeWindowMinutes: p.window,
      });
    }
  };

  const activePreset = PRESETS.find((p) => p.id === settings.preset);

  return (
    <ScreenBackground>
      <ScrollView
        style={[s.container, { paddingTop: insets.top }]}
        contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
      >
        <Text style={s.title}>Settings</Text>

      {/* Preset picker */}
      <Text style={s.sectionLabel}>ALERT RULE</Text>
      <View style={s.presetGrid}>
        {PRESETS.map((p) => (
          <Pressable
            key={p.id}
            style={[
              s.presetBtn,
              {
                backgroundColor: settings.preset === p.id ? Colors.deepGreen : Colors.beige,
              },
            ]}
            onPress={() => selectPreset(p)}
          >
            <Text style={[s.presetBtnLabel, {
              color: settings.preset === p.id ? Colors.cream : Colors.textSecondary,
            }]}>
              {p.label}
            </Text>
            <Text style={[s.presetBtnDesc, {
              color: settings.preset === p.id ? Colors.cream : Colors.textMuted,
            }]}>
              {p.shortDesc}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={s.presetDescription}>{activePreset?.longDesc}</Text>

      {/* Thresholds */}
      <Text style={s.sectionLabel}>THRESHOLDS</Text>
      <SettingRow label="Contractions apart" desc="How many minutes between contractions">
        <Stepper
          value={settings.frequencyMinutes}
          unit="min"
          disabled={settings.preset !== 'custom'}
          onDec={() => updateSettings({ frequencyMinutes: Math.max(1, settings.frequencyMinutes - 1) })}
          onInc={() => updateSettings({ frequencyMinutes: Math.min(15, settings.frequencyMinutes + 1) })}
        />
      </SettingRow>
      <SettingRow label="Contraction duration" desc="How long each contraction lasts">
        <Stepper
          value={settings.durationSeconds}
          unit="sec"
          disabled={settings.preset !== 'custom'}
          onDec={() => updateSettings({ durationSeconds: Math.max(20, settings.durationSeconds - 10) })}
          onInc={() => updateSettings({ durationSeconds: Math.min(120, settings.durationSeconds + 10) })}
        />
      </SettingRow>
      <SettingRow label="Time window" desc="How long the pattern must hold">
        <Stepper
          value={settings.timeWindowMinutes}
          unit="min"
          disabled={settings.preset !== 'custom'}
          onDec={() => updateSettings({ timeWindowMinutes: Math.max(15, settings.timeWindowMinutes - 15) })}
          onInc={() => updateSettings({ timeWindowMinutes: Math.min(120, settings.timeWindowMinutes + 15) })}
        />
      </SettingRow>

      {/* Toggles */}
      <Text style={[s.sectionLabel, { marginTop: 24 }]}>PREFERENCES</Text>
      <SettingRow label="Notifications" desc="Alert when it's time to go">
        <Switch
          value={settings.notificationsEnabled}
          onValueChange={(v) => {
            if (v) Notifications.requestPermissionsAsync();
            updateSettings({ notificationsEnabled: v });
          }}
          trackColor={{ false: Colors.beige, true: Colors.green }}
          thumbColor={settings.notificationsEnabled ? Colors.deepGreen : Colors.textMuted}
        />
      </SettingRow>
      <SettingRow label="Vibration" desc="Haptic feedback on tap">
        <Switch
          value={settings.hapticEnabled}
          onValueChange={(v) => updateSettings({ hapticEnabled: v })}
          trackColor={{ false: Colors.beige, true: Colors.green }}
          thumbColor={settings.hapticEnabled ? Colors.deepGreen : Colors.textMuted}
        />
      </SettingRow>
      <SettingRow label="Track intensity" desc="Note mild, moderate, or strong after each contraction">
        <Switch
          value={settings.intensityEnabled}
          onValueChange={(v) => updateSettings({ intensityEnabled: v })}
          trackColor={{ false: Colors.beige, true: Colors.green }}
          thumbColor={settings.intensityEnabled ? Colors.deepGreen : Colors.textMuted}
        />
      </SettingRow>

      {/* Support */}
      <Text style={[s.sectionLabel, { marginTop: 24 }]}>SUPPORT</Text>
      <View style={s.supportSection}>
        <Text style={s.supportTitle}>Support Theo</Text>
        <Text style={s.supportDesc}>
          Theo is free and ad-free. If it helped during your journey, consider supporting us.
        </Text>
        <Pressable
          style={s.donateBtn}
          onPress={() => Linking.openURL('https://venmo.com/hellonathanchung')}
        >
          <Text style={s.donateBtnText}>Support on Venmo</Text>
        </Pressable>
      </View>

      {/* Data management */}
      <Text style={[s.sectionLabel, { marginTop: 24 }]}>DATA</Text>
      <View style={s.supportSection}>
        <Text style={s.supportDesc}>
          Remove all contractions, sessions, settings, and game scores from this device.
        </Text>
        <Pressable style={s.clearBtn} onPress={() => setShowClearConfirm(true)}>
          <Text style={s.clearBtnText}>Clear All Data</Text>
        </Pressable>
      </View>

      {/* Disclaimer */}
      <Text style={s.disclaimer}>
        Theo is a timing tool, not medical advice.{'\n'}Always consult your care provider.
      </Text>
      <Text style={s.version}>Theo v1.1.0</Text>

      {/* Clear data confirmation */}
      <Modal visible={showClearConfirm} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={{ fontSize: 28 }}>🗑️</Text>
            <Text style={s.modalTitle}>Clear all data?</Text>
            <Text style={s.modalBody}>
              This will permanently delete all your contractions, sessions, settings, and game high scores. This cannot be undone.
            </Text>
            <Pressable
              style={s.modalDeleteBtn}
              onPress={() => {
                app.resetAllData();
                setShowClearConfirm(false);
              }}
            >
              <Text style={s.modalDeleteText}>Yes, Clear Everything</Text>
            </Pressable>
            <Pressable
              style={s.modalCancelBtn}
              onPress={() => setShowClearConfirm(false)}
            >
              <Text style={s.modalCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      </ScrollView>
    </ScreenBackground>
  );
}

function SettingRow({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) {
  return (
    <View style={s.settingRow}>
      <View style={{ flex: 1, marginRight: 16 }}>
        <Text style={s.settingLabel}>{label}</Text>
        <Text style={s.settingDesc}>{desc}</Text>
      </View>
      {children}
    </View>
  );
}

function Stepper({ value, unit, disabled, onDec, onInc }: {
  value: number; unit: string; disabled?: boolean; onDec: () => void; onInc: () => void;
}) {
  return (
    <View style={[s.stepperRow, disabled && { opacity: 0.5 }]}>
      <Pressable onPress={disabled ? undefined : onDec} style={s.stepBtn}>
        <Text style={s.stepBtnText}>−</Text>
      </Pressable>
      <View style={{ alignItems: 'center', minWidth: 48 }}>
        <Text style={s.stepValue}>{value}</Text>
        <Text style={s.stepUnit}>{unit}</Text>
      </View>
      <Pressable onPress={disabled ? undefined : onInc} style={s.stepBtn}>
        <Text style={s.stepBtnText}>+</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 20, fontWeight: '600', color: Colors.textPrimary, paddingHorizontal: 20, paddingBottom: 8 },
  sectionLabel: { fontSize: 11, color: Colors.textMuted, letterSpacing: 1.5, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 8, marginTop: 8 },
  presetBtn: { width: '48%', padding: 12, borderRadius: 12, alignItems: 'center' },
  presetBtnLabel: { fontSize: 15, fontWeight: '600' },
  presetBtnDesc: { fontSize: 10, marginTop: 2 },
  presetDescription: { fontSize: 13, color: Colors.textSecondary, paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12, lineHeight: 20 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: Colors.beige },
  settingLabel: { fontSize: 15, color: Colors.textPrimary },
  settingDesc: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.beige, alignItems: 'center', justifyContent: 'center' },
  stepBtnText: { fontSize: 18, fontWeight: '600', color: Colors.deepGreen },
  stepValue: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  stepUnit: { fontSize: 10, color: Colors.textMuted },
  supportSection: { paddingHorizontal: 20, paddingVertical: 12 },
  supportTitle: { fontSize: 15, color: Colors.textPrimary, marginBottom: 4 },
  supportDesc: { fontSize: 12, color: Colors.textMuted, lineHeight: 18, marginBottom: 12 },
  donateBtn: { paddingVertical: 10, paddingHorizontal: 24, backgroundColor: Colors.beige, borderRadius: 12, alignSelf: 'flex-start' },
  donateBtnText: { fontSize: 14, fontWeight: '500', color: Colors.deepGreen },
  clearBtn: { paddingVertical: 10, paddingHorizontal: 24, backgroundColor: Colors.beige, borderRadius: 12, alignSelf: 'flex-start' },
  clearBtnText: { fontSize: 14, fontWeight: '500', color: Colors.danger },
  disclaimer: { textAlign: 'center', fontSize: 12, color: Colors.textMuted, paddingTop: 32, paddingHorizontal: 20, lineHeight: 18 },
  version: { textAlign: 'center', fontSize: 11, color: Colors.textMuted, paddingVertical: 8, opacity: 0.6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(46,59,46,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: Colors.cream, borderRadius: 20, paddingVertical: 28, paddingHorizontal: 24, width: '100%', maxWidth: 320, alignItems: 'center' },
  modalTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary, marginTop: 8, marginBottom: 4 },
  modalBody: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20, textAlign: 'center', marginBottom: 20 },
  modalDeleteBtn: { width: '100%', padding: 14, borderRadius: 12, backgroundColor: Colors.danger, alignItems: 'center', marginBottom: 10 },
  modalDeleteText: { fontSize: 15, fontWeight: '600', color: Colors.white },
  modalCancelBtn: { width: '100%', padding: 12, borderRadius: 12, alignItems: 'center' },
  modalCancelText: { fontSize: 14, fontWeight: '500', color: Colors.textMuted },
});
