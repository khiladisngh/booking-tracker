# Booking Tracker PWA

A progressive web app for tracking guest arrivals, departures, helicopter tickets, and special requirements across multiple locations. Runs offline, installs on any device, and supports voice input.

## Key Features

- **Smart Bookings:** Track check-ins, check-outs, and nights with automatic date calculation.
- **Organization:** Urgency grouping (Today, Tomorrow, Upcoming, Past) and location-based tabs.
- **Voice Input:** Add bookings naturally using voice commands ("Room 101 Shimla, Rajesh Kumar, 3 nights, helicopter").
- **Offline PWA:** Fully installable (iOS/Android), cached via service workers, works instantly offline.
- **Dashboard:** At-a-glance analytics, occupancy stats, and upcoming arrival reminders.
- **Customization:** Free-text locations, dynamic flags (Helicopter, Assistance), and bulleted remarks.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) ≥ 1.0 **or** Node.js ≥ 20

### Installation

```bash
git clone git@github.com:khiladisngh/booking-tracker.git
cd booking-tracker/booking-pwa
bun install # or: npm install
bun run dev # → http://localhost:5173
```

## Tech Stack

- **UI & State:** React 19, Zustand 5 (with persist)
- **Styling:** Tailwind CSS 4
- **Build & PWA:** Vite 8, vite-plugin-pwa (injectManifest mode)
- **Utilities:** date-fns 4

## License

Private. All rights reserved.
