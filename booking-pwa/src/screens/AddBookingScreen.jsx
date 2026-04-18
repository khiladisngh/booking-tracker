import { useState, useMemo, useCallback } from 'react'
import { addDays, format, parseISO, differenceInDays } from 'date-fns'
import { Mic } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useVoiceInput } from '../services/voiceInput'
import { parseBookingCommand } from '../services/nlpParser'
import RemarksEditor from '../components/RemarksEditor'
import FlagsEditor from '../components/FlagsEditor'

const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd')

function computeCheckOut(checkIn, nights) {
  if (!checkIn || !nights || Number(nights) < 1) return ''
  try {
    return format(addDays(parseISO(checkIn), Number(nights)), 'yyyy-MM-dd')
  } catch {
    return ''
  }
}

// ─── Voice overlay ────────────────────────────────────────────────────────────

function VoiceOverlay({ isListening, interimText, onStop }) {
  if (!isListening) return null
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-canvas/95 backdrop-blur-sm px-6">
      <div className="relative flex items-center justify-center mb-6">
        <span className="absolute w-24 h-24 rounded-full bg-accent/10 animate-ping" />
        <span className="absolute w-16 h-16 rounded-full bg-accent/15 animate-ping [animation-delay:150ms]" />
        <button
          type="button"
          onClick={onStop}
          className="relative z-10 w-20 h-20 rounded-full bg-accent flex items-center justify-center shadow-xl shadow-accent/25 active:scale-95 transition-transform"
          aria-label="Stop recording"
        >
          <Mic size={26} color="white" strokeWidth={1.8} />
        </button>
      </div>
      <p className="text-[15px] font-medium text-hi mb-2">Listening…</p>
      {interimText ? (
        <p className="text-[13px] text-lo text-center italic leading-relaxed max-w-xs">
          "{interimText}"
        </p>
      ) : (
        <p className="text-[13px] text-dim text-center max-w-xs leading-relaxed">
          Try: "Shimla, Room 101, Rajesh Kumar, 3 nights, helicopter"
        </p>
      )}
      <button
        type="button"
        onClick={onStop}
        className="mt-8 px-6 py-2 rounded-full border border-line text-lo text-[13px] active:bg-raised transition-colors"
      >
        Cancel
      </button>
    </div>
  )
}

// ─── Voice result toast ───────────────────────────────────────────────────────

function ParsedToast({ parsed, onDismiss }) {
  if (!parsed) return null

  const parts = []
  if (parsed.location) parts.push(parsed.location)
  if (parsed.room) parts.push(`Room ${parsed.room}`)
  if (parsed.guestName) parts.push(parsed.guestName)
  if (parsed.nights) parts.push(`${parsed.nights}n`)
  if (parsed.helicopter) parts.push('Helicopter')
  if (parsed.assistance) parts.push('Assistance')

  if (parts.length === 0) return null

  return (
    <div className="bg-raised border border-accent/30 rounded-[12px] px-4 py-3 flex items-start gap-3">
      <span className="text-accent-hi text-[13px] shrink-0 mt-0.5">✓</span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-hi">
          Filled {parts.length} field{parts.length > 1 ? 's' : ''}
        </p>
        <p className="text-[12px] text-lo mt-0.5 truncate">{parts.join(' · ')}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="text-dim text-lg leading-none shrink-0 active:text-lo touch-target flex items-center justify-center w-8 h-8"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function AddBookingScreen({ onClose, initialValues }) {
  const config = useStore((s) => s.config)
  const bookings = useStore((s) => s.bookings)
  const addBooking = useStore((s) => s.addBooking)

  const initCheckIn = initialValues?.checkIn ?? tomorrow
  const initNights = initialValues?.nights ?? 1

  const [location, setLocation] = useState(
    initialValues?.location ?? initialValues?.locationId ?? ''
  )
  const [room, setRoom] = useState(initialValues?.room ?? '')
  const [guestName, setGuestName] = useState(initialValues?.guestName ?? '')
  const [checkIn, setCheckIn] = useState(initCheckIn)
  const [nights, setNights] = useState(String(initNights))
  const [checkOut, setCheckOut] = useState(
    initialValues?.checkOut ?? computeCheckOut(initCheckIn, initNights)
  )
  const [helicopter, setHelicopter] = useState(initialValues?.helicopter ?? false)
  const [assistance, setAssistance] = useState(initialValues?.assistance ?? false)
  const [customFlags, setCustomFlags] = useState(initialValues?.customFlags ?? [])
  const [remarks, setRemarks] = useState(() => {
    const r = initialValues?.remarks
    if (Array.isArray(r)) return r
    return r ? [r] : []
  })
  const [errors, setErrors] = useState({})
  const [parsedResult, setParsedResult] = useState(null)

  // Datalist suggestions from existing bookings
  const locationSuggestions = useMemo(
    () => [...new Set(bookings.map((b) => b.location).filter(Boolean))].sort(),
    [bookings]
  )
  const roomSuggestions = useMemo(() => {
    if (!location) return []
    const norm = location.trim().toLowerCase()
    return [
      ...new Set(
        bookings
          .filter((b) => b.location.toLowerCase() === norm)
          .map((b) => b.room)
          .filter(Boolean)
      ),
    ].sort()
  }, [bookings, location])

  // ── Tripartite date binding ────────────────────────────────────────────────

  function handleCheckInChange(val) {
    setCheckIn(val)
    if (errors.checkIn) setErrors((p) => ({ ...p, checkIn: '' }))
    const co = computeCheckOut(val, nights)
    if (co) setCheckOut(co)
  }

  function handleNightsChange(val) {
    setNights(val)
    if (errors.nights) setErrors((p) => ({ ...p, nights: '' }))
    const co = computeCheckOut(checkIn, val)
    if (co) setCheckOut(co)
  }

  function handleCheckOutChange(val) {
    setCheckOut(val)
    if (checkIn && val) {
      try {
        const n = differenceInDays(parseISO(val), parseISO(checkIn))
        if (n >= 1) {
          setNights(String(n))
          if (errors.nights) setErrors((p) => ({ ...p, nights: '' }))
        }
      } catch {}
    }
  }

  // ── Voice input ────────────────────────────────────────────────────────────

  const handleVoiceResult = useCallback(
    (text) => {
      const parsed = parseBookingCommand(text, config, locationSuggestions)
      let filled = 0

      // Location: prefer config match (has room list), fall back to dynamic name
      if (parsed.locationName) {
        setLocation(parsed.locationName)
        filled++
      }
      if (parsed.room) { setRoom(parsed.room); filled++ }
      if (parsed.guestName !== undefined) { setGuestName(parsed.guestName); filled++ }
      if (parsed.checkIn !== undefined) {
        const ci = parsed.checkIn
        setCheckIn(ci)
        const n = parsed.nights ?? Number(nights)
        const co = computeCheckOut(ci, n)
        if (co) setCheckOut(co)
        filled++
      }
      if (parsed.nights !== undefined) {
        const n = Number(parsed.nights)
        setNights(String(n))
        const ci = parsed.checkIn ?? checkIn
        const co = computeCheckOut(ci, n)
        if (co) setCheckOut(co)
        filled++
      }
      if (parsed.helicopter !== undefined) { setHelicopter(parsed.helicopter); filled++ }
      if (parsed.assistance !== undefined) { setAssistance(parsed.assistance); filled++ }

      if (filled > 0) {
        setParsedResult({ ...parsed, location: parsed.locationName })
        setTimeout(() => setParsedResult(null), 5000)
      }
    },
    [config, locationSuggestions, checkIn, nights]
  )

  const { isListening, interimText, isSupported, start, stop } = useVoiceInput({
    onResult: handleVoiceResult,
  })

  // ── Flags ──────────────────────────────────────────────────────────────────

  function handleFlagsChange({ helicopter: h, assistance: a, customFlags: cf }) {
    setHelicopter(h)
    setAssistance(a)
    setCustomFlags(cf)
  }

  // ── Validate & save ────────────────────────────────────────────────────────

  function validate() {
    const next = {}
    if (!location.trim()) next.location = 'Enter a location'
    if (!room.trim()) next.room = 'Enter a room'
    if (!guestName.trim()) next.guestName = 'Guest name is required'
    if (!checkIn) next.checkIn = 'Check-in date is required'
    if (!nights || Number(nights) < 1) next.nights = 'At least 1 night'
    return next
  }

  function handleSave() {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    const now = new Date().toISOString()
    addBooking({
      id: crypto.randomUUID(),
      location: location.trim(),
      room: room.trim(),
      guestName: guestName.trim(),
      checkIn,
      nights: Number(nights),
      checkOut: checkOut || computeCheckOut(checkIn, nights) || '',
      helicopter,
      assistance,
      customFlags,
      remarks,
      createdAt: now,
      updatedAt: now,
    })
    onClose()
  }

  return (
    <>
      <VoiceOverlay isListening={isListening} interimText={interimText} onStop={stop} />

      <div className="flex flex-col h-full bg-canvas">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 pt-4 pb-3 shrink-0 border-b border-line">
          <button
            type="button"
            onClick={onClose}
            className="touch-target flex items-center justify-center text-lo w-10 h-10 rounded-[10px] active:bg-raised transition-colors"
            aria-label="Go back"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="text-[15px] font-semibold text-hi flex-1">Add Booking</h1>
          {isSupported && (
            <button
              type="button"
              onClick={start}
              className="touch-target flex items-center justify-center w-10 h-10 rounded-[10px] bg-raised active:bg-overlay text-accent transition-colors"
              aria-label="Fill by voice"
            >
              <Mic size={18} strokeWidth={1.8} />
            </button>
          )}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4 pb-32 pt-4 space-y-4">
          {parsedResult && (
            <ParsedToast parsed={parsedResult} onDismiss={() => setParsedResult(null)} />
          )}

          {/* Location + Room */}
          <div className="bg-surface rounded-[14px] border border-line p-4 space-y-4">
            <div>
              <label className="block text-[12px] text-lo mb-1.5">Location</label>
              <input
                type="text"
                list="locations-list"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value)
                  if (errors.location) setErrors((p) => ({ ...p, location: '' }))
                }}
                placeholder="e.g. Shimla, Manali"
                className={`field${errors.location ? ' field-error' : ''}`}
                autoComplete="off"
              />
              <datalist id="locations-list">
                {locationSuggestions.map((s) => <option key={s} value={s} />)}
              </datalist>
              {errors.location && (
                <p className="text-[12px] mt-1" style={{ color: 'var(--ds-red)' }}>{errors.location}</p>
              )}
            </div>

            <div>
              <label className="block text-[12px] text-lo mb-1.5">Room</label>
              <input
                type="text"
                list="rooms-list"
                value={room}
                onChange={(e) => {
                  setRoom(e.target.value)
                  if (errors.room) setErrors((p) => ({ ...p, room: '' }))
                }}
                placeholder="e.g. 101, A1, Suite 3"
                className={`field${errors.room ? ' field-error' : ''}`}
                autoComplete="off"
              />
              <datalist id="rooms-list">
                {roomSuggestions.map((s) => <option key={s} value={s} />)}
              </datalist>
              {errors.room && (
                <p className="text-[12px] mt-1" style={{ color: 'var(--ds-red)' }}>{errors.room}</p>
              )}
            </div>
          </div>

          {/* Guest + Dates */}
          <div className="bg-surface rounded-[14px] border border-line p-4 space-y-4">
            <div>
              <label className="block text-[12px] text-lo mb-1.5">Guest name</label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => {
                  setGuestName(e.target.value)
                  if (errors.guestName) setErrors((p) => ({ ...p, guestName: '' }))
                }}
                placeholder="Guest name"
                className={`field${errors.guestName ? ' field-error' : ''}`}
              />
              {errors.guestName && (
                <p className="text-[12px] mt-1" style={{ color: 'var(--ds-red)' }}>{errors.guestName}</p>
              )}
            </div>

            {/* Tripartite date group */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] text-lo mb-1.5">Check in</label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => handleCheckInChange(e.target.value)}
                  className={`field${errors.checkIn ? ' field-error' : ''}`}
                />
                {errors.checkIn && (
                  <p className="text-[12px] mt-1" style={{ color: 'var(--ds-red)' }}>{errors.checkIn}</p>
                )}
              </div>
              <div>
                <label className="block text-[12px] text-lo mb-1.5">Check out</label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => handleCheckOutChange(e.target.value)}
                  className="field"
                />
              </div>
            </div>

            <div className="w-1/2 pr-1.5">
              <label className="block text-[12px] text-lo mb-1.5">Nights</label>
              <input
                type="number"
                min={1}
                value={nights}
                onChange={(e) => handleNightsChange(e.target.value)}
                className={`field${errors.nights ? ' field-error' : ''}`}
              />
              {errors.nights && (
                <p className="text-[12px] mt-1" style={{ color: 'var(--ds-red)' }}>{errors.nights}</p>
              )}
            </div>
          </div>

          {/* Flags */}
          <div className="bg-surface rounded-[14px] border border-line p-4">
            <FlagsEditor
              helicopter={helicopter}
              assistance={assistance}
              customFlags={customFlags}
              onChange={handleFlagsChange}
            />
          </div>

          {/* Remarks */}
          <div className="bg-surface rounded-[14px] border border-line p-4">
            <RemarksEditor remarks={remarks} onChange={setRemarks} />
          </div>

          {isSupported && (
            <p className="text-center text-[11px] text-dim pb-2">
              Tap the mic to fill by voice
            </p>
          )}
        </div>

        {/* Save button */}
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-8 pt-3 bg-canvas border-t border-line shrink-0">
          <button type="button" onClick={handleSave} className="btn-primary">
            Save Booking
          </button>
        </div>
      </div>
    </>
  )
}

