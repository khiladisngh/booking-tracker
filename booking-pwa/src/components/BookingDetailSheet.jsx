import { useState, useMemo, useEffect } from 'react'
import { addDays, format, parseISO, differenceInDays } from 'date-fns'
import { motion } from 'framer-motion'
import { useStore } from '../store/useStore'
import { formatDate } from '../services/dateUtils'
import RemarksEditor from './RemarksEditor'
import FlagsEditor from './FlagsEditor'

const SPRING = { type: 'spring', stiffness: 380, damping: 36 }

// ─── View mode ────────────────────────────────────────────────────────────────

function ViewMode({ booking, onEdit, onRequestDelete }) {
  const remarksList = Array.isArray(booking.remarks)
    ? booking.remarks.filter(Boolean)
    : booking.remarks ? [booking.remarks] : []

  const activeCustomFlags = (booking.customFlags ?? []).filter((f) => f.checked)

  return (
    <>
      <h2 className="text-[22px] font-bold text-hi leading-tight">{booking.guestName}</h2>

      <div className="flex items-center gap-2 mt-1">
        <span className="text-lo text-[13px]">{booking.location}</span>
        <span className="badge badge-accent">{booking.room}</span>
      </div>

      <div className="flex items-center gap-2 mt-4 text-[13px]">
        <span className="text-hi">{formatDate(booking.checkIn)}</span>
        <span className="text-dim">→</span>
        <span className="text-hi">{formatDate(booking.checkOut)}</span>
        <span className="ml-1 text-lo">
          · {booking.nights} {booking.nights === 1 ? 'night' : 'nights'}
        </span>
      </div>

      {(booking.helicopter || booking.assistance || activeCustomFlags.length > 0) && (
        <div className="flex gap-2 mt-4 flex-wrap">
          {booking.helicopter && <span className="tag tag-sky">Helicopter</span>}
          {booking.assistance && <span className="tag tag-violet">Assistance</span>}
          {activeCustomFlags.map((f) => (
            <span key={f.id} className="tag tag-custom">{f.label}</span>
          ))}
        </div>
      )}

      {remarksList.length > 0 && (
        <ul className="mt-4 space-y-1">
          {remarksList.map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-[13px] text-lo">
              <span className="shrink-0 mt-[3px] text-[9px]">•</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex-1" />

      <div className="flex gap-2.5 mt-6">
        <button type="button" onClick={onRequestDelete} className="btn-danger flex-1 touch-target">
          Delete
        </button>
        <button type="button" onClick={onEdit} className="btn-primary flex-1 touch-target">
          Edit
        </button>
      </div>
    </>
  )
}

// ─── Delete confirmation ──────────────────────────────────────────────────────

function DeleteConfirmation({ onConfirm, onCancel }) {
  return (
    <>
      <div className="flex-1 flex flex-col items-center justify-center gap-2 py-4 text-center">
        <p className="text-hi font-semibold text-[15px]">Delete this booking?</p>
        <p className="text-lo text-[13px]">This cannot be undone.</p>
      </div>
      <div className="flex gap-2.5 mt-6">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1 touch-target">
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 touch-target bg-urgent/90 text-white rounded-[12px] py-3 text-[14px] font-semibold active:bg-urgent transition-colors duration-[120ms]"
        >
          Confirm Delete
        </button>
      </div>
    </>
  )
}

// ─── Edit mode ────────────────────────────────────────────────────────────────

function computeCheckOut(checkIn, nights) {
  if (!checkIn || !nights || Number(nights) < 1) return ''
  try {
    return format(addDays(parseISO(checkIn), Number(nights)), 'yyyy-MM-dd')
  } catch {
    return ''
  }
}

function EditMode({ booking, onSave, onCancel }) {
  const bookings = useStore((s) => s.bookings)

  const [location, setLocation]   = useState(booking.location ?? '')
  const [room, setRoom]           = useState(booking.room)
  const [guestName, setGuestName] = useState(booking.guestName)
  const [checkIn, setCheckIn]     = useState(booking.checkIn)
  const [nights, setNights]       = useState(String(booking.nights))
  const [checkOut, setCheckOut]   = useState(booking.checkOut)
  const [helicopter, setHelicopter] = useState(booking.helicopter)
  const [assistance, setAssistance] = useState(booking.assistance)
  const [customFlags, setCustomFlags] = useState(booking.customFlags ?? [])
  const [remarks, setRemarks] = useState(() => {
    const r = booking.remarks
    if (Array.isArray(r)) return r
    return r ? [r] : []
  })

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

  function handleCheckInChange(val) {
    setCheckIn(val)
    const co = computeCheckOut(val, nights)
    if (co) setCheckOut(co)
  }

  function handleNightsChange(val) {
    setNights(val)
    const co = computeCheckOut(checkIn, val)
    if (co) setCheckOut(co)
  }

  function handleCheckOutChange(val) {
    setCheckOut(val)
    if (checkIn && val) {
      try {
        const n = differenceInDays(parseISO(val), parseISO(checkIn))
        if (n >= 1) setNights(String(n))
      } catch {}
    }
  }

  function handleFlagsChange({ helicopter: h, assistance: a, customFlags: cf }) {
    setHelicopter(h)
    setAssistance(a)
    setCustomFlags(cf)
  }

  function handleSave() {
    if (!location.trim() || !room.trim() || !guestName.trim() || !checkIn || Number(nights) < 1) return
    onSave({
      location: location.trim(),
      room: room.trim(),
      guestName: guestName.trim(),
      checkIn,
      nights: Number(nights),
      checkOut: checkOut || computeCheckOut(checkIn, nights) || booking.checkOut,
      helicopter,
      assistance,
      customFlags,
      remarks,
    })
  }

  return (
    <>
      <div className="space-y-4 overflow-y-auto flex-1 pb-2">
        <div>
          <label className="block text-[12px] text-lo mb-1.5">Location</label>
          <input
            type="text"
            list="edit-locations-list"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Shimla, Manali"
            className="field"
            autoComplete="off"
          />
          <datalist id="edit-locations-list">
            {locationSuggestions.map((s) => <option key={s} value={s} />)}
          </datalist>
        </div>

        <div>
          <label className="block text-[12px] text-lo mb-1.5">Room</label>
          <input
            type="text"
            list="edit-rooms-list"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="e.g. 101, A1"
            className="field"
            autoComplete="off"
          />
          <datalist id="edit-rooms-list">
            {roomSuggestions.map((s) => <option key={s} value={s} />)}
          </datalist>
        </div>

        <div>
          <label className="block text-[12px] text-lo mb-1.5">Guest name</label>
          <input
            type="text"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="Guest name"
            className="field"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] text-lo mb-1.5">Check in</label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => handleCheckInChange(e.target.value)}
              className="field"
            />
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
            className="field"
          />
        </div>

        <FlagsEditor
          helicopter={helicopter}
          assistance={assistance}
          customFlags={customFlags}
          onChange={handleFlagsChange}
        />

        <RemarksEditor remarks={remarks} onChange={setRemarks} />
      </div>

      <div className="flex gap-2.5 mt-6 shrink-0">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1 touch-target">
          Cancel
        </button>
        <button type="button" onClick={handleSave} className="btn-primary flex-1 touch-target">
          Save
        </button>
      </div>
    </>
  )
}

// ─── Sheet ────────────────────────────────────────────────────────────────────

export default function BookingDetailSheet({ booking, onClose }) {
  const updateBooking = useStore((s) => s.updateBooking)
  const deleteBooking = useStore((s) => s.deleteBooking)

  const [mode, setMode] = useState('view')

  useEffect(() => {
    if (booking) setMode('view')
  }, [booking?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSave(updates) {
    updateBooking(booking.id, updates)
    setMode('view')
  }

  function handleConfirmDelete() {
    deleteBooking(booking.id)
    onClose()
  }

  const isOpen = Boolean(booking)

  return (
    <>
      {/* Overlay */}
      <motion.div
        aria-hidden="true"
        onClick={isOpen ? onClose : undefined}
        animate={{ opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
      />

      {/* Sheet */}
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={booking ? `Booking for ${booking.guestName}` : 'Booking details'}
        animate={{ y: isOpen ? 0 : '100%' }}
        transition={SPRING}
        className="fixed bottom-0 left-0 right-0 z-50 glass-heavy rounded-t-[28px] max-h-[85vh] flex flex-col"
      >
        {/* Drag handle */}
        <button
          type="button"
          aria-label="Close sheet"
          onClick={onClose}
          className="flex justify-center pt-3 pb-1 w-full shrink-0 touch-target"
        >
          <span className="w-9 h-1 rounded-full bg-white/20" />
        </button>

        {/* Content */}
        <div className="flex flex-col flex-1 overflow-y-auto px-5 pb-8 pt-2 min-h-0">
          {booking && mode === 'view' && (
            <ViewMode
              booking={booking}
              onEdit={() => setMode('edit')}
              onRequestDelete={() => setMode('confirmDelete')}
            />
          )}
          {booking && mode === 'confirmDelete' && (
            <DeleteConfirmation
              onConfirm={handleConfirmDelete}
              onCancel={() => setMode('view')}
            />
          )}
          {booking && mode === 'edit' && (
            <EditMode
              booking={booking}
              onSave={handleSave}
              onCancel={() => setMode('view')}
            />
          )}
        </div>
      </motion.div>
    </>
  )
}
