export type Intensity = 'mild' | 'moderate' | 'strong';

export interface Contraction {
  id: string;
  startTime: number;
  endTime: number | null;
  duration: number | null;
  intensity?: Intensity;
}

export type Preset = '5-1-1' | '4-1-1' | '3-1-1' | 'custom';

export interface Settings {
  preset: Preset;
  frequencyMinutes: number;
  durationSeconds: number;
  timeWindowMinutes: number;
  notificationsEnabled: boolean;
  hapticEnabled: boolean;
  intensityEnabled: boolean;
}

export interface Session {
  id: string;
  startedAt: number;
  endedAt: number;
  contractions: Contraction[];
}

export interface AppState {
  contractions: Contraction[];
  sessions: Session[];
  settings: Settings;
  isActive: boolean;
  activeStart: number | null;
}
