import React, { useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { formatDuration } from '../utils/format';
import { Colors } from '../theme';
import type { Contraction, Intensity } from '../types';

interface Props {
  contraction: Contraction | null;
  contractions?: Contraction[];
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Contraction>) => void;
  onDelete: (id: string) => void;
  readOnly?: boolean;
}

const INTENSITIES: { id: Intensity; label: string; color: string }[] = [
  { id: 'mild', label: 'Mild', color: Colors.intensityMild },
  { id: 'moderate', label: 'Moderate', color: Colors.intensityModerate },
  { id: 'strong', label: 'Strong', color: Colors.intensityStrong },
];

export function ContractionDetailModal({ contraction: c, contractions, onClose, onUpdate, onDelete, readOnly }: Props) {
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
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.modal} onPress={(e) => e.stopPropagation()}>
          <View style={s.header}>
            <Text style={s.headerTitle}>Contraction Details</Text>
            <Pressable onPress={onClose}>
              <Text style={s.closeBtn}>Done</Text>
            </Pressable>
          </View>

          <View style={s.section}>
            <View style={s.fieldRow}>
              <Text style={s.fieldLabel}>Started</Text>
              <View style={s.timeControls}>
                {!readOnly && (
                  <View style={s.adjustRow}>
                    <Pressable onPress={() => adjustTime('startTime', -5000)} style={s.adjBtn}>
                      <Text style={s.adjBtnText}>-5s</Text>
                    </Pressable>
                    <Pressable onPress={() => adjustTime('startTime', -30000)} style={s.adjBtn}>
                      <Text style={s.adjBtnText}>-30s</Text>
                    </Pressable>
                    <Pressable onPress={() => adjustTime('startTime', -60000)} style={s.adjBtn}>
                      <Text style={s.adjBtnText}>-1m</Text>
                    </Pressable>
                  </View>
                )}
                <Text style={s.fieldValue}>{formatTimeOfDay(c.startTime)}</Text>
                {!readOnly && (
                  <View style={s.adjustRow}>
                    <Pressable onPress={() => adjustTime('startTime', 5000)} style={s.adjBtn}>
                      <Text style={s.adjBtnText}>+5s</Text>
                    </Pressable>
                    <Pressable onPress={() => adjustTime('startTime', 30000)} style={s.adjBtn}>
                      <Text style={s.adjBtnText}>+30s</Text>
                    </Pressable>
                    <Pressable onPress={() => adjustTime('startTime', 60000)} style={s.adjBtn}>
                      <Text style={s.adjBtnText}>+1m</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>

            {c.endTime && (
              <View style={s.fieldRow}>
                <Text style={s.fieldLabel}>Ended</Text>
                <View style={s.timeControls}>
                  {!readOnly && (
                    <View style={s.adjustRow}>
                      <Pressable onPress={() => adjustTime('endTime', -5000)} style={s.adjBtn}>
                        <Text style={s.adjBtnText}>-5s</Text>
                      </Pressable>
                      <Pressable onPress={() => adjustTime('endTime', -30000)} style={s.adjBtn}>
                        <Text style={s.adjBtnText}>-30s</Text>
                      </Pressable>
                      <Pressable onPress={() => adjustTime('endTime', -60000)} style={s.adjBtn}>
                        <Text style={s.adjBtnText}>-1m</Text>
                      </Pressable>
                    </View>
                  )}
                  <Text style={s.fieldValue}>{formatTimeOfDay(c.endTime)}</Text>
                  {!readOnly && (
                    <View style={s.adjustRow}>
                      <Pressable onPress={() => adjustTime('endTime', 5000)} style={s.adjBtn}>
                        <Text style={s.adjBtnText}>+5s</Text>
                      </Pressable>
                      <Pressable onPress={() => adjustTime('endTime', 30000)} style={s.adjBtn}>
                        <Text style={s.adjBtnText}>+30s</Text>
                      </Pressable>
                      <Pressable onPress={() => adjustTime('endTime', 60000)} style={s.adjBtn}>
                        <Text style={s.adjBtnText}>+1m</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>
            )}

            <View style={s.fieldRow}>
              <Text style={s.fieldLabel}>Duration</Text>
              <Text style={s.fieldValue}>{c.duration ? formatDuration(c.duration) : '--'}</Text>
            </View>

            {interval !== null && (
              <View style={s.fieldRow}>
                <Text style={s.fieldLabel}>Apart</Text>
                <Text style={[s.fieldValue, { color: Colors.terracotta }]}>
                  {formatDuration(interval)}
                </Text>
              </View>
            )}
          </View>

          <View style={s.section}>
            <Text style={s.sectionLabel}>INTENSITY</Text>
            <View style={s.intensityRow}>
              {INTENSITIES.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => !readOnly && onUpdate(c.id, { intensity: item.id })}
                  style={[
                    s.intensityBtn,
                    {
                      backgroundColor: c.intensity === item.id ? item.color : Colors.beige,
                      opacity: readOnly && c.intensity !== item.id ? 0.4 : 1,
                    },
                  ]}
                >
                  <Text style={[
                    s.intensityBtnText,
                    { color: c.intensity === item.id ? Colors.cream : Colors.textSecondary },
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
                <View style={s.confirmRow}>
                  <Text style={{ fontSize: 14, color: Colors.textSecondary }}>
                    Delete this contraction?
                  </Text>
                  <Pressable
                    onPress={() => { onDelete(c.id); onClose(); }}
                    style={[s.deleteBtn, { backgroundColor: '#e57373', borderColor: '#e57373' }]}
                  >
                    <Text style={[s.deleteBtnText, { color: Colors.white }]}>Yes, Delete</Text>
                  </Pressable>
                  <Pressable onPress={() => setConfirmDelete(false)}>
                    <Text style={{ fontSize: 14, color: Colors.textMuted, padding: 8 }}>Cancel</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable onPress={() => setConfirmDelete(true)} style={s.deleteBtn}>
                  <Text style={s.deleteBtnText}>Delete Contraction</Text>
                </Pressable>
              )}
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal: { width: '100%', maxWidth: 380, backgroundColor: Colors.cream, borderRadius: 20, paddingHorizontal: 20, paddingBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: Colors.beige },
  headerTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  closeBtn: { fontSize: 15, fontWeight: '500', color: Colors.terracotta },
  section: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.beige },
  sectionLabel: { fontSize: 11, color: Colors.textMuted, letterSpacing: 1.5, marginBottom: 10 },
  fieldRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  fieldLabel: { fontSize: 14, color: Colors.textSecondary },
  fieldValue: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  timeControls: { alignItems: 'center', gap: 6 },
  adjustRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'center' },
  adjBtn: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, backgroundColor: Colors.beige },
  adjBtnText: { fontSize: 12, fontWeight: '500', color: Colors.terracotta },
  intensityRow: { flexDirection: 'row', gap: 8 },
  intensityBtn: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 12, alignItems: 'center' },
  intensityBtnText: { fontSize: 13, fontWeight: '500' },
  confirmRow: { alignItems: 'center', gap: 8 },
  deleteBtn: { width: '100%', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e57373', alignItems: 'center' },
  deleteBtnText: { fontSize: 14, fontWeight: '500', color: '#e57373' },
});
