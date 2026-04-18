import { useState, useEffect } from 'react'
import { useStore } from './store/useStore'
import { scheduleNotifications, cancelAllNotifications } from './services/notifications'
import BookingsScreen from './screens/BookingsScreen'
import DashboardScreen from './screens/DashboardScreen'
import AddBookingScreen from './screens/AddBookingScreen'
import BookingDetailSheet from './components/BookingDetailSheet'

const NAV = [
  { id: 'bookings', label: 'Bookings', icon: BookingsIcon },
  { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
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
      {/* Header */}
      <header className="px-4 py-3 border-b border-line flex items-center justify-between">
        <h1 className="text-[15px] font-semibold text-hi tracking-tight">
          {screen === 'bookings' ? 'Bookings' : 'Dashboard'}
        </h1>
      </header>

      {/* Screen */}
      <main className="flex flex-col flex-1 overflow-hidden">
        {screen === 'bookings' && (
          <BookingsScreen onBookingTap={setSelectedBooking} />
        )}
        {screen === 'dashboard' && <DashboardScreen />}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-canvas/95 backdrop-blur-xl border-t border-line pb-safe">
        <div className="flex items-center h-14">
          <NavTab tab={NAV[0]} active={screen === 'bookings'} onPress={() => setScreen('bookings')} />

          {/* FAB */}
          <div className="flex-1 flex justify-center">
            <button
              onClick={() => setShowAdd(true)}
              className="touch-target w-12 h-12 -mt-4 flex items-center justify-center rounded-full bg-accent shadow-lg shadow-accent/30 active:scale-95 transition-transform duration-[120ms]"
              aria-label="Add booking"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.2} strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
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
  const Icon = tab.icon
  return (
    <button
      onClick={onPress}
      className={[
        'touch-target flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors duration-[120ms]',
        active ? 'text-accent-hi' : 'text-dim',
      ].join(' ')}
      aria-label={tab.label}
    >
      <Icon active={active} />
      <span className="text-[10px] font-medium">{tab.label}</span>
    </button>
  )
}

function BookingsIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function DashboardIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}
