import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { formatDuration } from '../utils/format';
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

  const adjustTime = (field: 'startTime' | 'endTime', deltaMs: number) => {
    if (readOnly) return;
    const newTime = (c[field] ?? 0) + deltaMs;
    onUpdate(c.id, { [field]: newTime });
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
              <View style={styles.timeControls}>
                {!readOnly && (
                  <View style={styles.adjustRow}>
                    <Pressable onPress={() => adjustTime('startTime', -5000)} style={styles.adjBtn}>
                      <Text style={styles.adjBtnText}>-5s</Text>
                    </Pressable>
                    <Pressable onPress={() => adjustTime('startTime', -30000)} style={styles.adjBtn}>
                      <Text style={styles.adjBtnText}>-30s</Text>
                    </Pressable>
                    <Pressable onPress={() => adjustTime('startTime', -60000)} style={styles.adjBtn}>
                      <Text style={styles.adjBtnText}>-1m</Text>
                    </Pressable>
                  </View>
                )}
                <Text style={styles.fieldValue}>{formatTimeOfDay(c.startTime)}</Text>
                {!readOnly && (
                  <View style={styles.adjustRow}>
                    <Pressable onPress={() => adjustTime('startTime', 5000)} style={styles.adjBtn}>
                      <Text style={styles.adjBtnText}>+5s</Text>
                    </Pressable>
                    <Pressable onPress={() => adjustTime('startTime', 30000)} style={styles.adjBtn}>
                      <Text style={styles.adjBtnText}>+30s</Text>
                    </Pressable>
                    <Pressable onPress={() => adjustTime('startTime', 60000)} style={styles.adjBtn}>
                      <Text style={styles.adjBtnText}>+1m</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>

            {c.endTime && (
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Ended</Text>
                <View style={styles.timeControls}>
                  {!readOnly && (
                    <View style={styles.adjustRow}>
                      <Pressable onPress={() => adjustTime('endTime', -5000)} style={styles.adjBtn}>
                        <Text style={styles.adjBtnText}>-5s</Text>
                      </Pressable>
                      <Pressable onPress={() => adjustTime('endTime', -30000)} style={styles.adjBtn}>
                        <Text style={styles.adjBtnText}>-30s</Text>
                      </Pressable>
                      <Pressable onPress={() => adjustTime('endTime', -60000)} style={styles.adjBtn}>
                        <Text style={styles.adjBtnText}>-1m</Text>
                      </Pressable>
                    </View>
                  )}
                  <Text style={styles.fieldValue}>{formatTimeOfDay(c.endTime)}</Text>
                  {!readOnly && (
                    <View style={styles.adjustRow}>
                      <Pressable onPress={() => adjustTime('endTime', 5000)} style={styles.adjBtn}>
                        <Text style={styles.adjBtnText}>+5s</Text>
                      </Pressable>
                      <Pressable onPress={() => adjustTime('endTime', 30000)} style={styles.adjBtn}>
                        <Text style={styles.adjBtnText}>+30s</Text>
                      </Pressable>
                      <Pressable onPress={() => adjustTime('endTime', 60000)} style={styles.adjBtn}>
                        <Text style={styles.adjBtnText}>+1m</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>
            )}

            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Duration</Text>
              <Text style={styles.fieldValue}>{c.duration ? formatDuration(c.duration) : '--'}</Text>
            </View>

            {interval !== null && (
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Apart</Text>
                <Text style={[styles.fieldValue, { color: colors.terracotta }]}>
                  {formatDuration(interval)}
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
                  style={[
                    styles.intensityBtn,
                    {
                      backgroundColor: c.intensity === item.id ? item.color : colors.beige,
                      opacity: readOnly && c.intensity !== item.id ? 0.4 : 1,
                    },
                  ]}
                >
                  <Text style={[
                    styles.intensityBtnText,
                    { color: c.intensity === item.id ? colors.cream : colors.textSecondary },
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
  fieldLabel: { fontSize: 14, color: colors.textSecondary },
  fieldValue: { fontSize: 15, fontWeight: '500', color: colors.textPrimary },
  timeControls: { alignItems: 'center', gap: 6 },
  adjustRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'center' },
  adjBtn: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, backgroundColor: colors.beige },
  adjBtnText: { fontSize: 12, fontWeight: '500', color: colors.terracotta },
  intensityRow: { flexDirection: 'row', gap: 8 },
  intensityBtn: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 12, alignItems: 'center' },
  intensityBtnText: { fontSize: 13, fontWeight: '500' },
  confirmRow: { alignItems: 'center', gap: 8 },
  deleteBtn: { width: '100%', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.danger, alignItems: 'center' },
  deleteBtnText: { fontSize: 14, fontWeight: '500', color: colors.danger },
});
