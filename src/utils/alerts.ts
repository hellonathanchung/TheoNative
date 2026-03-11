import type { Contraction, Settings } from '../types';

export interface AlertResult {
  triggered: boolean;
  approaching: boolean;
}

// Uses a rolling time window to approximate 5-1-1/4-1-1/3-1-1 style patterns
// by comparing average frequency (minutes apart) and duration (seconds).
export function evaluateContractions(
  contractions: Contraction[],
  settings: Settings
): AlertResult {
  const windowStart = Date.now() - settings.timeWindowMinutes * 60 * 1000;
  const recent = contractions.filter(
    (c) => c.startTime >= windowStart && c.endTime !== null && c.duration !== null
  );

  if (recent.length < 3) return { triggered: false, approaching: false };

  const intervals: number[] = [];
  for (let i = 1; i < recent.length; i++) {
    intervals.push((recent[i].startTime - recent[i - 1].startTime) / 1000 / 60);
  }
  const avgFreq = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const avgDur = recent.reduce((a, c) => a + c.duration!, 0) / recent.length;

  if (avgFreq <= settings.frequencyMinutes && avgDur >= settings.durationSeconds) {
    return { triggered: true, approaching: false };
  }

  const approaching =
    avgFreq <= settings.frequencyMinutes * 1.3 &&
    avgDur >= settings.durationSeconds * 0.7;

  return { triggered: false, approaching };
}

const messages = [
  'Your contractions are following a consistent pattern. It may be time to head to your birthing center.',
  'Things are progressing steadily. Consider calling your care provider.',
  "You're doing great. Your contractions have been regular \u2014 it might be time to go.",
];

export function getAlertMessage(): string {
  return messages[Math.floor(Math.random() * messages.length)];
}
