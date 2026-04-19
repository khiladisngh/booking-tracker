import { useState, useMemo, useRef } from 'react'
import { format, addDays } from 'date-fns'
import { motion } from 'framer-motion'
import { useStore } from '../store/useStore'
import RemarksEditor from '../components/RemarksEditor'
import { useEditModeContext } from '../context/EditModeContext'

const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd')

// ─── Passenger list editor ────────────────────────────────────────────────────

function PassengerEditor({ passengers, onChange }) {
  const [draftName, setDraftName] = useState('')
  const inputRef = useRef(null)

  function addPassenger() {
    const name = draftName.trim()
    if (!name) return
    onChange([...passengers, { id: `pax-${Date.now()}`, name }])
    setDraftName('')
    inputRef.current?.focus()
  }

  function removePassenger(id) {
    onChange(passengers.filter((p) => p.id !== id))
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); addPassenger() }
  }

  return (
    <div>
      <label className="block text-[12px] text-lo mb-1.5">
        Passengers <span className="text-dim">(optional)</span>
      </label>
      <div className="space-y-1.5 mb-2">
        {passengers.map((p, i) => (
          <div key={p.id} className="flex items-center gap-2 px-3 py-2 glass rounded-[10px]">
            <span className="text-[12px] text-dim w-5 shrink-0 text-right">{i + 1}.</span>
            <span className="flex-1 text-[13px] text-hi">{p.name}</span>
            <button
              type="button"
              onClick={() => removePassenger(p.id)}
              className="shrink-0 text-dim text-[18px] leading-none active:text-lo w-7 h-7 flex items-center justify-center"
              aria-label={`Remove ${p.name}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Passenger name"
          className="field flex-1"
        />
        <button
          type="button"
          onClick={addPassenger}
          className="shrink-0 px-4 py-2.5 rounded-[10px] glass text-accent-hi text-[13px] font-medium active:opacity-70 transition-opacity"
        >
          Add
        </button>
      </div>
    </div>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function AddHelicopterScreen({ onClose, initialValues }) {
  const { isEditMode } = useEditModeContext()
  const bookings       = useStore((s) => s.bookings)
  const addBooking     = useStore((s) => s.addBooking)
  const linkBookings   = useStore((s) => s.linkBookings)

  const [guestName,    setGuestName]    = useState(initialValues?.guestName    ?? '')
  const [travelDate,   setTravelDate]   = useState(initialValues?.travelDate   ?? tomorrow)
  const [boardingFrom, setBoardingFrom] = useState(initialValues?.boardingFrom ?? '')
  const [landingTo,    setLandingTo]    = useState(initialValues?.landingTo    ?? '')
  const [tickets,      setTickets]      = useState(initialValues?.tickets      ?? 1)
  const [passengers,   setPassengers]   = useState(initialValues?.passengers   ?? [])
  const [remarks,      setRemarks]      = useState(() => {
    const r = initialValues?.remarks
    if (Array.isArray(r)) return r
    return r ? [r] : []
  })
  const [errors, setErrors] = useState({})

  // Suggestions sourced from existing helicopter bookings
  const boardingSuggestions = useMemo(
    () => [...new Set(bookings.filter((b) => b.type === 'helicopter').map((b) => b.boardingFrom).filter(Boolean))].sort(),
    [bookings]
  )
  const landingSuggestions = useMemo(
    () => [...new Set(bookings.filter((b) => b.type === 'helicopter').map((b) => b.landingTo).filter(Boolean))].sort(),
    [bookings]
  )
  const guestSuggestions = useMemo(
    () => [...new Set(bookings.map((b) => b.guestName).filter(Boolean))].sort(),
    [bookings]
  )

  function validate() {
    const next = {}
    if (!guestName.trim())   next.guestName   = 'Guest name is required'
    if (!travelDate)         next.travelDate  = 'Travel date is required'
    if (!boardingFrom.trim()) next.boardingFrom = 'Boarding point is required'
    if (!landingTo.trim())   next.landingTo   = 'Landing point is required'
    return next
  }

  function handleSave() {
    if (!isEditMode) return
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    const now     = new Date().toISOString()
    const booking = {
      id:          crypto.randomUUID(),
      type:        'helicopter',
      guestName:   guestName.trim(),
      travelDate,
      boardingFrom: boardingFrom.trim(),
      landingTo:    landingTo.trim(),
      tickets:      Math.max(1, Number(tickets) || 1),
      passengers,
      remarks,
      linkedRoomId: initialValues?.linkedRoomId ?? null,
      createdAt:    now,
      updatedAt:    now,
    }

    addBooking(booking)

    // If created from a room booking's link action, wire up the bidirectional link.
    if (initialValues?.linkedRoomId) {
      linkBookings(initialValues.linkedRoomId, booking.id)
    }

    onClose(booking)
  }

  return (
    <div className="flex flex-col h-full bg-[var(--ds-canvas)]">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3 shrink-0 border-b border-white/10">
        <button
          type="button"
          onClick={onClose}
          className="touch-target flex items-center justify-center text-lo w-10 h-10 rounded-[10px] active:bg-white/10 transition-colors"
          aria-label="Go back"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="text-[15px] font-semibold text-hi flex-1">Add Helicopter Booking</h1>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-4 pb-32 pt-4 space-y-4">

        {/* Guest + Date */}
        <div className="glass rounded-[16px] p-4 space-y-4">
          <div>
            <label className="block text-[12px] text-lo mb-1.5">Guest name</label>
            <input
              type="text"
              list="heli-guest-list"
              value={guestName}
              onChange={(e) => {
                setGuestName(e.target.value)
                if (errors.guestName) setErrors((p) => ({ ...p, guestName: '' }))
              }}
              placeholder="Guest name"
              className={`field${errors.guestName ? ' field-error' : ''}`}
              autoComplete="off"
            />
            <datalist id="heli-guest-list">
              {guestSuggestions.map((s) => <option key={s} value={s} />)}
            </datalist>
            {errors.guestName && (
              <p className="text-[12px] mt-1" style={{ color: 'var(--ds-red)' }}>{errors.guestName}</p>
            )}
          </div>

          <div>
            <label className="block text-[12px] text-lo mb-1.5">Travel date</label>
            <input
              type="date"
              value={travelDate}
              onChange={(e) => {
                setTravelDate(e.target.value)
                if (errors.travelDate) setErrors((p) => ({ ...p, travelDate: '' }))
              }}
              className={`field${errors.travelDate ? ' field-error' : ''}`}
            />
            {errors.travelDate && (
              <p className="text-[12px] mt-1" style={{ color: 'var(--ds-red)' }}>{errors.travelDate}</p>
            )}
          </div>
        </div>

        {/* Route */}
        <div className="glass rounded-[16px] p-4 space-y-4">
          <div>
            <label className="block text-[12px] text-lo mb-1.5">Boarding from</label>
            <input
              type="text"
              list="heli-boarding-list"
              value={boardingFrom}
              onChange={(e) => {
                setBoardingFrom(e.target.value)
                if (errors.boardingFrom) setErrors((p) => ({ ...p, boardingFrom: '' }))
              }}
              placeholder="e.g. Jubbarhatti Airport"
              className={`field${errors.boardingFrom ? ' field-error' : ''}`}
              autoComplete="off"
            />
            <datalist id="heli-boarding-list">
              {boardingSuggestions.map((s) => <option key={s} value={s} />)}
            </datalist>
            {errors.boardingFrom && (
              <p className="text-[12px] mt-1" style={{ color: 'var(--ds-red)' }}>{errors.boardingFrom}</p>
            )}
          </div>

          <div>
            <label className="block text-[12px] text-lo mb-1.5">Landing to</label>
            <input
              type="text"
              list="heli-landing-list"
              value={landingTo}
              onChange={(e) => {
                setLandingTo(e.target.value)
                if (errors.landingTo) setErrors((p) => ({ ...p, landingTo: '' }))
              }}
              placeholder="e.g. Shimla Helipad"
              className={`field${errors.landingTo ? ' field-error' : ''}`}
              autoComplete="off"
            />
            <datalist id="heli-landing-list">
              {landingSuggestions.map((s) => <option key={s} value={s} />)}
            </datalist>
            {errors.landingTo && (
              <p className="text-[12px] mt-1" style={{ color: 'var(--ds-red)' }}>{errors.landingTo}</p>
            )}
          </div>

          <div className="w-1/2 pr-1.5">
            <label className="block text-[12px] text-lo mb-1.5">Number of tickets</label>
            <input
              type="number"
              min={1}
              max={20}
              value={tickets}
              onChange={(e) => setTickets(Math.max(1, Number(e.target.value) || 1))}
              className="field"
            />
          </div>
        </div>

        {/* Passengers */}
        <div className="glass rounded-[16px] p-4">
          <PassengerEditor passengers={passengers} onChange={setPassengers} />
        </div>

        {/* Remarks */}
        <div className="glass rounded-[16px] p-4">
          <RemarksEditor remarks={remarks} onChange={setRemarks} />
        </div>
      </div>

      {/* Save button */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-8 pt-3 bg-[var(--ds-canvas)] border-t border-white/10 shrink-0">
        <motion.button
          type="button"
          onClick={handleSave}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="btn-primary"
        >
          Save Helicopter Booking
        </motion.button>
      </div>
    </div>
  )
}
