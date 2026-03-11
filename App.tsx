import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { TabNavigator } from './src/navigation/TabNavigator';
import { Onboarding } from './src/components/Onboarding';
import { AlertBanner } from './src/components/AlertBanner';
import { useContractions } from './src/hooks/useContractions';
import { loadOnboardingComplete, saveOnboardingComplete } from './src/utils/storage';
import { Colors } from './src/theme';
import type { Preset } from './src/types';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const PRESET_VALUES: Record<Exclude<Preset, 'custom'>, { frequencyMinutes: number; durationSeconds: number; timeWindowMinutes: number }> = {
  '5-1-1': { frequencyMinutes: 5, durationSeconds: 60, timeWindowMinutes: 60 },
  '4-1-1': { frequencyMinutes: 4, durationSeconds: 60, timeWindowMinutes: 60 },
  '3-1-1': { frequencyMinutes: 3, durationSeconds: 60, timeWindowMinutes: 60 },
};

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(() => !loadOnboardingComplete());
  const [showStalePrompt, setShowStalePrompt] = useState(false);
  const app = useContractions();

  // Request notification permission after onboarding
  useEffect(() => {
    if (!showOnboarding) {
      Notifications.requestPermissionsAsync();
    }
  }, [showOnboarding]);

  // Check if session is stale (24+ hours since last contraction)
  useEffect(() => {
    if (showOnboarding || app.contractions.length === 0) return;
    const lastContraction = app.contractions[app.contractions.length - 1];
    const lastTime = lastContraction.endTime ?? lastContraction.startTime;
    if (Date.now() - lastTime > TWENTY_FOUR_HOURS) {
      setShowStalePrompt(true);
    }
  }, []);

  const handleOnboardingComplete = (preset: Preset) => {
    saveOnboardingComplete();
    if (preset !== 'custom') {
      app.updateSettings({ preset, ...PRESET_VALUES[preset] });
    }
    setShowOnboarding(false);
  };

  if (showOnboarding) {
    return (
      <SafeAreaProvider>
        <Onboarding onComplete={handleOnboardingComplete} />
        <StatusBar style="dark" />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <View style={[styles.container, { backgroundColor: Colors.cream }]}>

        {/* Alert banner */}
        {app.alertMessage && (
          <AlertBanner message={app.alertMessage} onDismiss={app.dismissAlert} />
        )}

        <NavigationContainer>
          <TabNavigator app={app} />
        </NavigationContainer>

        {/* Stale session modal */}
        <Modal visible={showStalePrompt} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={{ fontSize: 32 }}>{'\uD83D\uDC4B'}</Text>
              <Text style={styles.modalTitle}>Welcome back!</Text>
              <Text style={styles.modalBody}>
                It has been a while since your last contraction. Would you like to start a new session?
              </Text>
              <Pressable
                style={styles.modalPrimaryBtn}
                onPress={() => { app.newSession(); setShowStalePrompt(false); }}
              >
                <Text style={styles.modalPrimaryText}>Start New Session</Text>
              </Pressable>
              <Pressable
                style={styles.modalSecondaryBtn}
                onPress={() => setShowStalePrompt(false)}
              >
                <Text style={styles.modalSecondaryText}>Keep Current Session</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(46, 59, 46, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: Colors.cream,
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 8,
    marginBottom: 4,
  },
  modalBody: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalPrimaryBtn: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.terracotta,
    alignItems: 'center',
    marginBottom: 10,
  },
  modalPrimaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  modalSecondaryBtn: {
    width: '100%',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSecondaryText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textMuted,
  },
});
