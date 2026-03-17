import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatDuration, formatInterval } from '../utils/format';
import { useTheme, type ThemeColors } from '../theme';
import type { Contraction, Intensity } from '../types';

interface Props {
  contraction: Contraction | null;
  contractions?: Contraction[];
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Contraction>) => void;
  onDelete: (id: string) => void;
  readOnly?: boolean;
}

export function ContractionDetailModal({ contraction: c, contractions, onClose, onUpdate, onDelete, readOnly }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const intensities: { id: Intensity; label: string; color: string }[] = useMemo(
    () => [
      { id: 'mild', label: 'Mild', color: colors.intensityMild },
      { id: 'moderate', label: 'Moderate', color: colors.intensityModerate },
      { id: 'strong', label: 'Strong', color: colors.intensityStrong },
    ],
    [colors],
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!c) return null;

  const interval = (() => {
    if (!contractions) return null;
    const idx = contractions.findIndex((a) => a.id === c.id);
    const prev = idx > 0 ? contractions[idx - 1] : null;
    return prev?.endTime ? (c.startTime - prev.endTime) / 1000 : null;
  })();

  const formatTimeOfDay = (ms: number) => {
    const d = new Date(ms);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const handleTimeChange = (field: 'startTime' | 'endTime', date: Date | undefined) => {
    if (!date || readOnly) return;
    // Preserve the original date, only update hours/minutes/seconds
    const original = new Date(c[field] ?? 0);
    const updated = new Date(original);
    updated.setHours(date.getHours(), date.getMinutes(), date.getSeconds());
    onUpdate(c.id, { [field]: updated.getTime() });
  };

  return (
    <Modal visible={true} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Contraction Details</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.closeBtn}>Done</Text>
            </Pressable>
          </View>

          <View style={styles.section}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Started</Text>
              <Text style={styles.fieldValue}>{formatTimeOfDay(c.startTime)}</Text>
            </View>
            {!readOnly && Platform.OS !== 'web' && (
              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={new Date(c.startTime)}
                  mode="time"
                  display="spinner"
                  onChange={(_, date) => handleTimeChange('startTime', date)}
                  style={styles.timePicker}
                  textColor={colors.textPrimary}
                />
              </View>
            )}

            {c.endTime && (
              <>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Ended</Text>
                  <Text style={styles.fieldValue}>{formatTimeOfDay(c.endTime)}</Text>
                </View>
                {!readOnly && Platform.OS !== 'web' && (
                  <View style={styles.pickerContainer}>
                    <DateTimePicker
                      value={new Date(c.endTime)}
                      mode="time"
                      display="spinner"
                      onChange={(_, date) => handleTimeChange('endTime', date)}
                      style={styles.timePicker}
                      textColor={colors.textPrimary}
                    />
                  </View>
                )}
              </>
            )}

            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Duration</Text>
              <Text style={styles.fieldValue}>{c.duration ? formatDuration(c.duration) : '--'}</Text>
            </View>

            {interval !== null && (
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Apart</Text>
                <Text style={[styles.fieldValue, { color: colors.terracotta }]}>
                  {formatInterval(interval)}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>INTENSITY</Text>
            <View style={styles.intensityRow}>
              {intensities.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => !readOnly && onUpdate(c.id, { intensity: item.id })}
                  style={styles.intensityBtn}
                >
                  <Text style={[
                    styles.intensityText,
                    {
                      color: item.color,
                      fontWeight: c.intensity === item.id ? '700' : '400',
                      opacity: c.intensity === item.id ? 1 : 0.5,
                    },
                  ]}>
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {!readOnly && (
            <View style={{ paddingVertical: 8 }}>
              {confirmDelete ? (
                <View style={styles.confirmRow}>
                  <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                    Delete this contraction?
                  </Text>
                  <Pressable
                    onPress={() => { onDelete(c.id); onClose(); }}
                    style={[styles.deleteBtn, { backgroundColor: colors.danger, borderColor: colors.danger }]}
                  >
                    <Text style={[styles.deleteBtnText, { color: colors.white }]}>Yes, Delete</Text>
                  </Pressable>
                  <Pressable onPress={() => setConfirmDelete(false)}>
                    <Text style={{ fontSize: 14, color: colors.textMuted, padding: 8 }}>Cancel</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable onPress={() => setConfirmDelete(true)} style={styles.deleteBtn}>
                  <Text style={styles.deleteBtnText}>Delete Contraction</Text>
                </Pressable>
              )}
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal: { width: '100%', maxWidth: 380, backgroundColor: colors.cream, borderRadius: 20, paddingHorizontal: 20, paddingBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: colors.beige },
  headerTitle: { fontSize: 17, fontWeight: '600', color: colors.textPrimary },
  closeBtn: { fontSize: 15, fontWeight: '500', color: colors.terracotta },
  section: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.beige },
  sectionLabel: { fontSize: 11, color: colors.textMuted, letterSpacing: 1.5, marginBottom: 10 },
  fieldRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  timeFieldRow: { paddingVertical: 4 },
  fieldLabel: { fontSize: 14, color: colors.textSecondary },
  fieldValue: { fontSize: 15, fontWeight: '500', color: colors.textPrimary },
  pickerContainer: { alignItems: 'center', marginVertical: -8 },
  timePicker: { height: 100, width: 280 },
  intensityRow: { flexDirection: 'row', gap: 8 },
  intensityBtn: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center' },
  intensityText: { fontSize: 15 },
  confirmRow: { alignItems: 'center', gap: 8 },
  deleteBtn: { width: '100%', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.danger, alignItems: 'center' },
  deleteBtnText: { fontSize: 14, fontWeight: '500', color: colors.danger },
});
