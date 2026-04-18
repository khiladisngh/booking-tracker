# Booking Tracker PWA

A tactical booking management progressive web app designed for field use — fast, offline-capable, and installable on any device.

Built for an Army officer managing guest-house bookings across multiple locations.

## Features

- **Bookings list** — grouped by arrival urgency with colour-coded left stripe (today / tomorrow / upcoming / past)
- **Location tabs** — auto-generated from booking data; supports any location name
- **Add / Edit bookings** — free-text location and room fields with autocomplete from existing data
- **Tripartite date binding** — change check-in, check-out, or nights; the other two update automatically
- **Bulleted remarks** — add, edit, and remove per-booking notes as a bullet list
- **Flags system** — built-in Helicopter and Assistance checkboxes; add unlimited custom flags per booking with auto-generated badges
- **Voice input** — fill the booking form by speaking (Web Speech API; works on Safari/iOS via `webkitSpeechRecognition`)
- **Dashboard** — weekly / monthly counts, occupied-now, helicopter count, upcoming reminders, by-location breakdown
- **Offline / PWA** — service worker via `vite-plugin-pwa`; installable on iOS and Android

## Tech Stack

| Layer | Choice |
|-------|--------|
| UI | React 19 + Vite 8 |
| Styling | Tailwind CSS v4 (CSS-first, `@theme` block) |
| State | Zustand v5 with persist middleware |
| Dates | date-fns |
| PWA | vite-plugin-pwa (injectManifest mode) |

## Design System

Semantic design tokens (`--ds-*`) map 1:1 to Flutter `ColorScheme` roles, enabling a future migration to Flutter with zero palette renaming. The full token reference lives in [`src/index.css`](src/index.css).

## Getting Started

```bash
# Install
bun install        # or: npm install

# Dev server
bun run dev        # http://localhost:5173

# Production build
bun run build

# Preview production build
bun run preview
```

## Project Structure

```
src/
  components/
    BookingCard.jsx          # List card with urgency stripe and tags
    BookingDetailSheet.jsx   # Bottom sheet — view, edit, delete
    Checkbox.jsx             # Custom accessible checkbox
    FlagsEditor.jsx          # Built-in + custom flag management
    LocationTabs.jsx         # Tab bar derived from booking data
    RemarksEditor.jsx        # Bulleted remarks with add/remove
    TodayBanner.jsx          # Arriving / departing / occupied stats
  screens/
    AddBookingScreen.jsx     # Full-screen add form with voice input
    BookingsScreen.jsx       # Main list view
    DashboardScreen.jsx      # Stats and reminders
  services/
    dateUtils.js             # Urgency, grouping, formatting helpers
    nlpParser.js             # Natural-language booking command parser
    voiceInput.js            # Web Speech API React hook
  store/
    useStore.js              # Zustand store with v1→v2 migration
  config/
    app.json                 # Location suggestions and notification config
```

## Versioning

- **v0.1.0** — Initial release: full booking CRUD, design system, voice input, dashboard, PWA
