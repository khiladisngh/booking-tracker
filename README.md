# Booking Tracker PWA

> Tactical guest-house booking management — built for field use by an Army officer.

A progressive web app for tracking guest arrivals, departures, helicopter tickets, and special requirements across multiple locations. Runs offline, installs on any device, and can be filled by voice.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Design System](#design-system)
- [Data Model](#data-model)
- [Voice Input](#voice-input)
- [PWA & Offline](#pwa--offline)
- [Versioning](#versioning)

---

## Overview

Managing guest-house bookings in the field means working across multiple locations, varying room-numbering conventions, and frequent last-minute changes. This app replaces paper registers and fragile spreadsheets with a fast, always-available mobile-first interface that works even without an internet connection.

Key design principles:

- **Minimal UI** — nothing decorative, every pixel is functional
- **One-handed operation** — large tap targets, bottom-sheet interactions, no nested menus
- **Offline first** — all data lives in `localStorage`; service worker caches the app shell
- **Flutter-ready** — design tokens map 1:1 to Flutter `ColorScheme` for a future native migration

---

## Features

### Bookings

| Feature | Detail |
|---------|--------|
| Urgency grouping | Cards grouped into Arriving Today / Arriving Tomorrow / Upcoming / Past |
| Urgency stripe | 3 px left border — red (today), amber (tomorrow), green (upcoming), grey (past) |
| Location tabs | Tabs derived automatically from booking data — add any location name |
| Free-text location & room | Type any location or room; suggestions auto-populate from existing bookings via `<datalist>` |
| Tripartite date binding | Edit check-in, check-out, or nights — the other two update automatically |
| Bulleted remarks | Add, edit, and remove per-booking notes as a bullet list with `+` button |
| Flags | Built-in: Helicopter, Assistance. Add unlimited custom flags per booking; each gets an auto-generated badge |

### Dashboard

| Widget | Detail |
|--------|--------|
| Stats grid | This week, this month, helicopter count, occupied now |
| Reminders | Next 10 arrivals within 7 days with morning (08:00) and evening (20:00) alerts |
| By location | Booking count per location, dynamically computed |

### Voice Input

Tap the mic button on the Add Booking screen and speak naturally:

```
"Room 101 Shimla, Rajesh Kumar, 3 nights, helicopter"
```

The NLP parser extracts location, room, guest name, nights, check-in, and flags. Works on iOS Safari via `webkitSpeechRecognition`.

### PWA

- Installable on iOS (Add to Home Screen) and Android
- App shell cached by service worker — opens instantly offline
- All data persisted in `localStorage` via Zustand

---

## Tech Stack

| Layer | Choice | Version |
|-------|--------|---------|
| UI framework | React | 19 |
| Build tool | Vite | 8 |
| Styling | Tailwind CSS (CSS-first `@theme` block) | 4 |
| State management | Zustand with `persist` middleware | 5 |
| Date utilities | date-fns | 4 |
| PWA | vite-plugin-pwa (injectManifest mode) | 1.2 |
| Runtime | Bun (or Node ≥ 20) | — |

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) ≥ 1.0 **or** Node.js ≥ 20 with npm

### Install and run

```bash
# Clone
git clone git@github.com:khiladisngh/booking-tracker.git
cd booking-tracker/booking-pwa

# Install dependencies
bun install          # or: npm install

# Start dev server
bun run dev          # → http://localhost:5173

# Production build
bun run build

# Preview production build locally
bun run preview
```

### First run

The app seeds five example bookings on first launch. Clear `localStorage` or bump the store version to reset.

---

## Project Structure

```
booking-tracker/
├── .gitignore
├── README.md
└── booking-pwa/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── public/
    │   ├── favicon.svg
    │   └── icons.svg
    └── src/
        ├── main.jsx                    # React root
        ├── App.jsx                     # Shell, nav, routing
        ├── index.css                   # Design tokens + Tailwind @theme
        │
        ├── config/
        │   └── app.json               # Location suggestions, notification config
        │
        ├── store/
        │   └── useStore.js            # Zustand store — bookings, config, actions
        │                              #   v1→v2 migration: locationId→location,
        │                              #   remarks string→array, customFlags added
        │
        ├── services/
        │   ├── dateUtils.js           # Urgency bands, booking grouping, date formatting
        │   ├── nlpParser.js           # Natural-language booking command extractor
        │   ├── voiceInput.js          # useVoiceInput() hook — Web Speech API wrapper
        │   └── notifications.js       # Push notification scheduling helpers
        │
        ├── components/
        │   ├── BookingCard.jsx        # List card: urgency stripe, room badge, flag tags, remarks
        │   ├── BookingDetailSheet.jsx # Bottom sheet: view / edit / delete modes
        │   ├── Checkbox.jsx           # Custom accessible checkbox (no browser default)
        │   ├── FlagsEditor.jsx        # Helicopter + Assistance + custom flags with + button
        │   ├── LocationTabs.jsx       # Horizontal tab bar from unique booking locations
        │   ├── RemarksEditor.jsx      # Bulleted list editor: add (Enter/+), remove (Backspace/×)
        │   └── TodayBanner.jsx        # Arriving / departing / occupied strip
        │
        └── screens/
            ├── AddBookingScreen.jsx   # Full-screen form with voice input
            ├── BookingsScreen.jsx     # Main list view with location filtering
            └── DashboardScreen.jsx    # Stats, reminders, by-location counts
```

---

## Design System

The visual language is called **Tactical Command** — a dark, high-contrast theme designed for legibility in varied lighting conditions.

### Colour tokens

All tokens are defined as CSS custom properties in `src/index.css` and exposed as Tailwind utility classes via the `@theme` block.

| Token | Hex | Tailwind class | Usage |
|-------|-----|----------------|-------|
| `--ds-canvas` | `#07101e` | `bg-canvas` | Page / scaffold background |
| `--ds-surface` | `#0d1a2e` | `bg-surface` | Cards, panels, sheets |
| `--ds-raised` | `#122234` | `bg-raised` | Inputs, elevated elements |
| `--ds-overlay` | `#1c3050` | `bg-overlay` | Hover backgrounds |
| `--ds-border` | `#1c3050` | `border-line` | Default borders |
| `--ds-accent` | `#3d82f0` | `bg-accent` / `text-accent` | Brand / primary actions |
| `--ds-text-hi` | `#e8f1fa` | `text-hi` | Primary content |
| `--ds-text-lo` | `#7990a8` | `text-lo` | Labels, metadata |
| `--ds-text-dim` | `#445872` | `text-dim` | Placeholders, disabled |
| `--ds-red` | `#e84040` | `text-urgent` | Urgent / error |
| `--ds-amber` | `#f0980a` | `text-warn` | Warning / tomorrow |
| `--ds-green` | `#1ec25a` | `text-ok` | Normal / success |
| `--ds-sky` | `#38b2f8` | — | Helicopter tag |
| `--ds-violet` | `#a78bfa` | — | Assistance tag |

### Flutter migration

Every token maps directly to a Flutter `ColorScheme` role — renaming is not required when migrating:

```dart
// Flutter ThemeData.colorScheme equivalents
scaffoldBackgroundColor → --ds-canvas      (#07101e)
surface                 → --ds-surface     (#0d1a2e)
surfaceVariant          → --ds-raised      (#122234)
outline                 → --ds-border      (#1c3050)
primary                 → --ds-accent      (#3d82f0)
onPrimary               → #ffffff
onSurface               → --ds-text-hi     (#e8f1fa)
onSurfaceVariant        → --ds-text-lo     (#7990a8)
error                   → --ds-red         (#e84040)
```

### Component atoms

| Class | Purpose |
|-------|---------|
| `.btn-primary` | Full-width accent action button |
| `.btn-ghost` | Bordered secondary button |
| `.btn-danger` | Destructive action (red border) |
| `.field` | Form input / select / textarea |
| `.field-error` | Field with validation error state |
| `.badge` / `.badge-accent` | Compact monospace label (room numbers) |
| `.tag` | Pill badge (flags) |
| `.tag-sky` | Sky blue — Helicopter |
| `.tag-violet` | Violet — Assistance |
| `.tag-custom` | Teal — user-defined flags |
| `.section-label` | 10 px uppercase section header |
| `.card` | Standard surface container |
| `.stripe-{red\|amber\|green\|blue\|past}` | Urgency left-border colours |

---

## Data Model

### Booking (v2)

```ts
{
  id:          string          // crypto.randomUUID()
  location:    string          // free text, e.g. "Shimla", "Manali"
  room:        string          // free text, e.g. "101", "A1", "Suite 3"
  guestName:   string
  checkIn:     string          // yyyy-MM-dd
  nights:      number          // ≥ 1
  checkOut:    string          // yyyy-MM-dd (derived or directly set)
  helicopter:  boolean
  assistance:  boolean
  customFlags: Array<{         // user-defined flags
    id:      string
    label:   string
    checked: boolean
  }>
  remarks:     string[]        // bullet list items
  createdAt:   string          // ISO 8601
  updatedAt:   string          // ISO 8601
}
```

### Store migration

The Zustand store uses `version: 2`. If a user has v1 data in `localStorage`, the `migrate` function runs automatically on next load:

| v1 field | v2 field | Transform |
|----------|----------|-----------|
| `locationId: 'shimla'` | `location: 'Shimla'` | Config lookup → display name |
| `remarks: 'some text'` | `remarks: ['some text']` | String → single-element array |
| *(missing)* | `customFlags: []` | Default empty array |

---

## Voice Input

The `useVoiceInput` hook wraps the Web Speech API with an interim-transcript display:

```js
const { isListening, interimText, isSupported, start, stop } = useVoiceInput({
  onResult: (transcript) => { /* NLP parse → fill form fields */ }
})
```

The `parseBookingCommand(text, config)` function extracts:

| Field | Example phrases |
|-------|----------------|
| Location | `"Shimla"`, `"Manali"` |
| Room | `"room 101"`, `"room A1"` |
| Guest name | `"for Rajesh Kumar"`, `"guest Priya"` |
| Nights | `"3 nights"`, `"two nights"`, `"five nights"` |
| Check-in | `"today"`, `"tomorrow"` |
| Helicopter | `"helicopter"`, `"heli"` |
| Assistance | `"assistance"`, `"wheelchair"` |

**Browser support:** Chrome, Edge, Safari (iOS 14.5+). The mic button is hidden when the API is unavailable.

---

## PWA & Offline

The service worker is built in `injectManifest` mode. It precaches the full app shell so the app opens instantly with no network connection. All booking data lives in `localStorage` and requires no server.

**Install on iOS:** Safari → Share → Add to Home Screen  
**Install on Android:** Chrome → menu → Install app (or banner prompt)

---

## Versioning

| Version | Date | Notes |
|---------|------|-------|
| v0.1.0 | 2026-04-18 | Initial release — full CRUD, design system, voice input, dashboard, PWA |

---

## License

Private. All rights reserved.
