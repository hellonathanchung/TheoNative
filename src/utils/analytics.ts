import PostHog from 'posthog-react-native';
import Constants from 'expo-constants';

// PostHog configuration — reads API key from app.config.ts extra
const POSTHOG_API_KEY = Constants.expoConfig?.extra?.posthogApiKey ?? '';
const POSTHOG_HOST = 'https://us.i.posthog.com';

export const posthogClient = new PostHog(POSTHOG_API_KEY, {
  host: POSTHOG_HOST,
  // Flush events every 30 seconds or when 20 events are queued
  flushAt: 20,
  flushInterval: 30000,
  // Capture app lifecycle events automatically
  captureNativeAppLifecycleEvents: true,
  // Capture screen views automatically
  captureDeepLinks: true,
});

// Helper to track events with consistent naming
export const analytics = {
  // Contraction tracking
  contractionStarted: () =>
    posthogClient.capture('contraction_started'),

  contractionStopped: (durationSeconds: number, intensity?: string) =>
    posthogClient.capture('contraction_stopped', {
      duration_seconds: durationSeconds,
      intensity: intensity ?? 'none',
    }),

  contractionDeleted: () =>
    posthogClient.capture('contraction_deleted'),

  // Session tracking
  sessionStarted: () =>
    posthogClient.capture('session_started'),

  sessionEnded: (contractionCount: number) =>
    posthogClient.capture('session_ended', {
      contraction_count: contractionCount,
    }),

  // Alert tracking
  alertTriggered: (rule: string) =>
    posthogClient.capture('alert_triggered', { rule }),

  alertDismissed: () =>
    posthogClient.capture('alert_dismissed'),

  // Settings
  settingsChanged: (setting: string, value: string | number | boolean) =>
    posthogClient.capture('settings_changed', { setting, value }),

  presetSelected: (preset: string) =>
    posthogClient.capture('preset_selected', { preset }),

  themeChanged: (theme: string) =>
    posthogClient.capture('theme_changed', { theme }),

  // Feature usage
  onboardingCompleted: (preset: string) =>
    posthogClient.capture('onboarding_completed', { preset }),

  tabViewed: (tab: string) =>
    posthogClient.capture('tab_viewed', { tab }),

  gameStarted: (game: string) =>
    posthogClient.capture('game_started', { game }),

  // Engagement
  appOpened: () =>
    posthogClient.capture('app_opened'),

  staleSessionPromptShown: () =>
    posthogClient.capture('stale_session_prompt_shown'),

  staleSessionAction: (action: 'new_session' | 'keep_session') =>
    posthogClient.capture('stale_session_action', { action }),
};
