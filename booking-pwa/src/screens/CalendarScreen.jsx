import { useState, useMemo } from 'react'
import {
  format, parseISO,
  startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, addMonths, subMonths,
} from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useStore } from '../store/useStore'
import BookingCard from '../components/BookingCard'

const SPRING = { type: 'spring', stiffness: 400, damping: 38 }

const LOC_PALETTE = [
  'var(--ds-accent)',
  'var(--ds-green)',
  'var(--ds-amber)',
  'var(--ds-violet)',
  'var(--ds-red)',
  'var(--ds-sky)',
]

export default function CalendarScreen({ onBookingTap }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay]   = useState(null)
  const bookings = useStore((s) => s.bookings)

  const locColors = useMemo(() => {
    const locs = [...new Set(bookings.map((b) => b.location).filter(Boolean))].sort()
    return Object.fromEntries(locs.map((l, i) => [l, LOC_PALETTE[i % LOC_PALETTE.length]]))
  }, [bookings])

  const monthStart = useMemo(() => startOfMonth(currentMonth), [currentMonth])
  const monthEnd   = useMemo(() => endOfMonth(currentMonth),   [currentMonth])
  const days       = useMemo(() => eachDayOfInterval({ start: monthStart, end: monthEnd }), [monthStart, monthEnd])

  // Mon-based leading empty cells (Sun=0 → shift so Mon=0)
  const leadingEmpty = (getDay(monthStart) + 6) % 7

  // Map yyyy-MM-dd → bookings active on that day (checkIn ≤ day < checkOut)
  const dayMap = useMemo(() => {
    const map = {}
    for (const b of bookings) {
      const bStart  = parseISO(b.checkIn)
      const bEnd    = parseISO(b.checkOut) // exclusive

      const spanStart = bStart < monthStart ? monthStart : bStart
      const lastDay   = new Date(bEnd.getTime() - 86_400_000)
      const spanEnd   = lastDay > monthEnd ? monthEnd : lastDay

      if (spanStart > spanEnd) continue

      for (const day of eachDayOfInterval({ start: spanStart, end: spanEnd })) {
        const k = format(day, 'yyyy-MM-dd')
        ;(map[k] ??= []).push(b)
      }
    }
    return map
  }, [bookings, monthStart, monthEnd])

  const todayStr    = format(new Date(), 'yyyy-MM-dd')
  const selectedKey = selectedDay ? format(selectedDay, 'yyyy-MM-dd') : null
  const selectedBookings = selectedKey ? (dayMap[selectedKey] ?? []) : []

  function prevMonth() { setCurrentMonth((m) => subMonths(m, 1)); setSelectedDay(null) }
  function nextMonth() { setCurrentMonth((m) => addMonths(m, 1)); setSelectedDay(null) }

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Month navigator ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3 shrink-0">
        <motion.button
          whileTap={{ scale: 0.82 }} transition={SPRING} onClick={prevMonth}
          className="w-9 h-9 flex items-center justify-center rounded-full"
          aria-label="Previous month"
        >
          <ChevronLeft size={20} className="text-lo" />
        </motion.button>

        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={format(currentMonth, 'yyyy-MM')}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={SPRING}
            className="text-[16px] font-semibold text-hi"
          >
            {format(currentMonth, 'MMMM yyyy')}
          </motion.span>
        </AnimatePresence>

        <motion.button
          whileTap={{ scale: 0.82 }} transition={SPRING} onClick={nextMonth}
          className="w-9 h-9 flex items-center justify-center rounded-full"
          aria-label="Next month"
        >
          <ChevronRight size={20} className="text-lo" />
        </motion.button>
      </div>

      {/* ── Day-of-week headers ─────────────────────────────────────── */}
      <div className="grid grid-cols-7 px-3 shrink-0">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <div key={i} className="text-center text-[11px] font-semibold text-dim py-1">
            {d}
          </div>
        ))}
      </div>

      {/* ── Calendar grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-7 gap-y-1 px-3 shrink-0">
        {Array.from({ length: leadingEmpty }).map((_, i) => <div key={`e${i}`} />)}

        {days.map((day) => {
          const k          = format(day, 'yyyy-MM-dd')
          const dayBkgs    = dayMap[k] ?? []
          const isToday    = k === todayStr
          const isSelected = k === selectedKey
          const locs       = [...new Set(dayBkgs.map((b) => b.location))].slice(0, 4)

          return (
            <motion.button
              key={k}
              whileTap={{ scale: 0.82 }}
              transition={SPRING}
              onClick={() => setSelectedDay(isSelected ? null : day)}
              className="flex flex-col items-center py-1 rounded-[10px]"
              style={{ background: isSelected ? 'var(--ds-surface)' : 'transparent' }}
            >
              <span
                className="text-[14px] w-7 h-7 flex items-center justify-center rounded-full leading-none"
                style={{
                  background:  isToday    ? 'var(--ds-accent)' : 'transparent',
                  color:       isToday    ? '#fff'
                             : isSelected ? 'var(--ds-accent)'
                             : 'var(--ds-text-hi)',
                  fontWeight:  isSelected || isToday ? '700' : '500',
                }}
              >
                {format(day, 'd')}
              </span>
              <div className="flex gap-[2px] h-[5px] items-center mt-0.5">
                {locs.map((loc) => (
                  <span
                    key={loc}
                    className="w-[4px] h-[4px] rounded-full shrink-0"
                    style={{ backgroundColor: locColors[loc] ?? 'var(--ds-accent)' }}
                  />
                ))}
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* ── Location legend ─────────────────────────────────────────── */}
      {Object.keys(locColors).length > 0 && (
        <div className="px-5 pt-3 pb-1 flex flex-wrap gap-x-4 gap-y-1 shrink-0">
          {Object.entries(locColors).map(([loc, color]) => (
            <div key={loc} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span className="text-[11px] text-lo">{loc}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Selected day bookings / hint ────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 pb-28">
        <AnimatePresence mode="wait">
          {selectedDay ? (
            <motion.div
              key={selectedKey}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={SPRING}
            >
              <h3 className="section-label mb-3 mt-4">
                {format(selectedDay, 'EEEE, d MMMM')}
              </h3>
              {selectedBookings.length === 0 ? (
                <p className="text-[13px] text-dim text-center py-8">No bookings this day</p>
              ) : (
                <div className="space-y-2">
                  {selectedBookings.map((b) => (
                    <BookingCard key={b.id} booking={b} onTap={onBookingTap} />
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-[13px] text-dim text-center py-8"
            >
              Tap a day to see bookings
            </motion.p>
          )}
        </AnimatePresence>
      </div>

    </div>
  )
}
