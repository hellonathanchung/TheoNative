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

```mermaid
graph TD
    App["App.tsx\nuseContractions · global modals · theme"]

    App --> TP["ThemeProvider\nmode + colors"]
    TP --> SAP["SafeAreaProvider"]
    SAP --> SP["SharingProvider\nuser · partner · sync · newSession"]
    SP --> NC["NavigationContainer"]
    NC --> TN["TabNavigator\nSwipeLockProvider · PanResponder swipe nav"]

    TN --> TS["Track\nTimerScreen"]
    TN --> HS["History\nHistoryScreen"]
    TN --> RS["Relax\nRelaxScreen"]
    TN --> SS["Settings\nSettingsScreen"]

    App --> GM["Global Modals\nDisclaimer · StaleSession\nAlertBanner · Toast · UndoToast"]

    style App fill:#4a7c59,color:#fff
    style TN fill:#4a7c59,color:#fff
    style TS fill:#6b9e7a,color:#fff
    style HS fill:#6b9e7a,color:#fff
    style RS fill:#6b9e7a,color:#fff
    style SS fill:#6b9e7a,color:#fff
    style SP fill:#c47c5a,color:#fff
    style TP fill:#8b6f47,color:#fff
```

### Context & Provider Tree

```mermaid
graph TD
    A["App()"] --> B["ThemeProvider\nmode='light'|'dark'  colors"]
    B --> C["SafeAreaProvider"]
    C --> D["SharingProvider\nonNewSession=app.newSession\nlocalContractions=app.contractions"]
    D --> E["SwipeLockProvider\nlockRef: MutableRefObject‹number›"]
    E --> F["TabNavigator\napp prop passed down"]
    F --> G["TimerScreen"]
    F --> H["HistoryScreen"]
    F --> I["RelaxScreen"]
    F --> J["SettingsScreen"]

    D -. "useSharing()" .-> G
    D -. "useSharing()" .-> H
    D -. "useSharing()" .-> J
    E -. "useSwipeLock()" .-> F
    E -. "useSwipeLock()" .-> G
    E -. "useSwipeLock()" .-> I

    style D fill:#c47c5a,color:#fff
    style E fill:#8b6f47,color:#fff
```

### State Ownership

```mermaid
graph LR
    subgraph LOCAL["Local State — useContractions (App.tsx)"]
        C["contractions[]"]
        SES["sessions[]"]
        SET["settings"]
        IA["isActive"]
        AS["activeStart"]
        AM["alertMessage"]
        PI["pendingIntensityId"]
        US["undoState"]
    end

    subgraph REMOTE["Remote State — SharingContext (Supabase)"]
        U["user"]
        P["partner / partnerId"]
        MC["mergedContractions[]"]
        PC["partnerContractions[]"]
        INV["pendingInvites / sentInvite"]
    end

    subgraph EPHEMERAL["Ephemeral — SwipeLockContext"]
        LR["lockRef (modal stack counter)"]
    end

    LOCAL -- "app prop" --> TN["TabNavigator → Screens"]
    REMOTE -- "useSharing()" --> TN
    EPHEMERAL -- "useSwipeLock()" --> TN

    MMKV[("MMKV\npersistence")] --> LOCAL
    SUPA[("Supabase\nPostgres + Realtime")] --> REMOTE
```

### Component Hierarchy

```mermaid
graph TD
    subgraph TIMER["TimerScreen"]
        T_BG["ScreenBackground\nBackgroundLeaves"]
        T_DISP["Timer Display\nelapsed · timeSinceLast"]
        T_BTN["Start/Stop Button\nReanimated breathing pulse"]
        T_NS["New Session Button"]
        T_LIST["ScrollView → Contraction List"]
        T_LIST --> T_DAY["DaySeparator"]
        T_LIST --> T_ROW["SwipeableRow → ContractionCard"]
        T_ROW --> T_MODAL["ContractionDetailModal"]
        T_M1["IntensityPicker modal\nif pendingIntensityId"]
        T_M2["AutoPause modal\nif 5 min elapsed"]
        T_M3["NewSession confirm modal"]
    end

    subgraph HISTORY["HistoryScreen"]
        H_STATS["Stats Cards\ncount · avg duration · avg interval"]
        H_CUR["Current Session List"]
        H_CUR --> H_ROW["SwipeableRow → ContractionCard"]
        H_ROW --> H_MODAL["ContractionDetailModal"]
        H_PAST["Past Sessions (expandable)"]
        H_PAST --> H_PAST_ROW["ContractionCard read-only"]
    end

    subgraph RELAX["RelaxScreen"]
        R_BAR["Compact Live Timer Bar"]
        R_FF["FunFacts Carousel\nlocks SwipeLock on drag"]
        R_DINO["DinoGame\nSkia canvas"]
        R_DINO --> R_EB1["GameErrorBoundary"]
        R_DINO --> R_DS1["DifficultySelector"]
        R_BUBBLE["BubbleGame\nSkia canvas"]
        R_BUBBLE --> R_EB2["GameErrorBoundary"]
        R_BUBBLE --> R_DS2["DifficultySelector"]
    end

    subgraph SETTINGS["SettingsScreen"]
        S_PRESET["Alert Preset Selector\n5-1-1 · 4-1-1 · 3-1-1 · custom"]
        S_THRESH["Custom Threshold Steppers"]
        S_TOGGLE["Toggles\nnotifications · haptics · intensity"]
        S_THEME["Theme Toggle"]
        S_PARTNER["PartnerSharing\nauth + invite flow (4 states)"]
        S_MW["MidwifeSharing\nshare link create/copy/deactivate"]
        S_EXPORT["Export CSV"]
        S_CLEAR["Clear All Data\nconfirmation modal"]
    end
```

### Contraction Lifecycle (State Machine)

```mermaid
stateDiagram-v2
    [*] --> Resting : app loads

    Resting --> Active : startContraction()\nisActive=true · activeStart=now

    Active --> Resting : stopContraction()\ncreate Contraction · evaluate alerts\n→ intensity prompt if enabled

    Resting --> Archived : newSession()\narchive to Session[]\nclear contractions[]\ndelete from Supabase

    Archived --> Resting : session complete

    Active --> Resting : auto-pause warning\n(5 min elapsed)

    note right of Active
        useTimer ticks every 1s
        elapsed displayed in UI
    end note

    note right of Resting
        useTimeSinceLast ticks every 1s
        time-since displayed in UI
    end note
```

### Partner Sync Flow

```mermaid
sequenceDiagram
    participant A as You (Nathan)
    participant MMKV as MMKV (local)
    participant SB as Supabase
    participant RT as Supabase Realtime
    participant B as Partner (Yerim)

    Note over A,B: Recording a contraction

    A->>MMKV: stopContraction() → save locally
    A->>SB: upsert contractions (debounced 500ms)
    SB->>RT: INSERT event fires
    RT->>B: postgres_changes subscription
    B->>SB: fetchPartnerData()
    SB-->>B: returns new contraction row
    B->>B: setPartnerContractions()\nmergedContractions updates

    Note over A,B: Starting a new session

    A->>MMKV: newSession() → archive to sessions[]
    A->>SB: clearSyncedContractions()\nDELETE WHERE user_id=Nathan
    SB->>RT: DELETE events fire
    RT->>B: postgres_changes subscription
    B->>SB: fetchPartnerData()
    SB-->>B: returns empty []
    B->>B: partnerContractions=[]\nscreen clears
```

### Partnership Invite Flow

```mermaid
sequenceDiagram
    participant N as Nathan
    participant SB as Supabase
    participant Y as Yerim

    N->>SB: invitePartner("hahmyerim@gmail.com")\nINSERT partnerships (status=pending)

    SB-->>Y: Realtime: partnerships INSERT
    Y->>SB: fetchPartnerships()
    SB-->>Y: pending invite visible

    Y->>SB: acceptInvite(id)\nUPDATE status=accepted · invitee_id=Yerim.uid

    SB-->>N: Realtime: partnerships UPDATE
    N->>SB: fetchPartnerships()
    SB-->>N: partnerId = Yerim.uid

    Note over N,Y: Both now have partnerId set
    Note over N,Y: useSync begins fetching each other's contractions
```

---

## D – Data Model

### Local Storage (MMKV)

```mermaid
graph LR
    subgraph MMKV["MMKV Store (theo_* keys)"]
        K1["theo_contractions\nContraction[] — active session"]
        K2["theo_sessions\nSession[] — archived"]
        K3["theo_settings\nSettings"]
        K4["theo_active\n{isActive, activeStart}"]
        K5["theo_dino_high\ntheo_bubble_high"]
        K6["theo_disclaimer_accepted\ntheo_onboarding_complete"]
        K7["theo_supabase_auth\nSupabase tokens (MMKV adapter)"]
    end
```

### Remote Schema (Supabase)

```mermaid
erDiagram
    AUTH_USERS {
        uuid id PK
        string email
    }

    PROFILES {
        uuid id PK
        string email
        string display_name
        timestamp created_at
    }

    PARTNERSHIPS {
        uuid id PK
        uuid inviter_id FK
        string invitee_email
        uuid invitee_id FK
        string status
        timestamp created_at
        timestamp accepted_at
    }

    CONTRACTIONS {
        uuid id PK
        uuid user_id PK
        bigint start_time
        bigint end_time
        int duration
        int intensity
        timestamp created_at
    }

    SHARE_LINKS {
        uuid id PK
        uuid user_id FK
        string token
        bool active
        timestamp expires_at
        timestamp created_at
    }

    AUTH_USERS ||--|| PROFILES : "has"
    AUTH_USERS ||--o{ PARTNERSHIPS : "inviter_id"
    AUTH_USERS ||--o{ PARTNERSHIPS : "invitee_id"
    AUTH_USERS ||--o{ CONTRACTIONS : "user_id"
    AUTH_USERS ||--o{ SHARE_LINKS : "user_id"
```

### RLS Policy Logic

```mermaid
graph TD
    Q["SELECT contractions\nWHERE user_id = partnerId"] --> RLS{"RLS Check"}

    RLS --> OWN["auth.uid() = user_id?\n✅ always allowed"]
    RLS --> PART["EXISTS accepted partnership\nbetween auth.uid() and user_id?\n✅ allowed after fix"]
    RLS --> NONE["No match\n❌ 0 rows returned silently"]

    OWN --> PASS["Query succeeds"]
    PART --> PASS
    NONE --> FAIL["Partner sees nothing\n(was the bug)"]

    style PASS fill:#4a7c59,color:#fff
    style FAIL fill:#c0392b,color:#fff
    style PART fill:#c47c5a,color:#fff
```

---

## I – Interface (Component & Hook APIs)

### Hook Dependency Graph

```mermaid
graph TD
    UC["useContractions()"]
    UA["useAuth()"]
    UP["usePartnership(user)"]
    US["useSync(user, partnerId, localContractions)"]
    USL["useShareLink(user)"]
    UT["useTimer(isActive, activeStart)"]
    UTL["useTimeSinceLast(isActive, lastEndTime)"]

    SC["SharingContext\nSharingProvider"]

    UA --> SC
    UP --> SC
    US --> SC
    UC -- "app.contractions" --> SC
    UC -- "app.newSession" --> SC

    SC -. "useSharing()" .-> TS["TimerScreen"]
    SC -. "useSharing()" .-> HS["HistoryScreen"]
    SC -. "useSharing()" .-> SS["SettingsScreen"]

    USL -. "useShareLink()" .-> MW["MidwifeSharing"]

    UT --> TS
    UTL --> TS
    UT --> RS["RelaxScreen"]

    style SC fill:#c47c5a,color:#fff
```

### `useContractions()` State Machine

```mermaid
graph LR
    subgraph ACTIONS["Actions"]
        A1["startContraction()"]
        A2["stopContraction()"]
        A3["newSession()"]
        A4["deleteContraction(id)"]
        A5["deleteSession(id)"]
        A6["updateContraction(id,Δ)"]
        A7["setIntensity(id,n)"]
        A8["updateSettings(Δ)"]
        A9["undoLast()"]
        A10["resetAllData()"]
    end

    subgraph STATE["State"]
        S1["contractions[]"]
        S2["sessions[]"]
        S3["settings"]
        S4["isActive"]
        S5["activeStart"]
        S6["alertMessage"]
        S7["pendingIntensityId"]
        S8["undoState"]
    end

    A1 --> S4
    A1 --> S5
    A2 --> S1
    A2 --> S4
    A2 --> S5
    A2 --> S6
    A2 --> S7
    A3 --> S1
    A3 --> S2
    A4 --> S1
    A4 --> S8
    A5 --> S2
    A5 --> S8
    A6 --> S1
    A7 --> S1
    A7 --> S7
    A8 --> S3
    A9 --> S1
    A9 --> S2
    A9 --> S8
    A10 --> S1
    A10 --> S2
    A10 --> S3
```

### Supabase Realtime Subscriptions

```mermaid
graph LR
    subgraph SUBS["Active Realtime Channels"]
        CH1["partner-contractions-{partnerId}\ntable: contractions\nfilter: user_id=eq.{partnerId}\nevents: INSERT · UPDATE · DELETE"]
        CH2["partnership-changes\ntable: partnerships\nevents: INSERT · UPDATE · DELETE"]
    end

    CH1 -- "fetchPartnerData()" --> PC["partnerContractions state"]
    CH2 -- "fetchPartnerships()" --> PS["partnerId · partner · pendingInvites"]

    FA["AppState → foreground"] -- "fetchPartnerData()" --> PC
    FA -- "fetchPartnerships()" --> PS

    style CH1 fill:#c47c5a,color:#fff
    style CH2 fill:#c47c5a,color:#fff
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

### Tradeoffs & Known Limitations

```mermaid
graph LR
    subgraph NOW["Current State"]
        L1["Sessions local-only\nnever sync to Supabase"]
        L2["1:1 partner model\none accepted row per user"]
        L3["No offline sync queue\nfailed upserts lost until next change"]
        L4["Errors swallowed silently\ncatch  Offline  hides RLS failures"]
        L5["Share link expiry\nnot enforced server-side"]
    end

    subgraph IDEAL["Ideal State"]
        I1["sessions table in Supabase\npartner sees session boundaries"]
        I2["Multi-observer support\nmidwife + partner simultaneously"]
        I3["MMKV sync queue\nflush on reconnect"]
        I4["Expose sync error state\nUI shows sync failed indicator"]
        I5["RLS: expires_at > now()\nenforced in SELECT policy"]
    end

    L1 --> I1
    L2 --> I2
    L3 --> I3
    L4 --> I4
    L5 --> I5
```
