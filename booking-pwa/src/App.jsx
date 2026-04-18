import { useState, useEffect, useRef } from 'react'
import { CalendarDays, CalendarRange, LayoutDashboard, Plus, CalendarPlus, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from './store/useStore'
import { scheduleNotifications, cancelAllNotifications } from './services/notifications'
import BookingsScreen from './screens/BookingsScreen'
import DashboardScreen from './screens/DashboardScreen'
import CalendarScreen from './screens/CalendarScreen'
import AddBookingScreen from './screens/AddBookingScreen'
import BookingDetailSheet from './components/BookingDetailSheet'
import { downloadICS } from './services/icsExport'

const TABS = ['bookings', 'calendar', 'dashboard']

const NAV = [
  { id: 'bookings',  label: 'Bookings',  Icon: CalendarDays    },
  { id: 'calendar',  label: 'Calendar',  Icon: CalendarRange   },
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
]

const SCREEN_TITLES = {
  bookings:  'Bookings',
  calendar:  'Calendar',
  dashboard: 'Dashboard',
}

const SPRING_TAB    = { type: 'spring', stiffness: 420, damping: 38 }
const SPRING_SCREEN = { type: 'spring', stiffness: 340, damping: 36 }
const SPRING_SHEET  = { type: 'spring', stiffness: 380, damping: 36 }

const screenVariants = {
  enter:  (dir) => ({ opacity: 0, x: dir * 80 }),
  center: { opacity: 1, x: 0 },
  exit:   (dir) => ({ opacity: 0, x: dir * -40 }),
}

export default function App() {
  const [screen,          setScreen]          = useState('bookings')
  const [direction,       setDirection]       = useState(0)
  const [showAdd,         setShowAdd]         = useState(false)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [calendarPrompt,  setCalendarPrompt]  = useState(null)

  const dragStart = useRef(null)

  const bookings = useStore((s) => s.bookings)
  const config   = useStore((s) => s.config)

  useEffect(() => {
    scheduleNotifications(bookings, config.notifications)
    return () => cancelAllNotifications()
  }, [bookings, config.notifications])

  function handleAddClose(savedBooking) {
    setShowAdd(false)
    if (savedBooking) setCalendarPrompt(savedBooking)
  }

  function navigate(newScreen) {
    const from = TABS.indexOf(screen)
    const to   = TABS.indexOf(newScreen)
    if (from === to) return
    setDirection(to > from ? 1 : -1)
    setScreen(newScreen)
  }

  function onTouchStart(e) {
    const t = e.touches[0]
    dragStart.current = { x: t.clientX, y: t.clientY }
  }

  function onTouchEnd(e) {
    if (!dragStart.current) return
    const t  = e.changedTouches[0]
    const dx = t.clientX - dragStart.current.x
    const dy = t.clientY - dragStart.current.y
    dragStart.current = null
    // Require dominant horizontal movement of at least 60px
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return
    const idx = TABS.indexOf(screen)
    if (dx < 0 && idx < TABS.length - 1) navigate(TABS[idx + 1])
    else if (dx > 0 && idx > 0)          navigate(TABS[idx - 1])
  }

  return (
    <div className="flex flex-col min-h-dvh">

      {/* ── Glass header ────────────────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 z-30 glass border-b border-white/10"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="px-5 h-[52px] flex items-center">
          <AnimatePresence mode="wait" initial={false}>
            <motion.h1
              key={screen}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="text-[17px] font-bold text-hi tracking-tight"
            >
              {SCREEN_TITLES[screen]}
            </motion.h1>
          </AnimatePresence>
        </div>
      </header>

      {/* ── Main content area ───────────────────────────────────────── */}
      <main
        className="flex-1 overflow-hidden"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 52px)' }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={screen}
            custom={direction}
            variants={screenVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={SPRING_SCREEN}
            className="flex flex-col h-full"
          >
            {screen === 'bookings'  && <BookingsScreen onBookingTap={setSelectedBooking} />}
            {screen === 'calendar'  && <CalendarScreen  onBookingTap={setSelectedBooking} />}
            {screen === 'dashboard' && <DashboardScreen />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── Bottom bar: isolated FAB left + tab pill right ──────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 flex items-center justify-between z-40 pointer-events-none"
        style={{ padding: '0 20px', paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
      >
        {/* FAB — isolated left */}
        <motion.button
          onClick={() => setShowAdd(true)}
          whileTap={{ scale: 0.88 }}
          transition={SPRING_TAB}
          className="w-14 h-14 rounded-full glass-accent flex items-center justify-center pointer-events-auto"
          aria-label="Add booking"
        >
          <Plus size={22} color="var(--ds-accent)" strokeWidth={2.5} />
        </motion.button>

        {/* Tab pill — right */}
        <nav
          className="glass rounded-[30px] px-1.5 py-1.5 flex items-center pointer-events-auto"
          style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.35)' }}
        >
          {NAV.map((tab) => (
            <NavTab
              key={tab.id}
              tab={tab}
              active={screen === tab.id}
              onPress={() => navigate(tab.id)}
            />
          ))}
        </nav>
      </div>

      {/* ── Add booking — spring-slide full screen ───────────────────── */}
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
            <AddBookingScreen onClose={handleAddClose} />
          </motion.div>
        )}
      </AnimatePresence>

      <BookingDetailSheet
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
      />

      {/* ── Calendar prompt — appears after saving a booking ─────────── */}
      <AnimatePresence>
        {calendarPrompt && (
          <motion.div
            key="cal-prompt"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={SPRING_SHEET}
            className="fixed left-4 right-4 z-[55] glass-heavy rounded-[20px] p-4"
            style={{ bottom: 'calc(max(env(safe-area-inset-bottom), 16px) + 80px)' }}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-hi leading-snug">
                  Add to Calendar?
                </p>
                <p className="text-[12px] text-lo mt-0.5 truncate">
                  {calendarPrompt.guestName} · {calendarPrompt.location} · Room {calendarPrompt.room}
                </p>
              </div>
              <button
                onClick={() => setCalendarPrompt(null)}
                className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full"
                style={{ background: 'var(--ds-overlay)' }}
                aria-label="Dismiss"
              >
                <X size={14} className="text-lo" />
              </button>
            </div>
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                transition={SPRING_TAB}
                onClick={() => { downloadICS([calendarPrompt]); setCalendarPrompt(null) }}
                className="flex-1 flex items-center justify-center gap-2 rounded-[12px] py-2.5 bg-accent"
              >
                <CalendarPlus size={15} color="white" strokeWidth={2} />
                <span className="text-[13px] font-semibold text-white">Add to Calendar</span>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                transition={SPRING_TAB}
                onClick={() => setCalendarPrompt(null)}
                className="px-4 rounded-[12px] py-2.5 text-[13px] font-medium text-lo"
                style={{ background: 'var(--ds-surface)' }}
              >
                Skip
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function NavTab({ tab, active, onPress }) {
  const { Icon } = tab
  return (
    <button
      onClick={onPress}
      className="relative flex flex-col items-center justify-center gap-0.5 px-3.5 py-2 rounded-[22px] min-w-[62px]"
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
        size={19}
        strokeWidth={active ? 2.2 : 1.7}
        className={`relative z-10 transition-colors duration-150 ${active ? 'text-accent' : 'text-dim'}`}
      />
      <span className={`relative z-10 text-[9.5px] font-medium transition-colors duration-150 ${active ? 'text-accent' : 'text-dim'}`}>
        {tab.label}
      </span>
    </button>
  )
}
