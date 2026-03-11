import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatDuration, formatTime, formatInterval } from "../utils/format";
import { Colors } from "../theme";
import type { Contraction, Session } from "../types";
import type { useContractions } from "../hooks/useContractions";
import { ContractionDetailModal } from "../components/ContractionDetailModal";
import { ScreenBackground } from "../components/ScreenBackground";

interface Props {
  app: ReturnType<typeof useContractions>;
}

export function HistoryScreen({ app }: Props) {
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

  const reversedContractions = [...contractions].reverse();

  return (
    <ScreenBackground>
      <ScrollView
        style={[s.container, { paddingTop: insets.top }]}
        contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
      >
        <View style={s.sectionWrap}>
          <Text style={s.title}>History</Text>
        </View>

        {/* Current session stats and list */}
        {contractions.length > 0 ? (
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

            {/* Current contractions list (reversed) */}
            <View style={s.listSection}>
              {reversedContractions.map((c, reversedIndex) => {
                const originalIndex = contractions.indexOf(c);
                const number = originalIndex + 1;
                const prev =
                  originalIndex > 0 ? contractions[originalIndex - 1] : null;
                const interval = prev?.endTime
                  ? (c.startTime - prev.endTime) / 1000
                  : null;

                return (
                <Pressable
                  key={c.id}
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
                      <Text style={[s.rowValue, { color: Colors.deepGreen }]}>
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
                                ? Colors.intensityMild
                                : c.intensity === "moderate"
                                ? Colors.intensityModerate
                                : Colors.intensityStrong,
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

        {/* Contraction detail modal */}
        <ContractionDetailModal
          contraction={selectedContraction}
          contractions={contractions}
          onClose={() => setSelectedContractionId(null)}
          onUpdate={app.updateContraction}
          onDelete={app.deleteContraction}
        />
      </ScrollView>
    </ScreenBackground>
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

  return (
    <View style={s.sessionCard}>
      <Pressable style={s.sessionHeader} onPress={onToggle}>
        <View>
          <Text style={s.sessionDate}>{date}</Text>
          <Text style={s.sessionMeta}>
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
        <Text style={s.chevron}>{expanded ? "\u25BE" : "\u25B8"}</Text>
      </Pressable>

      {expanded && (
        <View>
          {session.contractions.map((c, i) => {
            const prev = i > 0 ? session.contractions[i - 1] : null;
            const interval = prev?.endTime
              ? (c.startTime - prev.endTime) / 1000
              : null;
            return (
              <View key={c.id} style={s.row}>
                <Text style={s.rowNumber}>#{i + 1}</Text>
                <Text style={s.rowTime}>{formatTime(c.startTime)}</Text>
                <View style={s.rowDetail}>
                  <Text style={s.rowValue}>
                    {c.duration ? formatDuration(c.duration) : "--"}
                  </Text>
                  <Text style={s.rowLabel}>duration</Text>
                </View>
                <View style={s.rowDetail}>
                  <Text style={[s.rowValue, { color: Colors.deepGreen }]}>
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
                            ? Colors.intensityMild
                            : c.intensity === "moderate"
                            ? Colors.intensityModerate
                            : Colors.intensityStrong,
                      },
                    ]}
                  />
                )}
              </View>
            );
          })}
          <Pressable style={s.deleteBtn} onPress={onDelete}>
            <Text style={s.deleteText}>Delete Session</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 0,
  },
  sectionWrap: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.textPrimary,
    paddingBottom: 12,
    paddingTop: 16,
  },
  sectionLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    paddingBottom: 8,
  },
  listSection: {
    paddingHorizontal: 20,
  },
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    backgroundColor: Colors.beige,
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
    backgroundColor: Colors.softPeach,
    marginVertical: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: Colors.cream,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.beige,
    marginBottom: 10,
  },
  rowNumber: {
    width: 36,
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: "500",
    textAlign: "center",
  },
  rowTime: {
    width: 84,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  rowDetail: {
    flex: 1,
    alignItems: "center",
  },
  rowValue: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  rowLabel: {
    fontSize: 10,
    color: Colors.textMuted,
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
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  sessionCard: {
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: Colors.cream,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.beige,
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
    color: Colors.textPrimary,
  },
  sessionMeta: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  chevron: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  deleteBtn: {
    padding: 12,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: Colors.beige,
  },
  deleteText: {
    fontSize: 13,
    color: Colors.danger,
    fontWeight: "500",
  },
});
