import React, { createContext, useContext, useMemo } from 'react';

export const LightColors = {
  cream: '#F5FAF5',
  beige: '#E8F0E8',
  softGreen: '#C8E6C9',
  mediumGreen: '#A5D6A7',
  green: '#81C784',
  deepGreen: '#4CAF50',
  intensityMild: '#7CB342',
  intensityModerate: '#F9A825',
  intensityStrong: '#E64A19',
  textPrimary: '#2E3B2E',
  textSecondary: '#5A6B5A',
  textMuted: '#8A9B8A',
  danger: '#D32F2F',
  white: '#FFFFFF',
  softCoral: '#A5D6A7',
  terracotta: '#4CAF50',
  warmAmber: '#81C784',
  warmBeige: '#E8F0E8',
  softPeach: '#C8E6C9',
};

export const DarkColors = {
  cream: '#111512',
  beige: '#1A211C',
  softGreen: '#223125',
  mediumGreen: '#2B3B2C',
  green: '#3A4E3B',
  deepGreen: '#6A9E32',
  intensityMild: '#9CCC65',
  intensityModerate: '#FFB74D',
  intensityStrong: '#FF7043',
  textPrimary: '#E8EFE8',
  textSecondary: '#C0C9C0',
  textMuted: '#98A398',
  danger: '#EF5350',
  white: '#FFFFFF',
  softCoral: '#4A6B4A',
  terracotta: '#5A8E28',
  warmAmber: '#3A6B28',
  warmBeige: '#1A211C',
  softPeach: '#2A3A2C',
};

export type ThemeColors = typeof LightColors;
export type ThemeMode = 'light' | 'dark';

const ThemeContext = createContext({
  mode: 'light' as ThemeMode,
  colors: LightColors,
  setMode: (_mode: ThemeMode) => {},
});

export function ThemeProvider({
  mode,
  setMode,
  children,
}: {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  children: React.ReactNode;
}) {
  const colors = mode === 'dark' ? DarkColors : LightColors;
  const value = useMemo(() => ({ mode, colors, setMode }), [mode, colors, setMode]);
  return React.createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme() {
  return useContext(ThemeContext);
}

// Backwards-compatible alias for any remaining imports.
export const Colors = LightColors;
