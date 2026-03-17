import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, Modal, StyleSheet, Animated } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Ionicons } from '@expo/vector-icons';
import { TabNavigator } from './src/navigation/TabNavigator';
import { AlertBanner } from './src/components/AlertBanner';
import { useContractions } from './src/hooks/useContractions';
import { DarkColors, LightColors, ThemeProvider } from './src/theme';
import { analytics } from './src/utils/analytics';
import { SharingProvider } from './src/contexts/SharingContext';

// Lock to portrait
ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);

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

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

export default function App() {
  const [showStalePrompt, setShowStalePrompt] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const undoOpacity = useRef(new Animated.Value(0)).current;
  const app = useContractions();
  const { undoState, undoLast, clearUndo } = app;
  const mode = app.settings.themeMode ?? 'light';
  const colors = mode === 'dark' ? DarkColors : LightColors;
  const styles = useMemo(() => createStyles(colors, mode === 'dark'), [colors, mode]);

  // Request notification permission on mount
  useEffect(() => {
    Notifications.requestPermissionsAsync();
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    toastOpacity.setValue(0);
    Animated.timing(toastOpacity, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
    const timer = setTimeout(() => {
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setToastMessage(null));
    }, 1800);
    return () => clearTimeout(timer);
  }, [toastMessage, toastOpacity]);

  useEffect(() => {
    if (undoState) {
      undoOpacity.setValue(0);
      Animated.timing(undoOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(undoOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start();
    }
  }, [undoState, undoOpacity]);

  // Check if session is stale (24+ hours since last contraction)
  useEffect(() => {
    if (app.contractions.length === 0) return;
    const lastContraction = app.contractions[app.contractions.length - 1];
    const lastTime = lastContraction.endTime ?? lastContraction.startTime;
    if (Date.now() - lastTime > TWENTY_FOUR_HOURS) {
      setShowStalePrompt(true);
      analytics.staleSessionPromptShown();
    }
  }, []);

  const undoMessage =
    undoState?.type === 'session' ? 'Session deleted' : 'Contraction deleted';

  return (
    <ThemeProvider
        mode={mode}
        setMode={(nextMode) => app.updateSettings({ themeMode: nextMode })}
      >
        <SafeAreaProvider>
          <SharingProvider localContractions={app.contractions}>
          <View style={styles.container}>

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
                <Ionicons name="hand-left-outline" size={32} color="#4CAF50" />
                <Text style={styles.modalTitle}>Welcome back!</Text>
                <Text style={styles.modalBody}>
                  It has been a while since your last contraction. Would you like to start a new session?
                </Text>
                <Pressable
                  style={styles.modalPrimaryBtn}
                  onPress={() => { app.newSession(); setShowStalePrompt(false); analytics.staleSessionAction('new_session'); }}
                >
                  <Text style={styles.modalPrimaryText}>Start New Session</Text>
                </Pressable>
                <Pressable
                  style={styles.modalSecondaryBtn}
                  onPress={() => { setShowStalePrompt(false); analytics.staleSessionAction('keep_session'); }}
                >
                  <Text style={styles.modalSecondaryText}>Keep Current Session</Text>
                </Pressable>
              </View>
            </View>
          </Modal>

          {toastMessage && (
            <Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
              <Text style={styles.toastText}>{toastMessage}</Text>
            </Animated.View>
          )}
          {undoState && (
            <Animated.View
              style={[
                styles.undoToast,
                { opacity: undoOpacity, top: toastMessage ? 64 : 16 },
              ]}
            >
              <Text style={styles.undoText}>{undoMessage}</Text>
              <Pressable
                style={styles.undoAction}
                onPress={() => {
                  undoLast();
                  clearUndo();
                }}
              >
                <Text style={styles.undoActionText}>Undo</Text>
              </Pressable>
            </Animated.View>
          )}
          </View>
          <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
          </SharingProvider>
        </SafeAreaProvider>
      </ThemeProvider>
  );
}

const createStyles = (colors: typeof LightColors, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(46, 59, 46, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: colors.cream,
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 8,
    marginBottom: 4,
  },
  modalBody: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalPrimaryBtn: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.terracotta,
    alignItems: 'center',
    marginBottom: 10,
  },
  modalPrimaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
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
    color: colors.textMuted,
  },
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: 16,
    backgroundColor: isDark ? 'rgba(232, 239, 232, 0.92)' : 'rgba(46, 59, 46, 0.9)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  toastText: {
    fontSize: 14,
    fontWeight: '500',
    color: isDark ? '#1A211C' : colors.cream,
  },
  undoToast: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: colors.cream,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.beige,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  undoText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  undoAction: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: colors.beige,
  },
  undoActionText: {
    fontSize: 12,
    color: colors.terracotta,
    fontWeight: '600',
  },
});
