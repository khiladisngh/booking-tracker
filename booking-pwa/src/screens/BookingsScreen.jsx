import { motion } from 'framer-motion'
import { useStore } from '../store/useStore'
import LocationTabs from '../components/LocationTabs'
import TypeFilterTabs from '../components/TypeFilterTabs'
import TodayBanner from '../components/TodayBanner'
import BookingCard from '../components/BookingCard'
import PullToRefresh from '../components/PullToRefresh'
import { groupBookings } from '../services/dateUtils'

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 360, damping: 36 } },
}

export default function BookingsScreen({ onBookingTap, typeFilter, onTypeFilterChange }) {
  const activeLocation = useStore((s) => s.activeLocation)
  const allBookings    = useStore((s) => s.bookings)

  // 1. Apply type filter
  let filtered = allBookings
  if (typeFilter === 'room') {
    filtered = filtered.filter((b) => b.type === 'room')
  } else if (typeFilter === 'helicopter') {
    filtered = filtered.filter((b) => b.type === 'helicopter')
  }

  // 2. Apply location filter — only meaningful for room bookings.
  //    When showing "all" types and a location is selected, still show
  //    helicopter bookings (they have no location) alongside filtered rooms.
  if (typeFilter !== 'helicopter' && activeLocation !== 'all') {
    filtered = filtered.filter(
      (b) => b.type === 'helicopter' || b.location === activeLocation
    )
  }

  // 3. Normalize for groupBookings: helicopter travelDate → checkIn (display only)
  const normalized = filtered.map((b) =>
    b.type === 'helicopter' ? { ...b, checkIn: b.travelDate } : b
  )

  const { arrivingToday, arrivingTomorrow, upcoming, past } = groupBookings(normalized)
  const showLocationTabs = typeFilter !== 'helicopter'

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TypeFilterTabs value={typeFilter} onChange={onTypeFilterChange} />
      {showLocationTabs && <LocationTabs />}

      <PullToRefresh className="flex-1 overflow-y-auto pb-28">
        <div className="px-4 pt-1 space-y-5">
          <TodayBanner />

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <span className="text-[13px] text-dim">No bookings to show</span>
            </div>
          ) : (
            <>
              <Section title="Arriving today"    bookings={arrivingToday}    onTap={onBookingTap} />
              <Section title="Arriving tomorrow" bookings={arrivingTomorrow} onTap={onBookingTap} />
              <Section title="Upcoming"          bookings={upcoming}         onTap={onBookingTap} />
              <Section title="Past"              bookings={past}             onTap={onBookingTap} />
            </>
          )}
        </div>
      </PullToRefresh>
    </div>
  )
}

function Section({ title, bookings, onTap }) {
  if (bookings.length === 0) return null
  return (
    <section>
      <h2 className="section-label mb-2">{title}</h2>
      <motion.div
        className="space-y-2"
        variants={listVariants}
        initial="hidden"
        animate="show"
      >
        {bookings.map((b) => (
          <motion.div key={b.id} variants={itemVariants}>
            <BookingCard booking={b} onTap={onTap} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
