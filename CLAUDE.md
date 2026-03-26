# CLAUDE.md — NewbornLog iOS App

## Project Overview

**App Name:** NewbornLog (working title)
**Purpose:** Help a couple track their newborn’s feeding, sleep, diapers, growth, and appointments — shared in real time between two phones so either parent always knows what was last done and when.
**Platform:** iOS native (Swift + SwiftUI) + Swift backend (Vapor)
**Distribution:** TestFlight (2 users — a couple)
**Users:** Exactly 2 people sharing one baby’s data
**This is NOT a production/App Store app** — it’s a personal tool for a friend and her husband. Prioritize simplicity and reliability over scalability.

-----

## The Core Problem This Solves

One parent does a feeding at 2am. The other wakes up at 4am wondering “did she eat? when? how much?” — and doesn’t want to wake their partner to ask. This app answers that question instantly on either phone, always up to date.

-----

## Infrastructure Overview

```
[iPhone — Partner A]  ──┐
                         ├── Tailscale VPN ──► [Mac Mini — always on]
[iPhone — Partner B]  ──┘                      └── Vapor server + SQLite
```

- **Mac Mini** runs a Vapor (Swift) HTTP server with a SQLite database
- **Tailscale** is already installed on the Mac Mini — add both iPhones to the same tailnet
- Both phones can reach the Mac Mini from **anywhere** (home, hospital, errands) over Tailscale
- No iCloud, no Firebase, no third-party services touch the data
- Fully private — data never leaves their home network physically

-----

## Tech Stack

### iOS App

- **Language:** Swift 5.9+
- **UI Framework:** SwiftUI
- **Minimum iOS:** iOS 17.0
- **Architecture:** MVVM with `@Observable` macro
- **Navigation:** SwiftUI `NavigationStack`
- **Networking:** `URLSession` with `async/await`
- **Local cache:** SwiftData (offline reads when Tailscale temporarily unreachable)
- **Charts:** Swift Charts (native)
- **Auth:** Sign in with Apple → verified by Vapor backend

### Backend (Mac Mini)

- **Language:** Swift 5.9+
- **Framework:** Vapor 4
- **Database:** SQLite via Fluent (Vapor’s ORM)
- **Auth:** JWT tokens issued after Sign in with Apple verification
- **Real-time:** Server-Sent Events (SSE) for push updates to both phones
- **Process management:** launchd (Mac Mini runs server on boot automatically)

### Network

- **Tailscale** — already running on Mac Mini
- Both iPhones added to the same tailnet
- App uses the Mac Mini’s stable Tailscale IP (e.g., `100.x.x.x`) — never changes
- HTTPS via Tailscale’s built-in TLS (use `https://[tailscale-ip]:8080`)

### Dependencies

**iOS (SPM):**

- None required beyond Apple frameworks — `URLSession` handles all networking

**Backend (SPM):**

- `vapor/vapor` — Vapor 4 framework
- `vapor/fluent` — ORM
- `vapor/fluent-sqlite-driver` — SQLite driver
- `vapor/jwt` — JWT auth
- `apple/swift-crypto` — Sign in with Apple token verification

-----

## Project Structure

```
NewbornLog/
├── NewbornLog/                    # iOS app
│   ├── NewbornLogApp.swift
│   ├── ContentView.swift
│   │
│   ├── Models/                    # Local SwiftData models (cache)
│   │   ├── Baby.swift
│   │   ├── FeedingLog.swift
│   │   ├── SleepLog.swift
│   │   ├── DiaperLog.swift
│   │   ├── GrowthMeasurement.swift
│   │   ├── Appointment.swift
│   │   └── MedicationLog.swift
│   │
│   ├── Networking/
│   │   ├── APIClient.swift        # All URLSession calls
│   │   ├── APIEndpoints.swift     # Endpoint definitions
│   │   ├── SSEClient.swift        # Server-Sent Events listener
│   │   └── DTOs.swift             # Codable request/response types
│   │
│   ├── ViewModels/
│   │   ├── AuthViewModel.swift
│   │   ├── DashboardViewModel.swift
│   │   ├── FeedingViewModel.swift
│   │   ├── SleepViewModel.swift
│   │   └── BabyViewModel.swift
│   │
│   ├── Views/
│   │   ├── Onboarding/
│   │   │   ├── WelcomeView.swift
│   │   │   ├── SignInView.swift
│   │   │   ├── BabySetupView.swift
│   │   │   └── JoinFamilyView.swift
│   │   ├── Dashboard/
│   │   │   └── DashboardView.swift
│   │   ├── Feeding/
│   │   │   ├── FeedingLogView.swift
│   │   │   └── FeedingHistoryView.swift
│   │   ├── Sleep/
│   │   │   └── SleepTrackerView.swift
│   │   ├── Diapers/
│   │   │   └── DiaperLogView.swift
│   │   ├── Growth/
│   │   │   ├── GrowthTrackerView.swift
│   │   │   └── GrowthChartView.swift
│   │   ├── Appointments/
│   │   │   └── AppointmentsView.swift
│   │   ├── Medications/
│   │   │   └── MedicationListView.swift
│   │   ├── Settings/
│   │   │   └── SettingsView.swift
│   │   └── Shared/
│   │       ├── EmptyStateView.swift
│   │       ├── StatCardView.swift
│   │       ├── LogRowView.swift
│   │       └── ConnectionStatusView.swift
│   │
│   ├── Extensions/
│   │   ├── Date+Helpers.swift
│   │   └── Color+Theme.swift
│   │
│   └── Preview Content/
│       └── PreviewData.swift
│
└── NewbornLogServer/              # Vapor backend
    ├── Sources/App/
    │   ├── entrypoint.swift
    │   ├── configure.swift
    │   ├── routes.swift
    │   │
    │   ├── Models/                # Fluent database models
    │   │   ├── User.swift
    │   │   ├── Family.swift
    │   │   ├── Baby.swift
    │   │   ├── FeedingLog.swift
    │   │   ├── SleepLog.swift
    │   │   ├── DiaperLog.swift
    │   │   ├── GrowthMeasurement.swift
    │   │   ├── Appointment.swift
    │   │   └── MedicationLog.swift
    │   │
    │   ├── Controllers/
    │   │   ├── AuthController.swift
    │   │   ├── BabyController.swift
    │   │   ├── FeedingController.swift
    │   │   ├── SleepController.swift
    │   │   ├── DiaperController.swift
    │   │   ├── GrowthController.swift
    │   │   ├── AppointmentController.swift
    │   │   ├── MedicationController.swift
    │   │   └── SSEController.swift
    │   │
    │   ├── Migrations/
    │   │   └── CreateAllTables.swift
    │   │
    │   └── DTOs/
    │       └── ResponseDTOs.swift
    │
    ├── Package.swift
    └── Resources/db/newbornlog.sqlite
```

-----

## Backend API Design

### Base URL

```
https://100.x.x.x:8080/api/v1
```

(Replace `100.x.x.x` with the Mac Mini’s stable Tailscale IP — set this once in `APIEndpoints.swift`)

### Authentication

All endpoints except `/auth/*` require `Authorization: Bearer <jwt>` header.

```
POST   /auth/apple          # Sign in with Apple → returns JWT
POST   /auth/refresh        # Refresh JWT
GET    /auth/me             # Current user info

POST   /family              # Create family (first partner)
POST   /family/join         # Join family by invite code (second partner)
GET    /family/invite       # Generate invite code/link
```

### Baby

```
GET    /baby                # Get baby profile
POST   /baby                # Create baby profile
PATCH  /baby                # Update baby profile
```

### Logs — all follow the same pattern

```
GET    /feeding             # List (query params: limit, before, after)
POST   /feeding             # Create log entry
PATCH  /feeding/:id         # Edit entry
DELETE /feeding/:id         # Delete entry

GET    /sleep               # List
POST   /sleep/start         # Start sleep session
POST   /sleep/end           # End active sleep session
PATCH  /sleep/:id
DELETE /sleep/:id

GET    /diaper
POST   /diaper
PATCH  /diaper/:id
DELETE /diaper/:id

GET    /growth
POST   /growth
PATCH  /growth/:id
DELETE /growth/:id

GET    /appointment
POST   /appointment
PATCH  /appointment/:id
DELETE /appointment/:id

GET    /medication
POST   /medication
PATCH  /medication/:id
DELETE /medication/:id
```

### Real-time Updates (SSE)

```
GET    /events              # Server-Sent Events stream
```

The iOS app opens a persistent SSE connection. When either partner logs anything, the server broadcasts an event to all connected clients. The receiving phone refreshes its data automatically — no polling needed.

SSE event format:

```json
{ "type": "feeding_created", "id": "uuid", "timestamp": "iso8601" }
{ "type": "sleep_started", "id": "uuid", "timestamp": "iso8601" }
{ "type": "diaper_created", "id": "uuid", "timestamp": "iso8601" }
```

-----

## Backend Setup (Mac Mini)

### 1. Install Swift & Vapor

```bash
# Swift is included with Xcode Command Line Tools
xcode-select --install

# Install Vapor toolbox
brew install vapor
```

### 2. Create the Vapor project

```bash
cd ~/Projects
vapor new NewbornLogServer --fluent --db sqlite
cd NewbornLogServer
```

### 3. Run the server (development)

```bash
swift run App serve --hostname 0.0.0.0 --port 8080
```

### 4. Run as a launchd service (auto-start on boot)

Create `/Library/LaunchDaemons/com.newbornlog.server.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.newbornlog.server</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Users/YOURUSERNAME/Projects/NewbornLogServer/.build/release/App</string>
        <string>serve</string>
        <string>--hostname</string>
        <string>0.0.0.0</string>
        <string>--port</string>
        <string>8080</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/YOURUSERNAME/Projects/NewbornLogServer</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/var/log/newbornlog/server.log</string>
    <key>StandardErrorPath</key>
    <string>/var/log/newbornlog/error.log</string>
</dict>
</plist>
```

```bash
# Build release binary first
swift build -c release

# Create log directory
sudo mkdir -p /var/log/newbornlog

# Load the daemon
sudo launchctl load /Library/LaunchDaemons/com.newbornlog.server.plist

# Check it's running
sudo launchctl list | grep newbornlog
```

### 5. Add iPhones to Tailscale

```bash
# On Mac Mini — check Tailscale IP
tailscale ip -4
# e.g. 100.64.0.5  ← use this in the iOS app

# On each iPhone:
# 1. Install Tailscale from App Store
# 2. Sign in to the same Tailscale account
# 3. Both phones can now reach 100.64.0.5:8080 from anywhere
```

### 6. Database location

SQLite file lives at `Resources/db/newbornlog.sqlite` inside the project directory. Back this up occasionally:

```bash
cp ~/Projects/NewbornLogServer/Resources/db/newbornlog.sqlite ~/Desktop/newbornlog-backup-$(date +%Y%m%d).sqlite
```

-----

## iOS Networking Layer

### APIClient.swift

```swift
@Observable
class APIClient {
    static let shared = APIClient()

    // Set this to Mac Mini's Tailscale IP — change once, works everywhere
    private let baseURL = "http://100.64.0.5:8080/api/v1"
    private var authToken: String? {
        get { KeychainHelper.read("jwt") }
        set { KeychainHelper.write("jwt", value: newValue) }
    }

    func get<T: Decodable>(_ path: String) async throws -> T { ... }
    func post<T: Decodable, B: Encodable>(_ path: String, body: B) async throws -> T { ... }
    func patch<T: Decodable, B: Encodable>(_ path: String, body: B) async throws -> T { ... }
    func delete(_ path: String) async throws { ... }
}
```

### Connection Status

The app should always show a subtle connection indicator:

- Green dot: connected to server
- Grey dot: offline (showing cached data)
- Never block the UI when offline — cached data is always readable

### Offline Behavior

- SwiftData stores a local cache of all logs
- On app launch: load from cache immediately, then fetch from server in background
- When offline: writes are queued locally and synced when connection returns
- SSE connection automatically reconnects with exponential backoff

-----

## iOS Data Models (SwiftData — local cache)

```swift
@Model class Baby {
    var id: UUID
    var name: String
    var dateOfBirth: Date
    var birthWeightGrams: Double
    var photoData: Data?
    var lastSyncedAt: Date?
}

@Model class FeedingLog {
    var id: UUID
    var timestamp: Date
    var type: String                // FeedingType raw value
    var durationMinutes: Int?
    var amountML: Double?
    var breast: String?
    var loggedBy: String            // Display name — "Fed by Sarah"
    var notes: String?
    var syncPending: Bool = false   // true = not yet confirmed by server
}

// SleepLog, DiaperLog, GrowthMeasurement, Appointment, MedicationLog
// all follow same pattern — include loggedBy and syncPending fields
```

-----

## Key Feature: “Logged By”

Every log entry stores `loggedBy: String` — the display name the user set in Settings (defaults to their Apple ID name). Core to the whole app: each parent sees not just *what* was done but *who* did it.

Display format:

- “Fed by Sarah · 2h ago”
- “Diaper by Mike · 45m ago”
- “Started by Sarah · sleeping 1h 20m”

-----

## App Screens

### Tab Bar (4 tabs)

1. **Home** — Dashboard
1. **Log** — Quick log entry
1. **History** — All logs
1. **More** — Growth, Appointments, Medications, Settings

### Onboarding

**Path A — Create family (first partner):**

1. Welcome screen
1. Sign in with Apple → JWT stored in Keychain
1. Enter baby’s name, DOB, birth weight
1. Server creates family + baby record, returns invite code
1. “Send invite to your partner” → iMessage with deep link
1. Done → dashboard

**Path B — Join family (second partner):**

1. Tap iMessage deep link → opens app
1. Sign in with Apple
1. App auto-submits invite code → joined
1. Done → same dashboard, same data

### Dashboard

- Baby name + age at top
- Connection status dot (top right, subtle)
- Three large status cards:
  - **Last Fed** — “2h 14m ago · Bottle · 90ml · by Sarah”
  - **Last Diaper** — “45m ago · Wet · by Mike”
  - **Sleep** — “Sleeping · 1h 20m · by Sarah” OR “Awake · last slept 3h ago”
- Today’s totals: feeds, diapers, sleep hours
- Quick-log buttons: [Feed] [Diaper] [Sleep]

Card urgency colors:

- Green: recent / normal
- Amber: getting long (3+ hours since feeding — configurable)
- Red: overdue (4+ hours — configurable)

### Quick Log (Tab 2)

**Diaper:** Three large buttons — WET / DIRTY / BOTH. One tap = logged. Haptic + “Logged ✓”.

**Feed:**

- Breast / Bottle / Solid segmented control
- Breast: left/right/both selector + live timer
- Bottle: quick-tap chips (30 / 60 / 90 / 120ml) + custom entry
- Time defaults to now, tappable to adjust
- Full-width Save button (56pt)

**Sleep:**

- “Start Sleep” / “End Sleep” toggle
- Active sleep shows live timer on dashboard for both partners

### History (Tab 3)

- Segmented: All / Feeding / Sleep / Diapers
- Newest first
- Row: colored icon · type · “X ago” · who logged it
- Swipe to delete (`.confirmationDialog` required)
- Tap to edit timestamp or notes

### More (Tab 4)

- Growth Tracker (Swift Charts + WHO percentile curves)
- Appointments
- Medications + local notifications for doses
- Settings

### Settings

- Baby profile (name, photo, DOB)
- Your display name (shown as “logged by”)
- Feeding alert threshold (default 3h)
- Units: metric / imperial
- Server address (advanced — shows current Tailscale IP, editable)
- Sign out

-----

## Issues from Original App to Fix

### Architecture

- [ ] No offline support — SwiftData cache + sync queue handles this
- [ ] No real sharing — server + “logged by” is the whole point
- [ ] Exposed DB credentials — no credentials in app code, Tailscale handles auth at network level
- [ ] No backup — add simple SQLite backup script on Mac Mini

### UI/UX

- [ ] No empty states — every empty screen needs a helpful prompt
- [ ] Tiny touch targets — all interactive elements ≥ 44pt, primary actions 56pt
- [ ] No error handling UI — friendly errors with retry, never crash silently
- [ ] No delete confirmation — `.confirmationDialog` before every delete
- [ ] No timestamp editing — every log must allow editing time after the fact
- [ ] Poor keyboard handling — `submitLabel`, `focused` bindings, keyboard avoidance
- [ ] No dark mode — semantic/adaptive colors only
- [ ] No Dynamic Type — system font styles, no hardcoded sizes
- [ ] No haptic feedback — `.sensoryFeedback(.success)` on every log save
- [ ] No onboarding — implement two-path onboarding above

### Features

- [ ] No feeding timer — live breast feeding timer per side
- [ ] No sleep start/stop — active tracking, live timer visible to both partners instantly via SSE
- [ ] No “logged by” — required on every single entry
- [ ] No dashboard urgency colors — color by time elapsed
- [ ] No growth charts — Swift Charts + WHO percentile reference lines
- [ ] No medication reminders — local notifications for scheduled doses
- [ ] No connection status — show clearly when offline vs. synced

-----

## Code Standards

### iOS

- `@Observable` macro for all ViewModels (not `ObservableObject`)
- `async/await` everywhere — no callbacks or Combine for new code
- No force unwraps outside `PreviewData.swift`
- All dates via `FormatStyle` — never raw `DateFormatter`
- Errors via `.alert` with `LocalizedError`
- `Logger` (os.log) not `print()`
- `#Preview` macro in every View file

### Backend (Vapor)

- All route handlers `async throws`
- Return proper HTTP status codes (201 for creates, 204 for deletes, 422 for validation errors)
- Validate all input with Vapor’s `Validatable` protocol
- Never return stack traces to the client — log them server-side only
- JWT expiry: 30 days (they’re not going to log out)

-----

## Implementation Order

### Backend first — iOS needs an API to talk to

1. Vapor project setup + SQLite + Fluent migrations
1. Auth routes (Sign in with Apple → JWT)
1. Family + invite code routes
1. Baby CRUD
1. All log CRUD routes (feeding, sleep, diaper, growth, appointment, medication)
1. SSE endpoint
1. launchd service setup on Mac Mini

### Then iOS

1. Xcode project + SwiftData models + APIClient skeleton
1. Onboarding (both paths)
1. Dashboard — get this right, it’s the whole app
1. Quick log: diaper → bottle → breast timer → sleep toggle
1. History view
1. Growth chart
1. Appointments + Medications
1. Settings
1. Offline queue + connection status indicator
1. Local notifications for medications
1. Dark mode + accessibility pass
1. TestFlight build

-----

## TestFlight Distribution

- [ ] Apple Developer account ($99/year)
- [ ] App ID in App Store Connect — Sign in with Apple capability enabled
- [ ] Archive in Xcode → upload to App Store Connect
- [ ] Internal TestFlight group → add both by Apple ID email
- [ ] They install TestFlight → accept invite → install app
- [ ] Add both iPhones to Tailscale network

-----

## The One Rule

**“Can a parent answer ‘when did the baby last eat?’ in under 3 seconds, one-handed, in the dark?”**

If yes, ship it. If no, simplify it.
