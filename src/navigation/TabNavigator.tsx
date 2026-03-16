import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Text,
  View,
  Pressable,
  StyleSheet,
  Animated,
  PanResponder,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenBackground } from "../components/ScreenBackground";
import { TimerScreen } from "../screens/TimerScreen";
import { HistoryScreen } from "../screens/HistoryScreen";
import { RelaxScreen } from "../screens/RelaxScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { useTheme, type ThemeColors } from "../theme";
import type { useContractions } from "../hooks/useContractions";

export type TabParamList = {
  Track: undefined;
  History: undefined;
  Relax: undefined;
  Settings: undefined;
};

type TabKey = keyof TabParamList;
const EDGE_SLOP = 24;

interface Props {
  app: ReturnType<typeof useContractions>;
}

export function TabNavigator({ app }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const offsetX = useRef(0);

  const tabs = useMemo(
    () => [
      { key: "Track" as TabKey, label: "Track", icon: "⏱", Screen: TimerScreen },
      { key: "History" as TabKey, label: "History", icon: "📋", Screen: HistoryScreen },
      { key: "Relax" as TabKey, label: "Relax", icon: "🌿", Screen: RelaxScreen },
      { key: "Settings" as TabKey, label: "Settings", icon: "⚙️", Screen: SettingsScreen },
    ],
    [],
  );

  const clamp = useCallback((value: number, min: number, max: number) => {
    return Math.min(max, Math.max(min, value));
  }, []);

  const animateToIndex = useCallback(
    (nextIndex: number) => {
      const nextOffset = -nextIndex * width;
      offsetX.current = nextOffset;
      Animated.spring(translateX, {
        toValue: nextOffset,
        useNativeDriver: false,
        damping: 24,
        stiffness: 200,
        mass: 0.8,
      }).start();
    },
    [translateX, width],
  );

  useEffect(() => {
    animateToIndex(index);
  }, [index, width, animateToIndex]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => {
        if (gesture.numberActiveTouches > 1) return false;
        const isHorizontal = Math.abs(gesture.dx) > 12;
        const isPrimary = Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.2;
        return isHorizontal && isPrimary;
      },
      onPanResponderGrant: () => {
        translateX.stopAnimation((value) => {
          offsetX.current = value;
        });
      },
      onPanResponderMove: (_, gesture) => {
        const min = -(tabs.length - 1) * width;
        const max = 0;
        const next = clamp(offsetX.current + gesture.dx, min, max);
        translateX.setValue(next);
      },
      onPanResponderRelease: (_, gesture) => {
        const min = -(tabs.length - 1) * width;
        const max = 0;
        const nextOffset = clamp(offsetX.current + gesture.dx, min, max);
        const nextIndex = clamp(
          Math.round(-nextOffset / width),
          0,
          tabs.length - 1,
        );
        setIndex(nextIndex);
        animateToIndex(nextIndex);
      },
      onPanResponderTerminate: () => {
        animateToIndex(index);
      },
    })
  ).current;

  return (
    <ScreenBackground active={app.isActive}>
      <View style={styles.container}>
        <View style={styles.pager}>
          <Animated.View
            style={[
              styles.pagerRow,
              { width: width * tabs.length, transform: [{ translateX }] },
            ]}
          >
            {tabs.map((tab) => {
              const Screen = tab.Screen;
              return (
                <View key={tab.key} style={{ width, flex: 1 }}>
                  <Screen app={app} />
                </View>
              );
            })}
          </Animated.View>
          <View pointerEvents="box-none" style={styles.edgeOverlay}>
            <View style={styles.edgeZone} {...panResponder.panHandlers} />
            <View
              style={[styles.edgeZone, styles.edgeZoneRight]}
              {...panResponder.panHandlers}
            />
          </View>
        </View>
        <View
          style={[
            styles.tabBar,
            { height: 64 + insets.bottom, paddingBottom: insets.bottom },
          ]}
        >
          {tabs.map((tab, i) => {
            const active = i === index;
            const color = active ? colors.deepGreen : colors.textMuted;
            return (
              <Pressable
                key={tab.key}
                style={styles.tabItem}
                onPress={() => setIndex(i)}
              >
                <Text style={[styles.tabIcon, { color }]}>{tab.icon}</Text>
                <Text style={[styles.tabLabel, { color }]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </ScreenBackground>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: {
    flex: 1,
  },
  pager: {
    flex: 1,
    overflow: "hidden",
  },
  pagerRow: {
    flex: 1,
    flexDirection: "row",
  },
  edgeOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  edgeZone: {
    width: EDGE_SLOP,
  },
  edgeZoneRight: {
    alignSelf: "stretch",
  },
  tabBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: colors.cream,
    borderTopColor: colors.beige,
    borderTopWidth: 1,
    paddingTop: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  tabIcon: {
    fontSize: 20,
  },
  tabLabel: {
    fontSize: 10,
  },
});
