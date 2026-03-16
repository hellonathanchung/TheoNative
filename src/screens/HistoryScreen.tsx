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
import { formatDuration, formatTime, formatInterval, groupWithDaySeparators } from "../utils/format";
import { useTheme, type ThemeColors } from "../theme";
import { DaySeparator } from "../components/DaySeparator";
import type { Contraction, Session } from "../types";
import type { useContractions } from "../hooks/useContractions";
import { ContractionDetailModal } from "../components/ContractionDetailModal";

interface Props {
  app: ReturnType<typeof useContractions>;
}

export function HistoryScreen({ app }: Props) {
  const { colors } = useTheme();
  const s = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { contractions, sessions } = app;
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [selectedContractionId, setSelectedContractionId] =
    useState<string | null>(null);
  const selectedContraction = selectedContractionId
    ? contractions.find((c) => c.id === selectedContractionId) ?? null
    : null;

  // Current session stats
  const avgDuration =
    contractions.length > 0
      ? contractions.reduce((sum, c) => sum + (c.duration ?? 0), 0) /
        contractions.length
      : 0;

  const intervals: number[] = [];
  for (let i = 1; i < contractions.length; i++) {
    const prev = contractions[i - 1];
    if (prev.endTime) {
      intervals.push((contractions[i].startTime - prev.endTime) / 1000);
    }
  }
  const avgInterval =
    intervals.length > 0
      ? intervals.reduce((a, b) => a + b, 0) / intervals.length
      : 0;

  const sessionStart = contractions[0]?.startTime ?? null;
  const sessionEnd =
    contractions.length > 0
      ? contractions[contractions.length - 1].endTime ?? null
      : null;
  const sessionLength =
    sessionStart && sessionEnd ? (sessionEnd - sessionStart) / 1000 : 0;
  const lastDuration =
    contractions.length > 0 ? contractions[contractions.length - 1].duration ?? 0 : 0;
  const lastInterval =
    intervals.length > 0 ? intervals[intervals.length - 1] : 0;

  const timelineDurations = contractions.map((c) => c.duration ?? 0);
  const maxDuration = Math.max(60, ...timelineDurations);
  const maxInterval = Math.max(60, ...intervals);

  const reversedContractions = useMemo(() => [...contractions].reverse(), [contractions]);
  const groupedContractions = useMemo(
    () => groupWithDaySeparators(reversedContractions),
    [reversedContractions],
  );
  const topSectionHeight = contractions.length > 0 ? 240 : 160;

  return (
    <View style={s.container}>
      <View style={[s.topSection, { height: topSectionHeight, paddingTop: insets.top }]}>
          <View style={s.sectionWrap}>
          <Text style={s.title}>History</Text>
          </View>

        {/* Current session stats */}
        {contractions.length > 0 && (
          <>
            <View style={s.sectionWrap}>
              <Text style={s.sectionLabel}>CURRENT SESSION</Text>
            </View>
            <View style={s.statsRow}>
              <View style={s.statCol}>
                <Text style={s.statValue}>{contractions.length}</Text>
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

            <View style={s.statsRow}>
              <View style={s.statCol}>
                <Text style={s.statValue}>
                  {sessionLength > 0 ? formatInterval(sessionLength) : "--"}
                </Text>
                <Text style={s.statLabel}>session length</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statCol}>
                <Text style={s.statValue}>
                  {lastDuration > 0 ? formatDuration(lastDuration) : "--"}
                </Text>
                <Text style={s.statLabel}>last duration</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statCol}>
                <Text style={s.statValue}>
                  {lastInterval > 0 ? formatInterval(lastInterval) : "--"}
                </Text>
                <Text style={s.statLabel}>last apart</Text>
              </View>
            </View>
          </>
        )}
        </View>

        <ScrollView
          style={s.bottomScroll}
          contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
        >
          {contractions.length > 0 ? (
            <>
              <View style={s.sectionWrap}>
                <Text style={s.sectionLabel}>TIMELINE</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.timelineRow}
              >
                {contractions.map((c, i) => {
                  const duration = c.duration ?? 0;
                  const prev = i > 0 ? contractions[i - 1] : null;
                  const gap = prev?.endTime
                    ? (c.startTime - prev.endTime) / 1000
                    : 0;
                  const height = 10 + (duration / maxDuration) * 36;
                  const spacing = 6 + (gap / maxInterval) * 18;
                  return (
                    <View
                      key={c.id}
                      style={{
                        alignItems: "center",
                        marginRight: Math.min(24, spacing),
                      }}
                    >
                      <View
                        style={[
                          s.timelineBar,
                          { height: Math.min(46, Math.max(10, height)) },
                        ]}
                      />
                    </View>
                  );
                })}
              </ScrollView>

              {/* Current contractions list (reversed) */}
              <View style={s.listSection}>
                {groupedContractions.map((item) => {
                  if (item.type === 'separator') {
                    return <DaySeparator key={item.key} label={item.label} />;
                  }
                  const c = item.contraction;
                  const originalIndex = contractions.indexOf(c);
                  const number = originalIndex + 1;
                  const prev =
                    originalIndex > 0 ? contractions[originalIndex - 1] : null;
                  const interval = prev?.endTime
                    ? (c.startTime - prev.endTime) / 1000
                    : null;

                  return (
                    <Pressable
                      key={item.key}
                      style={s.row}
                      onPress={() => setSelectedContractionId(c.id)}
                    >
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
                      {c.intensity && (
                        <View
                          style={[
                            s.intensityDot,
                            {
                              backgroundColor:
                                c.intensity === "mild"
                                  ? colors.intensityMild
                                  : c.intensity === "moderate"
                                  ? colors.intensityModerate
                                  : colors.intensityStrong,
                            },
                          ]}
                        />
                      )}
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
          contractions={contractions}
          onClose={() => setSelectedContractionId(null)}
          onUpdate={app.updateContraction}
          onDelete={app.deleteContraction}
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
    [session.contractions],
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
            if (item.type === 'separator') {
              return <DaySeparator key={item.key} label={item.label} />;
            }
            const c = item.contraction;
            const i = session.contractions.indexOf(c);
            const prev = i > 0 ? session.contractions[i - 1] : null;
            const interval = prev?.endTime
              ? (c.startTime - prev.endTime) / 1000
              : null;
            return (
              <View key={item.key} style={styles.row}>
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
                {c.intensity && (
                  <View
                    style={[
                      styles.intensityDot,
                      {
                        backgroundColor:
                          c.intensity === "mild"
                            ? colors.intensityMild
                            : c.intensity === "moderate"
                            ? colors.intensityModerate
                            : colors.intensityStrong,
                      },
                    ]}
                  />
                )}
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

const createStyles = (colors: ThemeColors) => StyleSheet.create({
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
  timelineRow: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 4,
    alignItems: "flex-end",
  },
  timelineBar: {
    width: 12,
    borderRadius: 6,
    backgroundColor: colors.terracotta,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.cream,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.beige,
    marginBottom: 10,
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
    alignItems: "center",
  },
  rowValue: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  rowLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },
  intensityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 12,
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
