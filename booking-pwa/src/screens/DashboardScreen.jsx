import { useState, useMemo } from 'react'
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { useStore } from '../store/useStore'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStr() {
  return format(new Date(), 'yyyy-MM-dd')
}

function currentWeekBounds() {
  const now = new Date()
  return {
    start: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    end: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
  }
}

function currentMonthBounds() {
  const now = new Date()
  return {
    start: format(startOfMonth(now), 'yyyy-MM-dd'),
    end: format(endOfMonth(now), 'yyyy-MM-dd'),
  }
}

function buildUpcomingReminders(bookings) {
  const now = new Date()
  const today = todayStr()
  const cutoff = format(new Date(now.getTime() + 7 * 86_400_000), 'yyyy-MM-dd')

  const reminders = []

  for (const booking of bookings) {
    const { checkIn, guestName } = booking
    if (checkIn < today || checkIn > cutoff) continue

    const checkInDate = parseISO(checkIn)

    const eveningDate = new Date(checkInDate)
    eveningDate.setDate(eveningDate.getDate() - 1)
    eveningDate.setHours(20, 0, 0, 0)

    if (eveningDate > now) {
      reminders.push({
        id: `${booking.id}-evening`,
        booking,
        scheduledAt: eveningDate,
        type: 'evening',
        title: checkIn === today ? "Today's arrivals" : "Tomorrow's arrivals",
        guestName,
        checkIn,
      })
    }

    const morningDate = new Date(checkInDate)
    morningDate.setHours(8, 0, 0, 0)

    if (morningDate > now) {
      reminders.push({
        id: `${booking.id}-morning`,
        booking,
        scheduledAt: morningDate,
        type: 'morning',
        title: `${guestName} arriving`,
        guestName,
        checkIn,
      })
    }
  }

  reminders.sort((a, b) => a.scheduledAt - b.scheduledAt)
  return reminders.slice(0, 10)
}

function formatReminderTime(date) {
  const now = new Date()
  const timeStr = format(date, 'h:mm a')
  const dayStr = format(date, 'EEE d MMM')

  const midnight = new Date(now)
  midnight.setHours(23, 59, 59, 999)
  if (date <= midnight) return `Tonight · ${timeStr}`

  const tomorrowMidnight = new Date(midnight.getTime() + 86_400_000)
  if (date <= tomorrowMidnight) return `Tomorrow · ${timeStr}`

  return `${dayStr} · ${timeStr}`
}

function reminderDotStyle(checkIn) {
  const today = todayStr()
  const tomorrow = format(new Date(Date.now() + 86_400_000), 'yyyy-MM-dd')
  if (checkIn === today) return 'var(--ds-red)'
  if (checkIn === tomorrow) return 'var(--ds-amber)'
  return 'var(--ds-green)'
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ value, label }) {
  return (
    <div className="bg-surface rounded-[14px] border border-line p-4 flex flex-col gap-2">
      <span className="text-[36px] font-bold text-hi leading-none tabular-nums">{value}</span>
      <span className="text-[12px] text-lo leading-tight">{label}</span>
    </div>
  )
}

function NotificationBanner({ permission, onPermissionChange }) {
  if (!('Notification' in window)) return null
  if (permission === 'granted') return null

  async function handleEnable() {
    const result = await Notification.requestPermission()
    onPermissionChange(result)
  }

  return (
    <div className="bg-surface rounded-[14px] border border-line p-4 flex gap-3 items-start">
      <div className="shrink-0 mt-0.5">
        <svg className="w-5 h-5 text-accent-hi" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        {permission === 'denied' ? (
          <>
            <p className="text-[13px] font-medium text-hi">Notifications blocked</p>
            <p className="text-[12px] text-lo mt-0.5">Enable in device Settings to receive arrival reminders.</p>
          </>
        ) : (
          <>
            <p className="text-[13px] font-medium text-hi">Enable reminders</p>
            <p className="text-[12px] text-lo mt-0.5">Get notified before each arrival.</p>
            <button
              onClick={handleEnable}
              className="mt-3 bg-accent text-white rounded-[10px] px-4 py-2 text-[13px] font-medium active:bg-accent-press transition-colors duration-[120ms] min-h-[44px]"
            >
              Enable notifications
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function ReminderRow({ reminder }) {
  return (
    <div className="flex gap-3 items-center py-2.5 border-b border-subtle last:border-0">
      <span
        className="shrink-0 w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: reminderDotStyle(reminder.checkIn) }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-hi truncate">{reminder.title}</p>
        <p className="text-[12px] text-lo mt-0.5">{formatReminderTime(reminder.scheduledAt)}</p>
      </div>
    </div>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const bookings = useStore((s) => s.bookings)

  const [notifPermission, setNotifPermission] = useState(() =>
    'Notification' in window ? Notification.permission : 'unsupported'
  )

  const today = todayStr()
  const week = currentWeekBounds()
  const month = currentMonthBounds()

  const thisWeekCount = bookings.filter(
    (b) => b.checkIn >= week.start && b.checkIn <= week.end
  ).length

  const thisMonthCount = bookings.filter(
    (b) => b.checkIn >= month.start && b.checkIn <= month.end
  ).length

  const helicopterCount = bookings.filter(
    (b) => b.helicopter === true && b.checkIn >= today
  ).length

  const occupiedNow = bookings.filter(
    (b) => b.checkIn <= today && b.checkOut > today
  ).length

  const upcomingReminders = buildUpcomingReminders(bookings)

  const locationCounts = useMemo(() => {
    const unique = [...new Set(bookings.map((b) => b.location).filter(Boolean))].sort()
    return unique.map((loc) => ({
      name: loc,
      count: bookings.filter((b) => b.location === loc).length,
    }))
  }, [bookings])

  return (
    <div className="overflow-y-auto pb-28 px-4 space-y-5 pt-4">

      {/* Stats */}
      <section aria-label="Summary statistics">
        <h2 className="section-label mb-2">Overview</h2>
        <div className="grid grid-cols-2 gap-2.5">
          <StatCard value={thisWeekCount} label="This week" />
          <StatCard value={thisMonthCount} label="This month" />
          <StatCard value={helicopterCount} label="Helicopter" />
          <StatCard value={occupiedNow} label="Occupied now" />
        </div>
      </section>

      {/* Notification banner */}
      <NotificationBanner
        permission={notifPermission}
        onPermissionChange={setNotifPermission}
      />

      {/* Upcoming reminders */}
      <section aria-label="Upcoming reminders">
        <h2 className="section-label mb-2">Upcoming reminders</h2>
        <div className="bg-surface rounded-[14px] border border-line px-4">
          {upcomingReminders.length === 0 ? (
            <p className="text-[13px] text-dim text-center py-5">
              No reminders in the next 7 days
            </p>
          ) : (
            upcomingReminders.map((reminder) => (
              <ReminderRow key={reminder.id} reminder={reminder} />
            ))
          )}
        </div>
      </section>

      {/* By location */}
      <section aria-label="Bookings by location">
        <h2 className="section-label mb-2">By location</h2>
        <div className="bg-surface rounded-[14px] border border-line overflow-hidden divide-y divide-subtle">
          {locationCounts.map((loc) => (
            <div key={loc.name} className="flex items-center justify-between px-4 py-3">
              <span className="text-[13px] text-hi">{loc.name}</span>
              <span className="badge badge-accent tabular-nums">{loc.count}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
