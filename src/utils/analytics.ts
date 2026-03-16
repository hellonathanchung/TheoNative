import { Platform } from 'react-native';
import PostHog from 'posthog-react-native';
import Constants from 'expo-constants';

// PostHog configuration — reads API key from app.config.ts extra
const POSTHOG_API_KEY = Constants.expoConfig?.extra?.posthogApiKey ?? '';
const POSTHOG_HOST = 'https://us.i.posthog.com';

// PostHog requires native file storage (expo-file-system) which isn't available on web.
// Skip initialization on web so the dev server doesn't crash.
export const posthogClient = Platform.OS !== 'web'
  ? new PostHog(POSTHOG_API_KEY, {
      host: POSTHOG_HOST,
      flushAt: 20,
      flushInterval: 30000,
      captureNativeAppLifecycleEvents: true,
      captureDeepLinks: true,
      autocapture: {
        captureScreens: false,
      },
    })
  : null;

const capture = (event: string, props?: Record<string, string | number | boolean | null>) => {
  posthogClient?.capture(event, props);
};

// Helper to track events with consistent naming
export const analytics = {
  // Contraction tracking
  contractionStarted: () =>
    capture('contraction_started'),

  contractionStopped: (durationSeconds: number, intensity?: string) =>
    capture('contraction_stopped', {
      duration_seconds: durationSeconds,
      intensity: intensity ?? 'none',
    }),

  contractionDeleted: () =>
    capture('contraction_deleted'),

  // Session tracking
  sessionStarted: () =>
    capture('session_started'),

  sessionEnded: (contractionCount: number) =>
    capture('session_ended', {
      contraction_count: contractionCount,
    }),

  // Alert tracking
  alertTriggered: (rule: string) =>
    capture('alert_triggered', { rule }),

  alertDismissed: () =>
    capture('alert_dismissed'),

  // Settings
  settingsChanged: (setting: string, value: string | number | boolean) =>
    capture('settings_changed', { setting, value }),

  presetSelected: (preset: string) =>
    capture('preset_selected', { preset }),

  themeChanged: (theme: string) =>
    capture('theme_changed', { theme }),

  // Feature usage
  tabViewed: (tab: string) =>
    capture('tab_viewed', { tab }),

  gameStarted: (game: string) =>
    capture('game_started', { game }),

  // Engagement
  appOpened: () =>
    capture('app_opened'),

  staleSessionPromptShown: () =>
    capture('stale_session_prompt_shown'),

  staleSessionAction: (action: 'new_session' | 'keep_session') =>
    capture('stale_session_action', { action }),

  // Partner sharing
  sharingSignInStarted: () =>
    capture('sharing_sign_in_started'),

  sharingSignInCompleted: () =>
    capture('sharing_sign_in_completed'),

  sharingSignedOut: () =>
    capture('sharing_signed_out'),

  partnerInviteSent: () =>
    capture('partner_invite_sent'),

  partnerInviteAccepted: () =>
    capture('partner_invite_accepted'),

  partnerDisconnected: () =>
    capture('partner_disconnected'),
};
