import React from "react";
import { Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { TimerScreen } from "../screens/TimerScreen";
import { HistoryScreen } from "../screens/HistoryScreen";
import { RelaxScreen } from "../screens/RelaxScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { Colors } from "../theme";
import type { useContractions } from "../hooks/useContractions";

export type TabParamList = {
  Track: undefined;
  History: undefined;
  Relax: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

interface Props {
  app: ReturnType<typeof useContractions>;
}

export function TabNavigator({ app }: Props) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.deepGreen,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.cream,
          borderTopColor: Colors.beige,
          borderTopWidth: 1,
          height: 64,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Track"
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>⏱</Text>
          ),
        }}
      >
        {() => <TimerScreen app={app} />}
      </Tab.Screen>
      <Tab.Screen
        name="History"
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>📋</Text>
          ),
        }}
      >
        {() => <HistoryScreen app={app} />}
      </Tab.Screen>
      <Tab.Screen
        name="Relax"
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>🌿</Text>
          ),
        }}
      >
        {() => <RelaxScreen app={app} />}
      </Tab.Screen>
      <Tab.Screen
        name="Settings"
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>⚙️</Text>
          ),
        }}
      >
        {() => <SettingsScreen app={app} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
