import { useState, useEffect } from 'react'
import { CalendarDays, LayoutDashboard, Plus } from 'lucide-react'
import { useStore } from './store/useStore'
import { scheduleNotifications, cancelAllNotifications } from './services/notifications'
import BookingsScreen from './screens/BookingsScreen'
import DashboardScreen from './screens/DashboardScreen'
import AddBookingScreen from './screens/AddBookingScreen'
import BookingDetailSheet from './components/BookingDetailSheet'

const NAV = [
  { id: 'bookings', label: 'Bookings', Icon: CalendarDays },
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
]

export default function App() {
  const [screen, setScreen] = useState('bookings')
  const [showAdd, setShowAdd] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState(null)

  const bookings = useStore((s) => s.bookings)
  const config = useStore((s) => s.config)

  useEffect(() => {
    scheduleNotifications(bookings, config.notifications)
    return () => cancelAllNotifications()
  }, [bookings, config.notifications])

  if (showAdd) {
    return (
      <div className="flex flex-col min-h-dvh bg-canvas pt-safe">
        <AddBookingScreen onClose={() => setShowAdd(false)} />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-dvh bg-canvas pt-safe">
      <header className="px-4 py-3 border-b border-line flex items-center justify-between">
        <h1 className="text-[15px] font-semibold text-hi tracking-tight">
          {screen === 'bookings' ? 'Bookings' : 'Dashboard'}
        </h1>
      </header>

      <main className="flex flex-col flex-1 overflow-hidden">
        {screen === 'bookings' && (
          <BookingsScreen onBookingTap={setSelectedBooking} />
        )}
        {screen === 'dashboard' && <DashboardScreen />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-canvas/95 backdrop-blur-xl border-t border-line pb-safe">
        <div className="flex items-center h-14">
          <NavTab tab={NAV[0]} active={screen === 'bookings'} onPress={() => setScreen('bookings')} />

          <div className="flex-1 flex justify-center">
            <button
              onClick={() => setShowAdd(true)}
              className="touch-target w-12 h-12 -mt-4 flex items-center justify-center rounded-full bg-accent shadow-lg shadow-accent/30 active:scale-95 transition-transform duration-[120ms]"
              aria-label="Add booking"
            >
              <Plus size={20} color="white" strokeWidth={2.5} />
            </button>
          </div>

          <NavTab tab={NAV[1]} active={screen === 'dashboard'} onPress={() => setScreen('dashboard')} />
        </div>
      </nav>

      <BookingDetailSheet
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
      />
    </div>
  )
}

function NavTab({ tab, active, onPress }) {
  const { Icon } = tab
  return (
    <button
      onClick={onPress}
      className={[
        'touch-target flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors duration-[120ms]',
        active ? 'text-accent' : 'text-dim',
      ].join(' ')}
      aria-label={tab.label}
    >
      <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
      <span className="text-[10px] font-medium">{tab.label}</span>
    </button>
  )
}
