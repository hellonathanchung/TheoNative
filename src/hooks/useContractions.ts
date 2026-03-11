import { useState, useCallback, useEffect } from 'react';
import { Vibration, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import type { Contraction, Settings, Session, Intensity } from '../types';
import {
  loadContractions, saveContractions,
  loadSettings, saveSettings,
  loadActiveState, saveActiveState,
  loadSessions, saveSessions,
} from '../utils/storage';
import { evaluateContractions, getAlertMessage } from '../utils/alerts';

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function triggerHaptic(style: 'light' | 'medium' | 'heavy' = 'medium') {
  try {
    const map = {
      light: Haptics.ImpactFeedbackStyle.Light,
      medium: Haptics.ImpactFeedbackStyle.Medium,
      heavy: Haptics.ImpactFeedbackStyle.Heavy,
    };
    await Haptics.impactAsync(map[style]);
  } catch {
    Vibration.vibrate(50);
  }
}

async function sendLocalNotification(message: string) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Theo', body: message },
      trigger: null,
    });
  } catch {
    // Notification permission may not be granted
  }
}

export function useContractions() {
  const [contractions, setContractions] = useState<Contraction[]>(loadContractions);
  const [sessions, setSessions] = useState<Session[]>(loadSessions);
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [isActive, setIsActive] = useState(false);
  const [activeStart, setActiveStart] = useState<number | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [lastAlertTime, setLastAlertTime] = useState(0);
  const [pendingIntensityId, setPendingIntensityId] = useState<string | null>(null);

  // Restore active state on mount
  useEffect(() => {
    const saved = loadActiveState();
    if (saved.isActive && saved.activeStart) {
      setIsActive(true);
      setActiveStart(saved.activeStart);
    }
  }, []);

  // Persist contractions
  useEffect(() => {
    saveContractions(contractions);
  }, [contractions]);

  // Persist settings
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Persist sessions
  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  const startContraction = useCallback(() => {
    const now = Date.now();
    setIsActive(true);
    setActiveStart(now);
    saveActiveState(true, now);

    if (settings.hapticEnabled) triggerHaptic('medium');
  }, [settings.hapticEnabled]);

  const stopContraction = useCallback(() => {
    if (!activeStart) return;

    const now = Date.now();
    const duration = (now - activeStart) / 1000;
    const newContraction: Contraction = {
      id: generateId(),
      startTime: activeStart,
      endTime: now,
      duration,
    };

    setContractions((prev) => {
      const updated = [...prev, newContraction];

      const completed = updated.filter((c) => c.endTime !== null);
      const result = evaluateContractions(completed, settings);

      if (result.triggered && now - lastAlertTime > 15 * 60 * 1000) {
        const msg = getAlertMessage();
        setAlertMessage(msg);
        setLastAlertTime(now);

        if (settings.notificationsEnabled) {
          sendLocalNotification(msg);
        }
      }

      return updated;
    });

    setIsActive(false);
    setActiveStart(null);
    saveActiveState(false, null);

    if (settings.intensityEnabled) {
      setPendingIntensityId(newContraction.id);
    }

    if (settings.hapticEnabled) triggerHaptic('heavy');
  }, [activeStart, settings, lastAlertTime]);

  const newSession = useCallback(() => {
    if (contractions.length > 0) {
      const session: Session = {
        id: generateId(),
        startedAt: contractions[0].startTime,
        endedAt: contractions[contractions.length - 1].endTime ?? Date.now(),
        contractions: [...contractions],
      };
      setSessions((prev) => [session, ...prev]);
    }
    setContractions([]);
    setAlertMessage(null);
    setPendingIntensityId(null);
    setIsActive(false);
    setActiveStart(null);
    saveActiveState(false, null);
  }, [contractions]);

  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const setIntensity = useCallback((id: string, intensity: Intensity) => {
    setContractions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, intensity } : c))
    );
    setPendingIntensityId(null);
  }, []);

  const dismissIntensityPrompt = useCallback(() => {
    setPendingIntensityId(null);
  }, []);

  const updateContraction = useCallback((id: string, updates: Partial<Contraction>) => {
    setContractions((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const updated = { ...c, ...updates };
        if (updated.startTime && updated.endTime) {
          updated.duration = (updated.endTime - updated.startTime) / 1000;
        }
        return updated;
      })
    );
  }, []);

  const deleteContraction = useCallback((id: string) => {
    setContractions((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const dismissAlert = useCallback(() => {
    setAlertMessage(null);
  }, []);

  const updateSettings = useCallback((partial: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  const completed = contractions.filter((c) => c.endTime !== null);

  const getUrgencyState = useCallback((): 'resting' | 'active' | 'approaching' => {
    if (isActive) return 'active';
    if (completed.length < 3) return 'resting';
    const result = evaluateContractions(completed, settings);
    if (result.triggered || result.approaching) return 'approaching';
    return 'resting';
  }, [isActive, completed, settings]);

  return {
    contractions: completed,
    sessions,
    isActive,
    activeStart,
    alertMessage,
    settings,
    pendingIntensityId,
    startContraction,
    stopContraction,
    newSession,
    deleteSession,
    setIntensity,
    dismissIntensityPrompt,
    updateContraction,
    deleteContraction,
    dismissAlert,
    updateSettings,
    getUrgencyState,
  };
}
