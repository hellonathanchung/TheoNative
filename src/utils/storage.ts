import { createMMKV } from 'react-native-mmkv';
import type { Contraction, Settings, Session } from '../types';

const storage = createMMKV();

const CONTRACTIONS_KEY = 'theo_contractions';
const SETTINGS_KEY = 'theo_settings';
const ACTIVE_KEY = 'theo_active';
const SESSIONS_KEY = 'theo_sessions';
const ONBOARDING_KEY = 'theo_onboarding_complete';

const DEFAULT_SETTINGS: Settings = {
  preset: '5-1-1' as const,
  frequencyMinutes: 5,
  durationSeconds: 60,
  timeWindowMinutes: 60,
  notificationsEnabled: true,
  hapticEnabled: true,
  intensityEnabled: true,
};

export function loadContractions(): Contraction[] {
  try {
    const raw = storage.getString(CONTRACTIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveContractions(contractions: Contraction[]): void {
  storage.set(CONTRACTIONS_KEY, JSON.stringify(contractions));
}

export function loadSettings(): Settings {
  try {
    const raw = storage.getString(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: Settings): void {
  storage.set(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadActiveState(): { isActive: boolean; activeStart: number | null } {
  try {
    const raw = storage.getString(ACTIVE_KEY);
    return raw ? JSON.parse(raw) : { isActive: false, activeStart: null };
  } catch {
    return { isActive: false, activeStart: null };
  }
}

export function saveActiveState(isActive: boolean, activeStart: number | null): void {
  storage.set(ACTIVE_KEY, JSON.stringify({ isActive, activeStart }));
}

export function loadSessions(): Session[] {
  try {
    const raw = storage.getString(SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSessions(sessions: Session[]): void {
  storage.set(SESSIONS_KEY, JSON.stringify(sessions));
}

export function loadOnboardingComplete(): boolean {
  try {
    if (storage.contains(SETTINGS_KEY)) return true;
    return storage.getString(ONBOARDING_KEY) === 'true';
  } catch {
    return false;
  }
}

export function saveOnboardingComplete(): void {
  storage.set(ONBOARDING_KEY, 'true');
}

export function hasExistingData(): boolean {
  return storage.contains(SETTINGS_KEY);
}

export function loadDinoHigh(): number {
  try {
    const raw = storage.getString('theo_dino_high');
    return raw ? parseInt(raw, 10) : 0;
  } catch {
    return 0;
  }
}

export function saveDinoHigh(score: number): void {
  storage.set('theo_dino_high', String(score));
}

export function loadBubbleHigh(): number {
  try {
    const raw = storage.getString('theo_bubble_high');
    return raw ? parseInt(raw, 10) : 0;
  } catch {
    return 0;
  }
}

export function saveBubbleHigh(score: number): void {
  storage.set('theo_bubble_high', String(score));
}

export function clearAllData(): void {
  storage.remove(CONTRACTIONS_KEY);
  storage.remove(SETTINGS_KEY);
  storage.remove(ACTIVE_KEY);
  storage.remove(SESSIONS_KEY);
  storage.remove(ONBOARDING_KEY);
  storage.remove('theo_dino_high');
  storage.remove('theo_bubble_high');
}
