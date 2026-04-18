import { useState, useEffect } from 'react'
import { CalendarDays, LayoutDashboard, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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

const SPRING_TAB    = { type: 'spring', stiffness: 420, damping: 38 }
const SPRING_SCREEN = { type: 'spring', stiffness: 340, damping: 36 }
const SPRING_SHEET  = { type: 'spring', stiffness: 380, damping: 36 }

export default function App() {
  const [screen, setScreen] = useState('bookings')
  const [showAdd, setShowAdd] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState(null)

  const bookings = useStore((s) => s.bookings)
  const config   = useStore((s) => s.config)

  useEffect(() => {
    scheduleNotifications(bookings, config.notifications)
    return () => cancelAllNotifications()
  }, [bookings, config.notifications])

  return (
    <div className="flex flex-col min-h-dvh">
      {/* ── Glass header ──────────────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 z-30 glass border-b border-white/10"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="px-5 h-[52px] flex items-center">
          <h1 className="text-[17px] font-bold text-hi tracking-tight">
            {screen === 'bookings' ? 'Bookings' : 'Dashboard'}
          </h1>
        </div>
      </header>

      {/* ── Main content area ─────────────────────────────────────── */}
      <main
        className="flex-1 overflow-hidden"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 52px)' }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={screen}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={SPRING_SCREEN}
            className="flex flex-col h-full"
          >
            {screen === 'bookings'
              ? <BookingsScreen onBookingTap={setSelectedBooking} />
              : <DashboardScreen />
            }
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── Floating glass pill nav ───────────────────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 flex justify-center z-40 pointer-events-none"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
      >
        <nav className="glass rounded-[30px] px-2 py-2 flex items-center gap-0.5 pointer-events-auto shadow-2xl shadow-black/30">
          <NavTab tab={NAV[0]} active={screen === 'bookings'} onPress={() => setScreen('bookings')} />

          <motion.button
            onClick={() => setShowAdd(true)}
            whileTap={{ scale: 0.88 }}
            transition={SPRING_TAB}
            className="mx-2 w-11 h-11 rounded-full bg-accent flex items-center justify-center shadow-lg shadow-accent/40"
            aria-label="Add booking"
          >
            <Plus size={19} color="white" strokeWidth={2.5} />
          </motion.button>

          <NavTab tab={NAV[1]} active={screen === 'dashboard'} onPress={() => setScreen('dashboard')} />
        </nav>
      </div>

      {/* ── Add booking — spring-slide full screen ────────────────── */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            key="add-screen"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={SPRING_SHEET}
            className="fixed inset-0 z-50 flex flex-col"
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
          >
            <AddBookingScreen onClose={() => setShowAdd(false)} />
          </motion.div>
        )}
      </AnimatePresence>

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
      className="relative flex flex-col items-center justify-center gap-0.5 px-4 py-2 rounded-[22px] min-w-[68px]"
      aria-label={tab.label}
    >
      {active && (
        <motion.div
          layoutId="tab-indicator"
          className="absolute inset-0 rounded-[22px]"
          style={{ background: 'rgba(255,255,255,0.11)' }}
          transition={SPRING_TAB}
        />
      )}
      <Icon
        size={20}
        strokeWidth={active ? 2.2 : 1.7}
        className={`relative z-10 transition-colors duration-150 ${active ? 'text-accent' : 'text-dim'}`}
      />
      <span className={`relative z-10 text-[10px] font-medium transition-colors duration-150 ${active ? 'text-accent' : 'text-dim'}`}>
        {tab.label}
      </span>
    </button>
  )
}
