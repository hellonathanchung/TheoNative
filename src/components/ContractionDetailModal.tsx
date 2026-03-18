import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  Platform,
  Image,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { formatDuration, formatInterval } from "../utils/format";
import { useTheme, type ThemeColors } from "../theme";
import type { Contraction } from "../types";
import { IntensitySlider } from "./IntensitySlider";
import { useSwipeLock } from "../contexts/SwipeLockContext";

interface Props {
  contraction: Contraction | null;
  contractions?: Contraction[];
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Contraction>) => void;
  onDelete: (id: string) => void;
  readOnly?: boolean;
}

export function ContractionDetailModal({
  contraction: c,
  contractions,
  onClose,
  onUpdate,
  onDelete,
  readOnly,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { lock, unlock } = useSwipeLock();

  useEffect(() => {
    if (c) {
      lock();
      return () => unlock();
    }
  }, [c, lock, unlock]);

  if (!c) return null;

  const interval = (() => {
    if (!contractions) return null;
    const idx = contractions.findIndex((a) => a.id === c.id);
    const prev = idx > 0 ? contractions[idx - 1] : null;
    return prev?.endTime ? (c.startTime - prev.endTime) / 1000 : null;
  })();

  const formatTimeOfDay = (ms: number) => {
    const d = new Date(ms);
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const handleTimeChange = (
    field: "startTime" | "endTime",
    date: Date | undefined
  ) => {
    if (!date || readOnly) return;
    // Preserve the original date, only update hours/minutes/seconds
    const original = new Date(c[field] ?? 0);
    const updated = new Date(original);
    updated.setHours(date.getHours(), date.getMinutes(), date.getSeconds());
    onUpdate(c.id, { [field]: updated.getTime() });
  };

  return (
    <Modal
      visible={true}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
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
              {Platform.OS === "web" && (
                <Text style={styles.fieldValue}>
                  {formatTimeOfDay(c.startTime)}
                </Text>
              )}
            </View>
            {!readOnly && Platform.OS !== "web" && (
              <View style={styles.timePickerRow}>
                <DateTimePicker
                  value={new Date(c.startTime)}
                  mode="time"
                  display="compact"
                  onChange={(_, date) => handleTimeChange("startTime", date)}
                  accentColor={colors.terracotta}
                />
                <View style={styles.secondsStepper}>
                  <Pressable
                    onPress={() => onUpdate(c.id, { startTime: c.startTime - 15000 })}
                    style={styles.secondsBtn}
                  >
                    <Text style={styles.secondsBtnText}>−</Text>
                  </Pressable>
                  <Text style={styles.secondsLabel}>
                    :{String(new Date(c.startTime).getSeconds()).padStart(2, "0")}
                  </Text>
                  <Pressable
                    onPress={() => onUpdate(c.id, { startTime: c.startTime + 15000 })}
                    style={styles.secondsBtn}
                  >
                    <Text style={styles.secondsBtnText}>+</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {c.endTime && (
              <>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Ended</Text>
                  {Platform.OS === "web" && (
                    <Text style={styles.fieldValue}>
                      {formatTimeOfDay(c.endTime)}
                    </Text>
                  )}
                </View>
                {!readOnly && Platform.OS !== "web" && (
                  <View style={styles.timePickerRow}>
                    <DateTimePicker
                      value={new Date(c.endTime)}
                      mode="time"
                      display="compact"
                      onChange={(_, date) => handleTimeChange("endTime", date)}
                      accentColor={colors.terracotta}
                    />
                    <View style={styles.secondsStepper}>
                      <Pressable
                        onPress={() => onUpdate(c.id, { endTime: c.endTime! - 15000 })}
                        style={styles.secondsBtn}
                      >
                        <Text style={styles.secondsBtnText}>−</Text>
                      </Pressable>
                      <Text style={styles.secondsLabel}>
                        :{String(new Date(c.endTime).getSeconds()).padStart(2, "0")}
                      </Text>
                      <Pressable
                        onPress={() => onUpdate(c.id, { endTime: c.endTime! + 15000 })}
                        style={styles.secondsBtn}
                      >
                        <Text style={styles.secondsBtnText}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </>
            )}

            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Duration</Text>
              <Text style={styles.fieldValue}>
                {c.duration ? formatDuration(c.duration) : "--"}
              </Text>
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
            <Text style={styles.sectionLabel}>FLAG</Text>
            <Pressable
              style={[
                styles.flagToggle,
                {
                  backgroundColor: c.flagged
                    ? colors.warmAmber + "33"
                    : colors.beige,
                  borderColor: c.flagged ? colors.warmAmber : colors.beige,
                },
              ]}
              onPress={() =>
                !readOnly && onUpdate(c.id, { flagged: !c.flagged })
              }
            >
              <Image
                source={require("../../assets/flag-icon.png")}
                style={[
                  styles.flagIconLeft,
                  {
                    opacity: c.flagged ? 1 : 0.45,
                    transform: [{ rotate: c.flagged ? "15deg" : "-15deg" }],
                  },
                ]}
                resizeMode="contain"
              />
              <Text
                style={[
                  styles.flagLabel,
                  { color: c.flagged ? colors.warmAmber : colors.textMuted },
                ]}
              >
                {c.flagged ? "Flagged" : "Tap to flag"}
              </Text>
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>INTENSITY</Text>
            {c.intensity != null ? (
              <>
                <IntensitySlider
                  value={c.intensity}
                  onChange={(v) =>
                    !readOnly && onUpdate(c.id, { intensity: v })
                  }
                  readOnly={readOnly}
                />
                {!readOnly && (
                  <Pressable
                    onPress={() => onUpdate(c.id, { intensity: undefined })}
                  >
                    <Text style={styles.removeIntensity}>Remove intensity</Text>
                  </Pressable>
                )}
              </>
            ) : !readOnly ? (
              <Pressable onPress={() => onUpdate(c.id, { intensity: 3 })}>
                <Text style={styles.addIntensity}>Tap to add intensity</Text>
              </Pressable>
            ) : null}
          </View>

          {!readOnly && (
            <View style={{ paddingVertical: 8 }}>
              {confirmDelete ? (
                <View style={styles.confirmRow}>
                  <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                    Delete this contraction?
                  </Text>
                  <Pressable
                    onPress={() => {
                      onDelete(c.id);
                      onClose();
                    }}
                    style={[
                      styles.deleteBtn,
                      {
                        backgroundColor: colors.danger,
                        borderColor: colors.danger,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.deleteBtnText, { color: colors.white }]}
                    >
                      Yes, Delete
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => setConfirmDelete(false)}>
                    <Text
                      style={{
                        fontSize: 14,
                        color: colors.textMuted,
                        padding: 8,
                      }}
                    >
                      Cancel
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => setConfirmDelete(true)}
                  style={styles.deleteBtn}
                >
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

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.3)",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    },
    modal: {
      width: "100%",
      maxWidth: 380,
      backgroundColor: colors.cream,
      borderRadius: 20,
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.beige,
    },
    headerTitle: { fontSize: 17, fontWeight: "600", color: colors.textPrimary },
    closeBtn: { fontSize: 15, fontWeight: "500", color: colors.terracotta },
    section: {
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.beige,
    },
    sectionLabel: {
      fontSize: 11,
      color: colors.textMuted,
      letterSpacing: 1.5,
      marginBottom: 10,
    },
    fieldRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 8,
    },
    timeFieldRow: { paddingVertical: 4 },
    fieldLabel: { fontSize: 14, color: colors.textSecondary },
    fieldValue: { fontSize: 15, fontWeight: "500", color: colors.textPrimary },
    pickerContainer: { alignItems: "center", marginVertical: -8 },
    timePicker: { height: 100, width: 280 },
    flagToggle: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 1.5,
      position: "relative" as const,
    },
    flagIconLeft: {
      position: "absolute" as const,
      left: 10,
      width: 44,
      height: 44,
    },
    flagLabel: {
      fontSize: 14,
      fontWeight: "500",
      textAlign: "center" as const,
    },
    addIntensity: { fontSize: 13, color: colors.textMuted, paddingVertical: 8 },
    removeIntensity: {
      fontSize: 12,
      color: colors.textMuted,
      paddingTop: 6,
      textDecorationLine: "underline",
    },
    confirmRow: { alignItems: "center", gap: 8 },
    deleteBtn: {
      width: "100%",
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.danger,
      alignItems: "center",
    },
    deleteBtnText: { fontSize: 14, fontWeight: "500", color: colors.danger },
    timePickerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    secondsStepper: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    secondsLabel: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.textPrimary,
      minWidth: 36,
      textAlign: "center",
    },
    secondsBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.beige,
      alignItems: "center",
      justifyContent: "center",
    },
    secondsBtnText: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.deepGreen,
      lineHeight: 22,
    },
  });
