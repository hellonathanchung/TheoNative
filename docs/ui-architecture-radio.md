# Theo – UI Architecture (RADIO Format)

---

## R – Requirements

### Functional Requirements

| Priority | Requirement |
|---|---|
| P0 | Time contractions (start/stop) with live elapsed display |
| P0 | Show time since last contraction between recordings |
| P0 | Evaluate contraction patterns against 5-1-1 / 4-1-1 / 3-1-1 alert rules |
| P0 | Persist all data offline-first (no login required) |
| P1 | Archive current contractions into a named session; start fresh |
| P1 | View and edit individual contraction details (time, duration, intensity) |
| P1 | Rate contraction intensity (1–50 scale) |
| P1 | View past sessions with statistics |
| P1 | Notify user (push + haptic) when alert threshold is met |
| P2 | Share live contractions with a partner in real-time (Supabase sync) |
| P2 | Generate a read-only share link for midwife / care team |
| P2 | Mini-games (DinoGame, BubbleGame) + fun facts for distraction |
| P2 | Export contraction history as CSV |
| P3 | Dark / light theme toggle |
| P3 | Undo deleted contractions and sessions (5-second window) |

### Non-Functional Requirements

- **Offline-first** – core timing and local history works with no internet
- **Low latency input** – start/stop button must respond instantly; no async on the critical path
- **Real-time sync** – partner sees new contractions within ~1 second via Supabase Realtime
- **Crash resilience** – Skia canvas failures (DinoGame/BubbleGame) must not crash the app
- **Battery-friendly** – polling avoided; Realtime subscriptions + foreground-refresh only

---

## A – Architecture

### High-Level Layer Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        App.tsx                               │
│  ThemeProvider → SharingProvider → NavigationContainer       │
│  + global modals: Disclaimer, StaleSession, AlertBanner,     │
│    Toast, UndoToast                                          │
└──────────────────────────┬──────────────────────────────────┘
                           │ app (useContractions)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    TabNavigator                              │
│  SwipeLockProvider + PanResponder swipe nav (4 tabs)         │
└────┬──────────────┬──────────────┬──────────────┬───────────┘
     │              │              │              │
     ▼              ▼              ▼              ▼
┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐
│  Timer  │  │ History  │  │  Relax   │  │  Settings    │
│ Screen  │  │ Screen   │  │  Screen  │  │  Screen      │
└─────────┘  └──────────┘  └──────────┘  └──────────────┘
```

### Context & Provider Tree

```
App
 └── ThemeProvider (mode + colors)
      └── SafeAreaProvider
           └── SharingProvider (user, partner, sync, newSession)
                └── SwipeLockProvider (gesture lock stack)
                     └── TabNavigator
                          ├── TimerScreen
                          ├── HistoryScreen
                          ├── RelaxScreen
                          └── SettingsScreen
```

### State Ownership

```
┌──────────────────────────────────────────────────────────────┐
│  useContractions (App.tsx)  — local, persisted via MMKV      │
│                                                              │
│  contractions[]  sessions[]  settings  isActive  activeStart │
│  alertMessage    pendingIntensityId    undoState             │
└──────────────────────────────────────────────────────────────┘
         │ passed as `app` prop to TabNavigator → screens

┌──────────────────────────────────────────────────────────────┐
│  SharingContext  — remote, Supabase-backed                   │
│                                                              │
│  user  partner  partnerId  mergedContractions[]              │
│  partnerContractions[]     pendingInvites  sentInvite        │
└──────────────────────────────────────────────────────────────┘
         │ consumed via useSharing() in any screen

┌─────────────────────────────────────────┐
│  SwipeLockContext  — ephemeral UI state  │
│  lockRef (modal open count)             │
└─────────────────────────────────────────┘
         │ consumed via useSwipeLock() in modals + TabNavigator
```

### Component Hierarchy per Screen

```
TimerScreen
├── ScreenBackground (animated leaf backdrop)
├── BackgroundLeaves
├── Timer display (elapsed / timeSinceLast)
├── Start/Stop button (Reanimated breathing pulse)
├── New Session button
├── ScrollView → contraction list
│   ├── DaySeparator (date headers)
│   └── SwipeableRow → ContractionCard
│       └── [tap] ContractionDetailModal
├── IntensityPicker modal    (if pendingIntensityId)
├── AutoPause warning modal  (if 5 min elapsed while active)
└── NewSession confirm modal

HistoryScreen
├── Stats cards (count, avg duration, avg interval)
├── Current session list
│   └── SwipeableRow → ContractionCard
│       └── [tap] ContractionDetailModal
└── Past sessions (expandable)
    └── SwipeableRow → ContractionCard (read-only)

RelaxScreen
├── Compact live timer bar
├── FunFacts carousel  (locks SwipeLock on horizontal drag)
├── DinoGame           (Skia canvas — GameErrorBoundary wraps)
│   └── DifficultySelector
└── BubbleGame         (Skia canvas — GameErrorBoundary wraps)
    └── DifficultySelector

SettingsScreen
├── Alert preset selector (5-1-1 / 4-1-1 / 3-1-1 / custom)
├── Custom threshold steppers
├── Toggle row: Notifications / Haptics / Intensity tracking
├── Theme toggle
├── PartnerSharing   (auth + invite flow — 4 states)
├── MidwifeSharing   (share link create/copy/deactivate)
├── Export CSV button
├── Clear all data   (confirmation modal)
└── Version badge + disclaimer link
```

---

## D – Data Model

### Local (MMKV)

```
Key                       Type        Description
─────────────────────────────────────────────────────────────
theo_contractions         JSON        Contraction[]  (active session)
theo_sessions             JSON        Session[]      (archived)
theo_settings             JSON        Settings
theo_active               JSON        { isActive, activeStart }
theo_dino_high            string      high score
theo_bubble_high          string      high score
theo_disclaimer_accepted  boolean
theo_onboarding_complete  boolean
theo_supabase_auth        string      Supabase auth tokens (MMKV adapter)
```

### Remote (Supabase)

```
┌────────────────────────────────────────────────────┐
│  profiles                                          │
│  id (uuid, FK → auth.users)                        │
│  email  display_name  created_at                   │
└────────────────────────────────────────────────────┘
         ▲ 1                              ▲ 1
         │ inviter                        │ invitee
         │                               │
┌────────────────────────────────────────────────────┐
│  partnerships                                      │
│  id (uuid PK)                                      │
│  inviter_id (FK → auth.users)                      │
│  invitee_email  invitee_id (FK → auth.users)       │
│  status: 'pending' | 'accepted' | 'declined'       │
│  created_at  accepted_at                           │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│  contractions                                      │
│  id + user_id (composite PK)                       │
│  user_id (FK → auth.users)                         │
│  start_time  end_time  duration  intensity         │
│  created_at                                        │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│  share_links                                       │
│  id (uuid PK)                                      │
│  user_id (FK → auth.users)                         │
│  token (unique string)                             │
│  active  expires_at  created_at                    │
└────────────────────────────────────────────────────┘
```

### Core TypeScript Types

```typescript
interface Contraction {
  id: string;                  // client-generated UUID
  startTime: number;           // Unix ms
  endTime: number | null;      // null while active
  duration: number | null;     // seconds, null while active
  intensity?: number;          // 1–50
  flagged?: boolean;
}

interface Session {
  id: string;
  startedAt: number;           // first contraction startTime
  endedAt: number;             // last contraction endTime
  contractions: Contraction[]; // snapshot at archive time
}

type MergedContraction = Contraction & { isPartner: boolean };

interface Settings {
  preset: '5-1-1' | '4-1-1' | '3-1-1' | 'custom';
  frequencyMinutes: number;
  durationSeconds: number;
  timeWindowMinutes: number;
  notificationsEnabled: boolean;
  hapticEnabled: boolean;
  intensityEnabled: boolean;
  dinoDifficulty: 'easy' | 'normal' | 'hard';
  bubbleDifficulty: 'easy' | 'normal' | 'hard';
  themeMode: 'light' | 'dark';
}
```

---

## I – Interface (Component & Hook APIs)

### Core Hook: `useContractions()`

```
startContraction()         → void        Set isActive=true, record activeStart
stopContraction()          → Promise     Create Contraction, evaluate alerts,
                                         trigger intensity prompt if enabled
newSession()               → void        Archive to Session[], clear active list
deleteContraction(id)      → void        Remove + set undoState (5s window)
deleteSession(id)          → void        Remove + set undoState (5s window)
updateContraction(id, Δ)   → void        Clamp times, recalculate duration
setIntensity(id, n)        → void        Update intensity, clear prompt
updateSettings(Δ)          → void        Merge into Settings, persist
getUrgencyState()          → 'resting' | 'active' | 'approaching'
undoLast()                 → void        Restore from undoState
resetAllData()             → void        Wipe MMKV + reset all state
```

### Sharing Hook: `useSharing()` (via SharingContext)

```
// Auth
signInWithOtp(email)       → Promise     Send OTP magic link
verifyOtp(email, token)    → Promise     Exchange OTP for session
signOut()                  → Promise

// Partnership
invitePartner(email)       → Promise     Create partnership row (guard: dupe, self, already connected)
acceptInvite(id)           → Promise     Update status=accepted, set invitee_id=auth.uid()
declineInvite(id)          → Promise     Update status=declined
cancelInvite()             → Promise     Delete sent pending invite
disconnect()               → Promise     Delete all partnership rows for user

// Sync
newSession()               → Promise     archive locally + delete from Supabase → fires partner Realtime
clearSyncedContractions()  → Promise     Delete user's rows from Supabase

// Derived
mergedContractions         MergedContraction[]   local + partner, sorted by startTime
partnerContractions        Contraction[]         partner's current-session contractions
```

### Timer Hooks

```
useTimer(isActive, activeStart)
  → elapsed: number (seconds, updates every 1s while active)

useTimeSinceLast(isActive, lastEndTime)
  → since: number (seconds since last contraction ended, updates every 1s while not active)
```

### Key Component Props

```typescript
// ContractionDetailModal
{ contraction: Contraction | null; contractions?: Contraction[];
  onClose(): void; onUpdate(id, Δ): void; onDelete(id): void; readOnly?: boolean }

// SwipeableRow
{ children: ReactNode; onDelete(): void; onFlag(): void; colors: ThemeColors }

// IntensityPicker
{ onSelect(intensity: number): void; onSkip(): void }

// DifficultySelector
{ value: GameDifficulty; onChange(d: GameDifficulty): void }
```

### Supabase Realtime Subscriptions

```
Channel: `partner-contractions-{partnerId}`
  table: contractions, filter: user_id=eq.{partnerId}
  events: INSERT | UPDATE | DELETE → fetchPartnerData()

Channel: `partnership-changes`
  table: partnerships (no filter — filtered client-side)
  events: INSERT | UPDATE | DELETE → fetchPartnerships()
```

---

## O – Optimizations

### Performance

| Technique | Where | Why |
|---|---|---|
| MMKV storage | All persistence | 10× faster than AsyncStorage; synchronous reads on mount |
| Debounced upsert (500ms) | useSync | Batches rapid contraction updates into one Supabase write |
| Fingerprint check | useSync | Skips redundant upserts when contraction list hasn't changed |
| `useMemo` on mergedContractions | SharingContext | Prevents re-sort on every render; only re-runs when inputs change |
| Reanimated 4 (UI thread) | Breathing button, leaf BG | Animations run on native thread; won't block JS during timer |
| Skia canvas | DinoGame, BubbleGame | GPU-accelerated 2D; `GameErrorBoundary` prevents crash propagation |
| `useRef` for mountedRef | useSync | Prevents setState after unmount |
| Composite PK `(id, user_id)` | contractions table | Matches upsert `onConflict` exactly; no separate unique index needed |

### UX

| Technique | Where | Why |
|---|---|---|
| Undo toast (5s) | Delete contraction/session | Forgives accidental swipe-deletes without a confirmation dialog |
| SwipeLock context | Modals + TabNavigator | Prevents swipe-to-navigate while a bottom-sheet/modal is open |
| Stale session prompt | App.tsx | Auto-detects 24h gap and offers to start fresh — prevents stale data confusion |
| Pending intensity prompt | Post-stopContraction | Non-blocking: shows after stop so it doesn't interrupt timing flow |
| Partner read-only mode | ContractionDetailModal | Prevents editing partner's data while still surfacing detail |
| Auto-pause warning | TimerScreen | Alerts user if they forgot to stop a contraction after 5 min |
| 15-min alert cooldown | evaluateContractions | Prevents notification spam if threshold stays triggered |
| FunFacts swipe lock | RelaxScreen | Locks parent scroll + tab swipe during horizontal carousel interaction |

### Tradeoffs / Known Limitations

| Issue | Current state | Ideal |
|---|---|---|
| Session history is local-only | Sessions never sync to Supabase | Add a `sessions` table; partner sees session boundaries |
| 1:1 partner model | `partnerships` table has one accepted row per user | Multi-observer support (midwife + partner simultaneously) |
| No offline queue for sync | Failed upserts retry only on next local change | Persist a sync queue in MMKV; flush on reconnect |
| Error swallowing in useSync | `catch { // Offline }` hides Supabase errors silently | Expose error state so UI can show "sync failed" indicator |
| Share link auth | Token-based, no expiry enforcement client-side | Enforce expiry server-side via RLS `expires_at > now()` |
| Realtime RLS gap | Postgres Changes only fire if subscriber has SELECT access | Partner SELECT RLS policy (now fixed) is required for Realtime to deliver events |
