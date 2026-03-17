// 4 color stops across the 1–50 intensity scale (t = 0 to 1)
const STOPS = [
  { t: 0,    r: 0x7C, g: 0xB3, b: 0x42 }, // #7CB342 — green
  { t: 0.33, r: 0xF9, g: 0xA8, b: 0x25 }, // #F9A825 — amber
  { t: 0.66, r: 0xE6, g: 0x4A, b: 0x19 }, // #E64A19 — orange-red
  { t: 1.00, r: 0xC6, g: 0x28, b: 0x28 }, // #C62828 — deep red
];

function lerpChannel(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

function toHex(n: number): string {
  return n.toString(16).padStart(2, '0');
}

/** Returns a hex color for intensity value 1–50. */
export function getIntensityColor(value: number): string {
  const t = (Math.min(50, Math.max(1, value)) - 1) / 49;

  for (let i = 0; i < STOPS.length - 1; i++) {
    const a = STOPS[i];
    const b = STOPS[i + 1];
    if (t <= b.t) {
      const segT = (t - a.t) / (b.t - a.t);
      return `#${toHex(lerpChannel(a.r, b.r, segT))}${toHex(lerpChannel(a.g, b.g, segT))}${toHex(lerpChannel(a.b, b.b, segT))}`;
    }
  }

  const last = STOPS[STOPS.length - 1];
  return `#${toHex(last.r)}${toHex(last.g)}${toHex(last.b)}`;
}

/** Returns border style for a contraction row based on intensity 1–50. */
export function getIntensityBorderStyle(value: number): { borderColor: string; borderWidth: number } {
  return {
    borderColor: getIntensityColor(value),
    borderWidth: 1 + (value - 1) / 49, // 1.0 at value 1 → 2.0 at value 50
  };
}

/** Migrates legacy string intensity values to the 1–50 numeric scale. */
export function migrateIntensity(raw: unknown): number | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw === 'number') return Math.min(50, Math.max(1, Math.round(raw)));
  if (raw === 'mild') return 17;
  if (raw === 'moderate') return 25;
  if (raw === 'strong') return 42;
  return undefined;
}
