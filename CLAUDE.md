# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Theo** is a React Native contraction timer app for monitoring labor contractions. Built with Expo (~55) and React Native 0.83.2, targeting iOS and Android.

## Commands

```bash
npm start          # Start Expo dev server
npm run android    # Run on Android
npm run ios        # Run on iOS
npm run web        # Run on web
```

No lint or test scripts are configured.

## Architecture

### State Management
All app state lives in `src/hooks/useContractions.ts` — a single custom hook managing contractions, sessions, settings, and active timer state. Data is persisted with MMKV (`src/utils/storage.ts`) using prefixed keys (`theo_*`).

### Navigation
Bottom tab navigator (`src/navigation/TabNavigator.tsx`) with 4 tabs: Track, History, Relax, Settings.

### Key Files
- `src/types.ts` — Core types: `Contraction`, `Session`, `Settings`
- `src/theme.ts` — Color palette and styling constants (green/cream/coral)
- `src/utils/alerts.ts` — `evaluateContractions()` logic for 5-1-1, 4-1-1, 3-1-1 alert rules
- `src/utils/storage.ts` — MMKV storage wrapper and default settings

### Screens
- `TimerScreen` — Main recording UI with animated start/stop button, recent contractions list, intensity picker modal
- `HistoryScreen` — Current session stats + expandable past sessions
- `RelaxScreen` — Two mini-games (DinoGame via Skia canvas, BubbleGame) + rotating fun facts
- `SettingsScreen` — Alert rule presets, notification/haptic toggles, data management

### Key Dependencies
- **React Native Reanimated 4** — Animations throughout (breathing button, leaf background)
- **Shopify React Native Skia 2.x** — Canvas rendering for DinoGame and BubbleGame
- **react-native-mmkv** — High-performance local storage (all data is offline-first)
- **expo-notifications / expo-haptics** — Device feedback when alert thresholds are met

### Onboarding
`src/components/Onboarding.tsx` is a 3-screen flow shown once (tracked via `theo_onboarding_complete` in MMKV). It presents welcome, preset selection, and how-it-works screens.
