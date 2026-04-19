# Changelog

All notable changes to this project are documented here. Versions follow [Semantic Versioning](https://semver.org/).

---

## [0.5.1] — 2026-04-19

### Fixed
- Auth config subscription and sessions subscription now retry on error rather than dying silently — prevents the gate from getting stuck at "Connecting…" forever.
- Session write helpers (`registerSession`, `endSession`) swallow errors with warnings instead of throwing — session tracking is non-critical.
- Auth seed retries up to 5× with backoff to handle Firestore rules propagation races right after a deploy.
- Gate renders immediately with the numpad; loading state is shown in the subtitle instead of a full-screen spinner, so the app never appears frozen.

---

## [0.5.0] — 2026-04-19

### Added
- **Viewing passcode** (default `9458`) gates every app open. Required before any data is visible; remembered only for the current tab — closing/reopening the PWA re-prompts.
- **Settings tab** (4th nav item) consolidates Notifications, Backup & Restore, ICS export, and a new Admin section.
- **Admin panel** (edit mode only):
  - Change viewing and edit passcodes at runtime (stored in Firestore `/config/auth`).
  - "Allow viewers" kill switch — instantly kicks every view-only session when disabled.
  - Active sessions list showing device name, IP address, role, and last-seen, with one-tap kick.
- **Device presence tracking** via `/sessions/{deviceId}` with a 30s heartbeat and 2-minute staleness filter.

### Changed
- Both passcodes now live in Firestore and are editable by the admin. The build-time `VITE_ADMIN_PASSCODE` env var is the initial seed value only.
- Dashboard trimmed: Notifications and Data sections moved to Settings so the dashboard stays focused on stats.
- Edit passcode bypasses the kill switch so the admin can always recover access; view passcode is blocked while the switch is off.

### Fixed
- Calendar missing `key` prop warning when a day had helicopter bookings without a location.
- Auth seed retries up to 5× with backoff so the first user after deploy doesn't race Firestore rules propagation.

### Security note
Firestore rules remain permissive (`allow read, write: if true`) — passcode auth is fully client-side. Suitable for a small trusted group; Firebase Anonymous Auth is the next hardening step.

---

## [0.4.0] — 2026-04-19

### Added
- **Firebase Firestore real-time sync** replaces the previous IndexedDB / Dexie / zustand-persist stack. Changes propagate to all devices instantly.
- `SyncStatus` component in the header: Synced / Syncing / Offline.
- Optimistic local writes with a `pendingWrites` counter for in-flight ops.
- `seedIfEmpty` populates demo data on first load only.
- Firestore emulator config (`firebase.json`) and local dev script `bun run dev:emulated`.
- GitHub Actions workflow auto-deploys Firestore rules and indexes on change.

### Changed
- Single-tab production persistence (`persistentSingleTabManager`) for offline support.
- Memory-only cache in dev to avoid IndexedDB lock contention across Vite multi-frame preview.
- GitHub Actions build injects all 6 Firebase config values from repository secrets.

### Removed
- `src/db/idbStorage.js` and the `dexie` dependency.

---

## [0.3.0] — 2026-04-19

### Added
- Passcode-protected edit mode — creation, editing, and deletion require a 4-digit PIN. `LockButton` floats above the tab bar.
- Helicopter booking object with travel date, boarding/landing, tickets, and passengers.
- Pull-to-refresh on Bookings, Calendar, and Dashboard.

---

## [0.2.0] — 2026-04-19

### Added
- Liquid Glass redesign — frosted-glass cards, animated mesh background.
- Swipe navigation between screens.
- Calendar view with month grid.
- ICS export — tap any booking to download a calendar event.
- Liquid glass FAB with active location tab pill.
- Prompt to add booking to device calendar on save.
- `skipWaiting` + `clientsClaim` in service worker so updates apply on next navigation.

### Fixed
- Glass blur visibility in light mode and on the Add Booking screen.
- CSS legibility issues in light mode.
- Removed manual `-webkit-backdrop-filter` that broke blur in production builds.
- FAB and tab pill alignment.

---

## [0.1.0] — 2026-04-18

### Added
- Full booking CRUD — create, view, edit, delete.
- Urgency grouping — Arriving Today / Tomorrow / Upcoming / Past with colour-coded left-border stripes.
- Location tabs derived automatically from booking data.
- Tripartite date binding — edit check-in, check-out, or nights and the other two update automatically.
- Bulleted remarks editor per booking.
- Custom flags (Helicopter, Assistance, user-defined) with auto-generated pill badges.
- Voice input via Web Speech API — speak a booking command and fields populate automatically.
- NLP parser for location, room, guest name, nights, check-in date, and flags.
- Dashboard with stats grid, next-10-arrivals reminders, and by-location counts.
- Morning (08:00) and evening (20:00) notification alerts for upcoming arrivals.
- Google Drive backup and restore.
- Scheduled daily backup with configurable time.
- PWA — installable on iOS and Android, full offline support via service worker and `localStorage`.
- GitHub Pages deploy workflow with Vite base path.
- Lucide icon set, custom PWA icons.
