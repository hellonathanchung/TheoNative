import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, Switch, ScrollView, Modal, Linking, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as Clipboard from 'expo-clipboard';
import { useTheme, type ThemeColors } from '../theme';
import type { Preset } from '../types';
import type { useContractions } from '../hooks/useContractions';
import { PartnerSharing } from '../components/PartnerSharing';

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
  const { colors, mode, setMode } = useTheme();
  const s = useMemo(() => createStyles(colors, mode === 'dark'), [colors, mode]);
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, contractions, sessions } = app;
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [exported, setExported] = useState(false);

  const SettingRow = ({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) => (
    <View style={s.settingRow}>
      <View style={{ flex: 1, marginRight: 16 }}>
        <Text style={s.settingLabel}>{label}</Text>
        <Text style={s.settingDesc}>{desc}</Text>
      </View>
      {children}
    </View>
  );

  const Stepper = ({ value, unit, disabled, onDec, onInc }: {
    value: number; unit: string; disabled?: boolean; onDec: () => void; onInc: () => void;
  }) => (
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

  const exportCsv = async () => {
    const formatValue = (value: string | number | null | undefined) => {
      const text = value === null || value === undefined ? '' : String(value);
      if (text.includes('"') || text.includes(',') || text.includes('\n')) {
        return `"${text.replace(/"/g, '""')}"`;
      }
      return text;
    };

    const rows: string[] = [];
    rows.push(
      [
        'session_id',
        'session_started_at',
        'session_ended_at',
        'contraction_id',
        'contraction_start_at',
        'contraction_end_at',
        'duration_seconds',
        'intensity',
      ].join(','),
    );

    const addSessionRows = (
      sessionId: string,
      sessionStart: number | null,
      sessionEnd: number | null,
      items: typeof contractions,
    ) => {
      items.forEach((c) => {
        rows.push(
          [
            formatValue(sessionId),
            formatValue(sessionStart ? new Date(sessionStart).toISOString() : ''),
            formatValue(sessionEnd ? new Date(sessionEnd).toISOString() : ''),
            formatValue(c.id),
            formatValue(new Date(c.startTime).toISOString()),
            formatValue(c.endTime ? new Date(c.endTime).toISOString() : ''),
            formatValue(c.duration ?? ''),
            formatValue(c.intensity ?? ''),
          ].join(','),
        );
      });
    };

    sessions.forEach((session) => {
      addSessionRows(
        session.id,
        session.startedAt,
        session.endedAt,
        session.contractions,
      );
    });

    if (contractions.length > 0) {
      const currentStart = contractions[0]?.startTime ?? null;
      const currentEnd =
        contractions[contractions.length - 1]?.endTime ?? null;
      addSessionRows('current', currentStart, currentEnd, contractions);
    }

    await Clipboard.setStringAsync(rows.join('\n'));
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  return (
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
                backgroundColor: settings.preset === p.id ? colors.deepGreen : colors.beige,
              },
            ]}
            onPress={() => selectPreset(p)}
          >
            <Text style={[s.presetBtnLabel, {
              color: settings.preset === p.id ? colors.cream : colors.textSecondary,
            }]}>
              {p.label}
            </Text>
            <Text style={[s.presetBtnDesc, {
              color: settings.preset === p.id ? colors.cream : colors.textMuted,
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
          trackColor={{ false: colors.beige, true: colors.green }}
          thumbColor={settings.notificationsEnabled ? colors.deepGreen : colors.textMuted}
        />
      </SettingRow>
      <SettingRow label="Vibration" desc="Haptic feedback on tap">
        <Switch
          value={settings.hapticEnabled}
          onValueChange={(v) => updateSettings({ hapticEnabled: v })}
          trackColor={{ false: colors.beige, true: colors.green }}
          thumbColor={settings.hapticEnabled ? colors.deepGreen : colors.textMuted}
        />
      </SettingRow>
      <SettingRow label="Track intensity" desc="Note mild, moderate, or strong after each contraction">
        <Switch
          value={settings.intensityEnabled}
          onValueChange={(v) => updateSettings({ intensityEnabled: v })}
          trackColor={{ false: colors.beige, true: colors.green }}
          thumbColor={settings.intensityEnabled ? colors.deepGreen : colors.textMuted}
        />
      </SettingRow>

      <Text style={[s.sectionLabel, { marginTop: 24 }]}>APPEARANCE</Text>
      <SettingRow label="Theme" desc="Light or dark appearance">
        <View style={s.themeToggle}>
          <Pressable
            style={[s.themeOption, mode === 'light' && s.themeOptionActive]}
            onPress={() => setMode('light')}
          >
            <Text style={[s.themeOptionText, mode === 'light' && s.themeOptionTextActive]}>Light</Text>
          </Pressable>
          <Pressable
            style={[s.themeOption, mode === 'dark' && s.themeOptionActive]}
            onPress={() => setMode('dark')}
          >
            <Text style={[s.themeOptionText, mode === 'dark' && s.themeOptionTextActive]}>Dark</Text>
          </Pressable>
        </View>
      </SettingRow>

      {/* Partner Sharing */}
      <Text style={[s.sectionLabel, { marginTop: 24 }]}>PARTNER SHARING</Text>
      <PartnerSharing />

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
        <Pressable style={s.exportBtn} onPress={exportCsv}>
          <Text style={s.exportBtnText}>
            {exported ? 'CSV Copied' : 'Export CSV'}
          </Text>
        </Pressable>
        <Text style={s.exportHint}>
          Copies contractions and sessions to your clipboard.
        </Text>
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
  );
}

const createStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 20, fontWeight: '600', color: colors.textPrimary, paddingHorizontal: 20, paddingBottom: 8 },
  sectionLabel: { fontSize: 11, color: colors.textMuted, letterSpacing: 1.5, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 8, marginTop: 8 },
  presetBtn: { width: '48%', padding: 12, borderRadius: 12, alignItems: 'center' },
  presetBtnLabel: { fontSize: 15, fontWeight: '600' },
  presetBtnDesc: { fontSize: 10, marginTop: 2 },
  presetDescription: { fontSize: 13, color: colors.textSecondary, paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12, lineHeight: 20 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: colors.beige },
  settingLabel: { fontSize: 15, color: colors.textPrimary },
  settingDesc: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  themeToggle: { flexDirection: 'row', backgroundColor: colors.beige, padding: 4, borderRadius: 14 },
  themeOption: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10 },
  themeOptionActive: { backgroundColor: colors.deepGreen },
  themeOptionText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  themeOptionTextActive: { color: colors.cream },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.beige, alignItems: 'center', justifyContent: 'center' },
  stepBtnText: { fontSize: 18, fontWeight: '600', color: colors.deepGreen },
  stepValue: { fontSize: 17, fontWeight: '600', color: colors.textPrimary },
  stepUnit: { fontSize: 10, color: colors.textMuted },
  supportSection: { paddingHorizontal: 20, paddingVertical: 12 },
  supportTitle: { fontSize: 15, color: colors.textPrimary, marginBottom: 4 },
  supportDesc: { fontSize: 12, color: colors.textMuted, lineHeight: 18, marginBottom: 12 },
  donateBtn: { paddingVertical: 10, paddingHorizontal: 24, backgroundColor: colors.beige, borderRadius: 12, alignSelf: 'flex-start' },
  donateBtnText: { fontSize: 14, fontWeight: '500', color: colors.deepGreen },
  clearBtn: { paddingVertical: 10, paddingHorizontal: 24, backgroundColor: colors.beige, borderRadius: 12, alignSelf: 'flex-start' },
  clearBtnText: { fontSize: 14, fontWeight: '500', color: colors.danger },
  exportBtn: { marginTop: 10, paddingVertical: 10, paddingHorizontal: 24, backgroundColor: colors.beige, borderRadius: 12, alignSelf: 'flex-start' },
  exportBtnText: { fontSize: 14, fontWeight: '500', color: colors.deepGreen },
  exportHint: { fontSize: 11, color: colors.textMuted, marginTop: 6 },
  disclaimer: { textAlign: 'center', fontSize: 12, color: colors.textMuted, paddingTop: 32, paddingHorizontal: 20, lineHeight: 18 },
  version: { textAlign: 'center', fontSize: 11, color: colors.textMuted, paddingVertical: 8, opacity: 0.6 },
  modalOverlay: { flex: 1, backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(46,59,46,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: colors.cream, borderRadius: 20, paddingVertical: 28, paddingHorizontal: 24, width: '100%', maxWidth: 320, alignItems: 'center' },
  modalTitle: { fontSize: 17, fontWeight: '600', color: colors.textPrimary, marginTop: 8, marginBottom: 4 },
  modalBody: { fontSize: 13, color: colors.textSecondary, lineHeight: 20, textAlign: 'center', marginBottom: 20 },
  modalDeleteBtn: { width: '100%', padding: 14, borderRadius: 12, backgroundColor: colors.danger, alignItems: 'center', marginBottom: 10 },
  modalDeleteText: { fontSize: 15, fontWeight: '600', color: colors.white },
  modalCancelBtn: { width: '100%', padding: 12, borderRadius: 12, alignItems: 'center' },
  modalCancelText: { fontSize: 14, fontWeight: '500', color: colors.textMuted },
});
