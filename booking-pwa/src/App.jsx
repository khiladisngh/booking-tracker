import { useState, useEffect, useRef } from 'react'
import { CalendarDays, CalendarRange, LayoutDashboard, Plus, CalendarPlus, X, Plane, BedDouble } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore, SEED_BOOKINGS } from './store/useStore'
import { subscribeToBookings, seedIfEmpty } from './services/firestoreSync'
import { scheduleNotifications, cancelAllNotifications } from './services/notifications'
import SyncStatus from './components/SyncStatus'
import BookingsScreen from './screens/BookingsScreen'
import DashboardScreen from './screens/DashboardScreen'
import CalendarScreen from './screens/CalendarScreen'
import AddBookingScreen from './screens/AddBookingScreen'
import AddHelicopterScreen from './screens/AddHelicopterScreen'
import BookingDetailSheet from './components/BookingDetailSheet'
import PasscodeModal from './components/PasscodeModal'
import LockButton from './components/LockButton'
import { EditModeProvider, useEditModeContext } from './context/EditModeContext'
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
  return (
    <EditModeProvider>
      <AppContent />
    </EditModeProvider>
  )
}

function AppContent() {
  const { isEditMode } = useEditModeContext()
  const [screen,          setScreen]          = useState('bookings')
  const [direction,       setDirection]       = useState(0)
  const [showPasscode,    setShowPasscode]    = useState(false)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [calendarPrompt,  setCalendarPrompt]  = useState(null)
  const [typeFilter,      setTypeFilter]      = useState('all')

  // null = hidden | 'menu' = type-chooser | 'room' | 'helicopter'
  const [addScreen,  setAddScreen]  = useState(null)
  const [addPrefill, setAddPrefill] = useState(null)

  const dragStart = useRef(null)
  const mainRef   = useRef(null)
  // screenRef keeps navigate() accessible in the passive touch listener without stale closure
  const screenRef = useRef(screen)
  useEffect(() => { screenRef.current = screen }, [screen])

  const bookings = useStore((s) => s.bookings)
  const config   = useStore((s) => s.config)
  const setBookings = useStore((s) => s.setBookings)

  // Firestore: seed on first load, then keep local state in sync via snapshot listener
  useEffect(() => {
    seedIfEmpty(SEED_BOOKINGS).catch(console.error)
    const unsub = subscribeToBookings(setBookings)
    return unsub
  }, [setBookings])

  useEffect(() => {
    scheduleNotifications(bookings, config.notifications)
    return () => cancelAllNotifications()
  }, [bookings, config.notifications])

  function openAdd(type, prefill = null) {
    setAddPrefill(prefill)
    setAddScreen(type)
  }

  function handleAddClose(savedBooking) {
    const type = addScreen
    setAddScreen(null)
    setAddPrefill(null)
    if (savedBooking && type === 'room') setCalendarPrompt(savedBooking)
  }

  function navigate(newScreen) {
    const from = TABS.indexOf(screen)
    const to   = TABS.indexOf(newScreen)
    if (from === to) return
    setDirection(to > from ? 1 : -1)
    setScreen(newScreen)
  }
  const navigateRef = useRef(navigate)
  useEffect(() => { navigateRef.current = navigate })

  // Native passive listeners — React synthetic touch events are non-passive and
  // force Chrome to wait for JS before scrolling, breaking scroll on the whole page.
  useEffect(() => {
    const el = mainRef.current
    if (!el) return
    function handleStart(e) {
      const t = e.touches[0]
      dragStart.current = { x: t.clientX, y: t.clientY }
    }
    function handleEnd(e) {
      if (!dragStart.current) return
      const t  = e.changedTouches[0]
      const dx = t.clientX - dragStart.current.x
      const dy = t.clientY - dragStart.current.y
      dragStart.current = null
      if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return
      const idx = TABS.indexOf(screenRef.current)
      if (dx < 0 && idx < TABS.length - 1) navigateRef.current(TABS[idx + 1])
      else if (dx > 0 && idx > 0)          navigateRef.current(TABS[idx - 1])
    }
    el.addEventListener('touchstart', handleStart, { passive: true })
    el.addEventListener('touchend',   handleEnd,   { passive: true })
    return () => {
      el.removeEventListener('touchstart', handleStart)
      el.removeEventListener('touchend',   handleEnd)
    }
  }, [])

  // Called from BookingDetailSheet when user wants to create a linked booking
  function handleAddLinked(type, prefill) {
    setSelectedBooking(null)
    setTimeout(() => openAdd(type, prefill), 300) // wait for sheet to close
  }

  // Called from BookingDetailSheet when user taps "view linked booking"
  function handleViewLinked(bookingId) {
    const linked = bookings.find((b) => b.id === bookingId)
    if (linked) setSelectedBooking(linked)
  }

  const showingAdd = addScreen === 'room' || addScreen === 'helicopter'

  return (
    <div className="flex flex-col h-dvh">

      {/* ── Glass header ────────────────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 z-30 glass border-b border-white/10"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="px-5 h-[52px] flex items-center justify-between">
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
          <SyncStatus />
        </div>
      </header>

      {/* ── Main content area ───────────────────────────────────────── */}
      <main
        ref={mainRef}
        className="flex-1 overflow-hidden"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 52px)' }}
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
            {screen === 'bookings' && (
              <BookingsScreen
                onBookingTap={setSelectedBooking}
                typeFilter={typeFilter}
                onTypeFilterChange={setTypeFilter}
              />
            )}
            {screen === 'calendar'  && <CalendarScreen  onBookingTap={setSelectedBooking} />}
            {screen === 'dashboard' && <DashboardScreen />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── Bottom bar: FAB left + tab pill right ───────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 flex items-center justify-between z-40 pointer-events-none"
        style={{ padding: '0 20px', paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
      >
        {/* FAB — only in edit mode */}
        <AnimatePresence>
          {isEditMode && (
            <motion.button
              key="fab"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={() => setAddScreen('menu')}
              whileTap={{ scale: 0.88 }}
              transition={SPRING_TAB}
              className="w-14 h-14 rounded-full glass-accent flex items-center justify-center pointer-events-auto"
              aria-label="Add booking"
            >
              <Plus size={22} color="var(--ds-accent)" strokeWidth={2.5} />
            </motion.button>
          )}
          {!isEditMode && (
            <div key="fab-placeholder" className="w-14 h-14" aria-hidden="true" />
          )}
        </AnimatePresence>

        {/* Tab pill */}
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

      {/* ── FAB type-chooser menu ────────────────────────────────────── */}
      <AnimatePresence>
        {addScreen === 'menu' && (
          <>
            <motion.div
              aria-hidden="true"
              onClick={() => setAddScreen(null)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={SPRING_SHEET}
              className="fixed bottom-0 left-0 right-0 z-50 glass-heavy rounded-t-[28px] px-5 pt-3 pb-10"
              style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}
            >
              <div className="flex justify-center mb-4">
                <span className="w-9 h-1 rounded-full bg-white/20" />
              </div>
              <p className="text-[13px] text-lo text-center mb-4">What would you like to add?</p>
              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  transition={SPRING_TAB}
                  onClick={() => openAdd('room')}
                  className="flex-1 flex flex-col items-center gap-2.5 glass rounded-[16px] py-5 active:opacity-80"
                >
                  <BedDouble size={24} className="text-accent" strokeWidth={1.8} />
                  <span className="text-[14px] font-semibold text-hi">Room Booking</span>
                  <span className="text-[11px] text-lo text-center px-2">Check-in, checkout, nights</span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  transition={SPRING_TAB}
                  onClick={() => openAdd('helicopter')}
                  className="flex-1 flex flex-col items-center gap-2.5 glass rounded-[16px] py-5 active:opacity-80"
                >
                  <Plane size={24} className="text-sky-400" strokeWidth={1.8} />
                  <span className="text-[14px] font-semibold text-hi">Helicopter</span>
                  <span className="text-[11px] text-lo text-center px-2">Route, tickets, passengers</span>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Add room booking ─────────────────────────────────────────── */}
      <AnimatePresence>
        {addScreen === 'room' && (
          <motion.div
            key="add-room"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={SPRING_SHEET}
            className="fixed inset-0 z-50 flex flex-col"
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
          >
            <AddBookingScreen onClose={handleAddClose} initialValues={addPrefill} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Add helicopter booking ───────────────────────────────────── */}
      <AnimatePresence>
        {addScreen === 'helicopter' && (
          <motion.div
            key="add-heli"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={SPRING_SHEET}
            className="fixed inset-0 z-50 flex flex-col"
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
          >
            <AddHelicopterScreen onClose={handleAddClose} initialValues={addPrefill} />
          </motion.div>
        )}
      </AnimatePresence>

      <BookingDetailSheet
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onAddLinked={handleAddLinked}
        onViewLinked={handleViewLinked}
      />

      <LockButton onOpenModal={() => setShowPasscode(true)} />
      <PasscodeModal isOpen={showPasscode} onClose={() => setShowPasscode(false)} />

      {/* ── Calendar prompt — after saving a room booking ────────────── */}
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
                <p className="text-[14px] font-semibold text-hi leading-snug">Add to Calendar?</p>
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
