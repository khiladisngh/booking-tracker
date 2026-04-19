import { useMemo } from 'react'
import PullToRefresh from '../components/PullToRefresh'
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { motion } from 'framer-motion'
import {
  CalendarRange, CalendarDays, Plane, BedDouble, MapPin, Clock,
} from 'lucide-react'
import { useStore } from '../store/useStore'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStr() {
  return format(new Date(), 'yyyy-MM-dd')
}

function currentWeekBounds() {
  const now = new Date()
  return {
    start: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    end:   format(endOfWeek(now,   { weekStartsOn: 1 }), 'yyyy-MM-dd'),
  }
}

function currentMonthBounds() {
  const now = new Date()
  return {
    start: format(startOfMonth(now), 'yyyy-MM-dd'),
    end:   format(endOfMonth(now),   'yyyy-MM-dd'),
  }
}

function buildUpcomingReminders(bookings) {
  const now    = new Date()
  const today  = todayStr()
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
  const now      = new Date()
  const timeStr  = format(date, 'h:mm a')
  const dayStr   = format(date, 'EEE d MMM')

  const midnight = new Date(now)
  midnight.setHours(23, 59, 59, 999)
  if (date <= midnight) return `Tonight · ${timeStr}`

  const tomorrowMidnight = new Date(midnight.getTime() + 86_400_000)
  if (date <= tomorrowMidnight) return `Tomorrow · ${timeStr}`

  return `${dayStr} · ${timeStr}`
}

function reminderDotStyle(checkIn) {
  const today    = todayStr()
  const tomorrow = format(new Date(Date.now() + 86_400_000), 'yyyy-MM-dd')
  if (checkIn === today)    return 'var(--ds-red)'
  if (checkIn === tomorrow) return 'var(--ds-amber)'
  return 'var(--ds-green)'
}

// ─── Animation config ─────────────────────────────────────────────────────────

const cardVariants = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 360, damping: 36 } },
}

const listVariants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.06 } },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const STAT_ICON = {
  'This week':    CalendarDays,
  'This month':   CalendarRange,
  'Helicopter':   Plane,
  'Occupied now': BedDouble,
}

function StatCard({ value, label }) {
  const Icon = STAT_ICON[label]
  return (
    <motion.div variants={cardVariants} className="glass rounded-[16px] p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[32px] font-bold text-hi leading-none tabular-nums">{value}</span>
        {Icon && <Icon size={18} className="text-lo" strokeWidth={1.6} />}
      </div>
      <span className="text-[12px] text-lo leading-tight">{label}</span>
    </motion.div>
  )
}

function ReminderRow({ reminder }) {
  return (
    <div className="flex gap-3 items-center py-2.5 border-b border-white/[0.06] last:border-0">
      <span
        className="shrink-0 w-1.5 h-1.5 rounded-full mt-0.5"
        style={{ backgroundColor: reminderDotStyle(reminder.checkIn) }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-hi truncate">{reminder.title}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <Clock size={11} className="text-dim shrink-0" strokeWidth={1.8} />
          <p className="text-[12px] text-lo">{formatReminderTime(reminder.scheduledAt)}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const bookings = useStore((s) => s.bookings)

  const today = todayStr()
  const week  = currentWeekBounds()
  const month = currentMonthBounds()

  const roomBookings = bookings.filter((b) => b.type === 'room')
  const heliBookings = bookings.filter((b) => b.type === 'helicopter')

  const thisWeekCount  = roomBookings.filter((b) => b.checkIn >= week.start  && b.checkIn <= week.end).length
  const thisMonthCount = roomBookings.filter((b) => b.checkIn >= month.start && b.checkIn <= month.end).length
  const helicopterCount = heliBookings.filter((b) => b.travelDate >= today).length
  const occupiedNow     = roomBookings.filter((b) => b.checkIn <= today && b.checkOut > today).length

  const upcomingReminders = buildUpcomingReminders(roomBookings)

  const locationCounts = useMemo(() => {
    const rooms  = bookings.filter((b) => b.type === 'room')
    const unique = [...new Set(rooms.map((b) => b.location).filter(Boolean))].sort()
    return unique.map((loc) => ({
      name:  loc,
      count: rooms.filter((b) => b.location === loc).length,
    }))
  }, [bookings])

  return (
    <PullToRefresh className="overflow-y-auto pb-28 px-4 space-y-5 pt-4">

      <section aria-label="Summary statistics">
        <h2 className="section-label mb-2">Overview</h2>
        <motion.div
          className="grid grid-cols-2 gap-2.5"
          variants={listVariants}
          initial="hidden"
          animate="show"
        >
          <StatCard value={thisWeekCount}   label="This week"    />
          <StatCard value={thisMonthCount}  label="This month"   />
          <StatCard value={helicopterCount} label="Helicopter"   />
          <StatCard value={occupiedNow}     label="Occupied now" />
        </motion.div>
      </section>

      <section aria-label="Upcoming reminders">
        <h2 className="section-label mb-2">Upcoming reminders</h2>
        <div className="glass rounded-[16px] px-4">
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

      <section aria-label="Bookings by location">
        <h2 className="section-label mb-2">By location</h2>
        <div className="glass rounded-[16px] overflow-hidden divide-y divide-white/[0.06]">
          {locationCounts.map((loc) => (
            <div key={loc.name} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <MapPin size={13} className="text-lo shrink-0" strokeWidth={1.8} />
                <span className="text-[13px] text-hi">{loc.name}</span>
              </div>
              <span className="badge badge-accent tabular-nums">{loc.count}</span>
            </div>
          ))}
        </div>
      </section>

    </PullToRefresh>
  )
}
