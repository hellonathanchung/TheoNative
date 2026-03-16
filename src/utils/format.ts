import type { Contraction } from '../types';

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatInterval(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (days > 0) {
    if (hours > 0) return `${days}d ${hours}h`;
    return `${days}d`;
  }

  if (hours > 0) {
    if (minutes > 0) return `${hours}h ${minutes}m`;
    return `${hours}h`;
  }

  if (minutes > 0) {
    if (secs > 0) return `${minutes}m ${secs}s`;
    return `${minutes}m`;
  }

  return `${secs}s`;
}

export function formatDayLabel(ms: number): string {
  const date = new Date(ms);
  const now = new Date();

  const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffDays = Math.round(
    (today.getTime() - dateDay.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return 'TODAY';
  if (diffDays === 1) return 'YESTERDAY';

  return date
    .toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
    .toUpperCase();
}

export type DayListItem =
  | { type: 'separator'; label: string; key: string }
  | { type: 'contraction'; contraction: Contraction; key: string };

export function groupWithDaySeparators(
  contractions: Contraction[],
): DayListItem[] {
  if (contractions.length === 0) return [];

  const items: DayListItem[] = [];
  let lastDayKey: string | null = null;

  for (const c of contractions) {
    const date = new Date(c.startTime);
    const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

    if (dayKey !== lastDayKey) {
      items.push({ type: 'separator', label: formatDayLabel(c.startTime), key: `sep-${dayKey}` });
      lastDayKey = dayKey;
    }

    items.push({ type: 'contraction', contraction: c, key: c.id });
  }

  return items;
}
