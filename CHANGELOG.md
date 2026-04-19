# Changelog

All notable changes to this project are documented here.

---

## [0.3.0] — 2026-04-19

### Added
- Firebase Firestore real-time sync — bookings persist across devices instantly
- Passcode-protected edit mode — changes require a PIN to unlock
- Helicopter booking object with date and ticket count fields
- Pull-to-refresh on the bookings list
- CI workflow to auto-deploy Firestore rules and indexes on push

---

## [0.2.0] — 2026-04-19

### Added
- Liquid Glass redesign — frosted-glass cards, animated mesh background
- Swipe navigation between screens
- Calendar view with month grid
- ICS export — tap any booking to download a calendar event
- Liquid glass FAB with active location tab pill
- Prompt to add booking to device calendar on save
- `skipWaiting` + `clientsClaim` in service worker so updates apply on next navigation

### Fixed
- Glass blur visibility in light mode and on the Add Booking screen
- CSS legibility issues in light mode
- Removed manual `-webkit-backdrop-filter` that broke blur in production builds
- FAB and tab pill alignment

---

## [0.1.0] — 2026-04-18

### Added
- Full booking CRUD — create, view, edit, delete
- Urgency grouping — Arriving Today / Tomorrow / Upcoming / Past with colour-coded left-border stripes
- Location tabs derived automatically from booking data
- Tripartite date binding — edit check-in, check-out, or nights and the other two update automatically
- Bulleted remarks editor per booking
- Custom flags (Helicopter, Assistance, user-defined) with auto-generated pill badges
- Voice input via Web Speech API — speak a booking command and fields populate automatically
- NLP parser for location, room, guest name, nights, check-in date, and flags
- Dashboard with stats grid, next-10-arrivals reminders, and by-location counts
- Morning (08:00) and evening (20:00) notification alerts for upcoming arrivals
- Google Drive backup and restore
- Scheduled daily backup with configurable time
- PWA — installable on iOS and Android, full offline support via service worker and `localStorage`
- GitHub Pages deploy workflow with Vite base path
- Lucide icon set, custom PWA icons
