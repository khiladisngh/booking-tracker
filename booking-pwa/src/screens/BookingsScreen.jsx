import { useStore } from '../store/useStore'
import LocationTabs from '../components/LocationTabs'
import TodayBanner from '../components/TodayBanner'
import BookingCard from '../components/BookingCard'
import { groupBookings } from '../services/dateUtils'

export default function BookingsScreen({ onBookingTap }) {
  const activeLocation = useStore((s) => s.activeLocation)
  const getBookingsByLocation = useStore((s) => s.getBookingsByLocation)

  const bookings = getBookingsByLocation(activeLocation)
  const { arrivingToday, arrivingTomorrow, upcoming, past } = groupBookings(bookings)

  const isEmpty = bookings.length === 0

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <LocationTabs />

      <div className="flex-1 overflow-y-auto pb-28">
        <div className="px-4 pt-1 space-y-5">
          <TodayBanner />

          {isEmpty ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <span className="text-[13px] text-dim">No bookings for this location</span>
            </div>
          ) : (
            <>
              <Section title="Arriving today" bookings={arrivingToday} onTap={onBookingTap} />
              <Section title="Arriving tomorrow" bookings={arrivingTomorrow} onTap={onBookingTap} />
              <Section title="Upcoming" bookings={upcoming} onTap={onBookingTap} />
              <Section title="Past" bookings={past} onTap={onBookingTap} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Section({ title, bookings, onTap }) {
  if (bookings.length === 0) return null
  return (
    <section>
      <h2 className="section-label mb-2">{title}</h2>
      <div className="space-y-2">
        {bookings.map((b) => (
          <BookingCard key={b.id} booking={b} onTap={onTap} />
        ))}
      </div>
    </section>
  )
}
