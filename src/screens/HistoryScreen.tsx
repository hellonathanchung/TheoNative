import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  formatDuration,
  formatTime,
  formatInterval,
  groupWithDaySeparators,
} from "../utils/format";
import { useTheme, type ThemeColors } from "../theme";
import { DaySeparator } from "../components/DaySeparator";
import { getIntensityBorderStyle } from "../utils/intensity";
import type { Contraction, Session } from "../types";
import type { useContractions } from "../hooks/useContractions";
import { ContractionDetailModal } from "../components/ContractionDetailModal";
import { useSharing, type MergedContraction } from "../contexts/SharingContext";

interface Props {
  app: ReturnType<typeof useContractions>;
}

export function HistoryScreen({ app }: Props) {
  const { colors } = useTheme();
  const s = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { sessions } = app;
  const sharing = useSharing();
  const merged = sharing.mergedContractions;
  const partnerInitial = sharing.partner?.email?.[0]?.toUpperCase() ?? "P";
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [selectedContractionId, setSelectedContractionId] = useState<
    string | null
  >(null);
  const [selectedIsPartner, setSelectedIsPartner] = useState(false);
  const selectedContraction = selectedContractionId
    ? merged.find((c) => c.id === selectedContractionId) ?? null
    : null;

  // Past hour stats
  const ONE_HOUR = 60 * 60 * 1000;
  const now = Date.now();
  const recentContractions = merged.filter((c) => now - c.startTime < ONE_HOUR);

  const avgDuration =
    recentContractions.length > 0
      ? recentContractions.reduce((sum, c) => sum + (c.duration ?? 0), 0) /
        recentContractions.length
      : 0;

  const recentIntervals: number[] = [];
  for (let i = 1; i < recentContractions.length; i++) {
    const prev = recentContractions[i - 1];
    if (prev.endTime) {
      recentIntervals.push(
        (recentContractions[i].startTime - prev.endTime) / 1000
      );
    }
  }
  const avgInterval =
    recentIntervals.length > 0
      ? recentIntervals.reduce((a, b) => a + b, 0) / recentIntervals.length
      : 0;

  const reversedContractions = useMemo(() => [...merged].reverse(), [merged]);
  const groupedContractions = useMemo(
    () => groupWithDaySeparators(reversedContractions),
    [reversedContractions]
  );
  return (
    <View style={s.container}>
      <View style={[s.topSection, { paddingTop: insets.top }]}>
        <View style={s.sectionWrap}>
          <Text style={s.title}>History</Text>
        </View>

        {/* Past hour stats */}
        {recentContractions.length > 0 && (
          <>
            <View style={s.sectionWrap}>
              <Text style={s.sectionLabel}>PAST HOUR</Text>
            </View>
            <View style={s.statsRow}>
              <View style={s.statCol}>
                <Text style={s.statValue}>{recentContractions.length}</Text>
                <Text style={s.statLabel}>contractions</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statCol}>
                <Text style={s.statValue}>
                  {avgDuration > 0 ? formatDuration(avgDuration) : "--"}
                </Text>
                <Text style={s.statLabel}>avg duration</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statCol}>
                <Text style={s.statValue}>
                  {avgInterval > 0 ? formatInterval(avgInterval) : "--"}
                </Text>
                <Text style={s.statLabel}>avg apart</Text>
              </View>
            </View>
          </>
        )}
      </View>

      <ScrollView
        style={s.bottomScroll}
        contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
      >
        {merged.length > 0 ? (
          <>
            {/* Current contractions list (reversed) */}
            <View style={s.listSection}>
              {groupedContractions.map((item) => {
                if (item.type === "separator") {
                  return <DaySeparator key={item.key} label={item.label} />;
                }
                const c = item.contraction as MergedContraction;
                const originalIndex = merged.indexOf(c);
                const number = originalIndex + 1;
                const prev =
                  originalIndex > 0 ? merged[originalIndex - 1] : null;
                const interval = prev?.endTime
                  ? (c.startTime - prev.endTime) / 1000
                  : null;

                const borderStyle =
                  c.intensity != null
                    ? getIntensityBorderStyle(c.intensity)
                    : { borderColor: colors.beige, borderWidth: 1 };
                return (
                  <Pressable
                    key={item.key}
                    style={[s.row, borderStyle]}
                    onPress={() => {
                      setSelectedContractionId(c.id);
                      setSelectedIsPartner(c.isPartner);
                    }}
                  >
                    {c.isPartner && (
                      <View style={s.partnerBadge}>
                        <Text style={s.partnerBadgeText}>{partnerInitial}</Text>
                      </View>
                    )}
                    {c.flagged && (
                      <View style={s.flagBadge}>
                        <Text style={s.flagBadgeText}>?</Text>
                      </View>
                    )}
                    <Text style={s.rowNumber}>#{number}</Text>
                    <Text style={s.rowTime}>{formatTime(c.startTime)}</Text>
                    <View style={s.rowDetail}>
                      <Text style={s.rowValue}>
                        {c.duration ? formatDuration(c.duration) : "--"}
                      </Text>
                      <Text style={s.rowLabel}>duration</Text>
                    </View>
                    <View style={s.rowDetail}>
                      <Text style={[s.rowValue, { color: colors.deepGreen }]}>
                        {interval !== null ? formatInterval(interval) : "--"}
                      </Text>
                      <Text style={s.rowLabel}>apart</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : (
          <View style={s.emptyState}>
            <Text style={s.emptyTitle}>No contractions recorded yet.</Text>
            <Text style={s.emptyDesc}>
              Head to the Track tab to get started.
            </Text>
          </View>
        )}

        {/* Past sessions */}
        {sessions.length > 0 && (
          <>
            <View style={s.sectionWrap}>
              <Text style={[s.sectionLabel, { marginTop: 24 }]}>
                PAST SESSIONS
              </Text>
            </View>
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                expanded={expandedSession === session.id}
                onToggle={() =>
                  setExpandedSession(
                    expandedSession === session.id ? null : session.id
                  )
                }
                onDelete={() => {
                  Alert.alert(
                    "Delete Session",
                    `Delete this session with ${session.contractions.length} contractions?`,
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: () => app.deleteSession(session.id),
                      },
                    ]
                  );
                }}
              />
            ))}
          </>
        )}
      </ScrollView>

      {/* Contraction detail modal */}
      <ContractionDetailModal
        contraction={selectedContraction}
        contractions={merged}
        onClose={() => {
          setSelectedContractionId(null);
          setSelectedIsPartner(false);
        }}
        onUpdate={app.updateContraction}
        onDelete={app.deleteContraction}
        readOnly={selectedIsPartner}
      />
    </View>
  );
}

function SessionCard({
  session,
  expanded,
  onToggle,
  onDelete,
}: {
  session: Session;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const date = new Date(session.startedAt).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const avgDuration =
    session.contractions.length > 0
      ? session.contractions.reduce((sum, c) => sum + (c.duration ?? 0), 0) /
        session.contractions.length
      : 0;

  const sessionIntervals: number[] = [];
  for (let i = 1; i < session.contractions.length; i++) {
    const prev = session.contractions[i - 1];
    if (prev.endTime) {
      sessionIntervals.push(
        (session.contractions[i].startTime - prev.endTime) / 1000
      );
    }
  }
  const avgInterval =
    sessionIntervals.length > 0
      ? sessionIntervals.reduce((a, b) => a + b, 0) / sessionIntervals.length
      : 0;

  const groupedSessionContractions = useMemo(
    () => groupWithDaySeparators(session.contractions),
    [session.contractions]
  );

  return (
    <View style={styles.sessionCard}>
      <Pressable style={styles.sessionHeader} onPress={onToggle}>
        <View>
          <Text style={styles.sessionDate}>{date}</Text>
          <Text style={styles.sessionMeta}>
            {session.contractions.length} contraction
            {session.contractions.length !== 1 ? "s" : ""}
            {avgDuration > 0
              ? `  \u00B7  avg ${formatDuration(avgDuration)}`
              : ""}
            {avgInterval > 0
              ? `  \u00B7  ${formatInterval(avgInterval)} apart`
              : ""}
          </Text>
        </View>
        <Text style={styles.chevron}>{expanded ? "\u25BE" : "\u25B8"}</Text>
      </Pressable>

      {expanded && (
        <View>
          {groupedSessionContractions.map((item) => {
            if (item.type === "separator") {
              return <DaySeparator key={item.key} label={item.label} />;
            }
            const c = item.contraction;
            const i = session.contractions.indexOf(c);
            const prev = i > 0 ? session.contractions[i - 1] : null;
            const interval = prev?.endTime
              ? (c.startTime - prev.endTime) / 1000
              : null;
            const rowBorder =
              c.intensity != null
                ? getIntensityBorderStyle(c.intensity)
                : { borderColor: colors.beige, borderWidth: 1 };
            return (
              <View key={item.key} style={[styles.row, rowBorder]}>
                <Text style={styles.rowNumber}>#{i + 1}</Text>
                <Text style={styles.rowTime}>{formatTime(c.startTime)}</Text>
                <View style={styles.rowDetail}>
                  <Text style={styles.rowValue}>
                    {c.duration ? formatDuration(c.duration) : "--"}
                  </Text>
                  <Text style={styles.rowLabel}>duration</Text>
                </View>
                <View style={styles.rowDetail}>
                  <Text style={[styles.rowValue, { color: colors.deepGreen }]}>
                    {interval !== null ? formatInterval(interval) : "--"}
                  </Text>
                  <Text style={styles.rowLabel}>apart</Text>
                </View>
              </View>
            );
          })}
          <Pressable style={styles.deleteBtn} onPress={onDelete}>
            <Text style={styles.deleteText}>Delete Session</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 0,
    },
    topSection: {
      paddingTop: 0,
    },
    bottomScroll: {
      flex: 1,
    },
    sectionWrap: {
      paddingHorizontal: 20,
    },
    title: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.textPrimary,
      paddingBottom: 12,
      paddingTop: 16,
    },
    sectionLabel: {
      fontSize: 11,
      color: colors.textMuted,
      letterSpacing: 1.5,
      paddingBottom: 8,
    },
    listSection: {
      paddingHorizontal: 20,
    },
    statsRow: {
      flexDirection: "row",
      marginHorizontal: 16,
      backgroundColor: colors.beige,
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 0,
      marginBottom: 12,
      alignItems: "center",
    },
    statCol: {
      flex: 1,
      alignItems: "center",
    },
    statDivider: {
      width: 1,
      height: 28,
      backgroundColor: colors.softPeach,
      marginVertical: 4,
    },
    statValue: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    statLabel: {
      fontSize: 10,
      color: colors.textMuted,
      marginTop: 4,
      letterSpacing: 0.5,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 12,
      backgroundColor: colors.cream,
      borderRadius: 14,
      marginBottom: 10,
      overflow: "visible" as const,
    },
    rowNumber: {
      width: 36,
      fontSize: 12,
      color: colors.textMuted,
      fontWeight: "500",
      textAlign: "center",
    },
    rowTime: {
      width: 84,
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
    },
    rowDetail: {
      flex: 1,
    },
    rowValue: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.textPrimary,
      textAlign: "center" as const,
    },
    rowLabel: {
      fontSize: 10,
      color: colors.textMuted,
      marginTop: 1,
      textAlign: "center" as const,
    },
    partnerBadge: {
      position: "absolute" as const,
      top: 2,
      left: 2,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.deepGreen,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      zIndex: 1,
    },
    partnerBadgeText: {
      fontSize: 10,
      fontWeight: "700" as const,
      color: colors.cream,
    },
    emptyState: {
      alignItems: "center",
      padding: 40,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.textSecondary,
      marginBottom: 6,
    },
    emptyDesc: {
      fontSize: 13,
      color: colors.textMuted,
      textAlign: "center",
      lineHeight: 20,
    },
    sessionCard: {
      marginHorizontal: 20,
      marginBottom: 8,
      backgroundColor: colors.cream,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.beige,
      overflow: "hidden",
    },
    sessionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    sessionDate: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    sessionMeta: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    chevron: {
      fontSize: 20,
      color: colors.textMuted,
    },
    deleteBtn: {
      padding: 12,
      alignItems: "center",
      borderTopWidth: 1,
      borderTopColor: colors.beige,
    },
    deleteText: {
      fontSize: 13,
      color: colors.danger,
      fontWeight: "500",
    },
  });
